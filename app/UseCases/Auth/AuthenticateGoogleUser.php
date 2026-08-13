<?php

namespace App\UseCases\Auth;

use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\AuthRedirectService;
use App\Services\GoogleAuthService;
use Illuminate\Support\Facades\Auth;

/**
 * Conclui o login/cadastro via callback do Google.
 */
final class AuthenticateGoogleUser
{
    public function __construct(
        private GoogleAuthService $google,
        private UserRepository $users,
        private AuthRedirectService $redirects,
    ) {}

    /**
     * @return string URL de destino após autenticar
     */
    public function execute(): string
    {
        $profile = $this->google->profile();
        $user = $this->users->findByGoogleId($profile->id)
            ?? $this->users->findByEmail($profile->email);

        if ($user instanceof User) {
            $this->linkGoogle($user, $profile->id);
        } else {
            $user = $this->users->create([
                'name' => $profile->name,
                'email' => $profile->email,
                'google_id' => $profile->id,
                'password' => null,
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, true);

        return $this->redirects->urlFor($user);
    }

    /**
     * Associa o Google ID e marca o e-mail como verificado.
     */
    private function linkGoogle(User $user, string $googleId): void
    {
        if (! $user->google_id) {
            $user->google_id = $googleId;
        }
        if (! $user->email_verified_at) {
            $user->email_verified_at = now();
        }
        $this->users->save($user);
    }
}
