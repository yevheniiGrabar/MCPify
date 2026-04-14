<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\ToolCall;
use App\Models\ToolCallStat;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AggregateToolCallStatsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $period = 'hour',
    ) {}

    public function handle(): void
    {
        $now = Carbon::now();

        if ($this->period === 'hour') {
            $periodStart = $now->copy()->subHour()->startOfHour();
            $periodEnd = $periodStart->copy()->endOfHour();
        } else {
            $periodStart = $now->copy()->subDay()->startOfDay();
            $periodEnd = $periodStart->copy()->endOfDay();
        }

        $groups = ToolCall::query()
            ->whereBetween('called_at', [$periodStart, $periodEnd])
            ->select('service_id', 'tool_id')
            ->groupBy('service_id', 'tool_id')
            ->get();

        foreach ($groups as $group) {
            $calls = ToolCall::query()
                ->where('service_id', $group->service_id)
                ->where('tool_id', $group->tool_id)
                ->whereBetween('called_at', [$periodStart, $periodEnd])
                ->get();

            if ($calls->isEmpty()) {
                continue;
            }

            $durations = $calls->pluck('duration_ms')->filter()->sort()->values();
            $totalCalls = $calls->count();
            $errorCalls = $calls->where('response_status', '>=', 400)->count();

            ToolCallStat::updateOrCreate(
                [
                    'service_id' => $group->service_id,
                    'tool_id' => $group->tool_id,
                    'period' => $this->period,
                    'period_start' => $periodStart,
                ],
                [
                    'total_calls' => $totalCalls,
                    'error_calls' => $errorCalls,
                    'avg_duration_ms' => $durations->isNotEmpty() ? (int) round($durations->avg()) : null,
                    'p50_duration_ms' => $this->percentile($durations, 50),
                    'p95_duration_ms' => $this->percentile($durations, 95),
                    'p99_duration_ms' => $this->percentile($durations, 99),
                ]
            );
        }

        // Also aggregate service-level totals (tool_id = null)
        $serviceGroups = ToolCall::query()
            ->whereBetween('called_at', [$periodStart, $periodEnd])
            ->select('service_id')
            ->groupBy('service_id')
            ->pluck('service_id');

        foreach ($serviceGroups as $serviceId) {
            $calls = ToolCall::query()
                ->where('service_id', $serviceId)
                ->whereBetween('called_at', [$periodStart, $periodEnd])
                ->get();

            $durations = $calls->pluck('duration_ms')->filter()->sort()->values();

            ToolCallStat::updateOrCreate(
                [
                    'service_id' => $serviceId,
                    'tool_id' => null,
                    'period' => $this->period,
                    'period_start' => $periodStart,
                ],
                [
                    'total_calls' => $calls->count(),
                    'error_calls' => $calls->where('response_status', '>=', 400)->count(),
                    'avg_duration_ms' => $durations->isNotEmpty() ? (int) round($durations->avg()) : null,
                    'p50_duration_ms' => $this->percentile($durations, 50),
                    'p95_duration_ms' => $this->percentile($durations, 95),
                    'p99_duration_ms' => $this->percentile($durations, 99),
                ]
            );
        }
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
}
