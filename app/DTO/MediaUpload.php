<?php

namespace App\DTO;

/**
 * Arquivo de mídia já decodificado, pronto para persistência.
 */
final readonly class MediaUpload
{
    /**
     * @param  string  $binary  Conteúdo bruto do arquivo
     * @param  string  $originalName  Nome original enviado pelo cliente
     * @param  string  $mime  MIME type informado ou detectado
     */
    public function __construct(
        public string $binary,
        public string $originalName,
        public string $mime,
    ) {}

    /**
     * Tamanho em bytes do conteúdo.
     */
    public function size(): int
    {
        return strlen($this->binary);
    }
}
