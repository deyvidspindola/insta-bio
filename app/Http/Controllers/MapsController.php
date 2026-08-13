<?php

namespace App\Http\Controllers;

use App\UseCases\Maps\ResolveMapsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Resolve endereço em URL de embed do Google Maps.
 */
class MapsController extends Controller
{
    /**
     * Aceita `url` ou `q` (GET/POST), como o editor V1.
     */
    public function resolve(Request $request, ResolveMapsQuery $useCase): JsonResponse
    {
        $q = (string) ($request->input('url') ?: $request->input('q') ?: $request->query('q', ''));

        return response()->json($useCase->execute($q));
    }
}
