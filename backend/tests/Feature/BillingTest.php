<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Plan;
use App\Models\Service;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BillingTest extends TestCase
{
    public function test_plans_returns_all_active_plans(): void
    {
        $this->seedPlans();
        $this->actingAsUser();

        $response = $this->getJson('/api/v1/billing/plans')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'display_name', 'price', 'limits', 'features'],
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_plans_requires_authentication(): void
    {
        $this->getJson('/api/v1/billing/plans')
            ->assertStatus(401);
    }

    public function test_usage_returns_current_usage(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->actingAsUser(teamAttrs: ['plan' => Plan::Starter]);

        $response = $this->getJson('/api/v1/billing/usage')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'services_used',
                    'services_limit',
                    'calls_used',
                    'calls_limit',
                ],
            ]);

        $this->assertEquals(0, $response->json('data.services_used'));
    }

    public function test_usage_reflects_actual_service_count(): void
    {
        $this->seedPlans();
        [$user, $team] = $this->actingAsUser(teamAttrs: ['plan' => Plan::Starter]);
        Service::factory()->count(2)->create(['team_id' => $team->id]);

        $response = $this->getJson('/api/v1/billing/usage')
            ->assertStatus(200);

        $this->assertEquals(2, $response->json('data.services_used'));
    }

    public function test_usage_requires_authentication(): void
    {
        $this->getJson('/api/v1/billing/usage')
            ->assertStatus(401);
    }

    public function test_checkout_config_returns_freemius_config(): void
    {
        $this->actingAsUser();

        $response = $this->getJson('/api/v1/billing/checkout-config')
            ->assertStatus(200);

        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_subscription_requires_authentication(): void
    {
        $this->getJson('/api/v1/billing/subscription')
            ->assertStatus(401);
    }

    public function test_invoices_requires_authentication(): void
    {
        $this->getJson('/api/v1/billing/invoices')
            ->assertStatus(401);
    }

    public function test_cancel_requires_authentication(): void
    {
        $this->postJson('/api/v1/billing/cancel')
            ->assertStatus(401);
    }

    public function test_resume_requires_authentication(): void
    {
        $this->postJson('/api/v1/billing/resume')
            ->assertStatus(401);
    }
}
