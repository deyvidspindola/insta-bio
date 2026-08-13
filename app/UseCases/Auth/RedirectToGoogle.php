<?php

namespace App\UseCases\Auth;

use App\Services\GoogleAuthService;

/**
 * Inicia o fluxo OAuth do Google.
 */
final class RedirectToGoogle
{
    public function __construct(private GoogleAuthService $google) {}

    /**
     * URL absoluta do consentimento Google.
     */
    public function execute(): string
    {
        return $this->google->redirectUrl();
    }
}
