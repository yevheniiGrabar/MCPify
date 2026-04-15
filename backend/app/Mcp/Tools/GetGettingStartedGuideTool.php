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

#[Name('get_getting_started_guide')]
#[Description('Step-by-step guide on how to use MCPify: register, connect an API, configure tools, and get an MCP URL working in Claude or ChatGPT.')]
#[IsReadOnly]
class GetGettingStartedGuideTool extends Tool
{
    public function handle(Request $request): Response
    {
        return Response::text(<<<TEXT
# Getting Started with MCPify

## Step 1 — Create an account
1. Go to https://mcpify.dev
2. Click "Get Started" or "Register"
3. Fill in your name, email, and password
4. Verify your email address

## Step 2 — Create a Service
A "Service" in MCPify represents one MCP server backed by one API.

1. In the dashboard, click **"New Service"**
2. Enter a name (e.g. "My CRM API") and optional description
3. Click **"Create Service"**

## Step 3 — Connect your API
After creating a service, you need to tell MCPify how to talk to your API.

### Option A — Import OpenAPI spec (recommended)
1. Go to the service page → click **"Connect"**
2. Choose **"OpenAPI"**
3. Paste your OpenAPI spec URL (e.g. `https://api.example.com/openapi.json`)
   or upload a `.json` / `.yaml` file
4. Click **"Import"** — MCPify auto-generates MCP tools from all your endpoints

### Option B — Add endpoints manually
1. Choose **"Manual"**
2. Enter endpoint path, HTTP method, description, and parameters
3. Repeat for each endpoint you want to expose

## Step 4 — Review and configure tools
After importing:
1. Go to the **Tools** tab for your service
2. You'll see a list of all auto-generated MCP tools
3. **Enable** the ones you want to expose (DELETE/dangerous methods are disabled by default)
4. Edit tool names and descriptions to make them clearer for AI clients
5. Toggle the **"Destructive"** badge if a tool modifies or deletes data

## Step 5 — Activate the service
1. On the service page, click **"Activate"**
2. Your service status changes from `draft` → `active`

## Step 6 — Get your MCP URL
1. On the service page you'll see your unique MCP endpoint:
   `https://mcpify.dev/mcp/{your-token}`
2. Copy this URL — this is what you add to Claude, ChatGPT, or Cursor

## Step 7 — Add to your AI client
See `get_integration_guide` for exact instructions per client.

---

## Tips
- You can regenerate your MCP token at any time from the service page (old token is immediately invalidated)
- Use the **Analytics** tab to see call history, response times, and errors
- Use the **Audit Log** to see every individual tool call with inputs and outputs
TEXT);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
