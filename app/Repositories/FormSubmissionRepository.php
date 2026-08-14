<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\FormSubmission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistência de respostas de formulários da bio.
 */
class FormSubmissionRepository
{
    /**
     * Grava uma resposta.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): FormSubmission
    {
        return FormSubmission::query()->create($attributes);
    }

    /**
     * Respostas da bio, mais recentes primeiro.
     *
     * @return LengthAwarePaginator<int, FormSubmission>
     */
    public function forBio(Bio $bio, ?string $sectionId = null, ?int $itemIndex = null, int $perPage = 50): LengthAwarePaginator
    {
        return FormSubmission::query()
            ->where('bio_id', $bio->id)
            ->when($sectionId !== null && $sectionId !== '', fn ($q) => $q->where('section_id', $sectionId))
            ->when($itemIndex !== null, fn ($q) => $q->where('item_index', $itemIndex))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Todas as respostas da bio (sem paginação — export/listagem curta).
     *
     * @return Collection<int, FormSubmission>
     */
    public function allForBio(Bio $bio, ?string $sectionId = null, ?int $itemIndex = null): Collection
    {
        return FormSubmission::query()
            ->where('bio_id', $bio->id)
            ->when($sectionId !== null && $sectionId !== '', fn ($q) => $q->where('section_id', $sectionId))
            ->when($itemIndex !== null, fn ($q) => $q->where('item_index', $itemIndex))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();
    }
}
