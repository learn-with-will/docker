---
slug: docker-buildx-multiarch
title: "Multi-Platform Builds with docker buildx"
topic: advanced-builds
kind: tool
summary: "Build multi-architecture images supporting amd64 and arm64 simultaneously using docker buildx."
tags: [buildx, multi-platform, amd64, arm64]
related: [buildkit-features, pushing-to-ghcr-actions, github-actions-docker-build]
---
> **In one line:** docker buildx builds multi-platform image manifests supporting amd64 and arm64 from a single command.

## The idea
Modern computing infrastructure spans multiple CPU architectures:
- Developer laptops frequently run on **ARM64** (Apple Silicon M1/M2/M3/M4, Snapdragon ARM chips).
- Cloud production servers typically run on **AMD64** (Intel / AMD x86_64) or cost-effective ARM64 instances (AWS Graviton, Ampere).

If you build an image on an Apple Silicon Mac without flags, Docker builds an `arm64` binary. If you deploy that image to an `x86_64` production server, the container will crash with:
```text
exec format error
```

**`docker buildx`** is Docker's CLI plugin for BuildKit that compiles multi-platform images. It builds separate image layers for each target architecture and bundles them together under an **OCI Manifest List**. When a client runs `docker pull my-app:latest`, the registry automatically serves the binary matching that specific client's CPU architecture.

```tree
Multi-Architecture Image Manifest
  linux/amd64 | Intel and AMD cloud servers @blue
    amd64 binary and libraries
  linux/arm64 | Apple Silicon and AWS Graviton @green
    arm64 binary and libraries
```

## See it
Create a BuildKit builder instance and build for both `linux/amd64` and `linux/arm64`:

```bash
# Create and activate a multi-platform builder instance
docker buildx create --name multi-builder --use
docker buildx inspect --bootstrap

# Build and push multi-architecture image directly to registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/my-org/universal-app:1.0.0 \
  --push .
```

Inspect the published manifest list using imagetools:

```bash
docker buildx imagetools inspect ghcr.io/my-org/universal-app:1.0.0
# Name:      ghcr.io/my-org/universal-app:1.0.0
# MediaType: application/vnd.oci.image.index.v1+json
```

## Go deeper
BuildKit compiles for non-native architectures using QEMU user-mode CPU emulation or distributed native builder nodes. Compiled languages like Go and Rust can cross-compile natively using build arguments without requiring slow QEMU emulation.

## Watch out
- You cannot load a multi-platform image directly into your local single-architecture Docker daemon (`--load`); you must push directly to a registry (`--push`).


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `docker buildx` enables building multi-architecture images for AMD64 and ARM64.
- An OCI Manifest List transparently delivers the correct binary matching the host CPU.
- Use multi-stage cross-compilation in Go and Rust to avoid QEMU emulation slowdowns.
