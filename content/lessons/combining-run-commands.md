---
slug: combining-run-commands
title: "Combining RUN Commands & Cleaning Caches"
topic: advanced-builds
kind: pattern
summary: "Chain shell commands and delete package manager caches within single RUN steps to minimize image layer size."
tags: [run, layer-size, apt-get, cache-cleaning]
related: [layer-caching-order, minimal-base-images, multi-stage-builds]
---
> **In one line:** Chain package installation with cache cleanup in a single RUN instruction to prevent temporary files from bloating layers.

## The idea
Each `RUN` instruction in a Dockerfile commits a separate, immutable read-only layer to the image.

A common pitfall among beginners is executing commands across multiple `RUN` steps:
```docker
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

Why is this an anti-pattern?
Because layers are immutable, deleting files in a subsequent `RUN` step does **not** shrink the size of the previous layer. The package indexes downloaded by `apt-get update` remain stored in Layer 1, consuming space forever. The `rm` command in Layer 3 simply records a deletion mask on top.

To eliminate temporary files and shrink image sizes, you must execute the update, installation, and cleanup inside **a single chained `RUN` instruction** using the `&&` operator.

| Operating System | Package Manager | Recommended Chained Cleanup Pattern |
|---|---|---|
| Debian / Ubuntu | `apt-get` | `apt-get update && apt-get install -y --no-install-recommends <pkg> && rm -rf /var/lib/apt/lists/*` |
| Alpine Linux | `apk` | `apk add --no-cache <pkg>` |
| RHEL / Fedora | `dnf` / `yum` | `dnf install -y <pkg> && dnf clean all && rm -rf /var/cache/dnf` |

## See it
Compare the multi-layer bloat versus the single clean layer:

```docker
// Before (Bloated: package cache trapped in lower layers)
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

// After (Lean: cache cleaned before layer is committed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
```

On Alpine Linux, the `--no-cache` flag downloads index files directly into memory without writing them to disk:

```docker
RUN apk add --no-cache curl tzdata
```

## Go deeper
Notice the `--no-install-recommends` flag in Debian/Ubuntu builds. By default, `apt-get` installs "recommended" auxiliary packages such as graphical drivers and documentation. Adding `--no-install-recommends` avoids installing hundreds of unnecessary dependency libraries.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Each `RUN` instruction produces a permanent, immutable filesystem layer.
- Deleting files in a later layer does not remove them from lower layers; chain commands with `&&`.
- Use `apk add --no-cache` on Alpine or clean `/var/lib/apt/lists/*` on Debian.
