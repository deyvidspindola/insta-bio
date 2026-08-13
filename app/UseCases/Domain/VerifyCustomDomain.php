<?php

namespace App\UseCases\Domain;

use App\Exceptions\ApplicationException;
use App\Models\CustomDomain;
use App\Models\User;
use App\Repositories\CustomDomainRepository;
use App\Services\CurrentBioService;
use App\Services\DomainVerificationService;

/**
 * Confere CNAME/TXT e marca o domínio como verificado.
 */
final class VerifyCustomDomain
{
    public function __construct(
        private CurrentBioService $currentBio,
        private CustomDomainRepository $domains,
        private DomainVerificationService $verification,
    ) {}

    /**
     * @return array{ok: bool, domain: CustomDomain, error: string|null}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);
        $domain = $this->domains->forBio($bio);
        if ($domain === null) {
            throw new ApplicationException('Nenhum domínio cadastrado.', 422);
        }

        $ok = $this->verification->verify($domain);
        $domain->refresh();

        return [
            'ok' => $ok,
            'domain' => $domain,
            'error' => $ok ? null : 'Ainda não encontramos o CNAME ou TXT. Aguarde a propagação DNS e tente de novo.',
        ];
    }
}
