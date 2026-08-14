<?php

use App\Exceptions\ApplicationException;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureOnboarded;
use App\Http\Middleware\ResolveTenantHost;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')->group(base_path('routes/admin.php'));
            Route::middleware('web')->group(base_path('routes/bio.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'onboarded' => EnsureOnboarded::class,
            'admin' => EnsureAdmin::class,
        ]);
        $middleware->appendToGroup('web', ResolveTenantHost::class);
        $middleware->validateCsrfTokens(except: [
            'webhooks/mercadopago',
            'api/analytics/track',
            'api/public/forms/submit',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->is('webhooks/*') || $request->expectsJson(),
        );
        $exceptions->render(function (ApplicationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('webhooks/*')) {
                return response()->json(['error' => $e->getMessage()], $e->status());
            }

            if (in_array($e->status(), [404, 403, 410], true)) {
                abort($e->status(), $e->getMessage());
            }

            if ($request->isMethod('post') && ($request->is('login') || $request->is('cadastro'))) {
                return back()->withErrors(['email' => $e->getMessage()])->onlyInput('email');
            }

            return redirect()->route('login')->withErrors(['email' => $e->getMessage()]);
        });
    })->create();
