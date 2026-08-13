<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('/admin', [AdminController::class, 'page'])->name('admin');
    Route::get('/api/admin/bios', [AdminController::class, 'index']);
    Route::patch('/api/admin/bios/{bio}', [AdminController::class, 'update']);
    Route::post('/api/admin/bios/{bio}/impersonate', [AdminController::class, 'impersonate']);
    Route::post('/api/admin/stop-impersonating', [AdminController::class, 'stopImpersonating']);
});
