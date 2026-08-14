<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitFormRequest;
use App\UseCases\Forms\GetFormSubmissions;
use App\UseCases\Forms\SubmitFormResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Envio público e listagem de respostas de formulários.
 */
class FormController extends Controller
{
    /**
     * Recebe envio da bio pública.
     */
    public function submit(SubmitFormRequest $request, SubmitFormResponse $useCase): JsonResponse
    {
        $useCase->execute($request->validated(), $request->ip());

        return response()->json(['ok' => true]);
    }

    /**
     * Lista respostas para o dono da bio.
     */
    public function index(Request $request, GetFormSubmissions $useCase): JsonResponse
    {
        $sectionId = $request->query('section_id');
        $itemIndex = $request->query('item_index');

        return response()->json($useCase->execute(
            $this->actor($request),
            is_string($sectionId) && $sectionId !== '' ? $sectionId : null,
            is_numeric($itemIndex) ? (int) $itemIndex : null,
        ));
    }
}
