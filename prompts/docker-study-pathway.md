# Docker & DevOps Study Pathway
### A Comprehensive, Phase-by-Phase Curriculum

> **Based on:** the official Docker documentation (https://docs.docker.com/), the Compose
> Specification (https://compose-spec.io/), the Open Container Initiative
> (https://opencontainers.org/), the Kubernetes docs (https://kubernetes.io/docs/), the GitHub
> Actions docs (https://docs.github.com/actions), and the Twelve-Factor App (https://12factor.net/).
> **Target:** a current Docker Engine (29.x) with Compose v2 and BuildKit. Concepts are
> version-stable; version numbers are cited only where a claim depends on them.
> **Approach:** each lesson builds on the ones before it. You cannot write a good Dockerfile
> before you understand images and layers; you cannot compose services before you can run and
> network single containers; you cannot build a CI/CD pipeline before you can build and push an
> image by hand.

---

## Phase 1 — Beginner: Docker Foundations

**Goal:** Understand what containers are and become comfortable running, building, and wiring up
single containers on your own machine.
**Exit criteria:** You can run and manage containers, pull and push images, write a basic
Dockerfile, persist data with volumes, publish ports, and configure a container's environment.

1. **What Is Docker & Why Containers?** — containers vs virtual machines; images vs containers;
   the OCI standard; the Docker architecture (the `docker` CLI, the `dockerd` daemon,
   containerd, and the registry).
2. **Installing Docker & Running Your First Container** — Docker Engine vs Docker Desktop;
   `docker run hello-world`; `docker ps`/`-a`; the container lifecycle (created → running →
   exited → removed).
3. **Images, Tags & Docker Hub** — image layers, tags, and digests; `docker pull`/`push`;
   Docker Hub; official and verified images.
4. **Managing Containers** — `run`/`stop`/`start`/`restart`/`rm`; `exec`; `logs`; detached vs
   foreground; publishing ports with `-p`; naming with `--name`.
5. **Your First Dockerfile** — `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`; `docker build
   -t`; the build context and `.dockerignore`.
6. **Data Persistence: Volumes & Bind Mounts** — the writable layer vs durable storage; named
   volumes, bind mounts, and tmpfs; `docker volume`; where data actually lives.
7. **Container Networking Basics** — the default bridge vs a user-defined bridge (with DNS);
   publish vs `EXPOSE`; `host` and `none`; `docker network`.
8. **Configuration & the Container Lifecycle** — `ENV` and `--env-file`; `ARG` vs `ENV`;
   restart policies; exit codes and stop signals.

---

## Phase 2 — Intermediate: Building Well & Multi-Service

**Goal:** Build small, secure, cacheable images and run multi-container applications the way real
projects do.
**Exit criteria:** You can optimize a Dockerfile, shrink images with multi-stage builds, run a
multi-service app with Compose, choose a registry and tagging strategy, harden a container, debug
a failing one, and build multi-platform images.

9. **Dockerfile Best Practices & Layer Caching** — instruction ordering for cache reuse;
   `.dockerignore`; combining `RUN` steps; pinning versions; `CMD` vs `ENTRYPOINT`.
10. **Multi-Stage Builds & Small Images** — build vs runtime stages; `COPY --from`; `alpine`,
    `slim`, and distroless base images; reducing size and attack surface.
11. **Docker Compose: Multi-Container Apps** — `compose.yaml`; `services`, `build`, `image`,
    `ports`, `volumes`; `docker compose up`/`down`; the Compose Specification (no `version:`).
12. **Compose in Depth** — networks and volumes; `depends_on` with healthchecks
    (`condition: service_healthy`); profiles; `env_file` and variable interpolation; override
    files.
13. **Registries & Tagging Strategies** — Docker Hub, GHCR, and self-hosted registries;
    `docker login`; immutable digests; semantic tags vs `latest`; retention.
14. **Container Security Fundamentals** — running as a non-root `USER`; least privilege and
    dropping capabilities; keeping secrets out of images; scanning images for vulnerabilities;
    choosing trusted base images.
15. **Logging, Monitoring & Debugging Containers** — `docker logs`, `stats`, `inspect`, and
    `events`; healthchecks; exit codes; debugging a container that crashes on start.
16. **BuildKit, Buildx & Multi-Platform Images** — BuildKit as the default builder; cache
    mounts and build secrets; `docker buildx`; building for `amd64` and `arm64`.

---

## Phase 3 — Advanced: DevOps Around Docker

**Goal:** Take a container from your laptop to a pipeline that builds, tests, ships, and operates
it — and understand the platforms and practices that run containers in production.
**Exit criteria:** You can describe the DevOps lifecycle, build a CI/CD pipeline that publishes an
image, choose a deployment strategy, explain why and how orchestration works, read basic
Kubernetes objects, reason about infrastructure as code, and instrument a service for
observability.

17. **DevOps & the CI/CD Lifecycle** — DevOps as culture + practice; continuous integration vs
    delivery vs deployment; the pipeline stages; where containers fit; the twelve-factor app.
18. **CI/CD with GitHub Actions** — the workflow file (`on`, `jobs`, `steps`); build → test →
    `docker build`/`push` to GHCR; build caching; secrets and permissions.
19. **Deployment Strategies** — recreate, rolling, blue-green, and canary; immutable image
    deploys; rollbacks and health gates.
20. **Orchestration Concepts** — why orchestration exists (scheduling, scaling, self-healing);
    the limits of plain Compose; Docker Swarm vs Kubernetes at a glance.
21. **Introduction to Kubernetes** — the control plane and worker nodes; Pods, Deployments, and
    Services; `kubectl`; how your image actually runs on a cluster (conceptual).
22. **Infrastructure as Code** — declarative vs imperative infrastructure; the benefits of IaC;
    configuration vs secrets; the GitOps idea (kept vendor-neutral).
23. **Observability: Logs, Metrics & Health** — the three pillars (logs, metrics, traces);
    structured logging; healthchecks and probes; Prometheus/Grafana concepts; alerting basics.
24. **Capstone: Containerize, Ship & Operate an App** — an end-to-end thread that ties every
    phase together (Dockerfile → Compose → CI/CD → deploy → observe) and points to where to go
    next.

---

## How to use this pathway

- **Don't skip.** Phase 2 assumes you can run and network a single container from Phase 1;
  Phase 3 assumes you can build and push an image from Phase 2. Compose builds on containers and
  networks; CI/CD builds on building and pushing images.
- **Run everything.** Every lesson has a hands-on walkthrough and Easy/Medium/Challenging
  exercises — type the commands on your own machine and read the output. You learn Docker by
  watching what actually happens, not by reading about it.
- **Take the quizzes.** Every lesson has a quiz; a passing score means the ideas landed.
- **Verify against the docs.** When unsure about a command, flag, Dockerfile instruction, or
  Compose key, check https://docs.docker.com/ — accuracy over assumption.
