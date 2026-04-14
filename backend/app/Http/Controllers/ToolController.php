<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Tool\UpdateToolRequest;
use App\Http\Resources\McpToolResource;
use App\Models\McpTool;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ToolController extends Controller
{
    public function index(Request $request, Service $service): AnonymousResourceCollection
    {
        $this->authorizeTeamOwnership($request, $service);

        $tools = $service->tools()
            ->orderBy('sort_order')
            ->get();

        return McpToolResource::collection($tools);
    }

    public function update(UpdateToolRequest $request, McpTool $tool): JsonResponse
    {
        $this->authorizeToolOwnership($request, $tool);

        $tool->update($request->validated());

        return response()->json(['data' => new McpToolResource($tool->fresh())]);
    }

    public function destroy(Request $request, McpTool $tool): JsonResponse
    {
        $this->authorizeToolOwnership($request, $tool);

        $tool->delete();

        return response()->json(null, 204);
    }

    private function authorizeTeamOwnership(Request $request, Service $service): void
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }
    }

    private function authorizeToolOwnership(Request $request, McpTool $tool): void
    {
        $service = $tool->service;
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }
    }
}
