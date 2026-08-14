<?php

namespace App\UseCases\Leads;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\LeadRepository;
use App\Services\CurrentBioService;

/**
 * Remove um lead da bio do usuário.
 */
final class DeleteLead
{
    public function __construct(
        private CurrentBioService $currentBio,
        private LeadRepository $leads,
    ) {}

    public function execute(User $user, int $leadId): void
    {
        $bio = $this->currentBio->require($user);
        $lead = $this->leads->findForBio($bio, $leadId);
        if ($lead === null) {
            throw new ApplicationException('Lead não encontrado.', 404);
        }

        $this->leads->delete($lead);
    }
}
