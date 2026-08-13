<?php

namespace App\UseCases\Analytics;

use App\Models\User;
use App\Repositories\AnalyticsRepository;
use App\Services\AnalyticsPeriodResolver;
use App\Services\CurrentBioService;

/**
 * Série temporal de pageviews e cliques.
 */
final class GetAnalyticsTimeseries
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
        $grain = $window->from->diffInDays($window->to) <= 2 ? 'hour' : 'day';

        return [
            'ok' => true,
            'from' => $window->from->toDateString(),
            'to' => $window->to->toDateString(),
            'grain' => $grain,
            'current' => $this->events->buckets($bio, $window->from, $window->to, $grain),
            'previous' => $this->events->buckets($bio, $window->previousFrom, $window->previousTo, $grain),
        ];
    }
}
