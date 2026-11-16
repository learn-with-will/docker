---
slug: arg-vs-env
title: "ARG vs ENV in Builds"
topic: dockerfiles
kind: technique
summary: "Distinguish build-time arguments (ARG) from container runtime environment variables (ENV)."
tags: [arg, env, build-args, environment]
related: [dockerfile-anatomy, environment-files, secrets-hygiene]
---
> **In one line:** ARG defines build-time parameters; ENV defines persistent runtime environment variables.

## The idea
Dockerfiles provide two distinct instructions for defining dynamic parameters: `ARG` and `ENV`. Using the wrong instruction causes configuration failures or security leaks.

- **`ARG` (Build Arguments):** Defines variables available **only while the image is being built**. Once `docker build` completes, `ARG` variables cease to exist. They are not visible to running containers. Pass values via `docker build --build-arg NAME=value`.
- **`ENV` (Environment Variables):** Defines variables that persist **both during the build and inside running containers**. They become part of the image metadata and are inherited by all containers launched from the image.

```text
Build Time:
  docker build --build-arg APP_VERSION=2.0
       │
       ▼
  Dockerfile: ARG APP_VERSION  ==> Available in RUN instructions
              ENV NODE_ENV=prod ==> Persists into final Image Manifest!

Runtime:
  docker run my-app
       │
       ▼
  Container Process: $NODE_ENV is present ("prod")
                     $APP_VERSION is GONE!
```

| Feature | `ARG` | `ENV` |
|---|---|---|
| Availability | Build phase only | Build phase AND container runtime |
| Persistence in image | Not stored in environment metadata | Persisted in container environment |
| Override mechanism | `--build-arg <k>=<v>` | `-e <k>=<v>` or `--env-file` |
| Suitable for | Package versions, feature flags | App settings, API ports, DB hosts |

## See it
Combine `ARG` and `ENV` to pass a dynamic version during build that initializes a runtime variable:

```docker
FROM alpine:3.20

# Build argument with default fallback value
ARG APP_VERSION=1.0.0

# Persist argument value into runtime environment
ENV VERSION=${APP_VERSION}
ENV APP_PORT=8080

CMD ["sh", "-c", "echo Running app version $VERSION on port $APP_PORT"]
```

Build the image overriding the build argument:

```bash
# Build passing custom version argument
docker build --build-arg APP_VERSION=2.4.0 -t myapp .
docker run --rm myapp
# Output: Running app version 2.4.0 on port 8080
```

## Go deeper
`ARG` instructions can be declared before the first `FROM` to dynamically choose base image tags: `ARG OS_VER=3.20` followed by `FROM alpine:${OS_VER}`. However, an `ARG` declared before `FROM` is out of scope for subsequent `RUN` steps unless re-declared after `FROM`.

## Watch out
- Never pass private API keys or database passwords via `ARG`; build arguments are permanently recorded in the image layer history visible via `docker history`.

## Remember
- `ARG` variables exist exclusively during the `docker build` process.
- `ENV` variables persist into the image metadata and runtime container process environment.
- Never use `ARG` to inject production secrets or private credentials.
