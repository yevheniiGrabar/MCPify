<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Plan;
use App\Models\Plan as PlanModel;
use Illuminate\Support\Facades\Cache;

/**
 * Single source of truth for plan definitions, limits, and features.
 * Reads from the `plans` table (cached for 1 hour).
 * Used by BillingController, MCP tools, middleware, and actions.
 */
final class PlanService
{
    public function all(): array
    {
        return Cache::remember('plans.all', 3600, function (): array {
            return PlanModel::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn (PlanModel $plan): array => $this->toArray($plan))
                ->all();
        });
    }

    public function find(string $slug): ?array
    {
        return collect($this->all())->firstWhere('name', $slug);
    }

    public function forPlan(Plan $plan): array
    {
        return $this->find($plan->value) ?? $this->fallbackFree();
    }

    public function serviceLimit(Plan $plan): ?int
    {
        return $this->forPlan($plan)['limits']['services'];
    }

    public function callsLimit(Plan $plan): int
    {
        return $this->forPlan($plan)['limits']['calls_per_month'];
    }

    private function toArray(PlanModel $plan): array
    {
        return [
            'id'               => $plan->slug,
            'name'             => $plan->slug,
            'display_name'     => $plan->display_name,
            'price'            => $plan->price,
            'limits'           => [
                'services'        => $plan->services_limit,
                'calls_per_month' => $plan->calls_per_month,
            ],
            'features'         => $plan->features,
            'freemius_plan_id' => $plan->freemius_plan_id,
        ];
    }

    /** Fallback when DB is not yet seeded or plan slug is missing. */
    private function fallbackFree(): array
    {
        return [
            'id'               => 'free',
            'name'             => 'free',
            'display_name'     => 'Free',
            'price'            => 0,
            'limits'           => ['services' => 1, 'calls_per_month' => 1_000],
            'features'         => ['Basic auth', 'Community support'],
            'freemius_plan_id' => null,
        ];
    }
}
