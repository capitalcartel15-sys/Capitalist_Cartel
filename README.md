# Stock Advisory CRM

A role-based CRM for a stock-advisory team: clients, payments, commission splits,
monthly targets, analytics, and historical archives.

This project was originally generated with Bolt on Supabase. It now runs on its own
stack with **no dependency on Bolt or Supabase**:

- **Frontend** — React + Vite + TypeScript + Tailwind (`src/`)
- **Backend** — Node + Express + Mongoose REST API (`server/`)
- **Database** — MongoDB (Atlas)
- **Auth** — email/password with JWT (bcrypt-hashed passwords)

## Architecture

```
Browser (Vite :5173)  ──fetch /api/* (JWT)──>  Express API (:4000)  ──Mongoose──>  MongoDB Atlas
```

In development the Vite dev server proxies `/api` to the backend, so the frontend
uses relative URLs and there are no CORS issues.

## Prerequisites

- Node.js 20.6+ (uses `node --env-file`; tested on Node 22)
- A MongoDB connection string (MongoDB Atlas works out of the box)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the backend env file from the example and fill in your values:

   ```bash
   cp server/.env.example server/.env
   ```

   `server/.env`:
   - `MONGODB_URI` — your connection string. **URL-encode reserved characters in the
     password** (e.g. `@` → `%40`).
   - `JWT_SECRET` — any long random string.
   - `PORT` — defaults to `4000`.

3. Seed default commission settings and the current month's targets:

   ```bash
   npm run seed
   ```

## Running

Start the API and the frontend together:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (health check at `/api/health`)

## Roles

Roles are assigned automatically on signup by email (carried over from the original app):

| Email                                          | Role     |
| ---------------------------------------------- | -------- |
| `gm3908827@gmail.com`                          | admin    |
| `Pry14314@gmail.com`, `rishabhrcc15@gmail.com` | boss     |
| anyone else                                    | employee |

Admins can change a user's role and active status from the **Settings** page.
To change which emails map to which role, edit `ADMIN_EMAILS` / `BOSS_EMAILS` in
[`server/routes/auth.js`](server/routes/auth.js).

## Scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Run backend + frontend together (watch mode) |
| `npm run dev:server` | Run only the API (watch mode)                |
| `npm run dev:client` | Run only the Vite frontend                   |
| `npm run start`      | Run the API once (no watch) — for production |
| `npm run seed`       | Seed default settings/targets                |
| `npm run build`      | Production build of the frontend             |
| `npm run typecheck`  | TypeScript check                             |
| `npm run lint`       | ESLint                                       |

## API overview

All routes are under `/api`. Everything except `/auth/signup` and `/auth/login`
requires an `Authorization: Bearer <token>` header.

- `auth` — `POST /signup`, `POST /login`, `GET /me`
- `profiles` — `GET /`, `PATCH /:id` (admin)
- `clients` — `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `GET /:id/history`, `GET /:id/payments`, `POST /:id/transfer`
- `payments` — `GET /`, `POST /` (computes received amount + commission split)
- `targets` — `GET /?month&year`, `PUT /` (admin upsert)
- `settings` — `GET /`, `PATCH /:name` (admin)
- `earnings` — `GET /?userId&month&year`
- `archives` — `GET /` (admin/boss)
- `admin` — `POST /monthly-reset` (admin)

## Deployment (frontend on Vercel, backend on Render)

The backend and frontend deploy separately. The frontend talks to the backend via
`VITE_API_URL` (baked in at build time).

### Backend → Render (or Railway/Fly)

1. New **Web Service** from the repo. **Root Directory:** `Stock_Advisory_CRM-main`.
2. Build command: `npm install`  ·  Start command: `npm run start`.
3. Environment variables (do **not** rely on `server/.env` — it's gitignored):
   - `MONGODB_URI` — your Atlas string (URL-encode `@` in the password as `%40`).
   - `JWT_SECRET` — a long random string.
   - `CLIENT_ORIGIN` — your Vercel URL, e.g. `https://your-app.vercel.app` (optional but recommended; locks CORS).
   - `PORT` is provided by the host automatically.
4. In **MongoDB Atlas → Network Access**, allow the host to connect: add `0.0.0.0/0`
   (Render uses dynamic egress IPs), or Render's static IPs if you enable them.
5. After first deploy, seed once from the host shell: `npm run seed:prod`.
6. Health check path: `/api/health`.

### Frontend → Vercel

1. Import the repo. **Root Directory:** `Stock_Advisory_CRM-main` (framework auto-detects as Vite).
2. Build command `npm run build`, output `dist` (defaults).
3. Environment variable:
   - `VITE_API_URL = https://<your-render-service>.onrender.com/api`
4. Deploy. (If you set `VITE_API_URL` after the first build, redeploy — Vite inlines it at build time.)

### Scripts for production

- `npm run start` — run the API reading env vars from the host (no `.env` file).
- `npm run seed:prod` — seed defaults using host env vars.
- `npm run start:local` / `npm run seed` — local equivalents that read `server/.env`.
