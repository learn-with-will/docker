---
id: lesson-06
slug: volumes-and-bind-mounts
title: "Data Persistence: Volumes & Bind Mounts"
level: beginner
order: 6
duration: 24
tags:
  - volumes
  - bind-mounts
  - persistence
  - storage
  - tmpfs
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why data written to a container's writable layer does not survive removal.
- Use a **named volume** to persist data across container restarts and re-creations.
- Use a **bind mount** to share a folder between your host and a container.
- Choose between volumes, bind mounts, and `tmpfs` for a given job.
- Create, list, inspect, and remove volumes.

# Why It Matters

Containers are disposable — you throw them away and start fresh. That is a feature, but it raises a
real question: **what happens to my database's data, or my uploaded files, when the container is
gone?** The answer is *nothing good*, unless you store that data outside the container. Volumes and
bind mounts are how you keep data safe, share files during development, and run stateful services
like databases.

# Concept Explanation

### The writable layer is not storage

When a container runs, Docker adds a thin **writable layer** on top of the read-only image. Files
the app creates go there. But that layer is **tied to the container**: `docker rm` deletes it, and
the data is gone. It is scratch space, not durable storage.

To keep data, you **mount** storage from outside the container. Docker offers three kinds.

### 1. Named volumes (the default choice)

A **named volume** is storage managed by Docker, living in an area Docker controls on the host. You
refer to it by name, and it lives independently of any container:

```bash
docker volume create appdata
docker run -d --name db -v appdata:/var/lib/postgresql/data postgres:16
```

Even if you remove and recreate the `db` container, the `appdata` volume — and everything in it —
remains. This is the recommended way to persist application data.

### 2. Bind mounts (share a host folder)

A **bind mount** maps a **specific folder on your machine** into the container. You control the exact
path:

```bash
docker run -d --name web -p 8080:80 -v "$(pwd)/site:/usr/share/nginx/html" nginx
```

Now the container serves files straight from your `./site` folder. Edit a file on your host and the
container sees the change immediately. Bind mounts are perfect for **local development** (live-editing
source code) but tie the container to your host's directory layout.

### 3. tmpfs (memory only)

A **`tmpfs` mount** stores data in the host's **memory**, never on disk. It vanishes when the
container stops. Use it for sensitive or temporary scratch data you never want written to disk.

```bash
docker run --tmpfs /tmp alpine sh -c "echo hi > /tmp/x && cat /tmp/x"
```

### `-v` vs `--mount`

There are two syntaxes. The older `-v` (or `--volume`) is compact:
`-v <name-or-path>:<container-path>`. The newer `--mount` is more explicit and readable:

```bash
docker run --mount type=volume,source=appdata,target=/data postgres:16
```

Both work; `--mount` is clearer for scripts and is the recommended form in newer docs. A key gotcha
with `-v`: if the host path in a bind mount does not exist, Docker creates an empty **directory**;
`--mount` errors instead, which is usually safer.

### Volumes vs bind mounts at a glance

| | Named volume | Bind mount |
| --- | --- | --- |
| Managed by | Docker | You |
| Location | Docker's storage area | Any path you choose |
| Best for | App/database data | Live-editing source in dev |
| Portable across machines | Yes | No (host paths differ) |

# Key Terminology

- **Writable layer** — a container's scratch space; deleted with the container.
- **Named volume** — Docker-managed persistent storage referenced by name.
- **Bind mount** — a specific host directory mapped into the container.
- **tmpfs mount** — in-memory storage that never touches disk.
- **Mount** — attaching external storage at a path inside the container.

# Syntax and Options

| Command | What it does |
| --- | --- |
| `docker volume create <name>` | Create a named volume |
| `docker volume ls` | List volumes |
| `docker volume inspect <name>` | Show a volume's details (including its host location) |
| `docker run -v <name>:/path ...` | Mount a named volume |
| `docker run -v "$(pwd)/dir:/path" ...` | Bind-mount a host folder |
| `docker run --mount type=volume,source=<name>,target=/path ...` | Explicit volume mount |
| `docker volume rm <name>` | Remove a volume |
| `docker volume prune` | Remove unused volumes |

# Hands-On Walkthrough

Prove that a volume outlives its container.

```bash
# 1. Create a volume and write a file into it via a throwaway container.
docker volume create notes
docker run --rm -v notes:/data alpine sh -c "echo 'remember me' > /data/note.txt"

# 2. The first container is gone (--rm). Start a NEW one on the same volume.
docker run --rm -v notes:/data alpine cat /data/note.txt
```

```text
remember me
```

The data survived because it lives in the `notes` volume, not in either container.

```bash
# 3. See where Docker keeps it, then clean up.
docker volume inspect notes
docker volume rm notes
```

Now compare with a bind mount:

