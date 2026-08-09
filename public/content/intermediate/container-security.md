---
id: lesson-14
slug: container-security
title: "Container Security Fundamentals"
level: intermediate
order: 14
duration: 28
tags:
  - security
  - non-root
  - secrets
  - scanning
  - least-privilege
---

# Learning Objectives

By the end of this lesson you will be able to:

- Run a container as a **non-root** user and explain why that matters.
- Apply **least privilege** with read-only filesystems and dropped capabilities.
- Keep **secrets** out of images and layers.
- Scan images for known vulnerabilities.
- Choose trusted, minimal, up-to-date base images.

# Why It Matters

Containers isolate processes, but they are not a security boundary you can ignore. A container that
runs as root, carries secrets baked into its layers, or ships a base image full of old vulnerable
packages is a real risk. The good news: a handful of habits — non-root users, least privilege,
proper secret handling, and scanning — remove most of the easy attacks. Security is not a separate
phase; it is part of building images well.

# Concept Explanation

### Don't run as root

By default, the process inside a container runs as **root** (unless the image sets a `USER`). If an
attacker breaks out of the app, root inside the container is a far better foothold than an
unprivileged user. Set a non-root user in your Dockerfile:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

Many official images already ship a non-root user (e.g. `node`). Use it. You can also override at run
time with `--user`.

### Least privilege

Give a container only what it needs:

- **Read-only root filesystem** — `--read-only` stops a compromised process from modifying the image
  filesystem. Pair it with a writable `tmpfs` or volume for the few paths that need writes.
- **Drop Linux capabilities** — containers get a set of kernel **capabilities** by default. Drop them
  all and add back only what you need:

```bash
docker run --read-only --cap-drop ALL --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges myteam/api:1.0
```

- **`no-new-privileges`** stops a process from gaining more privileges (e.g. via setuid binaries).
- **Never use `--privileged`** unless you truly must — it removes most isolation.

### Keep secrets out of images

A secret baked into an image (via `COPY`, `ENV`, or `ARG`) is stored in a **layer** and can be
extracted by anyone who pulls the image — even if a later instruction "deletes" it. Instead:

- Pass secrets at **run time** as environment variables or files (from a secrets manager).
- In **Compose/Swarm**, use the `secrets` mechanism to mount secrets as files.
- For **build-time** secrets (e.g. a private package token), use BuildKit's secret mount so the value
  is never written to a layer:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmtoken \
    NPM_TOKEN=$(cat /run/secrets/npmtoken) npm ci
```

```bash
docker build --secret id=npmtoken,src=./npm_token.txt -t app .
```

The secret is available only during that `RUN` and never becomes part of the image.

### Scan for vulnerabilities

Images inherit the vulnerabilities of everything inside them. **Scan** them and act on the results.
Docker's built-in scanner is **Docker Scout**:

```bash
docker scout cves myteam/api:1.0
```

It lists known CVEs in the image's packages. Other popular scanners exist (for example Trivy and
Grype). Scanning belongs in CI so a vulnerable image is caught before it ships.

### Choose good base images

- Prefer **official** or **verified** images, and **minimal** variants (`slim`, `alpine`, distroless)
  to shrink the attack surface.
- **Keep them updated** — rebuild regularly so security patches in the base flow into your image.
- **Pin** versions (or digests) so you know exactly what you are shipping.

# Key Terminology

- **Non-root user** — running the container process as an unprivileged user via `USER`/`--user`.
- **Capability** — a fine-grained Linux privilege; drop the ones you do not need.
- **`--read-only`** — makes the container's root filesystem read-only.
- **Build secret** — a value mounted only during a build (BuildKit), never stored in a layer.
- **CVE** — a publicly catalogued security vulnerability.
- **Least privilege** — granting only the minimum access a workload needs.

# Syntax and Options

| Control | How |
| --- | --- |
| Non-root at build | `USER node` in the Dockerfile |
| Non-root at run | `docker run --user 1000:1000 ...` |
| Read-only filesystem | `docker run --read-only ...` |
| Drop capabilities | `--cap-drop ALL --cap-add <needed>` |
| Block privilege escalation | `--security-opt no-new-privileges` |
| Build-time secret | `RUN --mount=type=secret,...` + `--secret` |
| Scan for CVEs | `docker scout cves <image>` |

# Hands-On Walkthrough

```bash
# 1. Show that a default container runs as root.
docker run --rm alpine id
```

```text
uid=0(root) gid=0(root) groups=0(root),...   ← root!
```

```bash
# 2. Run the same image as a non-root user.
docker run --rm --user 1000:1000 alpine id
```

```text
uid=1000 gid=1000 groups=1000
```

```bash
# 3. Lock it down further: read-only root fs, no extra capabilities, no privilege escalation.
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges alpine \
  sh -c "touch /test 2>&1 || echo 'root fs is read-only, as intended'"
