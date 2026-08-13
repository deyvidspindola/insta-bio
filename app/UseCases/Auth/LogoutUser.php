<?php

namespace App\UseCases\Auth;

use Illuminate\Support\Facades\Auth;

/**
 * Encerra a sessão autenticada.
 */
final class LogoutUser
{
    /**
     * Remove o usuário da sessão. Invalidação do cookie fica no controller.
     */
    public function execute(): void
    {
        Auth::logout();
    }
}
