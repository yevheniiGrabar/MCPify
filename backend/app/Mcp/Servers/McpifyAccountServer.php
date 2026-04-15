<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\GetMyUsageTool;
use App\Mcp\Tools\GetServiceDetailsTool;
use App\Mcp\Tools\ListMyServicesTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('MCPify Account')]
#[Version('1.0.0')]
#[Instructions(
    'This is the authenticated MCPify account server. It provides tools to manage your MCPify ' .
    'account: view your services, get MCP endpoint URLs, and check billing usage. ' .
    'Authentication is required — connect using your MCPify API token (Bearer) or via Laravel Sanctum. ' .
    'To get a token: log in at https://mcpify.dev and go to Settings.'
)]
class McpifyAccountServer extends Server
{
    /** @var array<int, class-string<\Laravel\Mcp\Server\Tool>> */
    protected array $tools = [
        ListMyServicesTool::class,
        GetServiceDetailsTool::class,
        GetMyUsageTool::class,
    ];

    protected array $resources = [];

    protected array $prompts = [];
}
