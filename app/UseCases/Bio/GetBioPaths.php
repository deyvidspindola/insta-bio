<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Services\CurrentBioService;

/**
 * Caminhos e URLs que o editor V1 espera no bootstrap.
 */
final class GetBioPaths
{
    public function __construct(private CurrentBioService $currentBio) {}

    /**
     * @return array{paths: array<string, mixed>}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->requireActive($user);

        return [
            'paths' => [
                'bioJsonPath' => 'db:'.$bio->slug,
                'assetsDir' => 'storage/bios/'.$bio->id,
                'draftPath' => 'db:draft',
                'publicBioUrl' => url('/'.$bio->slug),
                'configFile' => 'database',
                'bioExists' => $bio->json_published !== null,
                'draftExists' => $bio->json_draft !== null,
                'writable' => true,
            ],
        ];
    }
}
