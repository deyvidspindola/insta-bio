<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Evento de pageview ou clique da bio pública.
 *
 * @property int $id
 * @property int $bio_id
 * @property string $event_type
 */
#[Fillable([
    'bio_id',
    'event_type',
    'occurred_at',
    'visitor_id',
    'session_id',
    'path',
    'referrer',
    'section_id',
    'item_index',
    'item_type',
    'label',
    'target_url',
])]
class AnalyticsEvent extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'item_index' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Bio, $this>
     */
    public function bio(): BelongsTo
    {
        return $this->belongsTo(Bio::class);
    }
}
