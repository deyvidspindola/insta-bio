<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Persistência de leads do funil.
 */
class LeadRepository
{
    /**
     * Grava um lead.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Lead
    {
        return Lead::query()->create($attributes);
    }

    /**
     * Leads da bio, mais recentes primeiro.
     *
     * @return Collection<int, Lead>
     */
    public function forBio(Bio $bio): Collection
    {
        return Lead::query()
            ->where('bio_id', $bio->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Localiza um lead pelo id dentro da bio.
     */
    public function findForBio(Bio $bio, int $leadId): ?Lead
    {
        return Lead::query()
            ->where('bio_id', $bio->id)
            ->where('id', $leadId)
            ->first();
    }

    /**
     * Atualiza o estágio do lead.
     */
    public function updateStage(Lead $lead, string $stage): Lead
    {
        $lead->update(['stage' => $stage]);

        return $lead->fresh() ?? $lead;
    }

    /**
     * Atualiza as anotações do lead.
     */
    public function updateNotes(Lead $lead, ?string $notes): Lead
    {
        $lead->update(['notes' => $notes]);

        return $lead->fresh() ?? $lead;
    }

    /**
     * Remove o lead.
     */
    public function delete(Lead $lead): void
    {
        $lead->delete();
    }

    /**
     * Já existe lead de WhatsApp hero para este visitante nesta bio hoje.
     */
    public function existsWhatsAppLeadToday(int $bioId, string $visitorId): bool
    {
        if ($visitorId === '') {
            return false;
        }

        return Lead::query()
            ->where('bio_id', $bioId)
            ->where('source_type', 'whatsapp-hero')
            ->where('visitor_id', $visitorId)
            ->where('created_at', '>=', Carbon::today())
            ->exists();
    }
}
