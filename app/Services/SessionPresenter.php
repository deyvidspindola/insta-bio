<?php

namespace App\Services;

use App\Models\User;

/**
 * Monta o payload da sessão usado pelo editor e pelo app.
 */
class SessionPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function guest(): array
    {
        return ['authenticated' => false, 'user' => null];
    }

    /**
     * @return array<string, mixed>
     */
    public function for(User $user): array
    {
        $bio = $user->bio;

        return [
            'authenticated' => true,
            'user' => $user->email,
            'name' => $user->name,
            'slug' => $bio?->slug,
            'plan' => $bio?->plan,
            'is_admin' => $user->is_admin,
        ];
    }
}
