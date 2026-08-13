<?php

namespace App\UseCases\Onboarding;

use App\Models\User;
use App\Repositories\BioRepository;

/**
 * Decide se o onboarding deve ser exibido ou se o usuário já tem bio.
 */
final class ShowOnboarding
{
    public function __construct(private BioRepository $bios) {}

    /**
     * Rota de redirect quando a bio já existe; null para renderizar o SPA.
     */
    public function execute(User $user): ?string
    {
        return $this->bios->existsForUser($user) ? 'app.editor' : null;
    }
}
