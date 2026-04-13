# BlockNote — Production-Ready Block Editor (Day 1)

A full-stack Notion-like document editor built with Node.js + Express, PostgreSQL, and a React + Vite frontend. Includes user authentication, document CRUD, inline renaming, and a foundation for collaborative block editing.

## Quick Start

### Prerequisites
- Docker & Docker Compose (for PostgreSQL)
- Node.js 18+ (backend and frontend)
- npm

### Run Locally

1. **Start PostgreSQL** (Docker):
```bash
docker compose up -d
```
Verify with: `docker ps` (should show `postgres:16` container)

2. **Backend Setup**:
```bash
cd api
npm install
npm run dev
```
Server listens on http://localhost:4000

3. **Frontend Setup** (new terminal):
```bash
cd web
npm install
npm run dev
```
Frontend runs on http://localhost:3000

4. **Access the app**:
- Home: http://localhost:3000
- Register: http://localhost:3000/register
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard

---

## Environment Variables

### Backend (`api/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `PGHOST` | PostgreSQL hostname | `localhost` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGUSER` | PostgreSQL username | `postgres` |
| `PGPASSWORD` | PostgreSQL password | `postgres` |
| `PGDATABASE` | Database name | `blocknote` |
| `PORT` | Backend server port | `4000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `JWT_ACCESS_SECRET` | Secret for access tokens (15m) | any random string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (7d) | any random string |

**Precedence:** Explicit env vars (`PGHOST`, `PGUSER`, etc.) override `DATABASE_URL` if both present.

### Frontend (`web/.env.local`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

Note: `VITE_` prefix makes this available in browser (used by `apiClient.js`).

### Docker Compose (`.env` at project root)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=blocknote
```

---

## Architecture

### Backend (Express.js + TypeScript compiled to JavaScript)

**Directory Structure:**
```
api/src/
├── app.js              # Express setup (CORS, JSON, Morgan, routes, error handler)
├── server.js           # Bootstrap with migration runner
├── config/
│   ├── env.js          # Environment variable loader (env var precedence)
│   ├── db.js           # PostgreSQL pool configuration
│   ├── logger.js       # Morgan logging setup
│   └── constants.js    # Shared constants
├── common/
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT Bearer token verification
│   │   ├── error.middleware.js     # Centralized error response handler
│   │   └── validate.middleware.js  # Zod schema validation
│   ├── errors/
│   │   ├── AppError.js             # Custom error class
│   │   └── errorCodes.js           # Standardized error codes
│   └── utils/
│       ├── hash.util.js            # bcrypt password hashing
│       ├── token.util.js           # JWT generation/verification
│       ├── response.util.js        # Response formatting
│       └── order.util.js           # Notion-style block ordering
├── modules/
│   ├── auth/
│   │   ├── controller/auth.controller.js
│   │   ├── service/auth.service.js
│   │   ├── repository/auth.repository.js
│   │   ├── routes/auth.routes.js
│   │   └── validation/auth.validation.js
│   └── documents/
│       ├── controller/document.controller.js
│       ├── service/document.service.js
│       ├── repository/document.repository.js
│       ├── routes/document.routes.js
│       └── validation/document.validation.js
├── database/
│   ├── schema.sql
│   └── migrations/
│       ├── 001_init.sql          # Tables: users, documents, blocks
│       ├── 002_indexes.sql       # Performance indexes
│       └── 003_constraints.sql   # Foreign key constraints
└── routes/
    └── index.js        # Main router mounting auth + documents

```

**Design Patterns:**
- **Clean Architecture**: Controller → Service → Repository (separation of concerns)
- **Error Handling**: Centralized middleware catches AppError instances and formats responses
- **Validation**: Zod schemas at routes layer, middleware validates before controller
- **Authentication**: JWT Bearer tokens (access + refresh), req.user attached by middleware

**Tech Stack:**
- Express.js 4.18.2
- PostgreSQL 16 (pg driver)
- JWT (jsonwebtoken)
- bcrypt (password hashing)
- Zod (schema validation)
- Morgan (HTTP logging)

