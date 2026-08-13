<?php

namespace App\UseCases\Media;

use App\Models\Media;
use App\Models\User;
use App\Repositories\MediaRepository;
use App\Services\CurrentBioService;

/**
 * Lista os arquivos de mídia da bio do usuário.
 */
final class ListMedia
{
    public function __construct(
        private CurrentBioService $currentBio,
        private MediaRepository $media,
    ) {}

    /**
     * @return array{files: list<array{name: string, path: string, size: int, modified: int}>}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);
        $files = $this->media->listFor($bio)->map(fn (Media $item) => [
            'name' => $item->name,
            'path' => $item->publicUrl(),
            'size' => $item->size,
            'modified' => $item->updated_at->timestamp,
        ]);

        return ['files' => $files->values()->all()];
    }
}
