---
slug: layer-caching-order
title: "Layer Caching & Instruction Order"
topic: advanced-builds
kind: technique
summary: "Optimize build instruction ordering to maximize Docker layer cache hit rates and eliminate redundant work."
tags: [layer-cache, build-performance, instruction-order, dependencies]
related: [image-layers, combining-run-commands, multi-stage-builds]
---
> **In one line:** Order Dockerfile instructions from least-frequently to most-frequently changing to maximize layer cache hits.

## The idea
When Docker executes a build, it evaluates each instruction sequentially and checks whether a cached layer matching that exact instruction and its input files already exists locally or in the remote registry.

If a cache hit occurs, Docker skips executing the instruction and immediately reuses the cached layer. However, **cache invalidation is cascading**:
As soon as a single instruction is invalidated (for example, because a copied file changed or a command was edited), **every single instruction that follows it must be executed from scratch**.

The fundamental rule of Dockerfile optimization is to sequence instructions from least-frequently changing to most-frequently changing:
1. Base image declaration (`FROM`)
2. System packages and tools (`RUN apk add ...`)
3. Dependency manifests (`COPY package*.json` or `requirements.txt`)
4. Dependency installation (`RUN npm ci` or `pip install`)
5. Application source code (`COPY src/ ...`)

```text
Instruction Ordering Flow:
  FROM node:22-alpine          [Changes rarely  => 100% CACHE HIT]
  WORKDIR /app                 [Changes rarely  => 100% CACHE HIT]
  COPY package*.json ./        [Changes weekly  => CACHE HIT]
  RUN npm ci                   [Changes weekly  => CACHE HIT]
  COPY src/ ./src/             [Changes hourly  => REBUILDS HERE]
  CMD ["node", "src/index.js"] [Metadata only   => INSTANT]
```

| Pattern | Instruction Sequence | Cache Efficiency |
|---|---|---|
| Anti-pattern | `COPY . .` then `RUN npm ci` | Zero caching: any file edit re-runs npm install |
| Best practice | `COPY package*.json` -> `RUN npm ci` -> `COPY src/` | Fast builds: code edits reuse cached dependencies |

## See it
Compare the cache-busting anti-pattern with the optimized caching pattern:

```docker
// Before (Copying all files before install invalidates npm cache on every code change)
COPY . .
RUN npm install

// After (Copy dependency manifests first; npm install caches until package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
```

Build the image twice and observe the cache status:

```bash
# Build image leveraging cached dependency layer:
docker build -t cache-demo .
# => [3/5] COPY package*.json ./           0.0s (CACHED)
# => [4/5] RUN npm install                0.0s (CACHED)
# => [5/5] COPY src/ ./                   0.2s
```

## Go deeper
For `COPY` instructions, Docker calculates a SHA-256 checksum of the content of each file being copied. If the checksum matches the cached layer metadata, the cache is preserved. Modifying file modification timestamps (mtime) does not bust the cache as long as the file content remains identical.

## Watch out
- Do not run commands like `RUN apt-get update && apt-get upgrade -y` in separate instructions; if the update layer caches, subsequent builds will install obsolete packages.

## Remember
- Changing any instruction invalidates that layer and forces every subsequent instruction to re-run.
- Copy dependency manifests and install packages before copying application source code.
- Leverage BuildKit's parallel caching graph to minimize CI/CD build runtimes.