```

```text
root fs is read-only, as intended
```

```bash
# 4. Scan an image for known vulnerabilities.
docker scout cves alpine:3.20
```

# Real World Analogy

Container security is like running a shop. **Running as root** is giving every employee a master key
to the whole building — convenient until one is careless. **Least privilege** is issuing each person
a key only to the rooms they need. **Baking in secrets** is taping the safe combination to the
storefront window. **Scanning** is the routine safety inspection that flags a faulty lock before a
burglar finds it.

# Examples

## Example 1 — Basic: a non-root Dockerfile

```dockerfile
FROM python:3.13-slim
RUN useradd --create-home appuser
WORKDIR /home/appuser
COPY --chown=appuser:appuser . .
USER appuser
CMD ["python", "app.py"]
```

**Why this works:** A dedicated `appuser` owns the files and runs the process, so a compromise of the
app does not hand the attacker root inside the container.

## Example 2 — Real-world: a hardened run command

```bash
docker run -d --name api \
  --read-only --tmpfs /tmp \
  --cap-drop ALL --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges \
  myteam/api:1.4.0
```

**Why this works:** The filesystem is read-only (with a small writable `/tmp`), all capabilities are
dropped except the one needed to bind a low port, and privilege escalation is blocked — a strong,
minimal footprint.

## Example 3 — Best practice / edge case: a build-time secret

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npmtoken \
    npm config set //registry.npmjs.org/:_authToken="$(cat /run/secrets/npmtoken)" && npm ci
```

**Why this works:** The token is mounted only for that `RUN` and never written into any image layer,
so pulling the finished image cannot expose it — unlike a token passed through `ARG` or `ENV`.

# Common Mistakes

- **Running as root** because it "just works." Add a `USER`.
- **Baking secrets into images** via `COPY`/`ENV`/`ARG` — they live in the layers even if "removed."
- **Using `--privileged`** as a quick fix; it strips isolation. Prefer specific capabilities.
- **Never scanning or updating base images**, so known CVEs ship to production.
- **Ignoring file ownership**, so a non-root user cannot read the files it needs (use
  `COPY --chown`).

# Best Practices

- Run as a **non-root user**; use official images' built-in users where available.
- Apply **least privilege**: `--read-only`, `--cap-drop ALL` (add back only what is needed),
  `no-new-privileges`.
- Keep **secrets out of images**; pass them at run time or via BuildKit build secrets.
- **Scan images in CI** (`docker scout`, or another scanner) and fail the build on serious CVEs.
- Use **minimal, trusted, pinned, and regularly rebuilt** base images.

# Summary

- Containers run as **root by default** — set a **`USER`** to run unprivileged.
- Apply **least privilege**: read-only filesystem, drop capabilities, and block privilege escalation;
  avoid `--privileged`.
- **Never bake secrets** into images; use run-time env/files or **BuildKit build secrets**.
- **Scan** images for CVEs (e.g. `docker scout cves`) and act on the findings, ideally in CI.
- Prefer **minimal, trusted, pinned** base images and rebuild them to pick up patches.

# Flash Cards

Q: What user does a container process run as by default, and why is that a concern?
A: root, unless the image sets a USER. Running as root means a compromise of the app gives an attacker root inside the container, a stronger foothold than an unprivileged user.

Q: Why can't you hide a secret by COPYing it in and deleting it in a later instruction?
A: The secret is stored in the layer created by the COPY; later instructions add new layers but do not erase earlier ones, so the secret can still be extracted from the image.

Q: How do you provide a secret during a build without baking it into the image?
A: Use a BuildKit build secret: RUN --mount=type=secret,id=... together with docker build --secret. The value is available only during that RUN and is never written to a layer.

Q: What does --cap-drop ALL --cap-add NET_BIND_SERVICE accomplish?
A: It removes all Linux capabilities and adds back only the one needed to bind a privileged port, applying least privilege to the container.

Q: What is Docker Scout used for?
A: Scanning images for known vulnerabilities (CVEs), for example docker scout cves <image>, so issues are found before the image ships.

Q: Name two ways to reduce a container's privileges at run time.
A: Use --read-only for a read-only root filesystem and --cap-drop ALL (adding back only needed capabilities); also --security-opt no-new-privileges blocks privilege escalation.

# Exercises

### Easy
Run `docker run --rm alpine id`, then run it again with `--user 1000:1000`. Compare the output and
explain why running as non-root is safer.

### Medium
Write a Dockerfile that creates a non-root user, copies files with `--chown`, and sets `USER`. Build
and run it, then confirm inside the container (with `id`) that the process is not root.

### Challenging
Run a container with `--read-only`, `--cap-drop ALL`, and `--security-opt no-new-privileges`.
Demonstrate that writing to the root filesystem fails, then add a `--tmpfs /tmp` and show that a
write to `/tmp` succeeds. Explain the trade-off you just made.

# Further Reading

- Docker Scout — <https://docs.docker.com/scout/>
- Build secrets — <https://docs.docker.com/build/building/secrets/>
- Run reference (security options) — <https://docs.docker.com/reference/cli/docker/container/run/#security-opt>
- Compose secrets — <https://docs.docker.com/compose/how-tos/use-secrets/>
