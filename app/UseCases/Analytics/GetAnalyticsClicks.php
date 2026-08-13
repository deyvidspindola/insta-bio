<?php

namespace App\UseCases\Analytics;

use App\Models\User;
use App\Repositories\AnalyticsRepository;
use App\Services\AnalyticsPeriodResolver;
use App\Services\CurrentBioService;
use stdClass;

/**
 * Ranking de cliques por item da bio.
 */
final class GetAnalyticsClicks
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
        $items = $this->events->clickItems($bio, $window->from, $window->to);
        $total = max(1, (int) $items->sum('aggregate_count'));

        return [
            'ok' => true,
            'from' => $window->from->toDateString(),
            'to' => $window->to->toDateString(),
            'items' => $items->map(fn (stdClass $row) => [
                'section_id' => $row->section_id,
                'item_index' => $row->item_index,
                'item_type' => $row->item_type,
                'label' => $row->label,
                'target_url' => $row->target_url,
                'count' => (int) $row->aggregate_count,
                'pct' => round(((int) $row->aggregate_count) / $total * 100, 1),
            ]),
        ];
    }
}
