<?php

declare(strict_types=1);

use App\Mcp\Servers\McpifyAccountServer;
use App\Mcp\Servers\McpifyPublicServer;
use Laravel\Mcp\Facades\Mcp;

/*
|--------------------------------------------------------------------------
| MCPify MCP Servers
|--------------------------------------------------------------------------
|
| Public server — no auth required. Exposes product info, pricing, docs,
| and integration guides so any AI client can discover MCPify.
|
| Account server — requires Sanctum auth (Bearer token). Exposes personal
| services, MCP URLs, and billing usage for the authenticated user.
|
*/

// Public: https://mcpify.dev/api/v1/mcp/public
Mcp::web('/api/v1/mcp/public', McpifyPublicServer::class)
    ->middleware(['throttle:60,1']);

// Authenticated: https://mcpify.dev/api/v1/mcp/account
Mcp::web('/api/v1/mcp/account', McpifyAccountServer::class)
    ->middleware(['auth:sanctum', 'throttle:60,1']);
