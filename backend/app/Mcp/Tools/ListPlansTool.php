<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

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
    public function handle(Request $request): Response
    {
        return Response::text(<<<TEXT
# MCPify Pricing Plans

## Free — $0/month (forever)
- **Services:** 1
- **Tool calls/month:** 1,000
- **Auth:** Basic auth only
- **Support:** Community
- **Best for:** Personal projects, testing, evaluation

## Starter — $49/month
- **Services:** 3
- **Tool calls/month:** 10,000
- **Auth:** All auth methods (Bearer, API Key, Basic)
- **Analytics:** Basic
- **Support:** Email
- **Best for:** Indie developers, small projects

## Growth — $149/month ⭐ Most Popular
- **Services:** 10
- **Tool calls/month:** 100,000
- **Auth:** All auth methods + custom configs
- **Analytics:** Advanced (charts, CSV export, error logs)
- **Support:** Priority email
- **Extra:** Webhook notifications
- **Best for:** Growing SaaS companies, teams

## Business — $399/month
- **Services:** Unlimited
- **Tool calls/month:** 1,000,000
- **Auth:** OAuth 2.0 support
- **Analytics:** Full audit logging
- **Support:** Dedicated
- **Extra:** White-label MCP endpoints, SLA guarantee
- **Best for:** Large companies, high-volume use cases

---

## How to upgrade
Visit https://mcpify.dev/billing and click "Upgrade" on the plan you want.

## Overage policy
Calls over the monthly limit are blocked until the next billing cycle or until you upgrade.
A 3-day grace period applies after a failed payment.
TEXT);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
