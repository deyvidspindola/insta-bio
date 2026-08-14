<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Resposta enviada por um bloco de formulário da bio.
 *
 * @property int $id
 * @property int $bio_id
 * @property string $section_id
 * @property int $item_index
 * @property string|null $form_title
 * @property array<string, mixed> $answers
 * @property string|null $visitor_id
 * @property string|null $ip
 */
#[Fillable([
    'bio_id',
    'section_id',
    'item_index',
    'form_title',
    'answers',
    'visitor_id',
    'ip',
])]
class FormSubmission extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
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
