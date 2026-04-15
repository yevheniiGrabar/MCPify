<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Plan;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that enforces plan limits (service count & monthly call quota).
 * Attach to routes that create services or consume call quota.
 *
 * Usage in routes:
 *   ->middleware('plan.limits:services')   — check service count
 *   ->middleware('plan.limits:calls')      — check monthly calls
 */
final class CheckPlanLimits
{
    private const PLAN_LIMITS = [
        'free' => ['services' => 1, 'calls_per_month' => 1_000],
        'starter' => ['services' => 3, 'calls_per_month' => 10_000],
        'growth' => ['services' => 10, 'calls_per_month' => 100_000],
        'business' => ['services' => null, 'calls_per_month' => 1_000_000],
    ];

    public function handle(Request $request, Closure $next, string $resource = 'services'): Response
    {
        $team = $request->user()?->currentTeam;

        if (! $team) {
            return response()->json(['message' => 'No team found'], 403);
        }

        // Allow access during grace period (3 days after payment failure)
        $isGracePeriod = $team->fs_subscription_status === 'past_due'
            && $team->fs_payment_failed_at
            && $team->fs_payment_failed_at->diffInDays(now()) <= 3;

        $plan = $team->plan ?? Plan::Free;
        $limits = self::PLAN_LIMITS[$plan->value] ?? self::PLAN_LIMITS['free'];

        if ($resource === 'services') {
            $maxServices = $limits['services'];

            // null means unlimited
            if ($maxServices !== null) {
                $currentCount = $team->services()->count();

                if ($currentCount >= $maxServices) {
                    return response()->json([
                        'message' => 'Service limit reached. Please upgrade your plan.',
                        'error' => 'plan_limit_exceeded',
                        'meta' => [
                            'resource' => 'services',
                            'current' => $currentCount,
                            'limit' => $maxServices,
                            'plan' => $plan->value,
                        ],
                    ], 403);
                }
            }
        }

        if ($resource === 'calls') {
            $maxCalls = $limits['calls_per_month'];

            if ($maxCalls !== null && ! $isGracePeriod) {
                $monthKey = now()->format('Y-m');
                $currentCalls = (int) cache()->get("calls:{$team->id}:{$monthKey}", 0);

                if ($currentCalls >= $maxCalls) {
                    return response()->json([
                        'message' => 'Monthly call limit reached. Please upgrade your plan.',
                        'error' => 'plan_limit_exceeded',
                        'meta' => [
                            'resource' => 'calls',
                            'current' => $currentCalls,
                            'limit' => $maxCalls,
                            'plan' => $plan->value,
                        ],
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
