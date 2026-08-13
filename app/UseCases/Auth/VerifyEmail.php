<?php

namespace App\UseCases\Auth;

use Illuminate\Foundation\Auth\EmailVerificationRequest;

/**
 * Marca o e-mail como verificado a partir do link assinado.
 */
final class VerifyEmail
{
    public function execute(EmailVerificationRequest $request): void
    {
        $request->fulfill();
    }
}
