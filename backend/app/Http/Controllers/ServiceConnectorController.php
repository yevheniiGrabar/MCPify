<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Services\ConnectManualAction;
use App\Actions\Services\ConnectOpenApiAction;
use App\Http\Requests\Service\ConnectManualRequest;
use App\Http\Requests\Service\ConnectOpenApiRequest;
use App\Http\Resources\McpToolResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceConnectorController extends Controller
{
    public function connectOpenApi(
        ConnectOpenApiRequest $request,
        Service $service,
        ConnectOpenApiAction $action,
    ): JsonResponse {
        $this->authorizeTeamOwnership($request, $service);

        try {
            $tools = $action->execute(
                service: $service,
                url: $request->string('url')->toString() ?: null,
                specJson: $request->string('spec_json')->toString() ?: null,
            );

            return response()->json([
                'data' => McpToolResource::collection($tools),
                'meta' => ['tools_created' => count($tools)],
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function connectManual(
        ConnectManualRequest $request,
        Service $service,
        ConnectManualAction $action,
    ): JsonResponse {
        $this->authorizeTeamOwnership($request, $service);

        $tool = $action->execute(
            service: $service,
            name: $request->string('name')->toString(),
            httpMethod: $request->string('http_method')->toString(),
            endpointPath: $request->string('endpoint_path')->toString(),
            description: $request->string('description')->toString() ?: null,
            inputSchema: $request->input('input_schema'),
            baseUrl: $request->string('base_url')->toString() ?: null,
            authType: $request->string('auth_type')->toString() ?: null,
            authConfig: $request->input('auth_config'),
        );

        return response()->json(['data' => new McpToolResource($tool)], 201);
    }

    private function authorizeTeamOwnership(Request $request, Service $service): void
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }
    }
}
