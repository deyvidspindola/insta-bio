<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Formulário reutilizável da bio (rascunho e publicado).
 *
 * @property int $id
 * @property int $bio_id
 * @property string $slug
 * @property string $title
 * @property array<string, mixed>|null $json_draft
 * @property array<string, mixed>|null $json_published
 * @property string $status
 */
#[Fillable([
    'bio_id',
    'slug',
    'title',
    'json_draft',
    'json_published',
    'status',
])]
class BioForm extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'json_draft' => 'array',
            'json_published' => 'array',
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
