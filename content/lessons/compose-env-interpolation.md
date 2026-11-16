---
slug: compose-env-interpolation
title: "Environment Variables in Compose"
topic: compose
kind: technique
summary: "Interpolate variables from .env files into compose.yaml and manage multi-environment deployment settings."
tags: [interpolation, env-file, environment, configuration]
related: [environment-files, compose-services-and-build, compose-profiles-and-overrides]
---
> **In one line:** Compose automatically substitutes variables from .env files into compose.yaml using ${VARIABLE} syntax.

## The idea
To keep `compose.yaml` reusable across developer workstations, staging runners, and production nodes, you must avoid hardcoding environment-specific settings (like published port numbers, image tags, or domain names) into the YAML file.

Docker Compose natively supports **variable interpolation** using standard bash-style syntax:
- `${VARIABLE}`: Replaces the token with the value of the variable.
- `${VARIABLE:-default}`: Uses `default` if the variable is unset or empty.
- `${VARIABLE:?error message}`: Exits with an error if the variable is unset.

When you run `docker compose`, it automatically reads an environment file named **`.env`** located in the same directory as `compose.yaml` and substitutes those values into the configuration before deploying the stack.

| Syntax | Behavior If VARIABLE is Unset |
|---|---|
| `${PORT}` | Empty string |
| `${PORT:-8080}` | Fallback default `8080` |
| `${PORT:?PORT is required}` | Fails build with error message |

## See it
Create a parameterized `compose.yaml` referencing dynamic variables:

```yaml
services:
  web:
    image: my-app:${APP_TAG:-latest}
    ports:
      - "${HOST_PORT:-8080}:8080"
    environment:
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@db:5432/${DB_NAME}

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
```

Define default values in a local `.env` file:

```text
# .env file
APP_TAG=1.2.0
HOST_PORT=3000
DB_USER=appuser
DB_PASS=supersecretpassword
DB_NAME=production_db
```

Verify the interpolated configuration without starting containers:

```bash
# Output resolved, fully-interpolated Compose configuration
docker compose config
```

## Go deeper
You can specify an alternative environment file for interpolation by passing the `--env-file` flag: `docker compose --env-file .env.staging up -d`.

## Watch out
- Do not confuse the `.env` file (which interpolates values into `compose.yaml`) with the `env_file:` service directive (which injects variables into running container processes).


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Compose automatically interpolates variables from a local `.env` file into `compose.yaml`.
- Use `${VAR:-default}` syntax to supply safe fallback values for local development.
- Inspect the fully resolved configuration anytime using `docker compose config`.
