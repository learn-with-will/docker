---
id: lesson-03
slug: images-and-docker-hub
title: "Images, Tags & Docker Hub"
level: beginner
order: 3
duration: 22
tags:
  - images
  - layers
  - tags
  - digests
  - registry
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain how an image is built from **layers** and why layers are shared and cached.
- Read an image reference: `registry/namespace/repository:tag`.
- Describe the difference between a **tag** and a **digest**, and why `latest` is risky.
- Pull, list, and remove images with `docker pull`, `docker images`, and `docker rmi`.
- Tell an **official image** from an unofficial one on Docker Hub.

# Why It Matters

Images are the unit you share, version, and deploy. If you understand how they are layered and how
they are named, you will build faster (thanks to caching), pull less data, and — most importantly —
know *exactly* which version of software is running. Vague image references are a common source of
"it changed and nobody knows why" incidents.

# Concept Explanation

### Images are made of layers

An image is a stack of **read-only layers**. Each layer is a set of filesystem changes. When you
build an image, each build step adds a layer on top of the previous one:

```text
┌─────────────────────────────┐  ← your app code
├─────────────────────────────┤  ← installed dependencies
├─────────────────────────────┤  ← OS packages
└─────────────────────────────┘  ← base image (e.g. debian)
```

Two things make layers powerful:

1. **Sharing.** If ten images are built on the same `debian` base, that base layer is stored **once**
   and reused. Pulling the tenth image only downloads the layers it does not already have.
2. **Caching.** During a build, unchanged layers are reused instead of rebuilt (you will use this
   heavily in the Dockerfile lessons).

### How images are named

A full image reference has up to four parts:

```text
registry-host / namespace / repository : tag
   docker.io  /  library   /   nginx    : 1.27
```

- **Registry host** — where the image lives. Defaults to Docker Hub (`docker.io`) if omitted.
- **Namespace** — the user or organization. Docker's **official images** live in the special
  `library` namespace, which is why you can write just `nginx`.
- **Repository** — the image name.
- **Tag** — a human-friendly label for a specific version (defaults to `latest` if omitted).

So `nginx`, `library/nginx`, and `docker.io/library/nginx:latest` all mean the same thing.

### Tags vs digests

- A **tag** (like `1.27` or `latest`) is a **movable label**. The maintainer can re-point a tag to a
  new image at any time. `nginx:latest` today and `nginx:latest` next month may be different images.
- A **digest** (like `sha256:abc123…`) is a **content hash**. It always refers to the exact same
  image bytes — it is **immutable**.

That is why `latest` is risky in anything you care about: it is not a version, it is "whatever the
maintainer most recently tagged." For reproducible builds and deployments, pin a specific tag
(`nginx:1.27`) or, for absolute certainty, a digest (`nginx@sha256:…`).

### Docker Hub, official images, and trust

**Docker Hub** is the default public registry. On it you will see badges:

- **Docker Official Image** — curated images maintained with Docker's involvement (e.g. `nginx`,
  `postgres`, `python`). These live in the `library` namespace.
- **Verified Publisher** — images from a vetted company.

Anyone can publish to Docker Hub, so prefer official or verified images for your base, and always
check the tag you are pulling.

# Key Terminology

- **Layer** — a read-only set of filesystem changes; images are stacks of layers.
- **Image reference** — `registry/namespace/repository:tag`.
- **Tag** — a movable label for a version (defaults to `latest`).
- **Digest** — an immutable `sha256:…` content hash of an exact image.
- **Docker Hub** — the default public registry (`docker.io`).
- **Official image** — a curated image in the `library` namespace.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker pull <image>:<tag>` | Download an image (and its missing layers) |
| `docker images` | List images stored locally |
| `docker rmi <image>` | Remove a local image |
| `docker image inspect <image>` | Show details, including the digest |
| `docker pull nginx@sha256:...` | Pull an exact image by digest |

# Hands-On Walkthrough

```bash
# 1. Pull two versions and watch layer reuse.
docker pull nginx:1.27
docker pull nginx:1.26

