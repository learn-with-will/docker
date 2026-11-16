---
slug: port-publishing-vs-expose
title: "EXPOSE vs Port Publishing -p"
topic: networking
kind: pitfall
summary: "Understand why EXPOSE in a Dockerfile does not open host ports without explicit -p publishing."
tags: [expose, ports, publish, documentation]
related: [port-publishing, default-bridge-network, dockerfile-instruction-reference]
---
> **In one line:** EXPOSE is documentation metadata for developers; port publishing with -p actually configures host network routing.

## The idea
One of the most persistent misconceptions among new Docker practitioners is believing that adding `EXPOSE 8080` to a Dockerfile makes that port reachable from their browser. It does not.

To understand why, examine the fundamental distinction:
- **`EXPOSE` (Metadata):** A documentation directive written inside a `Dockerfile`. It declares the author's intent: "This application is designed to listen on port 8080." It does **not** alter Linux iptables rules, does **not** open host ports, and does **not** allow host traffic to reach the container.
- **Port Publishing (`-p host:container`):** A runtime operational command passed to `docker run`. It instructs the Docker daemon to bind a physical port on the host and establish network address translation (NAT) forwarding into the container's private network namespace.

```text
Dockerfile: EXPOSE 3000
    │
    ▼
Docker Image Metadata: {"ExposedPorts": {"3000/tcp": {}}}
    │
    ├── (Without -p): Port 3000 reachable ONLY from other containers on same bridge!
    │                 Host browser localhost:3000 => CONNECTION REFUSED!
    │
    └── (With -p 8080:3000): Docker configures host NAT rules!
                             Host browser localhost:8080 => SUCCESS!
```

| Action | Configured In | Effect on Host | Reachable From |
|---|---|---|---|
| `EXPOSE 80` | Dockerfile | None (metadata only) | Other containers on same network |
| `-p 8080:80` | `docker run` CLI | Binds host port 8080 | Host browser and external networks |

## See it
Test the difference by running an NGINX container without publishing its exposed port:

```bash
# NGINX Dockerfile contains 'EXPOSE 80', but we launch without -p
docker run -d --name unmapped-web nginx:alpine
curl localhost:80
# Output: curl: (7) Failed to connect to localhost port 80: Connection refused
```

Now launch with explicit port publishing:

```bash
docker run -d --name mapped-web -p 8080:80 nginx:alpine
curl -I http://localhost:8080
```

## Go deeper
You can publish all exposed ports to random high-numbered host ports automatically by passing the uppercase `-P` (`--publish-all`) flag: `docker run -d -P nginx:alpine`. Docker reads the image's `EXPOSE` metadata and binds each port to an available ephemeral host port.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- `EXPOSE` is purely metadata documentation and does not publish ports to host interfaces.
- Use `-p <host-port>:<container-port>` at runtime to route host traffic into containers.
- Containers on the same user-defined network can reach exposed ports directly without `-p`.
