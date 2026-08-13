<?php

namespace App\UseCases\Platform;

use App\Exceptions\ApplicationException;

/**
 * Aplicar update remoto não existe na V2.
 */
final class ApplyUpdate
{
    public function execute(): void
    {
        throw new ApplicationException('Atualizações remotas não se aplicam à V2.', 410);
    }
}
