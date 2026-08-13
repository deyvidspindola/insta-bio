<?php

namespace App\Services;

use App\DTO\GoogleProfile;
use App\Exceptions\ApplicationException;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * Encapsula o Socialite Google para os use cases de autenticação.
 */
class GoogleAuthService
{
    /**
     * Indica se as credenciais OAuth estão configuradas.
     */
    public function configured(): bool
    {
        return filled(config('services.google.client_id'));
    }

    /**
     * URL de redirecionamento do Google.
     */
    public function redirectUrl(): string
    {
        if (! $this->configured()) {
            throw new ApplicationException('Login com Google ainda não está configurado.', 422);
        }

        return Socialite::driver('google')->redirect()->getTargetUrl();
    }

    /**
     * Perfil do usuário após o callback OAuth.
     */
    public function profile(): GoogleProfile
    {
        try {
            $user = Socialite::driver('google')->user();
        } catch (Throwable) {
            throw new ApplicationException('Não foi possível entrar com o Google.', 422);
        }

        return new GoogleProfile(
            (string) $user->getId(),
            (string) $user->getEmail(),
            $user->getName() ?: 'Usuário',
        );
    }
}
