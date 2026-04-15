<?php

declare(strict_types=1);

namespace App\Http\Controllers\Internal;

use App\Enums\Plan;
use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Team;
use App\Notifications\UsageLimitWarningNotification;
use App\Services\PlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WorkerController extends Controller
{
    public function __construct(
        private readonly PlanService $planService,
    ) {}

    public function serviceConfig(Request $request, string $token): JsonResponse
    {
        $workerSecret = config('services.mcp_worker.secret');
        if ($request->header('X-Worker-Secret') !== $workerSecret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::where('mcp_url_token', $token)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->with(['apiConfig', 'team'])
            ->first();

        if (! $service) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $apiConfig = $service->apiConfig;

        return response()->json([
            'data' => [
                'service_id' => $service->id,
                'service_name' => $service->name,
                'base_url' => $apiConfig?->base_url,
                'auth_type' => $apiConfig?->auth_type,
                'auth_config' => $apiConfig?->auth_config,
            ],
        ]);
    }

    /**
     * POST /api/v1/internal/tool-call
     * Increments the monthly call counter and sends usage warnings.
     */
    public function recordToolCall(Request $request): JsonResponse
    {
        $workerSecret = config('services.mcp_worker.secret');
        if ($request->header('X-Worker-Secret') !== $workerSecret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::with('team')->find($request->input('service_id'));

        if (! $service || ! $service->team) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $team = $service->team;
        $plan = $team->plan ?? Plan::Free;
        $maxCalls = $this->planService->callsLimit($plan);

        $monthKey = now()->format('Y-m');
        $cacheKey = "calls:{$team->id}:{$monthKey}";

        $currentCalls = (int) Cache::increment($cacheKey);

        // Set TTL only on the first increment
        if ($currentCalls === 1) {
            Cache::put($cacheKey, 1, (int) now()->endOfMonth()->diffInSeconds(now()));
        }

        $percentage = (int) round(($currentCalls / $maxCalls) * 100);
        $this->checkAndNotifyUsage($team, 'calls', $currentCalls, $maxCalls, $percentage, $monthKey);

        $isAllowed = $currentCalls <= $maxCalls || $this->isInGracePeriod($team);

        return response()->json([
            'data' => [
                'allowed' => $isAllowed,
                'calls_used' => $currentCalls,
                'calls_limit' => $maxCalls,
            ],
        ]);
    }

    /**
     * GET /api/v1/internal/check-limits/{token}
     * Pre-flight limit check before executing a tool call.
     */
    public function checkLimits(Request $request, string $token): JsonResponse
    {
        $workerSecret = config('services.mcp_worker.secret');
        if ($request->header('X-Worker-Secret') !== $workerSecret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::where('mcp_url_token', $token)->with('team')->first();

        if (! $service || ! $service->team) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $team = $service->team;
        $plan = $team->plan ?? Plan::Free;
        $maxCalls = $this->planService->callsLimit($plan);
        $currentCalls = (int) Cache::get("calls:{$team->id}:" . now()->format('Y-m'), 0);

        return response()->json([
            'data' => [
                'allowed' => $currentCalls < $maxCalls || $this->isInGracePeriod($team),
                'calls_used' => $currentCalls,
                'calls_limit' => $maxCalls,
                'plan' => $plan->value,
            ],
        ]);
    }

    private function isInGracePeriod(Team $team): bool
    {
        return $team->fs_subscription_status === 'past_due'
            && $team->fs_payment_failed_at !== null
            && $team->fs_payment_failed_at->diffInDays(now()) <= 3;
    }

    private function checkAndNotifyUsage(Team $team, string $resource, int $used, int $limit, int $percentage, string $monthKey): void
    {
        $owner = $team->owner;
        if (! $owner) {
            return;
        }

        foreach ([80, 100] as $threshold) {
            if ($percentage >= $threshold) {
                $notifKey = "usage_warning:{$team->id}:{$resource}:{$threshold}:{$monthKey}";

                if (! Cache::has($notifKey)) {
                    Cache::put($notifKey, true, now()->endOfMonth());
                    $owner->notify(new UsageLimitWarningNotification($team, $resource, $used, $limit, $threshold));
                }
            }
        }
    }
}
