---
id: lesson-16
slug: buildkit-and-multi-platform
title: "BuildKit, Buildx & Multi-Platform Images"
level: intermediate
order: 16
duration: 26
tags:
  - buildkit
  - buildx
  - multi-platform
  - cache-mounts
  - build-secrets
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what BuildKit is and why it is the default builder.
- Use the `# syntax` directive to enable modern Dockerfile features.
- Speed up builds with **cache mounts**.
- Build images for **multiple CPU architectures** with `docker buildx`.
- Say why multi-platform images matter for teams and deployment.

# Why It Matters

Two realities make this lesson practical. First, builds are often the slowest step in a developer's
loop and in CI — BuildKit's caching and parallelism directly cut that time. Second, computers are no
longer all the same architecture: Apple Silicon laptops are **arm64**, while many servers are
**amd64** (x86-64). An image built only for your laptop may not run on the server. `buildx` builds
one image that works on both.

# Concept Explanation

### BuildKit is the modern builder

**BuildKit** is Docker's build engine, and it is the **default** in modern Docker. Compared to the
old builder it:

- Builds independent stages **in parallel**.
- Has a smarter, more granular **cache**.
- Supports features like **cache mounts** and **build secrets**.
- Only runs the stages actually needed for your target.

You usually get it automatically. To unlock the newest Dockerfile syntax, add a **syntax directive**
as the very first line:

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.13-slim
...
```

This tells BuildKit to use the current stable Dockerfile frontend, which enables `RUN --mount` and
other modern features regardless of your Docker version.

### Cache mounts

Package managers keep a download cache (pip's cache, apt archives, npm's cache). Normally that cache
is discarded between builds. A **cache mount** persists it across builds without baking it into the
image:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
```

Now npm reuses its download cache on every build — much faster — and the cache never becomes an image
layer.

### Build secrets (recap)

As covered in the security lesson, BuildKit also enables **build secrets** — values available only
during a `RUN`, never stored in a layer:

```dockerfile
RUN --mount=type=secret,id=token ./configure-with "$(cat /run/secrets/token)"
```

### buildx and build drivers

**`docker buildx`** is the extended build command built on BuildKit. It manages **builders**
(build environments) and, crucially, can produce **multi-platform** images. Create a builder capable
of multi-arch builds once:

```bash
docker buildx create --name multi --use
```

### Multi-platform images

A multi-platform image is really a **manifest list** — a single tag that points to per-architecture
images. When you pull it, Docker automatically selects the one matching your machine.

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/acme/api:1.4.0 \
  --push .
```

This builds for both amd64 and arm64 and pushes a single tag that works on Intel/AMD servers **and**
Apple Silicon/ARM machines. Note `--push`: multi-platform results generally cannot be loaded into your
local single-arch image store, so you push them to a registry directly.

# Key Terminology

- **BuildKit** — the modern, default build engine (parallel stages, better cache).
- **Syntax directive** — `# syntax=docker/dockerfile:1`, enabling current Dockerfile features.
- **Cache mount** — `RUN --mount=type=cache,...` to persist a build cache across builds.
- **buildx** — the extended build command that manages builders and multi-platform builds.
- **Multi-platform image** — a manifest list mapping one tag to per-architecture images.

# Syntax and Options

| Feature | How |
| --- | --- |
| Enable modern syntax | `# syntax=docker/dockerfile:1` (first line) |
| Persist a package cache | `RUN --mount=type=cache,target=<dir> <cmd>` |
| Build-time secret | `RUN --mount=type=secret,id=<id> ...` + `--secret` |
| Create a multi-arch builder | `docker buildx create --name multi --use` |
| Build multi-platform | `docker buildx build --platform linux/amd64,linux/arm64 ... --push` |
| Inspect a manifest list | `docker buildx imagetools inspect <ref>` |

# Hands-On Walkthrough

```bash
# 1. Confirm BuildKit is active (modern Docker uses it by default).
docker build -t demo .        # output shows the BuildKit-style "=> [stage]" lines

# 2. Set up a builder that can do multi-platform.
docker buildx create --name multi --use
docker buildx inspect --bootstrap
```

Add a cache mount to your Dockerfile's install step:

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

```bash
# 3. Build for two architectures and push a single tag.
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/acme/demo:1.0 --push .

# 4. Verify the manifest list has both platforms.
docker buildx imagetools inspect ghcr.io/acme/demo:1.0
```

```text
Manifest:  ... platform: linux/amd64
           ... platform: linux/arm64
```

One tag, two architectures — pulls correctly on both a server and an Apple Silicon laptop.

# Real World Analogy

