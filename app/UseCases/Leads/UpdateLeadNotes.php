<?php

namespace App\UseCases\Leads;

use App\Exceptions\ApplicationException;
use App\Models\Lead;
use App\Models\User;
use App\Repositories\LeadRepository;
use App\Services\CurrentBioService;

/**
 * Atualiza as anotações de um lead da bio do usuário.
 */
final class UpdateLeadNotes
{
    public function __construct(
        private CurrentBioService $currentBio,
        private LeadRepository $leads,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, int $leadId, ?string $notes): array
    {
        $bio = $this->currentBio->require($user);
        $lead = $this->leads->findForBio($bio, $leadId);
        if ($lead === null) {
            throw new ApplicationException('Lead não encontrado.', 404);
        }

        $lead = $this->leads->updateNotes($lead, $notes);

        return [
            'id' => $lead->id,
            'name' => $lead->name,
            'contact' => $lead->contact,
            'source_type' => $lead->source_type,
            'source_label' => $lead->source_label,
            'stage' => $lead->stage,
            'notes' => $lead->notes,
            'created_at' => $lead->created_at?->toIso8601String(),
            'updated_at' => $lead->updated_at?->toIso8601String(),
        ];
    }
}
