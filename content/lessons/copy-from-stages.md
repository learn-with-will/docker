---
slug: copy-from-stages
title: "COPY --from Across Build Stages"
topic: advanced-builds
kind: technique
summary: "Copy specific build artifacts from named build stages and existing external images using COPY --from."
tags: [copy-from, multi-stage, artifacts, compilation]
related: [multi-stage-builds, minimal-base-images, dockerfile-anatomy]
---
> **In one line:** The COPY --from flag extracts specific files from previous build stages or external Docker images.

## The idea
The power of multi-stage builds centers on the `COPY --from` directive. Rather than copying files strictly from your local host workstation, `COPY --from` can extract artifacts from two distinct sources:

1. **Named build stages:** Referencing an earlier stage declared with `FROM <base> AS <name>`.
2. **External container images:** Directly extracting pre-built utilities or assets from third-party images in a registry without writing a separate build stage.

For example, if your application requires the official Docker CLI or a tool like `grpc_health_probe`, you do not need to download, compile, or install it via package managers. You can copy the exact binary directly from its official image.

| Source Type | Example Syntax | Source Location |
|---|---|---|
| Named Build Stage | `COPY --from=builder /app/dist ./public` | Previous stage in same Dockerfile |
| External Image | `COPY --from=caddy:2.8 /usr/bin/caddy /usr/bin/caddy` | Pre-built binary from Docker Hub |

## See it
Use `COPY --from` to build a Single Page Application (SPA) with Node.js and serve it with NGINX:

```docker
# Stage 1: Build frontend assets
FROM node:22-alpine AS frontend-builder
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve static files with NGINX
FROM nginx:alpine
# Copy compiled static HTML/JS/CSS directly from builder stage
COPY --from=frontend-builder /workspace/dist /usr/share/nginx/html

# Copy pre-built TLS cert tool directly from an external image
COPY --from=caddy:2.8-alpine /usr/bin/caddy /usr/local/bin/caddy

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Go deeper
You can also reference build stages by zero-based numerical index (`COPY --from=0 /app/bin .`), but using explicit semantic names (`AS builder`, `AS frontend-builder`) prevents catastrophic breakage if stages are reordered or added later.

## Watch out
- Ensure target directories exist or end with a trailing slash `./` so Docker handles directory creation predictably.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `COPY --from=<stage>` copies files between build stages, leaving compilers behind.
- `COPY --from=<image>` extracts pre-compiled tools directly from external registry images.
- Always name your build stages explicitly with `AS <name>` for readability and maintainability.
