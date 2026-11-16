---
slug: compose-named-volumes
title: "Persistent Volumes in Compose"
topic: compose
kind: technique
summary: "Manage persistent storage and bind mounts declaratively using top-level volumes in compose.yaml."
tags: [volumes, persistence, named-volumes, storage]
related: [named-volumes, compose-services-and-build, storage-best-practices]
---
> **In one line:** Declare persistent volumes under the top-level volumes key and mount them into services using volume syntax.

## The idea
Stateful containers like databases, search indexes, and object caches require storage that survives `docker compose down`.

In Docker Compose, storage is managed declaratively:
1. **Top-level `volumes:` block:** Declares the named volume so Compose creates it during startup and registers it to the project.
2. **Service-level `volumes:` entry:** Mounts the declared named volume (or a host relative bind mount) into a specific container path.

Compose supports both the short string syntax (`volume-name:/path/in/container`) and the verbose, explicit object syntax (`type: volume, source: ..., target: ...`).

| Syntax | Example | Use Case |
|---|---|---|
| Named volume (short) | `db-data:/var/lib/postgresql/data` | Standard persistent database storage |
| Bind mount (short) | `./src:/app/src:ro` | Local development code hot reloading |
| Object syntax | `type: volume, source: db-data, target: /data` | Advanced options (read-only, volume drivers) |

## See it
Configure both persistent named volumes and development bind mounts in `compose.yaml`:

```yaml
services:
  api:
    build: .
    volumes:
      # Bind mount local host code for live reloading
      - ./src:/app/src
      # Mount shared upload volume
      - uploads-data:/app/uploads
    ports:
      - "3000:3000"

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      # Named volume for persistent database files
      - db-data:/var/lib/postgresql/data

# Top-level volume declaration
volumes:
  db-data:
  uploads-data:
```

## Go deeper
To use a pre-existing volume that was created outside Compose (for example, by another tool or previous script), declare it with the `external: true` attribute:
```yaml
volumes:
  shared-legacy-data:
    external: true
```
Compose will attach to the existing volume rather than attempting to create a new one.

## Watch out
- Do not forget to declare named volumes in the top-level `volumes:` block; omitting the top-level declaration causes a Compose YAML parsing error.

## Remember
- Declare named volumes in the top-level `volumes:` block to make them accessible across services.
- Mount named volumes to preserve state across `docker compose down` and `up` cycles.
- Use relative paths like `./src:/app/src` for local development bind mounts.
