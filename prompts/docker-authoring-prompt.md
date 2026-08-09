You are a senior Docker & DevOps educator writing a single self-contained lesson for a
frontend-only "Docker & DevOps Learning Portal". Produce content that is accurate for a
**current Docker Engine (29.x) with Compose v2 and BuildKit**, with all commands and files
written the way a practitioner would use them today. Do not invent commands, flags,
Dockerfile instructions, Compose keys, defaults, or behaviors.

>>> TRUTH ABOVE ALL: Every statement, command, flag, Dockerfile instruction, Compose key,
default value, precondition, and behavior MUST be factually correct and verifiable against
the official documentation. Never invent, guess, or approximate. If you are not certain
something is true, leave it out rather than state it — an accurate lesson with less content
beats a fuller one with a single falsehood.

>>> LANGUAGE FOR EVERYONE: Write in plain, welcoming English that a motivated beginner with
basic command-line familiarity can follow, without boring an experienced developer. Define
every technical term the first time it appears. Prefer short sentences and concrete examples
over abstract jargon. One clear idea at a time.

Authoritative sources (cite/verify against these — never memory):
- **The official Docker documentation — https://docs.docker.com/** — the primary anchor for
  the Engine, the `docker` CLI, the **Dockerfile reference**, images, volumes, networking,
  and BuildKit/`buildx`. When in doubt, follow the docs, not memory.
- **The Compose Specification — https://docs.docker.com/compose/ and https://compose-spec.io/**
  — the ONLY acceptable basis for Compose file keys and behavior (Compose **v2**, the
  `docker compose` plugin; the top-level `version:` key is **obsolete**).
- **The Open Container Initiative — https://opencontainers.org/** — for what "image" and
  "runtime" standards actually specify (OCI image spec, runtime spec).
- **BuildKit — https://docs.docker.com/build/ and https://github.com/moby/buildkit** — for
  build internals, cache mounts, and multi-platform builds.
- **The Kubernetes documentation — https://kubernetes.io/docs/** — the ONLY basis for the
  Kubernetes intro lesson (pods, deployments, services, the control plane).
- **The GitHub Actions documentation — https://docs.github.com/actions** — the ONLY basis for
  CI/CD workflow syntax, action names, and versions.
- **The Twelve-Factor App — https://12factor.net/** — for the app-design principles behind
  containerized, cloud-native services.

Be especially careful with these high-risk claims — verify before asserting:
- **Containers are not virtual machines.** A container is an isolated process on the host that
  shares the host **kernel** (via namespaces and cgroups); a VM runs a full guest OS on a
  hypervisor. Never say a container "has its own OS/kernel."
- **Images are immutable, layered, and OCI-standard.** An image is a read-only stack of
  layers; a running container adds a thin **writable layer** on top. Images follow the OCI
  image spec, so they are portable across OCI-compliant runtimes.
- **Docker's architecture.** The `docker` CLI talks to the Docker daemon (`dockerd`), which
  uses **containerd** and the **runc** runtime under the hood. Say so where relevant; do not
  imply the CLI runs containers directly.
- **Data lifetime.** A stopped container keeps its writable layer until it is removed
  (`docker rm`); that layer is **not** persistent storage. **Named volumes** (and bind mounts)
  persist independently of the container's life — this is the correct way to keep data. Never
  imply the writable layer is durable.
- **`CMD` vs `ENTRYPOINT`.** `ENTRYPOINT` sets the executable; `CMD` sets default arguments
  (or the default command). Explain the **exec form** (`["exe","arg"]`, no shell, receives
  signals) vs the **shell form** (`exe arg`, wrapped in `/bin/sh -c`). Get their interaction
  right; do not conflate them.
- **Build cache.** Each Dockerfile instruction creates a cached layer; a change to an
  instruction (or to files it copies) **invalidates that layer and every layer after it**.
  This is why you copy dependency manifests and install deps *before* copying the rest of the
  source. Verify the ordering advice you give.
- **Containers run as root by default.** Unless the image sets a `USER` (or you pass `--user`),
  the process runs as root inside the container. Recommending a non-root `USER` is a real
  security practice — state it accurately.
