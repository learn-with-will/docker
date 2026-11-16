---
slug: image-retention-and-cleanup
title: "Image Retention & Cleanup"
topic: images-and-registries
kind: pattern
summary: "Implement lifecycle policies to prune old images in registries and eliminate host disk bloat."
tags: [cleanup, dangling, prune, retention]
related: [clean-system-prune, tagging-strategies, layer-caching-order]
---
> **In one line:** Set registry retention rules and prune untagged local images to prevent uncontrolled storage growth.

## The idea
Continuous Integration (CI) systems build tens or hundreds of container images daily. Each image layer consumes gigabytes of cloud object storage and local runner disk space.

Without an automated cleanup strategy, image repositories grow indefinitely, leading to exorbitant registry bills and disk-full deployment outages.

An effective retention architecture operates on two fronts:
1. **Registry Lifecycle Policies:** Managed registries (such as AWS ECR, GitHub Packages, or Harbor) support declarative retention rules. For example: "Keep only the last 50 images matching `sha-*`, keep all semantic version tags `v*`, and delete untagged images after 7 days."
2. **Local Daemon Pruning:** Build servers periodically prune local images:
   - **Dangling images:** Images with no tag name (`<none>:<none>`), created when a new build supersedes an existing tag.
   - **Unused images:** Images not currently referenced by any active or stopped container.

| Image Status | Filter | Cleanup Command |
|---|---|---|
| Dangling images only | `dangling=true` | `docker image prune` |
| All unreferenced images | Active filter | `docker image prune -a` |
| Old images by date | `until=<duration>` | `docker image prune -a --filter "until=168h"` |

## See it
Inspect and purge dangling untagged images on your workstation:

```bash
# List dangling images created during recent builds
docker images --filter "dangling=true"

# Remove all dangling images without confirmation prompt
docker image prune -f

# Purge unreferenced images older than 7 days
docker image prune -a --force --filter "until=168h"
```

The prune command frees storage while protecting active layers:

```text
Deleted Images:
deleted: sha256:6e01bc...
deleted: sha256:5a92cc...
Total reclaimed space: 1.12GB
```

## Go deeper
When images share base layers (such as multiple microservices built on `alpine:3.20`), Docker stores each layer only once. Deleting one image does not delete shared layers still referenced by other local images.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- Configure registry lifecycle rules to expire untagged and transient CI images automatically.
- Dangling images (`<none>:<none>`) can be safely purged anytime using `docker image prune`.
- Use the `until` filter to prune stale development images while preserving recent build caches.
