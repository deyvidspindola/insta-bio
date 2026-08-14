<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\BioPage;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistência de páginas internas da bio.
 */
class BioPageRepository
{
    /**
     * Páginas da bio, mais recentes primeiro.
     *
     * @return Collection<int, BioPage>
     */
    public function listForBio(Bio $bio): Collection
    {
        return $bio->pages()->orderByDesc('id')->get();
    }

    /**
     * Localiza uma página pelo slug dentro da bio.
     */
    public function findBySlug(Bio $bio, string $slug): ?BioPage
    {
        return $bio->pages()->where('slug', $slug)->first();
    }

    /**
     * Cria uma página interna.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(Bio $bio, array $attributes): BioPage
    {
        return $bio->pages()->create($attributes);
    }

    /**
     * Atualiza campos da página.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(BioPage $page, array $attributes): BioPage
    {
        $page->update($attributes);

        return $page->fresh() ?? $page;
    }

    /**
     * Remove a página.
     */
    public function delete(BioPage $page): void
    {
        $page->delete();
    }

    /**
     * Indica se o slug já existe nesta bio.
     */
    public function slugExistsForBio(Bio $bio, string $slug): bool
    {
        return $bio->pages()->where('slug', $slug)->exists();
    }
}
