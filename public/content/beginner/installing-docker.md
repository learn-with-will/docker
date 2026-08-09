---
id: lesson-02
slug: installing-docker
title: "Installing Docker & Running Your First Container"
level: beginner
order: 2
duration: 18
tags:
  - setup
  - docker-desktop
  - docker-run
  - lifecycle
  - cli
---

# Learning Objectives

By the end of this lesson you will be able to:

- Choose between **Docker Engine** and **Docker Desktop** for your operating system.
- Confirm Docker is installed and working.
- Run your first container with `docker run`.
- List running and stopped containers with `docker ps`.
- Describe the states a container moves through in its **lifecycle**.

# Why It Matters

Before you can learn anything hands-on, Docker has to be running on your machine. Just as
important, you need a correct mental model of what `docker run` actually *does* — otherwise the
output is confusing ("Why did my container disappear?"). This lesson gets Docker working and walks
one container through its whole life so nothing later feels like magic.

# Concept Explanation

### Docker Engine vs Docker Desktop

There are two ways people "install Docker":

- **Docker Engine** is the core: the daemon (`dockerd`), the CLI, and the runtime. On Linux you
  install Docker Engine directly and it runs natively.
- **Docker Desktop** is an application for **macOS, Windows, and Linux** that bundles Docker Engine
  inside a small managed Linux virtual machine, and adds a GUI, settings, and extras. On macOS and
  Windows this VM is how Linux containers run at all, because those systems do not have a Linux
  kernel.

> Docker Desktop is free for personal use, education, and small businesses, but larger
> organizations need a paid subscription. Check the current terms on Docker's site.

Either way, once it is running you use the **same `docker` commands**.

### Confirming it works

Two quick checks:

```bash
docker version
docker info
```

`docker version` prints the client and daemon versions. If the daemon section is missing or you see
"Cannot connect to the Docker daemon," the engine is not running — start Docker Desktop (or the
Docker service on Linux) and try again.

### Your first container

The classic first run:

```bash
docker run hello-world
```

The daemon pulls the tiny `hello-world` image (if needed), runs it, and the container prints a
message explaining what just happened, then exits.

### The container lifecycle

A container moves through a small set of states:

```text
        docker run
            │
            ▼
      ┌───────────┐   docker stop / process ends   ┌───────────┐
      │  RUNNING  │ ─────────────────────────────▶ │  EXITED   │
      └───────────┘                                └───────────┘
            ▲                                             │
            │ docker start                    docker rm   │
            └─────────────────────────────────┐          ▼
                                               │      (removed)
                                         docker start
```

- **Created** — the container exists but has not started (you rarely see this directly).
- **Running** — the main process is executing.
- **Exited** — the main process finished (or was stopped). The container still exists and can be
  started again or inspected.
- **Removed** — the container is deleted with `docker rm` and is gone.

A crucial idea: **a container runs only as long as its main process runs.** `hello-world` prints a
message and its process ends, so the container immediately exits. That is not an error — it did its
job.

### Foreground vs detached

By default a container runs in the **foreground**, tying up your terminal. Add `-d` (detached) to
run it in the background:

```bash
docker run -d nginx
```

# Key Terminology

- **Docker Engine** — the core daemon, CLI, and runtime; runs natively on Linux.
- **Docker Desktop** — an app (macOS/Windows/Linux) that runs Docker Engine in a managed VM with a
  GUI.
- **`docker run`** — creates a container from an image and starts it.
- **`docker ps`** — lists containers (running by default; `-a` shows all).
- **Detached mode (`-d`)** — runs the container in the background.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker version` | Show client and daemon versions (proves the daemon is reachable) |
| `docker run <image>` | Create and start a container in the foreground |
| `docker run -d <image>` | Run it in the background (detached) |
| `docker ps` | List running containers |
| `docker ps -a` | List all containers, including exited ones |
| `docker start <name>` | Start a stopped container again |
| `docker rm <name>` | Remove a stopped container |

# Hands-On Walkthrough

```bash
# 1. Prove the daemon is up.
docker version

# 2. Run the classic first container (foreground).
docker run hello-world

