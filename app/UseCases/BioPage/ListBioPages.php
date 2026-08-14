<?php

namespace App\UseCases\BioPage;

use App\Models\BioPage;
use App\Models\User;
use App\Repositories\BioPageRepository;
use App\Services\CurrentBioService;

/**
 * Lista as páginas internas da bio do usuário.
 */
final class ListBioPages
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioPageRepository $pages,
    ) {}

    /**
     * @return array{pages: list<array<string, mixed>>}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);

        return [
            'pages' => $this->pages->listForBio($bio)
                ->map(fn (BioPage $page) => $this->toArray($page))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toArray(BioPage $page): array
    {
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
