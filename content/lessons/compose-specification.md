---
slug: compose-specification
title: "The Compose Specification"
topic: compose
kind: concept
summary: "Understand the open Compose Specification, compose.yaml files, and the retirement of obsolete version keys."
tags: [compose, compose-yaml, spec, obsolete-version]
related: [compose-services-and-build, compose-up-and-down, compose-networking-dns]
---
> **In one line:** The Compose Specification standardizes compose.yaml as a declarative multi-container contract without obsolete version keys.

## The idea
Running single containers with `docker run` requires typing dozen-flag commands over and over. When an application involves a frontend, API, database, and Redis cache, managing dependencies and networking manually becomes unmaintainable.

**Docker Compose** is a tool for defining and running multi-container applications. You describe your entire service stack in a single declarative YAML file. With one command (`docker compose up`), Docker provisions the networks, volumes, environment variables, and containers in the correct order.

Crucially, modern Docker implements **The Compose Specification** (governed under `compose-spec.io`):
- **Command:** Use `docker compose` (Compose v2, an integrated Go plugin), **not** the deprecated Python tool `docker-compose` (Compose v1).
- **Default Filename:** The standard filename is **`compose.yaml`** (with `compose.yml` and legacy `docker-compose.yml` supported as fallbacks).
- **Obsolete Version Key:** Under the Compose Specification, the top-level `version: '3.8'` string is **obsolete**. Modern Compose files omit the version key entirely.

| Aspect | Legacy Compose v1 | Modern Compose Specification (v2) |
|---|---|---|
| CLI Command | `docker-compose` (Python binary) | `docker compose` (Integrated CLI plugin) |
| Canonical File | `docker-compose.yml` | `compose.yaml` |
| `version:` key | Required (`version: '3'`) | **Obsolete** (omit entirely) |

## See it
Here is a clean, modern `compose.yaml` file defining an API service and database:

```yaml
# Modern Compose Specification: no obsolete version key required
services:
  web:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://app:secret@db:5432/appdb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=appdb
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  pg-data:
```

## Go deeper
When you invoke `docker compose`, Docker automatically sets project names (defaulting to the parent directory name), prepending that name to all created networks, containers, and volumes to prevent resource naming collisions across projects.

## Watch out
- Do not add `version: '3'` or `version: '3.8'` to new Compose files; modern Compose linters issue deprecation warnings when the version key is detected.

## Remember
- Use the modern `docker compose` CLI command; Compose v1 is retired.
- Name your configuration file `compose.yaml`.
- Omit the obsolete top-level `version:` key in modern Compose Specification projects.
