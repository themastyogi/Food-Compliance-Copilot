# Dev Notes – Food Compliance Copilot

## Goal
Replace the current in-memory auth + user system with a secure, real database and proper sessions.

---

## TODOs

### 1. Database Setup
- [ ] Decide on database:
  - **Option A (Recommended for Vercel):** Postgres via [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
  - Option B: SQLite locally, switch to Postgres later
- [ ] Create `prisma/schema.prisma` for `User` table (id, name, email, passwordHash, role, queriesUsed, createdAt)
- [ ] Run `npx prisma migrate dev` to create tables
- [ ] Add Prisma client and connect in `lib/prisma.js`

### 2. Authentication
- [ ] Use `bcrypt` to hash passwords on signup
- [ ] Compare hashed password on login
- [ ] Store sessions securely:
  - Option A: [`iron-session`](https://github.com/vvo/iron-session) (simple, cookie-based, works with Vercel)
  - Option B: JWT in httpOnly cookie
  - Option C: NextAuth (more advanced, handles providers)

### 3. API Routes
- [ ] `/api/auth/signup` → create user with hashed password
- [ ] `/api/auth/login` → validate password, set session cookie
- [ ] `/api/auth/logout` → clear cookie
- [ ] `/api/auth/me` → return current user (from session)
- [ ] `/api/auth/reset-password` → verify email, update password hash
- [ ] `/api/users/*` → admin-only (check `user.role === 'admin'`)

### 4. Security
- [ ] Enforce role-based access control (RBAC) in `/api/users/*` and `/api/auth/me`
- [ ] Add CSRF protection if cookies + cross-site calls
- [ ] Sanitize user input on server as well as client

### 5. Chat API
- [ ] Connect `/api/chat` to actual model provider (OpenAI, Anthropic, etc.)
- [ ] Support streaming responses for better UX

### 6. Frontend UX
- [ ] Show 401/403 messages if user tries to access admin without permission
- [ ] Show error toasts for signup/login/reset failures
- [ ] Persist user state via `/api/auth/me` on refresh

---

## Next Session Prompt

When starting a new ChatGPT session, paste this:

