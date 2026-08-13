<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Repositories\BioRepository;
use App\Services\CurrentBioService;
use App\Services\PlanGate;

/**
 * Publica o JSON atual e guarda o anterior como backup.
 */
final class PublishBio
{
    public function __construct(
        private CurrentBioService $currentBio,
        private PlanGate $plans,
        private BioRepository $bios,
    ) {}

    /**
     * @param  array<string, mixed>  $config
     */
    public function execute(User $user, array $config): void
    {
        $bio = $this->currentBio->requireActive($user);
        $this->plans->assertCanSave($bio, $config);
        $this->bios->publish($bio, $config);
    }
}
