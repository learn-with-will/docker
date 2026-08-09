---
id: lesson-15
slug: logging-and-debugging
title: "Logging, Monitoring & Debugging Containers"
level: intermediate
order: 15
duration: 26
tags:
  - logging
  - debugging
  - inspect
  - healthcheck
  - monitoring
---

# Learning Objectives

By the end of this lesson you will be able to:

- Read container output with `docker logs`, and explain the stdout/stderr logging model.
- Watch resource usage with `docker stats`.
- Inspect a container's full configuration and state with `docker inspect`.
- Add a `HEALTHCHECK` so Docker knows whether your app is healthy.
- Debug a container that crashes on startup.

# Why It Matters

Containers are opaque until you know how to look inside them. When something breaks — a container
exits instantly, an app hangs, memory balloons — you need to read logs, check resource usage, and
inspect state quickly. These are the everyday troubleshooting skills that turn "it doesn't work" into
"here's exactly what's wrong."

# Concept Explanation

### The container logging model

The convention is simple and important: **a containerized app should log to standard output
(stdout) and standard error (stderr)**, not to files inside the container. Docker captures that
stream, and `docker logs` shows it:

```bash
docker logs <container>       # all output so far
docker logs -f <container>    # follow (stream) new output
docker logs --tail 50 <c>     # last 50 lines
docker logs --since 10m <c>   # last 10 minutes
```

Logging to stdout/stderr (a twelve-factor principle) means the platform — Docker, Compose, or an
orchestrator — decides where logs go, so you can collect them centrally without changing the app.

### Log drivers and rotation

By default Docker uses the **`json-file`** log driver, storing logs on disk. On a busy service these
files can grow without bound, so configure **rotation**:

```bash
docker run -d --log-opt max-size=10m --log-opt max-file=3 myteam/api:1.0
```

Other drivers (e.g. `local`, `journald`, or shipping to a remote system) exist for production
logging.

### Watching resources

```bash
docker stats               # live CPU, memory, net, and I/O for all running containers
docker stats <container>   # just one
docker top <container>     # the processes running inside a container
```

`docker stats` is the fastest way to spot a container eating CPU or approaching a memory limit.

### Inspecting state

`docker inspect` dumps a container's (or image's) full JSON: configuration, mounts, networks, and —
critically for debugging — its **state**, including the exit code and OOM (out-of-memory) flag:

```bash
docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}' <c>
```

```text
exited exit=137 oom=true    ← killed for running out of memory
```

### HEALTHCHECK

A **`HEALTHCHECK`** in the Dockerfile tells Docker how to test that the app is actually working, not
just running:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

The container's status then shows `healthy` / `unhealthy` in `docker ps`, and tools can react to it.

### Debugging a crash-on-start

When a container exits immediately:

1. **Read the logs** — `docker logs <c>` usually shows the error (missing env var, bad config, port
   in use).
2. **Check the exit code** — `docker inspect` (`137` often = OOM/killed; `1` = app error).
3. **Get a shell** — if the container exits too fast to `exec` into, override the entrypoint and open
   a shell to look around:

```bash
docker run -it --entrypoint sh myteam/api:1.0
# now poke around: ls, cat config, run the start command manually to see the error
```

# Key Terminology

- **stdout/stderr logging** — apps write logs to the standard streams; Docker captures them.
- **Log driver** — how Docker stores/forwards logs (`json-file` by default).
- **`docker stats`** — live resource usage per container.
- **`docker inspect`** — full JSON of a container's/image's config and state.
- **`HEALTHCHECK`** — a Dockerfile probe reporting healthy/unhealthy.
- **OOMKilled** — the container was killed for exceeding its memory.

# Syntax and Options

| Command | What it shows / does |
| --- | --- |
| `docker logs -f --tail 100 <c>` | Follow the last 100 log lines |
| `docker stats` | Live CPU/memory/IO for running containers |
| `docker top <c>` | Processes inside the container |
| `docker inspect <c>` | Full config + state JSON (use `--format` to extract) |
| `docker events` | Real-time stream of daemon events |
| `docker run -it --entrypoint sh <img>` | Open a shell instead of the normal command |

# Hands-On Walkthrough

Diagnose a container that crashes on start.

```bash
# 1. This container fails because a required variable is missing.
docker run --name badapp alpine sh -c 'test -n "$TOKEN" || { echo "ERROR: TOKEN not set"; exit 3; }'

# 2. It exited. Read WHY from the logs.
docker logs badapp
```

```text
ERROR: TOKEN not set
```

```bash
# 3. Confirm the exit code.
docker inspect --format '{{.State.ExitCode}}' badapp
```

```text
3
```

```bash
# 4. Fix it by supplying the variable, and clean up.
docker rm badapp
docker run --rm -e TOKEN=abc123 alpine sh -c 'test -n "$TOKEN" && echo "OK, token present"'
```

```text
OK, token present
```

Logs told you the cause; the exit code confirmed a deliberate failure; supplying the config fixed it.

