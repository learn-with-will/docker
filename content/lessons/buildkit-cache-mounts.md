---
slug: buildkit-cache-mounts
title: "BuildKit Cache Mounts"
topic: advanced-builds
kind: technique
summary: "Persist package manager download caches across builds using RUN --mount=type=cache."
tags: [cache-mounts, package-managers, npm, pip]
related: [buildkit-features, buildkit-secrets, github-actions-cache]
---
> **In one line:** BuildKit cache mounts persist compiler and package caches across builds without bloating image layers.

## The idea
When building Docker images, package managers like `npm`, `pip`, `cargo`, `go`, and `apt` download hundreds of megabytes of index files and tarballs into local cache directories (`~/.cache/pip`, `/root/.npm`, `/root/go/pkg/mod`).

In standard Docker builds, these cache files must either be deleted in the same layer to avoid image bloat, or they are lost whenever a dependency changes, forcing the package manager to re-download everything from scratch.

**BuildKit Cache Mounts** (`RUN --mount=type=cache`) solve this. They mount a persistent cache directory on the host directly into the container during the `RUN` instruction. When the command finishes:
1. The packages remain cached on the host for future builds.
2. The cache files are **not committed into the resulting image layer**.

| Package Manager | Cache Directory Inside Container | Mount Syntax |
|---|---|---|
| `npm` | `/root/.npm` | `--mount=type=cache,target=/root/.npm` |
| `pip` | `/root/.cache/pip` | `--mount=type=cache,target=/root/.cache/pip` |
| `go` | `/go/pkg/mod` and `/root/.cache/go-build` | `--mount=type=cache,target=/go/pkg/mod` |
| `apt` | `/var/cache/apt` and `/var/lib/apt` | `--mount=type=cache,target=/var/cache/apt` |

## See it
Accelerate package installations in Node.js and Python Dockerfiles using cache mounts:

```docker
# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./

# Mount npm cache to prevent re-downloading packages across layer busts
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY src/ ./src/
CMD ["node", "src/index.js"]
```

Here is the equivalent pattern for a Python FastAPI application:

```docker
# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt ./

# Cache pip downloads on host machine
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir=off -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

## Go deeper
BuildKit cache mounts support sharing modes: `sharing=shared` (default, allows concurrent builds to read/write), `sharing=private` (locks cache exclusively for one build), and `sharing=locked` (queues concurrent access).


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `--mount=type=cache` stores package manager caches persistently across build runs.
- Cache contents are excluded from the committed image layer, keeping final sizes minimal.
- Accelerates CI/CD and developer build cycles by eliminating redundant network downloads.