### Frontend (React 19 + Vite)

**Directory Structure:**
```
web/src/
├── App.jsx                          # React Router routes
├── main.jsx                         # React entry point
├── pages/
│   ├── HomePage.jsx                 # Home page (hero section, CTAs)
│   ├── LoginPage.jsx                # Login form
│   ├── RegisterPage.jsx             # Register form
│   └── DashboardPage.jsx            # Document management (list, create, rename, delete)
└── lib/
    └── apiClient.js                 # Bearer token injection, localStorage management
```

**Design Patterns:**
- **React Router**: Client-side routes for home, auth, and dashboard screens
- **State Management**: React hooks (useState) for local state
- **API Client**: Centralized fetch wrapper with automatic Bearer token injection
- **Auth Guard**: useEffect checks localStorage token on protected routes, redirects to login if missing
- **Error Handling**: Try/catch with user-facing error messages

**Tech Stack:**
- React 19.2.5
- Vite 8
- React Router DOM 7
- Tailwind CSS 4.2.2
- Google Fonts (Manrope, Space Grotesk)

### Database Schema

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**documents**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  share_token UUID,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**blocks**
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'paragraph',
  content JSONB,
  order_index FLOAT,
  parent_id UUID REFERENCES blocks(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**schema_migrations** (Internal, tracks applied migrations)
```sql
CREATE TABLE schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | ✗ | Register new user (email, password) |
| POST | `/auth/login` | ✗ | Login (returns accessToken, refreshToken) |
| POST | `/auth/refresh` | ✗ | Exchange refreshToken for new accessToken |

### Documents

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/documents` | ✓ | List user's documents |
| POST | `/documents` | ✓ | Create new document |
| PATCH | `/documents/:id` | ✓ | Rename document (title parameter) |
| DELETE | `/documents/:id` | ✓ | Delete document |

**Auth:** ✓ = Requires Bearer token in `Authorization: Bearer <token>` header

---

## Architecture Decisions

### 1. **ES6 Modules for Backend (Instead of CommonJS)**
- **Rationale**: Modern JavaScript standard, better tree-shaking, native Node.js support
- **Trade-off**: Requires `"type": "module"` in package.json; all imports explicit
- **No regrets**: Cleaner codebase, aligns with frontend (JavaScript)

### 2. **JWT with Dual Tokens (Access + Refresh)**
- **Rationale**: Access token (15min) minimizes exposure if stolen; refresh token (7d) enables seamless re-auth
- **Implementation**: `/auth/refresh` endpoint exchanges refreshToken for new accessToken without re-login
- **Security**: Refresh tokens can be revoked on logout (future: blacklist table)

### 3. **Ownership Checks at Query Level (Not Application Level)**
- **Rationale**: Query `WHERE user_id = $1 AND id = $2` is more secure than app-level checks; DB enforces constraint
- **Implementation**: Document repository queries include `user_id` filter; 404 if document not found for user
- **Benefit**: Impossible to accidentally return another user's document

### 4. **order_index as FLOAT (Not INTEGER)**
- **Rationale**: Enables Notion-style reordering without renumbering siblings
- **Example**: Insert between index 1.0 and 2.0 as 1.5 (no UPDATE needed for blocks 2+)
- **Caveat**: Requires careful handling of fractional math; potential precision edge cases at high scale

### 5. **Idempotent Migrations with schema_migrations Table**
- **Rationale**: Migrations run only once, tracked by filename; server startup won't re-apply existing migrations
- **Implementation**: Before migration runner executes, checks if filename exists in schema_migrations table
- **Benefit**: Enables repeatability across environments (dev, staging, prod)

### 6. **Tailwind CSS for Frontend Styling**
- **Rationale**: Utility-first approach for rapid UI development; small bundle size
- **Dark theme**: Custom CSS variables (--surface-*, --accent-*) for consistent branding
- **Trade-off**: Learning curve for utility classes, but faster iteration than custom CSS

### 7. **Vite for the Frontend Build Tooling**
- **Rationale**: Faster dev server and simpler static deployment than Next.js for this UI
- **Implementation**: React Router handles navigation; Vite serves the app from `index.html`
- **Trade-off**: We lose file-system routing and server components, but the frontend does not need them here

---

## Known Issues & Limitations

### 1. **Block Editor Not Yet Implemented**
- **Status**: Skeleton schema (blocks table with order_index) exists
- **Missing**: 
  - Block CRUD endpoints (POST/PATCH/DELETE /documents/:id/blocks)
  - Rich text editor UI component
  - Enter key mid-block split (text splitting at caret position)
- **Impact**: Users can create documents but cannot edit block content
- **Timeline**: Blocked on UI component architecture decision

### 2. **Document Sharing Feature Incomplete**
- **Status**: Schema columns exist (share_token UUID, is_public BOOLEAN)
- **Missing**: 
  - Generate public share link endpoint
  - Public view page (no auth required)
  - Granular permissions (view-only vs. edit)
- **Impact**: All documents private; no collaboration
- **Timeline**: Low priority (schema ready, endpoint simple to add)

### 3. **No Production Deployment Setup**
- **Status**: Docker Compose works locally; frontend now builds as a static Vite app
- **Missing**: 
  - Cloud platform setup (AWS RDS, GCP, Heroku, etc.)
  - Environment variable secrets management
  - SSL/TLS configuration
  - Database backup strategy
- **Impact**: Not ready for cloud deployment without additional setup
- **Timeline**: Requires user choice of cloud provider

### 4. **Limited Test Coverage**
- **Status**: Unit test for auth validation schema only
- **Missing**: 
  - End-to-end tests for auth flows (register → login → refresh)
  - Document CRUD integration tests
  - Frontend component tests
- **Impact**: Manual QA required for release
- **Timeline**: Add after block editor complete

### 5. **No Session Persistence Between Server Restarts**
- **Status**: JWT tokens stored in localStorage
- **Edge case**: If backend restarts, old access tokens become invalid even if not expired
- **Mitigation**: Users must re-login after backend restart (acceptable for dev; needs refresh token revocation list for production)

### 6. **Concurrent Block Edits Not Handled**
- **Status**: No conflict resolution or lock mechanism
- **Edge case**: If two users edit the same block simultaneously, last write wins
- **Mitigation**: Future: WebSocket + operational transformation (OT) or CRDT for real-time sync

---

## Edge Case Decisions

### 1. **Cross-Account Document Access**
- **Decision**: Query-level filtering (`WHERE document_id = $1 AND user_id = $2`)
- **Why**: If user A tries to access user B's document, PostgreSQL returns no rows → 404, not 403
- **Alternative rejected**: App-level check (`if (doc.user_id !== req.user.id) throw 403`) — requires fetching first, less efficient
- **Trade-off**: The same 404 is returned for non-existent and unauthorized documents (leaks no info)

### 2. **Stale Session After Token Expiration**
- **Decision**: Frontend catches 401 from API, clears tokens, redirects to login
- **Why**: API returns 401 Unauthorized if Bearer token expired; frontend treats as auth failure
- **Why not automatic refresh?**: Would require storing refreshToken securely (server-side session needed); out of scope for Day 1
- **Trade-off**: User must re-login after 15 minutes of inactivity; acceptable for MVP

### 3. **Document Title Length**
- **Decision**: VARCHAR(255) in schema, no frontend validation
- **Why**: Reasonable default; PostgreSQL enforces at DB layer
- **Why not frontend?**: Title field is optional on creation (defaults to "Untitled"), validation would complicate UX
- **Trade-off**: Rare overflow (99% of documents have short titles)

### 4. **Block Ordering on Bulk Inserts**
- **Decision**: Each block gets sequential order_index (1.0, 2.0, 3.0, ...)
- **Why**: Simple, maintains insertion order, supports future reordering
- **Why not fractional start?**: Would require calculating optimal starting point; sequential is clear and works for now
- **Trade-off**: After many reorders (hundreds), might encounter floating-point precision issues; add compaction job if needed

### 5. **Migration Rollback Not Supported**
- **Decision**: Migrations are one-way (001_init.sql, 002_indexes.sql, etc.)
- **Why**: Rollback logic adds complexity; we control schema (no third-party migrations)
- **Why not reverse migrations?**: For now, manual recovery steps (DROP TABLE, re-run) acceptable for dev; not for production
- **Trade-off**: Breaking schema changes require new migration, not rollback

### 6. **Password Reset Not Implemented**
- **Decision**: Users cannot reset forgotten passwords (no email integration)
- **Why**: Email API setup (SendGrid, etc.) adds configuration; out of scope for MVP
- **Mitigation**: Admin can manually reset in PostgreSQL; acceptable for internal use
- **Timeline**: Add when email provider decided

---

## Development Commands

### Backend (`api/`)

```bash
npm install                # Install dependencies
npm run dev               # Start dev server with nodemon (http://localhost:4000)
npm start                 # Start production server
npm test                  # Run unit tests (auth validation)
node --check src/**/*.js  # Lint syntax (no linter configured yet)
```

### Frontend (`web/`)

```bash
npm install               # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run dev:clean        # Clean Vite cache + start dev (use if seeing chunk errors)
npm run build            # Production build (creates dist/ folder)
npm start                # Start production server
```

Note: the frontend is now React + Vite, so `npm run build` creates a static `dist/` directory and `npm start` runs Vite preview.

### Docker

```bash
docker compose up -d       # Start PostgreSQL in background
docker compose down        # Stop PostgreSQL
docker compose logs -f     # Stream logs
```

---

## Testing

### Unit Tests
```bash
cd api
npm test
```
Currently tests auth validation schema (email, password constraints).

### Manual API Testing
```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Create document (replace TOKEN)
curl -X POST http://localhost:4000/documents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Document"}'

# List documents (replace TOKEN)
curl -X GET http://localhost:4000/documents \
  -H "Authorization: Bearer TOKEN"
```

---

## Debugging

### "Failed to fetch" on Frontend
1. Check backend is running: `curl http://localhost:4000/documents` (should return 401 if token missing, not "fetch failed")
2. Check `VITE_API_URL` in `web/.env.local` matches the running backend port
3. Check browser DevTools → Network tab for actual error status codes
4. Check CORS errors in console (should see "Access-Control-Allow-*" headers in response)

### Vite Cache Errors (e.g., stale modules after a rebuild)
```bash
cd web
npm run dev:clean  # Clears Vite cache and restarts dev server
```

### Database Connection Errors
1. Verify PostgreSQL running: `docker compose ps` (should show postgres in "Up" status)
2. Check credentials in `api/.env` match `docker-compose.yml`
3. View logs: `docker compose logs postgres`
4. Restart database: `docker compose restart postgres`

### JWT Token Expired
- Access tokens expire after 15 minutes
- Frontend should redirect to login automatically
- To extend session, implement `/auth/refresh` call before expiration

---

## Deployment Checklist (Future)

- [ ] Choose cloud provider (AWS, GCP, Heroku, etc.)
- [ ] Set up managed PostgreSQL (RDS, Cloud SQL, etc.)
- [ ] Configure environment variables for production
- [ ] Set strong JWT secrets (not dev defaults)
- [ ] Enable HTTPS / SSL
- [ ] Set up database backups
- [ ] Configure production logging (e.g., CloudWatch)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Set CORS origin to frontend domain only
- [ ] Test end-to-end in staging environment
- [ ] Document runbook (restart procedures, emergency rollback)

---

## License

Private project (Evaluation purposes).

---

## Questions?

See `AI_LOG.md` for detailed decisions, debugging info, and architecture rationale.
