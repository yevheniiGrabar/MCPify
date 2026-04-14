<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Service;
use App\Models\ToolCall;
use App\Notifications\HighErrorRateNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class CheckErrorRateJob implements ShouldQueue
{
    use Queueable;

    private const ERROR_THRESHOLD = 10.0;
    private const MIN_CALLS = 10;

    public function handle(): void
    {
        $periodStart = Carbon::now()->subHour();

        $services = Service::query()
            ->where('status', 'active')
            ->get();

        foreach ($services as $service) {
            $totalCalls = ToolCall::where('service_id', $service->id)
                ->where('called_at', '>=', $periodStart)
                ->count();

            if ($totalCalls < self::MIN_CALLS) {
                continue;
            }

            $errorCalls = ToolCall::where('service_id', $service->id)
                ->where('called_at', '>=', $periodStart)
                ->where('response_status', '>=', 400)
                ->count();

            $errorRate = ($errorCalls / $totalCalls) * 100;

            if ($errorRate >= self::ERROR_THRESHOLD) {
                $owner = $service->team->owner;

                if ($owner) {
                    $owner->notify(new HighErrorRateNotification(
                        service: $service,
                        errorRate: round($errorRate, 1),
                        totalCalls: $totalCalls,
                        errorCalls: $errorCalls,
                    ));
                }
            }
        }
    }
}
