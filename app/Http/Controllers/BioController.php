<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveBioRequest;
use App\Services\BioConfigParser;
use App\UseCases\Bio\GetBioPaths;
use App\UseCases\Bio\GetSession;
use App\UseCases\Bio\LoadEditorBio;
use App\UseCases\Bio\PublishBio;
use App\UseCases\Bio\RestoreBioBackup;
use App\UseCases\Bio\RevertBioDraft;
use App\UseCases\Bio\SaveBioDraft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API do editor: sessão, rascunho, publicação e paths.
 */
class BioController extends Controller
{
    /**
     * Estado da sessão para o SPA.
     */
    public function session(Request $request, GetSession $useCase): JsonResponse
    {
        return response()->json($useCase->execute($request->user()));
    }

    /**
     * JSON atual do editor.
     */
    public function load(Request $request, LoadEditorBio $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Salva o rascunho.
     */
    public function save(SaveBioRequest $request, SaveBioDraft $useCase, BioConfigParser $parser): JsonResponse
    {
        $useCase->execute($this->actor($request), $request->config($parser));

        return response()->json(['ok' => true]);
    }

    /**
     * Publica o JSON e gera backup.
     */
    public function publish(SaveBioRequest $request, PublishBio $useCase, BioConfigParser $parser): JsonResponse
    {
        $useCase->execute($this->actor($request), $request->config($parser));

        return response()->json(['ok' => true]);
    }

    /**
     * Volta o rascunho para o publicado.
     */
    public function revert(Request $request, RevertBioDraft $useCase): JsonResponse
    {
        return response()->json(['config' => $useCase->execute($this->actor($request))]);
    }

    /**
     * Restaura o backup da última publicação.
     */
    public function restoreBackup(Request $request, RestoreBioBackup $useCase): JsonResponse
    {
        return response()->json(['config' => $useCase->execute($this->actor($request))]);
    }

    /**
     * Paths esperados pelo bootstrap do editor.
     */
    public function paths(Request $request, GetBioPaths $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }
}
