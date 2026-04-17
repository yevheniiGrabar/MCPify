<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\McpTool;
use App\Models\Service;
use App\Models\ToolCall;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ToolCall>
 */
class ToolCallFactory extends Factory
{
    protected $model = ToolCall::class;

    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'tool_id' => McpTool::factory(),
            'called_at' => now(),
            'duration_ms' => fake()->numberBetween(50, 2000),
            'input_params' => ['param' => 'value'],
            'response_status' => 200,
            'error_message' => null,
            'caller_ip' => fake()->ipv4(),
            'caller_user_agent' => fake()->userAgent(),
        ];
    }

    public function error(): static
    {
        return $this->state([
            'response_status' => fake()->randomElement([400, 422, 500]),
            'error_message' => fake()->sentence(),
        ]);
    }
}
