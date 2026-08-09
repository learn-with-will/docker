---
id: lesson-04
slug: managing-containers
title: "Managing Containers"
level: beginner
order: 4
duration: 22
tags:
  - containers
  - docker-cli
  - exec
  - logs
  - ports
---

# Learning Objectives

By the end of this lesson you will be able to:

- Start, stop, restart, and remove containers.
- Run a command *inside* a running container with `docker exec`.
- Read a container's output with `docker logs`.
- Publish a container's port to your machine with `-p`.
- Name containers and clean them up automatically with `--rm`.

# Why It Matters

Most of your day-to-day Docker work is managing containers: starting a service, peeking inside to
debug it, watching its logs, and cleaning up. These handful of commands are the ones you will type
hundreds of times. Getting fluent with them makes everything else — Compose, CI/CD, debugging — feel
natural.

# Concept Explanation

### Running with useful flags

You already met `docker run`. A few flags make it far more useful:

- `--name <name>` — give the container a stable name instead of a random one.
- `-d` — detached (background).
- `-p <host>:<container>` — publish a port (below).
- `--rm` — automatically remove the container when it exits.
- `-e KEY=value` — set an environment variable (covered fully in a later lesson).

### Publishing ports

A container's network is isolated, so a server listening on port 80 *inside* the container is not
reachable from your machine until you **publish** it:

```bash
docker run -d -p 8080:80 nginx
```

Read `-p 8080:80` as **host:container** — "send traffic from port **8080 on my machine** to port
**80 in the container**." Now `http://localhost:8080` reaches nginx.

> Publishing is not the same as `EXPOSE` in a Dockerfile. `EXPOSE` is only documentation; `-p`
> actually opens the door. (More in the networking lesson.)

### Looking inside a running container

Two commands answer "what is it doing?":

- `docker logs <name>` prints what the main process has written to standard output/error. Add `-f`
  to **follow** (stream) new output live.
- `docker exec` runs an **additional** command inside a container that is already running. The most
  common use is opening a shell:

```bash
docker exec -it my-container sh
```

`-it` combines `-i` (keep input open) and `-t` (allocate a terminal), which together give you an
interactive prompt. Type `exit` to leave — the container keeps running, because `exec` started a
*separate* process.

### exec vs attach

`docker attach` connects your terminal to the container's **main** process. `docker exec` starts a
**new** process. For debugging you almost always want `exec` — with `attach`, pressing Ctrl+C can
stop the whole container.

### Stopping and removing

- `docker stop <name>` asks the process to shut down gracefully (it sends `SIGTERM`, then `SIGKILL`
  after a grace period).
- `docker start <name>` runs a stopped container again.
- `docker restart <name>` stops then starts it.
- `docker rm <name>` removes a **stopped** container. Add `-f` to force-remove a running one.

# Key Terminology

- **Publish a port (`-p host:container`)** — forward traffic from a host port to a container port.
- **`docker exec`** — run a new command inside a running container.
- **`-it`** — interactive + TTY, giving you a usable shell.
- **`docker logs`** — show the main process's output (`-f` to follow).
- **`--rm`** — delete the container automatically when it exits.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker run -d --name web -p 8080:80 nginx` | Run nginx in the background, named, port published |
| `docker logs -f web` | Stream the container's logs |
| `docker exec -it web sh` | Open a shell inside the running container |
| `docker stop web` / `docker start web` | Stop / start gracefully |
| `docker restart web` | Restart |
| `docker rm web` | Remove a stopped container (`-f` to force) |
| `docker stats` | Live CPU/memory usage per container |

# Hands-On Walkthrough

```bash
# 1. Start a named web server with a published port.
docker run -d --name web -p 8080:80 nginx

# 2. Confirm it's up, then open http://localhost:8080 in a browser.
docker ps

