<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Plan;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'plan' => Plan::Free,
        ];
    }

    public function starter(): static
    {
        return $this->state(['plan' => Plan::Starter]);
    }

    public function growth(): static
    {
        return $this->state(['plan' => Plan::Growth]);
    }

    public function business(): static
    {
        return $this->state(['plan' => Plan::Business]);
    }
}
