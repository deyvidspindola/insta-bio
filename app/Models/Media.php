<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Arquivo de mídia armazenado em `storage/bios/{id}`.
 *
 * @property int $id
 * @property int $bio_id
 * @property string $name
 * @property string $path
 * @property int $size
 * @property string $mime
 */
#[Fillable(['bio_id', 'name', 'path', 'size', 'mime'])]
class Media extends Model
{
    /**
     * @return BelongsTo<Bio, $this>
     */
    public function bio(): BelongsTo
    {
        return $this->belongsTo(Bio::class);
    }

    /**
     * URL pública do arquivo no disco `public`.
     */
    public function publicUrl(): string
    {
        return asset('storage/'.$this->path);
    }
}
