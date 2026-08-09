---
id: lesson-10
slug: multi-stage-builds
title: "Multi-Stage Builds & Small Images"
level: intermediate
order: 10
duration: 26
tags:
  - multi-stage
  - image-size
  - distroless
  - copy-from
  - optimization
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a multi-stage build is and the problem it solves.
- Write a Dockerfile with a **build stage** and a lean **runtime stage**.
- Copy only the finished artifact between stages with `COPY --from`.
- Compare base image choices: full, `slim`, `alpine`, and distroless.
- Understand why small images matter for speed and security.

# Why It Matters

Building software often needs heavy tools — compilers, dev dependencies, build caches — that the
*running* app does not need at all. If those end up in your final image, it is bloated (slow to
push, pull, and start) and has a larger **attack surface** (more software = more potential
vulnerabilities). **Multi-stage builds** let you build with all the tools, then ship only the result.

# Concept Explanation

### The problem: build tools leak into the image

A single-stage build that compiles or bundles an app keeps everything around: the SDK, dev
dependencies, source, and intermediate files. A Go binary might be 10 MB, but a naive image can be
hundreds of MB because it still contains the entire Go toolchain.

### The solution: multiple stages, one artifact

A **multi-stage build** uses more than one `FROM` in a single Dockerfile. Each `FROM` starts a new
**stage**. You do the heavy work in an early stage, then start a fresh, minimal final stage and copy
**only the finished artifact** into it with `COPY --from`:

```dockerfile
# ---- Stage 1: build ----
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build          # produces /app/dist

# ---- Stage 2: runtime ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

The final image is just `nginx` plus your built files — none of Node, npm, or the source. Only the
**last** stage becomes the image you ship; earlier stages are discarded.

- `AS build` **names** a stage so you can refer to it.
- `COPY --from=build <src> <dest>` copies from that earlier stage instead of the build context.

### Choosing a base image

The base you finish on hugely affects size and security:

| Base | Size | Notes |
| --- | --- | --- |
| Full (e.g. `node:22`) | Largest | Includes a full OS + build tools; handy for the build stage |
| `slim` (e.g. `python:3.13-slim`) | Smaller | Trimmed OS; good general runtime base |
| `alpine` (e.g. `node:22-alpine`) | Small | Tiny Alpine Linux; watch for musl-libc quirks |
| Distroless | Smallest | Only your app + runtime, no shell or package manager |

**Distroless** images (from Google's distroless project) contain no shell, no package manager, and
almost no OS — just enough to run your app. That is excellent for security (little to exploit), but
it means you cannot `docker exec ... sh` into them, so debugging is different.

### Why small images matter

- **Faster** to push, pull, and start — important in CI/CD and autoscaling.
- **Smaller attack surface** — fewer packages means fewer known vulnerabilities.
- **Cheaper** storage and bandwidth across many builds and nodes.

# Key Terminology

- **Multi-stage build** — a Dockerfile with multiple `FROM` stages; only the last becomes the image.
- **Stage** — the section of a Dockerfile started by a `FROM`, optionally named with `AS`.
- **`COPY --from=<stage>`** — copy files from an earlier stage into the current one.
- **Distroless** — a minimal base image with no shell or package manager.
- **Attack surface** — the amount of software that could contain exploitable vulnerabilities.

# Syntax and Options

| Syntax | What it does |
| --- | --- |
| `FROM image AS name` | Start and name a build stage |
| `COPY --from=name src dest` | Copy an artifact from an earlier stage |
| `COPY --from=nginx:1.27 ...` | Copy directly from another image (not just a stage) |
| `docker build --target name .` | Build only up to a named stage (e.g. for tests) |

# Hands-On Walkthrough

Compare a naive image with a multi-stage one for a simple built site.

```bash
# Assume the multi-stage Dockerfile above (Node build -> nginx runtime).
docker build -t site:multi .
docker images site
```

```text
REPOSITORY   TAG     SIZE
site         multi   ~50MB    ← nginx-alpine + your built files only
```

If you had built everything in a single `node:22` stage, the same app might be **300–400 MB** because
the whole Node toolchain and source would still be inside. The multi-stage version ships a fraction
of that.

```bash
# You can also build just the build stage (e.g. to run tests in CI):
docker build --target build -t site:builder .
```

# Real World Analogy

A multi-stage build is like **cooking in a full kitchen but serving on a clean plate**. You use every
pot, knife, and appliance to prepare the meal (the build stage), but you do not hand the diner the
dirty pots — you plate just the finished dish (the runtime stage). The customer gets the meal, not
the mess.

# Examples

## Example 1 — Basic: compile then ship a Go binary

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY . .
RUN go build -o /app/server .

FROM gcr.io/distroless/static-debian12
COPY --from=build /app/server /server
ENTRYPOINT ["/server"]
```

