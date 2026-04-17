<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\McpTool;
use App\Models\Service;
use Tests\TestCase;

class ToolTest extends TestCase
{
    public function test_index_returns_tools_for_service(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        McpTool::factory()->count(3)->create(['service_id' => $service->id]);

        $this->getJson("/api/v1/services/{$service->id}/tools")
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_index_orders_by_sort_order(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        McpTool::factory()->create(['service_id' => $service->id, 'name' => 'third', 'sort_order' => 2]);
        McpTool::factory()->create(['service_id' => $service->id, 'name' => 'first', 'sort_order' => 0]);
        McpTool::factory()->create(['service_id' => $service->id, 'name' => 'second', 'sort_order' => 1]);

        $response = $this->getJson("/api/v1/services/{$service->id}/tools")
            ->assertStatus(200);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertEquals(['first', 'second', 'third'], $names);
    }

    public function test_index_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->getJson("/api/v1/services/{$other->id}/tools")
            ->assertStatus(403);
    }

    public function test_update_modifies_tool(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);

        $this->patchJson("/api/v1/tools/{$tool->id}", [
            'name' => 'updated_name',
            'description' => 'New description',
            'is_enabled' => false,
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'updated_name')
            ->assertJsonPath('data.description', 'New description');

        $this->assertDatabaseHas('mcp_tools', [
            'id' => $tool->id,
            'name' => 'updated_name',
            'is_enabled' => false,
        ]);
    }

    public function test_update_returns_403_for_other_team_tool(): void
    {
        $this->actingAsUser();
        $other = McpTool::factory()->create();

        $this->patchJson("/api/v1/tools/{$other->id}", ['name' => 'hacked'])
            ->assertStatus(403);
    }

    public function test_update_validates_fields(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);

        $this->patchJson("/api/v1/tools/{$tool->id}", [
            'is_enabled' => 'not-a-boolean',
        ])->assertStatus(422);
    }

    public function test_destroy_deletes_tool(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->create(['service_id' => $service->id]);

        $this->deleteJson("/api/v1/tools/{$tool->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('mcp_tools', ['id' => $tool->id]);
    }

    public function test_destroy_returns_403_for_other_team_tool(): void
    {
        $this->actingAsUser();
        $other = McpTool::factory()->create();

        $this->deleteJson("/api/v1/tools/{$other->id}")
            ->assertStatus(403);
    }

    public function test_enable_destructive_tool(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $tool = McpTool::factory()->destructive()->create(['service_id' => $service->id]);

        $this->patchJson("/api/v1/tools/{$tool->id}", ['is_enabled' => true])
            ->assertStatus(200)
            ->assertJsonPath('data.is_enabled', true);
    }
}
