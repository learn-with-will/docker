---
slug: non-root-user
title: "Running Containers as Non-Root"
topic: security
kind: technique
summary: "Drop default root privileges by creating and activating dedicated unprivileged users with the USER instruction."
tags: [user, non-root, security, permissions]
related: [dropping-linux-capabilities, volume-permissions, minimal-base-images]
---
> **In one line:** Always declare an explicit non-root USER in your Dockerfile to prevent container breakouts from gaining host root access.

## The idea
By default, Docker containers run processes as the **root user (UID 0)**.

Because containers share the host Linux kernel, root inside a container has the exact same numerical UID 0 as root on the physical host machine. If an attacker exploits an unpatched application vulnerability (like remote code execution) and escapes the container via a kernel flaw, **they arrive on your host server as root**.

Industry security standards (CIS Docker Benchmarks, NIST, and Kubernetes Pod Security Standards) strictly mandate running container processes as an **unprivileged non-root user**:
1. Create a dedicated system group and user in your Dockerfile.
2. Set appropriate filesystem permissions on application directories using `chown`.
3. Activate the user via the `USER` instruction before declaring `CMD`.

| Execution User | Numerical UID | Host Impact on Container Escape |
|---|---|---|
| Default root | UID 0 | Full host root compromise |
| Dedicated user | UID 10001 | Restricted unprivileged host user |

## See it
Harden a Node.js Dockerfile by switching from root to the unprivileged `node` user:

```docker
// Before (Runs as root UID 0 by default)
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
CMD ["node", "src/index.js"]

// After (Runs as unprivileged node user UID 1000)
FROM node:22-alpine
WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files and grant ownership to non-root user
COPY --chown=node:node src/ ./src/

# Drop root privileges
USER node

EXPOSE 3000
CMD ["node", "src/index.js"]
```

Verify the process UID inside the running container:

```bash
docker run --rm hardened-node whoami && id -u
# Output:
# node
# 1000
```

## Go deeper
For languages where base images do not provide a built-in user, create one explicitly:
```docker
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```
Always assign numerical UIDs above 1000 to prevent collisions with system daemons.

## Watch out
- Ensure your process binds to an unprivileged network port (e.g. 8080 or 3000); non-root users on Linux cannot bind to privileged ports below 1024 without extra kernel capabilities.

## Remember
- Containers execute as root (UID 0) by default, creating severe security breakout risks.
- Always add an explicit `USER <name>` instruction before declaring runtime entrypoints.
- Use `COPY --chown=<user>:<group>` to ensure the non-root user can read and execute files.
