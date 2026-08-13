<?php

namespace App\UseCases\Auth;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Services\AuthRedirectService;
use Illuminate\Support\Facades\Auth;

/**
 * Autentica o usuário com e-mail e senha.
 */
final class LoginUser
{
    public function __construct(private AuthRedirectService $redirects) {}

    /**
     * @return string URL de destino após o login
     */
    public function execute(string $email, string $password, bool $remember): string
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
            throw new ApplicationException('E-mail ou senha inválidos.', 422);
        }

        $user = Auth::user();
        if (! $user instanceof User) {
            throw new ApplicationException('E-mail ou senha inválidos.', 422);
        }

        return $this->redirects->urlFor($user);
    }
}
