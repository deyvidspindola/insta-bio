<?php

namespace App\Http\Controllers;

use App\UseCases\Billing\CreateCheckout;
use App\UseCases\Billing\GetBillingStatus;
use App\UseCases\Billing\HandleMercadoPagoWebhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Plano, checkout Pro e webhook do Mercado Pago.
 */
class BillingController extends Controller
{
    /**
     * Status do plano e da assinatura.
     */
    public function show(Request $request, GetBillingStatus $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Inicia o checkout Pro.
     */
    public function checkout(Request $request, CreateCheckout $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Notificações do Mercado Pago (sem CSRF).
     */
    public function webhook(Request $request, HandleMercadoPagoWebhook $useCase): JsonResponse
    {
        $useCase->execute($request->all());

        return response()->json(['ok' => true]);
    }
}
