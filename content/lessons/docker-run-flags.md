---
slug: docker-run-flags
title: "Everyday docker run Flags"
topic: container-management
kind: technique
summary: "Master the essential flags of docker run: -d for background execution, --name for identity, and -it for shells."
tags: [docker-run, flags, detached, interactive]
related: [lifecycle-commands, executing-commands, port-publishing]
---
> **In one line:** Flags like -d, --name, --rm, and -it configure how a container runs, interacts, and cleans up.

## The idea
While `docker run <image>` suffices for basic tests, production workloads and interactive debugging require specific configuration flags. Without flags, containers generate random names (like `nervous_curie`), occupy terminal sessions, and linger on disk after exiting.

Four flags form the foundation of day-to-day container execution:
- `-d` (**Detached mode**): Runs the container in the background and prints the full 64-character container ID.
- `--name <string>`: Assigns a readable, unique identifier so you can reference the container in subsequent commands instead of copying hexadecimal IDs.
- `--rm`: Automatically destroys the container and deletes its writable layer as soon as it exits.
- `-it` (**Interactive + TTY**): Combines `-i` (keeps STDIN open) and `-t` (allocates a pseudo-TTY terminal), mandatory when launching an interactive shell like `sh` or `bash`.

| Flag | Full Option | Typical Use Case |
|---|---|---|
| `-d` | `--detach` | Long-running daemons, web servers, databases |
| `--name` | `--name <name>` | Assigning predictable names for scripts and linking |
| `--rm` | `--rm` | Ephemeral test runs, one-off CLI tools, migrations |
| `-it` | `--interactive --tty` | Shell sessions, debugging environments |

## See it
Launch a background NGINX web server with a custom name and automatic cleanup:

```bash
# Run detached web server named web-gateway
docker run -d --name web-gateway --rm -p 8080:80 nginx:alpine

# Verify active status in process list
docker ps --filter "name=web-gateway" --format "table {{.Names}}	{{.Status}}	{{.Ports}}"
```

Alternatively, launch an ephemeral interactive shell in Alpine Linux to inspect utilities:

```bash
# Interactive shell that cleans up upon typing exit
docker run -it --rm alpine sh
```

Inside the container shell, test running standard commands before exiting:

```bash
/ # hostname && whoami
2e97a3cf1201
root
/ # exit
```

## Go deeper
You can set working directories directly on the command line using `-w /app`, and pass custom hostnames using `-h my-server`. Combining these flags allows you to emulate diverse runtime environments on demand without rebuilding image templates.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Use `-d` to run background daemon services without blocking your terminal prompt.
- Use `--rm` for transient commands to prevent accumulating hundreds of stopped containers.
- Combine `-i` and `-t` whenever you require an interactive shell session.
