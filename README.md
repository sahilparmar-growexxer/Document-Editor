# BlockNote

BlockNote is a full-stack document editor built with:
- React + Vite frontend
- Express + PostgreSQL backend
- JWT auth with access-token + refresh-token flow

## Setup Instructions (Local)

### Prerequisites
- Node.js 18+
- npm
- Docker + Docker Compose

### 1. Start PostgreSQL with Docker Compose
From project root:

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432`.

### 2. Configure environment
Copy env example for API:

```bash
cp api/.env.example api/.env
```

If you also use root-level env in your local workflow:

```bash
cp .env.example .env
```

### 3. Start backend

```bash
cd api
npm install
npm run dev
```

Default backend URL: `http://localhost:5000` (or `PORT` from `.env`). https://document-editor-1-nj6y.onrender.com

### 4. Start frontend
In a new terminal:

```bash
cd web
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`. https://document-editor-qx2l.vercel.app

### 5. Build checks (optional)
From project root:

```bash
npm --prefix api test
npm --prefix web run build
```

---

## Environment Variables

Reference files:
- `api/.env.example`
- `.env.example`

Both examples contain the same core backend values. Purpose of each variable:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime mode (`development` or `production`), affects cookie security/CORS behavior. |
| `PORT` | API server port. |
| `DATABASE_URL` | Full PostgreSQL connection string. |
| `PGHOST` | PostgreSQL host (used when `DATABASE_URL` is not used). |
| `PGPORT` | PostgreSQL port. |
| `PGUSER` | PostgreSQL username. |
| `PGPASSWORD` | PostgreSQL password. |
| `PGDATABASE` | PostgreSQL database name. |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens. |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry duration (default 15m). |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry duration (default 30d). |
| `REFRESH_TOKEN_COOKIE_NAME` | Cookie name used to store refresh token. |
| `REFRESH_TOKEN_HASH_PEPPER` | Extra secret mixed into refresh-token hashing before DB storage. |
| `CORS_ORIGIN` | Allowed frontend origin(s) for API requests with credentials. |

Notes:
- In production, use strong unique secrets and HTTPS.
- Refresh token is expected in HTTP-only cookie.

---

## Architecture Decisions

### 1) Stack choice: React + Vite + Express + PostgreSQL
Chosen for fast local iteration, simple deployment model, and clear separation between client and API.

### 2) JWT dual-token auth model
Access token is short-lived for API authorization; refresh token is long-lived and used only to mint new access tokens, reducing re-login frequency while limiting blast radius of access token leaks.

### 3) Refresh token persistence and security
Refresh token is stored in HTTP-only cookie and hashed in DB, so plaintext refresh tokens are not persisted server-side.

### 4) Layered backend modules
Controller -> Service -> Repository structure keeps transport, business logic, and DB queries isolated for maintainability and easier testing.

### 5) Block ordering strategy
`order_index` midpoint-based ordering allows efficient reordering without reindexing all rows on each drag/drop operation.

---

## Implementation Notes (Required Discussion)

### 1) Enter mid-block split: what AI gave, what broke, what was fixed
- Initial AI-generated split behavior duplicated block type/content patterns in ways that produced inconsistent results for non-paragraph blocks.
- What broke in practice: Enter in code blocks could incorrectly create a new block; split output type was not always aligned with product expectation.
- Final fix implemented: split always creates a new paragraph block for normal text flows, and code blocks keep Enter as newline in the same block (no split), matching editor UX requirements.
- Why this matters: it preserves predictable writing behavior and avoids accidental block-type propagation.

### 2) order_index handling: integer approach vs final approach
- Early AI suggestions leaned toward integer-style reindexing after reorder operations.
- That approach would require many row updates and becomes fragile under frequent drag-drop operations.
- Final implementation uses midpoint float ordering through `order_index` (for example between previous and next), so reorder writes are localized to the moved item.
- Result: simpler, faster reorder path with fewer DB writes and less lock contention.

### 3) Cross-account document access protection
- Access control is enforced server-side by ownership checks in service/repository flow before returning or mutating documents/blocks.
- For protected resources, API paths resolve by authenticated user + resource context and return not-found/forbidden when ownership does not match.
- This prevents one user from reading/updating/deleting another user's documents even if IDs are guessed.

### 4) Cases where code was written manually instead of accepting raw AI output
- Enter/split behavior tuning was manually adjusted after AI drafts because generated logic did not fully match expected editor semantics.
- Auth token flow hardening (cookie-only refresh design constraints) required manual policy-driven edits to remove insecure storage paths suggested in intermediate drafts.
- CORS and credentialed refresh configuration was manually corrected to fit actual deployment origins and browser cookie constraints.
- Edge-case keyboard handling around Backspace + non-text blocks was manually finalized because this is highly UX-specific and AI defaults were too generic.
- Reason across all cases: AI accelerated scaffolding, but final behavior/security needed deterministic, product-specific decisions.

---

## Known Issues / Incomplete Areas

1. Test coverage is limited (basic unit tests exist; broad integration/e2e coverage is incomplete).
2. Some UX behaviors are keyboard-edge dependent and can still be improved for accessibility consistency.
3. Export-heavy frontend bundle is large and can benefit from code splitting.
4. Cursor is jumping on fast enter press to add block

---

## Edge Case Decisions

### Backspace on first block
Decision: When Backspace is pressed at cursor position 0 in the very first block, no block is deleted and no merge happens, to prevent accidental document corruption and preserve at least one editable block. And added "Add BLock" button to add add new block.


### Backspace when previous block is a divider or image
Decision: If current text-like block is empty and Backspace is pressed at cursor position 0, the current block is deleted and focus moves to the previous block boundary (not "inside" divider/image), because non-text blocks do not support text cursor placement.

---

## Auth Flow Summary (Current)

1. Login returns access token and sets refresh token cookie.
2. Frontend sends access token as Bearer token for protected APIs.
3. On app bootstrap and on 401 responses, frontend calls `/auth/refresh`.
4. Backend validates refresh cookie + DB session, rotates token, and returns new access token.
5. User remains logged in after page refresh until refresh token expires or is revoked.
