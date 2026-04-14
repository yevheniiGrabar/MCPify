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
            $specJson = $request->input('spec_json');

            // If spec_json arrives as an already-decoded array/object (JSON content-type), re-encode it
            if (is_array($specJson)) {
                $specJson = json_encode($specJson);
            }

            $tools = $action->execute(
                service: $service,
                url: $request->string('url')->toString() ?: null,
                specJson: is_string($specJson) && $specJson !== '' ? $specJson : null,
            );

            return response()->json([
                'data' => McpToolResource::collection($tools),
                'meta' => ['tools_created' => count($tools)],
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('connect/openapi failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
            ]);
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

    public function updateAuth(Request $request, Service $service): JsonResponse
    {
        $this->authorizeTeamOwnership($request, $service);

        $request->validate([
            'auth_type' => 'required|in:bearer,api_key,basic,none',
            'auth_config' => 'nullable|array',
        ]);

        $apiConfig = $service->apiConfig;
        if (! $apiConfig) {
            $apiConfig = $service->apiConfig()->create([
                'type' => 'manual',
                'auth_type' => $request->input('auth_type'),
                'auth_config' => $request->input('auth_config'),
            ]);
        } else {
            $apiConfig->update([
                'auth_type' => $request->input('auth_type'),
                'auth_config' => $request->input('auth_config'),
            ]);
        }

        return response()->json([
            'data' => [
                'auth_type' => $apiConfig->auth_type,
                'has_credentials' => $apiConfig->auth_config !== null,
            ],
        ]);
    }

    public function getAuth(Request $request, Service $service): JsonResponse
    {
        $this->authorizeTeamOwnership($request, $service);

        $apiConfig = $service->apiConfig;

        return response()->json([
            'data' => [
                'auth_type' => $apiConfig?->auth_type ?? 'none',
                'has_credentials' => $apiConfig?->auth_config !== null,
                'base_url' => $apiConfig?->base_url,
            ],
        ]);
    }

    private function authorizeTeamOwnership(Request $request, Service $service): void
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }
    }
}
