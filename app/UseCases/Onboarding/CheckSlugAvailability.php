<?php

namespace App\UseCases\Onboarding;

use App\Repositories\BioRepository;
use App\Services\SlugService;

/**
 * Verifica se o slug está livre e no formato aceito.
 */
final class CheckSlugAvailability
{
    public function __construct(
        private SlugService $slugs,
        private BioRepository $bios,
    ) {}

    /**
     * @return array{ok: bool, slug: string, error: string|null}
     */
    public function execute(string $slugInput): array
    {
        $slug = $this->slugs->normalize($slugInput);
        $error = $this->slugs->validate($slug);
        if ($error !== null) {
            return ['ok' => false, 'slug' => $slug, 'error' => $error];
        }

        $taken = $this->bios->slugExists($slug);

        return [
            'ok' => ! $taken,
            'slug' => $slug,
            'error' => $taken ? 'Este slug já está em uso.' : null,
        ];
    }
}
