# HubNest CRM — Full Implementation Reference

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| State | Zustand + `persist` middleware |
| Charts | Recharts |
| Backend | Node.js, Express.js, `express-async-errors` |
| Database | PostgreSQL (pg-pool) |
| Cache / OTP | Redis (ioredis) — Memurai on Windows |
| Auth tokens | JWT via `jsonwebtoken` (server) + `jose` (Next.js middleware) |
| Passwords | bcryptjs |
| Email | Nodemailer (SMTP) |

---

## Database Schema

All tables live in a single shared PostgreSQL database. Every data table carries `tenant_id` for multi-tenancy isolation.

### Core Tables (migrations 001–005)

```
tenants
  id UUID PK
  name VARCHAR
  schema_name VARCHAR UNIQUE   -- slug used for tenant identification
  status Active|Inactive|Suspended

roles
  id UUID PK
  name VARCHAR UNIQUE          -- e.g. "Sales Manager"
  permissions JSONB            -- { module: { create, read, update, delete } }

users
  id UUID PK
  tenant_id → tenants.id
  role_id → roles.id
  name, email UNIQUE, admin_id UNIQUE
  password_hash TEXT
  status Active|Inactive|Suspended

otp_tokens
  id UUID PK
  user_id → users.id
  otp VARCHAR, expires_at, used BOOLEAN
  (primary store is Redis; this is a fallback)

refresh_tokens
  id UUID PK
  user_id → users.id
  token TEXT UNIQUE
  expires_at, revoked BOOLEAN
```

### Marketing Module (migration 006)

```
campaigns
  id, tenant_id, name, type, platform
  budget_daily, budget_total, start_date, end_date
  status Draft|Active|Paused|Completed
  target_audience JSONB, content JSONB
  created_by → users.id

leads_marketing                              ← shared lead table (Sales + Marketing)
  id, tenant_id
  campaign_id → campaigns.id
  name, phone, email, source, platform
  status New|Contacted|Qualified|…
  quality_score INT, assigned_to → users.id
  [extended by 007] priority Hot|Warm|Cold
                    company, notes, next_followup
                    conversion_probability INT (0–100)
  [extended by 008] assigned_by → users.id, escalated BOOLEAN

campaign_analytics
  id, campaign_id, date
  impressions, clicks, leads, cost, revenue
```

### Sales Module (migration 007)

```
tasks
  id, tenant_id, user_id → users.id
  lead_id → leads_marketing.id
  type Call|Meeting|Follow-up|Email
  title, scheduled_at, completed_at
  status Pending|Done|Missed
  priority High|Medium|Low, notes

activities
  id, tenant_id, user_id, lead_id
  type Call|Email|Meeting
  outcome Connected|No Answer|Interested|…|Converted|Lost
  duration_seconds, notes

sales_targets
  id, tenant_id, user_id
  month, year (unique per user)
  target_amount, achieved_amount
  target_leads, converted_leads
```

### Sales Manager Module (migration 008)

```
teams
  id, tenant_id, manager_id → users.id
  name, description

team_members
  id, team_id, user_id, tenant_id
  UNIQUE(team_id, user_id)

lead_assignments
  id, tenant_id, lead_id, assigned_to, assigned_by, assigned_from
  notes, assigned_at

manager_targets
  id, tenant_id, manager_id
  month, year (unique per manager)
  revenue_target, revenue_achieved
  leads_target, leads_converted, team_target

login_logs
  id, tenant_id, user_id, email, ip_address, user_agent
  status success|failed|blocked, created_at
```

### Support Module (migration 009)

```
customers
  id, tenant_id, name, email UNIQUE per tenant
  phone, company, status Active|Inactive

support_tickets
  id, tenant_id
  customer_id → customers.id
  assigned_agent_id → users.id
  title, description
  category Technical|Billing|General
  priority High|Medium|Low
  status Open|In Progress|Resolved|Closed
  sla_deadline TIMESTAMPTZ
  satisfaction_rating (1–5), satisfaction_feedback

support_ticket_messages
  id, ticket_id → support_tickets.id
  sender_type Agent|Customer
  sender_id UUID (user_id or customer_id)
  message TEXT, is_internal_note BOOLEAN

knowledge_base_articles
  id, tenant_id, title, content, category
  status Draft|Published
  views_count, likes_count, dislikes_count
  created_by → users.id

knowledge_base_comments
  id, article_id → knowledge_base_articles.id
  user_id → users.id
  is_like BOOLEAN (true=like, false=dislike)
```

### Table Relationship Map

