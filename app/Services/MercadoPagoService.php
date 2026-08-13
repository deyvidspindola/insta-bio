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
     * Cria o checkout de assinatura Pro e grava a subscription pendente.
     *
     * @return array{init_point: string, preapproval_id: string|null}
     */
    public function createCheckout(Bio $bio): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Mercado Pago não está configurado.');
        }

        MercadoPagoConfig::setAccessToken((string) config('services.mercadopago.access_token'));

        $payload = [
            'reason' => 'Links na Bio Pro',
            'auto_recurring' => [
                'frequency' => 1,
                'frequency_type' => 'months',
                'transaction_amount' => (float) config('linksnabio.pro_price'),
                'currency_id' => config('linksnabio.pro_currency', 'BRL'),
            ],
            'back_url' => rtrim((string) config('app.url'), '/').'/app/configuracoes',
            'payer_email' => $bio->user->email,
            'external_reference' => (string) $bio->id,
            'status' => 'pending',
        ];

        try {
            $client = new PreApprovalClient;
            $preapproval = $client->create($payload);
            $initPoint = $preapproval->init_point ?? $preapproval->sandbox_init_point ?? null;
            $id = $preapproval->id ?? null;

            if (! $initPoint) {
                throw new RuntimeException('Mercado Pago não devolveu o link de checkout.');
            }

            $this->subscriptions->upsertForBio($bio, [
                'mp_preapproval_id' => $id ? (string) $id : null,
                'status' => 'pending',
                'payload' => ['created' => $payload],
            ]);

            return [
                'init_point' => $initPoint,
                'preapproval_id' => $id ? (string) $id : null,
            ];
        } catch (Throwable $e) {
            Log::warning('Falha ao criar checkout Mercado Pago', ['error' => $e->getMessage()]);
            throw $e;
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

        $this->subscriptions->upsertForBio($bio, [
            'mp_preapproval_id' => $id,
            'status' => $status,
            'payload' => $data,
            'current_period_end' => now()->addMonth(),
        ]);

        if (in_array($status, ['authorized', 'active'], true)) {
            $this->bios->update($bio, ['plan' => 'pro']);
        }

        if (in_array($status, ['cancelled', 'paused', 'rejected'], true) && $bio->plan === 'pro') {
            $this->bios->update($bio, ['plan' => 'free']);
        }
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
            $this->bios->update($bio, ['plan' => 'pro']);
            $this->subscriptions->upsertForBio($bio, [
                'status' => 'authorized',
                'payload' => $data,
                'current_period_end' => now()->addMonth(),
            ]);
        }
    }
}
