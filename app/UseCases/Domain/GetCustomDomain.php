<?php

namespace App\UseCases\Domain;

use App\Models\User;
use App\Repositories\CustomDomainRepository;
use App\Services\CurrentBioService;
use App\Services\DomainVerificationService;
use App\Services\PlanGate;

/**
 * Estado do domínio próprio da bio.
 */
final class GetCustomDomain
{
    public function __construct(
        private CurrentBioService $currentBio,
        private CustomDomainRepository $domains,
        private DomainVerificationService $verification,
        private PlanGate $plans,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);

        return [
            'domain' => $this->domains->forBio($bio),
            'cname' => $this->verification->cnameTarget(),
            'allowed' => (bool) $this->plans->limits($bio->plan)['custom_domain'],
        ];
    }
}
