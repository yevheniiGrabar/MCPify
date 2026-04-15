<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Plan;
use App\Services\PlanService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class CheckPlanLimits
{
    public function __construct(
        private readonly PlanService $planService,
    ) {}

    public function handle(Request $request, Closure $next, string $resource = 'services'): Response
    {
        $team = $request->user()?->currentTeam;

        if (! $team) {
            return response()->json(['message' => 'No team found'], 403);
        }

        $isGracePeriod = $team->fs_subscription_status === 'past_due'
            && $team->fs_payment_failed_at
            && $team->fs_payment_failed_at->diffInDays(now()) <= 3;

        $plan = $team->plan ?? Plan::Free;

        if ($resource === 'services') {
            $maxServices = $this->planService->serviceLimit($plan);

            if ($maxServices !== null) {
                $currentCount = $team->services()->count();

                if ($currentCount >= $maxServices) {
                    return response()->json([
                        'message' => 'Service limit reached. Please upgrade your plan.',
                        'error' => 'plan_limit_exceeded',
                        'meta' => ['resource' => 'services', 'current' => $currentCount, 'limit' => $maxServices, 'plan' => $plan->value],
                    ], 403);
                }
            }
        }

        if ($resource === 'calls') {
            $maxCalls = $this->planService->callsLimit($plan);

            if (! $isGracePeriod) {
                $monthKey = now()->format('Y-m');
                $currentCalls = (int) cache()->get("calls:{$team->id}:{$monthKey}", 0);

                if ($currentCalls >= $maxCalls) {
                    return response()->json([
                        'message' => 'Monthly call limit reached. Please upgrade your plan.',
                        'error' => 'plan_limit_exceeded',
                        'meta' => ['resource' => 'calls', 'current' => $currentCalls, 'limit' => $maxCalls, 'plan' => $plan->value],
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
