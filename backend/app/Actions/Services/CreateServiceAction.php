<?php

declare(strict_types=1);

namespace App\Actions\Services;

use App\Models\Service;
use App\Models\Team;
use Illuminate\Support\Facades\DB;

final class CreateServiceAction
{
    public function execute(Team $team, string $name, ?string $description = null): Service
    {
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
}
