I am continuing my work from yesterday.  
Context:
- My app is on Vercel (Next.js Pages Router).
- I will create a Postgres DB on Vercel (NOT SQLite).
- I want to implement Prisma + bcrypt + iron-session + RBAC + CSRF as outlined before.

My TODO list to continue (from previous guidance):

## Phase 1 — Repo prep
1. Create branch `feature/prisma-auth`.
2. Add folder `prisma/`.
3. Add `prisma/schema.prisma` with Postgres provider:
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   generator client { provider = "prisma-client-js" }
   enum Role { explorer pro admin }
   model User {
     id           String   @id @default(cuid())
     name         String
     email        String   @unique
     passwordHash String
     role         Role     @default(explorer)
     queriesUsed  Int      @default(0)
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt
   }
4. Add `lib/prisma.js` (singleton).
5. Add `.env.example` with DATABASE_URL + IRON_SESSION_ vars.
6. Update package.json scripts (include prisma generate/migrate/deploy + postinstall).

## Phase 2 — Sessions, CSRF, RBAC helpers
7. Add `pages/api/_session.js` (iron-session wrapper).
8. Add `pages/api/_csrf.js` (ensureCsrf + requireCsrf).
9. Add `pages/api/_authz.js` (requireUser + requireRole).

## Phase 3 — API routes
10. Add auth routes: signup.js, login.js, me.js, logout.js, reset-password.js.
11. Add users routes: index.js, update-role.js, upgrade.js.
12. Add chat route: index.js (stub that echoes and increments queriesUsed).

## Phase 4 — Frontend
13. Call `/api/auth/me` at init to store csrfToken.
14. Add `x-csrf-token: csrfToken` header to all POST/PUT calls (signup, login, logout, reset, users/*, chat).

## Phase 5 — Database
15. In Vercel Dashboard → Project → Storage → Add → Postgres → copy connection string.
16. Add env vars in Vercel:
    - DATABASE_URL
    - IRON_SESSION_COOKIE_NAME
    - IRON_SESSION_PASSWORD
17. (Optional) Also add DATABASE_URL to GitHub Secrets for CI/CD.

## Phase 6 — Migrations
18. Create `.github/workflows/migrate.yml` to run `prisma migrate deploy` against Postgres on pushes to main.
19. First migration: `npx prisma migrate deploy` (via Action or local with prod DATABASE_URL).

## Phase 7 — Admin & UX
20. Promote my account to role=admin manually (via SQL or temporary endpoint).
21. Handle 401/403 in frontend with redirect/toast.

---

Tomorrow, help me:
- Scaffold the exact GitHub commit file list for these steps.
- Tailor the Prisma + Postgres migration flow for **Vercel Postgres**.
- Patch my frontend fetch calls to include CSRF token automatically.

