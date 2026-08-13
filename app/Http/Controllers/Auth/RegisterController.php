<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\UseCases\Auth\RegisterUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Cadastro por e-mail e senha.
 */
class RegisterController extends Controller
{
    /**
     * Formulário de cadastro (SPA) ou redirect se já autenticado.
     */
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('app.editor');
        }

        return view('spa', ['entry' => 'app']);
    }

    /**
     * Cria a conta e envia o usuário para verificar o e-mail.
     */
    public function store(RegisterRequest $request, RegisterUser $useCase): RedirectResponse
    {
        $useCase->execute($request->name(), $request->email(), $request->password());
        $request->session()->regenerate();

        return redirect()->route('verification.notice');
    }
}
