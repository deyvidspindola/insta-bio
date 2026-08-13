<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\CustomDomain;

/**
 * Persistência de domínios próprios vinculados a bios.
 */
class CustomDomainRepository
{
    /**
     * Domínio cadastrado da bio, se houver.
     */
    public function forBio(Bio $bio): ?CustomDomain
    {
        return $bio->customDomain;
    }

    /**
     * Indica se o host já pertence a outra bio.
     */
    public function existsForOtherBio(string $domain, int $bioId): bool
    {
        return CustomDomain::query()
            ->where('domain', $domain)
            ->where('bio_id', '!=', $bioId)
            ->exists();
    }

    /**
     * Cria ou substitui o domínio da bio (token novo, ainda não verificado).
     */
    public function upsert(Bio $bio, string $domain, string $token): CustomDomain
    {
        return $bio->customDomain()->updateOrCreate(
            ['bio_id' => $bio->id],
            [
                'domain' => $domain,
                'verification_token' => $token,
                'verified_at' => null,
            ]
        );
    }

    /**
     * Remove o domínio da bio.
     */
    public function deleteFor(Bio $bio): void
    {
        $bio->customDomain?->delete();
    }

    /**
     * Bio ativa cujo domínio verificado coincide com o host da requisição.
     */
    public function findVerifiedByHost(string $host): ?CustomDomain
    {
        return CustomDomain::query()
            ->where('domain', $host)
            ->whereNotNull('verified_at')
            ->with('bio')
            ->first();
    }
}
