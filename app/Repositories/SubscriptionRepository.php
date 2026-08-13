<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\Subscription;

/**
 * Persistência de assinaturas Mercado Pago.
 */
class SubscriptionRepository
{
    /**
     * Cria ou atualiza a assinatura da bio.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function upsertForBio(Bio $bio, array $attributes): Subscription
    {
        return Subscription::query()->updateOrCreate(
            ['bio_id' => $bio->id],
            $attributes
        );
    }

    /**
     * Localiza assinatura pelo id de preapproval do Mercado Pago.
     */
    public function findByPreapprovalId(string $id): ?Subscription
    {
        return Subscription::query()->where('mp_preapproval_id', $id)->first();
    }
}
