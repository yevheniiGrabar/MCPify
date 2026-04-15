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

#[Name('search_docs')]
#[Description('Search MCPify documentation and FAQ. Ask any question about how MCPify works, troubleshooting, concepts, or features.')]
#[IsReadOnly]
class SearchDocsTool extends Tool
{
    private const DOCS = [
        [
            'keywords' => ['mcp token', 'token', 'url', 'endpoint', 'regenerate'],
            'content' => <<<TEXT
## MCP Token / Endpoint URL

Each MCPify service has a unique 64-character MCP token. Your MCP endpoint URL is:
`https://mcpify.dev/mcp/{your-token}`

**Regenerating the token:**
Go to your service page → click "Regenerate Token". The old token is immediately invalidated.
Any AI client using the old URL will need to be updated.

**Rate limit:** 100 requests/minute per token. Exceeding this returns HTTP 429.
TEXT,
        ],
        [
            'keywords' => ['openapi', 'spec', 'import', 'swagger', 'yaml', 'json', 'upload'],
            'content' => <<<TEXT
## Importing an OpenAPI Spec

MCPify supports OpenAPI 3.0 and 3.1 specs in JSON or YAML format.

**Via URL:**
Paste the URL of your spec (e.g. `https://api.example.com/openapi.json`).
MCPify fetches and parses it automatically.

**Via file upload:**
Upload a `.json` or `.yaml` file from your computer.

**What gets imported:**
- Each API endpoint becomes one MCP tool
- Path parameters, query parameters, and request body fields become tool arguments
- Existing descriptions are used; missing ones are auto-enhanced

**After import:**
Review the generated tools — enable what you want, disable what you don't.
TEXT,
        ],
        [
            'keywords' => ['destructive', 'delete', 'dangerous', 'disable', 'enabled'],
            'content' => <<<TEXT
## Destructive Tools

Any tool that uses DELETE, or that MCPify detects as potentially dangerous,
is automatically marked as **destructive** and **disabled by default**.

**To enable a destructive tool:**
1. Go to service → Tools tab
2. Find the tool marked with a red "DESTRUCTIVE" badge
3. Toggle it to enabled
4. The AI client must also pass `confirm_destructive: true` when calling it

This protects against accidental data deletion via AI.
TEXT,
        ],
        [
            'keywords' => ['auth', 'authentication', 'bearer', 'api key', 'basic', 'credentials', 'secret'],
            'content' => <<<TEXT
## API Authentication

MCPify supports three auth types for calling your upstream API:

**Bearer Token:**
MCPify forwards `Authorization: Bearer <token>` with every request.

**API Key:**
Can be sent as a header (e.g. `X-API-Key: <key>`) or as a query parameter.

**Basic Auth:**
MCPify sends `Authorization: Basic <base64(user:pass)>` with every request.

**Security:**
All credentials are encrypted at rest using AES-256 (Laravel's `encrypt()`).
They are never returned in API responses and never logged.

To configure auth: go to your service page → "Authentication" tab.
TEXT,
        ],
        [
            'keywords' => ['analytics', 'calls', 'stats', 'metrics', 'chart', 'usage', 'response time'],
            'content' => <<<TEXT
## Analytics & Monitoring

Available in the **Analytics** tab per service:

- **Total calls** — how many times tools were invoked
- **Unique users** — distinct callers (by IP)
- **Calls per tool** — which tools are used most
- **Response times** — p50, p95, p99 latency
- **Error rate** — % of failed tool calls
- **Daily chart** — calls over time (7d / 30d / 90d)
- **Export CSV** — download raw data (Growth plan and above)

**Audit Log:**
Every individual tool call is logged with full input/output. Available in the service's "Audit Log" tab.
TEXT,
        ],
        [
            'keywords' => ['plan', 'limit', 'exceeded', 'upgrade', 'quota', 'calls', 'services'],
            'content' => <<<TEXT
## Plan Limits

**Service limit:**
You can't create more services than your plan allows. The error will say "Service limit reached".
Solution: upgrade your plan at https://mcpify.dev/billing

**Monthly call limit:**
When your monthly tool call quota is reached, further MCP tool calls will be blocked.
You'll receive an email warning at 80% and again at 100%.
Solution: upgrade your plan, or wait until the next billing cycle.

**Grace period:**
If your payment fails, you have a 3-day grace period where your service continues to work.
After 3 days without payment, you're downgraded to the Free plan.
TEXT,
        ],
        [
            'keywords' => ['status', 'draft', 'active', 'paused', 'activate', 'deactivate'],
            'content' => <<<TEXT
## Service Status

Services have three states:

**draft** — Service created but not yet activated. MCP endpoint doesn't respond to requests.

**active** — Service is live. MCP clients can connect and call tools.

**paused** — Service temporarily disabled. MCP endpoint returns 404.

To activate: go to service page → click "Activate".
To pause: click "Pause Service".
TEXT,
        ],
        [
            'keywords' => ['team', 'multi-tenant', 'workspace', 'member', 'invite'],
            'content' => <<<TEXT
## Teams & Multi-tenancy

Each MCPify account has a personal team (workspace). All services belong to your team.

**Current limitations (v1):**
- Team management UI is in progress
- You can see your team name and slug in Settings → Team
- Billing (plan limits) applies at the team level

**Coming soon:**
- Invite team members
- Role-based access (owner / member)
- Multiple teams per account
TEXT,
        ],
    ];

    public function handle(Request $request): Response
    {
        $query = strtolower(trim($request->get('query', '')));

        if (empty($query)) {
            return Response::text(
                "Please provide a search query. Examples:\n" .
                '- "how do I import an OpenAPI spec?"' . "\n" .
                '- "what is a destructive tool?"' . "\n" .
                '- "how does authentication work?"'
            );
        }

        $results = [];
        foreach (self::DOCS as $doc) {
            $score = 0;
            foreach ($doc['keywords'] as $keyword) {
                if (str_contains($query, $keyword)) {
                    $score++;
                }
            }
            // Also do loose word matching against content
            $words = explode(' ', $query);
            foreach ($words as $word) {
                if (strlen($word) > 3 && str_contains(strtolower($doc['content']), $word)) {
                    $score += 0.5;
                }
            }
            if ($score > 0) {
                $results[] = ['score' => $score, 'content' => $doc['content']];
            }
        }

        if (empty($results)) {
            return Response::text(
                "No documentation found for: \"{$query}\"\n\n" .
                "Try asking about: mcp token, openapi import, authentication, destructive tools, " .
                "analytics, plan limits, service status, or teams."
            );
        }

        usort($results, fn ($a, $b) => $b['score'] <=> $a['score']);

        $output = "# Documentation results for: \"{$query}\"\n\n";
        foreach (array_slice($results, 0, 3) as $result) {
            $output .= $result['content'] . "\n\n---\n\n";
        }

        return Response::text(trim($output));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('Your question or search terms about MCPify. E.g. "how to add authentication", "what is a destructive tool", "plan limits".')
                ->required(),
        ];
    }
}
