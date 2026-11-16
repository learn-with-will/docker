---
slug: github-actions-cache
title: "GitHub Actions Build Caching"
topic: cicd-and-deployment
kind: technique
summary: "Accelerate CI/CD build speeds by caching Docker build layers in GitHub Actions cache or registry cache."
tags: [gha-cache, buildkit, cache-from, build-acceleration]
related: [github-actions-docker-build, buildkit-cache-mounts, layer-caching-order]
---
> **In one line:** Use cache-from and cache-to type=gha to persist Docker layer caches across GitHub Actions workflow runs.

## The idea
Every time a GitHub Actions workflow executes, it starts on a fresh, pristine virtual machine. Local Docker storage is completely empty, which means a standard `docker build` command must re-download base images and re-run all package installations from scratch every single run.

BuildKit solves this by supporting **Remote Cache Backends**:
It can export intermediate build layer caches to external storage during a build (`cache-to`), and import those cached layers in subsequent workflow runs (`cache-from`).

BuildKit provides native integration with GitHub's cache service using **`type=gha`**:
- On the first build: BuildKit compiles layers and uploads the cache artifacts to the GitHub Actions cache.
- On subsequent builds: BuildKit pulls cached layers directly from GitHub's high-speed internal cache, shortening CI build times from 10 minutes to under 30 seconds.

| Cache Type | Backend | Configuration Syntax |
|---|---|---|
| `gha` | GitHub Actions Cache API | `type=gha,mode=max` |
| `registry` | Inline inside OCI container registry | `type=registry,ref=ghcr.io/org/app:cache` |
| `local` | Local disk path on host | `type=local,src=/tmp/cache` |

## See it
Integrate GitHub Actions caching into `docker/build-push-action`:

```yaml
      - name: Build with GitHub Actions Cache
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          tags: my-app:latest
          # Import cache from previous workflow runs
          cache-from: type=gha
          # Export all intermediate stage layers to GitHub cache
          cache-to: type=gha,mode=max
```

## Go deeper
Notice the parameter `mode=max` in `cache-to`. By default (`mode=min`), BuildKit caches only the layers belonging to the final output stage. Setting `mode=max` instructs BuildKit to cache layers from **all** intermediate multi-stage build stages, ensuring dependencies installed in builder stages are preserved across CI runs.

## Watch out
- GitHub Actions enforces a 10 GB cache storage limit per repository; stale caches are automatically evicted using a Least Recently Used (LRU) policy.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Fresh CI runners lack local layer caches, forcing full rebuilds unless remote caching is configured.
- Use `cache-from: type=gha` and `cache-to: type=gha,mode=max` in GitHub Actions.
- `mode=max` preserves build layers across all multi-stage build steps.
