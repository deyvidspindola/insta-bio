<?php

namespace App\UseCases\Leads;

use App\Models\Lead;
use App\Models\User;
use App\Repositories\LeadRepository;
use App\Services\CurrentBioService;

/**
 * Lista leads da bio do usuário (ordenados por created_at desc).
 */
final class ListLeads
{
    public function __construct(
        private CurrentBioService $currentBio,
        private LeadRepository $leads,
    ) {}

    /**
     * @return array{items: list<array<string, mixed>>, stages: list<string>}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);

        return [
            'items' => $this->leads->forBio($bio)
                ->map(fn (Lead $lead) => [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'contact' => $lead->contact,
                    'source_type' => $lead->source_type,
                    'source_label' => $lead->source_label,
                    'stage' => $lead->stage,
                    'notes' => $lead->notes,
                    'created_at' => $lead->created_at?->toIso8601String(),
                    'updated_at' => $lead->updated_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
            'stages' => Lead::STAGES,
        ];
    }
}
