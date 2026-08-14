<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BioController;
use App\Http\Controllers\BioFormController;
use App\Http\Controllers\BioPageController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\LeadController;
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
Route::get('/api/public/forms/{formSlug}', [BioFormController::class, 'showPublic'])
    ->middleware('throttle:60,1')
    ->where('formSlug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
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
    Route::get('/api/leads', [LeadController::class, 'index']);
    Route::patch('/api/leads/{id}/stage', [LeadController::class, 'updateStage'])
        ->whereNumber('id');
    Route::patch('/api/leads/{id}/notes', [LeadController::class, 'updateNotes'])
        ->whereNumber('id');
    Route::delete('/api/leads/{id}', [LeadController::class, 'destroy'])
        ->whereNumber('id');
    Route::get('/api/bio/pages', [BioPageController::class, 'index']);
    Route::post('/api/bio/pages', [BioPageController::class, 'store']);
    Route::put('/api/bio/pages/{slug}', [BioPageController::class, 'update'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
    Route::post('/api/bio/pages/{slug}/publish', [BioPageController::class, 'publish'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
    Route::delete('/api/bio/pages/{slug}', [BioPageController::class, 'destroy'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
    Route::get('/api/bio/forms', [BioFormController::class, 'index']);
    Route::post('/api/bio/forms', [BioFormController::class, 'store']);
    Route::put('/api/bio/forms/{slug}', [BioFormController::class, 'update'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
    Route::post('/api/bio/forms/{slug}/publish', [BioFormController::class, 'publish'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
    Route::delete('/api/bio/forms/{slug}', [BioFormController::class, 'destroy'])
        ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
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

Route::get('/{slug}/{pageSlug}', [PublicBioController::class, 'showPage'])
    ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?')
    ->where('pageSlug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?')
    ->name('bio.page.show');

Route::get('/{slug}', [PublicBioController::class, 'show'])
    ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?')
    ->name('bio.show');
