<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompleteOnboardingRequest;
use App\UseCases\Onboarding\CheckSlugAvailability;
use App\UseCases\Onboarding\CompleteOnboarding;
use App\UseCases\Onboarding\ShowOnboarding;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Onboarding: escolha de slug, layout e links iniciais.
 */
class OnboardingController extends Controller
{
    /**
     * SPA do onboarding, ou editor se a bio já existe.
     */
    public function show(Request $request, ShowOnboarding $useCase): View|RedirectResponse
    {
        $redirect = $useCase->execute($this->actor($request));
        if ($redirect !== null) {
            return redirect()->route($redirect);
        }

        return view('spa', ['entry' => 'app']);
    }

    /**
     * Cria a bio e devolve o redirect para o editor.
     */
    public function store(CompleteOnboardingRequest $request, CompleteOnboarding $useCase): JsonResponse
    {
        return response()->json($useCase->execute(
            $this->actor($request),
            $request->slug(),
            $request->themePackId(),
            $request->config(),
        ));
    }

    /**
     * Valida disponibilidade do slug em tempo real.
     */
    public function checkSlug(Request $request, CheckSlugAvailability $useCase): JsonResponse
    {
        return response()->json($useCase->execute((string) $request->query('slug', '')));
    }
}
