<?php

declare(strict_types=1);

namespace Tests;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function createUserWithTeam(array $userAttrs = [], array $teamAttrs = []): array
    {
        $team = Team::factory()->create($teamAttrs);
        $user = User::factory()->create(array_merge(['current_team_id' => $team->id], $userAttrs));
        $team->users()->attach($user->id, ['role' => 'owner']);

        return [$user, $team];
    }

    protected function actingAsUser(array $userAttrs = [], array $teamAttrs = []): array
    {
        [$user, $team] = $this->createUserWithTeam($userAttrs, $teamAttrs);
        $this->actingAs($user, 'sanctum');

        return [$user, $team];
    }

    protected function withWorkerSecret(string $secret = 'test-secret'): void
    {
        config(['services.mcp_worker.secret' => $secret]);
    }

    protected function seedPlans(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        (new \Database\Seeders\PlanSeeder())->run();
    }
}
