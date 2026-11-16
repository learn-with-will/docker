---
slug: container-dns-troubleshooting
title: "Troubleshooting Container DNS"
topic: networking
kind: pitfall
summary: "Diagnose and resolve container DNS resolution failures, resolver timeouts, and resolv.conf misconfigurations."
tags: [dns, troubleshooting, ping, curl]
related: [user-defined-bridge, custom-networks-cli, compose-networking-dns]
---
> **In one line:** Troubleshoot container DNS by inspecting /etc/resolv.conf, querying 127.0.0.11, and checking network attachments.

## The idea
When a microservice fails with `getaddrinfo ENOTFOUND api` or `Could not resolve host`, the issue almost always stems from network misconfiguration rather than application code errors.

Docker implements a dual DNS resolution strategy:
1. **Internal resolution (Embedded DNS at `127.0.0.11`):** Resolves container names and network aliases belonging to the same user-defined network.
2. **External resolution:** If a requested hostname is not a container name (e.g. `api.stripe.com`), Docker forwards the query to the host's configured upstream DNS servers (like `8.8.8.8` or corporate DNS).

Common failure modes:
- **Default bridge pitfall:** The containers run on the default bridge network where Docker's embedded DNS server is disabled.
- **Separate networks:** The calling container and target container are on different user-defined networks with no shared connection.
- **Corporate VPN / DNS hijacking:** Host VPN software changes DNS settings without notifying the Docker daemon.

| Diagnostic Step | Tool | Command |
|---|---|---|
| Check DNS config | `cat` | `docker exec <c> cat /etc/resolv.conf` |
| Test DNS query | `nslookup` / `dig` | `docker exec <c> nslookup <target-name>` |
| Verify network membership | `inspect` | `docker inspect <c> --format '{{json .NetworkSettings.Networks}}'` |

## See it
Diagnose a name resolution failure between two containers:

```bash
# Create custom network and launch backend
docker network create test-net
docker run -d --name backend-svc --network test-net redis:alpine

# Launch client with missing network and attempt lookup
docker run --rm alpine nslookup backend-svc
```

The lookup fails because the client is not on `test-net`:

```text
** server can't find backend-svc: NXDOMAIN
```

Attach the client to the correct network and test again:

```bash
docker run --rm --network test-net alpine nslookup backend-svc
# Server:    127.0.0.11
# Address:   172.20.0.3
```

## Go deeper
You can override upstream DNS servers on a per-container basis by passing the `--dns` flag (e.g. `docker run --dns 1.1.1.1 alpine`), or configure organization-wide default DNS servers in `/etc/docker/daemon.json`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Docker's embedded DNS server listens at the special link-local IP `127.0.0.11`.
- Automatic name resolution works only when containers share a user-defined network.
- Use `nslookup` and `cat /etc/resolv.conf` inside the container to diagnose lookup failures.
