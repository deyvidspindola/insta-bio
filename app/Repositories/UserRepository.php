<?php

namespace App\Repositories;

use App\Models\User;

/**
 * Persistência de usuários. Único ponto de acesso a `users` fora dos models.
 */
class UserRepository
{
    /**
     * Localiza um usuário pelo e-mail.
     */
    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    /**
     * Localiza um usuário pelo identificador do Google.
     */
    public function findByGoogleId(string $googleId): ?User
    {
        return User::query()->where('google_id', $googleId)->first();
    }

    /**
     * Localiza um usuário pela chave primária.
     */
    public function findById(int $id): ?User
    {
        return User::query()->find($id);
    }

    /**
     * Cria um usuário.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): User
    {
        return User::query()->create($attributes);
    }

    /**
     * Persiste alterações já aplicadas no model.
     */
    public function save(User $user): void
    {
        $user->save();
    }
}
