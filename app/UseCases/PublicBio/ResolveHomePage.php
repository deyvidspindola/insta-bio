<?php

namespace App\UseCases\PublicBio;

use App\Models\Bio;
use App\Services\PublicBioPresenter;

/**
 * Resolve a home: bio do domínio próprio ou landing do produto.
 */
final class ResolveHomePage
{
    public function __construct(private PublicBioPresenter $presenter) {}

    /**
     * @return array{view: string, data: array<string, mixed>}
     */
    public function execute(?Bio $tenant): array
    {
        if ($tenant instanceof Bio) {
            return $this->viewData($tenant);
        }

        return ['view' => 'spa', 'data' => ['entry' => 'site']];
    }

    /**
     * Dados da view Blade da bio pública.
     *
     * @return array{view: string, data: array<string, mixed>}
     */
    public function viewData(Bio $bio): array
    {
        $published = $this->presenter->published($bio);
        $seo = $this->presenter->seo($published);

        return [
            'view' => 'bio',
            'data' => [
                'bio' => $bio,
                'config' => $published,
                'title' => $seo['title'],
                'description' => $seo['description'],
            ],
        ];
    }
}
