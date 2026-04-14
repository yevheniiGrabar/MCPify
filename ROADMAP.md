# MCPify — ROADMAP

> **"Stripe for MCP. Connect your API — get AI-ready in minutes."**
>
> Платформа которая позволяет любому SaaS-продукту добавить MCP сервер
> и стать доступным для Claude, ChatGPT, Cursor — без кода.

---

## 🏷️ Название проекта

**MCPify** — главный вариант
- `mcpify.io` / `mcpify.dev`
- Говорит само за себя: "MCPify your API"
- Легко произносится на английском

Альтернативы (если .io занят):
- **Conduit** — "канал между API и AI"
- **Relay** — "relay your API to AI clients"
- **Portway** — "port your API to AI"

---

## 🛠️ Tech Stack

### Frontend
| Технология | Версия | Зачем |
|-----------|--------|-------|
| React | 18 | UI framework |
| Vite | 6 | Build tool, HMR |
| Tailwind CSS | 3.x | Utility CSS |
| shadcn/ui | latest | Component library (Radix-based) |
| React Router | 6 | SPA routing |
| TanStack Query | 5 | Server state, caching |
| Recharts | 2 | Analytics charts |
| React Hook Form + Zod | latest | Forms + validation |
| Framer Motion | 11 | Animations |
| Lucide React | latest | Icons |

### Backend
| Технология | Версия | Зачем |
|-----------|--------|-------|
| Laravel | 11 | Core API, auth, billing |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Queue, cache, sessions |
| Laravel Horizon | latest | Queue monitoring |
| Laravel Sanctum | latest | API auth (SPA) |
| Laravel Telescope | latest | Debug & monitoring (dev) |

### MCP Server Runtime
| Технология | Зачем |
|-----------|-------|
| Node.js 22 + TypeScript | MCP SDK официально на TS |
| `@modelcontextprotocol/sdk` | Official MCP SDK |
| Fastify | HTTP transport для remote MCP |
| Docker | Контейнеризация MCP worker-ов |

### Infrastructure
| Сервис | Зачем |
|--------|-------|
| Laravel Forge + DigitalOcean/Hetzner | Backend хостинг |
| Vercel | Frontend хостинг |
| Railway / Fly.io | MCP Server workers |
| Cloudflare | CDN, DDoS, DNS |
| S3 / Cloudflare R2 | File storage |
| Stripe | Billing & subscriptions |
| Resend | Transactional email |
| Sentry | Error tracking |

---

## 📐 Архитектура (упрощённо)

```
┌─────────────────────────────────────────────────────────────┐
│                    MCPify Platform                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   React SPA  │───▶│  Laravel API │───▶│  PostgreSQL  │  │
│  │   (Vercel)   │    │  (Forge/DO)  │    │   + Redis    │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │  MCP Worker     │                      │
│                    │  (Node.js/TS)   │                      │
│                    │  Railway/Fly.io │                      │
│                    └────────┬────────┘                      │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ MCP Protocol (Streamable HTTP)
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼───┐    ┌──────▼──┐    ┌──────▼──┐
         │ Claude │    │ ChatGPT │    │  Cursor │
         │Desktop │    │  (GPT)  │    │  / IDE  │
         └────────┘    └─────────┘    └─────────┘
```

---

## 🗺️ Roadmap

---

### Phase 0 — Foundation (Неделя 1–2)
> Цель: рабочий скелет проекта

#### Backend (Laravel)
- [ ] `laravel new mcpify` — свежий проект
- [ ] PostgreSQL setup, migrations baseline
- [ ] Laravel Sanctum — SPA auth (login, register, email verify)
- [ ] User model + Team model (multi-tenancy основа)
- [ ] Subscription model (plan: free/starter/growth/business)
- [ ] Stripe интеграция — Cashier, webhook handler
- [ ] Basic RBAC: owner / member роли в команде
- [ ] API структура: `/api/v1/...`
- [ ] Telescope (dev) + Horizon setup
- [ ] .env структура, config/services.php

