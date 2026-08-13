<?php

namespace App\Http\Middleware;

use App\Repositories\BioRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exige que o usuário autenticado já tenha criado a bio.
 */
class EnsureOnboarded
{
    public function __construct(private BioRepository $bios) {}

    /**
     * Redireciona (ou 409 JSON) se o onboarding não foi concluído.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && ! $this->bios->existsForUser($user)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Complete o onboarding', 'redirect' => '/onboarding'], 409);
            }

            return redirect()->route('onboarding');
        }

        return $next($request);
    }
}
