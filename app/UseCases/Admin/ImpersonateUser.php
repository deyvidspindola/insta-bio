<?php

namespace App\UseCases\Admin;

use App\Exceptions\ApplicationException;
use App\Models\Bio;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Entra na conta do dono da bio, guardando o admin na sessão.
 */
final class ImpersonateUser
{
    /**
     * @return array{ok: true, redirect: string}
     */
    public function execute(User $admin, Bio $bio): array
    {
        if (! $admin->is_admin) {
            throw new ApplicationException('Acesso restrito.', 403);
        }
        if (! $bio->user instanceof User) {
            throw new ApplicationException('Bio não encontrada', 404);
        }

        session()->put('impersonator_id', $admin->id);
        Auth::login($bio->user);
        session()->regenerate();

        return ['ok' => true, 'redirect' => '/app'];
    }
}
