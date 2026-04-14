<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\McpTool;
use App\Models\Service;
use App\Models\ToolCall;
use App\Models\ToolCallStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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

    public function serviceAnalytics(Request $request, Service $service): JsonResponse
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }

        $range = $request->input('range', '7d');
        $since = match ($range) {
            '30d' => Carbon::now()->subDays(30)->startOfDay(),
            '90d' => Carbon::now()->subDays(90)->startOfDay(),
            default => Carbon::now()->subDays(7)->startOfDay(),
        };

        // Summary stats from raw calls for accuracy
        $calls = ToolCall::where('service_id', $service->id)
            ->where('called_at', '>=', $since);

        $totalCalls = (clone $calls)->count();
        $errorCalls = (clone $calls)->where('response_status', '>=', 400)->count();
        $errorRate = $totalCalls > 0 ? round(($errorCalls / $totalCalls) * 100, 1) : 0;

        $durations = (clone $calls)->whereNotNull('duration_ms')
            ->pluck('duration_ms')->sort()->values();

        // Daily chart data
        $period = $range === '7d' ? 'hour' : 'day';
        $chartData = ToolCallStat::where('service_id', $service->id)
            ->whereNull('tool_id')
            ->where('period', $period)
            ->where('period_start', '>=', $since)
            ->orderBy('period_start')
            ->get()
            ->map(fn (ToolCallStat $stat) => [
                'date' => $stat->period_start->toIso8601String(),
                'calls' => $stat->total_calls,
                'errors' => $stat->error_calls,
                'avg_duration' => $stat->avg_duration_ms,
            ]);

        // If no aggregated data yet, fall back to raw grouping
        if ($chartData->isEmpty()) {
            $chartData = $this->buildChartFromRaw($service->id, $since, $range);
        }

        // Per-tool breakdown
        $toolStats = McpTool::where('service_id', $service->id)
            ->withCount([
                'toolCalls as total_calls' => fn ($q) => $q->where('called_at', '>=', $since),
                'toolCalls as error_calls' => fn ($q) => $q->where('called_at', '>=', $since)->where('response_status', '>=', 400),
            ])
            ->withAvg(['toolCalls as avg_duration' => fn ($q) => $q->where('called_at', '>=', $since)], 'duration_ms')
            ->having('total_calls', '>', 0)
            ->orderByDesc('total_calls')
            ->get()
            ->map(fn (McpTool $tool) => [
                'id' => $tool->id,
                'name' => $tool->name,
                'http_method' => $tool->http_method,
                'total_calls' => (int) $tool->total_calls,
                'error_calls' => (int) $tool->error_calls,
                'avg_duration' => $tool->avg_duration ? (int) round((float) $tool->avg_duration) : null,
            ]);

        // Recent errors
        $recentErrors = ToolCall::where('service_id', $service->id)
            ->where('response_status', '>=', 400)
            ->with('tool:id,name,http_method,endpoint_path')
            ->latest('called_at')
            ->limit(20)
            ->get()
            ->map(fn (ToolCall $call) => [
                'id' => $call->id,
                'tool_name' => $call->tool?->name,
                'http_method' => $call->tool?->http_method,
                'endpoint_path' => $call->tool?->endpoint_path,
                'response_status' => $call->response_status,
                'error_message' => $call->error_message,
                'duration_ms' => $call->duration_ms,
                'called_at' => $call->called_at,
            ]);

        return response()->json([
            'data' => [
                'total_calls' => $totalCalls,
                'error_calls' => $errorCalls,
                'error_rate' => $errorRate,
                'avg_duration_ms' => $durations->isNotEmpty() ? (int) round($durations->avg()) : null,
                'p50_duration_ms' => $this->percentile($durations, 50),
                'p95_duration_ms' => $this->percentile($durations, 95),
                'p99_duration_ms' => $this->percentile($durations, 99),
                'chart' => $chartData,
                'tool_stats' => $toolStats,
                'recent_errors' => $recentErrors,
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

    public function exportCsv(Request $request, Service $service): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if ($service->team_id !== $request->user()->current_team_id) {
            abort(403, 'Unauthorized');
        }

        $range = $request->input('range', '7d');
        $since = match ($range) {
            '30d' => Carbon::now()->subDays(30)->startOfDay(),
            '90d' => Carbon::now()->subDays(90)->startOfDay(),
            default => Carbon::now()->subDays(7)->startOfDay(),
        };

        $fileName = "{$service->name}-tool-calls-{$range}.csv";

        return response()->streamDownload(function () use ($service, $since): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Tool', 'HTTP Method', 'Endpoint', 'Status', 'Duration (ms)', 'Error', 'Caller IP', 'Called At']);

            ToolCall::where('service_id', $service->id)
                ->where('called_at', '>=', $since)
                ->with('tool:id,name,http_method,endpoint_path')
                ->orderBy('called_at', 'desc')
                ->chunk(500, function ($calls) use ($handle): void {
                    foreach ($calls as $call) {
                        fputcsv($handle, [
                            $call->id,
                            $call->tool?->name,
                            $call->tool?->http_method,
                            $call->tool?->endpoint_path,
                            $call->response_status,
                            $call->duration_ms,
                            $call->error_message,
                            $call->caller_ip,
                            $call->called_at?->toIso8601String(),
                        ]);
                    }
                });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @param \Illuminate\Support\Collection<int, int> $sorted
     */
    private function percentile(\Illuminate\Support\Collection $sorted, int $percentile): ?int
    {
        if ($sorted->isEmpty()) {
            return null;
        }

        $index = (int) ceil(($percentile / 100) * $sorted->count()) - 1;
        $index = max(0, min($index, $sorted->count() - 1));

        return (int) $sorted->values()[$index];
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function buildChartFromRaw(int $serviceId, Carbon $since, string $range): \Illuminate\Support\Collection
    {
        $groupFormat = $range === '7d' ? 'Y-m-d H:00:00' : 'Y-m-d';

        return ToolCall::where('service_id', $serviceId)
            ->where('called_at', '>=', $since)
            ->get()
            ->groupBy(fn (ToolCall $call) => $call->called_at->format($groupFormat))
            ->map(fn ($group, $date) => [
                'date' => Carbon::parse($date)->toIso8601String(),
                'calls' => $group->count(),
                'errors' => $group->where('response_status', '>=', 400)->count(),
                'avg_duration' => $group->avg('duration_ms') ? (int) round($group->avg('duration_ms')) : null,
            ])
            ->sortBy('date')
            ->values();
    }
}
