<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBioFormRequest;
use App\Http\Requests\SaveBioFormRequest;
use App\UseCases\BioForm\CreateBioForm;
use App\UseCases\BioForm\DeleteBioForm;
use App\UseCases\BioForm\ListBioForms;
use App\UseCases\BioForm\PublishBioForm;
use App\UseCases\BioForm\SaveBioFormDraft;
use App\UseCases\BioForm\ShowPublicBioForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD de formulários reutilizáveis + endpoint público da definição.
 */
class BioFormController extends Controller
{
    public function index(Request $request, ListBioForms $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    public function store(CreateBioFormRequest $request, CreateBioForm $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $request->title(), $request->slug()),
            201,
        );
    }

    public function update(SaveBioFormRequest $request, string $slug, SaveBioFormDraft $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $slug, $request->draftPayload())
        );
    }

    public function publish(Request $request, string $slug, PublishBioForm $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $slug)
        );
    }

    public function destroy(Request $request, string $slug, DeleteBioForm $useCase): JsonResponse
    {
        $useCase->execute($this->actor($request), $slug);

        return response()->json(['ok' => true]);
    }

    /**
     * Definição publicada para renderizar na bio pública.
     */
    public function showPublic(Request $request, string $formSlug, ShowPublicBioForm $useCase): JsonResponse
    {
        $key = $request->query('analytics_key');
        $key = is_string($key) ? $key : '';
        $form = $useCase->execute($key, $formSlug);
        if ($form === null) {
            return response()->json(['message' => 'Formulário não encontrado.'], 404);
        }

        return response()->json($form);
    }
}
