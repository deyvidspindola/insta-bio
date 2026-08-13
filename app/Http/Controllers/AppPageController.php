<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

/**
 * Páginas SPA autenticadas (editor, preview, configurações).
 */
class AppPageController extends Controller
{
    /**
     * Editor da bio.
     */
    public function editor(): View
    {
        return view('spa', ['entry' => 'editor']);
    }

    /**
     * Preview isolado da bio.
     */
    public function preview(): View
    {
        return view('preview');
    }

    /**
     * Configurações (plano e domínio).
     */
    public function settings(): View
    {
        return view('spa', ['entry' => 'app']);
    }
}