# Real World Analogy

Debugging a container is like diagnosing a stalled car. **`docker logs`** is listening to what the
engine is telling you (the error messages). **`docker stats`** is the dashboard gauges — temperature,
fuel, RPM. **`docker inspect`** is popping the hood to read the exact configuration and the fault
code. **`HEALTHCHECK`** is the check-engine light that turns on *before* you break down completely.

# Examples

## Example 1 — Basic: follow logs while reproducing a bug

```bash
docker logs -f web
# trigger the action in another terminal or browser; watch the error appear live
```

**Why this works:** Following the logs while you reproduce the problem ties the symptom to the exact
log lines it produces — the fastest path to the cause.

## Example 2 — Real-world: catch out-of-memory kills

```bash
docker run -d --name worker --memory 128m myteam/worker:1.0
# later, if it disappears:
docker inspect --format '{{.State.OOMKilled}} {{.State.ExitCode}}' worker
```

```text
true 137
```

**Why this works:** `OOMKilled true` and exit code `137` together tell you the container exceeded its
128 MB limit and was killed — so the fix is more memory or a leaner workload, not a code bug hunt.

## Example 3 — Best practice / edge case: shell into a crashing image

```bash
docker run -it --entrypoint sh myteam/api:1.0
# inside: run the real start command by hand to see the full error, inspect config files
```

**Why this works:** When a container exits too quickly to `exec` into, overriding the entrypoint with
a shell lets you start the app manually and watch it fail with full context.

# Common Mistakes

- **Writing logs to files inside the container** instead of stdout/stderr, so `docker logs` shows
  nothing and the platform cannot collect them.
- **Never configuring log rotation**, letting `json-file` logs fill the disk.
- **Guessing at crashes** instead of reading `docker logs` and the exit code first.
- **Forgetting `137`/OOMKilled means memory**, and chasing a nonexistent code bug.
- **No `HEALTHCHECK`**, so "running" is mistaken for "working" even when the app is wedged.

# Best Practices

- Log to **stdout/stderr**; let the platform route logs. Configure **rotation** for `json-file`.
- Make **`docker logs`** your first debugging step, then **exit code** via `docker inspect`.
- Add a meaningful **`HEALTHCHECK`** that tests real functionality (an endpoint), not just liveness.
- Use **`docker stats`** to catch resource problems, and set memory/CPU limits deliberately.
- Keep a **shell-into-image** trick (`--entrypoint sh`) ready for containers that crash on start.

# Summary

- Containerized apps should log to **stdout/stderr**; read them with `docker logs` (`-f`, `--tail`,
  `--since`) and configure **rotation** for the default `json-file` driver.
- **`docker stats`** and **`docker top`** show live resource use and processes.
- **`docker inspect`** reveals full config and **state**, including the **exit code** and
  **OOMKilled** flag.
- A **`HEALTHCHECK`** distinguishes "running" from "healthy."
- Debug crashes by reading **logs → exit code → shell into the image** with `--entrypoint sh`.

# Flash Cards

Q: Where should a containerized app send its logs, and why?
A: To standard output and standard error. Docker captures those streams (docker logs), so the platform can route and collect logs centrally without changing the app — a twelve-factor principle.

Q: What does an exit code of 137 together with OOMKilled true tell you?
A: The container was killed for exceeding its memory limit (out of memory), so the fix is more memory or a leaner workload rather than a code bug.

Q: What is the difference between a container being running and being healthy?
A: Running only means the process started; healthy means a HEALTHCHECK probe confirms the app is actually working. Without a healthcheck you cannot tell the difference.

Q: How can you debug a container that crashes too fast to exec into?
A: Start it with an overridden entrypoint, docker run -it --entrypoint sh <image>, then run the start command manually and inspect config to see the real error.

Q: Which command shows live CPU and memory usage per container?
A: docker stats, which streams CPU, memory, network, and I/O for running containers (or one named container).

Q: Why configure log rotation for the json-file driver?
A: Because json-file stores logs on disk and they can grow without bound on a busy service; max-size and max-file cap their size.

# Exercises

### Easy
Run a container that prints a message and exits, then use `docker logs` to read the message and
`docker inspect --format '{{.State.ExitCode}}'` to read its exit code.

### Medium
Add a `HEALTHCHECK` to a small web image that curls its own `/health` (or any) endpoint. Run it and
watch `docker ps` report the container as `healthy` or `unhealthy`.

### Challenging
Run a container with a small `--memory` limit and a workload that exceeds it. After it is killed, use
`docker inspect` to show `OOMKilled` and the exit code, and explain how you would tell this apart
from an ordinary application crash.

# Further Reading

- Container logging — <https://docs.docker.com/engine/logging/>
- Configure logging drivers — <https://docs.docker.com/engine/logging/configure/>
- `docker inspect` — <https://docs.docker.com/reference/cli/docker/inspect/>
- Dockerfile `HEALTHCHECK` — <https://docs.docker.com/reference/dockerfile/#healthcheck>
