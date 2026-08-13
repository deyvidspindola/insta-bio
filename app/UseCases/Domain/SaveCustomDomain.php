<?php

namespace App\UseCases\Domain;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\CustomDomainRepository;
use App\Services\CurrentBioService;
use App\Services\DomainNormalizer;
use App\Services\DomainVerificationService;
use App\Services\PlanGate;
use Illuminate\Support\Str;

/**
 * Cadastra ou substitui o domínio próprio da bio.
 */
final class SaveCustomDomain
{
    public function __construct(
        private CurrentBioService $currentBio,
        private CustomDomainRepository $domains,
        private DomainNormalizer $normalizer,
        private DomainVerificationService $verification,
        private PlanGate $plans,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, string $host): array
    {
        $bio = $this->currentBio->require($user);
        $this->plans->assertCanUseCustomDomain($bio);

        $domain = $this->normalizer->normalize($host);
        if ($this->domains->existsForOtherBio($domain, $bio->id)) {
            throw new ApplicationException('Este domínio já está em uso.', 422);
        }

        $record = $this->domains->upsert(
            $bio,
            $domain,
            Str::lower(Str::random(32)),
        );

        return [
            'domain' => $record,
            'cname' => $this->verification->cnameTarget(),
            'txt' => 'linksnabio-verify='.$record->verification_token,
        ];
    }
}
