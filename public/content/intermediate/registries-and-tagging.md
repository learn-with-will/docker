---
id: lesson-13
slug: registries-and-tagging
title: "Registries & Tagging Strategies"
level: intermediate
order: 13
duration: 24
tags:
  - registry
  - ghcr
  - tagging
  - digests
  - docker-push
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe what a registry is and compare Docker Hub, GHCR, and private registries.
- Log in to a registry and push an image to it.
- Tag an image correctly for a given registry and repository.
- Choose a sensible tagging strategy for versions and releases.
- Pull by digest for guaranteed reproducibility.

# Why It Matters

Building an image on your laptop is only useful if others — teammates, CI, servers — can get it. A
**registry** is the shared store that makes that possible. And how you **tag** images determines
whether "deploy version 1.4.0" means something precise or something that quietly changes. Good
tagging habits prevent a whole category of "which build is actually running?" incidents.

# Concept Explanation

### What a registry is

A **registry** is a server that stores and distributes images. You **push** images to it and **pull**
images from it. The default public registry is **Docker Hub** (`docker.io`), but there are many:

- **Docker Hub** — the default; huge public library plus private repos.
- **GitHub Container Registry (GHCR)** — `ghcr.io`, integrated with GitHub repos and Actions.
- **Cloud registries** — Amazon ECR, Google Artifact Registry, Azure Container Registry.
- **Self-hosted** — you can run your own registry.

### Logging in

Pushing to any registry requires authentication:

```bash
docker login                      # Docker Hub
docker login ghcr.io              # GitHub Container Registry
```

You will be prompted for a username and a **token/password**. In automation, prefer a scoped access
token over your real password, and pass it on stdin rather than as a visible argument.

### Naming and tagging for a registry

An image's name encodes *where it belongs*. To push to GHCR, the image must be named
`ghcr.io/<owner>/<repo>:<tag>`. You create that name with `docker tag` (or by building with `-t`):

```bash
# You built "shop:1.4.0" locally. Give it a registry-qualified name:
docker tag shop:1.4.0 ghcr.io/acme/shop:1.4.0
docker push ghcr.io/acme/shop:1.4.0
```

`docker tag` does not copy the image; it just adds another name (reference) pointing at the same
image. One image can carry many tags at once.

### Tagging strategies

`latest` is convenient but meaningless as a version. Better strategies:

- **Semantic version** — `1.4.0`, plus moving `1.4` and `1` tags that point at the newest patch/minor.
  Lets consumers pin as tightly as they want.
- **Git commit SHA** — tag with the commit (e.g. `sha-a1b2c3d`) so every image traces back to exact
  source. Common in CI.
- **Environment or channel** — `stable`, `edge` — moving pointers to the latest in a channel.
- **Immutable digest** — for deployments that must never change under you, reference
  `repo@sha256:…`.

A typical CI build applies **several tags at once**: the exact version, a short SHA, and maybe a
moving `latest` for the default branch.

### Pull by digest for reproducibility

Because tags can move, the strongest guarantee is the **digest**:

```bash
docker pull ghcr.io/acme/shop@sha256:9a1b2c...
```

Anyone pulling that digest gets the identical image bytes forever — ideal for production manifests
and audits.

# Key Terminology

- **Registry** — a server that stores and distributes images.
- **GHCR** — GitHub Container Registry (`ghcr.io`).
- **`docker tag`** — add another name/reference to an existing image (no copy).
- **`docker push` / `docker pull`** — upload / download an image.
- **Immutable digest** — a `sha256:…` reference to exact image bytes.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker login [registry]` | Authenticate to a registry |
| `docker tag <src> <registry>/<owner>/<repo>:<tag>` | Give an image a registry-qualified name |
| `docker push <registry>/<owner>/<repo>:<tag>` | Upload the image |
| `docker pull <ref>` | Download by tag or digest |
| `docker build -t ghcr.io/acme/shop:1.4.0 .` | Build with a registry name directly |

# Hands-On Walkthrough

Push an image to GHCR (adapt the owner to your GitHub account/org).

```bash
# 1. Log in (use a GitHub personal access token with the right package scope).
echo "$CR_PAT" | docker login ghcr.io -u YOUR_GH_USERNAME --password-stdin

# 2. Build with a registry-qualified name and a real version tag.
docker build -t ghcr.io/YOUR_GH_USERNAME/hello:1.0.0 .

# 3. Add a couple more useful tags to the SAME image.
docker tag ghcr.io/YOUR_GH_USERNAME/hello:1.0.0 ghcr.io/YOUR_GH_USERNAME/hello:1.0
docker tag ghcr.io/YOUR_GH_USERNAME/hello:1.0.0 ghcr.io/YOUR_GH_USERNAME/hello:latest

