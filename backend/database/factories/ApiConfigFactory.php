<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ApiConfig;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApiConfig>
 */
class ApiConfigFactory extends Factory
{
    protected $model = ApiConfig::class;

    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'type' => 'manual',
            'base_url' => fake()->url(),
            'auth_type' => 'none',
            'auth_config' => null,
            'openapi_spec_url' => null,
            'openapi_spec_json' => null,
        ];
    }

    public function bearer(): static
    {
        return $this->state([
            'auth_type' => 'bearer',
            'auth_config' => ['token' => 'test-token'],
        ]);
    }
}
