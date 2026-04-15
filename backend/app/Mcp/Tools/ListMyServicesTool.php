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

#[Name('list_my_services')]
#[Description('List all MCP services in the authenticated user\'s account, with their status, tool count, and MCP endpoint URL.')]
#[IsReadOnly]
class ListMyServicesTool extends Tool
{
    public function handle(Request $request): Response
    {
        $team = $request->user()?->currentTeam;

        if (! $team) {
            return Response::error('No team found for this account.');
        }

        $services = Service::query()
            ->where('team_id', $team->id)
            ->withCount('tools')
            ->latest()
            ->get();

        if ($services->isEmpty()) {
            return Response::text(
                "You have no services yet.\n\n" .
                "Create your first service at https://mcpify.dev/services/new"
            );
        }

        $baseUrl = config('app.url');
        $lines = ["# Your MCPify Services ({$services->count()} total)\n"];

        foreach ($services as $service) {
            $status = $service->status?->value ?? $service->getRawOriginal('status') ?? 'draft';
            $statusEmoji = match ($status) {
                'active' => '🟢',
                'paused' => '🟡',
                default  => '⚪',
            };
            $mcpUrl = "{$baseUrl}/mcp/{$service->mcp_url_token}";

            $lines[] = "## {$statusEmoji} {$service->name} (ID: {$service->id})";
            $lines[] = "- **Status:** {$status}";
            $lines[] = "- **Tools:** {$service->tools_count}";
            $lines[] = "- **Description:** " . ($service->description ?: '—');
            $lines[] = "- **MCP URL:** `{$mcpUrl}`";
            $lines[] = "- **Created:** " . $service->created_at->toDateString();
            $lines[] = '';
        }

        return Response::text(implode("\n", $lines));
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
