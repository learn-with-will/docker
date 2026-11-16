---
slug: network-security-isolation
title: "Network Security & Service Isolation"
topic: networking
kind: pattern
summary: "Design multi-tiered network architectures to isolate sensitive database tiers from public frontend web traffic."
tags: [network-security, segmentation, tiering, isolation]
related: [user-defined-bridge, compose-networking-dns, dropping-linux-capabilities]
---
> **In one line:** Segment application architectures into distinct internal networks so only public gateways expose ports.

## The idea
A fundamental tenet of zero-trust network architecture is the **principle of least privilege**: no service should be able to communicate with another service unless strictly required for its business function.

If you place all application containers—frontend web server, payment processor, and customer database—on a single shared bridge network, an attacker who compromises the public web server gains direct network connectivity to the database and payment processor.

Production container security mandates **network segmentation**:
- **Public DMZ network (`frontend-net`):** Only reverse proxies and frontend web servers connect here. This is the only network publishing host ports (`-p 80:80`).
- **Internal application network (`app-net`):** Connects API servers to microservices. It has no external port bindings.
- **Secure database network (`db-net`):** Connects API servers to databases and caches. The frontend web server is physically disconnected from this network.

```flow
proxy: Reverse Proxy | Port 80/443 @primary
web: Web App | frontend-net @blue
api: Core API | app-net @green
db: Database | db-net (isolated) @amber
proxy -> web: frontend-net
web -> api: app-net
api -> db: db-net
```

| Network Tier | Services | External Ports Published? |
|---|---|---|
| `frontend-net` | NGINX Reverse Proxy, Web UI | Yes (`80:80`, `443:443`) |
| `app-net` | Backend API, Payment Service | No (internal only) |
| `db-net` | PostgreSQL, Redis Cache | No (internal only) |

## See it
Create segmented networks and deploy an isolated multi-tier architecture:

```bash
# Create isolated network tiers
docker network create frontend-net
docker network create backend-net

# Database is attached ONLY to backend-net (completely unreachable from frontend)
docker run -d --name secure-postgres --network backend-net -e POSTGRES_PASSWORD=secret postgres:alpine

# API bridges both networks to serve requests
docker run -d --name api-gateway --network backend-net -p 8080:8080 my-api:1.0
docker network connect frontend-net api-gateway
```

Verify that a container on `frontend-net` cannot reach the database:

```bash
docker run --rm --network frontend-net alpine ping -c 1 -W 2 secure-postgres
```

The ping command fails, confirming complete network segmentation:

```text
ping: bad address 'secure-postgres'
```

## Go deeper
You can inspect Docker's underlying iptables rules on Linux using `sudo iptables -L DOCKER-USER -n -v`. The `DOCKER-USER` chain is the designated location where network administrators can insert custom firewall rules that Docker will not overwrite.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Segment containers into discrete user-defined networks based on operational tiers.
- Never publish database ports to the host interface unless required for external replication.
- Connect intermediate gateway services to multiple networks to act as secure application proxies.
