<?php

namespace App\Services;

use App\DTO\AnalyticsWindow;
use App\Models\Bio;
use Illuminate\Support\Carbon;

/**
 * Calcula a janela de datas permitida pelo plano da bio.
 */
class AnalyticsPeriodResolver
{
    public function __construct(private PlanGate $plans) {}

    /**
     * Monta o período atual e o período anterior de mesma duração.
     */
    public function resolve(Bio $bio, ?string $from, ?string $to): AnalyticsWindow
    {
        $days = $this->plans->analyticsDays($bio);
        $start = Carbon::parse((string) ($from ?: now()->subDays($days - 1)->toDateString()))->startOfDay();
        $end = Carbon::parse((string) ($to ?: now()->toDateString()))->endOfDay();
        $maxFrom = now()->subDays($days - 1)->startOfDay();
        if ($start->lt($maxFrom)) {
            $start = $maxFrom;
        }

        $periodLength = $start->diffInDays($end) + 1;
        $prevTo = $start->copy()->subDay()->endOfDay();
        $prevFrom = $prevTo->copy()->subDays($periodLength - 1)->startOfDay();

        return new AnalyticsWindow($start, $end, $prevFrom, $prevTo);
    }

    /**
     * Variação relativa entre dois totais (null se não houver base).
     */
    public function delta(int $current, int $previous): ?float
    {
        if ($previous === 0) {
            return $current > 0 ? 1.0 : null;
        }

        return round(($current - $previous) / $previous, 4);
    }
}
