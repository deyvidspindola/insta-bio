<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Cria o admin local (idempotente para reexecutar no Docker).
     */
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@local.dev'],
            [
                'name' => 'Admin',
                'password' => 'admin123',
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