A cache mount is like a **reusable pantry**: instead of buying flour every time you bake, you keep a
bin that survives between sessions, so prep is faster — but the pantry is not part of the finished
cake. A **multi-platform image** is like publishing a book in **multiple languages under one title**:
readers ask for the title and automatically receive the edition they can read (their architecture).

# Examples

## Example 1 — Basic: enable modern features

```dockerfile
# syntax=docker/dockerfile:1
FROM alpine:3.20
RUN --mount=type=cache,target=/var/cache/apk apk add --no-cache curl
```

**Why this works:** The syntax directive enables `RUN --mount`, and the cache mount keeps Alpine's
package cache across builds, so repeated builds fetch less.

## Example 2 — Real-world: publish a multi-arch image from CI

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/acme/api:1.4.0 -t ghcr.io/acme/api:latest \
  --push .
```

**Why this works:** CI produces one set of tags that run on both x86 servers and ARM machines, so
you never ship an image that "works on my laptop but not the server" (or vice versa).

## Example 3 — Best practice / edge case: inspect what you built

```bash
docker buildx imagetools inspect ghcr.io/acme/api:1.4.0
```

**Why this works:** It confirms the tag is a manifest list containing each expected platform — a quick
sanity check before you rely on the image across architectures.

# Common Mistakes

- **Expecting a multi-platform `buildx build` to load locally.** It generally cannot; use `--push`
  (or `--load` for a single platform).
- **Forgetting the `# syntax` directive**, then finding `RUN --mount` is not recognized on older
  setups.
- **Assuming an image built on Apple Silicon runs on x86 servers.** A single-arch arm64 image will
  not run on amd64 without emulation. Build multi-arch.
- **Baking a package cache into the image** by copying it, instead of using a `--mount=type=cache`
  that stays out of the layers.
- **Only building `latest`** for one platform in CI and deploying it elsewhere.

# Best Practices

- Rely on **BuildKit** (the default) and add the **`# syntax=docker/dockerfile:1`** directive.
- Use **cache mounts** for package-manager caches to speed up rebuilds.
- Keep secrets out of images with **build secrets**, never `ARG`/`ENV`.
- Build **multi-platform** images (`linux/amd64,linux/arm64`) when your build and deploy machines
  differ, and `--push` them.
- Verify the result with **`buildx imagetools inspect`**.

# Summary

- **BuildKit** is the default builder: parallel stages, smarter cache, and features like `--mount`.
- The **`# syntax=docker/dockerfile:1`** directive unlocks modern Dockerfile capabilities.
- **Cache mounts** persist package caches across builds without bloating the image; **build secrets**
  keep secrets out of layers.
- **`docker buildx`** builds **multi-platform** images (a manifest list) so one tag runs on amd64 and
  arm64; use **`--push`**.
- Confirm platforms with **`buildx imagetools inspect`**.

# Flash Cards

Q: What is BuildKit and is it the default?
A: BuildKit is Docker's modern build engine — parallel stages, smarter caching, and features like cache mounts and build secrets — and it is the default builder in modern Docker.

Q: What does the first-line directive # syntax=docker/dockerfile:1 do?
A: It tells BuildKit to use the current stable Dockerfile frontend, enabling modern features like RUN --mount regardless of your Docker version.

Q: What is a cache mount and why use it?
A: RUN --mount=type=cache persists a package manager's download cache across builds without baking it into the image, making repeated builds faster.

Q: Why build multi-platform images?
A: Because build and deploy machines can differ in architecture (for example arm64 laptops vs amd64 servers); a multi-platform image runs correctly on each without emulation.

Q: What is a multi-platform image, technically?
A: A manifest list — a single tag that points to separate per-architecture images; Docker automatically pulls the one matching the machine.

Q: Why do multi-platform buildx builds usually need --push instead of loading locally?
A: The local image store holds a single architecture, so a multi-platform result cannot be loaded into it; you push the manifest list to a registry instead.

# Exercises

### Easy
Add `# syntax=docker/dockerfile:1` and a `RUN --mount=type=cache` step to an existing Dockerfile.
Build it twice and note that the second build reuses the package cache.

### Medium
Create a buildx builder, then build an image for `linux/amd64,linux/arm64` and push it to a registry.
Use `docker buildx imagetools inspect` to confirm both platforms are present.

### Challenging
Explain, with a concrete example, what goes wrong when an image built only for `linux/arm64` on an
Apple Silicon laptop is deployed to an `amd64` server — and how a multi-platform build fixes it.

# Further Reading

- BuildKit — <https://docs.docker.com/build/buildkit/>
- Dockerfile frontend syntax — <https://docs.docker.com/build/buildkit/frontend/>
- Cache mounts — <https://docs.docker.com/build/cache/optimize/#use-cache-mounts>
- Multi-platform builds — <https://docs.docker.com/build/building/multi-platform/>
