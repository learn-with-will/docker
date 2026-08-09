---
id: lesson-11
slug: docker-compose-basics
title: "Docker Compose: Multi-Container Apps"
level: intermediate
order: 11
duration: 28
tags:
  - compose
  - multi-container
  - compose-yaml
  - services
  - docker-compose
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what Docker Compose is and when to reach for it.
- Write a `compose.yaml` with multiple **services**, ports, volumes, and environment variables.
- Start and stop a whole app with `docker compose up` and `down`.
- Understand the default network Compose creates and how services find each other.
- Know why the top-level `version:` key is obsolete.

# Why It Matters

Running one container by hand is fine. Running a web app, a database, and a cache — each with the
right ports, volumes, environment, and network — quickly becomes a wall of long `docker run`
commands you cannot remember or share. **Docker Compose** replaces all of that with a single
declarative file that anyone can run with one command. It is how most people run multi-container
apps in development.

# Concept Explanation

### What Compose is

**Docker Compose** lets you define a multi-container application in a YAML file (`compose.yaml`) and
manage it as a unit. Compose v2 is a plugin invoked as **`docker compose`** (with a space) — the old
standalone `docker-compose` (v1) is retired.

### The shape of a compose file

The heart of the file is the **`services`** map — one entry per container:

```yaml
services:
  web:
    build: .                 # build from a local Dockerfile
    ports:
      - "8080:3000"          # host:container
    environment:
      - DATABASE_URL=postgres://db:5432/shop
    depends_on:
      - db
  db:
    image: postgres:16       # use a prebuilt image
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - dbdata:/var/lib/postgresql/data

volumes:
  dbdata:
```

Key points:

- Each service either **`build`**s from a Dockerfile or uses a prebuilt **`image`**.
- **`ports`**, **`environment`**, and **`volumes`** mirror the `docker run` flags you already know.
- Named **`volumes`** are declared at the bottom and referenced by services.

> **No `version:` key.** Older tutorials start the file with `version: "3"`. Under the current
> **Compose Specification** that top-level key is **obsolete** — leave it out. Compose warns if you
> include it.

### Services find each other by name

When you run Compose, it automatically creates a **network** for your app and puts every service on
it. That means services reach each other by **service name** — in the example above, the `web`
service connects to the database at the hostname **`db`**. You do not publish the database's port
unless *you* need to reach it from your host; `web` reaches it internally.

### The everyday commands

```bash
docker compose up -d      # build (if needed) and start everything, detached
docker compose ps         # list this app's services
docker compose logs -f    # follow logs from all services
docker compose down       # stop and remove containers and the network
```

`docker compose up` reads `compose.yaml` in the current directory, creates the network and volumes,
and starts every service. `down` tears it all back down (add `-v` to also remove named volumes).

# Key Terminology

- **Docker Compose** — a tool to define and run multi-container apps from a YAML file.
- **Service** — one containerized component defined under `services:`.
- **`compose.yaml`** — the Compose file (also accepts `docker-compose.yml`).
- **Compose Specification** — the standard defining the file format (where `version:` is obsolete).
- **Project network** — the network Compose creates so services resolve each other by name.

# Syntax and Options

| Key / Command | What it does |
| --- | --- |
| `services:` | Map of the app's containers |
| `build:` / `image:` | Build from a Dockerfile / use a prebuilt image |
| `ports:` | Publish ports (`"host:container"`) |
| `environment:` | Set environment variables |
| `volumes:` | Mount volumes/bind mounts (and declare named volumes) |
| `depends_on:` | Control start order |
| `docker compose up -d` | Start the whole app in the background |
| `docker compose down` | Stop and remove containers + network |

# Hands-On Walkthrough

```bash
# 1. In a folder, create compose.yaml with a web app and a database (see above).

# 2. Start everything with one command.
docker compose up -d
```

```text
[+] Running 3/3
 ✔ Network shop_default   Created
 ✔ Container shop-db-1    Started
 ✔ Container shop-web-1   Started
```

Compose created a network (`shop_default`), the `db` volume, and both containers.

```bash
# 3. See the services and follow their logs.
docker compose ps
docker compose logs -f web

# 4. Tear it all down when finished.
docker compose down
```

Notice the container names (`shop-web-1`, `shop-db-1`) — Compose prefixes them with the project name
(the folder name by default) so multiple projects do not collide.

# Real World Analogy

