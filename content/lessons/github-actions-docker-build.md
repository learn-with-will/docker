---
slug: github-actions-docker-build
title: "Building Docker Images in GitHub Actions"
topic: cicd-and-deployment
kind: technique
summary: "Build Docker images in GitHub Actions using official docker/setup-buildx-action and docker/build-push-action."
tags: [github-actions, build-push-action, workflow, automation]
related: [github-actions-cache, pushing-to-ghcr-actions, devops-pipeline-stages]
---
> **In one line:** Automate container builds in GitHub Actions using Docker's official setup-buildx-action and build-push-action.

## The idea
GitHub Actions is the premier CI/CD automation platform for repositories hosted on GitHub. While you can run raw `docker build` shell commands in workflow steps, Docker maintains official, highly optimized GitHub Actions:

- **`docker/setup-buildx-action`**: Provisions and configures a dedicated BuildKit instance inside the GitHub runner, unlocking BuildKit's full feature set (cache mounts, parallel stage execution, secret mounts).
- **`docker/metadata-action`**: Automatically extracts git tags, branch names, and commit SHAs to generate standardized OCI image tags and labels.
- **`docker/build-push-action`**: Compiles the image, manages remote caching, and pushes to OCI registries in a single declarative step.

| Official Docker Action | Purpose in Workflow |
|---|---|
| `docker/setup-buildx-action` | Initializes BuildKit engine in runner |
| `docker/metadata-action` | Generates semantic tags and OCI labels from git |
| `docker/build-push-action` | Executes build and pushes image to registry |

## See it
Here is a complete, production-ready GitHub Actions workflow file (`.github/workflows/docker-build.yml`):

```yaml
name: Build Container Image
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: my-app
          tags: type=sha,prefix=sha-
      - uses: docker/build-push-action@v6
        with:
          context: .
          tags: ${{ steps.meta.outputs.tags }}
          push: false
```

## Go deeper
The `docker/metadata-action` step inspects the git event triggering the workflow. On branch pushes, it generates tags like `sha-7b3f91a`; on git tag pushes (like `v1.2.0`), it generates semantic version tags (`1.2.0`, `1.2`, `1`) automatically.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Use official Docker GitHub Actions: `setup-buildx-action` and `build-push-action`.
- `metadata-action` automates generating consistent OCI tags and metadata labels from git events.
- Encapsulating builds inside official actions ensures optimal BuildKit utilization.
