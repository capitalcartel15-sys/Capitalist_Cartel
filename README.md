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

## Deployment notes

- Run the API with `npm run start` behind a process manager; set the env vars in
  your host instead of `server/.env`.
- Build the frontend with `npm run build` and serve `dist/`. Set `VITE_API_URL`
  (see `.env.example`) to the API's public URL at build time if it's on another origin.
