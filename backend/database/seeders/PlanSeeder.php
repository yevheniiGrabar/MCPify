<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug'             => 'free',
                'display_name'     => 'Free',
                'price'            => 0,
                'services_limit'   => 1,
                'calls_per_month'  => 1_000,
                'features'         => ['Basic auth', 'Community support'],
                'freemius_plan_id' => null,
                'is_active'        => true,
                'sort_order'       => 0,
            ],
            [
                'slug'             => 'starter',
                'display_name'     => 'Starter',
                'price'            => 49,
                'services_limit'   => 3,
                'calls_per_month'  => 10_000,
                'features'         => ['All auth methods', 'Basic analytics', 'Email support'],
                'freemius_plan_id' => null,
                'is_active'        => true,
                'sort_order'       => 1,
            ],
            [
                'slug'             => 'growth',
                'display_name'     => 'Growth',
                'price'            => 149,
                'services_limit'   => 10,
                'calls_per_month'  => 100_000,
                'features'         => ['Advanced analytics', 'CSV exports', 'Priority support', 'Webhook notifications', 'Custom auth configs'],
                'freemius_plan_id' => null,
                'is_active'        => true,
                'sort_order'       => 2,
            ],
            [
                'slug'             => 'business',
                'display_name'     => 'Business',
                'price'            => 399,
                'services_limit'   => null,
                'calls_per_month'  => 1_000_000,
                'features'         => ['OAuth 2.0 support', 'White-label MCP endpoints', 'Audit logging', 'Dedicated support', 'SLA guarantee'],
                'freemius_plan_id' => null,
                'is_active'        => true,
                'sort_order'       => 3,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(['slug' => $planData['slug']], $planData);
        }
    }
}
