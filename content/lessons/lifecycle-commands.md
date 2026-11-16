---
slug: lifecycle-commands
title: "Container Lifecycle Commands"
topic: container-management
kind: technique
summary: "Control container execution states with docker start, stop, restart, pause, and kill."
tags: [start, stop, restart, kill]
related: [docker-run-flags, removing-containers, stop-signals-and-exit-codes]
---
> **In one line:** Control running containers gracefully with stop and restart, or forcefully with kill.

## The idea
Once containers are launched, operators need precise control over their execution. Docker provides distinct commands corresponding to different operating system signals:

- **`docker stop`**: Initiates a graceful shutdown. It sends a `SIGTERM` signal to the container's PID 1 process, allowing it to complete in-flight HTTP requests, flush database buffers, and close sockets. If the process does not terminate within a grace period (default 10 seconds), Docker follows up with a forced `SIGKILL`.
- **`docker kill`**: Bypasses graceful termination and sends an immediate `SIGKILL` signal directly to PID 1.
- **`docker start`**: Boots an existing stopped container, preserving all modifications made to its writable layer.
- **`docker restart`**: Executes a `stop` followed by a `start`.

| Command | Signal Sent | Grace Period | Use Case |
|---|---|---|---|
| `docker stop` | `SIGTERM` (then `SIGKILL`) | 10s default | Standard graceful service shutdown |
| `docker kill` | `SIGKILL` (immediate) | None | Freeing stuck or unresponsive processes |
| `docker pause` | `SIGSTOP` via cgroups | Indefinite | Freezing process without unloading RAM |

## See it
Manage an active container through stopping and restarting cycles:

```bash
# Start background container
docker run -d --name cache-store redis:alpine

# Gracefully stop the service with a 5-second grace period
docker stop --time 5 cache-store

# Restart the existing container
docker start cache-store
```

Verify the container status has transitioned back to running:

```bash
# Check status in docker ps
docker ps --filter "name=cache-store" --format "table {{.Names}}	{{.Status}}"
```

The command output confirms the container is operational again:

```text
NAMES         STATUS
cache-store   Up 2 seconds
```

## Go deeper
When writing microservices, ensure your code intercepts `SIGTERM` and exits cleanly with code 0. If your process ignores `SIGTERM`, every deployment will stall for 10 seconds waiting for the Docker daemon timeout.

## Watch out
- Do not use `docker kill` as your standard stopping mechanism; abrupt termination can corrupt databases and leave stale lockfiles.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `docker stop` sends `SIGTERM` first, granting processes 10 seconds to shut down cleanly.
- `docker kill` sends an immediate, uncatchable `SIGKILL` to terminate unresponsive containers.
- `docker start` revives an existing container without creating a new writable layer.
