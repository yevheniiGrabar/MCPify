<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\Service;
use App\Services\OpenApiParser;
use Tests\TestCase;

class OpenApiParserTest extends TestCase
{
    private OpenApiParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = app(OpenApiParser::class);
    }

    private function makeService(): Service
    {
        [$user, $team] = $this->createUserWithTeam();

        return Service::factory()->create(['team_id' => $team->id]);
    }

    private function specJson(array $paths = []): string
    {
        return json_encode([
            'openapi' => '3.0.0',
            'info' => ['title' => 'Test', 'version' => '1.0'],
            'servers' => [['url' => 'https://api.example.com']],
            'paths' => $paths,
        ]);
    }

    public function test_parse_from_json_creates_tools(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/users' => [
                'get' => ['operationId' => 'listUsers', 'summary' => 'List users', 'responses' => ['200' => ['description' => 'OK']]],
            ],
        ]);

        $tools = $this->parser->parseFromJson($service, $json);

        $this->assertCount(1, $tools);
        $this->assertEquals('list_users', $tools[0]->name);
        $this->assertEquals('GET', $tools[0]->http_method);
        $this->assertEquals('/users', $tools[0]->endpoint_path);
    }

    public function test_parse_creates_tools_for_multiple_methods(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/items' => [
                'get' => ['operationId' => 'getItems', 'responses' => ['200' => ['description' => 'OK']]],
                'post' => ['operationId' => 'createItem', 'responses' => ['201' => ['description' => 'Created']]],
            ],
        ]);

        $tools = $this->parser->parseFromJson($service, $json);

        $this->assertCount(2, $tools);
        $names = collect($tools)->pluck('name')->toArray();
        $this->assertContains('get_items', $names);
        $this->assertContains('create_item', $names);
    }

    public function test_delete_tools_are_marked_destructive(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/users/{id}' => [
                'delete' => ['operationId' => 'deleteUser', 'responses' => ['204' => ['description' => 'Deleted']]],
            ],
        ]);

        $tools = $this->parser->parseFromJson($service, $json);

        $this->assertCount(1, $tools);
        $this->assertTrue($tools[0]->is_destructive);
        $this->assertFalse($tools[0]->is_enabled);
    }

    public function test_non_delete_tools_are_not_destructive(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/users' => [
                'get' => ['operationId' => 'getUsers', 'responses' => ['200' => ['description' => 'OK']]],
                'post' => ['operationId' => 'createUser', 'responses' => ['201' => ['description' => 'Created']]],
            ],
        ]);

        $tools = $this->parser->parseFromJson($service, $json);

        foreach ($tools as $tool) {
            $this->assertFalse($tool->is_destructive);
            $this->assertTrue($tool->is_enabled);
        }
    }

    public function test_tools_saved_to_database(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/products' => [
                'get' => ['operationId' => 'listProducts', 'responses' => ['200' => ['description' => 'OK']]],
            ],
        ]);

        $this->parser->parseFromJson($service, $json);

        $this->assertDatabaseHas('mcp_tools', [
            'service_id' => $service->id,
            'name' => 'list_products',
        ]);
    }

    public function test_parse_yaml_spec(): void
    {
        $service = $this->makeService();
        $yaml = <<<YAML
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0"
paths:
  /orders:
    get:
      operationId: listOrders
      summary: List orders
      responses:
        "200":
          description: OK
YAML;

        $tools = $this->parser->parseFromJson($service, $yaml);

        $this->assertCount(1, $tools);
        $this->assertEquals('list_orders', $tools[0]->name);
    }

    public function test_generates_operation_id_when_missing(): void
    {
        $service = $this->makeService();
        $json = $this->specJson([
            '/tags' => [
                'get' => ['summary' => 'List tags', 'responses' => ['200' => ['description' => 'OK']]],
            ],
        ]);

        $tools = $this->parser->parseFromJson($service, $json);

        $this->assertCount(1, $tools);
        $this->assertNotEmpty($tools[0]->name);
    }

    public function test_parse_from_json_throws_on_invalid_json(): void
    {
        $service = $this->makeService();

        $this->expectException(\Throwable::class);
        $this->parser->parseFromJson($service, 'not-valid-json-or-yaml!!{{}}');
    }
}
