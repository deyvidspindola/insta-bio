<?php

namespace App\Repositories;

use App\Models\Bio;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Persistência de bios. Controllers e use cases não consultam Eloquent direto.
 */
class BioRepository
{
    /**
     * Bio do usuário autenticado, se existir.
     */
    public function findForUser(User $user): ?Bio
    {
        return $user->bio;
    }

    /**
     * Indica se o usuário já concluiu o onboarding.
     */
    public function existsForUser(User $user): bool
    {
        return $user->bio()->exists();
    }

    /**
     * Localiza uma bio pelo slug público.
     */
    public function findBySlug(string $slug): ?Bio
    {
        return Bio::query()->where('slug', $slug)->first();
    }

    /**
     * Localiza uma bio pela chave de analytics (página pública).
     */
    public function findByAnalyticsKey(string $key): ?Bio
    {
        return Bio::query()->where('analytics_key', $key)->first();
    }

    /**
     * Localiza uma bio pela chave primária.
     */
    public function findById(int $id): ?Bio
    {
        return Bio::query()->find($id);
    }

    /**
     * Verifica se o slug já está em uso.
     */
    public function slugExists(string $slug): bool
    {
        return Bio::query()->where('slug', $slug)->exists();
    }

    /**
     * Cria a bio do usuário (onboarding).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function createForUser(User $user, array $attributes): Bio
    {
        return $user->bio()->create($attributes);
    }

    /**
     * Persiste o rascunho da bio.
     *
     * @param  array<string, mixed>  $config
     */
    public function updateDraft(Bio $bio, array $config): void
    {
        $bio->update(['json_draft' => $config]);
    }

    /**
     * Publica a bio e guarda o JSON anterior como backup.
     *
     * @param  array<string, mixed>  $config
     */
    public function publish(Bio $bio, array $config): void
    {
        $bio->update([
            'json_backup' => $bio->json_published,
            'json_draft' => $config,
            'json_published' => $config,
        ]);
    }

    /**
     * Substitui o rascunho pelo JSON publicado.
     *
     * @return array<string, mixed>
     */
    public function revertDraft(Bio $bio): array
    {
        $published = $bio->json_published ?? [];
        $bio->update(['json_draft' => $published]);

        return $published;
    }

    /**
     * Restaura o backup para rascunho e publicado.
     *
     * @return array<string, mixed>|null
     */
    public function restoreBackup(Bio $bio): ?array
    {
        $backup = $bio->json_backup;
        if (! is_array($backup)) {
            return null;
        }

        $bio->update([
            'json_draft' => $backup,
            'json_published' => $backup,
        ]);

        return $backup;
    }

    /**
     * Atualiza campos administrativos (plano, status).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Bio $bio, array $attributes): Bio
    {
        $bio->update($attributes);

        return $bio->fresh() ?? $bio;
    }

    /**
     * Lista bios para o painel admin, com filtro opcional.
     *
     * @return Collection<int, Bio>
     */
    public function searchForAdmin(string $query): Collection
    {
        return Bio::query()
            ->with('user:id,name,email')
            ->when($query !== '', function ($builder) use ($query) {
                $builder->where('slug', 'like', "%{$query}%")
                    ->orWhereHas(
                        'user',
                        fn ($user) => $user
                            ->where('email', 'like', "%{$query}%")
                            ->orWhere('name', 'like', "%{$query}%")
                    );
            })
            ->orderByDesc('id')
            ->limit(200)
            ->get();
    }
}
