<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Base dos controllers HTTP: apenas orquestração, sem regra de negócio.
 */
abstract class Controller
{
    /**
     * Usuário autenticado da requisição.
     */
    protected function actor(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
