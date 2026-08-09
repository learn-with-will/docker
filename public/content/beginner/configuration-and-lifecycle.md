---
id: lesson-08
slug: configuration-and-lifecycle
title: "Configuration & the Container Lifecycle"
level: beginner
order: 8
duration: 22
tags:
  - configuration
  - env
  - arg
  - restart-policies
  - exit-codes
---

# Learning Objectives

By the end of this lesson you will be able to:

- Pass configuration into a container with environment variables (`-e` and `--env-file`).
- Explain the difference between `ARG` (build time) and `ENV` (run time).
- Use restart policies to keep containers running after crashes or reboots.
- Read a container's exit code to understand why it stopped.
- Describe how a container shuts down gracefully.

# Why It Matters

The same image should run in development, testing, and production — the only thing that changes is
**configuration** (which database to connect to, which API key to use, what log level). Baking config
into the image would force a rebuild for every environment and risk leaking secrets. Environment
variables solve this. And once a container is running, restart policies and exit codes are how you
keep it healthy and diagnose failures.

# Concept Explanation

### Configuration through environment variables

The standard way to configure a container is with **environment variables**. Your app reads them at
startup, so one image behaves differently based on what you pass in. This is a core idea of the
**twelve-factor app** methodology: keep config in the environment, not in the code.

Set them at run time with `-e`:

```bash
docker run -e LOG_LEVEL=debug -e PORT=3000 myteam/api:1.0
```

For many variables, put them in a file and use `--env-file`:

```text
# app.env
LOG_LEVEL=debug
PORT=3000
DATABASE_URL=postgres://db:5432/shop
```

```bash
docker run --env-file app.env myteam/api:1.0
```

You can also set defaults in the Dockerfile with `ENV`, which apply unless overridden at run time:

```dockerfile
ENV PORT=3000 LOG_LEVEL=info
```

### ARG vs ENV — build time vs run time

These look similar but happen at different moments:

- **`ARG`** is a **build-time** variable. It exists only while the image is being built and is **not**
  present in the running container. Pass it with `--build-arg`.
- **`ENV`** is a **run-time** variable. It is baked into the image and available to the process when
  the container runs.

```dockerfile
ARG NODE_VERSION=22          # only during build
FROM node:${NODE_VERSION}-alpine
ENV APP_HOME=/app            # available at run time
WORKDIR ${APP_HOME}
```

> Important: do **not** pass secrets with `ARG` (or `ENV`) expecting them to be hidden — build args
> can be visible in image history, and `ENV` values are baked into the image. Secrets have their own
> mechanisms (a later security lesson).

### Restart policies

By default, a container that stops stays stopped. A **restart policy** tells Docker to bring it back
automatically:

| Policy | Behavior |
| --- | --- |
| `no` | Never restart (the default) |
| `on-failure[:max]` | Restart only if it exits with a non-zero code (optionally up to N times) |
| `always` | Always restart if it stops, including on daemon/host reboot |
| `unless-stopped` | Like `always`, but not if **you** explicitly stopped it |

```bash
docker run -d --restart unless-stopped --name api myteam/api:1.0
```

### Exit codes

When a container stops, it has an **exit code**. `0` means success; anything else means a problem.
See it in `docker ps -a` (the `STATUS` column) or precisely with:

```bash
docker inspect --format '{{.State.ExitCode}}' <container>
```

Common codes: `0` (clean exit), `1` (general error), `137` (killed — often out of memory or a forced
kill = 128 + signal 9), `143` (terminated by `SIGTERM` = 128 + 15).

### Graceful shutdown

`docker stop` sends **`SIGTERM`** to the main process, giving it a chance to finish requests, flush
data, and clean up. If the process does not exit within a grace period (10 seconds by default),
Docker sends **`SIGKILL`** to force it. Well-behaved apps handle `SIGTERM` to shut down cleanly —
which is another reason to use the exec form of `CMD` so the process actually receives the signal.

# Key Terminology

- **Environment variable** — a key/value passed into the container to configure the app.
- **`--env-file`** — load many environment variables from a file.
- **`ARG`** — a build-time variable; gone at run time.
- **`ENV`** — a run-time variable baked into the image.
- **Restart policy** — a rule for automatically restarting a stopped container.
- **Exit code** — the number a container returns when it stops (`0` = success).

# Syntax and Options

| Command / Instruction | What it does |
| --- | --- |
| `-e KEY=value` | Set one environment variable at run time |
| `--env-file file.env` | Load environment variables from a file |
| `ENV KEY=value` | Set a run-time default in the Dockerfile |
| `ARG KEY=value` + `--build-arg KEY=value` | Build-time variable |
| `--restart unless-stopped` | Restart automatically unless you stopped it |
| `docker inspect --format '{{.State.ExitCode}}' <c>` | Read a container's exit code |

# Hands-On Walkthrough

```bash
# 1. Same image, different config via -e.
docker run --rm -e GREETING="Hello DevOps" alpine sh -c 'echo "$GREETING"'
```

```text
Hello DevOps
```

```bash
# 2. Watch a restart policy in action: this container exits with an error, and Docker restarts it.
docker run -d --name flaky --restart on-failure:3 alpine sh -c "sleep 2; exit 1"
sleep 8
docker ps -a --filter name=flaky
```

