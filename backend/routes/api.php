<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Auth routes
    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    // Protected routes
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::apiResource('services', ServiceController::class);
    });
});
