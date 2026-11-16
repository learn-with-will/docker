---
slug: multi-stage-builds
title: "Multi-Stage Builds Pattern"
topic: advanced-builds
kind: pattern
summary: "Separate build environments from production runtimes using multi-stage builds to create tiny, secure images."
tags: [multi-stage, build-optimization, artifacts, image-size]
related: [copy-from-stages, minimal-base-images, layer-caching-order]
---
> **In one line:** Multi-stage builds use multiple FROM lines to build artifacts in heavy toolchains and copy only the binaries into lean runtime images.

## The idea
Building modern software requires heavy toolchains: compilers (Go, Rust, GCC), build systems (Gradle, Maven), package managers, test runners, and developer headers. However, running software in production requires only the compiled binary or runtime engine.

Before multi-stage builds, teams either:
1. Shipped massive 1 GB images containing compilers, linters, and test fixtures into production (a major security risk).
2. Maintained complicated build scripts on CI runners to compile code on the host, which broke local developer reproducibility.

**Multi-stage builds** solve this elegantly inside a single `Dockerfile` using multiple `FROM` statements. You designate temporary build stages (e.g. `FROM golang:1.23 AS builder`), compile your application, and then initialize a pristine, minimal runtime stage (e.g. `FROM alpine:3.20`). You copy only the compiled binary into the final stage using `COPY --from=builder`.

Everything else—source code, compilers, build caches, and build tools—is discarded when the build completes.

```flow
build-stage: Build Stage | golang:1.23 800MB @blue
compile: Compile binary | CGO_ENABLED=0 @amber
final-stage: Final Stage | alpine:3.20 15MB @green
binary: App Binary | /app/server @green
build-stage -> compile
compile -> binary
final-stage -> binary
```

| Stage | Base Image | Contents | Image Discarded? |
|---|---|---|---|
| Stage 1 (`builder`) | `golang:1.23-alpine` (300 MB) | Go compiler, git, dependencies, source | Yes (build cache only) |
| Stage 2 (`runtime`) | `alpine:3.20` (7 MB) | Minimal OS + compiled binary only | Kept as final production image |

## See it
Here is a multi-stage Dockerfile for a Go microservice that shrinks image size from 800 MB to 15 MB:

```docker
# -------------------------------------------------------------
# Stage 1: Build & Compile
# -------------------------------------------------------------
FROM golang:1.23-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# -------------------------------------------------------------
# Stage 2: Final Lean Runtime
# -------------------------------------------------------------
FROM alpine:3.20

WORKDIR /app
# Copy ONLY the compiled binary from the builder stage
COPY --from=builder /build/server /app/server

EXPOSE 8080
USER nobody
CMD ["/app/server"]
```

Build the image and inspect its final footprint:

```bash
docker build -t mini-server .
docker image ls mini-server --format "Size: {{.Size}}"
```

The command confirms the radically reduced final image size:

```text
Size: 14.8MB
```

## Go deeper
You can target specific intermediate stages during development and CI testing using the `--target` flag: `docker build --target builder -t my-app:test .`. This allows running test suites inside the builder stage without building the production image.

## Remember
- Multi-stage builds use multiple `FROM` statements to separate build toolchains from runtime environments.
- Use `COPY --from=<stage>` to selectively pull compiled artifacts into the final production image.
- Radically shrinks image size, accelerates deployment times, and reduces production attack surface.
