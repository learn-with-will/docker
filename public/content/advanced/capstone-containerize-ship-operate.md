---
id: lesson-24
slug: capstone-containerize-ship-operate
title: "Capstone: Containerize, Ship & Operate an App"
level: advanced
order: 24
duration: 30
tags:
  - capstone
  - end-to-end
  - dockerfile
  - cicd
  - deployment
---

# Learning Objectives

By the end of this lesson you will be able to:

- Containerize a real application with a production-grade Dockerfile.
- Run it locally as a multi-service app with Compose.
- Build, test, and publish its image through a CI/CD pipeline.
- Deploy the published image and operate it with health checks and observability.
- Use a production-readiness checklist and know where to go next.

# Why It Matters

This capstone stitches the whole course into one continuous thread: a single app goes from source code
to a running, observable service. Nothing here is new — it is the earlier lessons working together.
Seeing the full loop is what turns a pile of commands into an actual DevOps workflow you can reproduce
on real projects.

# Concept Explanation

Imagine a small web API (`orders-api`) that talks to a PostgreSQL database. We will take it end to end
through five stages you already know:

```text
  Containerize ─▶ Run locally (Compose) ─▶ CI/CD (build, test, push) ─▶ Deploy ─▶ Operate
```

### 1. Containerize — a small, secure Dockerfile

Apply the build lessons: multi-stage, cache-friendly ordering, a non-root user, a slim base, and a
healthcheck.

```dockerfile
# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build           # produces /app/dist

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node                   # run as non-root
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

Pair it with a `.dockerignore`:

```text
.git
node_modules
dist
*.log
.env
```

### 2. Run locally — Compose with a healthy database

Apply the Compose lessons: a service per component, a named volume for data, and a readiness gate.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://app:secret@db:5432/orders
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=orders
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 5
volumes:
  dbdata:
```

```bash
docker compose up -d --build
docker compose logs -f api
```

The API reaches the database by the hostname `db`, waits for it to be **healthy**, and the data
survives restarts in the `dbdata` volume.

### 3. CI/CD — build, test, publish

Apply the pipeline lessons: test on every change, then build and push an image tagged by version and
SHA, gated on the tests.

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
    if: github.event_name == 'push'
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

### 4. Deploy — promote the immutable image

Apply the deployment lessons: deploy the **exact image** you built (by tag or digest), with a strategy
matched to risk. On a single host that can be as simple as:

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d      # rolling-ish restart of updated services
```

On a cluster, update the Kubernetes Deployment's image and let it roll out:

```bash
kubectl set image deployment/orders-api api=ghcr.io/acme/orders-api:1.4.0
kubectl rollout status deployment/orders-api   # roll back with: kubectl rollout undo
```

Either way you **promote the same image** that passed CI, and you can roll back to the previous
image/digest fast.

### 5. Operate — health and observability

Apply the operate lessons: the container's `HEALTHCHECK` (and, on Kubernetes, liveness/readiness
probes), **structured logs** to stdout, **metrics** scraped by Prometheus and shown in Grafana, and
**alerts** on error rate and latency. Now you can answer "is it healthy?", "is it slow?", and "why did
that request fail?" without guessing.

# Key Terminology

- **End-to-end pipeline** — source → image → registry → deploy → operate, automated.
- **Promote the image** — deploy the same tested artifact through environments unchanged.
- **Readiness gate** — starting a dependent only when its dependency is healthy.
- **Rollback** — redeploy the previous image/digest to recover quickly.

# Syntax and Options

| Stage | Key tools/keys from this course |
| --- | --- |
| Containerize | multi-stage `FROM ... AS`, `USER`, `HEALTHCHECK`, `.dockerignore` |
| Run locally | `services`, `depends_on: condition: service_healthy`, named `volumes` |
| CI/CD | `needs:`, `permissions: packages: write`, build-push + metadata actions |
| Deploy | `compose pull && up -d`, or `kubectl set image` + `rollout` |
| Operate | `HEALTHCHECK`/probes, structured logs, Prometheus/Grafana, alerts |

# Hands-On Walkthrough

Run the whole local loop on the example app:

```bash
# 1. Build and start the app + database locally.
docker compose up -d --build

# 2. Confirm both are healthy and the API is reachable.
docker compose ps
curl -s http://localhost:3000/health
```

```text
NAME              STATUS
orders-db-1       Up (healthy)
orders-api-1      Up (healthy)
{"status":"ok"}
```

```bash
# 3. Make a change, rebuild, and watch the rolling restart.
docker compose up -d --build

