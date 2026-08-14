<?php

namespace App\UseCases\PublicBioPage;

use App\Exceptions\ApplicationException;
use App\Repositories\BioPageRepository;
use App\Services\PublicBioPresenter;
use App\UseCases\PublicBio\ShowPublicBio;

/**
 * Página interna pública: brand da bio pai + sections da página publicada.
 */
final class ShowPublicBioPage
{
    public function __construct(
        private ShowPublicBio $showBio,
        private BioPageRepository $pages,
        private PublicBioPresenter $presenter,
    ) {}

    /**
     * @return array{view: string, data: array<string, mixed>}
     */
    public function execute(string $slug, string $pageSlug): array
    {
        $bio = $this->showBio->require($slug);
        $publishedBio = $this->presenter->published($bio);

        $page = $this->pages->findBySlug($bio, $pageSlug);
        if ($page === null) {
            throw new ApplicationException('Página não encontrada', 404);
        }

        $pagePublished = $page->json_published;
        if ($page->status !== 'published' || ! is_array($pagePublished)) {
            throw new ApplicationException('Página não encontrada', 404);
        }

        $brand = is_array($publishedBio['brand'] ?? null) ? $publishedBio['brand'] : [];
        $sections = is_array($pagePublished['sections'] ?? null) ? $pagePublished['sections'] : [];

        $config = [
            'brand' => $brand,
            'sections' => $sections,
        ];

        $seo = $this->presenter->seo($config);
        $title = is_string($page->title) && $page->title !== ''
            ? $page->title
            : $seo['title'];

        return [
            'view' => 'bio',
            'data' => [
                'bio' => $bio,
                'config' => $config,
                'title' => $title,
                'description' => $seo['description'],
            ],
        ];
    }
}
