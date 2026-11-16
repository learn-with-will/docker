---
slug: clean-system-prune
title: "Reclaiming Space with docker system prune"
topic: container-management
kind: tool
summary: "Analyze Docker storage consumption and reclaim disk space safely using docker system df and prune."
tags: [prune, disk-space, cleanup, system-df]
related: [removing-containers, image-retention-and-cleanup, volume-inspection-backup]
---
> **In one line:** Analyze storage with docker system df and reclaim unused disk space with docker system prune.

## The idea
During daily development, building Dockerfiles and testing containers accumulates significant disk overhead: stopped test containers, intermediate dangling build layers, unused bridge networks, and orphaned volumes.

Eventually, developer laptops and CI/CD runner nodes encounter the dreaded `no space left on device` error.

Docker provides the unified `docker system` management commands to audit and clean all resources simultaneously:
- **`docker system df`**: Displays a scannable summary of space consumed by images, containers, local volumes, and BuildKit build caches.
- **`docker system prune`**: Deletes stopped containers, unused networks, and dangling images (untagged images created during builds).
- **`docker system prune -a --volumes`**: Comprehensive cleanup that purges all stopped containers, unused networks, unreferenced images, and unattached volumes.

| Cleanup Target | Command | Safe for Active Projects? |
|---|---|---|
| Dangling images & stopped containers | `docker system prune` | Yes; only deletes inactive artifacts |
| All unused images | `docker system prune -a` | Moderate; will re-download base images |
| Inactive named volumes | `docker system prune --volumes` | Caution; permanent database data loss |

## See it
First, inspect your active storage consumption breakdown:

```bash
# Audit storage distribution across Docker objects
docker system df

# Execute a safe cleanup to purge dangling images and stopped containers
docker system prune -f
```

The report categorizes storage by resource type, showing total count and reclaimable space:

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          14        4         2.18GB    1.42GB (65%)
Containers      8         2         124MB     82MB (66%)
Local Volumes   6         3         840MB     410MB (48%)
Build Cache     42        0         3.12GB    3.12GB
Total reclaimed space: 1.83GB
```

## Go deeper
BuildKit maintains an independent build cache outside the image graph. To reclaim disk space consumed specifically by build cache layers without affecting downloaded base images, run `docker builder prune`.

## Watch out
- Never run `docker system prune --volumes` in production without verifying volume backups; unattached database volumes will be permanently erased.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Check disk distribution across images, containers, and volumes with `docker system df`.
- `docker system prune` safely purges stopped containers, dangling images, and inactive networks.
- Include `--volumes` only when you are certain no persistent state needs to be retained.
