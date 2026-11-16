---
slug: dropping-linux-capabilities
title: "Dropping Linux Capabilities"
topic: security
kind: technique
summary: "Apply the principle of least privilege by dropping all Linux capabilities with --cap-drop=ALL."
tags: [capabilities, cap-drop, least-privilege, rootless]
related: [non-root-user, read-only-rootfs, docker-daemon-security]
---
> **In one line:** Drop all Linux kernel capabilities with --cap-drop=ALL and re-add only the specific capabilities your process needs.

## The idea
Traditional Unix systems divide privileges into two categories: unprivileged users and superuser (root). Linux splits root's monolithic power into discrete privileges called **Linux Capabilities** (such as `CAP_CHOWN`, `CAP_NET_BIND_SERVICE`, `CAP_SYS_ADMIN`).

By default, Docker grants a container approximately 14 capabilities out of around 40 available. However, most standard web applications and microservices need **none** of them.

If a container retains unused capabilities, an attacker can exploit them during a security breach. For example:
- `CAP_NET_RAW`: Allows crafting raw packets for ARP poisoning or network sniffing.
- `CAP_DAC_OVERRIDE`: Allows bypassing filesystem read/write permission checks.

The industry-standard hardening pattern is **Capability Dropping**:
1. Drop every capability: `--cap-drop=ALL`.
2. Selectively add back only the specific capabilities strictly required for operation: `--cap-add=<CAP>`.

| Capability | Purpose | Typical Need |
|---|---|---|
| `CAP_NET_BIND_SERVICE` | Bind to ports below 1024 (e.g. 80, 443) | Web servers binding to standard HTTP ports |
| `CAP_NET_RAW` | Craft raw network packets (used by `ping`) | Network diagnostics only |
| `CAP_SYS_ADMIN` | Deep kernel administration tasks | Highly dangerous; avoid in production |

## See it
Launch an NGINX container with all capabilities dropped, restoring only the permission to bind port 80:

```bash
# Drop all capabilities and restore only low-port binding privilege
docker run -d --name secure-proxy \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  -p 80:80 \
  nginx:alpine
```

Verify that unauthorized administrative commands fail inside the hardened container:

```bash
# Attempt to change file ownership inside the container
docker exec secure-proxy chown 1000 /usr/share/nginx/html/index.html
# Output: chown: changing ownership of '/usr/share/nginx/html/index.html': Operation not permitted
```

## Go deeper
In Docker Compose, configure capabilities declaratively under the service definition:
```yaml
services:
  web:
    image: my-app:latest
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Linux capabilities divide root privileges into granular kernel permission flags.
- Default Docker containers retain unnecessary capabilities that expand attack vectors.
- Always apply `--cap-drop=ALL` and re-add only the minimum required capabilities.
