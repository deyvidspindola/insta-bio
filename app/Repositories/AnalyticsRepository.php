<?php

namespace App\Repositories;

use App\Models\AnalyticsEvent;
use App\Models\Bio;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Persistência e agregações de eventos de analytics.
 */
class AnalyticsRepository
{
    /**
     * Grava um evento de pageview ou clique.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): void
    {
        AnalyticsEvent::query()->create($attributes);
    }

    /**
     * Totais do período: pageviews, uniques, cliques e CTR.
     *
     * @return array{pageviews: int, uniques: int, clicks: int, ctr: float|null}
     */
    public function aggregate(Bio $bio, Carbon $from, Carbon $to): array
    {
        $pageviews = AnalyticsEvent::query()
            ->where('bio_id', $bio->id)
            ->where('event_type', 'pageview')
            ->whereBetween('occurred_at', [$from, $to])
            ->count();
        $clicks = AnalyticsEvent::query()
            ->where('bio_id', $bio->id)
            ->where('event_type', 'click')
            ->whereBetween('occurred_at', [$from, $to])
            ->count();
        $uniques = AnalyticsEvent::query()
            ->where('bio_id', $bio->id)
            ->whereBetween('occurred_at', [$from, $to])
            ->whereNotNull('visitor_id')
            ->distinct()
            ->count('visitor_id');

        return [
            'pageviews' => $pageviews,
            'uniques' => $uniques,
            'clicks' => $clicks,
            'ctr' => $pageviews > 0 ? round($clicks / $pageviews, 4) : null,
        ];
    }

    /**
     * Séries temporárias agrupadas por hora ou dia.
     *
     * @return list<array{bucket: string, pageviews: int, clicks: int}>
     */
    public function buckets(Bio $bio, Carbon $from, Carbon $to, string $grain): array
    {
        $driver = $bio->getConnection()->getDriverName();
        $expr = $grain === 'hour'
            ? ($driver === 'sqlite'
                ? "strftime('%Y-%m-%d %H:00:00', occurred_at)"
                : "DATE_FORMAT(occurred_at, '%Y-%m-%d %H:00:00')")
            : ($driver === 'sqlite'
                ? "strftime('%Y-%m-%d', occurred_at)"
                : 'DATE(occurred_at)');

        $rows = DB::table('analytics_events')
            ->where('bio_id', $bio->id)
            ->whereBetween('occurred_at', [$from, $to])
            ->selectRaw("{$expr} as bucket, event_type, COUNT(*) as aggregate_count")
            ->groupBy('bucket', 'event_type')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $bucket = (string) $row->bucket;
            $map[$bucket] ??= ['bucket' => $bucket, 'pageviews' => 0, 'clicks' => 0];
            if ($row->event_type === 'click') {
                $map[$bucket]['clicks'] = (int) $row->aggregate_count;
            } else {
                $map[$bucket]['pageviews'] = (int) $row->aggregate_count;
            }
        }

        return array_values($map);
    }

    /**
     * Cliques agrupados por item da bio.
     *
     * @return Collection<int, stdClass>
     */
    public function clickItems(Bio $bio, Carbon $from, Carbon $to, int $limit = 50): Collection
    {
        return DB::table('analytics_events')
            ->where('bio_id', $bio->id)
            ->where('event_type', 'click')
            ->whereBetween('occurred_at', [$from, $to])
            ->selectRaw('section_id, item_index, item_type, label, target_url, COUNT(*) as aggregate_count')
            ->groupBy('section_id', 'item_index', 'item_type', 'label', 'target_url')
            ->orderByDesc('aggregate_count')
            ->limit($limit)
            ->get();
    }

    /**
     * Item mais clicado no período.
     */
    public function topClick(Bio $bio, Carbon $from, Carbon $to): ?object
    {
        return DB::table('analytics_events')
            ->where('bio_id', $bio->id)
            ->where('event_type', 'click')
            ->whereBetween('occurred_at', [$from, $to])
            ->selectRaw('label, item_type, target_url, COUNT(*) as aggregate_count')
            ->groupBy('label', 'item_type', 'target_url')
            ->orderByDesc('aggregate_count')
            ->first();
    }
}
