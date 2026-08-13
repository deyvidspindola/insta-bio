<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDomainRequest;
use App\UseCases\Domain\DeleteCustomDomain;
use App\UseCases\Domain\GetCustomDomain;
use App\UseCases\Domain\SaveCustomDomain;
use App\UseCases\Domain\VerifyCustomDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Domínio próprio da bio (recurso Pro).
 */
class DomainController extends Controller
{
    /**
     * Estado atual do domínio.
     */
    public function show(Request $request, GetCustomDomain $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Cadastra ou substitui o domínio.
     */
    public function store(StoreDomainRequest $request, SaveCustomDomain $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request), $request->domain()));
    }

    /**
     * Confere DNS (CNAME ou TXT).
     */
    public function verify(Request $request, VerifyCustomDomain $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Remove o domínio cadastrado.
     */
    public function destroy(Request $request, DeleteCustomDomain $useCase): JsonResponse
    {
        $useCase->execute($this->actor($request));

        return response()->json(['ok' => true]);
    }
}
