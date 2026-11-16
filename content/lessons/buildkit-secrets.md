---
slug: buildkit-secrets
title: "BuildKit Secret Mounts"
topic: security
kind: technique
summary: "Mount private tokens and SSH credentials safely during build execution with RUN --mount=type=secret."
tags: [secret-mount, buildkit, api-keys, ssh]
related: [secrets-hygiene, buildkit-features, buildkit-cache-mounts]
---
> **In one line:** BuildKit secret mounts expose credentials during RUN commands without writing them into image layers.

## The idea
Developers frequently need credentials **during the build phase**:
- An `npm install` command needing an `NPM_TOKEN` to download private corporate packages.
- A `pip install` command accessing a private Git repository via an SSH key.
- A compiler fetching proprietary licensing files.

Before BuildKit, developers resorted to insecure workarounds like passing tokens via `ARG` or copying `~/.npmrc` into the image and attempting to delete it afterward, permanently leaking credentials into image layers.

**BuildKit Secret Mounts** (`RUN --mount=type=secret`) provide a secure, native solution:
1. The secret is mounted into an ephemeral in-memory filesystem inside the container during that single `RUN` instruction.
2. The command executes and accesses the secret (as a mounted file or environment variable).
3. When the `RUN` instruction finishes, the secret mount is detached.
4. **The secret is never committed to the image layer, metadata, or build history.**

| Mount Type | Syntax | Accessible As |
|---|---|---|
| File secret (default) | `--mount=type=secret,id=mysecret` | File at `/run/secrets/mysecret` |
| Environment secret | `--mount=type=secret,id=mysecret,env=API_KEY` | Environment variable `$API_KEY` |

## See it
Use a BuildKit secret mount to authenticate with a private npm package registry:

```docker
# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./

# Mount secret token as an environment variable during npm install
RUN --mount=type=secret,id=npmtoken,env=NPM_TOKEN \
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > /root/.npmrc && \
    npm ci --omit=dev && \
    rm -f /root/.npmrc

COPY src/ ./src/
CMD ["node", "src/index.js"]
```

Execute the build passing the host secret securely:

```bash
# Pass secret from host environment variable
export NPM_TOKEN="npm_secret_live_token_123"
docker build --secret id=npmtoken .
```

Inspect the built image history to confirm that the secret is completely absent:

```bash
docker history --no-trunc my-built-image
```

## Go deeper
BuildKit also supports native SSH agent forwarding via `RUN --mount=type=ssh` and `docker build --ssh default`. This allows Git inside the container to clone private repositories using your host's active SSH agent without mounting private key files.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- `RUN --mount=type=secret` securely mounts credentials into memory during build execution.
- Secret data is never committed to the filesystem layer or recorded in image metadata.
- Combine with `--secret id=<name>` to pass secrets safely from host environment variables or files.
