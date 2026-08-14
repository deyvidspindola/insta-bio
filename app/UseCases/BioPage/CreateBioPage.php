<?php

namespace App\UseCases\BioPage;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioPageRepository;
use App\Services\CurrentBioService;
use App\Services\SlugService;

/**
 * Cria uma página interna com rascunho vazio.
 */
final class CreateBioPage
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioPageRepository $pages,
        private SlugService $slugs,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, string $title, ?string $slugInput): array
    {
        $bio = $this->currentBio->require($user);

        $raw = is_string($slugInput) && trim($slugInput) !== '' ? $slugInput : $title;
        $slug = $this->slugs->normalize($raw);
        $error = $this->slugs->validate($slug);
        if ($error !== null) {
            throw new ApplicationException($error, 422);
        }
        if ($this->pages->slugExistsForBio($bio, $slug)) {
            throw new ApplicationException('Este slug já está em uso nesta bio.', 422);
        }

        $empty = ['sections' => []];
        $page = $this->pages->create($bio, [
            'slug' => $slug,
            'title' => $title,
            'json_draft' => $empty,
            'json_published' => $empty,
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