#### Frontend (React)
- [ ] `npm create vite@latest` — React + TypeScript
- [ ] Tailwind + shadcn/ui init
- [ ] React Router — layouts setup
- [ ] TanStack Query — axios client + query client
- [ ] Auth flow: Login / Register / Forgot Password страницы
- [ ] Layout: Sidebar + Header (как на скриншоте)
- [ ] Protected routes
- [ ] Global toast notifications (Sonner)

#### DevOps
- [ ] GitHub repo, branch strategy (main/develop)
- [ ] GitHub Actions: lint + tests на PR
- [ ] Vercel deploy (frontend)
- [ ] Forge server setup (backend)

---

### Phase 1 — Core MVP (Неделя 3–6)
> Цель: клиент может подключить свой API и получить рабочий MCP URL

#### Сущности БД
```sql
services          -- MCP сервисы клиента
  id, team_id, name, description, status, mcp_url_token

api_configs       -- конфигурация подключения к API клиента
  id, service_id, type (openapi|manual|database)
  base_url, auth_type, auth_config (encrypted JSON)
  openapi_spec_url, openapi_spec_json

mcp_tools         -- сгенерированные MCP tools
  id, service_id, name, description, http_method
  endpoint_path, input_schema (JSON), output_schema (JSON)
  is_enabled, is_destructive, sort_order

tool_calls        -- лог всех вызовов
  id, service_id, tool_id, called_at, duration_ms
  input_params, response_status, error_message
```

#### Backend — API Connector
- [ ] `POST /services` — создать сервис
- [ ] `POST /services/{id}/connect/openapi` — загрузить OpenAPI spec (URL или JSON)
- [ ] OpenAPI Parser (используй `league/openapi-psr7-validator` или парси вручную)
  - Парсит paths, methods, параметры, описания
  - Создаёт записи `mcp_tools` с авто-описаниями
- [ ] `POST /services/{id}/connect/manual` — добавить эндпоинт вручную
- [ ] `GET /services/{id}/tools` — список tools
- [ ] `PATCH /tools/{id}` — редактировать tool (название, описание, включить/выключить)
- [ ] `DELETE /tools/{id}`

#### Backend — MCP Worker (Node.js)
- [ ] Отдельный сервис: `mcpify-worker` (TypeScript)
- [ ] HTTP endpoint: `GET /mcp/{token}` — отдаёт MCP capabilities
- [ ] MCP Streamable HTTP transport
- [ ] При tool call: читает конфиг из БД → делает HTTP запрос к API клиента → возвращает результат
- [ ] Базовая авторизация по `mcp_url_token`
- [ ] Error handling: таймауты, 4xx/5xx от upstream

#### Frontend — Service Setup Flow
- [ ] Страница "Создать сервис"
- [ ] Step 1: Название, описание, иконка
- [ ] Step 2: Connect — вставить OpenAPI URL или загрузить файл
- [ ] Step 3: Review tools — таблица с generated tools
  - toggle включить/выключить
  - редактировать описание inline
  - badge "DESTRUCTIVE" для DELETE методов
- [ ] Step 4: Get URL — показать MCP endpoint + инструкция как добавить в Claude/ChatGPT

#### Frontend — Dashboard
- [ ] Stat cards: Active Services, Total Tool Calls, Connected Users, Avg Response Time
- [ ] Список сервисов с статусом
- [ ] Quick actions

---

### Phase 2 — Auth & Security (Неделя 7–8)
> Цель: безопасная multi-tenant авторизация для end-users

#### OAuth 2.1 для MCP clients
- [ ] Laravel Passport — OAuth 2.1 сервер
- [ ] `authorization_code` flow с PKCE
- [ ] Клиент Васи (end-user) логинится через OAuth при подключении MCP сервера
- [ ] Токены привязаны к tenant — клиент A видит только свои данные
- [ ] Token refresh, revocation

#### API Key auth (альтернатива OAuth)
- [ ] Простой режим: клиент генерирует API key в своём SaaS → вставляет в MCPify
- [ ] MCPify форвардит этот ключ в каждом запросе к upstream API

