<?php

namespace App\UseCases\Platform;

/**
 * Status de atualização remota (V2 é gerenciada pela plataforma).
 */
final class GetUpdateStatus
{
    /**
     * @return array<string, mixed>
     */
    public function execute(): array
    {
        return [
            'ok' => true,
            'state' => ['version' => '2.0.0', 'updatedAt' => null],
            'platformManaged' => true,
        ];
    }
}
