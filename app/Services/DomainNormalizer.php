<?php

namespace App\Services;

use App\Exceptions\ApplicationException;

/**
 * Normaliza e valida o hostname informado pelo cliente.
 */
class DomainNormalizer
{
    /**
     * Remove protocolo, www e barra final; valida o formato.
     */
    public function normalize(string $input): string
    {
        $domain = strtolower(preg_replace('/^https?:\/\//', '', trim($input)) ?? '');
        $domain = rtrim($domain, '/');
        $domain = preg_replace('/^www\./', '', $domain) ?? $domain;

        if (! preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $domain)) {
            throw new ApplicationException('Domínio inválido.', 422);
        }

        return $domain;
    }
}
