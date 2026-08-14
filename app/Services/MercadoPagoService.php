<?php

namespace App\Services;

use App\Models\Bio;
use App\Repositories\BioRepository;
use App\Repositories\SubscriptionRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\PreApproval\PreApprovalClient;
use MercadoPago\MercadoPagoConfig;
use RuntimeException;
use Throwable;

/**
 * Integração com assinaturas (preapproval) do Mercado Pago.
 */
class MercadoPagoService
{
    public function __construct(
        private BioRepository $bios,
        private SubscriptionRepository $subscriptions,
    ) {}

    /**
     * Indica se o access token está configurado.
     */
    public function configured(): bool
    {
        return filled(config('services.mercadopago.access_token'));
    }

    /**
     * Checkout de teste (local ou credenciais TEST do Mercado Pago).
     */
    public function sandbox(): bool
    {
        return (bool) config('services.mercadopago.sandbox');
    }

    /**
     * Driver efetivo: simulador local ou API do Mercado Pago.
     */
    public function driver(): string
    {
        if ($this->allowsLocalSimulation()) {
            return 'local';
        }

        return 'mercadopago';
    }

    /**
     * Simulador interno: só fora de produção e sem token configurado.
     */
    public function allowsLocalSimulation(): bool
    {
        return $this->sandbox()
            && ! app()->isProduction()
            && ! $this->configured();
    }

