<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Services\CreateServiceAction;
use App\Enums\Plan;
use App\Models\Service;
use App\Models\Team;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CreateServiceActionTest extends TestCase
{
    private CreateServiceAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPlans();
        $this->action = app(CreateServiceAction::class);
    }

    public function test_creates_service_with_name_and_description(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Starter]);

        $service = $this->action->execute($team, 'My Service', 'A description');

        $this->assertInstanceOf(Service::class, $service);
        $this->assertEquals('My Service', $service->name);
        $this->assertEquals('A description', $service->description);
        $this->assertEquals($team->id, $service->team_id);
    }

    public function test_auto_generates_uuid_and_token(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Starter]);

        $service = $this->action->execute($team, 'Test');

        $this->assertNotNull($service->uuid);
        $this->assertNotNull($service->mcp_url_token);
        $this->assertEquals(64, strlen($service->mcp_url_token));
    }

    public function test_auto_creates_api_config(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Starter]);

        $service = $this->action->execute($team, 'Test Service');

        $this->assertTrue($service->relationLoaded('apiConfig'));
        $this->assertNotNull($service->apiConfig);
    }

    public function test_enforces_free_plan_limit_of_one_service(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Free]);
        Service::factory()->create(['team_id' => $team->id]);

        $this->expectException(ValidationException::class);
        $this->action->execute($team, 'Second Service');
    }

    public function test_enforces_starter_plan_limit_of_three_services(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Starter]);
        Service::factory()->count(3)->create(['team_id' => $team->id]);

        $this->expectException(ValidationException::class);
        $this->action->execute($team, 'Fourth Service');
    }

    public function test_business_plan_allows_unlimited_services(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Business]);
        Service::factory()->count(10)->create(['team_id' => $team->id]);

        $service = $this->action->execute($team, 'Eleventh Service');

        $this->assertNotNull($service->id);
    }

    public function test_creates_service_without_description(): void
    {
        $team = Team::factory()->create(['plan' => Plan::Starter]);

        $service = $this->action->execute($team, 'No Description');

        $this->assertNull($service->description);
    }
}
