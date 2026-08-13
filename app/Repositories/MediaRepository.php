<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\Media;
use Illuminate\Support\Collection;

/**
 * Persistência de arquivos de mídia associados a uma bio.
 */
class MediaRepository
{
    /**
     * Lista mídias da bio, mais recentes primeiro.
     *
     * @return Collection<int, Media>
     */
    public function listFor(Bio $bio): Collection
    {
        return $bio->media()->orderByDesc('id')->get();
    }

    /**
     * Quantidade de arquivos da bio (limite de plano).
     */
    public function countFor(Bio $bio): int
    {
        return $bio->media()->count();
    }

    /**
     * Localiza um arquivo pelo nome armazenado.
     */
    public function findByName(Bio $bio, string $name): ?Media
    {
        return $bio->media()->where('name', $name)->first();
    }

    /**
     * Cria o registro de mídia.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(Bio $bio, array $attributes): Media
    {
        return $bio->media()->create($attributes);
    }

    /**
     * Remove o registro de mídia.
     */
    public function delete(Media $media): void
    {
        $media->delete();
    }
}
