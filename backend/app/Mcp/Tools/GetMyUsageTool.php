<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\Plan;
use App\Services\PlanService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Cache;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get_my_usage')]
#[Description('Get current billing usage: services used vs limit, tool calls this month vs limit, plan details, and billing period.')]
#[IsReadOnly]
class GetMyUsageTool extends Tool
{
    public function __construct(
        private readonly PlanService $planService,
    ) {}

    public function handle(Request $request): Response
    {
        $team = $request->user()?->currentTeam;

        if (! $team) {
            return Response::error('No team found for this account.');
        }

        $plan = $team->plan ?? Plan::Free;
        $planDef = $this->planService->forPlan($plan);

        $servicesUsed = $team->services()->count();
        $servicesLimit = $this->planService->serviceLimit($plan);

        $monthKey = now()->format('Y-m');
        $callsUsed = (int) Cache::get("calls:{$team->id}:{$monthKey}", 0);
        $callsLimit = $this->planService->callsLimit($plan);

        $servicesPct = $servicesLimit ? (int) round(($servicesUsed / $servicesLimit) * 100) : 0;
        $callsPct = (int) round(($callsUsed / $callsLimit) * 100);

        $servicesLimitStr = $servicesLimit ? (string) $servicesLimit : 'Unlimited';
        $subStatus = $team->fs_subscription_status ?? 'active';
        $periodEnd = now()->endOfMonth()->toFormattedDateString();

        $lines = [];
        $lines[] = "# Account Usage — {$team->name}";
        $lines[] = '';
        $lines[] = "**Plan:** {$planDef['display_name']} (\${$planDef['price']}/mo)  |  **Status:** {$subStatus}";
        $lines[] = "**Billing period resets:** {$periodEnd}";
        $lines[] = '';
        $lines[] = "## Services";
        $lines[] = $this->progressBar($servicesPct) . " {$servicesUsed} / {$servicesLimitStr} ({$servicesPct}%)";

        if ($servicesLimit && $servicesUsed >= $servicesLimit) {
            $lines[] = "⚠️  **Limit reached** — upgrade at https://mcpify.dev/billing";
        }

        $lines[] = '';
        $lines[] = "## Tool Calls (this month)";
        $lines[] = $this->progressBar($callsPct) . ' ' . number_format($callsUsed) . ' / ' . number_format($callsLimit) . " ({$callsPct}%)";

        if ($callsPct >= 100) {
            $lines[] = "🔴 **Limit reached** — calls are blocked. Upgrade: https://mcpify.dev/billing";
        } elseif ($callsPct >= 80) {
            $lines[] = "🟡 **Warning** — approaching limit. Consider upgrading: https://mcpify.dev/billing";
        }

        $lines[] = '';
        $lines[] = "## Subscription";
        if ($team->fs_subscription_id) {
            $lines[] = "- **Subscription ID:** {$team->fs_subscription_id}";
            $lines[] = "- **Period ends:** " . ($team->fs_current_period_end?->toFormattedDateString() ?? '—');
            $lines[] = "- **Cancel at period end:** " . ($team->fs_cancel_at_period_end ? 'Yes' : 'No');
        } else {
            $lines[] = "- Free plan (no billing)";
            $lines[] = "- Upgrade at https://mcpify.dev/billing";
        }

        return Response::text(implode("\n", $lines));
    }

    private function progressBar(int $pct): string
    {
        $filled = (int) round(min($pct, 100) / 10);
        $empty = 10 - $filled;
        return '[' . str_repeat('█', $filled) . str_repeat('░', $empty) . ']';
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
