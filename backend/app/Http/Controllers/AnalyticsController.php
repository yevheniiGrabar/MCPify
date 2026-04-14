<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\McpTool;
use App\Models\Service;
use App\Models\ToolCall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $teamId = $request->user()->current_team_id;

        $totalCalls = ToolCall::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
            ->count();

        $monthCalls = ToolCall::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $avgResponseMs = ToolCall::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
            ->where('created_at', '>=', now()->startOfMonth())
            ->avg('duration_ms');

        $totalTools = McpTool::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
            ->count();

        $enabledTools = McpTool::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
            ->where('is_enabled', true)
            ->count();

        $errorRate = $monthCalls > 0
            ? ToolCall::whereHas('service', fn ($q) => $q->where('team_id', $teamId))
                ->where('created_at', '>=', now()->startOfMonth())
                ->where('response_status', '>=', 400)
                ->count() / $monthCalls * 100
            : 0;

        return response()->json([
            'data' => [
                'total_calls' => $totalCalls,
                'month_calls' => $monthCalls,
                'avg_response_ms' => $avgResponseMs ? round($avgResponseMs) : null,
                'total_tools' => $totalTools,
                'enabled_tools' => $enabledTools,
                'error_rate' => round($errorRate, 1),
            ],
        ]);
    }

    public function auditLog(Request $request, Service $service): JsonResponse
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }

        $calls = ToolCall::where('service_id', $service->id)
            ->with('tool:id,name,http_method,endpoint_path')
            ->latest('called_at')
            ->paginate(50);

        return response()->json([
            'data' => $calls->map(fn (ToolCall $call) => [
                'id' => $call->id,
                'tool_name' => $call->tool?->name,
                'http_method' => $call->tool?->http_method,
                'endpoint_path' => $call->tool?->endpoint_path,
                'response_status' => $call->response_status,
                'duration_ms' => $call->duration_ms,
                'caller_ip' => $call->caller_ip,
                'caller_user_agent' => $call->caller_user_agent,
                'error_message' => $call->error_message,
                'called_at' => $call->called_at,
            ]),
            'meta' => [
                'total' => $calls->total(),
                'per_page' => $calls->perPage(),
                'current_page' => $calls->currentPage(),
            ],
        ]);
    }
}
