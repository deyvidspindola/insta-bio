<?php

namespace App\Services;

use App\DTO\MediaUpload;
use App\Exceptions\ApplicationException;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

/**
 * Lê o arquivo enviado como multipart ou como JSON base64.
 */
class MediaPayloadDecoder
{
    /**
     * Extrai o binário da requisição ou falha com 422.
     */
    public function requireFrom(Request $request): MediaUpload
    {
        $upload = $this->fromRequest($request);
        if (! $upload instanceof MediaUpload) {
            throw new ApplicationException('Envie um arquivo.', 422);
        }

        return $upload;
    }

    /**
     * Tenta decodificar o upload; retorna null se nada foi enviado.
     */
    public function fromRequest(Request $request): ?MediaUpload
    {
        $file = $request->file('file');
        if ($file instanceof UploadedFile) {
            $realPath = $file->getRealPath();
            if ($realPath === false) {
                return null;
            }
            $binary = file_get_contents($realPath) ?: null;
            if ($binary === null) {
                return null;
            }

            return new MediaUpload(
                $binary,
                $file->getClientOriginalName(),
                $file->getMimeType() ?: 'application/octet-stream',
            );
        }

        if (! $request->filled('data')) {
            return null;
        }

        $raw = (string) $request->input('data');
        if (str_contains($raw, 'base64,')) {
            $raw = explode('base64,', $raw, 2)[1];
        }
        $binary = base64_decode($raw, true) ?: null;
        if ($binary === null) {
            return null;
        }

        return new MediaUpload(
            $binary,
            (string) $request->input('name', 'arquivo'),
            'application/octet-stream',
        );
    }
}