# 4. Push all tags of the repository.
docker push --all-tags ghcr.io/YOUR_GH_USERNAME/hello
```

```text
The push refers to repository [ghcr.io/YOUR_GH_USERNAME/hello]
1.0.0: digest: sha256:9a1b2c... size: 1789
1.0:   digest: sha256:9a1b2c... size: 1789   ← same digest = same image
latest: digest: sha256:9a1b2c... size: 1789
```

All three tags share one digest because they point at the same image.

# Real World Analogy

A registry is a **library**, and an image is a **book**. Pushing is donating a copy; pulling is
borrowing one. **Tags** are the labels on the spine — "2024 edition," "latest" — which the librarian
can move to a newer printing. The **digest** is the exact catalog ID of one specific printing: cite
the label and you might get a newer edition next year; cite the catalog ID and you always get the
exact same pages.

# Examples

## Example 1 — Basic: retag a local image for a registry

```bash
docker tag myapp:1.2.0 docker.io/acme/myapp:1.2.0
docker push docker.io/acme/myapp:1.2.0
```

**Why this works:** `docker tag` gives the local image a name that includes the registry and
namespace, which is what `docker push` uses to decide where to upload.

## Example 2 — Real-world: CI applies version + SHA tags

```bash
docker build \
  -t ghcr.io/acme/api:1.4.0 \
  -t ghcr.io/acme/api:sha-a1b2c3d \
  .
docker push --all-tags ghcr.io/acme/api
```

**Why this works:** The version tag is human-friendly; the SHA tag ties the image to the exact commit
that produced it, so you can always trace a running image back to its source.

## Example 3 — Best practice / edge case: deploy by digest

```bash
docker pull ghcr.io/acme/api@sha256:9a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00
```

**Why this works:** Even if `1.4.0` is later re-pushed, the digest reference guarantees the identical
image — the reproducibility and audit standard for production.

# Common Mistakes

- **Pushing without a registry-qualified name**, so it tries to go to Docker Hub under the wrong
  namespace. Tag it correctly first.
- **Deploying `:latest`**, then being unable to tell which build is live. Pin versions or digests.
- **Putting a token on the command line** where it lands in shell history; pipe it via
  `--password-stdin`.
- **Assuming `docker tag` copies the image.** It only adds a name; both refer to the same image.
- **Forgetting registry retention**, letting old images pile up and consume storage/cost.

# Best Practices

- **Authenticate with scoped tokens**, not your account password, and pass them on stdin.
- Tag every release with a **specific version**, and add a **git SHA** tag in CI for traceability.
- Use **moving tags** (`1.4`, `latest`, `stable`) as conveniences, never as the source of truth.
- **Deploy by digest** where reproducibility or compliance matters.
- Set a **retention/cleanup** policy so old images do not accumulate.

# Summary

- A **registry** stores and distributes images; Docker Hub is the default, GHCR integrates with
  GitHub, and cloud/self-hosted options exist.
- Push requires **`docker login`** and a **registry-qualified name** (`ghcr.io/owner/repo:tag`);
  `docker tag` adds names without copying.
- Prefer **semantic version** and **git-SHA** tags; treat `latest` as a convenience only.
- **Deploy by digest** for guaranteed, immutable reproducibility.
- Manage growth with a **retention policy**.

# Flash Cards

Q: What is a container registry?
A: A server that stores and distributes images; you push images to it and pull images from it. Docker Hub is the default public one.

Q: What must an image be named to be pushed to GitHub Container Registry?
A: ghcr.io/<owner>/<repo>:<tag> — a registry-qualified name that tells docker push where to upload it.

Q: Does docker tag copy the image?
A: No. It only adds another name (reference) pointing at the same image; one image can carry many tags at once.

Q: Why prefer semantic-version or git-SHA tags over latest?
A: They identify a precise build. latest is a moving label that can change silently, so it cannot tell you which build is actually running.

Q: What is the strongest way to guarantee you deploy an exact image?
A: Reference it by its immutable digest (repo@sha256:...), which always resolves to the identical image bytes even if tags move.

Q: When logging in for automation, how should you supply the token?
A: With a scoped access token piped via --password-stdin, so it does not appear as a visible argument or in shell history.

# Exercises

### Easy
Tag a local image with a registry-qualified name (Docker Hub or GHCR) and a version, then describe
what `docker push` will do with that name.

### Medium
Build one image and apply three tags — an exact version, a short git-SHA, and `latest` — then push
all tags. Confirm from the push output that they share the same digest.

### Challenging
Pull an image by tag, find its digest with `docker image inspect`, then pull it again by digest.
Explain to a teammate why deploying by digest is safer than deploying by a moving tag.

# Further Reading

- Docker Hub — <https://docs.docker.com/docker-hub/>
- `docker push` reference — <https://docs.docker.com/reference/cli/docker/image/push/>
- Working with GHCR — <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>
- `docker tag` reference — <https://docs.docker.com/reference/cli/docker/image/tag/>
