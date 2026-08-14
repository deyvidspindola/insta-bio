<?php

namespace App\UseCases\BioPage;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioPageRepository;
use App\Services\CurrentBioService;

/**
 * Publica o rascunho da página interna.
 */
final class PublishBioPage
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioPageRepository $pages,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, string $slug): array
    {
        $bio = $this->currentBio->require($user);
        $page = $this->pages->findBySlug($bio, $slug);
        if ($page === null) {
            throw new ApplicationException('Página não encontrada.', 404);
        }

        $draft = is_array($page->json_draft) ? $page->json_draft : ['sections' => []];
        $page = $this->pages->update($page, [
            'json_published' => $draft,
            'status' => 'published',
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
}
