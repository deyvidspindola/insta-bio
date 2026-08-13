<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAdminBioRequest;
use App\Models\Bio;
use App\UseCases\Admin\ImpersonateUser;
use App\UseCases\Admin\ListBios;
use App\UseCases\Admin\StopImpersonating;
use App\UseCases\Admin\UpdateBio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Painel admin: listar bios, plano/status e impersonação.
 */
class AdminController extends Controller
{
    /**
     * SPA do admin.
     */
    public function page(): View
    {
        return view('spa', ['entry' => 'admin']);
    }

    /**
     * Lista bios com filtro opcional.
     */
    public function index(Request $request, ListBios $useCase): JsonResponse
    {
        $q = $request->query('q');

        return response()->json($useCase->execute(is_string($q) ? $q : ''));
    }

    /**
     * Atualiza plano ou status.
     */
    public function update(UpdateAdminBioRequest $request, Bio $bio, UpdateBio $useCase): JsonResponse
    {
        return response()->json($useCase->execute($bio, $request->attributesToUpdate()));
    }

    /**
     * Entra na conta do dono da bio.
     */
    public function impersonate(Request $request, Bio $bio, ImpersonateUser $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request), $bio));
    }

    /**
     * Volta para a conta admin.
     */
    public function stopImpersonating(StopImpersonating $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }
}
