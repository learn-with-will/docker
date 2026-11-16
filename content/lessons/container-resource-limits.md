---
slug: container-resource-limits
title: "Container Resource Limits: CPU & Memory"
topic: debugging-observability
kind: technique
summary: "Constrain and meter container CPU quotas and memory ceilings to eliminate noisy-neighbor issues."
tags: [resource-limits, cgroups, memory-oom, cpu-quota]
related: [namespaces-and-cgroups, docker-inspect-formatting, debugging-crashing-containers]
---
> **In one line:** Enforce hard CPU and memory ceilings on containers to prevent one rogue service from crashing the host.

## The idea
By default, a Docker container has no resource constraints. A memory leak or infinite loop in a single container can consume 100% of the host machine's physical RAM and saturate all CPU cores, starving the operating system kernel and crashing adjacent services.

Docker leverages Linux cgroups to enforce strict resource budgets:
- **Memory limits (`-m` or `--memory`):** Sets the maximum physical RAM the container can allocate. If the container attempts to exceed this ceiling and cannot reclaim memory, the Linux kernel OOM killer terminates the process immediately (Exit code 137).
- **CPU limits (`--cpus`):** Sets the fraction of total CPU cores the container is allowed to consume. For example, `--cpus="1.5"` guarantees the container process will not consume more than 150% of a single core's CPU time per cgroup scheduling period.

| Resource Option | Example | Effect |
|---|---|---|
| `--memory` | `--memory=512m` | Hard physical memory ceiling |
| `--memory-swap` | `--memory-swap=1g` | Total memory + swap limit |
| `--cpus` | `--cpus="2.0"` | Caps execution to 2 full CPU cores |
| `--cpu-shares` | `--cpu-shares=512` | Relative CPU weight during CPU contention |

## See it
Launch a container constrained to 256 megabytes of RAM and half a CPU core:

```bash
# Restrict container to 256MB RAM and 0.5 CPU core
docker run -d --name budget-app \
  --memory=256m \
  --memory-swap=256m \
  --cpus="0.5" \
  nginx:alpine
```

Monitor live resource consumption across active containers using `docker stats`:

```bash
docker stats --no-stream
```

The dashboard streams real-time CPU percentages, memory limits, and network I/O:

```text
CONTAINER ID   NAME         CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
a1b2c3d4e5f6   budget-app   0.02%     4.12MiB / 256MiB      1.61%     1.2kB / 0B
```

## Go deeper
Setting `--memory-swap` equal to `--memory` disables swap space entirely for that container. In performance-critical databases and microservices, disabling swap prevents memory latency spikes caused by paging container memory to slow disk storage.

## Watch out
- Ensure your Java, Node.js, or Go runtime understands cgroup memory limits; older runtimes read host physical memory rather than container limits, causing premature OOM crashes.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Always assign memory limits (`--memory`) to production containers to protect host stability.
- Use `--cpus` to cap CPU consumption and prevent core saturation.
- Monitor active resource utilization across running containers with `docker stats`.
