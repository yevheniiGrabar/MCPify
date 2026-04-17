<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\McpTool;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<McpTool>
 */
class McpToolFactory extends Factory
{
    protected $model = McpTool::class;

    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'name' => fake()->word() . '_' . fake()->word(),
            'description' => fake()->sentence(),
            'http_method' => fake()->randomElement(['GET', 'POST', 'PUT', 'PATCH']),
            'endpoint_path' => '/api/' . fake()->word(),
            'input_schema' => ['type' => 'object', 'properties' => []],
            'output_schema' => null,
            'is_enabled' => true,
            'is_destructive' => false,
            'sort_order' => 0,
        ];
    }

    public function destructive(): static
    {
        return $this->state([
            'http_method' => 'DELETE',
            'is_destructive' => true,
            'is_enabled' => false,
        ]);
    }

    public function disabled(): static
    {
        return $this->state(['is_enabled' => false]);
    }
}
