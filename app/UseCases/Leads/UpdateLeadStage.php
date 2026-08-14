<?php

namespace App\UseCases\Leads;

use App\Exceptions\ApplicationException;
use App\Models\Lead;
use App\Models\User;
use App\Repositories\LeadRepository;
use App\Services\CurrentBioService;

/**
 * Atualiza o estágio de um lead da bio do usuário.
 */
final class UpdateLeadStage
{
    public function __construct(
        private CurrentBioService $currentBio,
        private LeadRepository $leads,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, int $leadId, string $stage): array
    {
        $bio = $this->currentBio->require($user);
        $lead = $this->leads->findForBio($bio, $leadId);
        if ($lead === null) {
            throw new ApplicationException('Lead não encontrado.', 404);
        }

        if (! in_array($stage, Lead::STAGES, true)) {
            throw new ApplicationException('Estágio inválido.', 422);
        }

        $lead = $this->leads->updateStage($lead, $stage);

        return $this->toArray($lead);
    }

    /**
     * @return array<string, mixed>
     */
    private function toArray(Lead $lead): array
    {
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
