<?php

use App\Http\Controllers\AppPageController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PublicBioController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicBioController::class, 'home'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/cadastro', [RegisterController::class, 'create'])->name('register');
    Route::post('/cadastro', [RegisterController::class, 'store']);
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});

Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
});

Route::middleware(['auth', 'verified', 'onboarded'])->group(function () {
    Route::get('/app', [AppPageController::class, 'editor'])->name('app.editor');
    Route::get('/app/preview', [AppPageController::class, 'preview'])->name('app.preview');
    Route::get('/app/configuracoes', [AppPageController::class, 'settings'])->name('app.settings');
});
