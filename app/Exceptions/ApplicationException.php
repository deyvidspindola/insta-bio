<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Falha de regra de negócio ou de fluxo da aplicação.
 *
 * Convertida em JSON (APIs) ou redirect com erros (formulários web).
 */
class ApplicationException extends RuntimeException
{
    /**
     * @param  string  $message  Mensagem exibida ao usuário
     * @param  int  $status  Código HTTP correspondente
     */
    public function __construct(
        string $message,
        private readonly int $status = 422,
    ) {
        parent::__construct($message);
    }

    /**
     * Código HTTP a ser devolvido ao cliente.
     */
    public function status(): int
    {
        return $this->status;
    }
}
