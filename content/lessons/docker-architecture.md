---
slug: docker-architecture
title: "The Docker Architecture"
topic: foundations
kind: concept
summary: "The Docker platform uses a client-server architecture consisting of the CLI, dockerd daemon, containerd, and runc."
tags: [architecture, daemon, containerd, runc]
related: [what-is-a-container, oci-standards, docker-desktop-vs-engine]
---
> **In one line:** The Docker client talks via a REST API to dockerd, which delegates execution to containerd and runc.

## The idea
Docker is not a single monolithic program. It is an extensible client-server system composed of decoupled layers, each handling a specific responsibility in the container lifecycle.

1. **Docker CLI (`docker`):** The command-line interface developers interact with. It parses flags, validates input, and sends HTTP requests over a local Unix domain socket (`/var/run/docker.sock`) or remote TLS socket.
2. **Docker Daemon (`dockerd`):** A persistent background server that implements the Docker Engine REST API. It coordinates high-level operations such as user authentication, image building, storage drivers, and overlay networks.
3. **containerd:** An industry-standard container runtime originally created by Docker and now governed by the CNCF. It manages image pulling, image unpacking, and the container lifecycle.
4. **runc:** A low-level, lightweight CLI tool that implements the OCI runtime specification. It interacts directly with Linux kernel namespaces and cgroups to spawn the isolated container process, then exits immediately.

```flow
client: Docker CLI | docker client @primary
dockerd: Docker Daemon | Engine REST API @blue
containerd: containerd | Lifecycle & Images @green
runc: runc | OCI Runtime @amber
client -> dockerd: REST API / socket
dockerd -> containerd: gRPC requests
containerd -> runc: spawns process
```

## See it
Verify the decoupled versions of the client, daemon, containerd, and runc using the version command:

```bash
# Inspect the discrete component versions
docker version --format 'Client: {{.Client.Version}}, Server: {{.Server.Version}}'

# Query the default low-level runtime engine
docker info --format 'Server: {{.ServerVersion}}, Default Runtime: {{.DefaultRuntime}}'
```

The output shows that the Docker client and daemon report independent versions and confirm the presence of runc:

```text
Client: 27.3.1, Server: 27.3.1
Server: 27.3.1, Default Runtime: runc
```

## Go deeper
Once runc configures the Linux namespaces and launches the container process, it hands ownership of the process to `containerd-shim`. This decoupling allows the Docker daemon (`dockerd`) to be restarted or upgraded without stopping running containers, ensuring zero-downtime maintenance on production nodes.

## Watch out
- Never expose the unauthenticated Docker Unix socket over a public network; root access to the Docker socket equals root access to the host.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- The Docker CLI communicates with the dockerd daemon over a REST API via a Unix domain socket.
- dockerd delegates image distribution and container lifecycle management to containerd.
- runc is the low-level OCI reference runtime responsible for configuring kernel namespaces and starting processes.