    /**
     * Cria o checkout de assinatura Pro e grava a subscription pendente.
     *
     * @return array{init_point: string, preapproval_id: string|null, driver: string}
     */
    public function createCheckout(Bio $bio): array
    {
        if ($this->allowsLocalSimulation()) {
            return $this->createLocalCheckout($bio);
        }

        if (! $this->configured()) {
            throw new RuntimeException('Mercado Pago não está configurado.');
        }

        $this->bootSdk();

        $payerEmail = $bio->user->email;
        if ($this->sandbox() && filled(config('services.mercadopago.test_payer_email'))) {
            $payerEmail = (string) config('services.mercadopago.test_payer_email');
        }

        $payload = [
            'reason' => 'Links na Bio Pro',
            'auto_recurring' => [
                'frequency' => 1,
                'frequency_type' => 'months',
                'transaction_amount' => (float) config('linksnabio.pro_price'),
                'currency_id' => config('linksnabio.pro_currency', 'BRL'),
            ],
            'back_url' => rtrim((string) config('app.url'), '/').'/app/configuracoes',
            'payer_email' => $payerEmail,
            'external_reference' => (string) $bio->id,
            'status' => 'pending',
        ];

        try {
            $client = new PreApprovalClient;
            $preapproval = $client->create($payload);
            $initPoint = $this->checkoutUrl($preapproval);
            $id = $preapproval->id ?? null;

            if (! $initPoint) {
                throw new RuntimeException('Mercado Pago não devolveu o link de checkout.');
            }

            $this->subscriptions->upsertForBio($bio, [
                'mp_preapproval_id' => $id ? (string) $id : null,
                'status' => 'pending',
                'payload' => ['created' => $payload, 'sandbox' => $this->sandbox()],
            ]);

            return [
                'init_point' => $initPoint,
                'preapproval_id' => $id ? (string) $id : null,
                'driver' => 'mercadopago',
            ];
        } catch (Throwable $e) {
            Log::warning('Falha ao criar checkout Mercado Pago', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Checkout fictício para o sandbox local (sem chamar a API).
     *
     * @return array{init_point: string, preapproval_id: string|null, driver: string}
     */
    public function createLocalCheckout(Bio $bio): array
    {
        $id = 'sandbox-'.$bio->id;
        $this->subscriptions->upsertForBio($bio, [
            'mp_preapproval_id' => $id,
            'status' => 'pending',
            'payload' => ['driver' => 'local'],
        ]);

        return [
            'init_point' => '',
            'preapproval_id' => $id,
            'driver' => 'local',
        ];
    }

    /**
     * Atualiza assinatura e plano a partir do status (webhook ou sandbox).
     *
     * @param  array<string, mixed>  $payload
     */
    public function applyStatus(Bio $bio, string $status, array $payload = [], ?string $preapprovalId = null): void
    {
        $attributes = [
            'status' => $status,
            'payload' => $payload,
            'current_period_end' => now()->addMonth(),
        ];
        if ($preapprovalId !== null) {
            $attributes['mp_preapproval_id'] = $preapprovalId;
        }

        $this->subscriptions->upsertForBio($bio, $attributes);

        if (in_array($status, ['authorized', 'active'], true)) {
            $this->bios->update($bio, ['plan' => 'pro']);
        }

        if (in_array($status, ['cancelled', 'paused', 'rejected'], true) && $bio->plan === 'pro') {
            $this->bios->update($bio, ['plan' => 'free']);
        }
    }

    /**
     * Processa o webhook (preapproval ou payment).
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleWebhook(array $payload): void
    {
        $type = $payload['type'] ?? $payload['action'] ?? '';
        $dataId = data_get($payload, 'data.id') ?? data_get($payload, 'id');

        if (! $dataId) {
            return;
        }

        if (str_contains((string) $type, 'preapproval') || ($payload['topic'] ?? '') === 'preapproval') {
            $this->syncPreapproval((string) $dataId);

            return;
        }

        if (str_contains((string) $type, 'payment') || ($payload['topic'] ?? '') === 'payment') {
            $this->syncPayment((string) $dataId);
        }
    }

    /**
     * Sincroniza o status da assinatura e promove/rebaixa o plano.
     */
    public function syncPreapproval(string $id): void
    {
        if (! $this->configured()) {
            return;
        }

        $token = (string) config('services.mercadopago.access_token');
        $response = Http::withToken($token)
            ->acceptJson()
            ->get('https://api.mercadopago.com/preapproval/'.$id);

        if (! $response->successful()) {
            Log::warning('MP preapproval fetch failed', ['id' => $id, 'body' => $response->body()]);

            return;
        }

        $data = $response->json();
        $status = (string) ($data['status'] ?? 'pending');
        $bioId = (int) ($data['external_reference'] ?? 0);
        $bio = $bioId ? $this->bios->findById($bioId) : $this->subscriptions->findByPreapprovalId($id)?->bio;

        if (! $bio instanceof Bio) {
            return;
        }

        $this->applyStatus($bio, $status, is_array($data) ? $data : [], $id);
    }

    /**
     * Promove a bio a Pro quando um pagamento avulso é aprovado.
     */
    public function syncPayment(string $id): void
    {
        if (! $this->configured()) {
            return;
        }

        $token = (string) config('services.mercadopago.access_token');
        $response = Http::withToken($token)
            ->acceptJson()
            ->get('https://api.mercadopago.com/v1/payments/'.$id);

        if (! $response->successful()) {
            return;
        }

        $data = $response->json();
        $bioId = (int) ($data['external_reference'] ?? 0);
        $status = (string) ($data['status'] ?? '');
        $bio = $bioId ? $this->bios->findById($bioId) : null;

        if (! $bio instanceof Bio) {
            return;
        }

        if ($status === 'approved') {
            $this->applyStatus($bio, 'authorized', is_array($data) ? $data : []);
        }
    }

    /**
     * Configura o SDK (token + runtime LOCAL no sandbox).
     */
    private function bootSdk(): void
    {
        MercadoPagoConfig::setAccessToken((string) config('services.mercadopago.access_token'));

        if ($this->sandbox() && method_exists(MercadoPagoConfig::class, 'setRuntimeEnviroment')) {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
        }
    }

    /**
     * URL de checkout: sandbox_init_point no teste, init_point em produção.
     */
    private function checkoutUrl(object $preapproval): ?string
    {
        if ($this->sandbox()) {
            $sandbox = $preapproval->sandbox_init_point ?? null;
            if (is_string($sandbox) && $sandbox !== '') {
                return $sandbox;
            }
        }

        $live = $preapproval->init_point ?? null;

        return is_string($live) && $live !== '' ? $live : null;
    }
}
