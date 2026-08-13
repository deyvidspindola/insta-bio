<?php

namespace App\UseCases\Auth;

use App\Models\User;

/**
 * Reenvia o e-mail de verificação.
 */
final class SendVerificationNotification
{
    public function execute(User $user): void
    {
        $user->sendEmailVerificationNotification();
    }
}
