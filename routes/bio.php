<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BioController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\MapsController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PlatformUpdateController;
use App\Http\Controllers\PublicBioController;
use Illuminate\Support\Facades\Route;

Route::get('/api/auth/session', [BioController::class, 'session']);
Route::post('/api/analytics/track', [AnalyticsController::class, 'track']);
Route::post('/api/public/forms/submit', [FormController::class, 'submit'])
    ->middleware('throttle:20,1');
Route::post('/webhooks/mercadopago', [BillingController::class, 'webhook']);
Route::get('/api/public/bio/{slug}', [PublicBioController::class, 'json']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/api/onboarding', [OnboardingController::class, 'store']);
    Route::get('/api/onboarding/slug', [OnboardingController::class, 'checkSlug']);
});

Route::middleware(['auth', 'verified', 'onboarded'])->group(function () {
    Route::post('/api/auth/logout', [LoginController::class, 'destroy']);
    Route::get('/api/bio/load', [BioController::class, 'load']);
    Route::post('/api/bio/save', [BioController::class, 'save']);
    Route::post('/api/bio/publish', [BioController::class, 'publish']);
    Route::post('/api/bio/revert', [BioController::class, 'revert']);
    Route::post('/api/bio/restore-backup', [BioController::class, 'restoreBackup']);
    Route::get('/api/bio/paths', [BioController::class, 'paths']);
    Route::get('/api/assets/list', [MediaController::class, 'index']);
    Route::post('/api/assets/upload', [MediaController::class, 'store']);
    Route::post('/api/assets/delete', [MediaController::class, 'destroy']);
    Route::get('/api/billing', [BillingController::class, 'show']);
    Route::post('/api/billing/checkout', [BillingController::class, 'checkout']);
    Route::post('/api/billing/sandbox', [BillingController::class, 'sandbox']);
    Route::get('/api/forms/submissions', [FormController::class, 'index']);
    Route::get('/api/domain', [DomainController::class, 'show']);
    Route::post('/api/domain', [DomainController::class, 'store']);
    Route::post('/api/domain/verify', [DomainController::class, 'verify']);
    Route::delete('/api/domain', [DomainController::class, 'destroy']);
    Route::get('/api/analytics/summary', [AnalyticsController::class, 'summary']);
    Route::get('/api/analytics/timeseries', [AnalyticsController::class, 'timeseries']);
    Route::get('/api/analytics/clicks', [AnalyticsController::class, 'clicks']);
    Route::get('/api/update/status', [PlatformUpdateController::class, 'status']);
    Route::get('/api/update/check', [PlatformUpdateController::class, 'check']);
    Route::post('/api/update/apply', [PlatformUpdateController::class, 'apply']);
    Route::match(['get', 'post'], '/api/maps/resolve', [MapsController::class, 'resolve']);
});

Route::get('/{slug}', [PublicBioController::class, 'show'])
    ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?')
    ->name('bio.show');
