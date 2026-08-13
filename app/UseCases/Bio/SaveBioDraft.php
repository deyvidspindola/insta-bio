<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Repositories\BioRepository;
use App\Services\CurrentBioService;
use App\Services\PlanGate;

/**
 * Persiste o rascunho da bio após validar o plano.
 */
final class SaveBioDraft
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
        $this->bios->updateDraft($bio, $config);
    }
}
