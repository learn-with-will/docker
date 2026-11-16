---
slug: executing-commands
title: "Executing Commands with docker exec"
topic: container-management
kind: technique
summary: "Run secondary processes and interactive debugging shells inside running containers with docker exec."
tags: [docker-exec, interactive, shell, debugging]
related: [docker-run-flags, container-logs, debugging-crashing-containers]
---
> **In one line:** Use docker exec to spawn new processes inside the existing namespaces of a running container.

## The idea
Developers often need to troubleshoot active services: inspecting environment variables, querying a local database port, or verifying filesystem permissions.

The `docker exec` command allows you to execute a new program inside an already running container. The new process joins the existing namespaces (network, mount, PID) and cgroups of the target container.

It is critical to distinguish `docker run` from `docker exec`:
- `docker run` creates and starts an entirely **new** container from an image.
- `docker exec` starts an auxiliary process inside an **existing**, running container.

```tree
Target Container: web-prod (PID 1: nginx)
  Namespaces: Net, Mount, PID, UTS
    ├── Existing process: nginx master (PID 1)
    ├── Existing worker: nginx worker (PID 28)
    └── Spawned by docker exec: sh -i (PID 142)
```

## See it
Start an active Redis container and use `docker exec` to interact with it:

```bash
# Start Redis in the background
docker run -d --name redis-cache redis:alpine

# Execute redis-cli directly inside the running container
docker exec redis-cache redis-cli ping

# Check memory stats inside the container
docker exec redis-cache redis-cli info memory
```

The command prints the expected Redis ping-pong response:

```text
PONG
# Memory
used_memory:872416
used_memory_human:851.97K
```

You can also launch an interactive debugging shell:

```bash
# Open interactive shell inside the Redis container
docker exec -it redis-cache sh
```

## Go deeper
You can execute commands as a different user by passing the `-u` flag (e.g., `docker exec -u 0 -it web-app sh` to run as root for administrative tasks). You can also inject ad-hoc environment variables using `-e DEBUG=true`.

## Watch out
- Any files created or modified via `docker exec` reside in the container's ephemeral writable layer and will be lost when the container is removed.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `docker exec` runs a new process inside an existing container without creating a new container.
- Combine `-it` with a shell binary (`sh` or `bash`) for interactive live container debugging.
- Use `-u` to override user identity when diagnosing permission or ownership issues.
