---
slug: user-defined-bridge
title: "User-Defined Bridge & DNS Resolution"
topic: networking
kind: technique
summary: "Create custom bridge networks to enable automatic service discovery and isolated container communication."
tags: [bridge, dns, service-discovery, networks]
related: [default-bridge-network, custom-networks-cli, container-dns-troubleshooting]
---
> **In one line:** User-defined bridge networks provide built-in DNS service discovery, letting containers reach each other by name.

## The idea
Modern containerized applications consist of multiple microservices: a web frontend, an API service, a Redis cache, and a PostgreSQL database.

To allow these services to communicate securely, you create **user-defined bridge networks**.

User-defined networks activate Docker's internal embedded DNS server (operating at `127.0.0.11`). When a container on a user-defined network makes a request to `http://api:8080`, Docker's DNS server automatically resolves the hostname `api` to that container's current private IP address. If the `api` container is replaced or restarted with a new IP, DNS updates instantly without requiring configuration changes.

Furthermore, user-defined networks provide network isolation: containers on network A cannot communicate with containers on network B unless explicitly connected.

```flow
client: External Client | Host port 8080 @primary
web: Web Container | 172.20.0.2 @blue
dns: Embedded DNS | 127.0.0.11 resolver @amber
db: Database Container | 172.20.0.3 @green
client -> web: Port forward
web -> dns: Resolves db container name
web -> db: Query port 5432
```

## See it
Create a user-defined bridge network and test automatic name resolution:

```bash
# Create a custom bridge network
docker network create my-app-net

# Launch database on the custom network
docker run -d --name db-service --network my-app-net -e POSTGRES_PASSWORD=secret postgres:alpine

# Launch client on the same network and ping the database by name
docker run --rm --network my-app-net alpine ping -c 2 db-service
```

The ping succeeds because Docker's DNS resolver translates the name to the container IP:

```text
PING db-service (172.20.0.2): 56 data bytes
64 bytes from 172.20.0.2: seq=0 ttl=64 time=0.082 ms
64 bytes from 172.20.0.2: seq=1 ttl=64 time=0.076 ms
```

## Go deeper
Containers can connect to multiple networks simultaneously using `docker network connect`. This allows building secure multi-tier network architectures—for example, an API container can connect to both a public `frontend-net` and a private `backend-net`, while the database connects only to `backend-net`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.


Always verify error handling and failure recovery mechanisms during staging deployments. Testing simulated network disconnects, resource exhaustion limits, and process crashes guarantees that systems degrade gracefully under adverse conditions.

## Remember
- User-defined bridge networks enable automatic container name resolution via Docker's embedded DNS.
- Containers communicate reliably using container names rather than fragile hardcoded IP addresses.
- Multi-network attachments allow enforcing strict network isolation between application tiers.
