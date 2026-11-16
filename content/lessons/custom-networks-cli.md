---
slug: custom-networks-cli
title: "Managing Networks with the CLI"
topic: networking
kind: tool
summary: "Manage virtual networks using docker network create, connect, disconnect, and prune."
tags: [docker-network, network-create, network-connect, cli]
related: [user-defined-bridge, default-bridge-network, container-dns-troubleshooting]
---
> **In one line:** The docker network command group creates, inspects, connects, and cleans virtual networks.

## The idea
Docker provides a dedicated management command group—`docker network`—to administer the lifecycle of virtual software-defined networks on your host.

Key network management commands:
- **`docker network ls`**: Lists all networks existing on the host along with their scope and active network driver.
- **`docker network create`**: Provisions a new virtual network. You can specify custom subnets (`--subnet`), gateway IPs (`--gateway`), and network drivers (`--driver`).
- **`docker network connect`**: Dynamically attaches a running container to a network without restarting the container process.
- **`docker network disconnect`**: Unplugs a container from an existing network in real time.
- **`docker network prune`**: Deletes all unused user-defined networks not currently attached to any container.

| Command | Action |
|---|---|
| `docker network create <name>` | Creates a new user-defined bridge network |
| `docker network connect <net> <c>` | Attaches a container to an additional network |
| `docker network disconnect <net> <c>` | Detaches a container from a network |
| `docker network inspect <net>` | Dumps subnet, gateway, and attached container list |

## See it
Create a custom isolated network with a specified IP subnet, attach containers dynamically, and inspect routing:

```bash
# Create custom bridge network with dedicated subnet
docker network create --subnet=10.10.0.0/16 --gateway=10.10.0.1 secure-tier

# Launch container on default network
docker run -d --name multi-tier-app nginx:alpine

# Dynamically connect the running container to the secure-tier network
docker network connect secure-tier multi-tier-app
```

Inspect the network to confirm the container was assigned a 10.10.x.x IP address:

```bash
docker network inspect secure-tier --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{end}}'
```

The inspect command displays the dynamic IP assignment:

```text
multi-tier-app: 10.10.0.2/16
```

## Go deeper
Containers attached to multiple networks receive a separate virtual ethernet interface and IP address for each network. You can verify this by running `docker exec <container> ip addr` to observe `eth0`, `eth1`, etc.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- Use `docker network create --subnet` to define explicit IP ranges for internal network segments.
- `docker network connect` attaches running containers to additional networks dynamically.
- Regularly run `docker network prune` to clean up unused network interfaces and iptables rules.