#### Security
- [ ] Encrypt all credentials at rest (AES-256, Laravel Crypt)
- [ ] Rate limiting на MCP endpoint (per token)
- [ ] IP allowlist опция (enterprise)
- [ ] DESTRUCTIVE tools — require explicit confirmation flag
- [ ] Audit log каждого tool call (кто, когда, что, результат)

---

### Phase 3 — Analytics & Monitoring (Неделя 9–10)
> Цель: клиент понимает как используется его MCP сервер

#### Backend
- [ ] `tool_calls` агрегация — jobs для hourly/daily stats
- [ ] `GET /services/{id}/analytics` — endpoint с метриками
  - total calls, unique users, calls per tool
  - response times (p50, p95, p99)
  - error rate
  - daily chart data
- [ ] Alerting: email если error rate > 10% (queued job)

#### Frontend — Analytics страница
- [ ] Time range picker (7d / 30d / 90d)
- [ ] Line chart: calls over time (Recharts)
- [ ] Bar chart: top tools by usage
- [ ] Table: recent tool calls с деталями
- [ ] Error log с drill-down
- [ ] Export CSV

---

### Phase 4 — Billing & Plans (Неделя 11–12)
> Цель: платящие клиенты

#### Plans
```
Free:      1 сервис, 1,000 calls/мес,  basic auth
Starter:   3 сервиса, 10,000 calls,    $49/мес
Growth:    10 сервисов, 100,000 calls,  $149/мес, analytics
Business:  ∞ сервисов, 1M calls,        $399/мес, OAuth, white-label
Enterprise: custom pricing,             SSO, SLA, on-premise
```

#### Backend
- [ ] Stripe Cashier — subscription management
- [ ] Plan limits enforcement middleware
  - Services count check
  - Monthly calls quota (Redis counter, reset monthly)
- [ ] Overage billing: $0.001 per call сверх лимита
- [ ] Webhook handler: subscription.updated, payment_failed
- [ ] Grace period: 3 дня после failed payment

#### Frontend
- [ ] Pricing страница (public)
- [ ] Billing страница в дашборде
  - Current plan, usage progress bars
  - Upgrade/downgrade
  - Invoice history
- [ ] Usage warnings: 80% / 100% лимита → banner + email
- [ ] Upgrade modal при попытке превысить лимит

---

### Phase 5 — Polish & Growth (Неделя 13–16)
> Цель: retention, growth channels, developer experience

#### Developer Experience
- [ ] "Test Tool" — интерактивный playground в UI
  - Вася может вызвать tool прямо из дашборда
  - Видит request/response JSON
- [ ] Code snippets — как добавить в Claude Desktop, ChatGPT, Cursor
  - Копируемые конфиги
  - GIF-демо для каждого клиента
- [ ] Webhook events — notify клиента о tool calls (optional)
- [ ] Public API — для programmatic management

#### MCP Registry Integration
- [ ] Опция "Publish to MCP Registry" (mcpregistry.ai)
- [ ] Публичная страница сервиса: `mcpify.io/servers/property-manager`
  - название, описание, список tools
  - кнопка "Add to Claude"
  - install count badge

#### White-label (Business план)
- [ ] Custom domain для MCP endpoint: `mcp.client-domain.com`
- [ ] Убрать MCPify брендинг из emails
- [ ] Custom OAuth provider name

#### Onboarding
- [ ] Welcome flow для новых пользователей (3-step wizard)
- [ ] Sample service с демо-данными (JSONPlaceholder API)
- [ ] In-app tooltips (Radix Tooltip)
- [ ] Docs site (отдельно, можно Mintlify)

---

### Phase 6 — Enterprise (Месяц 5+)
> Цель: крупные клиенты, $999+/мес

- [ ] SSO (SAML/OIDC) для enterprise team login
- [ ] Advanced RBAC: custom roles, granular permissions
- [ ] On-premise / private cloud deployment option
- [ ] SLA monitoring dashboard
- [ ] Dedicated MCP server (изолированный worker per client)
- [ ] GraphQL support (вдобавок к REST)
- [ ] Database direct connector (PostgreSQL, MySQL, MongoDB)
- [ ] Audit export (SOC2 compliance)
- [ ] IP allowlisting per service

