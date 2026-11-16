---
slug: dockerfile-instruction-reference
title: "Dockerfile Instructions Reference"
topic: dockerfiles
kind: api
summary: "A reference for secondary Dockerfile instructions: EXPOSE, VOLUME, LABEL, and USER."
tags: [expose, volume, label, user]
related: [dockerfile-anatomy, port-publishing-vs-expose, non-root-user]
---
> **In one line:** Secondary Dockerfile instructions like EXPOSE, VOLUME, LABEL, and USER configure operational metadata and security boundaries.

## The idea
Beyond the primary build instructions (`FROM`, `COPY`, `RUN`, `CMD`), Dockerfiles support specialized instructions to define runtime contracts, metadata, and security settings:

- **`EXPOSE <port>`**: Documents which network ports the service listens on. Crucially, **EXPOSE does not publish ports** to the host. It serves as operational documentation for developers and container orchestrators.
- **`VOLUME ["/path"]`**: Declares a mount point and instructs Docker to mount an anonymous volume if the caller does not specify one. Files created in this directory bypass the storage driver.
- **`USER <user>[:<group>]`**: Switches the active user identity for subsequent `RUN`, `CMD`, and `ENTRYPOINT` instructions, ensuring the process runs without root privileges.
- **`LABEL <key>=<value>`**: Adds key-value metadata to the image, widely used for OCI annotations, git commit tracking, and maintainer records.

| Instruction | Purpose | Runtime Effect |
|---|---|---|
| `EXPOSE` | Documentation of network ports | None; requires `-p` to bind to host |
| `VOLUME` | Declares stateful directory mount | Creates anonymous volume if omitted |
| `USER` | Switches UID for process execution | Drops root privileges |
| `LABEL` | Bakes metadata annotations into image | Readable via docker inspect |

## See it
Here is a comprehensive Dockerfile demonstrating each secondary instruction:

```docker
FROM node:22-alpine

# Attach OCI-compliant metadata annotations
LABEL org.opencontainers.image.title="Billing Service" \
      org.opencontainers.image.version="1.2.0"

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/

# Document intended listening port
EXPOSE 3000

# Declare persistent data storage location
VOLUME ["/app/data"]

# Drop root privileges before declaring entrypoint
USER node

CMD ["node", "src/index.js"]
```

Inspect the applied labels on the built image:

```bash
docker inspect billing-service --format '{{json .Config.Labels}}'
```

## Go deeper
Avoid placing `VOLUME` declarations before `RUN` steps that modify that same directory. Once a directory is declared as a `VOLUME` in a Dockerfile, subsequent `RUN` steps can modify files during the build, but those changes will be discarded on the subsequent layer.

## Watch out
- Do not assume `EXPOSE 80` makes your container accessible to your browser; you must still pass `-p 80:80` when launching the container.

## Remember
- `EXPOSE` is documentation only and does not publish ports to the host.
- `VOLUME` declares directories intended for external persistent storage.
- Always use `USER` to drop root privileges before launching production applications.