```text
NAME    STATUS
flaky   Restarting (1) ...   # Docker retried up to 3 times because it exited non-zero
```

```bash
# 3. Read an exit code precisely, then clean up.
docker inspect --format '{{.State.ExitCode}}' flaky
docker rm -f flaky
```

# Real World Analogy

Environment variables are like the **settings dial** on an appliance: the same toaster (image) works
at home or at a café — you just set it differently. `ARG` is the choice made on the **factory line**
(built in, then gone); `ENV` is the setting on the **finished dial** the user can still change.
A restart policy is a **circuit breaker that flips itself back on**, and the exit code is the
appliance's error light telling you *why* it tripped.

# Examples

## Example 1 — Basic: override a default from the Dockerfile

If the image sets `ENV LOG_LEVEL=info`, you can override it at run time:

```bash
docker run -e LOG_LEVEL=debug myteam/api:1.0
```

**Why this works:** Run-time `-e` takes precedence over the `ENV` default baked into the image, so
the same image logs at `debug` here without a rebuild.

## Example 2 — Real-world: keep a service alive across reboots

```bash
docker run -d --name api --restart unless-stopped -p 8080:3000 myteam/api:1.0
```

**Why this works:** `unless-stopped` restarts the container if it crashes or the host reboots, but
respects a deliberate `docker stop`. It is the common choice for long-running services on a single
host.

## Example 3 — Best practice / edge case: a build-time argument

```dockerfile
ARG APP_VERSION=dev
LABEL org.opencontainers.image.version=$APP_VERSION
```

```bash
docker build --build-arg APP_VERSION=1.4.0 -t myteam/api:1.4.0 .
```

**Why this works:** `ARG` injects a value **during the build** (here, stamping the version into a
label). It does not linger in the running container, which is exactly right for build-only inputs.

# Common Mistakes

- **Putting secrets in `ARG` or `ENV`.** They can end up in image history or layers. Use real secret
  mechanisms instead.
- **Confusing `ARG` and `ENV`.** `ARG` is build-time only; `ENV` persists into the running container.
- **Expecting a crashed container to come back on its own** without a restart policy. The default is
  `no`.
- **Ignoring exit codes.** `137` often means out-of-memory; the code is a fast clue to the cause.
- **Writing apps that ignore `SIGTERM`**, so `docker stop` always waits the full grace period and
  then hard-kills them.

# Best Practices

- Configure containers with **environment variables**; keep the image the same across environments.
- Use **`--env-file`** to manage many variables, and keep that file out of version control if it
  holds anything sensitive.
- Use **`ENV`** for sane defaults and **`ARG`** for build-only inputs.
- Choose **`unless-stopped`** (or `on-failure`) for services so they recover from crashes and
  reboots.
- Make your app **handle `SIGTERM`** for clean, fast shutdowns.

# Summary

- Configure containers with **environment variables** (`-e`, `--env-file`), following the
  twelve-factor idea of config-in-the-environment.
- **`ARG`** is build-time only; **`ENV`** is baked in and available at run time. Neither is a safe
  place for secrets.
- **Restart policies** (`on-failure`, `always`, `unless-stopped`) keep containers running after
  crashes and reboots.
- A container's **exit code** tells you how it stopped (`0` = success; `137`/`143` relate to
  signals).
- `docker stop` sends **`SIGTERM`** then **`SIGKILL`**; good apps shut down gracefully on `SIGTERM`.

# Flash Cards

Q: What is the difference between ARG and ENV in a Dockerfile?
A: ARG is a build-time variable that is gone at run time; ENV is baked into the image and available to the process while the container runs.

Q: How do you pass configuration into a container without changing the image?
A: With environment variables, using -e KEY=value or --env-file for many at once; the app reads them at startup.

Q: Which restart policy restarts a container after crashes and reboots but respects a manual docker stop?
A: unless-stopped.

Q: What does a container exit code of 0 mean, and what does a non-zero code mean?
A: 0 means the container exited successfully; a non-zero code signals an error or that it was terminated (for example 137 often means it was killed, such as out of memory).

Q: What signals does docker stop send, and in what order?
A: It sends SIGTERM first to allow a graceful shutdown, then SIGKILL after a grace period (10 seconds by default) if the process has not exited.

Q: Why should secrets not be passed via ARG or ENV?
A: ARG values can appear in image build history and ENV values are baked into the image layers, so neither hides a secret; use dedicated secret mechanisms instead.

# Exercises

### Easy
Run the same `alpine` container twice with a different `-e GREETING=...` value each time, printing
the variable. Confirm the same image produces different output based only on configuration.

### Medium
Start a container with `--restart on-failure:2` whose command exits non-zero, wait, and use
`docker ps -a` and `docker inspect` to observe the restart attempts and the exit code.

### Challenging
Write a two-line Dockerfile that takes an `ARG APP_VERSION` and stamps it into an image `LABEL`.
Build it twice with different `--build-arg` values, then use `docker inspect` to show the label
differs — and confirm the variable is *not* present as an env var inside a running container.

# Further Reading

- Environment variables — <https://docs.docker.com/reference/cli/docker/container/run/#env>
- `ARG` vs `ENV` — <https://docs.docker.com/reference/dockerfile/#arg>
- Restart policies — <https://docs.docker.com/engine/containers/start-containers-automatically/>
- The Twelve-Factor App: Config — <https://12factor.net/config>
