<?php

namespace App\UseCases\Billing;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Services\CurrentBioService;
use App\Services\MercadoPagoService;
use Throwable;

/**
 * Inicia o checkout de assinatura Pro no Mercado Pago.
 */
final class CreateCheckout
{
    public function __construct(
        private CurrentBioService $currentBio,
        private MercadoPagoService $mercadoPago,
    ) {}

    /**
     * @return array{init_point: string, preapproval_id: string|null, driver: string}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);
        if ($bio->isPro()) {
            throw new ApplicationException('Você já está no plano Pro.', 422);
        }

        try {
            return $this->mercadoPago->createCheckout($bio);
        } catch (Throwable $e) {
            throw new ApplicationException($e->getMessage(), 422);
        }
    }
}
