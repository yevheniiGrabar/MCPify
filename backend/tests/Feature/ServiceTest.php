<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Plan;
use App\Models\Service;
use App\Models\Team;
use App\Models\User;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    public function test_index_returns_paginated_services(): void
    {
        [$user, $team] = $this->actingAsUser();
        Service::factory()->count(3)->create(['team_id' => $team->id]);

        $this->getJson('/api/v1/services')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_index_only_returns_own_team_services(): void
    {
        [$user, $team] = $this->actingAsUser();
        Service::factory()->count(2)->create(['team_id' => $team->id]);

        $otherTeam = Team::factory()->create();
        Service::factory()->count(3)->create(['team_id' => $otherTeam->id]);

        $this->getJson('/api/v1/services')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/v1/services')
            ->assertStatus(401);
    }

    public function test_store_creates_service(): void
    {
        $this->seedPlans();
        $this->actingAsUser();

        $this->postJson('/api/v1/services', [
            'name' => 'My API Service',
            'description' => 'Test description',
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'My API Service')
            ->assertJsonPath('data.description', 'Test description');

        $this->assertDatabaseHas('services', ['name' => 'My API Service']);
    }

    public function test_store_auto_creates_api_config(): void
    {
        $this->seedPlans();
        $this->actingAsUser();

        $response = $this->postJson('/api/v1/services', ['name' => 'Test Service']);
        $response->assertStatus(201);

        $service = Service::where('name', 'Test Service')->first();
        $this->assertNotNull($service->apiConfig);
    }

    public function test_store_validates_required_name(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/v1/services', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_enforces_free_plan_service_limit(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->actingAsUser(teamAttrs: ['plan' => Plan::Free]);
        // Free plan allows 1 service
        Service::factory()->create(['team_id' => $team->id]);

        $this->postJson('/api/v1/services', ['name' => 'Second Service'])
            ->assertStatus(403);
    }

    public function test_store_allows_unlimited_services_on_business_plan(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->actingAsUser(teamAttrs: ['plan' => Plan::Business]);
        Service::factory()->count(5)->create(['team_id' => $team->id]);

        $this->postJson('/api/v1/services', ['name' => 'Another Service'])
            ->assertStatus(201);
    }

    public function test_show_returns_service(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->getJson("/api/v1/services/{$service->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $service->id)
            ->assertJsonPath('data.name', $service->name);
    }

    public function test_show_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->getJson("/api/v1/services/{$other->id}")
            ->assertStatus(403);
    }

    public function test_update_modifies_service(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->putJson("/api/v1/services/{$service->id}", [
            'name' => 'Updated Name',
            'status' => 'active',
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        $this->assertDatabaseHas('services', ['id' => $service->id, 'name' => 'Updated Name']);
    }

    public function test_update_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->putJson("/api/v1/services/{$other->id}", ['name' => 'Hacked'])
            ->assertStatus(403);
    }

    public function test_destroy_soft_deletes_service(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->deleteJson("/api/v1/services/{$service->id}")
            ->assertStatus(204);

        $this->assertSoftDeleted('services', ['id' => $service->id]);
    }

    public function test_destroy_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->deleteJson("/api/v1/services/{$other->id}")
            ->assertStatus(403);
    }

    public function test_regenerate_token_creates_new_token(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $oldToken = $service->mcp_url_token;

        $this->postJson("/api/v1/services/{$service->id}/regenerate-token")
            ->assertStatus(200);

        $this->assertDatabaseMissing('services', ['id' => $service->id, 'mcp_url_token' => $oldToken]);
    }

    public function test_regenerate_token_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->postJson("/api/v1/services/{$other->id}/regenerate-token")
            ->assertStatus(403);
    }
}
