<?php

namespace App\Http\Controllers;

use App\Models\Bio;
use App\UseCases\PublicBio\GetPublishedBioJson;
use App\UseCases\PublicBio\ResolveHomePage;
use App\UseCases\PublicBio\ShowPublicBio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Landing, bio pública por slug e JSON publicado.
 */
class PublicBioController extends Controller
{
    /**
     * Home do produto ou bio do domínio próprio.
     */
    public function home(Request $request, ResolveHomePage $useCase): View
    {
        $tenant = $request->attributes->get('tenant_bio');
        $result = $useCase->execute($tenant instanceof Bio ? $tenant : null);

        return view($result['view'], $result['data']);
    }

    /**
     * Página pública `/{slug}`.
     */
    public function show(string $slug, ShowPublicBio $useCase): View
    {
        $result = $useCase->execute($slug);

        return view($result['view'], $result['data']);
    }

    /**
     * JSON publicado para o preview e a bio.
     */
    public function json(string $slug, GetPublishedBioJson $useCase): JsonResponse
    {
        return response()->json($useCase->execute($slug));
    }
}
