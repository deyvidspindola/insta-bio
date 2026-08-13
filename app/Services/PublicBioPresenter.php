<?php

namespace App\Services;

use App\Exceptions\ApplicationException;
use App\Models\Bio;

/**
 * Garante que a bio pública está ativa e possui JSON publicado.
 */
class PublicBioPresenter
{
    /**
     * JSON publicado da bio, ou falha 403/404.
     *
     * @return array<string, mixed>
     */
    public function published(Bio $bio): array
    {
        if (! $bio->isActive()) {
            throw new ApplicationException('Esta bio está indisponível.', 403);
        }

        $published = $bio->json_published;
        if (! is_array($published)) {
            throw new ApplicationException('Bio não encontrada', 404);
        }

        return $published;
    }

    /**
     * Dados de SEO extraídos do JSON publicado.
     *
     * @param  array<string, mixed>  $published
     * @return array{title: string, description: string}
     */
    public function seo(array $published): array
    {
        $brand = is_array($published['brand'] ?? null) ? $published['brand'] : [];
        $seo = is_array($brand['seo'] ?? null) ? $brand['seo'] : [];

        return [
            'title' => (string) ($seo['title'] ?? ($brand['name'] ?? 'Link da Bio')),
            'description' => (string) ($seo['description'] ?? ($brand['tagline'] ?? '')),
        ];
    }
}
