<?php

namespace App\UseCases\Admin;

use App\Models\Bio;
use App\Repositories\BioRepository;

/**
 * Atualiza plano ou status de uma bio (admin).
 */
final class UpdateBio
{
    public function __construct(private BioRepository $bios) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{ok: true, bio: Bio}
     */
    public function execute(Bio $bio, array $attributes): array
    {
        return [
            'ok' => true,
            'bio' => $this->bios->update($bio, $attributes),
        ];
    }
}
