<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ServiceConnectorController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ToolController;
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

        // Service connectors
        Route::post('services/{service}/connect/openapi', [ServiceConnectorController::class, 'connectOpenApi']);
        Route::post('services/{service}/connect/manual', [ServiceConnectorController::class, 'connectManual']);

        // Tools
        Route::get('services/{service}/tools', [ToolController::class, 'index']);
        Route::patch('tools/{tool}', [ToolController::class, 'update']);
        Route::delete('tools/{tool}', [ToolController::class, 'destroy']);
    });
});
