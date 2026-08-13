<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Normalização e validação do slug público da bio.
 */
class SlugService
{
    /**
     * Converte o texto em slug ASCII minúsculo com hífens.
     */
    public function normalize(string $input): string
    {
        return Str::of($input)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '-')
            ->replaceMatches('/-+/', '-')
            ->trim('-')
            ->toString();
    }

    /**
     * Valida tamanho, formato e lista de slugs reservados.
     *
     * @return string|null Mensagem de erro ou null se válido
     */
    public function validate(string $slug): ?string
    {
        $value = $this->normalize($slug);

        if (strlen($value) < 3) {
            return 'Slug deve ter pelo menos 3 caracteres';
        }
        if (strlen($value) > 40) {
            return 'Slug deve ter no máximo 40 caracteres';
        }
        if (! preg_match('/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/', $value)) {
            return 'Use apenas letras minúsculas, números e hífen (sem começar/terminar com hífen)';
        }
        if ($this->isReserved($value)) {
            return 'Este slug está reservado pelo sistema';
        }

        return null;
    }

    /**
     * Indica se o slug está na lista reservada (admin, app, login, etc.).
     */
    public function isReserved(string $slug): bool
    {
        $reserved = array_map('strval', config('linksnabio.reserved_slugs', []));

        return in_array($slug, $reserved, true);
    }
}
