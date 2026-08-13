<?php

namespace App\UseCases\Media;

use App\DTO\MediaUpload;
use App\Models\User;
use App\Repositories\MediaRepository;
use App\Services\CurrentBioService;
use App\Services\MediaStorageService;
use App\Services\PlanGate;

/**
 * Envia um arquivo para o storage da bio, respeitando o plano.
 */
final class UploadMedia
{
    public function __construct(
        private CurrentBioService $currentBio,
        private MediaRepository $media,
        private MediaStorageService $storage,
        private PlanGate $plans,
    ) {}

    /**
     * @return array{ok: true, name: string, path: string, url: string}
     */
    public function execute(User $user, MediaUpload $upload): array
    {
        $bio = $this->currentBio->require($user);
        $this->plans->assertCanUpload($bio, $upload->size(), $this->media->countFor($bio));

        $path = $this->storage->store($bio, $upload->originalName, $upload->binary);
        $record = $this->media->create($bio, [
            'name' => $this->storage->basename($path),
            'path' => $path,
            'size' => $upload->size(),
            'mime' => $upload->mime,
        ]);

        return [
            'ok' => true,
            'name' => $record->name,
            'path' => $record->publicUrl(),
            'url' => $record->publicUrl(),
        ];
    }
}
