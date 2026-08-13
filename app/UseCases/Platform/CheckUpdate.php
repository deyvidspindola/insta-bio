<?php

namespace App\UseCases\Platform;

/**
 * Checagem de atualização remota — sempre negativa na V2.
 */
final class CheckUpdate
{
    /**
     * @return array<string, mixed>
     */
    public function execute(): array
    {
        return [
            'ok' => true,
            'updateAvailable' => false,
            'installed' => '2.0.0',
        ];
    }
}
