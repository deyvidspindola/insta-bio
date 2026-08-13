<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteMediaRequest;
use App\Services\MediaPayloadDecoder;
use App\UseCases\Media\DeleteMedia;
use App\UseCases\Media\ListMedia;
use App\UseCases\Media\UploadMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Upload, listagem e exclusão de imagens da bio.
 */
class MediaController extends Controller
{
    /**
     * Lista arquivos da bio.
     */
    public function index(Request $request, ListMedia $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Envia um arquivo (multipart ou base64).
     */
    public function store(Request $request, UploadMedia $useCase, MediaPayloadDecoder $decoder): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $decoder->requireFrom($request))
        );
    }

    /**
     * Remove um arquivo pelo nome.
     */
    public function destroy(DeleteMediaRequest $request, DeleteMedia $useCase): JsonResponse
    {
        $useCase->execute($this->actor($request), $request->fileName());

        return response()->json(['ok' => true]);
    }
}
