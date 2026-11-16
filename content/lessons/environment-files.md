---
slug: environment-files
title: "Environment Variables & --env-file"
topic: dockerfiles
kind: technique
summary: "Inject runtime configuration into containers using environment variables and --env-file."
tags: [env-file, 12-factor, configuration, secrets]
related: [arg-vs-env, compose-env-interpolation, twelve-factor-containers]
---
> **In one line:** Pass decoupled runtime configuration into containers using -e flags or bulk --env-file definitions.

## The idea
The Twelve-Factor App methodology mandates strict separation between code and configuration. Code remains identical across development, staging, and production; configuration varies according to the target deployment environment.

Hardcoding configuration values (like database hostnames or logging levels) inside Docker images violates this principle and forces teams to rebuild images for every environment.

Docker allows passing environment variables into containers at runtime:
1. **Direct flags (`-e KEY=value`):** Injects single key-value pairs directly from the command line.
2. **Environment files (`--env-file <path>`):** Reads a text file containing key-value pairs formatted as `KEY=value`, skipping blank lines and comments.

| Option | Syntax | Use Case |
|---|---|---|
| Single variable | `-e DB_PORT=5432` | Quick ad-hoc configuration |
| Inherited host variable | `-e API_KEY` | Forwards host shell variable securely |
| Environment file | `--env-file .env.prod` | Multi-variable deployment profiles |

## See it
Create an environment file defining application configuration:

```text
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
CACHE_ENABLED=true
DATABASE_HOST=postgres.internal.net
```

Launch a container referencing the environment file:

```bash
# Launch container with bulk configuration file
docker run --rm --env-file .env.production node:22-alpine env
# Output: NODE_ENV=production, DB_HOST=db.internal.net
```

You can also override a single variable on the fly:

```bash
# Load file but override LOG_LEVEL to debug
docker run --rm --env-file .env.production -e LOG_LEVEL=debug alpine env | grep LOG_LEVEL
```

## Go deeper
When combining `--env-file` with `-e`, direct `-e` command-line flags take precedence over values defined in the file. This allows teams to maintain standard base environment files while overriding specific parameters per run.

## Watch out
- Do not commit production `.env` files containing actual passwords or secret keys into version control systems; keep them in `.gitignore`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Decouple application configuration from image code using runtime environment variables.
- Use `--env-file` to load structured configuration files into containers cleanly.
- Direct `-e` command-line arguments take precedence over definitions in environment files.
