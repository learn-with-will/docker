---
slug: capstone-containerize-ship-operate
title: "Capstone: Containerize, Ship & Operate"
topic: orchestration-and-iac
kind: pattern
summary: "Unite every phase of the course: containerize an application, compose services, automate CI/CD, and operate in production."
tags: [capstone, production, end-to-end, devops]
related: [multi-stage-builds, compose-services-and-build, github-actions-docker-build]
---
> **In one line:** The complete modern DevOps lifecycle: multi-stage build, Compose validation, GitHub Actions CI/CD, and production operation.

## The idea
Throughout this course, you have learned the individual building blocks of modern container engineering: namespaces, images, Dockerfiles, Compose, caching, security, CI/CD, and orchestration.

Now, integrate all these components into a unified, end-to-end production workflow:
1. **Containerize:** Write an optimized, secure multi-stage Dockerfile running as non-root.
2. **Compose locally:** Assemble microservices, database, and cache in `compose.yaml` with healthchecks.
3. **Automate CI/CD:** Build, scan with Trivy, and push multi-arch images to GHCR via GitHub Actions.
4. **Deploy & Observe:** Roll out to production with zero downtime, streaming structured logs and Prometheus metrics.

| Phase | Technology | Core Responsibility |
|---|---|---|
| Build | Multi-Stage Dockerfile | Minimal attack surface, Distroless/Alpine, non-root |
| Orchestrate | Docker Compose v2 | Local multi-container development & service discovery |
| Automate | GitHub Actions | Automated lint, test, CVE scan, and GHCR publishing |
| Operate | Prometheus + Healthchecks | Continuous monitoring, automated self-healing, graceful shutdown |

## See it
Validate the orchestrated capstone stack locally before shipping to production:

```bash
# Build multi-stage images and start complete stack
docker compose -f compose.yaml up -d --build

# Verify container health and automated service discovery
docker compose ps
curl -s http://localhost:8080/health
```

Review the production deployment pipeline architecture:

```flow
dev: Developer | git push commit @primary
gha: GitHub Actions | test, build, scan @blue
reg: GHCR Registry | immutable OCI image @amber
prod: Production Cluster | rolling deployment @green
obs: Prometheus & Logs | live observability @green
dev -> gha
gha -> reg: Pushes ghcr.io/app:sha-123
reg -> prod: Pulls verified artifact
prod -> obs: Emits metrics and JSON logs
```

## Go deeper
Congratulations on completing the Docker & DevOps curriculum! You now possess the practical knowledge required to package applications securely, accelerate development cycles with Compose, automate bulletproof CI/CD pipelines, and operate reliable cloud-native infrastructure in production.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.


Always verify error handling and failure recovery mechanisms during staging deployments. Testing simulated network disconnects, resource exhaustion limits, and process crashes guarantees that systems degrade gracefully under adverse conditions.

## Remember
- Package applications using lean multi-stage builds running under unprivileged non-root users.
- Automate testing, vulnerability scanning, and image publishing using GitHub Actions.
- Ensure end-to-end production reliability through healthchecks, structured logs, and metrics.
