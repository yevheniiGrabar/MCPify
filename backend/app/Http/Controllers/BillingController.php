<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Plan;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    /**
     * Plan definitions with Freemius plan IDs.
     */
    private function planDefinitions(): array
    {
        return [
            [
                'id' => 'free',
                'name' => 'free',
                'display_name' => 'Free',
                'price' => 0,
                'limits' => ['services' => 1, 'calls_per_month' => 1000],
                'features' => ['Basic auth', 'Community support'],
                'freemius_plan_id' => null,
            ],
            [
                'id' => 'starter',
                'name' => 'starter',
                'display_name' => 'Starter',
                'price' => 49,
                'limits' => ['services' => 3, 'calls_per_month' => 10000],
                'features' => ['All auth methods', 'Basic analytics', 'Email support'],
                'freemius_plan_id' => config('services.freemius.plan_starter'),
            ],
            [
                'id' => 'growth',
                'name' => 'growth',
                'display_name' => 'Growth',
                'price' => 149,
                'limits' => ['services' => 10, 'calls_per_month' => 100000],
                'features' => ['Advanced analytics', 'CSV exports', 'Priority support', 'Webhook notifications', 'Custom auth configs'],
                'freemius_plan_id' => config('services.freemius.plan_growth'),
            ],
            [
                'id' => 'business',
                'name' => 'business',
                'display_name' => 'Business',
                'price' => 399,
                'limits' => ['services' => null, 'calls_per_month' => 1000000],
                'features' => ['OAuth 2.0 support', 'White-label MCP endpoints', 'Audit logging', 'Dedicated support', 'SLA guarantee'],
                'freemius_plan_id' => config('services.freemius.plan_business'),
            ],
        ];
    }

    /**
     * GET /api/v1/billing/plans
     */
    public function plans(): JsonResponse
    {
        return response()->json(['data' => $this->planDefinitions()]);
    }

    /**
     * GET /api/v1/billing/checkout-config
     * Returns Freemius product/plan IDs + sandbox token for client-side checkout.
     */
    public function checkoutConfig(): JsonResponse
    {
        $productId = config('services.freemius.product_id');
        $publicKey = config('services.freemius.public_key');
        $secretKey = config('services.freemius.secret_key');

        // Generate sandbox token for test mode
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
                'plans' => collect($this->planDefinitions())
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
            $freePlan = $this->planDefinitions()[0];
            return response()->json([
                'data' => [
                    'id' => 'free',
                    'plan' => $freePlan,
                    'status' => 'active',
                    'current_period_start' => now()->startOfMonth()->toISOString(),
                    'current_period_end' => now()->endOfMonth()->toISOString(),
                    'cancel_at_period_end' => false,
                    'trial_ends_at' => null,
                    'freemius_subscription_id' => null,
                ],
            ]);
        }

        $planDef = collect($this->planDefinitions())
            ->firstWhere('name', $team->plan?->value ?? 'free');

        return response()->json([
            'data' => [
                'id' => $team->fs_subscription_id,
                'plan' => $planDef ?? $this->planDefinitions()[0],
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
        $planDef = collect($this->planDefinitions())->firstWhere('name', $plan->value);

        $servicesUsed = $team ? $team->services()->count() : 0;

        $monthKey = now()->format('Y-m');
        $callsUsed = (int) Cache::get("calls:{$team?->id}:{$monthKey}", 0);

        return response()->json([
            'data' => [
                'services_used' => $servicesUsed,
                'services_limit' => $planDef['limits']['services'] ?? null,
                'calls_used' => $callsUsed,
                'calls_limit' => $planDef['limits']['calls_per_month'] ?? null,
                'period_start' => now()->startOfMonth()->toISOString(),
                'period_end' => now()->endOfMonth()->toISOString(),
            ],
        ]);
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

        $payments = $response->json('payments', []);

        $invoices = collect($payments)->map(fn (array $payment) => [
            'id' => $payment['id'] ?? null,
            'amount' => (float) ($payment['gross'] ?? 0),
            'currency' => $payment['currency'] ?? 'USD',
            'status' => $payment['type'] ?? 'unknown',
            'created_at' => $payment['created'] ?? null,
            'invoice_url' => $payment['invoice_url'] ?? null,
        ])->values();

        return response()->json(['data' => $invoices]);
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

    /**
     * Make an authenticated Freemius API request using HMAC signature.
     */
    private function freemiusApiRequest(string $method, string $endpoint, array $params = []): \Illuminate\Http\Client\Response
    {
        $baseUrl = 'https://api.freemius.com';
        $secretKey = config('services.freemius.secret_key');
        $publicKey = config('services.freemius.public_key');

        $contentMd5 = '';
        $date = gmdate('r');
        $contentType = 'application/json';

        $stringToSign = implode("\n", [
            $method,
            $contentMd5,
            $contentType,
            $date,
            $endpoint,
        ]);

        $signature = base64_encode(hash_hmac('sha256', $stringToSign, $secretKey, true));
        $authHeader = "FS {$publicKey}:{$signature}";

        $request = Http::withHeaders([
            'Authorization' => $authHeader,
            'Date' => $date,
            'Content-Type' => $contentType,
        ]);

        $url = $baseUrl . $endpoint;

        return match ($method) {
            'GET' => $request->get($url, $params),
            'POST' => $request->post($url, $params),
            'PUT' => $request->put($url, $params),
            'DELETE' => $request->delete($url, $params),
            default => $request->get($url),
        };
    }
}
