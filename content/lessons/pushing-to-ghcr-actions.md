---
slug: pushing-to-ghcr-actions
title: "Publishing to GHCR with GitHub Actions"
topic: cicd-and-deployment
kind: technique
summary: "Authenticate and push production container images to GitHub Container Registry using GITHUB_TOKEN."
tags: [ghcr, github-token, login-action, push]
related: [github-actions-docker-build, github-container-registry, tagging-strategies]
---
> **In one line:** Authenticate to ghcr.io using docker/login-action and GITHUB_TOKEN, then push verified images with build-push-action.

## The idea
Once an image is built and tested in a CI pipeline, the final step is publishing the artifact to a container registry so production servers can pull it.

When hosting repositories on GitHub, **GitHub Container Registry (ghcr.io)** provides a zero-friction destination because GitHub Actions includes a built-in authentication token: **`secrets.GITHUB_TOKEN`**.

To push images to GHCR:
1. Grant the workflow explicit `packages: write` permission.
2. Log into `ghcr.io` using the official `docker/login-action`.
3. Set `push: true` in `docker/build-push-action`.

You do not need to configure personal access tokens or register external accounts; authentication is fully automated and scoped strictly to your repository.

| Configuration Item | Required Value | Purpose |
|---|---|---|
| `permissions.packages` | `write` | Grants workflow token permission to publish OCI packages |
| `login-action.registry` | `ghcr.io` | Targets GitHub Container Registry endpoint |
| `build-push-action.push` | `true` | Executes registry upload upon build completion |

## See it
Here is a complete workflow that authenticates and publishes an image to GHCR:

```yaml
name: Publish to GHCR
on:
  push:
    branches: [main]
permissions:
  contents: read
  packages: write
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

## Go deeper
Notice that the image name uses `ghcr.io/${{ github.repository }}`. This automatically lowercases the repository path to satisfy the OCI naming convention (which strictly forbids uppercase characters in image repository names).


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Grant `packages: write` permissions in workflow files to authorize container publishing.
- Use `docker/login-action` with `secrets.GITHUB_TOKEN` to authenticate with `ghcr.io`.
- Set `push: true` in `docker/build-push-action` to publish upon successful compilation.
