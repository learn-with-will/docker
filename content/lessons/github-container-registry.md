---
slug: github-container-registry
title: "GitHub Container Registry (GHCR)"
topic: images-and-registries
kind: technique
summary: "Publish and distribute container images using GitHub Container Registry at ghcr.io."
tags: [ghcr, github, registry, oci]
related: [docker-hub, private-registries-auth, pushing-to-ghcr-actions]
---
> **In one line:** GitHub Container Registry (ghcr.io) hosts OCI images alongside your GitHub source code with granular permission controls.

## The idea
While Docker Hub remains popular, many development teams prefer hosting container images directly alongside their code repositories on GitHub. **GitHub Container Registry (GHCR)** provides a high-performance, OCI-compliant registry service hosted under `ghcr.io`.

Key advantages of GHCR include:
- **Repository Association:** Packages can be tied directly to a GitHub repository for integrated access control and release tracking.
- **Granular Permissions:** Supports separate read/write permissions decoupled from git repository access.
- **CI/CD Integration:** Seamlessly authenticates inside GitHub Actions workflows using the automated `GITHUB_TOKEN` secret without configuring external third-party registry credentials.

To target an external registry, you prefix the repository name with the registry domain name:

```text
ghcr.io / <owner-or-org> / <repository-name> : <tag>
```

| Registry | Image Name Example | Authentication |
|---|---|---|
| Docker Hub | `myorg/api:v1` | Docker Hub username & token |
| GitHub (GHCR) | `ghcr.io/myorg/api:v1` | GitHub PAT with write:packages scope |

## See it
Authenticate with GHCR and push a tagged image from your local workstation:

```bash
# Log in using your GitHub username and personal access token (PAT)
echo "$CR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Tag your local image for the GHCR namespace
docker tag my-service:latest ghcr.io/my-org/my-service:1.0.0

# Push the image to GitHub Packages
docker push ghcr.io/my-org/my-service:1.0.0
```

The push output reveals distinct layer uploads and digest registration:

```text
The push refers to repository [ghcr.io/my-org/my-service]
5f70bf18a086: Pushed
c64513a7086d: Layer already exists
1.0.0: digest: sha256:7e09fa2b3... size: 948
```

## Go deeper
GHCR supports public and private visibility. When you push an image tied to a public GitHub repository, the package can be set to public, allowing anyone in the world to pull your container without authentication.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- GHCR images must be prefixed with the registry domain: `ghcr.io/<owner>/<repo>:<tag>`.
- Authenticate locally using a Personal Access Token with `write:packages` permission.
- GHCR allows seamless integration with GitHub Actions workflows and granular package permissions.
