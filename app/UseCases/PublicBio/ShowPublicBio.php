<?php

namespace App\UseCases\PublicBio;

use App\Exceptions\ApplicationException;
use App\Models\Bio;
use App\Repositories\BioRepository;

/**
 * Localiza a bio pública pelo slug.
 */
final class ShowPublicBio
{
    public function __construct(
        private BioRepository $bios,
        private ResolveHomePage $home,
    ) {}

    /**
     * @return array{view: string, data: array<string, mixed>}
     */
    public function execute(string $slug): array
    {
        return $this->home->viewData($this->require($slug));
    }

    /**
     * Bio existente para o slug informado.
     */
    public function require(string $slug): Bio
    {
        $bio = $this->bios->findBySlug($slug);
        if (! $bio instanceof Bio) {
            throw new ApplicationException('Bio não encontrada', 404);
        }

        return $bio;
    }
}
