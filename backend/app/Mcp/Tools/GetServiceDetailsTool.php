<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Service;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get_service_details')]
#[Description('Get full details about a specific MCPify service: its MCP URL, all configured tools (enabled/disabled), auth type, and how to add it to an AI client.')]
#[IsReadOnly]
class GetServiceDetailsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'service_id' => 'required|integer',
        ]);

        $team = $request->user()?->currentTeam;
        if (! $team) {
            return Response::error('No team found for this account.');
        }

        $service = Service::query()
            ->where('id', $validated['service_id'])
            ->where('team_id', $team->id)
            ->with(['tools', 'apiConfig'])
            ->first();

        if (! $service) {
            return Response::error("Service #{$validated['service_id']} not found or does not belong to your account.");
        }

        $baseUrl = config('app.url');
        $status = $service->status?->value ?? $service->getRawOriginal('status') ?? 'draft';
        $mcpUrl = "{$baseUrl}/mcp/{$service->mcp_url_token}";

        $lines = [];
        $lines[] = "# Service: {$service->name}";
        $lines[] = '';
        $lines[] = "- **ID:** {$service->id}";
        $lines[] = "- **Status:** {$status}";
        $lines[] = "- **Description:** " . ($service->description ?: '—');
        $lines[] = "- **Created:** " . $service->created_at->toDateString();
        $lines[] = '';
        $lines[] = "## MCP Endpoint";
        $lines[] = "```";
        $lines[] = $mcpUrl;
        $lines[] = "```";
        $lines[] = "Add this URL to Claude Desktop, Claude.ai, Cursor, or ChatGPT.";
        $lines[] = "Use the `get_integration_guide` tool for setup instructions per client.";
        $lines[] = '';

        // Auth
        $authType = $service->apiConfig?->auth_type ?? 'none';
        $lines[] = "## Authentication";
        $lines[] = "- **Type:** " . ($authType ?: 'none');
        $lines[] = "- **Base URL:** " . ($service->apiConfig?->base_url ?: '—');
        $lines[] = '';

        // Tools
        $tools = $service->tools ?? collect();
        $enabledCount = $tools->where('is_enabled', true)->count();
        $lines[] = "## Tools ({$tools->count()} total, {$enabledCount} enabled)";
        $lines[] = '';

        foreach ($tools->sortBy('sort_order') as $tool) {
            $enabled = $tool->is_enabled ? '✅' : '❌';
            $destructive = $tool->is_destructive ? ' 🔴 DESTRUCTIVE' : '';
            $lines[] = "### {$enabled} `{$tool->name}`{$destructive}";
            $lines[] = "- **Method:** {$tool->http_method} {$tool->endpoint_path}";
            $lines[] = "- **Description:** " . ($tool->description ?: '—');
            $lines[] = '';
        }

        return Response::text(implode("\n", $lines));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'service_id' => $schema->integer()
                ->description('The numeric ID of the service to retrieve. Use list_my_services to find service IDs.')
                ->required(),
        ];
    }
}
