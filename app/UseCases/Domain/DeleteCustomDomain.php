<?php

namespace App\UseCases\Domain;

use App\Models\User;
use App\Repositories\CustomDomainRepository;
use App\Services\CurrentBioService;

/**
 * Remove o domínio próprio da bio.
 */
final class DeleteCustomDomain
{
    public function __construct(
        private CurrentBioService $currentBio,
        private CustomDomainRepository $domains,
    ) {}

    public function execute(User $user): void
    {
        $this->domains->deleteFor($this->currentBio->require($user));
    }
}
