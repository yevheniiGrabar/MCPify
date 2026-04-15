<?php

declare(strict_types=1);

namespace App\Actions\Services;

use App\Enums\Plan;
use App\Models\Service;
use App\Models\Team;
use App\Services\PlanService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CreateServiceAction
{
    public function __construct(
        private readonly PlanService $planService,
    ) {}

    public function execute(Team $team, string $name, ?string $description = null): Service
    {
        $this->enforcePlanLimits($team);

        return DB::transaction(function () use ($team, $name, $description): Service {
            $service = Service::create([
                'team_id' => $team->id,
                'name' => $name,
                'description' => $description,
            ]);

            $service->apiConfig()->create([
                'type' => 'manual',
            ]);

            return $service->load('apiConfig');
        });
    }

    private function enforcePlanLimits(Team $team): void
    {
        $plan = $team->plan ?? Plan::Free;
        $maxServices = $this->planService->serviceLimit($plan);

        if ($maxServices === null) {
            return;
        }

        $currentCount = $team->services()->count();

        if ($currentCount >= $maxServices) {
            throw ValidationException::withMessages([
                'plan' => ["Service limit reached ({$currentCount}/{$maxServices}). Please upgrade your plan."],
            ])->status(403);
        }
    }
}
