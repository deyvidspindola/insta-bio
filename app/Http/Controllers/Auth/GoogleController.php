<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\UseCases\Auth\AuthenticateGoogleUser;
use App\UseCases\Auth\RedirectToGoogle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Login e cadastro via Google OAuth.
 */
class GoogleController extends Controller
{
    /**
     * Redireciona ao consentimento do Google.
     */
    public function redirect(RedirectToGoogle $useCase): RedirectResponse
    {
        return redirect()->away($useCase->execute());
    }

    /**
     * Conclui o OAuth e entra no app.
     */
    public function callback(Request $request, AuthenticateGoogleUser $useCase): RedirectResponse
    {
        $url = $useCase->execute();
        $request->session()->regenerate();

        return redirect()->to($url);
    }
}
