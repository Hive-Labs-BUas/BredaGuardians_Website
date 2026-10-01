# Deployment

Server-rendered app (TanStack Start on Nitro `node-server`), built and run on
`solaris-prime` by a self-hosted GitHub Actions runner. Two environments from
one compose file, each behind its own Cloudflare tunnel.

| Branch | GitHub environment | Profile | Containers | Host port |
|---|---|---|---|---|
| `main` | `production` | `prod` | `web-website-prod-1`, `web-tunnel-prod-1` | 3000 |
| `dev` | `dev` | `dev` | `web-website-dev-1`, `web-tunnel-dev-1` | 3001 |

The two environments are checked to different standards, deliberately.

| | production | dev |
|---|---|---|
| `SUPABASE_URL` | required | required |
| `SUPABASE_PUBLISHABLE_KEY` | required | required |
| `TUNNEL_TOKEN` | required | required |
| `SUPABASE_SERVICE_ROLE_KEY` | required | warn only |
| `RESEND_API_KEY` | warn only | warn only |
| `PAYMENTS_CLIENT_TOKEN` | warn only | warn only |

A missing optional value is a warning in the job summary rather than a failed
deploy, so a half-configured dev environment still ships. A 5xx from the smoke
test fails production and only warns on dev, for the same reason: on dev it is
usually an unset key, on production it is a broken release.

Nothing is shared between them. Each reads its own GitHub environment, and the
deploy step exports values under a `PROD_` or `DEV_` prefix so the other
profile's variables stay unset and its containers are never touched.

Both listen on 4000 inside the container. Nothing is built on GitHub's runners:
the deploy job checks out, builds the image on the host, and starts it.

## What GitHub needs

Settings → Environments → `production` and `development`. Each needs the same
names with its own values, so dev can point at a separate Supabase project.

**Variables** (public — Vite inlines these into the client bundle, so treat them
as published the moment the site is live):

| Name | Example |
|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `PAYMENTS_CLIENT_TOKEN` | optional |

**Secrets** (server-side only, never build args):

| Name | Why it matters |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | bypasses row-level security — full database access |
| `RESEND_API_KEY` | can send mail as your domain |
| `TUNNEL_TOKEN` | whoever holds it can receive traffic for your hostname |

On `production`, set *Deployment branches* to selected branches → `main`. That
policy is the only thing stopping a `dev` branch from reading production's
service-role key — the runner label cannot do it, since labels are chosen in the
workflow file.

## Nothing is hardcoded

The application already reads every value from the environment, and a CI step
refuses to deploy if a credential-shaped string appears in the checkout. Names
are documented in `.env.example`.

| Read as | Source |
|---|---|
| `import.meta.env['VITE_SUPABASE_URL']` | build arg, from a GitHub variable |
| `import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']` | build arg, from a GitHub variable |
| `import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN']` | build arg, from a GitHub variable |
| `process.env['SUPABASE_URL']` | runtime env, from a GitHub variable |
| `process.env['SUPABASE_PUBLISHABLE_KEY']` | runtime env, from a GitHub variable |
| `process.env['SUPABASE_SERVICE_ROLE_KEY']` | runtime env, from a GitHub **secret** |
| `process.env['RESEND_API_KEY']` | runtime env, from a GitHub **secret** |
| `TUNNEL_TOKEN` | runtime env on cloudflared, from a GitHub **secret** |

## Which Supabase project?

`supabase/config.toml` names `ruzcyacttgrruepwuzot`, while the compose file this
replaced pointed at `gchlzuimwsmsvffxgqdf`. Those are two different projects, so
decide deliberately which one each environment talks to and set
`SUPABASE_URL` accordingly — ideally a separate project for `development`, so a
dev deploy cannot write production data.

## Why the split matters

Build arguments end up in image layers and are readable with `docker history`.
So the three public values are build args, and the three secrets are runtime
environment only. Do not move a secret into the `args:` block to make something
work — put it in `environment:` instead.

## Cloudflare

Two tunnels, one per environment. Public hostname → `HTTP` →
`website-prod:4000` for production, `website-dev:4000` for development. The
service name is the compose service on that tunnel's own network.

## Checking a deploy

```bash
curl -s http://<host>:3000/build.json     # production
curl -s http://<host>:3001/build.json      # development
```

Returns the commit, branch and build time baked into the running image.

The deploy job smoke-tests the same port and fails on a 5xx, so a build that
compiles but cannot render is caught rather than reported as success.

## Container isolation

Nothing here makes a container a security boundary in the way a VM is. The aim
is that an escape lands somewhere useless rather than that it is impossible.

| Control | What it denies |
|---|---|
| `user: 1000:1000` | no root inside the container |
| daemon `userns-remap` | and container root is an unprivileged host uid anyway |
| `read_only: true` | no writable path to stage anything in |
| `tmpfs … noexec,nosuid,nodev` | `/tmp` is writable but nothing there can be run |
| `cap_drop: ALL` | no capability to abuse, not even the default set |
| `no-new-privileges:true` | a setuid binary cannot regain anything |
| `seccomp=builtin`, `apparmor=docker-default` | stated explicitly so nobody sets `unconfined` |
| `init: true` | a real PID 1, so killed processes are reaped |
| `mem_limit`, `cpus`, `pids_limit`, `ulimits` | a runaway cannot starve the host |
| separate networks | dev and production cannot reach each other |
| no host mounts | nothing of the host is visible inside |

The weakest point is not any of those: it is that this file comes from the
repository, and the deploy account can reach the Docker socket. A pull request
adding `privileged: true` would undo all of it. So `scripts/check-compose.py`
runs before every deploy and refuses the file unless each service is non-root,
read-only, capability-dropped, memory-limited, `noexec` on tmpfs, and free of
`privileged`, `userns_mode`, `network_mode`, `pid`, `ipc`, `cap_add`, `devices`,
`sysctls`, host path mounts and any `unconfined` sandbox.

Run it yourself before committing a change:

```bash
python3 scripts/check-compose.py docker-compose.yml
```

What remains, and cannot be fixed by a flag: a kernel container-escape
vulnerability, and the fact that anyone who can merge to `main` can change what
runs. Keep the repository private, protect `main` with required reviews, and
patch the host.

## Notes on the container

- Runs as uid 1000 (`node`), read-only root filesystem, all capabilities
  dropped, `no-new-privileges`. If the server fails to start, remove
  `read_only: true` and its `tmpfs` first — SSR frameworks sometimes want a
  writable path outside `/tmp`.
- The healthcheck accepts any HTTP response, including 500. A Supabase outage
  should not stop the tunnel from starting, only make the page render badly.
- `supabase/migrations/` is not applied by this workflow. Schema changes are a
  separate, deliberate step.

## Local development

```bash
npm ci
npm run dev
```

For the container instead:

```bash
export PROD_SUPABASE_URL=... PROD_SUPABASE_PUBLISHABLE_KEY=... \
       PROD_SUPABASE_SERVICE_ROLE_KEY=... PROD_TUNNEL_TOKEN=...
docker compose --profile prod up --build
```

`.env` is gitignored. Keep it that way — the copy in the archive this came from
contained a live tunnel token, which is why that token should be rotated.
