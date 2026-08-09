---
id: lesson-12
slug: docker-compose-in-depth
title: "Compose in Depth"
level: intermediate
order: 12
duration: 28
tags:
  - compose
  - healthchecks
  - depends-on
  - profiles
  - override
---

# Learning Objectives

By the end of this lesson you will be able to:

- Add a **healthcheck** to a service and wait for it with `depends_on` conditions.
- Define custom **networks** and **volumes** in a Compose file.
- Use **profiles** to include services only when you want them.
- Inject configuration with **`env_file`** and **variable interpolation**.
- Layer configuration with **override files**.

# Why It Matters

The basics get an app running; real projects need more control. You want the web service to start
only once the database is genuinely **ready**, not merely started. You want optional tooling
(a debugger, a seed job) that is not always on. You want to reuse one Compose file across dev and
production with small differences. This lesson covers the features that make Compose production-aware
and pleasant to live with.

# Concept Explanation

### Healthchecks

A **healthcheck** is a command Docker runs periodically to decide whether a container is *healthy*.
You can define it in the Compose file:

```yaml
services:
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
```

`test` is the probe command; `interval`, `timeout`, and `retries` tune how often it runs and when to
give up. A container's health shows as `healthy`, `unhealthy`, or `starting` in `docker ps`.

### depends_on with conditions

Plain `depends_on` only controls **start order**. Combined with a healthcheck, it can wait for
readiness:

```yaml
services:
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
```

Now `web` starts only after `db` reports **healthy** — no more "connection refused" because the app
raced ahead of the database.

### Custom networks and volumes

You can define your own networks and volumes and assign services to them — useful for isolating
tiers:

```yaml
services:
  web:
    build: .
    networks: [frontend, backend]
  db:
    image: postgres:16
    networks: [backend]        # not reachable from the frontend network

networks:
  frontend:
  backend:
volumes:
  dbdata:
```

Here the database sits only on `backend`, so anything on `frontend` alone cannot reach it.

### Profiles

**Profiles** let a service be included only when its profile is active — handy for optional tools:

```yaml
services:
  web:
    build: .
  debugger:
    image: myteam/debug-tools
    profiles: ["debug"]
```

```bash
docker compose up -d                     # starts web only
docker compose --profile debug up -d     # starts web AND debugger
```

### env_file and variable interpolation

Keep configuration out of the Compose file with **`env_file`**, and substitute values from your
shell or a `.env` file with **`${VAR}`** interpolation:

```yaml
services:
  web:
    build: .
    env_file:
      - web.env
    ports:
      - "${WEB_PORT:-8080}:3000"     # use $WEB_PORT, default to 8080
```

Compose automatically reads a file named `.env` in the project directory for interpolation. The
`:-8080` provides a default if the variable is unset.

### Override files

Compose automatically merges `compose.yaml` with `compose.override.yaml` if the latter exists. This
lets you keep a shared base and layer environment-specific tweaks:

```bash
# Base + override (default when compose.override.yaml exists):
docker compose up -d

# Or pick files explicitly:
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

Later files override earlier ones, so `compose.prod.yaml` can change ports, drop the dev bind mount,
and so on, while sharing everything else.

# Key Terminology

- **Healthcheck** — a probe command that reports a container as healthy/unhealthy.
- **`condition: service_healthy`** — makes a dependent service wait for a healthy dependency.
- **Profile** — a label that includes a service only when its profile is activated.
- **`env_file`** — a file of environment variables loaded into a service.
- **Variable interpolation** — `${VAR}` substitution from the shell or a `.env` file.
- **Override file** — an extra Compose file merged on top of the base.

# Syntax and Options

| Feature | Key |
| --- | --- |
| Health probe | `healthcheck:` (`test`, `interval`, `timeout`, `retries`) |
| Wait for readiness | `depends_on: { db: { condition: service_healthy } }` |
| Isolate tiers | `networks:` on services + top-level `networks:` |
| Optional services | `profiles: ["name"]` + `--profile name` |
| External config | `env_file:` and `${VAR}` interpolation |
| Layered config | `compose.override.yaml` or `-f a.yaml -f b.yaml` |

# Hands-On Walkthrough

Make a web service wait for a healthy database.

```yaml
services:
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
  web:
    image: alpine
    command: ["sh", "-c", "echo 'db is ready, starting'; sleep 3600"]
    depends_on:
      db:
        condition: service_healthy
