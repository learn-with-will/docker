---
id: lesson-18
slug: cicd-with-github-actions
title: "CI/CD with GitHub Actions"
level: advanced
order: 18
duration: 30
tags:
  - github-actions
  - cicd
  - ghcr
  - workflow
  - automation
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain the structure of a GitHub Actions workflow: events, jobs, steps, and runners.
- Write a CI job that checks out code, installs dependencies, and runs tests.
- Build a Docker image and push it to GHCR from a workflow.
- Use `GITHUB_TOKEN`, `permissions`, and secrets correctly.
- Tag images automatically and cache builds for speed.

# Why It Matters

GitHub Actions is one of the most common ways to run CI/CD, and it lives right next to your code. In
this lesson you turn the concepts from the previous one into a real, runnable pipeline: every push
builds and tests your app, and — when it passes — produces a versioned container image in a registry,
ready to deploy. This is the automation that makes "build once, promote many" real.

> Action versions below (for example `@v4`, `@v6`) are the widely used current majors; always check
> each action's page on the GitHub Marketplace for the latest version before copying.

# Concept Explanation

### The building blocks

A **workflow** is a YAML file in `.github/workflows/`. Its parts:

- **Events (`on`)** — what triggers the workflow (`push`, `pull_request`, a schedule, manual dispatch).
- **Jobs** — groups of steps that run on a **runner** (a fresh virtual machine). Jobs run in parallel
  unless one `needs` another.
- **Steps** — the ordered commands in a job. A step either **`run`s** a shell command or **`uses`** a
  reusable **action**.
- **Runner** — the machine a job runs on, chosen with `runs-on` (e.g. `ubuntu-latest`).

### A minimal CI job

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
```

Every push and pull request now runs your tests on a clean machine. If a step exits non-zero, the job
fails and the change is flagged.

### Permissions, tokens, and secrets

- Each run gets an automatic **`GITHUB_TOKEN`** secret. To let it **push images to GHCR**, grant the
  job `packages: write` under `permissions`.
- Your own secrets (API keys, etc.) live in the repository settings and are read as
  `${{ secrets.NAME }}`. Never hard-code secrets in the workflow.

### Building and pushing an image

Docker maintains official actions for this. A build-and-push job typically:

1. Checks out the code.
2. Logs in to the registry (`docker/login-action`).
3. Computes tags/labels (`docker/metadata-action`).
4. Builds and pushes (`docker/build-push-action`).

```yaml
  build-and-push:
    needs: test                     # only after tests pass
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write               # required to push to GHCR
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=ref,event=branch
            type=semver,pattern={{version}}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

What each piece does:

- **`needs: test`** makes the build wait for CI to pass — no image is published for broken code.
- **`metadata-action`** generates useful tags automatically (a commit-SHA tag, the branch name, and a
  semantic-version tag on version tags/releases).
- **`build-push-action`** builds with BuildKit and pushes; `cache-from`/`cache-to: type=gha` reuses
  the GitHub Actions build cache across runs for speed.

### Continuous delivery/deployment from here

Once the image is in GHCR, a later job (or a separate tool) can deploy it — SSH to a server and
`docker compose pull && up -d`, update a Kubernetes deployment, or trigger a platform. Add a manual
approval (a GitHub **environment** with required reviewers) for continuous *delivery*, or deploy
automatically for continuous *deployment*.

# Key Terminology

- **Workflow** — a YAML automation file in `.github/workflows/`.
- **Event (`on`)** — the trigger (push, pull_request, schedule, manual).
- **Job / Step / Runner** — a set of steps on a VM; a step `run`s a command or `uses` an action.
- **Action** — a reusable unit referenced with `uses:`.
- **`GITHUB_TOKEN`** — an automatic, scoped token for the run.
- **`permissions`** — the scopes granted to the token (e.g. `packages: write`).

# Syntax and Options

| Piece | Purpose |
| --- | --- |
| `on:` | Which events trigger the workflow |
| `jobs.<id>.runs-on` | The runner OS |
| `uses: actions/checkout@v4` | Check out the repo |
| `docker/login-action@v3` | Log in to a registry |
| `docker/metadata-action@v5` | Generate tags/labels |
| `docker/build-push-action@v6` | Build and push the image |
| `needs:` | Run a job only after another succeeds |
| `permissions: { packages: write }` | Allow pushing to GHCR |

# Hands-On Walkthrough

Create `.github/workflows/ci.yml` combining both jobs:

