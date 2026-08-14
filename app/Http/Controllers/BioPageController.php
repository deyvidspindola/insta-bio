<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBioPageRequest;
use App\Http\Requests\SaveBioPageRequest;
use App\UseCases\BioPage\CreateBioPage;
use App\UseCases\BioPage\DeleteBioPage;
use App\UseCases\BioPage\ListBioPages;
use App\UseCases\BioPage\PublishBioPage;
use App\UseCases\BioPage\SaveBioPageDraft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD de páginas internas da bio (API do editor).
 */
class BioPageController extends Controller
{
    /**
     * Lista páginas da bio.
     */
    public function index(Request $request, ListBioPages $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Cria uma página interna.
     */
    public function store(CreateBioPageRequest $request, CreateBioPage $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $request->title(), $request->slug()),
            201,
        );
    }

    /**
     * Salva o rascunho da página.
     */
    public function update(SaveBioPageRequest $request, string $slug, SaveBioPageDraft $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $slug, $request->draftPayload())
        );
    }

    /**
     * Publica o rascunho da página.
     */
    public function publish(Request $request, string $slug, PublishBioPage $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $slug)
        );
    }

    /**
     * Remove a página.
     */
    public function destroy(Request $request, string $slug, DeleteBioPage $useCase): JsonResponse
    {
        $useCase->execute($this->actor($request), $slug);

        return response()->json(['ok' => true]);
    }
}
