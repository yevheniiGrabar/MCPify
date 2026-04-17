<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'slug' => 'free',
            'display_name' => 'Free',
            'price' => 0,
            'services_limit' => 1,
            'calls_per_month' => 1000,
            'features' => ['Basic auth', 'Community support'],
            'freemius_plan_id' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function starter(): static
    {
        return $this->state([
            'slug' => 'starter',
            'display_name' => 'Starter',
            'price' => 49,
            'services_limit' => 3,
            'calls_per_month' => 10000,
            'sort_order' => 1,
        ]);
    }

    public function growth(): static
    {
        return $this->state([
            'slug' => 'growth',
            'display_name' => 'Growth',
            'price' => 149,
            'services_limit' => 10,
            'calls_per_month' => 100000,
            'sort_order' => 2,
        ]);
    }

    public function business(): static
    {
        return $this->state([
            'slug' => 'business',
            'display_name' => 'Business',
            'price' => 399,
            'services_limit' => null,
            'calls_per_month' => 1000000,
            'sort_order' => 3,
        ]);
    }
}
