<?php

namespace App\UseCases\Analytics;

use App\Models\Bio;
use App\Repositories\AnalyticsRepository;
use App\Repositories\BioRepository;
use Illuminate\Support\Carbon;

/**
 * Registra pageview ou clique da bio pública (falha silenciosa se a bio não existir).
 */
final class TrackEvent
{
    public function __construct(
        private BioRepository $bios,
        private AnalyticsRepository $events,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function execute(array $payload, string $fallbackPath, ?string $referrer): void
    {
        $key = $payload['analytics_key'] ?? null;
        $bio = is_string($key) && $key !== ''
            ? $this->bios->findByAnalyticsKey($key)
            : null;

        if (! $bio instanceof Bio || ! $bio->isActive()) {
            return;
        }

        $meta = is_array($payload['meta'] ?? null) ? $payload['meta'] : [];
        $type = ($payload['event_type'] ?? '') === 'click' ? 'click' : 'pageview';

        $this->events->create([
            'bio_id' => $bio->id,
            'event_type' => $type,
            'occurred_at' => isset($payload['occurred_at'])
                ? Carbon::parse($payload['occurred_at'])
                : now(),
            'visitor_id' => $payload['visitor_id'] ?? null,
            'session_id' => $payload['session_id'] ?? null,
            'path' => $payload['path'] ?? $fallbackPath,
            'referrer' => $payload['referrer'] ?? $referrer,
            'section_id' => $meta['section_id'] ?? null,
            'item_index' => $meta['item_index'] ?? null,
            'item_type' => $meta['item_type'] ?? null,
            'label' => $meta['label'] ?? null,
            'target_url' => $meta['url'] ?? null,
        ]);
    }
}
