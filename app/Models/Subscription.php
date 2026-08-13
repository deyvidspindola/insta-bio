<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Assinatura Pro no Mercado Pago.
 *
 * @property int $id
 * @property int $bio_id
 * @property string|null $mp_preapproval_id
 * @property string $status
 */
#[Fillable(['bio_id', 'mp_preapproval_id', 'status', 'current_period_end', 'payload'])]
class Subscription extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'current_period_end' => 'datetime',
            'payload' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Bio, $this>
     */
    public function bio(): BelongsTo
    {
        return $this->belongsTo(Bio::class);
    }

    /**
     * Assinatura autorizada ou ativa no Mercado Pago.
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['authorized', 'active'], true);
    }
}
