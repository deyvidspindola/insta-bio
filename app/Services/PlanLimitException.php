<?php

namespace App\Services;

use App\Exceptions\ApplicationException;

/**
 * Limite do plano atingido (links, layout, upload ou domínio).
 */
class PlanLimitException extends ApplicationException
{
    /**
     * @param  string  $message  Mensagem exibida ao usuário
     * @param  int  $status  422 para save/upload; 403 para domínio no Free
     */
    public function __construct(string $message, int $status = 422)
    {
        parent::__construct($message, $status);
    }
}