# 3. It exited immediately. Where did it go? List ALL containers:
docker ps -a
```

You will see something like:

```text
CONTAINER ID   IMAGE         COMMAND    CREATED          STATUS                      NAMES
9b1c0f2e4a7d   hello-world   "/hello"   3 seconds ago    Exited (0) 2 seconds ago    quirky_swan
```

`Exited (0)` means the process finished successfully (exit code 0). The container is stopped, not
running — that is why plain `docker ps` did not show it.

```bash
# 4. Clean it up.
docker rm quirky_swan
```

# Real World Analogy

Running a container is like pressing **play** on a program. `docker run` presses play; when the
program reaches the end, it stops on its own — just like a song ending. A stopped container is like
a paused track still in your playlist: it is still there (`docker ps -a`) until you delete it
(`docker rm`).

# Examples

## Example 1 — Basic: a container that exits right away

```bash
docker run alpine echo "hi"
```

**Why this works:** `alpine` is a tiny Linux image. Its process here is `echo "hi"`, which prints
and finishes — so the container runs for a split second and exits. Short-lived containers are
completely normal.

## Example 2 — Real-world: a long-running service in the background

```bash
docker run -d --name site -p 8080:80 nginx
docker ps
```

**Why this works:** `nginx` runs a web server that stays up, so the container keeps running. `-d`
detaches it so your terminal is free, and `docker ps` shows it because the process is still alive.
Visit `http://localhost:8080` to see it.

```text
CONTAINER ID   IMAGE   COMMAND                  STATUS         PORTS                  NAMES
c4d5e6f7a8b9   nginx   "/docker-entrypoint.…"   Up 5 seconds   0.0.0.0:8080->80/tcp   site
```

## Example 3 — Best practice / edge case: start, stop, start again

```bash
docker stop site
docker ps -a      # STATUS shows "Exited"
docker start site # bring it back
```

**Why this works:** Stopping a container ends its process but keeps the container (and its writable
layer) around, so `docker start` can run it again without recreating it.

# Common Mistakes

- **"My container immediately exited — it's broken."** Usually it is not. The container's process
  finished. Only long-running processes (servers, databases) keep a container alive.
- **Using `docker ps` and thinking a stopped container vanished.** `docker ps` shows only running
  containers; add `-a` to see stopped ones.
- **"Cannot connect to the Docker daemon."** The engine is not running. Start Docker Desktop or the
  Docker service.
- **Forgetting `-d` for services**, then wondering why the terminal is stuck. Foreground is the
  default.

# Best Practices

- Give long-running containers a clear name with `--name` so you are not stuck with random names.
- Use `docker ps -a` while learning, so you can see exactly what happened to each container.
- Remove containers you are done with (`docker rm`) to keep `docker ps -a` readable.
- On macOS/Windows, keep Docker Desktop running whenever you plan to use `docker`.

# Summary

- **Docker Engine** is the core (native on Linux); **Docker Desktop** bundles it in a managed VM
  with a GUI for macOS, Windows, and Linux.
- `docker version` confirms the daemon is reachable.
- `docker run` creates and starts a container; a container lives only as long as its main process.
- `docker ps` shows running containers; `docker ps -a` shows all of them.
- Containers move through **created → running → exited → removed**, and you can `start` a stopped
  one again before you `rm` it.

# Flash Cards

Q: What is the difference between Docker Engine and Docker Desktop?
A: Docker Engine is the core daemon, CLI, and runtime (native on Linux); Docker Desktop is an app that runs Docker Engine inside a managed VM with a GUI, for macOS, Windows, and Linux.

Q: Why does a hello-world container exit immediately?
A: A container runs only as long as its main process; hello-world prints a message and its process ends, so the container exits right away. That is normal, not an error.

Q: What is the difference between docker ps and docker ps -a?
A: docker ps lists only running containers; docker ps -a lists all containers, including stopped (exited) ones.

Q: What does the -d flag do on docker run?
A: It runs the container in detached mode — in the background — instead of the foreground, freeing your terminal.

Q: What does "Exited (0)" mean in a container's status?
A: The container's main process finished, and the exit code 0 means it finished successfully.

Q: How do you run a stopped container again without recreating it?
A: Use docker start <name>, which restarts the existing (stopped) container and its writable layer.

# Exercises

### Easy
Run `docker run hello-world`, then `docker ps -a`. Find your container's status and explain why it
is not shown by plain `docker ps`.

### Medium
Start an `nginx` container in the background with a name and a published port, confirm it in
`docker ps`, open it in your browser, then stop and remove it.

### Challenging
Run a container, stop it, start it again, and stop it once more. At each step, predict what
`docker ps` and `docker ps -a` will show before you run them, then check whether you were right.

# Further Reading

- Get Docker (install guides) — <https://docs.docker.com/get-docker/>
- Docker Desktop overview — <https://docs.docker.com/desktop/>
- `docker run` reference — <https://docs.docker.com/reference/cli/docker/container/run/>
- `docker ps` reference — <https://docs.docker.com/reference/cli/docker/container/ls/>
