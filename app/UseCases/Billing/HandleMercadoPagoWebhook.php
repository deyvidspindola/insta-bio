<?php

namespace App\UseCases\Billing;

use App\Services\MercadoPagoService;

/**
 * Processa notificações de pagamento do Mercado Pago.
 */
final class HandleMercadoPagoWebhook
{
    public function __construct(private MercadoPagoService $mercadoPago) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function execute(array $payload): void
    {
        $this->mercadoPago->handleWebhook($payload);
    }
}
