<?php

namespace App\UseCases\Media;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\MediaRepository;
use App\Services\CurrentBioService;
use App\Services\MediaStorageService;

/**
 * Remove um arquivo de mídia da bio.
 */
final class DeleteMedia
{
    public function __construct(
        private CurrentBioService $currentBio,
        private MediaRepository $media,
        private MediaStorageService $storage,
    ) {}

    public function execute(User $user, string $name): void
    {
        $bio = $this->currentBio->require($user);
        $record = $this->media->findByName($bio, $name);
        if ($record === null) {
            throw new ApplicationException('Arquivo não encontrado.', 404);
        }

        $this->storage->delete($record->path);
        $this->media->delete($record);
    }
}
