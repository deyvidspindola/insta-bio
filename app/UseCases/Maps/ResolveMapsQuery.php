<?php

namespace App\UseCases\Maps;

use App\Exceptions\ApplicationException;

/**
 * Monta a URL de embed do Google Maps a partir de um endereço.
 */
final class ResolveMapsQuery
{
    /**
     * @return array{ok: true, query: string, embed: string}
     */
    public function execute(string $query): array
    {
        $q = trim($query);
        if ($q === '') {
            throw new ApplicationException('Informe o endereço.', 422);
        }

        return [
            'ok' => true,
            'query' => $q,
            'embed' => 'https://www.google.com/maps?q='.rawurlencode($q).'&output=embed',
        ];
    }
}
