# AI Log - BlockNote Development

## 2024-12-19 (Day 1: Foundation)

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

## 2024-12-19 (Day 1: Frontend & Styling)

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

