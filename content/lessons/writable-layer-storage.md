---
slug: writable-layer-storage
title: "The Container Writable Layer"
topic: storage-and-volumes
kind: concept
summary: "Understand why the container writable layer is ephemeral, slow for high I/O, and discarded upon removal."
tags: [storage, writable-layer, copy-on-write, ephemeral]
related: [named-volumes, bind-mounts, image-layers]
---
> **In one line:** The container writable layer stores ephemeral runtime file changes, but is completely destroyed when the container is removed.

## The idea
When Docker starts a container, it mounts the stack of read-only image layers and adds a thin **writable layer** (often called the container layer) on top.

Any file created, updated, or deleted by the running application is recorded in this writable layer:
- **New files:** Written directly into the writable container layer.
- **Modified files:** Copied from the lower read-only image layer up into the writable layer (Copy-on-Write) and modified there.
- **Deleted files:** A "whiteout" marker is written to the writable layer hiding the file from the lower layer.

While convenient for temporary files, the writable layer is completely **unsuitable for persistent application data** (like databases):
1. **Ephemeral lifetime:** When the container is deleted via `docker rm`, the writable layer is permanently erased.
2. **Performance penalty:** The overlay2 storage driver incurs measurable I/O latency for heavy read/write operations compared to native filesystem access.
3. **Host coupling:** Data stored in the writable layer cannot be easily accessed, backed up, or shared with other containers.

| Storage Mechanism | Lifetime | Performance | Sharing |
|---|---|---|---|
| Writable Layer | Tied to container life | Slower (CoW overlay driver) | Isolated to single container |
| Named Volume | Independent of container | Native host disk speed | Can share across containers |
| Bind Mount | Controlled by host filesystem | Native host disk speed | Shared with host and containers |

## See it
Observe file modifications inside a container's writable layer:

```bash
# Run a container and create a new file
docker run --name writer-demo alpine sh -c 'echo "Data" > /test.txt'

# Inspect file system changes using docker diff
docker diff writer-demo
```

The `docker diff` command highlights the modification in the writable layer:

```text
A /test.txt
```

Remove the container and observe that the data is gone:

```bash
docker rm writer-demo
```

## Go deeper
To identify how much storage space is consumed specifically by a container's writable layer versus its shared read-only base image, run `docker ps -s`. The `size` column indicates the writable layer size, while `virtual size` includes the shared read-only layers.

## Watch out
- Never run a production database (Postgres, MySQL, MongoDB) without mounting an external volume; a single `docker rm` will erase all database tables.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- The container writable layer is ephemeral and deleted permanently when the container is removed.
- Storage drivers introduce I/O overhead on writable layer modifications via Copy-on-Write.
- Production state and databases must always reside in dedicated volumes or bind mounts.
