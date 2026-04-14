# MCPify — Initial Task for Claude Code

## Context
Read CLAUDE.md and ROADMAP.md fully before starting.
We are building MCPify — a "Stripe for MCP" platform.
Starting with **Phase 0: Foundation**.

---

## Task: Bootstrap the full project structure

### Step 1 — Create monorepo root
```
mcpify/
├── CLAUDE.md
├── ROADMAP.md
├── .gitignore
└── README.md
```

### Step 2 — Bootstrap Laravel backend
```bash
cd mcpify
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum laravel/cashier laravel/horizon laravel/telescope spatie/laravel-permission
```

Create these migrations in order:
1. `teams` table
2. `users` table (add `current_team_id` foreign key)
3. `team_user` pivot (role: owner/member)
4. `subscriptions` table (Cashier)
5. `services` table
6. `api_configs` table
7. `mcp_tools` table
8. `tool_calls` table

Models to create:
- `User` (has team, belongsToTeam)
- `Team` (has users, has services, has subscription)
- `Service` (belongs to team, has tools, has apiConfig)
- `ApiConfig` (belongs to service)
- `McpTool` (belongs to service)
- `ToolCall` (belongs to service, belongs to tool)

Create `Plan` enum:
```php
enum Plan: string {
    case Free = 'free';
    case Starter = 'starter';
    case Growth = 'growth';
    case Business = 'business';
}
```

Create `ServiceStatus` enum:
```php
enum ServiceStatus: string {
    case Draft = 'draft';
    case Active = 'active';
    case Paused = 'paused';
}
```

Auth API endpoints (Sanctum SPA):
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`

Services CRUD endpoints:
- `GET    /api/v1/services`
- `POST   /api/v1/services`
- `GET    /api/v1/services/{id}`
- `PATCH  /api/v1/services/{id}`
- `DELETE /api/v1/services/{id}`

All responses must use API Resources.
All write operations must use Form Requests.
All ownership checks must be in policies.

### Step 3 — Bootstrap React frontend
```bash
cd mcpify
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npx shadcn@latest init
```

Install and configure:
- `react-router-dom`
- `@tanstack/react-query`
- `axios`
- `sonner`
- `framer-motion`
- `recharts`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `lucide-react`

Create the app layout matching this design:
- Left sidebar (280px) with navigation
- Top header with search + user menu
- Main content area

Sidebar navigation items:
- Dashboard (grid icon)
- Services (plug icon)
- Analytics (bar chart icon)
- Settings (settings icon)
- Billing (credit card icon)

Color scheme (from CLAUDE.md design system):
- Primary: #6366F1 (Indigo)
- Background: #F8F9FA
- Surface: white
- Active sidebar item: indigo background, white text

Create these pages (stub content is fine):
- `/` → redirect to `/dashboard`
- `/dashboard` → Dashboard page
- `/services` → Services list
- `/services/new` → Create service wizard
- `/services/:id` → Service detail
- `/analytics` → Analytics
- `/settings` → Settings
- `/billing` → Billing

Create auth pages:
- `/login`
- `/register`

Create axios client with:
- baseURL from `VITE_API_URL`
- withCredentials: true (Sanctum)
- request interceptor: add CSRF token header
- response interceptor: redirect to /login on 401

### Step 4 — Bootstrap MCP Worker
```bash
cd mcpify
mkdir mcp-worker && cd mcp-worker
npm init -y
npm install @modelcontextprotocol/sdk fastify pg dotenv
npm install -D typescript @types/node ts-node nodemon
```

Create minimal MCP server:
- `src/server.ts` — Fastify HTTP server on PORT from env
- `src/mcp/handler.ts` — handles MCP protocol
- `GET /health` — health check endpoint
- `GET /mcp/:token` — MCP server endpoint (stub for now, return empty tools list)

### Step 5 — Docker Compose for local dev
Create `docker-compose.yml` in root:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: mcpify
      POSTGRES_USER: mcpify
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Expected result after this task

Running services:
- `http://localhost:8000` → Laravel API returns JSON
- `http://localhost:5173` → React app with sidebar layout + auth pages
- `http://localhost:3001/health` → MCP Worker returns `{"status":"ok"}`

Working flows:
1. Register new user → creates user + team
2. Login → returns auth token
3. `GET /api/v1/services` → returns empty array (authenticated)
4. Frontend shows login page, redirects to dashboard after auth

---

## Start command
After bootstrapping, run all three services and confirm they start without errors.
Report any issues before proceeding to Phase 1.
