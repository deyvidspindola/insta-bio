<?php

namespace App\Services;

use App\Exceptions\ApplicationException;
use App\Models\Bio;
use App\Models\User;
use App\Repositories\BioRepository;

/**
 * Obtém a bio do usuário autenticado, com as regras de acesso compartilhadas.
 */
class CurrentBioService
{
    public function __construct(private BioRepository $bios) {}

    /**
     * Bio existente do usuário, sem exigir status ativo.
     */
    public function require(User $user): Bio
    {
        $bio = $this->bios->findForUser($user);
        if (! $bio instanceof Bio) {
            throw new ApplicationException('Bio não encontrada', 404);
        }

        return $bio;
    }

    /**
     * Bio ativa do usuário. Admins podem acessar bios suspensas.
     */
    public function requireActive(User $user): Bio
    {
        $bio = $this->require($user);
        if (! $bio->isActive() && ! $user->is_admin) {
            throw new ApplicationException('Bio suspensa', 403);
        }

        return $bio;
    }
}
