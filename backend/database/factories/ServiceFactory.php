<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ServiceStatus;
use App\Models\Service;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'status' => ServiceStatus::Active,
            'mcp_url_token' => Str::random(64),
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => ServiceStatus::Draft]);
    }

    public function active(): static
    {
        return $this->state(['status' => ServiceStatus::Active]);
    }
}
