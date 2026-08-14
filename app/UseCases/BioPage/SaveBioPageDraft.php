<?php

namespace App\UseCases\BioPage;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioPageRepository;
use App\Services\CurrentBioService;

/**
 * Persiste o rascunho (sections) de uma página interna.
 */
final class SaveBioPageDraft
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioPageRepository $pages,
    ) {}

    /**
     * @param  list<mixed>|array{sections?: list<mixed>}  $payload
     * @return array<string, mixed>
     */
    public function execute(User $user, string $slug, array $payload): array
    {
        $bio = $this->currentBio->require($user);
        $page = $this->pages->findBySlug($bio, $slug);
        if ($page === null) {
            throw new ApplicationException('Página não encontrada.', 404);
        }

        $sections = $this->extractSections($payload);
        $page = $this->pages->update($page, [
            'json_draft' => ['sections' => $sections],
        ]);

        return [
            'id' => $page->id,
            'slug' => $page->slug,
            'title' => $page->title,
            'status' => $page->status,
            'json_draft' => $page->json_draft,
            'json_published' => $page->json_published,
            'created_at' => $page->created_at?->toIso8601String(),
            'updated_at' => $page->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Aceita `sections` direto ou envelope `{ sections: [] }`.
     *
     * @param  array<mixed>  $payload
     * @return list<mixed>
     */
    private function extractSections(array $payload): array
    {
        if (array_is_list($payload)) {
            return $payload;
        }

        $sections = $payload['sections'] ?? null;
        if (! is_array($sections)) {
            throw new ApplicationException('JSON da página inválido: sections obrigatório.', 422);
        }

        return array_values($sections);
    }
}
