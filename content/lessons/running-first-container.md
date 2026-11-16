---
slug: running-first-container
title: "Running Your First Container"
topic: foundations
kind: technique
summary: "Use docker run to pull an image, configure execution parameters, and run your first container process."
tags: [docker-run, hello-world, first-container, cli]
related: [container-lifecycle-states, docker-run-flags, container-logs]
---
> **In one line:** The docker run command pulls missing images, allocates a writable layer, and executes a containerized process.

## The idea
The command `docker run` is the most frequently executed command in the Docker workflow. It is actually a combined shortcut for two lower-level commands: `docker create` (which prepares the filesystem and namespaces) followed by `docker start` (which executes the process).

When you run `docker run <image>`, the Docker client contacts the local daemon. If the requested image is not cached in local storage, the daemon contacts the configured image registry (by default Docker Hub), downloads each layer, verifies SHA-256 digests, mounts a new copy-on-write layer on top, and invokes runc to execute the image's default command.

```sequence
actor dev: Developer
actor cli: Docker CLI
actor daemon: dockerd
actor hub: Docker Hub
dev -> cli: docker run alpine uname
cli -> daemon: POST /containers/create
daemon -> hub: Pull alpine if missing
hub --> daemon: Layers downloaded
daemon -> cli: Container created & started
cli --> dev: Prints kernel version
```

## See it
Run the official `hello-world` testing image to confirm your engine installation is operating properly:

```bash
# Run hello-world to verify client-daemon communication
docker run hello-world

# Run an Alpine container and pass custom arguments to its entrypoint
docker run --rm alpine echo "Hello from isolated container process"
```

The command output details the exact steps executed by the Docker Engine:

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from Docker Hub.
 3. The Docker daemon created a new container from that image.
 4. The Docker daemon streamed output to the Docker client.
Hello from isolated container process
```

## Go deeper
By default, `docker run` runs in the foreground, attaching your terminal standard input, output, and error streams directly to the container's root process. If the container process finishes its job (like `hello-world`), the container transitions to the Exited state immediately.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- `docker run` combines image pulling, container creation, and process execution in a single command.
- If the image is not found locally, the daemon automatically pulls it from Docker Hub.
- Foreground containers exit as soon as their primary entrypoint process completes.
