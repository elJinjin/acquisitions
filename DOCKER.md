# Docker Setup — Acquisitions API

This project uses Docker for both **development** (with [Neon Local](https://neon.com/docs/local/neon-local)) and **production** (with Neon Cloud).

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- A [Neon](https://neon.tech) account with a project created
- Your **Neon API Key**, **Project ID**, and **Parent Branch ID** (for ephemeral dev branches)

---

## How It Works

| Concern | Development | Production |
|---|---|---|
| Database | Neon Local proxy (Docker) | Neon Cloud |
| Connection | `postgres://neon:npg@neon-local:5432/neondb` | `postgres://...neon.tech/...` |
| Branches | Ephemeral — created on `docker compose up`, deleted on `down` | Permanent cloud branch |
| Env file | `.env.development` | `.env.production` |
| Compose file | `docker-compose.dev.yml` | `docker-compose.prod.yml` |

The app's `src/config/database.js` automatically detects `NEON_LOCAL_FETCH_ENDPOINT` and configures the Neon serverless driver for local proxy mode. When that variable is absent (production), the driver uses its default cloud endpoint.

---

## Development Setup

### 1. Copy and fill `.env.development`

```bash
cp .env.development .env.development.local   # optional: keep a local copy
```

Edit `.env.development` and replace the placeholder values:

```
NEON_API_KEY=napi_8gma2gaupue6ddd8bf2c8n05t1cshdlvpl62f9p7gbeh75h5sbwxt8uwz87x9kwv
NEON_PROJECT_ID=polished-sky-86478228
PARENT_BRANCH_ID=br-super-glitter-aixnij2d
ARCJET_KEY=ajkey_01kja6r553er4r6hz1mktcgg1z
```

> **Where to find these:**
> - **API Key**: [Neon Console → Settings → API Keys](https://console.neon.tech/app/settings/api-keys)
> - **Project ID**: Neon Console → Your Project → Settings → General
> - **Parent Branch ID**: Neon Console → Your Project → Branches → click the branch → copy the ID from the URL

### 2. Start the development stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

This will:
1. Pull the `neondatabase/neon_local` image
2. Create an **ephemeral database branch** from your parent branch
3. Build and start the Express app connected to that branch
4. Expose the app at `http://localhost:3000`

### 3. Run database migrations (optional)

If you need to apply Drizzle migrations against the dev branch:

```bash
docker compose -f docker-compose.dev.yml exec app npx drizzle-kit migrate
```

### 4. Stop and clean up

```bash
docker compose -f docker-compose.dev.yml down
```

The ephemeral branch is **automatically deleted** when the `neon-local` container stops (controlled by `DELETE_BRANCH=true`).

To **persist** the branch across restarts, set `DELETE_BRANCH=false` in `.env.development`. The volume mounts in `docker-compose.dev.yml` will keep branch metadata per git branch.

---

## Production Deployment

### 1. Fill `.env.production`

```
DB_URL=postgres://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require
ARCJET_KEY=<your_arcjet_key>
JWT_SECRET=<strong_random_secret>
CORS_ORIGIN=https://yourdomain.com
```

> In a real deployment, inject these via your CI/CD pipeline or secrets manager rather than committing them.

### 2. Build and run

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The production compose file runs only the app container — no Neon Local proxy. The Neon serverless driver connects directly to your Neon Cloud database.

### 3. Stop

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Environment Variable Reference

| Variable | Dev | Prod | Description |
|---|---|---|---|
| `DB_URL` | Set by compose | Set in `.env.production` | Postgres connection string |
| `NEON_LOCAL_FETCH_ENDPOINT` | Set by compose | **Not set** | Tells serverless driver to use local proxy |
| `NEON_API_KEY` | `.env.development` | N/A | Neon API key for local proxy |
| `NEON_PROJECT_ID` | `.env.development` | N/A | Neon project ID for local proxy |
| `PARENT_BRANCH_ID` | `.env.development` | N/A | Parent branch for ephemeral branching |
| `NODE_ENV` | `development` | `production` | Runtime environment |
| `PORT` | `3000` | `3000` | App listen port |
| `JWT_SECRET` | `.env.development` | `.env.production` | JWT signing secret |
| `ARCJET_KEY` | `.env.development` | `.env.production` | Arcjet rate-limiting key |

---

## Troubleshooting

**Container keeps restarting / can't connect to neon-local**
- Verify `NEON_API_KEY` and `NEON_PROJECT_ID` are correct
- Check logs: `docker compose -f docker-compose.dev.yml logs neon-local`

**`pg_isready` healthcheck failing**
- Neon Local may need a few seconds to provision the ephemeral branch. The healthcheck has a 10 s `start_period` to account for this.

**Mac users: branch detection issues**
- In Docker Desktop settings, switch the file sharing implementation to **gRPC FUSE** instead of VirtioFS (known Docker Desktop bug).
