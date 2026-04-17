<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ApiConfig;
use App\Models\Service;
use Tests\TestCase;

class ServiceConnectorTest extends TestCase
{
    private function minimalOpenApiSpec(): string
    {
        return json_encode([
            'openapi' => '3.0.0',
            'info' => ['title' => 'Test API', 'version' => '1.0.0'],
            'paths' => [
                '/users' => [
                    'get' => [
                        'operationId' => 'getUsers',
                        'summary' => 'Get all users',
                        'responses' => ['200' => ['description' => 'Success']],
                    ],
                    'post' => [
                        'operationId' => 'createUser',
                        'summary' => 'Create a user',
                        'responses' => ['201' => ['description' => 'Created']],
                    ],
                ],
                '/users/{id}' => [
                    'delete' => [
                        'operationId' => 'deleteUser',
                        'summary' => 'Delete a user',
                        'responses' => ['204' => ['description' => 'Deleted']],
                    ],
                ],
            ],
        ]);
    }

    public function test_connect_openapi_creates_tools_from_spec_json(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/openapi", [
            'spec_json' => $this->minimalOpenApiSpec(),
        ])->assertStatus(201)
            ->assertJsonStructure([
                'data',
                'meta' => ['tools_created'],
            ]);

        $this->assertDatabaseHas('mcp_tools', ['service_id' => $service->id, 'name' => 'get_users']);
    }

    public function test_connect_openapi_marks_delete_tools_as_destructive(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/openapi", [
            'spec_json' => $this->minimalOpenApiSpec(),
        ])->assertStatus(201);

        $this->assertDatabaseHas('mcp_tools', [
            'service_id' => $service->id,
            'name' => 'delete_user',
            'is_destructive' => true,
            'is_enabled' => false,
        ]);
    }

    public function test_connect_openapi_clears_existing_tools(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        $service->tools()->create([
            'name' => 'old_tool',
            'http_method' => 'GET',
            'endpoint_path' => '/old',
        ]);

        $this->postJson("/api/v1/services/{$service->id}/connect/openapi", [
            'spec_json' => $this->minimalOpenApiSpec(),
        ])->assertStatus(201);

        $this->assertDatabaseMissing('mcp_tools', ['name' => 'old_tool', 'service_id' => $service->id]);
    }

    public function test_connect_openapi_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->postJson("/api/v1/services/{$other->id}/connect/openapi", [
            'spec_json' => $this->minimalOpenApiSpec(),
        ])->assertStatus(403);
    }

    public function test_connect_openapi_validates_url_or_spec_json_required(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/openapi", [])
            ->assertStatus(422);
    }

    public function test_connect_manual_creates_tool(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/manual", [
            'name' => 'get_products',
            'http_method' => 'GET',
            'endpoint_path' => '/api/products',
            'description' => 'Fetch all products',
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'get_products');

        $this->assertDatabaseHas('mcp_tools', [
            'service_id' => $service->id,
            'name' => 'get_products',
            'http_method' => 'GET',
        ]);
    }

    public function test_connect_manual_marks_delete_as_destructive(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/manual", [
            'name' => 'delete_user',
            'http_method' => 'DELETE',
            'endpoint_path' => '/api/users/{id}',
        ])->assertStatus(201);

        $this->assertDatabaseHas('mcp_tools', [
            'service_id' => $service->id,
            'name' => 'delete_user',
            'is_destructive' => true,
            'is_enabled' => false,
        ]);
    }

    public function test_connect_manual_validates_required_fields(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/manual", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'http_method', 'endpoint_path']);
    }

    public function test_connect_manual_validates_http_method(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->postJson("/api/v1/services/{$service->id}/connect/manual", [
            'name' => 'test_tool',
            'http_method' => 'INVALID',
            'endpoint_path' => '/api/test',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['http_method']);
    }

    public function test_connect_manual_returns_403_for_other_team_service(): void
    {
        $this->actingAsUser();
        $other = Service::factory()->create();

        $this->postJson("/api/v1/services/{$other->id}/connect/manual", [
            'name' => 'tool',
            'http_method' => 'GET',
            'endpoint_path' => '/api/tool',
        ])->assertStatus(403);
    }

    public function test_get_auth_returns_auth_config(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        ApiConfig::factory()->create(['service_id' => $service->id, 'auth_type' => 'bearer']);

        $this->getJson("/api/v1/services/{$service->id}/auth")
            ->assertStatus(200)
            ->assertJsonPath('data.auth_type', 'bearer');
    }

    public function test_update_auth_updates_auth_config(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);
        ApiConfig::factory()->create(['service_id' => $service->id]);

        $this->putJson("/api/v1/services/{$service->id}/auth", [
            'auth_type' => 'bearer',
            'auth_config' => ['token' => 'secret-token'],
        ])->assertStatus(200)
            ->assertJsonPath('data.auth_type', 'bearer')
            ->assertJsonPath('data.has_credentials', true);
    }

    public function test_update_auth_validates_auth_type(): void
    {
        [$user, $team] = $this->actingAsUser();
        $service = Service::factory()->create(['team_id' => $team->id]);

        $this->putJson("/api/v1/services/{$service->id}/auth", [
            'auth_type' => 'invalid_type',
        ])->assertStatus(422);
    }
}
