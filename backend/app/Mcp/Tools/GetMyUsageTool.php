<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\Plan;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Cache;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get_my_usage')]
#[Description('Get the current billing usage for the authenticated account: services used vs limit, tool calls this month vs limit, plan details, and billing period.')]
#[IsReadOnly]
class GetMyUsageTool extends Tool
{
    private const PLAN_LIMITS = [
        'free'     => ['services' => 1,    'calls' => 1_000],
        'starter'  => ['services' => 3,    'calls' => 10_000],
        'growth'   => ['services' => 10,   'calls' => 100_000],
        'business' => ['services' => null, 'calls' => 1_000_000],
    ];

    public function handle(Request $request): Response
    {
        $user = $request->user();
        $team = $user?->currentTeam;

        if (! $team) {
            return Response::error('No team found for this account.');
        }

        $plan = $team->plan ?? Plan::Free;
        $planLimits = self::PLAN_LIMITS[$plan->value] ?? self::PLAN_LIMITS['free'];

        $servicesUsed = $team->services()->count();
        $servicesLimit = $planLimits['services'];

        $monthKey = now()->format('Y-m');
        $callsUsed = (int) Cache::get("calls:{$team->id}:{$monthKey}", 0);
        $callsLimit = $planLimits['calls'];

        $servicesPct = $servicesLimit ? round(($servicesUsed / $servicesLimit) * 100) : 0;
        $callsPct = $callsLimit ? round(($callsUsed / $callsLimit) * 100) : 0;

        $servicesBar = $this->progressBar($servicesPct);
        $callsBar = $this->progressBar($callsPct);

        $servicesLimitStr = $servicesLimit ? (string) $servicesLimit : 'Unlimited';
        $callsLimitStr = number_format($callsLimit);

        $periodEnd = now()->endOfMonth()->toFormattedDateString();
        $subStatus = $team->fs_subscription_status ?? 'active';

        $lines = [];
        $lines[] = "# Account Usage — {$team->name}";
        $lines[] = '';
        $lines[] = "**Plan:** " . ucfirst($plan->value) . "  |  **Billing status:** {$subStatus}";
        $lines[] = "**Period resets:** {$periodEnd}";
        $lines[] = '';
        $lines[] = "## Services";
        $lines[] = "{$servicesBar} {$servicesUsed} / {$servicesLimitStr} ({$servicesPct}%)";

        if ($servicesLimit && $servicesUsed >= $servicesLimit) {
            $lines[] = "⚠️  **Limit reached** — upgrade to create more services: https://mcpify.dev/billing";
        }

        $lines[] = '';
        $lines[] = "## Tool Calls (this month)";
        $lines[] = "{$callsBar} " . number_format($callsUsed) . " / {$callsLimitStr} ({$callsPct}%)";

        if ($callsPct >= 100) {
            $lines[] = "🔴 **Limit reached** — calls are being blocked. Upgrade now: https://mcpify.dev/billing";
        } elseif ($callsPct >= 80) {
            $lines[] = "🟡 **Warning** — approaching limit. Consider upgrading: https://mcpify.dev/billing";
        }

        $lines[] = '';
        $lines[] = "## Subscription";
        if ($team->fs_subscription_id) {
            $lines[] = "- **Subscription ID:** {$team->fs_subscription_id}";
            $lines[] = "- **Current period ends:** " . ($team->fs_current_period_end?->toFormattedDateString() ?? '—');
            $lines[] = "- **Cancel at period end:** " . ($team->fs_cancel_at_period_end ? 'Yes' : 'No');
        } else {
            $lines[] = "- You are on the **Free plan** (no billing)";
            $lines[] = "- Upgrade at https://mcpify.dev/billing";
        }

        return Response::text(implode("\n", $lines));
    }

    private function progressBar(int $pct): string
    {
        $filled = (int) round($pct / 10);
        $empty = 10 - $filled;
        return '[' . str_repeat('█', $filled) . str_repeat('░', $empty) . ']';
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
