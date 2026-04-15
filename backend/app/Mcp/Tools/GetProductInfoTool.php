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

#[Name('get_product_info')]
#[Description('Get detailed information about MCPify — what it is, what problems it solves, how it works, and who it is for.')]
#[IsReadOnly]
class GetProductInfoTool extends Tool
{
    public function handle(Request $request): Response
    {
        return Response::text(<<<TEXT
# MCPify — Turn Any REST API into an MCP Server

## What is MCPify?
MCPify is a "Stripe for MCP" platform. It allows any SaaS product or website to expose their
existing REST API as a fully functional MCP (Model Context Protocol) server — without writing
a single line of MCP code. You just import your OpenAPI spec and get an MCP endpoint in minutes.

## What problem does it solve?
AI clients like Claude Desktop, ChatGPT (via GPT Actions), Cursor, and Windsurf can connect to
external tools through the MCP protocol. But implementing an MCP server from scratch requires
deep protocol knowledge and ongoing maintenance.

MCPify solves this by acting as a bridge: you connect your existing API once, and MCPify handles
the MCP protocol layer for you.

## How it works (3 steps)
1. **Import** your OpenAPI spec (paste a URL or upload a JSON/YAML file)
2. **Review** the auto-generated MCP tools — enable/disable them, edit descriptions
3. **Connect** — get your unique MCP endpoint URL and add it to Claude, ChatGPT, or Cursor

## Who is it for?
- SaaS companies that want to be accessible from AI clients
- Developers who want to expose their API to AI assistants
- Teams building AI-powered workflows using existing REST APIs

## Key features
- OpenAPI spec import (URL, JSON, YAML)
- Manual endpoint entry
- Auto-generated tool descriptions
- Destructive operation protection (DELETE methods disabled by default)
- Analytics dashboard — call counts, response times, error rates
- Multi-tenant: one account, multiple services
- Secure credential storage (AES-256 encrypted)
- Rate limiting (100 req/min per MCP token)

## Website
https://mcpify.dev
TEXT);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
