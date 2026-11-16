---
slug: compose-services-and-build
title: "Defining Services & Builds in Compose"
topic: compose
kind: technique
summary: "Configure services, custom Dockerfile builds, context paths, and port mappings in compose.yaml."
tags: [services, build, image, ports]
related: [compose-specification, compose-up-and-down, compose-named-volumes]
---
> **In one line:** Define each container under the services key using image for pre-built registries or build for local Dockerfiles.

## The idea
The top-level **`services:`** block is the heart of every Compose file. Each entry under `services` defines a container workload and specifies how it should be built or pulled, configured, and networked.

A service definition must specify either an `image:` or a `build:`:
- **`image:`**: Instructs Compose to pull a pre-built image from a registry (e.g. `redis:alpine`).
- **`build:`**: Instructs Compose to build an image from a local `Dockerfile`. You can supply a simple path string (`build: .`) or an expanded object specifying build context, Dockerfile name, build arguments, and target stages.

Key service configuration keys:
- **`ports:`**: Maps host ports to container ports (equivalent to `-p`).
- **`environment:`**: Injects environment variables as a list or key-value map.
- **`volumes:`**: Mounts named volumes or host bind mounts.
- **`restart:`**: Configures container restart policies (such as `unless-stopped`).

| Compose Key | Equivalent CLI Flag | Purpose |
|---|---|---|
| `build: .` | `docker build .` | Compiles image from local Dockerfile |
| `image: redis:alpine` | `docker run redis:alpine` | Pulls image from registry |
| `ports: ["3000:3000"]` | `-p 3000:3000` | Forwards host port to container |
| `restart: always` | `--restart always` | Ensures self-healing restarts |

## See it
Configure an API service with custom build arguments and production port mappings:

```yaml
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
      target: runtime
    image: my-company/api:local
    ports:
      - "127.0.0.1:4000:4000"
    environment:
      LOG_LEVEL: info
      PORT: 4000
    restart: unless-stopped
```

Build and launch the service stack:

```bash
# Build images and start all services in detached mode
docker compose up -d --build
```

## Go deeper
Specifying both `build:` and `image:` in a service definition instructs Compose to build the local Dockerfile and tag the resulting image with the name specified in `image:`. This simplifies pushing locally built Compose images directly to remote registries.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Every service requires either an `image` declaration or a `build` directive.
- Use expanded `build:` objects to pass custom Dockerfile names, contexts, and `args`.
- Bind ports explicitly to `127.0.0.1` to prevent exposing backend microservices to public networks.
