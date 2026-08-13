<?php

namespace App\UseCases\Analytics;

use App\Models\User;
use App\Repositories\AnalyticsRepository;
use App\Services\AnalyticsPeriodResolver;
use App\Services\CurrentBioService;

/**
 * Resumo do período: totais, delta, hoje e top clique.
 */
final class GetAnalyticsSummary
{
    public function __construct(
        private CurrentBioService $currentBio,
        private AnalyticsPeriodResolver $periods,
        private AnalyticsRepository $events,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, ?string $from, ?string $to): array
    {
        $bio = $this->currentBio->require($user);
        $window = $this->periods->resolve($bio, $from, $to);
        $current = $this->events->aggregate($bio, $window->from, $window->to);
        $previous = $this->events->aggregate($bio, $window->previousFrom, $window->previousTo);
        $today = $this->events->aggregate($bio, now()->startOfDay(), now());
        $top = $this->events->topClick($bio, $window->from, $window->to);

        return [
            'ok' => true,
            'from' => $window->from->toDateString(),
            'to' => $window->to->toDateString(),
            'period' => $current,
            'previous' => $previous,
            'delta' => [
                'pageviews' => $this->periods->delta($current['pageviews'], $previous['pageviews']),
                'uniques' => $this->periods->delta($current['uniques'], $previous['uniques']),
                'clicks' => $this->periods->delta($current['clicks'], $previous['clicks']),
            ],
            'today' => $today,
            'top_click' => $top ? [
                'label' => $top->label,
                'item_type' => $top->item_type,
                'target_url' => $top->target_url,
                'count' => (int) $top->aggregate_count,
            ] : null,
        ];
    }
}