```
tenants ──< users ──< tasks
         │         ──< activities
         │         ──< sales_targets
         │         ──< teams (via manager_id)
         │         ──< otp_tokens
         │         ──< refresh_tokens
         │         ──< login_logs
         │
         ──< campaigns ──< leads_marketing ──< tasks
         │              ──< campaign_analytics  ──< activities
         │                                      ──< lead_assignments
         │
         ──< teams ──< team_members ──> users
         │
         ──< customers ──< support_tickets ──< support_ticket_messages
         │
         ──< knowledge_base_articles ──< knowledge_base_comments

roles ──< users (role_id)
```

---

## RBAC System

### 9 Roles

| Role | Scope | Dashboard Route |
|------|-------|----------------|
| Super Admin | Cross-tenant — manages all organizations | `/super-admin/dashboard` |
| Admin | Single tenant — manages all departments | `/admin/dashboard` |
| Marketing Head | Campaigns, leads, ROI | `/marketing/dashboard` |
| Marketing Executive | Campaign execution only | `/marketing/dashboard` |
| Sales Manager | Team management, lead assignment, targets | `/sales-manager/dashboard` |
| Sales Executive | Own leads, tasks, activities only | `/sales/dashboard` |
| Support Manager | Full ticket queue, knowledge base, team | `/support/dashboard` |
| Support Agent | Assigned tickets, own messages | `/support/dashboard` |
| Finance Executive | Finance module read/write | `/finance/dashboard` |

### RBAC Enforcement (backend)

**Middleware chain per request:**
```
authenticate → authorize(module, action) OR role-specific guard
```

- `authenticate` (`server/src/middleware/auth.js`) — verifies JWT, attaches `req.user` with `{ id, tenant_id, role_id, role_name }`
- `authorize(module, action)` — checks `req.user.permissions[module][action]` from JSONB in `roles` table
- `authorizeSalesManager` — gate: `role_name === 'Sales Manager'`
- `authorizeSupport` — gate: role is `Support Manager` or `Support Agent`
- `authorizeSuperAdmin` — gate: `role_name === 'Super Admin'` (applied to all tenant management endpoints)
- `scopeGuard` — for Sales Executive routes: injects `WHERE user_id = req.user.id` filter, preventing cross-user data access

### Route → Middleware Map

| Route prefix | Guards |
|-------------|--------|
| `POST /auth/send-credentials` | authenticate + authorizeSuperAdmin |
| `POST /auth/create-tenant` | authenticate + authorizeSuperAdmin |
| `POST /auth/reset-tenant-admin` | authenticate + authorizeSuperAdmin |
| `POST /auth/block-tenant-admin` | authenticate + authorizeSuperAdmin |
| `POST /auth/delete-tenant-admin` | authenticate + authorizeSuperAdmin |
| `GET  /auth/tenant-admins` | authenticate + authorizeSuperAdmin |
| `/sales/*` | authenticate + scopeGuard + authorize |
| `/sales-manager/*` | authenticate + authorizeSalesManager |
| `/support/*` | authenticate + authorizeSupport |
| `/campaigns/*` | authenticate + authorize('campaigns', action) |
| `/marketing/leads/*` | authenticate + authorize |

### RBAC on Frontend

**`client/middleware.ts`** runs on every request (Edge runtime, uses `jose`):

1. **Root `/`**: reads `accessToken` cookie → jwtVerify → redirect to `ROLE_DASHBOARD_MAP[role]`
2. **Auth paths** (`/auth/*`, `/`): always allowed for unauthenticated users
3. **Protected path checks**: each role group's routes are checked with `startsWith`. Unauthorized role → redirect to their own dashboard.
4. **Path → allowed roles map:**

```
/super-admin/*  → ['Super Admin']
/admin/*        → ['Admin']
/sales-manager/*→ ['Sales Manager']
/sales/*        → ['Sales Executive', 'Sales Manager']
/marketing/*    → ['Marketing Head', 'Marketing Executive']
/support/*      → ['Support Manager', 'Support Agent']
/finance/*      → ['Finance Executive']
```

---

## Authentication Flow

### Login → OTP → Dashboard

```
1. POST /api/v1/auth/login
   body: { identifier, password }
   → verifies password hash (bcryptjs)
   → generates 6-digit OTP
   → stores OTP in Redis (key: otp:{user_id}, TTL 5 min)
   → sends OTP email (Nodemailer)
   → returns { message: 'OTP sent', userId }

2. POST /api/v1/auth/verify-otp
   body: { userId, otp }
   → reads OTP from Redis, validates
   → deletes Redis key on success
   → generates accessToken (JWT, 15 min) + refreshToken (JWT, 7 days)
   → stores refreshToken in DB (refresh_tokens table)
   → returns { accessToken, refreshToken, user: { id, name, email, role, tenant_id } }

3. Client (verify-otp/page.tsx):
   → stores accessToken in localStorage + cookie (path=/, max-age=900)
   → stores refreshToken in localStorage
   → router.replace(ROLE_DASHBOARDS[role])
```

