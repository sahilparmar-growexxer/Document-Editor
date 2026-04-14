# AI Log - BlockNote Development

## 2024-04-13 (Day 1: Foundation)

**Tool:** GitHub Copilot Chat

**What I asked for:**
Build a production-ready Notion-like block editor backend and minimal frontend. Day 1 completeness with auth, document CRUD, and PostgreSQL.

**What it generated:**
- Full backend structure (Express.js with clean architecture: controller/service/repository)
- Database schema (users, documents, blocks tables)
- JWT authentication endpoints (register, login, refresh)
- Document CRUD endpoints (POST, GET, PATCH, DELETE)
- Migration runner script
- Basic Next.js frontend with auth flows

**What was wrong or missing:**
- Migrations were not idempotent — ran every boot, causing constraint violations
- Database config didn't support explicit PG env vars (PGHOST, PGUSER, etc.)
- Mixed CommonJS (require) and ES6 modules in backend (stated as TypeScript but generated JavaScript)
- No block editor UI (skeleton only)
- No sharing feature UI (schema columns present but unused)
- Frontend had no styling or visual polish

**What I changed and why:**
1. **Migration idempotency** — Added `schema_migrations` tracking table to prevent re-running applied migrations. Essential for repeatability across dev/staging/prod environments.
2. **Database config** — Manually rewrote env.js and db.js to support PGHOST/PGUSER/PGPASSWORD/PGDATABASE precedence over DATABASE_URL. This allows flexibility in deployment (env vars standard in cloud platforms).
3. **Backend module conversion** — Converted all files from CommonJS to ES6 imports/exports:
   - Changed `package.json` type to "module"
   - Replaced `require()` → `import`, `module.exports` → `export default`
   - Fixed database config to use `new URL()` instead of `url.parse()` (WHATWG API)
   - Renamed service/controller imports with aliases to avoid shadowing
   - Why: ES6 is the modern standard; allows consistent codebase, better tree-shaking, and native Node.js support

---

## 2024-04-13 (Day 1: Frontend & Styling)

**Tool:** GitHub Copilot Chat

**What I asked for:**
Add Tailwind CSS and make the UI attractive with dark theme and cyan accents.

**What it generated:**
- Tailwind CSS configuration (postcss.config.mjs, tailwind.config.js)
- Global CSS with custom Tailwind theme
- Redesigned all pages (home, login, register, dashboard) with glass morphism effect
- Google Fonts integration (Manrope, Space Grotesk)

**What was wrong or missing:**
- Initially had improper Tailwind imports in globals.css
- TypeScript deprecation warning in tsconfig.json (ignoreDeprecations)
- No dev recovery mechanism for stale Next.js cache

**What I changed and why:**
1. **Fixed Tailwind imports** — Changed from `@tailwind` to `@import "tailwindcss"` (v4 syntax). Ensured postcss.config.mjs properly exports the config object.
2. **Added CSS variables** — Created custom --surface-*, --accent-*, --ring variables for consistent theming across components.
3. **Added dev:clean script** to package.json: `rm -rf .next node_modules/.cache && next dev`. Why: Prevents recurring webpack chunk cache invalidation issues without manual intervention.

---

## 2026-04-13 (Frontend Migration: Next.js to React + Vite)

**Tool:** GitHub Copilot Chat

**What I asked for:**
Convert the entire frontend from Next.js to React.js.

**What it generated:**
- A Vite-based React frontend scaffold
- React Router routes for home, login, register, and dashboard screens
- A React entry point (`main.jsx`) and router shell (`App.jsx`)
- Vite-compatible environment variable handling and static deployment rewrite config

**What was wrong or missing:**
- The first pass still used Next.js assumptions in the package scripts and environment variable prefixing
- Vite initially would have run on its default port, which would have conflicted with the existing backend CORS setup
- The README still described the frontend as Next.js after the migration

**What I changed and why:**
1. **Replaced Next.js with Vite + React Router** — Removed Next-specific entry points and moved the UI to a static React app. This made the frontend simpler, faster to build, and easier to deploy separately from the backend.
2. **Changed env handling to `VITE_API_URL`** — Updated the API client and `.env.local` to use Vite’s browser-exposed env prefix. This is required because Next’s `NEXT_PUBLIC_*` variables do not work in Vite.
3. **Pinned Vite to port 3000** — Configured the dev server and preview server to use port 3000 so the existing backend CORS policy stayed valid and local development remained predictable.
4. **Added Vercel SPA rewrites** — Configured `vercel.json` so route refreshes like `/dashboard` resolve correctly after a static Vite build.
5. **Updated the README** — Rewrote the frontend setup, environment variables, and troubleshooting sections so the docs match the new stack.
6. **Verified the build** — Ran a clean Vite production build and confirmed it completed successfully before closing out the migration.

---

## 2026-04-14

**Tool:** GitHub Copilot Chat

**What I asked for:**
Implement Day 2 core editor behavior: Enter key split, Backspace merge, render all 7 block types, and add a slash command menu.

**What it generated:**
- Core block editing flow with keyboard handlers for split and merge behavior
- Renderer coverage for 7 block types used by the editor
- Slash command trigger/menu scaffold for inserting block types quickly
- Integration wiring between editor state and block operations

**What was wrong or missing:**
- Edge cases in split/merge behavior were inconsistent at cursor boundaries
- Some block render paths needed normalization to avoid fallback rendering
- Slash menu keyboard navigation and dismissal behavior needed refinement
- UX polish was incomplete (spacing, visual consistency, and interaction feedback)

**What I changed and why:**
1. Refined Enter split logic to preserve cursor intent and prevent unexpected empty block artifacts.
2. Tightened Backspace merge handling so adjacent-block joins are deterministic and do not drop content.
3. Normalized rendering for all 7 block types to ensure consistent output and reduce type-specific regressions.
4. Improved slash command behavior (open/close, selection, insertion flow) so command input feels predictable and fast.
5. Added targeted UI polish to keep editor interactions aligned with the rest of the product experience.

