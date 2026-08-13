<?php

namespace App\UseCases\Bio;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioRepository;
use App\Services\CurrentBioService;

/**
 * Restaura o backup da última publicação.
 */
final class RestoreBioBackup
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
        $backup = $this->bios->restoreBackup($bio);
        if ($backup === null) {
            throw new ApplicationException('Não há backup para restaurar.', 422);
        }

        return $backup;
    }
}
