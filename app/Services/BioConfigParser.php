<?php

namespace App\Services;

use App\Exceptions\ApplicationException;

/**
 * Extrai e valida o JSON da bio enviado pelo editor ou onboarding.
 */
class BioConfigParser
{
    /**
     * @param  mixed  $config  Corpo da requisição ou chave `config`
     * @return array<string, mixed>
     */
    public function parse(mixed $config): array
    {
        if (! is_array($config) || ! isset($config['brand'])) {
            throw new ApplicationException('JSON da bio inválido.', 422);
        }

        return $config;
    }
}
