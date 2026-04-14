<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\McpTool;
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
}