---

## 📁 Структура проекта

```
mcpify/
├── backend/                    # Laravel 11
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Auth/
│   │   │   │   ├── ServiceController.php
│   │   │   │   ├── ToolController.php
│   │   │   │   ├── AnalyticsController.php
│   │   │   │   └── BillingController.php
│   │   │   └── Middleware/
│   │   │       ├── CheckPlanLimits.php
│   │   │       └── CheckMcpToken.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Team.php
│   │   │   ├── Service.php
│   │   │   ├── ApiConfig.php
│   │   │   ├── McpTool.php
│   │   │   └── ToolCall.php
│   │   ├── Services/
│   │   │   ├── OpenApiParser.php       # парсит spec → tools
│   │   │   ├── ToolDescriptionAI.php   # улучшает описания через LLM
│   │   │   └── UsageTracker.php
│   │   └── Jobs/
│   │       ├── ParseOpenApiSpec.php
│   │       └── AggregateToolCallStats.php
│   └── ...
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── services/
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   ├── CreateServiceWizard.tsx
│   │   │   │   └── ToolsTable.tsx
│   │   │   └── analytics/
│   │   │       ├── CallsChart.tsx
│   │   │       └── StatsCards.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Services/
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── Create.tsx
│   │   │   │   └── Show.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Billing.tsx
│   │   ├── hooks/
│   │   ├── api/                # TanStack Query + axios
│   │   └── lib/
│   └── ...
│
└── mcp-worker/                 # Node.js TypeScript
    ├── src/
    │   ├── server.ts           # Fastify HTTP server
    │   ├── mcp/
    │   │   ├── handler.ts      # MCP protocol handler
    │   │   └── executor.ts     # Tool call → upstream API
    │   ├── db/
    │   │   └── client.ts       # PostgreSQL (read-only)
    │   └── auth/
    │       └── oauth.ts
    └── ...
```

---

## 🎨 Design System

Основан на скриншоте HireAI — чистый SaaS dashboard стиль:

```
Colors:
  Primary:    #6366F1  (Indigo-500)  ← violet/purple как в HireAI
  Background: #F8F9FA  (Gray-50)
  Surface:    #FFFFFF
  Border:     #E5E7EB  (Gray-200)
  Text:       #111827  (Gray-900)
  Muted:      #6B7280  (Gray-500)
  Success:    #22C55E  (Green-500)
  Warning:    #F59E0B  (Amber-500)
  Danger:     #EF4444  (Red-500)

Typography:
  Headings:  Geist (или DM Sans)
  Body:      Inter
  Mono:      Geist Mono (для MCP URLs, JSON)

Sidebar:    280px fixed, white bg, indigo active state
Cards:      rounded-xl, shadow-sm, white bg
Stats:      large number + trend badge (green/red)
```

---

## 🚀 Launch Strategy

### Месяц 1–2 (Build)
- Phase 0 + Phase 1 → рабочий MVP
- Внутреннее тестирование на своих проектах (GETIN, HireLang)

### Месяц 3 (Validate)
- 5–10 beta пользователей (Laravel community, Indie Hackers)
- Free plan, собрать feedback
- Fix critical bugs

### Месяц 4 (Monetize)
- Phase 4 — платные планы
- Product Hunt launch
- Laravel News / LaravelNews.com анонс
- r/SaaS, r/selfhosted пост

### Месяц 5+ (Scale)
- Phase 5 polish
- Content marketing: "How to make your Laravel app AI-ready"
- Partnership: Laravel Forge, Spatie, других Laravel SaaS

---

## ✅ Definition of Done (MVP)

MVP считается готовым когда:
1. Пользователь может зарегистрироваться и создать сервис
2. Вставить OpenAPI spec URL → получить список tools
3. Настроить tools (вкл/выкл, описания)
4. Получить MCP URL
5. Добавить этот URL в Claude Desktop и успешно вызвать tool
6. Видеть в дашборде что tool был вызван

**Это Phase 0 + Phase 1 = ~6 недель solo.**

---

*Roadmap version: 1.0 | Created: April 2026*
