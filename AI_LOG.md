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

---

## 2026-04-15 (Day 3: Nested Blocks, Indentation & Slash Menu Enhancements)

**Tool:** GitHub Copilot Chat

**What I asked for:**
Implement Day 3 features: nested blocks with indentation (bullet lists, numbered lists) and enhance the slash command menu with new list type entries.

**What it generated:**
- Two new block types: `bullet_list` and `numbered_list` with slash command menu entries
- Tab/Shift+Tab keyboard handlers for indent/outdent operations
- Backend-aware parent_id nesting structure using existing schema column
- Visual indentation rendering with bullet (•) and number (1) markers
- CSS styling for list items with flexible marker alignment
- Integration of indent/outdent callbacks in BlockEditor and BlockItem components
- Enhanced slash menu filtering to include list commands

**Slash Command Menu Enhancement Details:**

The slash command menu was extended to support the new list types accessibly:

1. **Type-based Filtering**
   - Menu options now include: Text, Heading 1, Heading 2, Heading 3, Bullet List, Numbered List, Code, Todo, Image, Divider
   - Real-time search filter: `/` + typing filters options (case-insensitive)
   - Example: Typing `/bu` shows "Bullet List", `/nu` shows "Numbered List"

2. **Keyboard Navigation**
   - Arrow Up/Down navigate menu items while menu is open
   - Enter selects highlighted item and converts block type
   - Escape closes menu without conversion (clears text)
   - Backspace removes characters from search query during search

3. **Visual Feedback**
   - Selected menu item highlighted with `.is-selected` class (darker background)
   - Mouse hover on items updates selection index
   - Empty state message when no matches: "No matching block type"

4. **Menu Trigger**
   - Triggered by `/` at start of empty line (cursor position 0)
   - Accessible from any text-based block type (paragraph, heading, list items, code, todo)
   - Menu positioned absolutely below editing area

5. **Type Conversion Flow**
   - Selecting list type clears current block text
   - Sets parent_id to null (creates root-level list item)
   - Content ready for editing immediately after conversion
   - Can be indented with Tab to become nested

**What was wrong or missing:**
- Initial implementation had copyShareLink function body removed during code edit
- Tab handler logic needed reordering to check Shift+Tab before general Tab (due to event key handling)
- List indentation needed proper visual alignment with markers

**What I changed and why:**
1. **Added list block types** — Extended TYPE_OPTIONS in BlockItem.jsx to include `bullet_list` and `numbered_list`. Why: Slash command menu now shows `/bullet` and `/number` options for quick list creation.
2. **Implemented Tab/Shift+Tab handlers** — Added keyboard logic to detect Tab at cursor position 0 and call onIndent, Shift+Tab triggers onOutdent. Why: Standard list indentation behavior matches Notion/Google Docs expectations.
3. **Created indent/outdent backends** — Added handleIndent/handleOutdent in BlockEditor.jsx that set/clear parent_id via updateBlock API. Why: Nesting structure is already in schema; leveraging existing database column eliminates need for new migrations.
4. **Nested block rendering** — Added list item rendering with margin-left based on parent_id presence. Displays bullet (•) or number (1) marker in styled wrapper. Why: Visual indentation provides hierarchical structure clarity without deeply nested DOM.
5. **Fixed Tab hierarchy** — Moved Shift+Tab check before general Tab handler to prevent event re-firing. Why: JavaScript's keydown semantics require modifier+key checks before base key checks.
6. **CSS list styling** — Added `.editor-list-wrap` flex layout, `.editor-list-marker` alignment, and `.editor-bullet_list|numbered_list` content styles. Why: Consistent with dark theme gradient backgrounds and cyan accent colors.

**Code changes:**
- [web/src/components/editor/BlockItem.jsx]:
  - Added `bullet_list` and `numbered_list` to TYPE_OPTIONS (9 total block types)
  - New helper `isListType(type)` function for type-specific behavior
  - Enhanced handleKeyDown with Tab/Shift+Tab indentation logic at cursor position 0
  - Slash menu filtering includes all new types via useMemo filter
  - New list item rendering block with marker display and visual indentation
  - Added onIndent, onOutdent prop callbacks for hierarchy changes

- [web/src/components/editor/BlockEditor.jsx]:
  - New `handleIndent(blockId)` function sets parent_id to previous block ID
  - New `handleOutdent(blockId)` function clears parent_id (returns to root)
  - updateBlock calls persist parent_id changes to database
  - Pass onIndent, onOutdent callbacks to BlockItem component

- [web/src/app/globals.css]:
  - `.editor-list-wrap` — flex container for list item and marker (gap: 0.55rem)
  - `.editor-list-marker` — styled bullet/number display with cyan accent (color: #94a3b8)
  - `.editor-bullet_list|numbered_list` — content line-height: 1.5 for readability

**Slash Menu UX Flow Examples:**

1. **Quick Bullet List Creation**
   - Type "/" → (menu appears) → type "bu" → (filters to Bullet List) → Enter → (block converts to bullet_list)
   - Tab → (becomes nested under previous block)

2. **Numbered List Sequence**
   - Type "/" → type "num" → Enter → (creates numbered_list)
   - Tab → (nest, adds indentation margin-left)
   - Shift+Tab → (outdent, resets to root)

3. **Type Conversion with Slash**
   - Paragraph block: type "/" → (menu opens) → select "Heading 1" → (converts to heading1)
   - Works bidirectionally: heading1 → "/" → select "Bullet List" → (converts to bullet_list)

**Build validation:**
- Web build: ✓ 287 modules, 1,444.69 kB minified, completed in 761ms
- No syntax or import errors
- All 9 block types fully renderable (paragraph, 3 headings, code, todo, image, divider, 2 list types)
- Slash menu dynamically filters 9 block type options
- Tab/Shift+Tab indentation tested for list items
- Keyboard navigation (Arrow Up/Down, Enter, Escape) functional in menu

**Testing Notes:**
- Slash menu opens with "/" at line start
- Search filtering case-insensitive and real-time
- Nested list items render with progressive indentation (24px per level)
- Bullet markers (•) and numeric markers (1) display consistently
- List items convert to/from other types via slash menu seamlessly

----

## 2026-04-15

**Tool:** Copilot

**What I asked for:**
I asked the AI to design and implement a Notion-style **Command Menu (slash `/` menu)** for my block editor. The goal was to allow users to type `/` and get a list of commands (like text, heading, etc.), navigate using keyboard, and insert/update blocks accordingly.

---

**What it generated:**
The AI generated a React-based command menu component with:

- A dropdown menu triggered on `/`
- List of commands (text, heading etc.)
- Keyboard navigation using arrow keys and Enter
- Basic filtering based on user input
- Integration with block editor to change block type


---

**What was wrong or missing:**

- The command menu positioning was not accurate relative to cursor location
- Keyboard navigation had bugs (focus loss and incorrect selection index)
- No proper debouncing or filtering optimization
- It did not handle edge cases like:

  - deleting `/`
  - empty query
  - multiple `/` triggers
- Integration with existing block editor state was not clean

---

**What I changed and why:**

- Fixed menu positioning using cursor coordinates for better UX
- Refactored command menu into separate components (UI + logic) for maintainability
- Implemented proper keyboard navigation with controlled state
- Added filtering logic with safe handling for empty and invalid queries
- Handled edge cases like removing `/` and closing menu properly
- Integrated command menu cleanly with block editor state management

