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

#[Name('get_integration_guide')]
#[Description('Instructions on how to add an MCPify MCP server URL to a specific AI client: Claude Desktop, Claude.ai, ChatGPT, Cursor, Windsurf, or Zed.')]
#[IsReadOnly]
class GetIntegrationGuideTool extends Tool
{
    private const GUIDES = [
        'claude_desktop' => <<<TEXT
# Adding MCPify to Claude Desktop

1. Open Claude Desktop
2. Go to **Settings → Developer → Edit Config**
   (or open `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS)
3. Add your MCPify server to the `mcpServers` section:

```json
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": ["-y", "@mcpify/connector"],
      "env": {
        "MCP_URL": "https://mcpify.dev/mcp/YOUR_TOKEN_HERE"
      }
    }
  }
}
```

4. Save the file and **restart Claude Desktop**
5. You'll see your tools listed in Claude's tool panel

> Replace `YOUR_TOKEN_HERE` with the MCP token from your MCPify service page.
TEXT,
        'claude_ai' => <<<TEXT
# Adding MCPify to Claude.ai (web)

Claude.ai supports remote MCP servers directly:

1. Go to https://claude.ai
2. Click your profile → **Settings → Integrations**
3. Click **"Add Integration"**
4. Enter your MCPify MCP URL:
   `https://mcpify.dev/mcp/YOUR_TOKEN_HERE`
5. Click **Save**

Your MCPify tools will now be available in Claude.ai conversations.

> Replace `YOUR_TOKEN_HERE` with the MCP token from your MCPify service page.
TEXT,
        'chatgpt' => <<<TEXT
# Adding MCPify to ChatGPT

ChatGPT supports MCP via "Remote Actions" in Custom GPTs or via the MCP connector:

### Option A — Custom GPT Action (OpenAPI)
1. In ChatGPT, go to **Explore GPTs → Create**
2. Click **"Configure" → "Add Actions"**
3. Use the Schema tab — paste your API's OpenAPI spec URL or upload the file
4. Set authentication as needed (Bearer token, API Key)

### Option B — MCP (if your ChatGPT supports it)
1. Go to ChatGPT Settings → **Beta features → MCP**
2. Add server URL: `https://mcpify.dev/mcp/YOUR_TOKEN_HERE`
3. Save and restart the conversation

> Replace `YOUR_TOKEN_HERE` with the MCP token from your MCPify service page.
TEXT,
        'cursor' => <<<TEXT
# Adding MCPify to Cursor

1. Open Cursor
2. Go to **Settings (⌘,) → Features → MCP**
3. Click **"Add MCP Server"**
4. Choose **"Remote (HTTP)"**
5. Enter your MCPify URL:
   `https://mcpify.dev/mcp/YOUR_TOKEN_HERE`
6. Give it a name (e.g. "My API")
7. Click **Save**

Your tools are now available in Cursor's AI assistant.

> Replace `YOUR_TOKEN_HERE` with the MCP token from your MCPify service page.
TEXT,
        'windsurf' => <<<TEXT
# Adding MCPify to Windsurf

1. Open Windsurf
2. Open the **MCP Config** file:
   `~/.codeium/windsurf/mcp_config.json`
3. Add your MCPify server:

```json
{
  "mcpServers": {
    "my-api": {
      "serverUrl": "https://mcpify.dev/mcp/YOUR_TOKEN_HERE"
    }
  }
}
```

4. Save and restart Windsurf

> Replace `YOUR_TOKEN_HERE` with the MCP token from your MCPify service page.
TEXT,
    ];

    public function handle(Request $request): Response
    {
        $client = strtolower(trim($request->get('client', '')));

        if ($client && isset(self::GUIDES[$client])) {
            return Response::text(self::GUIDES[$client]);
        }

        // Return overview with all clients if none specified
        $overview = "# MCPify Integration Guides\n\n";
        $overview .= "Available guides for the following AI clients:\n\n";
        $overview .= "- **claude_desktop** — Claude Desktop app (macOS/Windows)\n";
        $overview .= "- **claude_ai** — Claude.ai web interface\n";
        $overview .= "- **chatgpt** — ChatGPT (Custom GPT Actions or MCP)\n";
        $overview .= "- **cursor** — Cursor IDE\n";
        $overview .= "- **windsurf** — Windsurf IDE\n\n";
        $overview .= "Call this tool again with a `client` argument (e.g. `client: \"cursor\"`) ";
        $overview .= "to get the specific setup instructions.\n\n";
        $overview .= "---\n\n";

        foreach (self::GUIDES as $key => $guide) {
            $overview .= $guide . "\n\n---\n\n";
        }

        return Response::text(trim($overview));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'client' => $schema->string()
                ->description('The AI client to get integration instructions for. Options: claude_desktop, claude_ai, chatgpt, cursor, windsurf. Leave empty to get all guides.')
                ->enum(['claude_desktop', 'claude_ai', 'chatgpt', 'cursor', 'windsurf']),
        ];
    }
}
