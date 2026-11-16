---
slug: host-and-none-networking
title: "Host and None Network Drivers"
topic: networking
kind: concept
summary: "Bypass virtual network bridges using host networking for raw speed, or none for total network isolation."
tags: [host-network, none-network, network-drivers, isolation]
related: [default-bridge-network, user-defined-bridge, network-security-isolation]
---
> **In one line:** Use --net=host to share the host network stack for raw throughput, or --net=none for total network air-gapping.

## The idea
While bridge networks suit most workloads, Docker provides two specialized network modes for specific performance and security requirements:

- **`--network host` (Host Networking):** Removes network isolation between the container and the Docker host. The container does not receive its own IP address; instead, it binds directly to the host's physical network interfaces and ports. An application listening on port 80 inside the container listens directly on port 80 of the host machine without any NAT or port mapping overhead.
- **`--network none` (None Networking):** Completely disables networking. The container receives only a loopback interface (`127.0.0.1`). It has no external network interfaces, cannot reach the internet, and cannot be reached by other containers or the host.

| Network Driver | IP Address | Port Publishing | Primary Use Case |
|---|---|---|---|
| `bridge` | Private virtual IP | Required (`-p`) | Standard web apps, databases, microservices |
| `host` | Host physical IP | Direct (no `-p`) | Ultra-high throughput, network diagnostics |
| `none` | Loopback only | None (impossible) | Air-gapped batch jobs, security isolation |

## See it
Launch a container in complete network isolation and verify interface configuration:

```bash
# Launch a container with no network access
docker run --rm --network none alpine ip addr
```

Notice only the loopback interface is present:

```text
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
```

Alternatively, launch an NGINX container using host networking:

```bash
# Directly bind to host network interfaces (Linux hosts only)
docker run -d --name host-web --network host nginx:alpine
curl http://localhost
```

## Go deeper
Host networking eliminates the packet traversal and NAT translation overhead introduced by bridge interfaces, delivering maximum packets-per-second performance. However, port collisions occur if two host-mode containers attempt to bind to the same port.

## Watch out
- On Docker Desktop (macOS and Windows), `--network host` attaches to the virtual machine's network stack, not your macOS or Windows host interface.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- `--network host` shares the host network namespace directly, bypassing NAT for maximum throughput.
- `--network none` disables all network interfaces except loopback for complete security isolation.
- Host networking introduces port collision risks since containers share the host port namespace.
