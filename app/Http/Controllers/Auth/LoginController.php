<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\UseCases\Auth\LoginUser;
use App\UseCases\Auth\LogoutUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Telas e ações de login/logout.
 */
class LoginController extends Controller
{
    /**
     * Formulário de login (SPA) ou redirect se já autenticado.
     */
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('app.editor');
        }

        return view('spa', ['entry' => 'app']);
    }

    /**
     * Autentica e redireciona para o editor ou onboarding.
     */
    public function store(LoginRequest $request, LoginUser $useCase): RedirectResponse
    {
        $url = $useCase->execute($request->email(), $request->password(), $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended($url);
    }

    /**
     * Encerra a sessão e volta ao login.
     */
    public function destroy(Request $request, LogoutUser $useCase): RedirectResponse
    {
        $useCase->execute();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