```bash
mkdir site && echo "<h1>Live edit me</h1>" > site/index.html
docker run -d --name web -p 8080:80 -v "$(pwd)/site:/usr/share/nginx/html" nginx
# Edit site/index.html on your host, refresh http://localhost:8080 — the change shows instantly.
docker rm -f web
```

# Real World Analogy

The container's writable layer is like a **hotel room whiteboard**: scribble on it, but when you
check out (remove the container) it gets wiped. A **named volume** is a **storage locker** you rent
separately — you can switch rooms (containers) and your things stay in the locker. A **bind mount**
is like keeping your files in your **own desk drawer at home** and giving the hotel a passthrough to
it — very convenient, but it only works at *your* house (your host paths).

# Examples

## Example 1 — Basic: persist a database

```bash
docker run -d --name db -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16
```

**Why this works:** PostgreSQL stores its data under `/var/lib/postgresql/data`. Mounting the
`pgdata` volume there means your tables survive `docker rm db` and a later recreate. Without the
volume, removing the container would destroy the database.

## Example 2 — Real-world: live-edit code in development

```bash
docker run -d --name dev -p 3000:3000 -v "$(pwd):/app" -w /app node:22-alpine npm run dev
```

**Why this works:** The bind mount maps your project into `/app`, so saving a file on your host is
instantly visible to the running dev server in the container — no rebuild needed. (`-w` sets the
working directory.)

## Example 3 — Best practice / edge case: keep secrets off disk with tmpfs

```bash
docker run --rm --tmpfs /run/secrets:rw alpine sh -c "echo token > /run/secrets/t && cat /run/secrets/t"
```

**Why this works:** The `tmpfs` mount lives only in memory, so the temporary secret never lands on
disk and disappears when the container stops — useful for short-lived sensitive data.

# Common Mistakes

- **Storing important data in the writable layer.** It is deleted with the container. Use a volume.
- **Expecting a bind mount to work on a teammate's machine** with a different folder layout. Host
  paths are not portable — prefer named volumes for anything shared.
- **Bind-mounting over a folder the image needs**, hiding the image's own files at that path (an
  empty host folder will "cover" them).
- **Using `-v` with a typo'd host path**, silently creating an empty directory. `--mount` errors
  instead, which catches the mistake.
- **Running `docker volume prune` carelessly** and deleting a volume that still held data you needed.

# Best Practices

- Default to **named volumes** for application and database data.
- Use **bind mounts** mainly for **local development** (live-editing source).
- Prefer the explicit **`--mount`** syntax in scripts and docs.
- Back up volumes you care about (you can `docker run` a helper container to `tar` a volume's
  contents).
- Treat `tmpfs` as the choice for **in-memory, never-persisted** scratch data.

# Summary

- A container's **writable layer** is scratch space and is deleted on `docker rm` — it is not
  storage.
- **Named volumes** are Docker-managed, persistent, and portable; they are the default for keeping
  data.
- **Bind mounts** map a specific host folder into the container — great for dev, not portable.
- **tmpfs** keeps data in memory only.
- Manage volumes with `docker volume create/ls/inspect/rm`; prefer the explicit `--mount` syntax.

# Flash Cards

Q: What happens to data in a container's writable layer when the container is removed?
A: It is deleted. The writable layer is scratch space tied to the container, not durable storage.

Q: What is a named volume and why use it?
A: Storage managed by Docker and referred to by name; it persists independently of any container, so data survives removing and recreating containers. It is the default choice for app and database data.

Q: What is a bind mount, and when is it most useful?
A: A mapping of a specific host folder into the container. It is ideal for local development because edits on the host are instantly visible inside the container.

Q: How does a tmpfs mount differ from a volume or bind mount?
A: A tmpfs mount stores data only in the host's memory, never on disk, and it disappears when the container stops.

Q: Why prefer named volumes over bind mounts for data shared across machines?
A: Named volumes are managed by Docker and portable; bind mounts depend on exact host paths, which differ from machine to machine.

Q: What is one advantage of the --mount syntax over -v for bind mounts?
A: If the host path does not exist, --mount errors out, whereas -v silently creates an empty directory, which can hide mistakes.

# Exercises

### Easy
Create a named volume, write a file into it from a `--rm` container, then read that file from a
second `--rm` container. Explain why the data survived.

### Medium
Bind-mount a folder of static HTML into an `nginx` container, open it in your browser, edit a file
on your host, and confirm the change appears without rebuilding.

### Challenging
Run a `postgres` container with a named volume for its data directory. Create a table and insert a
row, remove the container, then start a new `postgres` container on the *same* volume and confirm
the row is still there. Explain what would have happened without the volume.

# Further Reading

- Storage overview — <https://docs.docker.com/engine/storage/>
- Volumes — <https://docs.docker.com/engine/storage/volumes/>
- Bind mounts — <https://docs.docker.com/engine/storage/bind-mounts/>
- tmpfs mounts — <https://docs.docker.com/engine/storage/tmpfs/>
