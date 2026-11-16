---
slug: compose-networking-dns
title: "Automatic Service Discovery in Compose"
topic: compose
kind: concept
summary: "Discover how Docker Compose provisions isolated networks and registers service names as DNS hostnames."
tags: [service-discovery, dns, networks, multi-container]
related: [compose-services-and-build, user-defined-bridge, compose-depends-on-health]
---
> **In one line:** Compose creates an application bridge network where each service name functions as a reachable DNS hostname.

## The idea
When you execute `docker compose up`, Compose automatically creates a dedicated user-defined bridge network for your application (named `<project>_default`).

Every container defined in the `services:` block is joined to this default network. Furthermore, Docker's embedded DNS server automatically registers the **service name** (e.g. `web`, `api`, `db`) as a network hostname.

This completely eliminates hardcoded IP addresses from application code:
- Your API backend connects to PostgreSQL using the hostname `db`: `postgres://user:pass@db:5432/dbname`.
- Your frontend proxies requests to `http://api:8080`.
- If the database container is restarted with a new private IP address, DNS updates transparently.

```flow
client: External Browser | Requests localhost:8080 @primary
web: Service web | Nginx reverse proxy @blue
dns: Embedded DNS | 127.0.0.11 resolver @amber
api: Service api | Backend application @green
client -> web: HTTP request
web -> dns: Resolves service hostnames
web -> api: Proxies upstream traffic
```

## See it
Define a custom multi-network architecture in `compose.yaml`:

```yaml
services:
  proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - public-net

  web:
    build: .
    networks:
      - public-net
      - internal-net

  db:
    image: postgres:alpine
    environment:
      POSTGRES_PASSWORD: secret
    networks:
      - internal-net

networks:
  public-net:
  internal-net:
```

Notice that `db` is attached exclusively to `internal-net`. The `proxy` service cannot resolve or reach the database directly.

## Go deeper
If you scale a service using `docker compose up -d --scale web=3`, Compose starts three replicas of the `web` container. Querying the DNS hostname `web` automatically returns all three container IPs, enabling basic round-robin DNS load balancing.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Compose automatically creates a private bridge network for all defined services.
- Service names act as built-in DNS hostnames for inter-container communication.
- Declare custom networks to isolate backend database tiers from public reverse proxies.