```yaml
name: CI/CD
on:
  push:
    branches: [main]
    tags: ["v*"]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test

  build-and-push:
    needs: test
    if: github.event_name == 'push'      # don't push images for PRs
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=semver,pattern={{version}}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Commit and push. In the repository's **Actions** tab you will see the run: `test` first, then
`build-and-push`, ending with an image in the repo's **Packages**.

# Real World Analogy

A workflow is a **recipe the kitchen runs automatically whenever ingredients arrive**. The **event**
is the delivery at the door (a push); the **jobs** are stations (prep, cook, plate); **`needs`** is
"don't plate until it's cooked." The **`GITHUB_TOKEN`** is a temporary staff badge that works only for
that shift, and **`permissions`** decides which doors the badge opens (here, the pantry where images
are stored).

# Examples

## Example 1 — Basic: test on every pull request

```yaml
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make test
```

**Why this works:** Contributors get automated feedback on every PR before a human reviews it, keeping
the main branch green.

## Example 2 — Real-world: gate the image build on tests

```yaml
build-and-push:
  needs: test
  # ... login, metadata, build-push as above
```

**Why this works:** `needs: test` means the image is built and pushed **only** after tests pass, so a
broken build never becomes a published, deployable artifact.

## Example 3 — Best practice / edge case: cache builds across runs

```yaml
- uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: ghcr.io/acme/api:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Why this works:** `type=gha` stores BuildKit's cache in the GitHub Actions cache, so later runs
reuse unchanged layers and build far faster — the CI equivalent of local layer caching.

# Common Mistakes

- **Forgetting `permissions: packages: write`**, so pushing to GHCR fails with a permission error.
- **Hard-coding secrets** in the YAML instead of using `${{ secrets.* }}`.
- **Building and pushing on pull requests** from forks (where secrets are restricted) — gate pushes to
  trusted events like `push`.
- **Not using `needs:`**, so a broken build still publishes an image.
- **Skipping build caching**, making every CI build slow.

# Best Practices

- Run **tests on every push and PR**; gate the **image build/push** behind them with `needs:`.
- Grant the **least permissions** needed (`packages: write` only where you push).
- Use **`docker/metadata-action`** to tag images with a **SHA** and a **semantic version**.
- **Cache** builds with `type=gha` for speed.
- Read secrets via **`${{ secrets.* }}`**; add a manual **environment approval** for production
  (delivery) when appropriate.

# Summary

- A **workflow** (`.github/workflows/*.yml`) runs **jobs** of **steps** on **runners**, triggered by
  **events**.
- A CI job checks out code, installs, and tests; failures block the change.
- Build and push images with **`login-action`**, **`metadata-action`**, and **`build-push-action`**,
  granting **`packages: write`** and using the automatic **`GITHUB_TOKEN`**.
- Use **`needs:`** to publish images only after tests pass, and **`type=gha`** caching for speed.
- Add a manual approval for continuous **delivery**, or deploy automatically for continuous
  **deployment**.

# Flash Cards

Q: What are the main parts of a GitHub Actions workflow?
A: Events (on) that trigger it, jobs that run on runners, and steps within each job that either run a shell command or use a reusable action.

Q: What permission does a job need to push an image to GHCR, and what token does it use?
A: It needs permissions: packages: write, and it authenticates with the automatic GITHUB_TOKEN (username github.actor) via docker/login-action.

Q: How do you ensure an image is only built and pushed after tests pass?
A: Put the build job's needs: on the test job, so it runs only if the test job succeeds.

Q: What does docker/metadata-action do?
A: It generates image tags and labels automatically — for example a commit-SHA tag, the branch name, and a semantic-version tag on releases.

Q: How do you speed up image builds across CI runs?
A: Use build caching with cache-from: type=gha and cache-to: type=gha,mode=max in docker/build-push-action, which stores BuildKit's cache in the GitHub Actions cache.

Q: How should secrets be referenced in a workflow?
A: Through ${{ secrets.NAME }}, reading from the repository's configured secrets — never hard-coded in the YAML.

# Exercises

### Easy
Write a workflow that runs on every `push` and `pull_request`, checks out the code, and runs your
project's test command. Push it and watch it run in the Actions tab.

### Medium
Add a second job that logs in to GHCR and builds and pushes an image, gated with `needs: test` and
`permissions: packages: write`. Confirm the image appears under the repository's Packages.

### Challenging
Extend the build job with `docker/metadata-action` to tag images by commit SHA and semantic version,
and add `type=gha` build caching. Explain what tags a push to `main` versus a `v1.2.0` tag will
produce.

# Further Reading

- GitHub Actions documentation — <https://docs.github.com/actions>
- Publishing images to GHCR — <https://docs.github.com/en/actions/how-tos/package-your-code/publishing-docker-images>
- docker/build-push-action — <https://github.com/docker/build-push-action>
- docker/metadata-action — <https://github.com/docker/metadata-action>