# 2. List what you have.
docker images
```

```text
REPOSITORY   TAG     IMAGE ID       CREATED       SIZE
nginx        1.27    a1b2c3d4e5f6   2 weeks ago   192MB
nginx        1.26    f6e5d4c3b2a1   6 weeks ago   188MB
```

When you pulled `1.26` after `1.27`, Docker printed "Already exists" for the layers the two share —
it only downloaded what was different.

```bash
# 3. Find the immutable digest of an image.
docker image inspect nginx:1.27 --format '{{index .RepoDigests 0}}'
```

```text
nginx@sha256:9a1b2c...   ← pin THIS for a byte-for-byte reproducible pull
```

# Real World Analogy

Think of a **published book**. A **tag** like `latest` is "the current edition" — it changes when a
new edition comes out. A **digest** is the exact ISBN of one specific printing — it never changes.
If you cite "the latest edition," a reader next year gets a different book; if you cite the ISBN,
everyone gets exactly the same pages. Pin the ISBN when it matters.

# Examples

## Example 1 — Basic: the default tag is `latest`

```bash
docker pull redis
```

**Why this works:** With no tag, Docker assumes `:latest`, so this pulls `redis:latest`. It is
convenient for a quick test but tells you nothing about *which* Redis version you got.

## Example 2 — Real-world: pin a real version

```bash
docker pull postgres:16.4
```

**Why this works:** Pinning `16.4` means your database is the same version on every machine and in
CI. If a teammate reports a bug, you both know exactly which version you are running.

## Example 3 — Best practice / edge case: pin a digest for reproducibility

```bash
docker pull nginx:1.27@sha256:9a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00
```

**Why this works:** Even if the `1.27` tag is later re-pointed, the digest guarantees you get the
*identical* image bytes forever. This is the strongest form of pinning, used in security-sensitive
and compliance settings.

# Common Mistakes

- **Relying on `latest` in production.** It is not a version; it silently changes. Pin a real tag or
  a digest.
- **Assuming a tag never changes.** Tags are movable labels; only digests are immutable.
- **Pulling unofficial images without checking.** Anyone can publish to Docker Hub — prefer official
  or verified images for your base.
- **Confusing image size with download size.** Thanks to shared layers, pulling a new image often
  downloads far less than its total size.

# Best Practices

- **Pin versions.** Use an explicit tag (`node:22`) at minimum; pin a **digest** where
  reproducibility or security matters.
- **Prefer official / verified base images** and keep them updated.
- **Remove images you no longer need** (`docker rmi`, or `docker image prune`) to reclaim disk.
- **Read the reference in full** when debugging — know which registry, namespace, and tag you are
  actually using.

# Summary

- Images are stacks of **read-only layers** that are **shared** across images and **cached** during
  builds.
- An image reference is `registry/namespace/repository:tag`; missing parts default to
  `docker.io`, `library`, and `latest`.
- A **tag** is a movable label; a **digest** (`sha256:…`) is an immutable content hash. Pin tags or
  digests for reproducibility.
- Use `docker pull`, `docker images`, and `docker rmi` to manage images locally.
- On **Docker Hub**, prefer **official** (the `library` namespace) or **verified** images.

# Flash Cards

Q: What is a Docker image made of?
A: A stack of read-only layers, each a set of filesystem changes; layers are shared across images and cached during builds.

Q: What are the parts of a full image reference?
A: registry-host / namespace / repository : tag — for example docker.io/library/nginx:1.27. Missing parts default to docker.io, library, and latest.

Q: What is the difference between a tag and a digest?
A: A tag is a movable label that can be re-pointed to a new image; a digest (sha256 hash) is immutable and always refers to the exact same image bytes.

Q: Why is relying on the latest tag risky?
A: latest is not a version — it is whatever the maintainer most recently tagged, so it can change silently and break reproducibility.

Q: What is a Docker Official Image?
A: A curated image maintained with Docker's involvement, living in the special library namespace, which is why you can reference it by a bare name like nginx.

Q: When you pull a new image, why is the download often smaller than the image size?
A: Because layers are shared — Docker only downloads the layers you do not already have locally.

# Exercises

### Easy
Pull `alpine` with no tag, then run `docker images` and note the tag Docker assigned. What does that
tell you about the default?

### Medium
Pull two tags of the same image (for example `python:3.12` and `python:3.13`). Watch the output for
"Already exists" lines and explain what layer sharing is doing.

### Challenging
Use `docker image inspect` to find the `RepoDigests` of an image, then pull it by digest. Explain
why a teammate pulling the same digest is guaranteed to get an identical image, even if the tag
later moves.

# Further Reading

- Docker images (concepts) — <https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/>
- `docker pull` reference — <https://docs.docker.com/reference/cli/docker/image/pull/>
- Docker Official Images — <https://docs.docker.com/docker-hub/image-library/trusted-content/>
- Image layers — <https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/>
