<?php

namespace App\UseCases\Auth;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;

/**
 * Cria a conta por e-mail/senha e dispara a verificação.
 */
final class RegisterUser
{
    public function __construct(private UserRepository $users) {}

    /**
     * @return User Usuário recém-criado e já autenticado
     */
    public function execute(string $name, string $email, string $password): User
    {
        $user = $this->users->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        event(new Registered($user));
        Auth::login($user);

        return $user;
    }
}
