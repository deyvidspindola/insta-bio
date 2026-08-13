<?php

namespace App\Services;

use App\Models\User;

/**
 * Decide para onde o usuário autenticado deve ir após login ou OAuth.
 */
class AuthRedirectService
{
    /**
     * Rota nomeada de destino pós-autenticação.
     */
    public function routeNameFor(User $user): string
    {
        return $user->bio ? 'app.editor' : 'onboarding';
    }

    /**
     * URL de destino pós-autenticação.
     */
    public function urlFor(User $user): string
    {
        return route($this->routeNameFor($user));
    }
}
