# Docker Learn

The content of the Docker course at <https://learn-with-will.github.io/docker/>: 96 short lessons ("bites") in 12 topics, each teaching one idea in 3–5 minutes, plus a bank of 162 quiz questions. It covers foundations (namespaces, cgroups, images vs containers, OCI standards, Docker architecture), container operations & CLI (lifecycle commands, exec, logs, port publishing, system cleanup), images and registries (layer immutability, digest validation, Docker Hub, GHCR, tagging strategies), Dockerfile authoring (WORKDIR, COPY, RUN, CMD, ENTRYPOINT, build context, ARG vs ENV), data persistence (named volumes, bind mounts, tmpfs, backup workflows), networking (bridge networks, user-defined DNS resolution, host networking, network isolation), advanced builds (BuildKit, layer caching, multi-stage builds, Distroless/Alpine, cache mounts, multi-arch buildx), Docker Compose (specification, multi-container orchestration, healthchecks, profiles), container hardening & security (non-root users, dropped Linux capabilities, read-only root filesystems, Trivy scanning, secrets hygiene), debugging & observability (resource constraints, log drivers, container health, Prometheus metrics, structured logs), CI/CD & production deployment (GitHub Actions, GHCR publishing, rolling updates, blue-green cutover, canary deployments), and orchestration, Kubernetes & IaC (orchestrator architecture, Pods, Deployments, Services, kubectl, declarative GitOps, capstone deployment).

This repository holds **content only**. The site itself (lesson reader, quizzes, progress, optional sign-in) is the shared [course shell](https://github.com/learn-with-will/course-shell), which every course uses.

```text
course.json              name, brand colours, home page copy, code languages
content/topics.json      the 12 topics
content/lessons/*.md     one bite per file
content/legacy.json      old long-lesson URLs → the bites that replaced them
quiz/questions.json      the question bank
```

## Working on the course

Clone the shell next to this folder, then run its commands with this folder as the argument:

```bash
git clone https://github.com/learn-with-will/course-shell.git ../course-shell
cd ../course-shell
npm ci
npm run dev -- ../docker                 # live preview at http://localhost:4200
npm run validate -- ../docker --strict   # the check the deploy runs
```

Node 22.18 or later is required.

## Adding a lesson

1. Create `content/lessons/<slug>.md` with front-matter (`slug`, `title`, `topic`, `kind`, `summary`, `tags`, `related`) and the standard sections.
2. Add questions for it to `quiz/questions.json` with `"topic"` and `"lesson"`.
3. Run `npm run validate -- ../docker --strict` from the shell folder.

The rules (length limits, which visual fits which kind of information, the diagram syntax) are in the shell's [CONTENT_GUIDE.md](https://github.com/learn-with-will/course-shell/blob/main/CONTENT_GUIDE.md).

## Accuracy

Facts and techniques are synthesized from official Docker documentation, OCI runtime specifications, Linux kernel cgroups and namespace documentation, CNCF best practices, and enterprise cloud-native production standards.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which calls the shell's reusable workflow: it validates this course in strict mode, builds it with the latest shell and publishes it to GitHub Pages. To pick up a shell change without a content change, run the workflow by hand from the Actions tab.
