<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * Lê o payload de tracking (JSON ou form) enviado pela bio pública.
 */
class AnalyticsPayloadDecoder
{
    /**
     * @return array<string, mixed>
     */
    public function fromRequest(Request $request): array
    {
        $raw = $request->getContent();
        if ($raw !== '' && ! $request->isJson()) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return $request->all();
    }
}
