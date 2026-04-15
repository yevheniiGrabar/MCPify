<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Plan;
use App\Services\PlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    public function __construct(
        private readonly PlanService $plans,
    ) {}

    /**
     * GET /api/v1/billing/plans
     */
    public function plans(): JsonResponse
    {
        return response()->json(['data' => $this->plans->all()]);
    }

    /**
     * GET /api/v1/billing/checkout-config
     */
    public function checkoutConfig(): JsonResponse
    {
        $productId = config('services.freemius.product_id');
        $publicKey = config('services.freemius.public_key');
        $secretKey = config('services.freemius.secret_key');

        $timestamp = time();
        $sandboxToken = md5($timestamp . $productId . $secretKey . $publicKey . 'checkout');

        return response()->json([
            'data' => [
                'product_id' => $productId,
                'public_key' => $publicKey,
                'sandbox' => app()->environment('local', 'staging') ? [
                    'token' => $sandboxToken,
                    'ctx' => (string) $timestamp,
                ] : null,
                'plans' => collect($this->plans->all())
                    ->filter(fn ($p) => $p['freemius_plan_id'] !== null)
                    ->map(fn ($p) => [
                        'name' => $p['name'],
                        'freemius_plan_id' => $p['freemius_plan_id'],
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * GET /api/v1/billing/subscription
     */
    public function subscription(Request $request): JsonResponse
    {
        $team = $request->user()->currentTeam;

        if (!$team || !$team->fs_subscription_id) {
            return response()->json([
                'data' => [
                    'id' => 'free',
                    'plan' => $this->plans->find('free'),
                    'status' => 'active',
                    'current_period_start' => now()->startOfMonth()->toISOString(),
                    'current_period_end' => now()->endOfMonth()->toISOString(),
                    'cancel_at_period_end' => false,
                    'trial_ends_at' => null,
                    'freemius_subscription_id' => null,
                ],
            ]);
        }

        $planDef = $this->plans->find($team->plan?->value ?? 'free');

        return response()->json([
            'data' => [
                'id' => $team->fs_subscription_id,
                'plan' => $planDef ?? $this->plans->find('free'),
                'status' => $team->fs_subscription_status ?? 'active',
                'current_period_start' => $team->fs_current_period_start?->toISOString(),
                'current_period_end' => $team->fs_current_period_end?->toISOString(),
                'cancel_at_period_end' => (bool) $team->fs_cancel_at_period_end,
                'trial_ends_at' => $team->fs_trial_ends_at?->toISOString(),
                'freemius_subscription_id' => $team->fs_subscription_id,
            ],
        ]);
    }

    /**
     * GET /api/v1/billing/usage
     */
    public function usage(Request $request): JsonResponse
    {
        $team = $request->user()->currentTeam;
        $plan = $team?->plan ?? Plan::Free;

        $servicesUsed = $team ? $team->services()->count() : 0;
        $monthKey = now()->format('Y-m');
        $callsUsed = (int) Cache::get("calls:{$team?->id}:{$monthKey}", 0);

        return response()->json([
            'data' => [
                'services_used' => $servicesUsed,
                'services_limit' => $this->plans->serviceLimit($plan),
                'calls_used' => $callsUsed,
                'calls_limit' => $this->plans->callsLimit($plan),
                'period_start' => now()->startOfMonth()->toISOString(),
                'period_end' => now()->endOfMonth()->toISOString(),
            ],
        ]);
    }

    /**
     * GET /api/v1/billing/invoices
     */
    public function invoices(Request $request): JsonResponse
    {
        $team = $request->user()->currentTeam;

        if (!$team?->fs_license_id) {
            return response()->json(['data' => []]);
        }

        $endpoint = '/v1/products/' . config('services.freemius.product_id')
            . '/licenses/' . $team->fs_license_id . '/payments.json';

        $response = $this->freemiusApiRequest('GET', $endpoint);

        if (!$response->successful()) {
            Log::warning('Freemius invoices fetch failed', ['response' => $response->body()]);
            return response()->json(['data' => []]);
        }

        $invoices = collect($response->json('payments', []))->map(fn (array $p) => [
            'id' => $p['id'] ?? null,
            'amount' => (float) ($p['gross'] ?? 0),
            'currency' => $p['currency'] ?? 'USD',
            'status' => $p['type'] ?? 'unknown',
            'created_at' => $p['created'] ?? null,
            'invoice_url' => $p['invoice_url'] ?? null,
        ])->values();

        return response()->json(['data' => $invoices]);
    }

    /**
     * POST /api/v1/billing/cancel
     */
    public function cancel(Request $request): JsonResponse
    {
        $team = $request->user()->currentTeam;

        if (!$team?->fs_subscription_id) {
            return response()->json(['message' => 'No active subscription'], 422);
        }

        $endpoint = '/v1/products/' . config('services.freemius.product_id')
            . '/subscriptions/' . $team->fs_subscription_id . '.json';

        $response = $this->freemiusApiRequest('DELETE', $endpoint);

        if (!$response->successful()) {
            Log::error('Freemius cancel failed', ['response' => $response->body()]);
            return response()->json(['message' => 'Failed to cancel subscription'], 422);
        }

        $team->update(['fs_cancel_at_period_end' => true]);

        return response()->json(['data' => ['message' => 'Subscription will cancel at end of period']]);
    }

    /**
     * POST /api/v1/billing/resume
     */
    public function resume(Request $request): JsonResponse
    {
        $team = $request->user()->currentTeam;

        if (!$team?->fs_subscription_id) {
            return response()->json(['message' => 'No active subscription'], 422);
        }

        $endpoint = '/v1/products/' . config('services.freemius.product_id')
            . '/subscriptions/' . $team->fs_subscription_id . '.json';

        $response = $this->freemiusApiRequest('PUT', $endpoint, ['is_active' => true]);

        if (!$response->successful()) {
            Log::error('Freemius resume failed', ['response' => $response->body()]);
            return response()->json(['message' => 'Failed to resume subscription'], 422);
        }

        $team->update([
            'fs_cancel_at_period_end' => false,
            'fs_subscription_status' => 'active',
            'fs_payment_failed_at' => null,
        ]);

        return response()->json(['data' => ['message' => 'Subscription resumed']]);
    }

    private function freemiusApiRequest(string $method, string $endpoint, array $params = []): \Illuminate\Http\Client\Response
    {
        $baseUrl = 'https://api.freemius.com';
        $secretKey = config('services.freemius.secret_key');
        $publicKey = config('services.freemius.public_key');

        $date = gmdate('r');
        $contentType = 'application/json';
        $stringToSign = implode("\n", [$method, '', $contentType, $date, $endpoint]);
        $signature = base64_encode(hash_hmac('sha256', $stringToSign, $secretKey, true));

        $req = Http::withHeaders([
            'Authorization' => "FS {$publicKey}:{$signature}",
            'Date' => $date,
            'Content-Type' => $contentType,
        ]);

        $url = $baseUrl . $endpoint;

        return match ($method) {
            'GET'    => $req->get($url, $params),
            'POST'   => $req->post($url, $params),
            'PUT'    => $req->put($url, $params),
            'DELETE' => $req->delete($url, $params),
            default  => $req->get($url),
        };
    }
}
