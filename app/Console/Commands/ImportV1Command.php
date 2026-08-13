<?php

namespace App\Console\Commands;

use App\Repositories\BioRepository;
use App\Repositories\UserRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Importa pastas V1 (`bio.json`) como usuários e bios na V2.
 */
class ImportV1Command extends Command
{
    protected $signature = 'v1:import {path : Pasta da plataforma V1 (ex.: public_html ou panel/data/platform)}';

    protected $description = 'Importa bios V1 (pastas com bio.json) para o banco da V2';

    public function __construct(
        private UserRepository $users,
        private BioRepository $bios,
    ) {
        parent::__construct();
    }

    /**
     * Percorre as pastas e cria usuário + bio quando o slug ainda não existe.
     */
    public function handle(): int
    {
        $root = $this->argument('path');
        if (! is_dir($root)) {
            $this->error("Pasta não encontrada: {$root}");

            return self::FAILURE;
        }

        $imported = 0;
        foreach (File::directories($root) as $dir) {
            $slug = basename($dir);
            $jsonPath = $dir.'/bio.json';
            if (! is_file($jsonPath)) {
                continue;
            }

            $config = json_decode((string) file_get_contents($jsonPath), true);
            if (! is_array($config)) {
                $this->warn("JSON inválido em {$jsonPath}");

                continue;
            }

            if ($this->bios->slugExists($slug)) {
                $this->warn("Slug já existe, pulando: {$slug}");

                continue;
            }

            $email = $slug.'@imported.local';
            $user = $this->users->findByEmail($email) ?? $this->users->create([
                'email' => $email,
                'name' => data_get($config, 'brand.name', $slug),
                'password' => Str::password(16),
                'email_verified_at' => now(),
            ]);

            $this->bios->createForUser($user, [
                'slug' => $slug,
                'plan' => 'free',
                'status' => 'active',
                'analytics_key' => (string) Str::uuid(),
                'json_draft' => $config,
                'json_published' => $config,
            ]);

            $imported++;
            $this->info("Importado: {$slug}");
        }

        $this->info("Total: {$imported} bios.");

        return self::SUCCESS;
    }
}
