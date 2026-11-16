---
slug: compose-profiles-and-overrides
title: "Compose Profiles & File Overrides"
topic: compose
kind: pattern
summary: "Enable conditional services using Compose profiles and layer environment overrides with compose.override.yaml."
tags: [profiles, overrides, compose-override, environments]
related: [compose-specification, compose-services-and-build, compose-env-interpolation]
---
> **In one line:** Use profiles to toggle optional services and override files to layer environment-specific settings cleanly.

## The idea
Real-world applications often require services that should not run all the time:
- Debugging tools (like pgAdmin or Mailhog) needed only during local development.
- Performance profiling agents or background test runners.
- Different configurations for local development versus production.

Docker Compose provides two powerful architectural patterns to solve this without duplicating YAML files:

1. **Compose Profiles (`profiles:`):** Assigns services to named profiles (e.g. `profiles: ["debug", "tools"]`). Services with profiles are **ignored** by default during `docker compose up` unless explicitly requested using `--profile <name>` or the `COMPOSE_PROFILES` environment variable.
2. **File Overrides (`compose.override.yaml`):** Compose automatically merges `compose.yaml` with `compose.override.yaml` if present. This allows teams to check a shared base `compose.yaml` into git while developers maintain local port mappings or bind mounts in an uncommitted override file.

| Feature | Mechanism | Typical Use Case |
|---|---|---|
| Profiles | `profiles: ["debug"]` | Optional tools (Adminer, mock APIs, seeders) |
| Override files | `compose.override.yaml` | Local volume mounts, debug ports |
| Explicit chaining | `-f compose.yaml -f compose.prod.yaml` | Production deployment configurations |

## See it
Configure an optional database management GUI using Compose profiles:

```yaml
services:
  api:
    image: my-api:latest
    ports:
      - "8080:8080"

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret

  # Optional debugging tool; only starts when 'debug' profile is enabled
  adminer:
    image: adminer:latest
    ports:
      - "8081:8080"
    profiles:
      - debug
```

Launch the stack with and without the debugging profile:

```bash
# Starts only api and db
docker compose up -d

# Explicitly activates the debug profile to launch adminer as well
docker compose --profile debug up -d
```

## Go deeper
When Compose merges override files, array lists (like `ports` or `expose`) are concatenated, while scalar dictionary values (like `image` or `restart`) are overwritten. This enables clean layering across development, staging, and production.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Tag optional or development-only services with `profiles: ["name"]`.
- Activate profiles via `docker compose --profile <name> up` or `COMPOSE_PROFILES`.
- Use `compose.override.yaml` to apply local developer settings without mutating shared configs.
