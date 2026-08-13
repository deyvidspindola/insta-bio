<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Domínio próprio apontando para a bio (CNAME/TXT).
 *
 * @property int $id
 * @property int $bio_id
 * @property string $domain
 * @property string $verification_token
 * @property Carbon|null $verified_at
 */
#[Fillable(['bio_id', 'domain', 'verification_token', 'verified_at'])]
class CustomDomain extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
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
     * DNS já confirmado (CNAME ou TXT).
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
