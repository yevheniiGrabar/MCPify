<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\McpTool;
use App\Models\Service;
use App\Models\ToolCall;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    public function test_summary_returns_correct_structure(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/v1/analytics/summary')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_calls',
                    'month_calls',
                    'avg_response_ms',
                    'total_tools',
                    'enabled_tools',
                    'error_rate',
                ],
            ]);
    }

    public function test_summary_counts_only_own_team_calls(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);
        ToolCall::factory()->count(5)->create(['service_id' => $service->id, 'tool_id' => $tool->id]);

        // Calls for another team (should not be counted)
        $other = Service::factory()->create();
        $otherTool = McpTool::factory()->create(['service_id' => $other->id]);
        ToolCall::factory()->count(3)->create(['service_id' => $other->id, 'tool_id' => $otherTool->id]);

        $response = $this->getJson('/api/v1/analytics/summary')->assertStatus(200);
        $this->assertEquals(5, $response->json('data.total_calls'));
    }

    public function test_summary_calculates_error_rate(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);

        ToolCall::factory()->count(8)->create([
            'service_id' => $service->id,
            'tool_id' => $tool->id,
            'response_status' => 200,
            'created_at' => now(),
        ]);
        ToolCall::factory()->count(2)->create([
            'service_id' => $service->id,
            'tool_id' => $tool->id,
            'response_status' => 500,
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/analytics/summary')->assertStatus(200);
        $this->assertEquals(20.0, $response->json('data.error_rate'));
    }

    public function test_summary_requires_authentication(): void
    {
        $this->getJson('/api/v1/analytics/summary')
            ->assertStatus(401);
    }

    /**
     * AnalyticsController::serviceAnalytics uses HAVING on a sub-select which is
     * unsupported by SQLite (test driver). These tests require PostgreSQL.
     */
    private function skipOnSQLite(): void
    {
        if (config('database.default') === 'sqlite') {
            $this->markTestSkipped('Requires PostgreSQL — SQLite does not support HAVING on sub-selects.');
        }
    }

    public function test_service_analytics_returns_correct_structure(): void
    {
        $this->skipOnSQLite();

        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->getJson("/api/v1/services/{$service->id}/analytics")
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_calls',
                    'error_calls',
                    'error_rate',
                    'avg_duration_ms',
                    'p50_duration_ms',
                    'p95_duration_ms',
                    'p99_duration_ms',
                    'chart',
                    'tool_stats',
                    'recent_errors',
                ],
            ]);
    }

    public function test_service_analytics_returns_403_for_other_team(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->getJson("/api/v1/services/{$other->id}/analytics")
            ->assertStatus(403);
    }

    public function test_service_analytics_supports_date_ranges(): void
    {
        $this->skipOnSQLite();

        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        foreach (['7d', '30d', '90d'] as $range) {
            $this->getJson("/api/v1/services/{$service->id}/analytics?range={$range}")
                ->assertStatus(200);
        }
    }

    public function test_service_analytics_counts_calls_and_errors(): void
    {
        $this->skipOnSQLite();

        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);

        ToolCall::factory()->count(4)->create(['service_id' => $service->id, 'tool_id' => $tool->id, 'response_status' => 200, 'called_at' => now()]);
        ToolCall::factory()->count(1)->create(['service_id' => $service->id, 'tool_id' => $tool->id, 'response_status' => 500, 'called_at' => now()]);

        $response = $this->getJson("/api/v1/services/{$service->id}/analytics?range=7d")
            ->assertStatus(200);

        $this->assertEquals(5, $response->json('data.total_calls'));
        $this->assertEquals(1, $response->json('data.error_calls'));
    }

    public function test_audit_log_returns_paginated_calls(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);
        ToolCall::factory()->count(5)->create(['service_id' => $service->id, 'tool_id' => $tool->id]);

        $this->getJson("/api/v1/services/{$service->id}/audit-log")
            ->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => ['total', 'per_page', 'current_page'],
            ])
            ->assertJsonPath('meta.total', 5);
    }

    public function test_audit_log_returns_403_for_other_team(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->getJson("/api/v1/services/{$other->id}/audit-log")
            ->assertStatus(403);
    }

    public function test_export_csv_returns_csv_response(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);
        ToolCall::factory()->count(3)->create(['service_id' => $service->id, 'tool_id' => $tool->id, 'called_at' => now()]);

        $response = $this->get("/api/v1/services/{$service->id}/analytics/export?range=7d");
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    public function test_export_csv_returns_403_for_other_team(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->get("/api/v1/services/{$other->id}/analytics/export")
            ->assertStatus(403);
    }
}
