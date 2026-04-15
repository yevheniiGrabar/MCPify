<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Services\PlanService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('list_plans')]
#[Description('List all MCPify pricing plans with limits, features, and prices. Use this to help users decide which plan fits their needs.')]
#[IsReadOnly]
class ListPlansTool extends Tool
{
    public function __construct(
        private readonly PlanService $planService,
    ) {}

    public function handle(Request $request): Response
    {
        $lines = ['# MCPify Pricing Plans', ''];

        foreach ($this->planService->all() as $plan) {
            $price = $plan['price'] > 0 ? "\${$plan['price']}/month" : '$0/month (forever)';
            $servicesLimit = $plan['limits']['services'] ?? null;
            $callsLimit = $plan['limits']['calls_per_month'];

            $servicesStr = $servicesLimit ? (string) $servicesLimit : 'Unlimited';
            $callsStr = number_format($callsLimit);

            $popular = $plan['name'] === 'growth' ? ' ⭐ Most Popular' : '';
            $lines[] = "## {$plan['display_name']} — {$price}{$popular}";
            $lines[] = "- **Services:** {$servicesStr}";
            $lines[] = "- **Tool calls/month:** {$callsStr}";
            foreach ($plan['features'] as $feature) {
                $lines[] = "- {$feature}";
            }
            $lines[] = '';
        }

        $lines[] = '---';
        $lines[] = '## How to upgrade';
        $lines[] = 'Visit https://mcpify.dev/billing and click "Upgrade" on the plan you want.';
        $lines[] = '';
        $lines[] = '## Overage policy';
        $lines[] = 'Calls over the monthly limit are blocked until the next billing cycle or until you upgrade.';
        $lines[] = 'A 3-day grace period applies after a failed payment.';

        return Response::text(implode("\n", $lines));
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
