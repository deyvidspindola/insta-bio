<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Services\SessionPresenter;

/**
 * Devolve o estado da sessão para o SPA (editor, app e admin).
 */
final class GetSession
{
    public function __construct(private SessionPresenter $presenter) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(?User $user): array
    {
        return $user instanceof User
            ? $this->presenter->for($user)
            : $this->presenter->guest();
    }
}
