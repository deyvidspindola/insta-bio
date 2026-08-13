<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Repositories\BioRepository;
use App\Services\CurrentBioService;

/**
 * Descarta o rascunho e volta ao JSON publicado.
 */
final class RevertBioDraft
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioRepository $bios,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->requireActive($user);

        return $this->bios->revertDraft($bio);
    }
}
