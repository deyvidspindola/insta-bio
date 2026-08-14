<?php

namespace App\UseCases\Billing;

use App\Models\User;
use App\Services\CurrentBioService;
use App\Services\MercadoPagoService;
use App\Services\PlanGate;

/**
 * Status do plano, limites e assinatura atual.
 */
final class GetBillingStatus
{
    public function __construct(
        private CurrentBioService $currentBio,
        private PlanGate $plans,
        private MercadoPagoService $mercadoPago,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);

        return [
            'plan' => $bio->plan,
            'limits' => $this->plans->limits($bio->plan),
            'price' => config('linksnabio.pro_price'),
            'currency' => config('linksnabio.pro_currency'),
            'configured' => $this->mercadoPago->configured(),
            'sandbox' => $this->mercadoPago->sandbox(),
            'driver' => $this->mercadoPago->driver(),
            'subscription' => $bio->subscription,
        ];
    }
}