```

```bash
docker compose up -d
docker compose ps
```

```text
NAME        STATUS
shop-db-1   Up 12s (healthy)
shop-web-1  Up 3s
```

`web` did not start until `db` reported `(healthy)`. Watch the database transition from `starting`
to `healthy` if you run `docker compose ps` quickly a couple of times.

# Real World Analogy

A healthcheck is a **pulse check**: "started" only means the patient is on the table; "healthy" means
the monitors show a steady pulse. `condition: service_healthy` is the surgeon waiting for that steady
pulse before beginning. **Profiles** are optional guests you invite only when needed; **override
files** are sticky notes you place on top of the master plan to adjust it for a specific day without
rewriting the whole plan.

# Examples

## Example 1 — Basic: a healthcheck on a web service

```yaml
services:
  web:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 3
```

**Why this works:** Docker periodically calls the app's `/health` endpoint. If it fails repeatedly,
the container is marked `unhealthy`, which orchestration tools (and your own monitoring) can act on.

## Example 2 — Real-world: dev override with a bind mount

```yaml
# compose.override.yaml (used automatically in dev)
services:
  web:
    build: .
    volumes:
      - ./src:/app/src        # live-edit source in dev only
    environment:
      - NODE_ENV=development
```

**Why this works:** The base `compose.yaml` stays clean for production; the override adds a
development bind mount and env var. Running `docker compose up` in dev merges both automatically.

## Example 3 — Best practice / edge case: an optional seed job

```yaml
services:
  seed:
    image: myteam/seed
    profiles: ["init"]
    depends_on:
      db:
        condition: service_healthy
```

**Why this works:** The one-off `seed` job runs only when you ask for it (`--profile init`), and only
after the database is healthy — so it never runs by accident on a normal `up`.

# Common Mistakes

- **Relying on `depends_on` alone for readiness.** Without a healthcheck + `condition:
  service_healthy`, the dependent service may start before the dependency can accept connections.
- **Writing a healthcheck that always passes** (e.g. checking the process exists, not the endpoint),
  which defeats the purpose.
- **Forgetting profiles hide services**, then wondering why a service did not start (you did not
  activate its profile).
- **Putting secrets in the committed Compose file** instead of an `env_file`/`.env` kept out of
  version control.
- **Assuming override files replace lists wholesale** — merge semantics can be subtle; verify with
  `docker compose config`.

# Best Practices

- Add **healthchecks** to stateful services and gate dependents with `condition: service_healthy`.
- Keep configuration in **`env_file`**/`.env`, not hard-coded, and keep sensitive files out of git.
- Use **profiles** for optional or one-off services (debuggers, seeders, migrations).
- Split shared config from environment-specific tweaks using **override files**.
- Run `docker compose config` to see the fully merged, interpolated configuration before applying it.

# Summary

- A **healthcheck** reports a container as healthy/unhealthy; pair it with **`condition:
  service_healthy`** so dependents wait for real readiness.
- Define **custom networks** to isolate tiers and **named volumes** for persistence.
- **Profiles** include services only when activated (`--profile name`).
- **`env_file`** and **`${VAR}` interpolation** keep configuration external and flexible.
- **Override files** layer environment-specific changes on a shared base; check the result with
  `docker compose config`.

# Flash Cards

Q: What does plain depends_on guarantee, and what does it not?
A: It guarantees start order but not readiness; a service can start before its dependency can accept connections unless you add a healthcheck and condition: service_healthy.

Q: How do you make one service wait until another is actually ready?
A: Give the dependency a healthcheck and set depends_on with condition: service_healthy on the dependent service.

Q: What are Compose profiles for?
A: Including a service only when its profile is activated (for example with --profile debug), which is ideal for optional tools, seed jobs, or debuggers.

Q: How do you keep configuration and secrets out of the committed Compose file?
A: Use env_file to load variables from a separate file (kept out of version control) and ${VAR} interpolation from the shell or a .env file.

Q: What does docker compose config do?
A: It prints the fully merged and interpolated configuration, so you can verify overrides and variable substitution before running the app.

Q: How does Compose combine compose.yaml and compose.override.yaml?
A: It merges them automatically, with the override file layered on top so its values win, letting you keep a shared base and environment-specific tweaks.

# Exercises

### Easy
Add a `healthcheck` to a `postgres` service using `pg_isready`, start it, and watch `docker compose
ps` show it move from `starting` to `healthy`.

### Medium
Add `depends_on: { db: { condition: service_healthy } }` to a web service and confirm it does not
start until the database is healthy. Then remove the condition and observe the difference.

### Challenging
Create a base `compose.yaml` and a `compose.override.yaml` that adds a bind mount and a
`NODE_ENV=development` variable. Run `docker compose config` to show the merged result, then explain
which file each setting came from.

# Further Reading

- Compose file reference — <https://docs.docker.com/reference/compose-file/>
- Healthchecks in Compose — <https://docs.docker.com/reference/compose-file/services/#healthcheck>
- Compose profiles — <https://docs.docker.com/compose/how-tos/profiles/>
- Merge and override — <https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/>
