---
id: lesson-07
slug: container-networking
title: "Container Networking Basics"
level: beginner
order: 7
duration: 24
tags:
  - networking
  - bridge
  - dns
  - ports
  - docker-network
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what the default **bridge** network is and its limitations.
- Create a **user-defined bridge** network and let containers find each other by name.
- Distinguish **publishing** a port from `EXPOSE`.
- Describe when to use the `host` and `none` network modes.
- Create, inspect, and connect containers to networks.

# Why It Matters

Real applications are rarely one container. A web app talks to a database; an API talks to a cache.
For that to work, containers need to reach each other, and you need to reach them from your machine.
Docker networking is how those connections happen. Get it right and multi-container apps "just
work"; get it wrong and you will chase mysterious "connection refused" errors.

# Concept Explanation

### Every container gets a network

By default, Docker connects each container to a **bridge** network — a private virtual network on
the host. Containers on it get their own internal IP addresses and can reach the outside internet,
but they are isolated from your host's network unless you **publish** a port.

### The default bridge vs a user-defined bridge

There are two flavors of bridge network, and the difference matters:

- The **default bridge** (named `bridge`) is what containers join if you say nothing. On it,
  containers can talk only by **IP address** — there is no automatic name resolution.
- A **user-defined bridge** (one you create) adds **automatic DNS**: containers on the same
  user-defined network can reach each other by **container name**. This is the single most useful
  networking fact in Docker.

```bash
docker network create appnet
docker run -d --name db --network appnet postgres:16
docker run -d --name api --network appnet myteam/api:1.0
# Inside "api", the hostname "db" now resolves to the database container.
```

Because `api` and `db` share `appnet`, the API can connect to `db:5432` — no IP addresses, no
guessing. **Always put related containers on a shared user-defined network.**

### Publishing vs EXPOSE (again, because it matters)

- **`EXPOSE`** (in a Dockerfile) is documentation. It signals "this app listens on port X." It opens
  nothing.
- **Publishing** with `-p host:container` actually forwards a host port to a container port so your
  machine (and the outside world) can reach it.

Two containers on the same network talk to each other over the container's port directly — you do
**not** need to publish a port for container-to-container traffic. You publish only what you want
reachable from outside.

### Other network modes

- **`host`** (Linux only) — the container shares the host's network directly, with no isolation and
  no separate IP. Fast, but you lose port mapping and isolation. Not available the same way on
  Docker Desktop for macOS/Windows.
- **`none`** — the container gets no network at all. Useful for fully isolated, offline tasks.

# Key Terminology

- **Bridge network** — a private virtual network on the host that containers join by default.
- **User-defined bridge** — a bridge network you create; it provides DNS by container name.
- **Publish (`-p`)** — forward a host port to a container port for outside access.
- **`host` network** — share the host's network stack directly (Linux).
- **`none` network** — no networking.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker network ls` | List networks |
| `docker network create <name>` | Create a user-defined bridge network |
| `docker run --network <name> ...` | Attach a container to a network at start |
| `docker network connect <net> <container>` | Attach a running container to a network |
| `docker network inspect <name>` | Show a network's details and connected containers |
| `docker run -p 8080:80 ...` | Publish a container port to the host |
| `docker run --network host ...` | Use the host network (Linux) |

# Hands-On Walkthrough

Wire two containers together by name.

```bash
# 1. Create a user-defined network.
docker network create appnet

# 2. Start a Redis container on it (no published port needed for internal use).
docker run -d --name cache --network appnet redis:7

