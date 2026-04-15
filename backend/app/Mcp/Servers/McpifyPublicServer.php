<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\GetGettingStartedGuideTool;
use App\Mcp\Tools\GetIntegrationGuideTool;
use App\Mcp\Tools\GetProductInfoTool;
use App\Mcp\Tools\ListPlansTool;
use App\Mcp\Tools\SearchDocsTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('MCPify')]
#[Version('1.0.0')]
#[Instructions(
    'This is the official MCPify MCP server. MCPify is a platform that lets any SaaS/website ' .
    'expose their REST API as an MCP server without writing MCP code. ' .
    'Use the available tools to learn about the product, pricing plans, and how to get started. ' .
    'To manage your own account and services, use the authenticated account server at /api/v1/mcp/account.'
)]
class McpifyPublicServer extends Server
{
    /** @var array<int, class-string<\Laravel\Mcp\Server\Tool>> */
    protected array $tools = [
        GetProductInfoTool::class,
        ListPlansTool::class,
        GetGettingStartedGuideTool::class,
        SearchDocsTool::class,
        GetIntegrationGuideTool::class,
    ];

    protected array $resources = [];

    protected array $prompts = [];
}
