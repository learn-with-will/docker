---
slug: healthcheck-instruction
title: "The HEALTHCHECK Instruction"
topic: debugging-observability
kind: api
summary: "Monitor application liveness and readiness using the Dockerfile HEALTHCHECK instruction."
tags: [healthcheck, interval, retries, startup]
related: [compose-depends-on-health, debugging-crashing-containers, canary-deployments-health-gates]
---
> **In one line:** The HEALTHCHECK instruction tells Docker how to test whether an application is actually healthy, not just running.

## The idea
A container's process can be in the "Running" state while the application inside is completely deadlocked, hung on a broken database connection, or throwing 500 errors on every request.

To detect this, Docker provides the **`HEALTHCHECK`** instruction. It tells the Docker engine to periodically execute a command inside the container to test whether the application is genuinely healthy.

The healthcheck command returns an exit status code:
- **0: success:** The container is healthy and ready to serve traffic.
- **1: unhealthy:** The container is not working correctly.
- **2: reserved:** Do not use.

Docker updates the container state in `docker ps` from `starting` to `healthy` or `unhealthy`. Container orchestrators (Docker Swarm, Compose, Kubernetes) use this state to route traffic, restart failed containers, or hold rollouts.

| Parameter | Default | Purpose |
|---|---|---|
| `--interval` | `30s` | Time between successive healthcheck probes |
| `--timeout` | `30s` | Maximum time allowed for the probe command to exit |
| `--start-period` | `0s` | Initialization grace period for slow-starting apps |
| `--retries` | `3` | Consecutive failures required to declare container unhealthy |

## See it
Define an automated HTTP healthcheck in a Dockerfile:

```docker
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/

EXPOSE 3000

# Probe the internal HTTP health endpoint every 15 seconds
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

USER node
CMD ["node", "src/index.js"]
```

Inspect the container's health transitions using `docker ps`:

```bash
docker ps --filter "name=my-app" --format "table {{.Names}}	{{.Status}}"
# NAMES         STATUS
# my-app        Up 2 minutes (healthy)
```

## Go deeper
You can inspect historical healthcheck failures and terminal error outputs by querying `.State.Health.Log` in `docker inspect`:
```bash
docker inspect my-app --format '{{json .State.Health.Log}}'
```
This displays the exit codes and stdout/stderr output of the last few probes.

## Watch out
- Do not make healthchecks execute heavy database queries; healthchecks run frequently and will degrade database performance.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- `HEALTHCHECK` tests whether an application is genuinely responsive, not merely running.
- Exit code 0 indicates healthy; non-zero indicates unhealthy.
- Use `--start-period` to prevent failing probes during initial application startup and migrations.
