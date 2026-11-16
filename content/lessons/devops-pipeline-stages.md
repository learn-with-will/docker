---
slug: devops-pipeline-stages
title: "Container CI/CD Pipeline Stages"
topic: cicd-and-deployment
kind: concept
summary: "Structure an automated container deployment pipeline: lint, test, build, scan, push, and deploy."
tags: [cicd, pipeline, test, build, push]
related: [twelve-factor-containers, github-actions-docker-build, pushing-to-ghcr-actions]
---
> **In one line:** A container CI/CD pipeline automates verification, multi-stage building, security scanning, and deployment.

## The idea
Continuous Integration and Continuous Deployment (CI/CD) pipelines automate the journey of software from a developer's `git push` to running production containers.

A robust container CI/CD pipeline enforces sequential quality and security gates:
1. **Lint & Test:** Runs static code analysis, linters, and unit test suites before building images.
2. **Build:** Executes `docker build` using multi-stage Dockerfiles and remote build caching.
3. **Security Scan:** Inspects the compiled image for CVE vulnerabilities (Trivy/Docker Scout) and secret leaks. Fails the pipeline if Critical CVEs are detected.
4. **Push:** Tags the verified image with the Git commit SHA and semantic version, then pushes it to an OCI registry (GHCR, ECR).
5. **Deploy:** Updates orchestrator manifests (Kubernetes Deployment, Compose, or Cloud Run) to roll out the new image tag.

```flow
p-push: Git Push | commit webhook @primary
p-test: Unit Tests | fast feedback @blue
p-build: Docker Build | multi-stage BuildKit @blue
p-scan: CVE Scan | security gate @amber
p-reg: Push Registry | immutable tag @green
p-deploy: Production Deploy | rolling rollout @green
p-push -> p-test
p-test -> p-build
p-build -> p-scan
p-scan -> p-reg
p-reg -> p-deploy
```

| Pipeline Stage | Purpose | Tool Example |
|---|---|---|
| 1. Lint & Test | Code quality & unit testing | Jest, pytest, golangci-lint |
| 2. Build | Compiles OCI image artifact | Docker Buildx / BuildKit |
| 3. Scan | Security gate against vulnerabilities | Docker Scout, Trivy |
| 4. Push | Distributes verified artifact | GHCR, AWS ECR, Docker Hub |
| 5. Deploy | Progressive production rollout | Kubernetes, ArgoCD, GitHub Actions |

## See it
Run stage-specific container tests locally before pushing to CI/CD:

```bash
# Run unit test stage inside isolated container
docker build --target test -t app:test .
docker run --rm app:test npm test
```

A standard pipeline fails fast at early stages if errors occur, preventing broken code from ever being built into an image or deployed to clusters.

## Go deeper
Never build separate images for staging and production. Build **one single image artifact** tagged with the Git commit SHA, test it thoroughly in staging, and promote that exact same image artifact to production. Only the environment variables change.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.


Always verify error handling and failure recovery mechanisms during staging deployments. Testing simulated network disconnects, resource exhaustion limits, and process crashes guarantees that systems degrade gracefully under adverse conditions.

## Remember
- Structure pipelines into logical gates: test, build, scan, push, and deploy.
- Enforce automated vulnerability scanning gates before pushing images to registries.
- Build a single immutable image artifact once per commit and promote it across environments.
