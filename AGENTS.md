# MCPify — Codex Instructions

## Project Overview
MCPify is a "Stripe for MCP" platform. It allows any SaaS/website to expose
their REST API as an MCP server, making their product accessible to AI clients
(Codex, ChatGPT, Cursor) without writing any MCP code themselves.

**Monorepo structure:**
- `backend/` — Laravel 11 API
- `frontend/` — React 18 + Vite SPA
- `mcp-worker/` — Node.js TypeScript MCP runtime

---

## Tech Stack

### Backend (backend/)
- PHP 8.2, Laravel 11
- PostgreSQL 16 (primary DB)
- Redis 7 (queue, cache, sessions)
- Laravel Horizon (queue monitoring)
- Laravel Sanctum (SPA auth)
- Laravel Cashier (Stripe billing)
- Laravel Telescope (dev only)

### Frontend (frontend/)
- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- shadcn/ui (Radix UI based components)
- React Router 6
- TanStack Query 5
- Recharts (charts)
- React Hook Form + Zod (forms)
- Framer Motion (animations)
- Lucide React (icons)
- Sonner (toast notifications)

### MCP Worker (mcp-worker/)
- Node.js 22 + TypeScript
- @modelcontextprotocol/sdk (official MCP SDK)
- Fastify (HTTP server)
- pg (PostgreSQL client, read-only access)

---

## Development Commands

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve              # http://localhost:8000
php artisan horizon            # queue worker
php artisan telescope:install  # dev only
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev    # http://localhost:5173
npm run build
npm run lint
npm run typecheck
```

### MCP Worker
```bash
cd mcp-worker
npm install
cp .env.example .env
npm run dev    # http://localhost:3001
npm run build
npm run start
```

---

## Coding Standards

### PHP/Laravel
- PSR-12 code style (Laravel Pint enforced)
- Strict types: `declare(strict_types=1)` in every file
- Type hints everywhere — no untyped parameters or returns
- Use Form Requests for validation (never validate in controllers)
- Use API Resources for responses (never return models directly)
- Use Actions classes for business logic (not fat controllers/models)
- Repository pattern for complex queries
- Enums over string constants (PHP 8.1+ enums)
- No raw SQL — use Eloquent or Query Builder
- Always use database transactions for multi-step operations

```php
// ✅ Good
final class CreateServiceAction
{
    public function execute(CreateServiceData $data): Service
    {
        return DB::transaction(function () use ($data): Service {
            $service = Service::create([...]);
            $service->apiConfig()->create([...]);
            return $service;
        });
    }
}

// ❌ Bad — fat controller
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $service = Service::create($validated);
    return $service;
}
```

### TypeScript/React
- Strict TypeScript — no `any`, no implicit types
- Functional components only — no class components
- Custom hooks for all data fetching (TanStack Query)
- Zod schemas for all API response types
- Named exports (not default) for components
- Barrel exports via `index.ts` in each directory
- CSS: Tailwind utility classes only — no inline styles, no CSS modules

```tsx
// ✅ Good
interface ServiceCardProps {
  service: Service;
  onEdit: (id: string) => void;
}

export function ServiceCard({ service, onEdit }: ServiceCardProps) {
  return (...)
}

// ❌ Bad
export default function({ service, onEdit }: any) {
  return (...)
}
```

---

## Database Conventions

- Table names: `snake_case` plural (`mcp_tools`, `tool_calls`, `api_configs`)
- Foreign keys: `{table_singular}_id` (`service_id`, `team_id`)
- Timestamps: always `created_at`, `updated_at` on every table
- Soft deletes: `deleted_at` on Service, Team, User models
- JSON columns: encrypted if they contain credentials (`api_configs.auth_config`)
- UUIDs: use for public-facing IDs (MCP tokens, service slugs)
- Integer IDs: use internally for FK relations (performance)
- Never store plain text secrets — always `encrypt()` / `decrypt()`

```php
// Migration example
Schema::create('services', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();  // public-facing
    $table->foreignId('team_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('description')->nullable();
    $table->string('status')->default('draft'); // draft|active|paused
    $table->string('mcp_url_token', 64)->unique();
    $table->timestamps();
    $table->softDeletes();
});
```

---

## API Structure

Base URL: `/api/v1/`

Response format:
```json
// Success
{ "data": {...}, "meta": {} }

// Collection
{ "data": [...], "meta": { "total": 10, "per_page": 15 } }

