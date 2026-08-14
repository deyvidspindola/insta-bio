<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\BioForm;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistência de formulários reutilizáveis da bio.
 */
class BioFormRepository
{
    /**
     * @return Collection<int, BioForm>
     */
    public function listForBio(Bio $bio): Collection
    {
        return $bio->forms()->orderByDesc('id')->get();
    }

    public function findBySlug(Bio $bio, string $slug): ?BioForm
    {
        return $bio->forms()->where('slug', $slug)->first();
    }

    public function findPublishedBySlug(Bio $bio, string $slug): ?BioForm
    {
        return $bio->forms()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(Bio $bio, array $attributes): BioForm
    {
        return $bio->forms()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(BioForm $form, array $attributes): BioForm
    {
        $form->update($attributes);

        return $form->fresh() ?? $form;
    }

    public function delete(BioForm $form): void
    {
        $form->delete();
    }

    public function slugExistsForBio(Bio $bio, string $slug): bool
    {
        return $bio->forms()->where('slug', $slug)->exists();
    }
}