**Why this works:** The Go toolchain lives only in the `build` stage. The final image is a distroless
base plus a single static binary — tiny and with almost nothing to attack.

## Example 2 — Real-world: a front-end app served by nginx

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

**Why this works:** Node builds the static assets; the runtime image is just nginx serving them. None
of Node, npm, or the source ships to production.

## Example 3 — Best practice / edge case: pull a file from another image

```dockerfile
FROM alpine:3.20
COPY --from=curlimages/curl:8.9.1 /usr/bin/curl /usr/bin/curl
```

**Why this works:** `COPY --from` can reference **any image**, not just your own stages — a handy way
to grab a single tool without installing a whole package manager chain.

# Common Mistakes

- **Doing everything in one stage**, shipping compilers and dev dependencies to production.
- **Copying too much between stages** (e.g. the whole `/app` instead of just `/app/dist`), undoing the
  size savings.
- **Forgetting distroless has no shell**, then being surprised `docker exec ... sh` fails — plan a
  different debugging approach (or a debug variant).
- **Assuming alpine is always safe**: it uses musl-libc, which occasionally causes subtle differences
  from glibc-based images.
- **Naming stages inconsistently**, so `COPY --from=<name>` cannot find the stage.

# Best Practices

- Split **build** and **runtime** into separate stages; ship only the artifact.
- Finish on the **smallest base** that still runs your app (`slim`, `alpine`, or distroless).
- Copy the **minimum** needed with `COPY --from` — just the built output.
- Use `--target` to build intermediate stages for **testing** in CI.
- Combine multi-stage with cache-friendly ordering (manifest-first) from the previous lesson.

# Summary

- A **multi-stage build** uses multiple `FROM` stages; only the **last** becomes the shipped image.
- Do heavy work in a **build stage**, then `COPY --from` only the **finished artifact** into a lean
  runtime stage.
- Base image choice drives size/security: full → `slim` → `alpine` → **distroless** (smallest, no
  shell).
- Small images are **faster** to move and start and have a **smaller attack surface**.
- `COPY --from` can pull from a named stage *or* any other image; `--target` builds a specific stage.

# Flash Cards

Q: What is a multi-stage build?
A: A Dockerfile with multiple FROM stages where you build in an early stage and copy only the finished artifact into a lean final stage; only the last stage becomes the shipped image.

Q: What does COPY --from=build do?
A: It copies files from an earlier build stage (named "build") into the current stage, instead of copying from the build context.

Q: Why do small images improve security, not just speed?
A: Fewer packages mean a smaller attack surface — less software that could contain exploitable vulnerabilities — in addition to faster push, pull, and startup.

Q: What is special about a distroless base image?
A: It contains only your app and its runtime, with no shell and no package manager, which is very secure but means you cannot exec a shell into it for debugging.

Q: Which stages of a multi-stage build end up in the final image?
A: Only the last stage. Earlier stages are used during the build and then discarded.

Q: How can you build only up to a specific stage, for example to run tests in CI?
A: Use docker build --target <stage-name>, which stops the build at that named stage.

# Exercises

### Easy
Rewrite a single-stage Dockerfile that builds a static site into a two-stage build: a Node build
stage and an `nginx:alpine` runtime stage. Compare the two image sizes with `docker images`.

### Medium
Build only the build stage of a multi-stage Dockerfile with `--target` and run its tests, then build
the full image. Explain when building just a stage is useful in a pipeline.

### Challenging
Convert an app to finish on a distroless base image. Note what changes about debugging (no shell),
and describe one strategy you could use to inspect or troubleshoot the running container anyway.

# Further Reading

- Multi-stage builds — <https://docs.docker.com/build/building/multi-stage/>
- Image size best practices — <https://docs.docker.com/build/building/best-practices/#keep-your-image-small>
- Base images — <https://docs.docker.com/build/building/base-images/>
- Distroless images — <https://github.com/GoogleContainerTools/distroless>
