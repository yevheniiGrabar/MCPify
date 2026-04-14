<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Services\CreateServiceAction;
use App\Http\Requests\Service\StoreServiceRequest;
use App\Http\Requests\Service\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $services = Service::query()
            ->where('team_id', $request->user()->current_team_id)
            ->latest()
            ->paginate(15);

        return ServiceResource::collection($services);
    }

    public function store(StoreServiceRequest $request, CreateServiceAction $action): JsonResponse
    {
        $service = $action->execute(
            team: $request->user()->currentTeam,
            name: $request->string('name')->toString(),
            description: $request->string('description')->toString() ?: null,
        );

        return response()->json(['data' => new ServiceResource($service)], 201);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        $this->authorizeTeamOwnership($request, $service);

        return response()->json(['data' => new ServiceResource($service)]);
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $this->authorizeTeamOwnership($request, $service);

        $service->update($request->validated());

        return response()->json(['data' => new ServiceResource($service->fresh())]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $this->authorizeTeamOwnership($request, $service);

        $service->delete();

        return response()->json(null, 204);
    }

    private function authorizeTeamOwnership(Request $request, Service $service): void
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }
    }
}
