<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Plan;

/**
 * Single source of truth for plan definitions, limits, and features.
 * Used by BillingController, MCP tools, middleware, and actions.
 */
final class PlanService
{
    public function all(): array
    {
        return [
            [
                'id'               => 'free',
                'name'             => 'free',
                'display_name'     => 'Free',
                'price'            => 0,
                'limits'           => ['services' => 1, 'calls_per_month' => 1_000],
                'features'         => ['Basic auth', 'Community support'],
                'freemius_plan_id' => null,
            ],
            [
                'id'               => 'starter',
                'name'             => 'starter',
                'display_name'     => 'Starter',
                'price'            => 49,
                'limits'           => ['services' => 3, 'calls_per_month' => 10_000],
                'features'         => ['All auth methods', 'Basic analytics', 'Email support'],
                'freemius_plan_id' => config('services.freemius.plan_starter'),
            ],
            [
                'id'               => 'growth',
                'name'             => 'growth',
                'display_name'     => 'Growth',
                'price'            => 149,
                'limits'           => ['services' => 10, 'calls_per_month' => 100_000],
                'features'         => ['Advanced analytics', 'CSV exports', 'Priority support', 'Webhook notifications', 'Custom auth configs'],
                'freemius_plan_id' => config('services.freemius.plan_growth'),
            ],
            [
                'id'               => 'business',
                'name'             => 'business',
                'display_name'     => 'Business',
                'price'            => 399,
                'limits'           => ['services' => null, 'calls_per_month' => 1_000_000],
                'features'         => ['OAuth 2.0 support', 'White-label MCP endpoints', 'Audit logging', 'Dedicated support', 'SLA guarantee'],
                'freemius_plan_id' => config('services.freemius.plan_business'),
            ],
        ];
    }

    public function find(string $name): ?array
    {
        return collect($this->all())->firstWhere('name', $name);
    }

    public function forPlan(Plan $plan): array
    {
        return $this->find($plan->value) ?? $this->find('free');
    }

    public function serviceLimit(Plan $plan): ?int
    {
        return $this->forPlan($plan)['limits']['services'];
    }

    public function callsLimit(Plan $plan): int
    {
        return $this->forPlan($plan)['limits']['calls_per_month'];
    }
}
