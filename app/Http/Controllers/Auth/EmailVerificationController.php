<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\UseCases\Auth\SendVerificationNotification;
use App\UseCases\Auth\VerifyEmail;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Verificação de e-mail após o cadastro.
 */
class EmailVerificationController extends Controller
{
    /**
     * Tela pedindo para confirmar o e-mail.
     */
    public function notice(): View
    {
        return view('spa', ['entry' => 'app']);
    }

    /**
     * Confirma o e-mail a partir do link assinado.
     */
    public function verify(EmailVerificationRequest $request, VerifyEmail $useCase): RedirectResponse
    {
        $useCase->execute($request);

        return redirect()->route('onboarding');
    }

    /**
     * Reenvia o e-mail de verificação.
     */
    public function send(Request $request, SendVerificationNotification $useCase): RedirectResponse
    {
        $useCase->execute($this->actor($request));

        return back()->with('status', 'verification-link-sent');
    }
}