A `docker run` command is like giving a stagehand verbal instructions for one actor. **Compose** is
the **stage script**: it lists every actor (service), their marks (ports), their props (volumes),
and their cues (dependencies). One "action!" (`docker compose up`) and the whole scene assembles
correctly, the same way every time — and "cut!" (`docker compose down`) clears the stage.

# Examples

## Example 1 — Basic: an app and its database

```yaml
services:
  web:
    build: .
    ports:
      - "8080:3000"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - dbdata:/var/lib/postgresql/data
volumes:
  dbdata:
```

**Why this works:** `web` builds from the local Dockerfile and talks to the database at hostname
`db` over the project network. Only `web` publishes a port; the database is reachable internally and
its data persists in the `dbdata` volume.

## Example 2 — Real-world: add a cache and shared environment

```yaml
services:
  web:
    build: .
    ports:
      - "8080:3000"
    environment:
      - REDIS_URL=redis://cache:6379
  cache:
    image: redis:7
```

**Why this works:** Adding a third service is one more entry. `web` reaches Redis at `cache:6379`
because Compose put both services on the same network with name-based DNS.

## Example 3 — Best practice / edge case: rebuild after a code change

```bash
docker compose up -d --build
```

**Why this works:** By default `up` reuses existing images. `--build` forces Compose to rebuild
services that have a `build:` section, so your latest code is included — the pattern you use after
editing your app.

# Common Mistakes

- **Using `docker-compose` (v1, hyphen).** The current tool is `docker compose` (space, a plugin).
- **Adding `version: "3"` at the top.** It is obsolete under the Compose Specification; remove it.
- **Publishing every service's port.** Only publish what you need from the host; services talk to
  each other internally by name.
- **Expecting `depends_on` to wait until a service is *ready*.** It only controls start **order**,
  not readiness (the next lesson fixes this with healthchecks).
- **Forgetting `--build`** after code changes, then wondering why your edits do not appear.

# Best Practices

- Keep a single `compose.yaml` at the project root as the one command to run the whole app.
- Reference other services by **service name**, never by IP.
- Declare **named volumes** for stateful services so data survives `down`.
- Use `depends_on` for ordering, but rely on **healthchecks** (next lesson) for readiness.
- Commit `compose.yaml` to source control so teammates run the app identically.

# Summary

- **Docker Compose** (`docker compose`, v2 plugin) defines a multi-container app in `compose.yaml`.
- Each **service** either builds from a Dockerfile or uses an image, with `ports`, `environment`, and
  `volumes` mirroring `docker run`.
- Compose creates a **project network** so services reach each other by **service name**.
- `docker compose up -d` starts everything; `down` removes containers and the network.
- The top-level **`version:` key is obsolete** — omit it.

# Flash Cards

Q: What is Docker Compose used for?
A: Defining and running a multi-container application from a single YAML file (compose.yaml), managed as one unit with commands like docker compose up and down.

Q: How do services in a Compose file reach each other?
A: By service name. Compose puts all services on a shared project network with built-in DNS, so, for example, the web service connects to the database at the hostname db.

Q: Should a Compose file start with version: "3"?
A: No. The top-level version key is obsolete under the current Compose Specification and should be omitted.

Q: What is the difference between the build and image keys on a service?
A: build tells Compose to build the service from a local Dockerfile; image tells it to use a prebuilt image from a registry.

Q: Does depends_on wait until the dependency is ready to accept connections?
A: No. depends_on only controls start order; waiting for readiness requires a healthcheck plus a condition (covered in the next lesson).

Q: What does docker compose down do, and how do you also remove named volumes?
A: It stops and removes the app's containers and network; adding -v also removes the named volumes it created.

# Exercises

### Easy
Write a `compose.yaml` with a single `nginx` service that publishes port 8080. Run `docker compose
up -d`, open it in your browser, then `docker compose down`.

### Medium
Add a `postgres` service with a named volume and a password, and have a second service reference it
by the hostname `db`. Start the app, confirm both containers run with `docker compose ps`, and follow
the database logs.

### Challenging
Add a third service (for example `redis`) and pass its URL to your app via `environment`. Explain why
you did not need to publish the Redis port, and how the app resolves the `redis` hostname.

# Further Reading

- Docker Compose overview — <https://docs.docker.com/compose/>
- The Compose file (Compose Specification) — <https://docs.docker.com/reference/compose-file/>
- `docker compose` CLI — <https://docs.docker.com/reference/cli/docker/compose/>
- Compose Specification — <https://compose-spec.io/>