# 4. Read structured logs; then tear down (keep data) or wipe it.
docker compose logs -f api
docker compose down            # add -v to also remove the dbdata volume
```

Push this project to GitHub with the workflow above and you have the remote half too: every push tests,
and every push to `main` (or a `v*` tag) publishes an image to GHCR ready to deploy.

# Real World Analogy

This is the **full assembly line plus the shipping and after-sales service**. Containerizing is packing
the product into a standard box; Compose is the test bench that runs the product with its accessories;
CI/CD is the automated line with quality gates that seals and labels each unit; deployment is putting the
exact inspected unit on the shelf; and operating is the telemetry and support that watches it in
customers' hands and lets you recall a batch instantly if needed.

# Examples

## Example 1 — Basic: the local loop

`docker compose up -d --build` brings up the API and a healthy database with one command.

**Why this works:** Compose encodes the whole local environment declaratively, so any teammate reproduces
it identically — the payoff of the Compose lessons.

## Example 2 — Real-world: a green pipeline publishes an image

A push to `main` runs tests, then builds and pushes `ghcr.io/acme/orders-api` tagged with the version and
commit SHA.

**Why this works:** The image is the immutable artifact, gated on tests and traceable to its exact
commit — build once, ready to promote.

## Example 3 — Best practice / edge case: safe rollback

A bad release is detected by alerts; you run `kubectl rollout undo deployment/orders-api` (or redeploy
the previous digest with Compose).

**Why this works:** Because you deploy immutable images and keep the previous one, recovery is a switch,
not a scramble — the deployment and observability lessons paying off together.

# Common Mistakes

- **Skipping a stage.** A great Dockerfile with no CI, or a pipeline with no health checks, leaves a gap
  where problems hide.
- **Rebuilding per environment** instead of promoting one tested image.
- **Baking config/secrets into the image** rather than injecting them at run time.
- **Deploying without a rollback plan** or without observability to know a deploy went wrong.
- **Treating "it starts" as "it works"** — without health checks and metrics you cannot tell.

# Best Practices

- Make the **container image the single artifact**: build once, test it, promote it unchanged, pin the
  digest.
- Keep **config in the environment** and **secrets** in a secrets manager.
- **Gate** the pipeline on tests (and ideally image scanning); **cache** builds for speed.
- Choose a **deployment strategy by risk** and always keep a **fast rollback**.
- **Operate deliberately**: health checks/probes, structured logs, metrics, and alerts on symptoms.

# Summary

- A full workflow is **containerize → run locally → CI/CD → deploy → operate**, and every stage reuses a
  lesson from this course.
- Build a **small, secure, multi-stage** image; run it locally with **Compose** and a **readiness gate**.
- Let **CI/CD** test and publish the **immutable image**, then **promote that same image** to production
  with a risk-appropriate strategy and a fast rollback.
- **Operate** with health checks/probes and the three observability pillars.
- **Where to go next:** go deeper on **Kubernetes**, a **cloud platform** and its managed registry/
  cluster, dedicated **IaC** tools, **security scanning in CI**, and **progressive delivery** (canary/
  blue-green automation).

# Flash Cards

Q: What are the five stages of the end-to-end workflow in this capstone?
A: Containerize the app, run it locally with Compose, build/test/publish it through CI/CD, deploy the image, and operate it with health checks and observability.

Q: What does "promote the image" mean and why is it safer?
A: Deploy the exact same tested image (by tag or digest) through each environment unchanged, so what runs in production is precisely what passed CI — rather than rebuilding per environment.

Q: Which build practices does the capstone Dockerfile combine?
A: A multi-stage build, cache-friendly ordering (manifest before source), a slim base, a non-root USER, a HEALTHCHECK, and a .dockerignore.

Q: How do you roll back a bad deployment quickly?
A: Redeploy the previous immutable image or digest — for example kubectl rollout undo, or pulling and running the prior image with Compose — since old versions are kept available.

Q: Why keep configuration and secrets out of the image even in the final workflow?
A: So one image runs in every environment (config in the environment) and sensitive values are never baked into layers; secrets belong in a secrets manager.

Q: Once the loop works, where can you go next?
A: Deeper into Kubernetes, a cloud platform with managed clusters/registries, dedicated IaC tools, security scanning in CI, and automated progressive delivery like canary and blue-green.

# Exercises

### Easy
Take the capstone Dockerfile and list every earlier-lesson practice it uses (multi-stage, non-root,
healthcheck, slim base, cache ordering, .dockerignore).

### Medium
Run the example locally with `docker compose up -d --build`, confirm both services are healthy, hit the
`/health` endpoint, make a change, and rebuild. Describe what happened at each step in course terms.

### Challenging
Sketch the complete journey of one commit for this app: which pipeline stages run, what image tags are
produced, how it gets deployed with a chosen strategy, and exactly how you would roll back if
observability showed a spike in errors after the deploy.

# Further Reading

- Docker: build, ship, run (get started) — <https://docs.docker.com/get-started/>
- CI/CD with Docker — <https://docs.docker.com/build/ci/>
- Kubernetes Deployments (rollouts & rollbacks) — <https://kubernetes.io/docs/concepts/workloads/controllers/deployment/>
- The Twelve-Factor App — <https://12factor.net/>
