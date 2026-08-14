<?php

namespace App\UseCases\Billing;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Services\CurrentBioService;
use App\Services\MercadoPagoService;

/**
 * Aprova ou recusa o checkout Pro no sandbox local (sem Mercado Pago).
 */
final class SimulateSandboxPayment
{
    public function __construct(
        private CurrentBioService $currentBio,
        private MercadoPagoService $mercadoPago,
    ) {}

    /**
     * @return array{plan: string, status: string}
     */
    public function execute(User $user, string $action): array
    {
        if (! $this->mercadoPago->allowsLocalSimulation()) {
            throw new ApplicationException('Sandbox local indisponível neste ambiente.', 403);
        }

        if (! in_array($action, ['approve', 'reject'], true)) {
            throw new ApplicationException('Ação de sandbox inválida.', 422);
        }

        $bio = $this->currentBio->require($user);
        $status = $action === 'approve' ? 'authorized' : 'rejected';
        $this->mercadoPago->applyStatus($bio, $status, [
            'driver' => 'local',
            'action' => $action,
        ], 'sandbox-'.$bio->id);

        $bio->refresh();

        return [
            'plan' => $bio->plan,
            'status' => $status,
        ];
    }
}
