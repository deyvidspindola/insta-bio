<?php

namespace App\DTO;

/**
 * Perfil mínimo retornado pelo OAuth do Google.
 */
final readonly class GoogleProfile
{
    /**
     * @param  string  $id  Identificador estável do Google
     * @param  string  $email  E-mail da conta Google
     * @param  string  $name  Nome de exibição
     */
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
    ) {}
}
