<?php

namespace App\Services;

use App\Models\Bio;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Grava e apaga arquivos no disco público `storage/bios/{id}`.
 */
class MediaStorageService
{
    /**
     * Persiste o binário e devolve o caminho relativo no disco public.
     */
    public function store(Bio $bio, string $originalName, string $binary): string
    {
        $safe = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'arquivo';
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION) ?: 'bin');
        $name = $safe.'-'.Str::lower(Str::random(6)).'.'.$ext;
        $path = 'bios/'.$bio->id.'/'.$name;
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    /**
     * Nome do arquivo a partir do caminho relativo.
     */
    public function basename(string $path): string
    {
        return basename($path);
    }

    /**
     * Remove o arquivo do disco público.
     */
    public function delete(string $path): void
    {
        Storage::disk('public')->delete($path);
    }
}