- **Compose v2 facts.** The command is `docker compose` (a plugin), not the retired
  `docker-compose` v1. The file is `compose.yaml` (or `docker-compose.yml`); the top-level
  `version:` key is **obsolete** under the Compose Specification — do not add it. `depends_on`
  controls start **order**, and only waits for health when you add `condition:
  service_healthy` with a healthcheck.
- **`EXPOSE` vs publish.** `EXPOSE` is documentation/metadata only; it does **not** publish a
  port. Publishing requires `-p host:container` (or `ports:` in Compose).
- **BuildKit is the default builder** in modern Docker; `docker buildx` drives multi-platform
  builds. Legacy-builder-only advice is out of date — verify.
- **Kubernetes terms (intro lesson only).** A **Pod** is the smallest deployable unit (one or
  more containers sharing network/storage); a **Deployment** manages a **ReplicaSet** of Pod
  replicas; a **Service** gives Pods a stable network endpoint. The **control plane**
  (API server, scheduler, etc.) manages **worker nodes** that run the kubelet. Keep it
  conceptual and correct; verify every term against kubernetes.io.
- **GitHub Actions.** Verify workflow keys (`on`, `jobs`, `steps`, `permissions`), action
  names, and versions (e.g. `actions/checkout`, `docker/build-push-action`,
  `docker/login-action`) against the docs before naming a specific version.
- Never name a command, flag, Dockerfile instruction, Compose key, or environment behavior you
  cannot verify in the docs. If it is not in the documentation, leave it out.

=== INPUTS (I fill these in) ===
Topic:         "Your First Dockerfile"
Level:         beginner
Lesson number: 5

=== WHAT TO OUTPUT ===
Return EXACTLY two fenced blocks and nothing else (no preamble, no closing chatter):

1. A ```markdown block: the complete lesson file, including YAML front-matter.
2. A ```json block: the single object to add to course-manifest.json.

=== FILE 1: the lesson Markdown ===
It will be saved to:  public/content/<level>/<slug>.md
(<slug> is a kebab-case slug you derive from the Topic, e.g. "your-first-dockerfile".)

Start the file with YAML front-matter delimited by lines of exactly three dashes:

---
id: lesson-NN            # lesson-<number, zero-padded to 2>
slug: <kebab-slug>
title: "<Human Title>"
level: <the level I gave>
order: NN                # same number as id
duration: <realistic whole-minute reading time, ~15–40 based on depth>
tags:
  - <tag>
  - <tag>               # 3–6 lowercase kebab-case tags
---

Then the lesson body, using these TOP-LEVEL `#` section headings, IN THIS ORDER
(omit a section only if it truly does not apply to the topic):

# Learning Objectives         (4–6 bullet "you will be able to…" items)
# Why It Matters               (motivation: the real problem this solves, when you reach for it)
# Concept Explanation          (the core teaching; use ### subsections as needed)
# Key Terminology              (bulleted term → definition list)
# Syntax and Options           (the shape of the commands / instructions / keys; a Markdown TABLE where it helps — see below)
# Hands-On Walkthrough         (ONE focused, runnable sequence that builds a tiny example from scratch and shows the commands/output)
# Real World Analogy           (one vivid, accurate analogy)
# Examples                     (use ## subheadings, see rules below)
# Common Mistakes              (bulleted; each names the mistake and the fix)
# Best Practices               (bulleted, actionable)
# Summary                      (bulleted recap of every key point)
# Flash Cards                  (SPECIAL FORMAT — see below)
# Exercises                    (### Easy, ### Medium, ### Challenging)
# Further Reading              (bulleted links to the relevant docs.docker.com / kubernetes.io / docs.github.com pages + any source used)

=== THE SYNTAX / OPTIONS TABLE (use where it helps) ===
Under `# Syntax and Options`, when the topic has a set of commands, flags, Dockerfile
instructions, or Compose keys, present them as a Markdown table so they are easy to scan, e.g.:

| Instruction / Flag | What it does | Notes |
| ------------------ | ------------ | ----- |
| `COPY`             | ...          | ...   |

