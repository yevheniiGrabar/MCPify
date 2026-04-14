<?php

declare(strict_types=1);

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Internal\WorkerController;
use App\Http\Controllers\ServiceConnectorController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ToolController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Auth routes
    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->middleware('signed')
            ->name('verification.verify');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::post('email/resend', [AuthController::class, 'sendVerificationEmail'])
                ->middleware('throttle:6,1');
        });
    });

    // Protected routes
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::apiResource('services', ServiceController::class);
        Route::post('services/{service}/regenerate-token', [ServiceController::class, 'regenerateToken']);

        // Service connectors
        Route::post('services/{service}/connect/openapi', [ServiceConnectorController::class, 'connectOpenApi']);
        Route::post('services/{service}/connect/manual', [ServiceConnectorController::class, 'connectManual']);
        Route::get('services/{service}/auth', [ServiceConnectorController::class, 'getAuth']);
        Route::put('services/{service}/auth', [ServiceConnectorController::class, 'updateAuth']);

        // Tools
        Route::get('services/{service}/tools', [ToolController::class, 'index']);
        Route::patch('tools/{tool}', [ToolController::class, 'update']);
        Route::delete('tools/{tool}', [ToolController::class, 'destroy']);

        // Analytics
        Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
        Route::get('services/{service}/analytics', [AnalyticsController::class, 'serviceAnalytics']);
        Route::get('services/{service}/analytics/export', [AnalyticsController::class, 'exportCsv']);
        Route::get('services/{service}/audit-log', [AnalyticsController::class, 'auditLog']);
    });

    // Internal routes (worker-to-backend, secured by X-Worker-Secret header)
    Route::prefix('internal')->group(function (): void {
        Route::get('service-config/{token}', [WorkerController::class, 'serviceConfig']);
    });
});
