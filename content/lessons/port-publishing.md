---
slug: port-publishing
title: "Port Publishing with -p"
topic: container-management
kind: technique
summary: "Bind containerized network ports to host interfaces using the -p host:container syntax."
tags: [ports, port-publishing, localhost, networking]
related: [port-publishing-vs-expose, default-bridge-network, compose-services-and-build]
---
> **In one line:** Publish ports using -p <host-port>:<container-port> to route external traffic into a container.

## The idea
By default, a container attached to a bridge network receives a private IP address accessible only from the Docker host. External clients and your local web browser cannot connect to that private container IP directly.

To expose a service, you must **publish** its port using the `-p` (`--publish`) flag during `docker run`.

Docker configures iptables rules (or network address translation on macOS/Windows) to forward incoming packets arriving on a host port into the container's isolated network namespace:

```text
Client Browser (localhost:8080)
       │
       ▼
Host Network Interface (0.0.0.0:8080)
       │ (Docker iptables NAT forwarding)
       ▼
Container Bridge Network (172.17.0.2:80)
       │
       ▼
Web Server (nginx daemon listening on port 80)
```

| Port Syntax | Meaning | Safety |
|---|---|---|
| `-p 8080:80` | Binds all host IPs on port 8080 to container port 80 | Publicly accessible |
| `-p 127.0.0.1:8080:80` | Binds only host loopback to container port 80 | Localhost only (safe) |
| `-p 80` | Binds a random available host port (e.g. 49153) to container port 80 | Prevents collisions |

## See it
Publish an NGINX container port to local port 8080 bound only to the loopback interface:

```bash
# Bind container port 80 to localhost:8080
docker run -d --name secure-web -p 127.0.0.1:8080:80 nginx:alpine

# Verify connectivity using curl
curl -I http://127.0.0.1:8080

# Inspect active port binding allocation
docker port secure-web
```

The server returns HTTP 200 OK and confirms the interface binding:

```text
HTTP/1.1 200 OK
Server: nginx/1.27.0
80/tcp -> 127.0.0.1:8080
```

## Go deeper
Binding to `-p 8080:80` binds to `0.0.0.0` (all interfaces) by default. On cloud servers, this exposes the port to the entire public internet, bypassing some standard firewall rules due to Docker's iptables manipulation. Always bind sensitive services explicitly to `127.0.0.1`.

## Watch out
- Two containers cannot publish to the same host port simultaneously; doing so causes a bind error: `address already in use`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Syntax is always `-p <host-port>:<container-port>`.
- Binding to `127.0.0.1:<port>` restricts network access to local requests only.
- Publishing creates kernel NAT rules forwarding host traffic into container network namespaces.