// Error
{ "message": "Validation failed", "errors": { "name": ["required"] } }
```

HTTP status codes:
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden
- 404 Not Found, 422 Unprocessable Entity
- 429 Too Many Requests, 500 Server Error

Routes structure:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout

GET    /api/v1/services
POST   /api/v1/services
GET    /api/v1/services/{id}
PATCH  /api/v1/services/{id}
DELETE /api/v1/services/{id}

POST   /api/v1/services/{id}/connect/openapi
POST   /api/v1/services/{id}/connect/manual
GET    /api/v1/services/{id}/tools
PATCH  /api/v1/tools/{id}

GET    /api/v1/services/{id}/analytics
GET    /api/v1/billing/plans
POST   /api/v1/billing/subscribe
```

---

## Frontend Structure

```
frontend/src/
├── api/              # TanStack Query hooks + axios client
│   ├── client.ts     # axios instance with interceptors
│   ├── services.ts   # useServices, useService, useCreateService...
│   ├── tools.ts
│   └── analytics.ts
├── components/
│   ├── ui/           # shadcn components (don't modify)
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── [feature]/    # feature-specific components
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── services/
│   ├── analytics/
│   └── billing/
├── hooks/            # custom non-query hooks
├── lib/
│   ├── utils.ts      # cn() and other utils
│   └── schemas.ts    # shared Zod schemas
└── types/            # shared TypeScript interfaces
```

---

## Environment Variables

### Backend (.env)
```
APP_NAME=MCPify
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=mcpify
DB_USERNAME=mcpify
DB_PASSWORD=secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

MCP_WORKER_URL=http://localhost:3001
MCP_WORKER_SECRET=secret_key_here

MAIL_MAILER=resend
RESEND_API_KEY=re_...

SENTRY_LARAVEL_DSN=
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=MCPify
VITE_STRIPE_KEY=pk_test_...
```

### MCP Worker (.env)
```
PORT=3001
DATABASE_URL=postgresql://mcpify:secret@localhost:5432/mcpify
WORKER_SECRET=secret_key_here
NODE_ENV=development
```

---

## Key Business Rules

1. **Plan limits** — enforce before any create operation:
   - Check `services_count < plan.max_services`
   - Check `monthly_calls < plan.max_calls` (Redis counter)
   - Return 403 with upgrade prompt if exceeded

2. **Destructive tools** — tools with DELETE/dangerous methods:
   - Auto-detect from HTTP method
   - Set `is_destructive = true`, `is_enabled = false` by default
   - Require explicit enable by user

3. **Credential encryption** — always:
   - `api_configs.auth_config` — encrypted JSON
   - Never log credentials
   - Never return credentials in API responses

4. **MCP token** — unique per service:
   - 64-char random string
   - Regeneratable by user (old token immediately invalid)
   - Rate limited: 100 req/min per token

5. **Multi-tenancy** — always scope to team:
   - Every query must include `->where('team_id', auth()->user()->current_team_id)`
   - Use global scopes or base repository methods
   - Never trust user-provided IDs without ownership check

---

## Testing

### Backend
```bash
php artisan test                    # all tests
php artisan test --filter=Service   # specific
```

- Feature tests for all API endpoints (use RefreshDatabase)
- Unit tests for Actions and Services classes
- Use factories for test data
- Never hit real external APIs in tests (mock Http facade)

### Frontend
```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
```

---

## Git Conventions

Branch naming:
- `feature/phase-1-api-connector`
- `fix/mcp-token-generation`
- `chore/update-dependencies`

Commit format (conventional commits):
```
feat: add OpenAPI spec parser
fix: correct tool call rate limiting
chore: update MCP SDK to 1.8.0
docs: add API authentication guide
```

---

## What NOT to do

- ❌ Don't put business logic in controllers — use Action classes
- ❌ Don't return Eloquent models directly — use API Resources
- ❌ Don't use `any` in TypeScript
- ❌ Don't store credentials in plain text
- ❌ Don't skip ownership checks on any resource
- ❌ Don't use `sleep()` or sync HTTP calls in queue jobs
- ❌ Don't import shadcn components from anywhere except `@/components/ui`
- ❌ Don't add inline styles — Tailwind only
- ❌ Don't commit `.env` files

---

## Current Phase

**Phase 0 — Foundation**
See ROADMAP.md for full details.

Current focus: project skeleton, auth, database structure, basic UI layout.
