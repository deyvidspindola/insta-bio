<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Prospect do funil da bio.
 *
 * Estágios: novo, contatado, negociando, fechado, perdido.
 *
 * @property int $id
 * @property int $bio_id
 * @property string|null $name
 * @property string|null $contact
 * @property string $source_type
 * @property string|null $source_label
 * @property string $stage
 * @property string|null $notes
 * @property string|null $visitor_id
 */
#[Fillable([
    'bio_id',
    'name',
    'contact',
    'source_type',
    'source_label',
    'stage',
    'notes',
    'visitor_id',
])]
class Lead extends Model
{
    /** Estágios permitidos do funil. */
    public const STAGES = [
        'novo',
        'contatado',
        'negociando',
        'fechado',
        'perdido',
    ];

    /**
     * @return BelongsTo<Bio, $this>
     */
    public function bio(): BelongsTo
    {
        return $this->belongsTo(Bio::class);
    }
}
