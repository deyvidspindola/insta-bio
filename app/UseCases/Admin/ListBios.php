<?php

namespace App\UseCases\Admin;

use App\Models\Bio;
use App\Repositories\BioRepository;

/**
 * Lista bios no painel administrativo.
 */
final class ListBios
{
    public function __construct(private BioRepository $bios) {}

    /**
     * @return array{bios: list<array<string, mixed>>}
     */
    public function execute(string $query): array
    {
        $bios = $this->bios->searchForAdmin($query)->map(fn (Bio $bio) => [
            'id' => $bio->id,
            'slug' => $bio->slug,
            'plan' => $bio->plan,
            'status' => $bio->status,
            'name' => $bio->user?->name,
            'email' => $bio->user?->email,
            'url' => url('/'.$bio->slug),
            'created_at' => $bio->created_at?->toIso8601String(),
        ]);

        return ['bios' => $bios->values()->all()];
    }
}
