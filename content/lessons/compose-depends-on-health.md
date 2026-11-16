---
slug: compose-depends-on-health
title: "Service Readiness with depends_on"
topic: compose
kind: technique
summary: "Coordinate service startup order and wait for database readiness using depends_on with condition: service_healthy."
tags: [depends-on, service-healthy, healthcheck, ordering]
related: [compose-services-and-build, healthcheck-instruction, compose-up-and-down]
---
> **In one line:** Use depends_on with condition: service_healthy to ensure services start only after their dependencies pass healthchecks.

## The idea
A classic race condition in multi-container stacks occurs when an API service starts, attempts to connect to PostgreSQL, and crashes immediately with `Connection refused` because the database container has booted but the database engine is still initializing system catalogs.

Specifying simple `depends_on:` only controls **startup order**:
```yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  pg-data:
```
Docker starts the `db` container, but it does **not** wait for the database software inside to be ready to accept connections before launching the web service.

To achieve reliable synchronization, you combine a **`healthcheck:`** on the dependency with **`condition: service_healthy`** in `depends_on`. Compose waits until the database passes its healthcheck before launching dependent services.

| Configuration | What Compose Waits For | Prevents Race Condition? |
|---|---|---|
| `depends_on: [db]` | Container process started | No; DB engine may still be initializing |
| `depends_on: { db: { condition: service_healthy } }` | Healthcheck command returns exit 0 | Yes; guarantees service is ready |

## See it
Configure an API service that waits for PostgreSQL to become fully operational:

```yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  pg-data:
```

When you run `docker compose up`, Compose explicitly holds the `web` service in a waiting state:

```text
[+] Running 2/2
 ✔ Container myproject-db-1   Healthy                                    6.2s
 ✔ Container myproject-web-1  Started                                    6.5s
```

## Go deeper
The `start_period` parameter in a healthcheck defines an initial grace period during which failing health checks do not count towards the maximum retry limit. This accommodates slow initial database migrations or cache warmup routines.

## Remember
- Plain `depends_on` controls only container start order, not application readiness.
- Add `condition: service_healthy` to prevent startup crashes in dependent services.
- Define explicit `test`, `interval`, and `retries` parameters in the dependency's healthcheck.