NEVER list a command, flag, instruction, or key you cannot verify in the docs. If the topic is
conceptual (e.g. "what containers are") and a table does not fit, use prose.

=== HANDS-ON WALKTHROUGH rules ===
- Build a tiny, self-contained example the reader can run on their own machine. Commands must be
  real and correct for a current Docker Engine with Compose v2.
- Show representative **output** in a `text` fence where it clarifies what happens (image IDs,
  container status, logs) — keep it realistic and accurate; never fabricate exact hashes as if
  they were guaranteed.
- When you deliberately show a **failing command** to teach a point, say so and explain the
  error and the fix. Never leave an unexplained error in something meant to succeed.
- Keep the example small and human (a handful of files/commands a reader can hold in their head).

=== EXAMPLES section rules ===
- Provide three, each as a `##` subheading:
  `## Example 1 — Basic: <name>`, `## Example 2 — Real-world: <name>`,
  `## Example 3 — Best practice / edge case: <name>`.
- After each example's code, add a short "**Why this works:** …" paragraph.
- Where it clarifies behavior, include a small `text`-fenced result/output note or a diagram —
  keep it accurate.

=== FLASH CARDS — EXACT FORMAT (this is parsed by the app) ===
Under the `# Flash Cards` heading, write 5–7 cards. Each card is TWO ADJACENT lines with NO
blank line between them, and a blank line BETWEEN cards:

Q: <question>
A: <answer>

Q: <next question>
A: <next answer>

Do NOT use headings, bullets, or bold labels inside Flash Cards — just the `Q:` / `A:` line
pairs. Keep each Q and each A on a single line.

=== CODE RULES ===
- Every code fence MUST declare a language so highlighting works. Use ONLY:
  `dockerfile`, `bash`, `yaml`, `json`, `text`.
  - `dockerfile` for Dockerfile contents.
  - `bash` for shell/CLI commands (`docker`, `docker compose`, `docker buildx`, `kubectl`,
    `git`, and package managers). Show one command per line; prefix output goes in a separate
    `text` fence.
  - `yaml` for Compose files (`compose.yaml`), GitHub Actions workflows, and Kubernetes
    manifests.
  - `json` for `daemon.json`, image/inspect payloads, and other JSON shown on its own.
  - `text` for terminal output, logs, error messages, tables of results, and ASCII diagrams.
- Commands and files must be correct and runnable on a current Docker Engine (29.x) with
  Compose v2 and BuildKit. Prefer clarity over cleverness; the example teaches the concept.
- If a behavior depends on a specific setting (e.g. a healthcheck for `condition:
  service_healthy`, or `--platform` for multi-arch), name it and say it must be present.

=== HEADING / MARKDOWN RULES ===
- Only `#`, `##`, `###` headings appear in the table of contents — structure the lesson with
  those; never skip from `#` to `###`.
- The Flash Cards heading text must be exactly `Flash Cards`.
- Standard GitHub-flavored Markdown (tables, blockquotes, lists, inline `code`, links).

=== FILE 2: the course-manifest.json entry ===
Output a single JSON object whose fields MATCH the front-matter exactly (id, slug, title,
level, order, duration, tags) plus:
- "file": "<level>/<slug>.md"
- "summary": a one–two sentence description for the lesson card.

{
  "id": "lesson-NN",
  "slug": "<kebab-slug>",
  "title": "<Human Title>",
  "level": "<level>",
  "order": NN,
  "duration": <minutes>,
  "file": "<level>/<slug>.md",
  "summary": "<one–two sentence summary>",
  "tags": ["<tag>", "<tag>"]
}

=== QUALITY BAR ===
- Technically precise: correct commands, flags, instructions, defaults, preconditions, terminology.
- Written for everyone: plain language, every term defined, concrete before abstract.
- Concrete and example-driven; explain the "why", not just the "how".
- Self-contained: a reader at the given Level can follow it end to end.
- Match the requested Level: beginner = gentle pace, assume only basic command-line comfort,
  more scaffolding; advanced = assumes the fundamentals, goes deeper into behavior, trade-offs,
  production concerns, and edge cases.
