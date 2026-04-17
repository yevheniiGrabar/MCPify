<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ServiceStatus;
use App\Models\ApiConfig;
use App\Models\Service;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class WorkerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withWorkerSecret('test-worker-secret');
    }

    private function workerHeaders(): array
    {
        return ['X-Worker-Secret' => 'test-worker-secret'];
    }

    // --- serviceConfig ---

    public function test_service_config_returns_config_for_valid_token(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->create([
            'team_id' => $team->id,
            'status' => ServiceStatus::Active,
        ]);
        ApiConfig::factory()->create([
            'service_id' => $service->id,
            'base_url' => 'https://api.example.com',
            'auth_type' => 'bearer',
        ]);

        $this->getJson("/api/v1/internal/service-config/{$service->mcp_url_token}", $this->workerHeaders())
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['service_id', 'service_name', 'base_url', 'auth_type', 'auth_config'],
            ])
            ->assertJsonPath('data.base_url', 'https://api.example.com');
    }

    public function test_service_config_returns_401_without_worker_secret(): void
    {
        $this->getJson('/api/v1/internal/service-config/sometoken')
            ->assertStatus(401);
    }

    public function test_service_config_returns_401_with_wrong_secret(): void
    {
        $this->getJson('/api/v1/internal/service-config/sometoken', ['X-Worker-Secret' => 'wrong'])
            ->assertStatus(401);
    }

    public function test_service_config_returns_404_for_unknown_token(): void
    {
        $this->getJson('/api/v1/internal/service-config/nonexistent-token', $this->workerHeaders())
            ->assertStatus(404);
    }

    public function test_service_config_returns_404_for_inactive_service(): void
    {
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->draft()->create(['team_id' => $team->id]);

        $this->getJson("/api/v1/internal/service-config/{$service->mcp_url_token}", $this->workerHeaders())
            ->assertStatus(404);
    }

    // --- recordToolCall ---

    public function test_record_tool_call_increments_counter_and_returns_allowed(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson('/api/v1/internal/tool-call', [
            'service_id' => $service->id,
        ], $this->workerHeaders())
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['allowed', 'calls_used', 'calls_limit'],
            ])
            ->assertJsonPath('data.allowed', true)
            ->assertJsonPath('data.calls_used', 1);
    }

    public function test_record_tool_call_returns_401_without_secret(): void
    {
        $this->postJson('/api/v1/internal/tool-call', ['service_id' => 1])
            ->assertStatus(401);
    }

    public function test_record_tool_call_returns_404_for_unknown_service(): void
    {
        $this->postJson('/api/v1/internal/tool-call', ['service_id' => 99999], $this->workerHeaders())
            ->assertStatus(404);
    }

    public function test_record_tool_call_returns_not_allowed_when_limit_exceeded(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->create(['team_id' => $team->id]);

        // Pre-fill the counter to exceed free plan limit (1000)
        $monthKey = now()->format('Y-m');
        $cacheKey = "calls:{$team->id}:{$monthKey}";
        Cache::put($cacheKey, 1001, 3600);

        $response = $this->postJson('/api/v1/internal/tool-call', [
            'service_id' => $service->id,
        ], $this->workerHeaders())->assertStatus(200);

        $this->assertFalse($response->json('data.allowed'));
    }

    // --- checkLimits ---

    public function test_check_limits_returns_allowed_for_valid_token(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->getJson("/api/v1/internal/check-limits/{$service->mcp_url_token}", $this->workerHeaders())
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['allowed', 'calls_used', 'calls_limit', 'plan'],
            ])
            ->assertJsonPath('data.allowed', true);
    }

    public function test_check_limits_returns_401_without_secret(): void
    {
        $this->getJson('/api/v1/internal/check-limits/sometoken')
            ->assertStatus(401);
    }

    public function test_check_limits_returns_404_for_unknown_token(): void
    {
        $this->getJson('/api/v1/internal/check-limits/nonexistent', $this->workerHeaders())
            ->assertStatus(404);
    }

    public function test_check_limits_reflects_current_cache_usage(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->createUserWithTeam();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $monthKey = now()->format('Y-m');
        Cache::put("calls:{$team->id}:{$monthKey}", 42, 3600);

        $response = $this->getJson("/api/v1/internal/check-limits/{$service->mcp_url_token}", $this->workerHeaders())
            ->assertStatus(200);

        $this->assertEquals(42, $response->json('data.calls_used'));
    }
}
