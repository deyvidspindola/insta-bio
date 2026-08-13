<?php

namespace App\Http\Controllers;

use App\UseCases\Platform\ApplyUpdate;
use App\UseCases\Platform\CheckUpdate;
use App\UseCases\Platform\GetUpdateStatus;
use Illuminate\Http\JsonResponse;

/**
 * Endpoints de update remoto herdados da V1 (no-op na V2).
 */
class PlatformUpdateController extends Controller
{
    /**
     * Status gerenciado pela plataforma.
     */
    public function status(GetUpdateStatus $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }

    /**
     * Sempre informa que não há update.
     */
    public function check(CheckUpdate $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }

    /**
     * Recusado: a V2 não aplica updates remotos.
     */
    public function apply(ApplyUpdate $useCase): JsonResponse
    {
        $useCase->execute();

        return response()->json(['ok' => false], 410);
    }
}
