<?php

namespace App\DTO;

use Illuminate\Support\Carbon;

/**
 * Janela de datas do relatório de analytics e o período anterior equivalente.
 */
final readonly class AnalyticsWindow
{
    /**
     * @param  Carbon  $from  Início do período atual
     * @param  Carbon  $to  Fim do período atual
     * @param  Carbon  $previousFrom  Início do período anterior
     * @param  Carbon  $previousTo  Fim do período anterior
     */
    public function __construct(
        public Carbon $from,
        public Carbon $to,
        public Carbon $previousFrom,
        public Carbon $previousTo,
    ) {}
}
