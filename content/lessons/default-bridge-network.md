---
slug: default-bridge-network
title: "The Default Bridge Network"
topic: networking
kind: concept
summary: "Explore the legacy default bridge network (docker0) and understand why it lacks automatic DNS resolution."
tags: [networking, bridge, docker0, port-mapping]
related: [user-defined-bridge, port-publishing-vs-expose, host-and-none-networking]
---
> **In one line:** The default bridge network attaches containers to the docker0 interface, but lacks automatic container DNS resolution.

## The idea
When the Docker daemon starts on Linux, it creates a virtual software bridge interface named **`docker0`** (typically assigned the subnet `172.17.0.1/16`).

Unless you specify a network flag during `docker run`, every container automatically attaches to this **default bridge network** (named `bridge`). The container receives a virtual ethernet pair (`veth`), linking its private network namespace to the host `docker0` bridge, and is assigned an IP in that subnet.

However, the default bridge has a critical limitation: **it does not support automatic DNS resolution by container name**. If container `web` attempts to connect to container `db` by typing `http://db:5432`, name resolution fails. Containers on the default bridge can only reach each other by hardcoded, unstable private IP addresses unless using legacy, deprecated `--link` flags.

| Network Property | Default Bridge (`bridge`) | User-Defined Bridge |
|---|---|---|
| Automatic DNS resolution | No (IP address only) | Yes (resolves container names) |
| Isolation boundary | All containers share one bridge | Isolated per network segment |
| On-demand connect/disconnect | No | Yes (`docker network connect`) |
| Production suitability | Legacy / testing only | Recommended best practice |

## See it
Inspect the default bridge network configuration:

```bash
# Inspect the default bridge network
docker network inspect bridge --format 'Subnet: {{range .IPAM.Config}}{{.Subnet}}{{end}}'

# Launch two containers on the default bridge
docker run -d --name server-a alpine sleep 100
docker run -it --rm alpine ping -c 1 server-a
```

Notice that pinging by name fails on the default bridge:

```text
ping: bad address 'server-a'
```

## Go deeper
To resolve this limitation, Docker introduced user-defined networks. Docker's built-in embedded DNS server (listening at `127.0.0.11`) is only activated on **user-defined networks**, which is why modern deployments always create custom bridge networks.

## Watch out
- Do not rely on containers communicating via the default `bridge` network in production; container IP addresses change every time a container restarts.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- The default bridge attaches to the `docker0` interface and assigns private 172.17.x.x IPs.
- The default bridge does not provide automatic DNS resolution between container names.
- Always create user-defined bridge networks for multi-container applications.
