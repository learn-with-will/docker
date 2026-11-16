---
slug: namespaces-and-cgroups
title: "Kernel Namespaces & Cgroups"
topic: foundations
kind: concept
summary: "Linux namespaces isolate system resources per process, while cgroups meter and constrain CPU, memory, and I/O."
tags: [linux, namespaces, cgroups, kernel]
related: [what-is-a-container, containers-vs-vms, docker-architecture]
---
> **In one line:** Namespaces define what a process can see; cgroups define how many resources a process can use.

## The idea
Containers are not monolithic kernel primitives. Instead, Docker relies on two distinct features present in the Linux kernel: namespaces and control groups (cgroups). Together, these features construct a secure execution sandbox for standard host processes.

Namespaces create virtual partitions for system resources. When a process runs inside a namespace, it only observes the resources assigned to that namespace:
- **PID:** Isolates process IDs; the container process becomes PID 1 inside its namespace.
- **NET:** Isolates network interfaces, routing tables, and IP port allocations.
- **MNT:** Isolates filesystem mount points, providing a private root filesystem.
- **IPC:** Isolates System V IPC and POSIX message queues.
- **UTS:** Isolates hostname and NIS domain name.
- **USER:** Maps in-container root UID 0 to unprivileged host user IDs.

Control groups (cgroups, specifically cgroups v2 in modern Linux) control resource distribution. Cgroups prevent a single rogue container from consuming all system RAM or saturating all CPU cores, avoiding noisy-neighbor starvation across multi-tenant servers.

| Mechanism | Purpose | Examples |
|---|---|---|
| Namespaces | Scopes visibility and views | Private network stack, isolated mount tree, PID 1 |
| Cgroups | Limits and meters resource consumption | 512 MB memory limit, 1.5 CPU cores, I/O throttle |

## See it
You can pass resource limits directly when launching a container with the Docker command-line tool:

```bash
# Launch container restricted to 256MB RAM and 1 CPU core
docker run -d --name throttled-app --memory="256m" --cpus="1.0" nginx:alpine

# Verify that the memory limit was applied via kernel cgroups
docker inspect throttled-app --format 'Memory Limit: {{.HostConfig.Memory}} bytes, CPU Quota: {{.HostConfig.NanoCpus}}'
```

The inspect command confirms that the daemon registered the exact constraints with the Linux kernel:

```text
Memory Limit: 268435456 bytes, CPU Quota: 1000000000
```

## Go deeper
Linux cgroups v2 introduced a unified hierarchy for resource controllers. Instead of managing memory and CPU in separate tree filesystems, cgroups v2 provides a single coherent controller tree with superior out-of-memory handling, pressure stall information (PSI), and unified buffer writeback management.

## Watch out
- If a container exceeds its configured cgroup memory limit, the Linux kernel OOM (Out Of Memory) killer terminates PID 1 with exit code 137.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Namespaces determine visibility by isolating mounts, networking, process IDs, and user accounts.
- Cgroups meter and constrain physical hardware allocation including memory, CPU, and disk I/O.
- Modern Docker deployments leverage cgroups v2 for unified resource isolation and monitoring.
