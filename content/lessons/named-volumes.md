---
slug: named-volumes
title: "Data Persistence with Named Volumes"
topic: storage-and-volumes
kind: technique
summary: "Persist state safely across container lifecycles using Docker managed named volumes."
tags: [volumes, persistence, docker-volume, databases]
related: [writable-layer-storage, bind-mounts, volume-inspection-backup]
---
> **In one line:** Named volumes are Docker-managed storage directories on the host that persist independently of container lifecycles.

## The idea
When deploying databases, file storage services, or message queues, data must persist across container upgrades, reboots, and removals. **Named volumes** are the standard, recommended mechanism for persisting container state in Docker.

Unlike the container's writable layer, a named volume is managed directly by the Docker Engine and stored in a dedicated host directory (`/var/lib/docker/volumes/<name>/_data` on Linux).

Named volumes offer major operational advantages:
- **Independent lifecycle:** Deleting a container does not delete its attached named volume.
- **Native performance:** Bypasses the overlay2 storage driver, providing native host disk I/O throughput.
- **Docker CLI management:** Created, listed, inspected, and backed up using first-class `docker volume` commands.
- **Initialization:** When a new named volume is mounted to an existing directory in a container, Docker automatically copies any pre-existing image files into the volume.

| Feature | Named Volume | Writable Layer |
|---|---|---|
| Management | Docker Engine managed | Storage driver managed |
| Location | `/var/lib/docker/volumes/` | `/var/lib/docker/overlay2/` |
| Survival after `docker rm` | Yes (fully preserved) | No (permanently deleted) |

## See it
Mount a named volume to persist PostgreSQL database data across container replacements:

```bash
# Create a dedicated named volume
docker volume create pg-data

# Launch PostgreSQL with the named volume mounted to its data directory
docker run -d --name db-v1 -v pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:alpine

# Remove the container
docker rm -f db-v1

# Launch a brand new container mounting the EXACT same volume
docker run -d --name db-v2 -v pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:alpine
```

Inspect the volume to confirm its physical mount path on the host:

```bash
docker volume inspect pg-data --format 'Driver: {{.Driver}}, Mountpoint: {{.Mountpoint}}'
```

The output confirms the volume metadata:

```text
Driver: local, Mountpoint: /var/lib/docker/volumes/pg-data/_data
```

## Go deeper
You can mount volumes using the older `-v <name>:<path>` syntax or the newer, more explicit `--mount` syntax: `--mount type=volume,source=pg-data,target=/var/lib/postgresql/data`. The `--mount` syntax supports advanced options like volume drivers and read-only mode (`readonly`).

## Watch out
- Deleting an image or container will never delete a named volume; volumes must be explicitly deleted using `docker volume rm`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Named volumes are the standard, recommended approach for persisting database and stateful application data.
- Volumes survive container deletion and achieve native host disk read/write throughput.
- Inspect and manage volumes using the dedicated `docker volume` CLI command group.