# 3. From another container on the SAME network, reach it by name "cache".
docker run --rm --network appnet redis:7 redis-cli -h cache ping
```

```text
PONG
```

The second container resolved the hostname `cache` to the Redis container automatically, because
both are on `appnet`. Now contrast with the default bridge:

```bash
# On the default bridge, name resolution does NOT work:
docker run -d --name cache2 redis:7
docker run --rm redis:7 redis-cli -h cache2 ping   # fails: cannot resolve "cache2"
docker rm -f cache cache2
docker network rm appnet
```

# Real World Analogy

A user-defined network is like a **private office with a receptionist**. When someone asks for
"Accounting," the receptionist knows exactly which desk that is (DNS by name). The **default
bridge** is like a building with no receptionist — you can only reach a desk if you already know its
exact extension number (IP address). **Publishing a port** is the building's public front door:
only the rooms you choose to put a door on are reachable from the street.

# Examples

## Example 1 — Basic: put an app and its database together

```bash
docker network create shopnet
docker run -d --name db --network shopnet -e POSTGRES_PASSWORD=secret postgres:16
docker run -d --name web --network shopnet -p 8080:3000 myteam/shop:1.0
```

**Why this works:** `web` and `db` share `shopnet`, so the app connects to the database at the
hostname `db`. Only `web` publishes a port (`8080`), because only the web app needs to be reachable
from your browser.

## Example 2 — Real-world: connect a running container to a new network

```bash
docker network create metrics
docker network connect metrics web
```

**Why this works:** A container can belong to **multiple** networks. Here `web` keeps its original
network and also joins `metrics`, so a monitoring container on `metrics` can reach it — without
restarting `web`.

## Example 3 — Best practice / edge case: no network at all

```bash
docker run --rm --network none alpine sh -c "ip addr | grep -c inet"
```

**Why this works:** `--network none` gives the container no external networking (only loopback). It
is the right choice for a task that must not touch the network — a strong isolation default for
untrusted or purely local work.

# Common Mistakes

- **Using the default bridge and expecting name resolution.** Container-name DNS works only on
  **user-defined** networks. Create one.
- **Publishing a port for container-to-container traffic.** You do not need `-p` for containers on
  the same network to talk; publish only what the outside must reach.
- **Confusing `EXPOSE` with publishing.** `EXPOSE` documents; `-p` opens.
- **Assuming `--network host` works everywhere.** On Docker Desktop (macOS/Windows) host networking
  behaves differently than on native Linux.
- **Hard-coding container IPs.** They change; use container names on a user-defined network instead.

# Best Practices

- Create a **user-defined bridge** per app and put its containers on it, so they resolve each other
  by name.
- **Publish only what needs outside access** (usually just the front-end or API).
- Reference other services by **container/service name**, never by IP.
- Use **`none`** for tasks that should have no network access.
- Give networks meaningful names (`shopnet`, `metrics`) so `docker network ls` is readable.

# Summary

- Containers join a **bridge** network by default and get private IPs; publish a port to reach them
  from your machine.
- The **default bridge** has no name resolution; a **user-defined bridge** gives containers **DNS by
  name** — the key to multi-container apps.
- **`EXPOSE`** documents a port; **`-p`** publishes it. Same-network containers talk without
  publishing.
- **`host`** shares the host's network (Linux); **`none`** disables networking.
- Manage it with `docker network create/ls/inspect/connect`.

# Flash Cards

Q: What is the key advantage of a user-defined bridge network over the default bridge?
A: A user-defined bridge provides automatic DNS, so containers on it can reach each other by container name; the default bridge only supports communication by IP address.

Q: Do two containers on the same network need a published port to talk to each other?
A: No. Publishing (-p) is only for reaching a container from the host or outside world; containers on the same network talk directly over the container port.

Q: What is the difference between EXPOSE and publishing a port?
A: EXPOSE in a Dockerfile only documents the listening port; publishing with -p host:container actually forwards a host port to the container so it is reachable from outside.

Q: How should containers refer to each other instead of using IP addresses?
A: By container (or service) name on a shared user-defined network, since Docker resolves those names via built-in DNS and IPs can change.

Q: What does the none network mode do?
A: It gives the container no external networking (only loopback), which is useful for fully isolated tasks.

Q: Can a container be connected to more than one network?
A: Yes. You can attach a container to multiple networks, even while it is running, with docker network connect.

# Exercises

### Easy
Create a user-defined network, start two containers on it, and from one `ping` or connect to the
other by name. Then repeat on the default bridge and observe that name resolution fails.

### Medium
Run a database and a web app on the same user-defined network, publishing only the web app's port.
Confirm you can reach the web app in your browser but the database has no published port.

### Challenging
Start a container on one network, then use `docker network connect` to attach it to a second network
without restarting it. Use `docker network inspect` on both networks to confirm the container appears
in each, and explain a scenario where this is useful.

# Further Reading

- Networking overview — <https://docs.docker.com/engine/network/>
- Bridge networks — <https://docs.docker.com/engine/network/drivers/bridge/>
- `docker network` commands — <https://docs.docker.com/reference/cli/docker/network/>
- Published ports — <https://docs.docker.com/engine/network/#published-ports>
