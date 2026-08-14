<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitFormRequest;
use App\UseCases\Forms\SubmitFormResponse;
use Illuminate\Http\JsonResponse;

/**
 * Envio público de respostas de formulários da bio.
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
}
