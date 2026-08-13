<?php

namespace App\UseCases\Admin;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Auth;

/**
 * Volta da impersonação para a conta admin original.
 */
final class StopImpersonating
{
    public function __construct(private UserRepository $users) {}

    /**
     * @return array{ok: true, redirect: string}
     */
    public function execute(): array
    {
        $id = session()->pull('impersonator_id');
        if ($id) {
            $admin = $this->users->findById((int) $id);
            if ($admin !== null) {
                Auth::login($admin);
                session()->regenerate();
            }
        }

        return ['ok' => true, 'redirect' => '/admin'];
    }
}
