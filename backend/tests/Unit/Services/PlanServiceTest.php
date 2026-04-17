<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Enums\Plan;
use App\Models\Plan as PlanModel;
use App\Services\PlanService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlanServiceTest extends TestCase
{
    private PlanService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->service = app(PlanService::class);
    }

    public function test_all_returns_active_plans_from_db(): void
    {
        $this->seedPlans();

        $plans = $this->service->all();

        $this->assertIsArray($plans);
        $this->assertNotEmpty($plans);
        $slugs = array_column($plans, 'name');
        $this->assertContains('free', $slugs);
        $this->assertContains('starter', $slugs);
    }

    public function test_all_caches_results(): void
    {
        $this->seedPlans();

        $first = $this->service->all();
        // Add a plan that should NOT appear in second call (cached)
        PlanModel::create([
            'slug' => 'phantom',
            'display_name' => 'Phantom',
            'price' => 999,
            'services_limit' => 100,
            'calls_per_month' => 1000,
            'features' => [],
            'is_active' => true,
            'sort_order' => 99,
        ]);
        $second = $this->service->all();

        $this->assertEquals(count($first), count($second));
    }

    public function test_all_excludes_inactive_plans(): void
    {
        PlanModel::create([
            'slug' => 'inactive',
            'display_name' => 'Inactive',
            'price' => 0,
            'services_limit' => 1,
            'calls_per_month' => 100,
            'features' => [],
            'is_active' => false,
            'sort_order' => 0,
        ]);

        $plans = $this->service->all();
        $slugs = array_column($plans, 'name');

        $this->assertNotContains('inactive', $slugs);
    }

    public function test_find_returns_plan_by_slug(): void
    {
        $this->seedPlans();

        $plan = $this->service->find('starter');

        $this->assertNotNull($plan);
        $this->assertEquals('starter', $plan['name']);
    }

    public function test_find_returns_null_for_unknown_slug(): void
    {
        $this->seedPlans();

        $this->assertNull($this->service->find('nonexistent'));
    }

    public function test_service_limit_returns_correct_limit_for_free(): void
    {
        $this->seedPlans();

        $this->assertEquals(1, $this->service->serviceLimit(Plan::Free));
    }

    public function test_service_limit_returns_correct_limit_for_starter(): void
    {
        $this->seedPlans();

        $this->assertEquals(3, $this->service->serviceLimit(Plan::Starter));
    }

    public function test_service_limit_returns_null_for_business(): void
    {
        $this->seedPlans();

        // Business plan has null services_limit (unlimited)
        $this->assertNull($this->service->serviceLimit(Plan::Business));
    }

    public function test_calls_limit_returns_correct_limit_for_free(): void
    {
        $this->seedPlans();

        $this->assertEquals(1000, $this->service->callsLimit(Plan::Free));
    }

    public function test_calls_limit_returns_correct_limit_for_growth(): void
    {
        $this->seedPlans();

        $this->assertEquals(100000, $this->service->callsLimit(Plan::Growth));
    }

    public function test_falls_back_to_free_plan_when_db_is_empty(): void
    {
        // No plans seeded
        $plan = $this->service->forPlan(Plan::Free);

        $this->assertEquals('free', $plan['name']);
        $this->assertEquals(1, $plan['limits']['services']);
        $this->assertEquals(1000, $plan['limits']['calls_per_month']);
    }

    public function test_plans_ordered_by_sort_order(): void
    {
        $this->seedPlans();

        $plans = $this->service->all();
        $sortOrders = array_column(array_map(fn ($p) => ['name' => $p['name']], $plans), 'name');

        $this->assertEquals(['free', 'starter', 'growth', 'business'], $sortOrders);
    }
}