# 3. Follow its logs (Ctrl+C to stop following — the container keeps running).
docker logs -f web
```

```bash
# 4. Step inside and look around.
docker exec -it web sh
# now you're in the container:
#   ls /usr/share/nginx/html
#   cat /etc/nginx/nginx.conf
#   exit
```

```bash
# 5. Clean up.
docker stop web
docker rm web
```

# Real World Analogy

A running container is like a **food truck** parked on the street. `docker logs` is reading the
order screen to see what it is doing. `docker exec` is knocking on the side door and stepping in to
check the kitchen — the truck keeps serving while you look. `-p 8080:80` is the service window that
connects the customers on the sidewalk (your machine) to the counter inside (the container).

# Examples

## Example 1 — Basic: run, inspect, remove

```bash
docker run -d --name cache redis
docker exec -it cache redis-cli ping   # -> PONG
docker rm -f cache
```

**Why this works:** `exec` runs `redis-cli ping` as a second process inside the running Redis
container, which replies `PONG`. `rm -f` force-removes the still-running container in one step.

## Example 2 — Real-world: map a non-default host port

```bash
docker run -d --name api -p 3000:8080 myteam/orders-api:1.4.0
```

**Why this works:** The app listens on `8080` inside the container, but you expose it on `3000` on
your machine. Host and container ports do not have to match — handy when several containers each use
`8080` internally.

## Example 3 — Best practice / edge case: throwaway containers

```bash
docker run --rm -it python:3.13 python -c "print(2 ** 10)"
```

**Why this works:** `--rm` means no leftover container to clean up, and `-it` gives you an
interactive session. This is the perfect pattern for a quick experiment in a clean environment.

# Common Mistakes

- **Reversing `-p`.** It is `host:container`. `-p 8080:80` means host 8080 → container 80, not the
  other way around.
- **Using `attach` to debug** and accidentally killing the container with Ctrl+C. Prefer `exec`.
- **Running `exec` on a stopped container.** `exec` needs a *running* container; start it first.
- **Forgetting `-it` for a shell**, then getting a prompt you cannot type into.
- **Leaving stopped containers around.** They still take space; remove them or use `--rm`.

# Best Practices

- Name long-running containers (`--name`) so commands are readable and repeatable.
- Use `docker logs -f` as your first debugging step — most problems show up there.
- Reach for `docker exec -it <c> sh` (or `bash`) to explore a container from the inside.
- Use `--rm` for one-off and experimental containers so cleanup is automatic.
- Prefer `docker stop` (graceful) over `docker kill` (immediate) unless a container is truly stuck.

# Summary

- `docker run` with `--name`, `-d`, `-p`, and `--rm` covers most everyday needs.
- **Publish** ports with `-p host:container` to reach a container's server from your machine.
- `docker logs [-f]` shows the main process's output; `docker exec -it <c> sh` opens a shell as a
  **separate** process.
- Prefer `exec` over `attach` for debugging.
- `stop`, `start`, `restart`, and `rm` move a container through its lifecycle; `rm -f` removes a
  running one.

# Flash Cards

Q: How do you read the flag -p 8080:80?
A: host:container — forward traffic from port 8080 on your machine to port 80 inside the container.

Q: What does docker exec do, and how is it different from docker attach?
A: docker exec runs a new, separate command (often a shell) inside a running container; docker attach connects to the container's main process, where Ctrl+C can stop the whole container.

Q: What does the -it combination give you?
A: -i keeps input open and -t allocates a terminal, so together they give you an interactive shell inside the container.

Q: How do you watch a container's output live?
A: docker logs -f <container>, which follows (streams) new output until you press Ctrl+C.

Q: What does the --rm flag do?
A: It automatically removes the container when it exits, so there is nothing to clean up afterward.

Q: What is the difference between docker stop and docker kill?
A: docker stop asks the process to shut down gracefully (SIGTERM, then SIGKILL after a grace period); docker kill sends the kill signal immediately.

# Exercises

### Easy
Run an `nginx` container with a name and `-p 8080:80`, open it in your browser, then use
`docker logs` to see the request you just made appear in the output.

### Medium
Start a `redis` container, use `docker exec -it <name> redis-cli` to open its CLI, run `SET greeting
hello` and `GET greeting`, then exit and remove the container.

### Challenging
Run the same image twice, publishing each to a *different* host port but the same container port
(for example `-p 8080:80` and `-p 8081:80`). Explain why this works and when you would need it.

# Further Reading

- `docker exec` reference — <https://docs.docker.com/reference/cli/docker/container/exec/>
- `docker logs` reference — <https://docs.docker.com/reference/cli/docker/container/logs/>
- Publishing ports — <https://docs.docker.com/engine/network/#published-ports>
- `docker container` commands — <https://docs.docker.com/reference/cli/docker/container/>
