<?php

declare(strict_types=1);

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\RegistryController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\Internal\WorkerController;
use App\Http\Controllers\FreemiusWebhookController;
use App\Http\Controllers\ServiceConnectorController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ToolController;
use Illuminate\Support\Facades\Route;

Route::get('v1/health', fn () => response()->json(['status' => 'ok']));

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

        // Billing
        Route::prefix('billing')->group(function (): void {
            Route::get('plans', [BillingController::class, 'plans']);
            Route::get('checkout-config', [BillingController::class, 'checkoutConfig']);
            Route::get('subscription', [BillingController::class, 'subscription']);
            Route::get('usage', [BillingController::class, 'usage']);
            Route::get('invoices', [BillingController::class, 'invoices']);
            Route::post('cancel', [BillingController::class, 'cancel']);
            Route::post('resume', [BillingController::class, 'resume']);
        });

        // Auth profile management
        Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);
        Route::delete('auth/account', [AuthController::class, 'deleteAccount']);
    });

    // Freemius webhook (public, verified by signature)
    Route::post('webhooks/freemius', [FreemiusWebhookController::class, 'handle']);

    // Internal routes (worker-to-backend, secured by X-Worker-Secret header + IP restriction)
    Route::prefix('internal')->middleware('worker.only')->group(function (): void {
        Route::get('service-config/{token}', [WorkerController::class, 'serviceConfig']);
        Route::post('tool-call', [WorkerController::class, 'recordToolCall']);
        Route::get('check-limits/{token}', [WorkerController::class, 'checkLimits']);
    });

    // Registry routes (public)
    Route::prefix('registry')->group(function () {
        Route::get('servers', [RegistryController::class, 'index']);
        Route::get('servers/{slug}', [RegistryController::class, 'show']);
        Route::get('categories', [RegistryController::class, 'categories']);
        Route::post('servers/{slug}/connect', [RegistryController::class, 'connect']);
        Route::post('servers', [RegistryController::class, 'store'])->middleware('auth:sanctum');
    });
});