### JWT Payload Shape

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "role_id": "uuid",
  "role_name": "Sales Manager",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Token Refresh

```
POST /api/v1/auth/refresh
body: { refreshToken }
→ verifies JWT signature + DB record (not revoked, not expired)
→ issues new accessToken (15 min)
→ returns { accessToken }
```

Axios interceptor in `client/services/api.ts`:
- On 401: attempts refresh using `localStorage.getItem('refreshToken')`
- On refresh failure: removes `accessToken` + `refreshToken` from localStorage, clears cookie, redirects to `/auth/login`

### Logout

```
POST /api/v1/auth/logout
body: { refreshToken }
→ sets revoked=true on refresh_tokens row
→ client: clears Zustand store, localStorage keys, cookie
```

---

## Session Timer

**Component:** `client/components/SessionTimer.tsx`

- Reads `exp` from JWT payload to calculate exact remaining seconds
- Renders amber toast (bottom-right) when ≤ 120 seconds remain
- "Extend Session" button calls `/api/v1/auth/refresh`, updates Zustand + cookie
- Auto-logout at 0 seconds
- Rendered in every layout component

---

## Frontend Module Structure

```
client/app/
  page.tsx                    ← Landing page (redirects logged-in users)
  auth/
    login/page.tsx
    verify-otp/page.tsx       ← Issues tokens, redirects to role dashboard
  super-admin/
    layout.tsx + dashboard/ users/ tenants/ settings/ reports/ logs/
  admin/
    layout.tsx + dashboard/ users/ roles/ reports/ crm-control/ profile/
  marketing/
    layout.tsx + dashboard/ campaigns/ leads/ analytics/ settings/
  sales/                      ← Sales Executive routes
    layout.tsx + dashboard/ leads/ tasks/ activity/ profile/
  sales-manager/
    layout.tsx + dashboard/ team/ leads/ targets/ reports/
  support/
    layout.tsx + dashboard/ tickets/ knowledge-base/ customers/ settings/
  finance/
    layout.tsx + dashboard/ invoices/ reports/ settings/
  dashboard/page.tsx          ← Generic fallback redirect

client/components/
  super-admin/Sidebar.tsx
  shared/AdminSidebar.tsx     ← Used by Admin, Support, Sales Manager
  marketing/MarketingSidebar.tsx
  sales/SalesSidebar.tsx
  SessionTimer.tsx

client/store/
  authStore.ts                ← Zustand: user, accessToken, refreshToken, logout()

client/services/
  api.ts                      ← Axios instance + refresh interceptor
  auth.ts                     ← login, verifyOtp, logout, refreshToken
  salesManagerService.ts
  supportService.ts

client/middleware.ts          ← Next.js Edge middleware: route protection + root redirect
```

---

## Multi-Tenancy

- Every data table has `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- `authenticate` middleware reads `tenant_id` from JWT and attaches to `req.user`
- All DB queries filter by `tenant_id = $1` — users from one tenant cannot see another tenant's data
- Super Admin operates across tenants (no `tenant_id` filter on management endpoints)
- Admin is scoped to their own tenant

### Tenant Lifecycle (Super Admin only)

```
POST /auth/create-tenant       → creates tenants row + Admin user, sends credentials email
POST /auth/send-credentials    → resends credential email to tenant admin
POST /auth/reset-tenant-admin  → resets tenant admin password
POST /auth/block-tenant-admin  → sets admin user status = Suspended
POST /auth/delete-tenant-admin → deletes admin user record
GET  /auth/tenant-admins       → lists all tenant admins
```

---

## Environment Variables

```
# Server
DATABASE_URL=postgresql://user:pass@localhost:5432/hubnest_crm
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
FROM_EMAIL

# Client (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Quick Start

```bash
# PostgreSQL — run all migrations in order
psql -U postgres -d hubnest_crm -f server/migrations/001_create_tenants.sql
# ... through 009

# Backend
cd server && npm install && npm run dev   # port 5000

# Frontend
cd client && npm install && npm run dev   # port 3000
```

**Windows note:** Redis must be running via Memurai (`winget install Memurai.Memurai-Developer`). PostgreSQL service must be active (`Start-Service postgresql-x64-18`).

---

## Security Notes

- Super Admin API endpoints require both `authenticate` + `authorizeSuperAdmin` — no public access
- Sales Executive data is scope-guarded server-side (`scopeGuard` middleware) — cannot query other users' leads
- `localStorage.clear()` is never called — only specific keys (`accessToken`, `refreshToken`) are removed on logout/token failure to avoid wiping unrelated browser state
- OTP Redis keys are deleted immediately on successful verification
- Refresh tokens are revoked server-side on logout (not just client-cleared)
- Admin role cannot see Super Admin role in the Roles Management page; "Primary Super Admin" label is not shown in the Admin profile view
