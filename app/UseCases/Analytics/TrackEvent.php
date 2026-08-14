<?php

namespace App\UseCases\Analytics;

use App\Models\Bio;
use App\Repositories\AnalyticsRepository;
use App\Repositories\BioRepository;
use App\Repositories\LeadRepository;
use Illuminate\Support\Carbon;

/**
 * Registra pageview ou clique da bio pública (falha silenciosa se a bio não existir).
 */
final class TrackEvent
{
    public function __construct(
        private BioRepository $bios,
        private AnalyticsRepository $events,
        private LeadRepository $leads,
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

        if ($type === 'click' && ($meta['item_type'] ?? null) === 'whatsapp-hero') {
            $this->captureWhatsAppLead($bio, $payload, $meta);
        }
    }

    /**
     * Lead a partir de clique no WhatsApp hero (máx. 1 por visitante/bio/dia).
     *
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $meta
     */
    private function captureWhatsAppLead(Bio $bio, array $payload, array $meta): void
    {
        $visitorId = isset($payload['visitor_id']) && is_string($payload['visitor_id'])
            ? $payload['visitor_id']
            : '';

        if ($visitorId === '' || $this->leads->existsWhatsAppLeadToday($bio->id, $visitorId)) {
            return;
        }

        $label = $meta['label'] ?? null;

        $this->leads->create([
            'bio_id' => $bio->id,
            'name' => null,
            'contact' => null,
            'source_type' => 'whatsapp-hero',
            'source_label' => is_string($label) ? $label : null,
            'stage' => 'novo',
            'visitor_id' => $visitorId,
        ]);
    }
}
