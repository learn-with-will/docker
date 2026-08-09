---
id: lesson-05
slug: your-first-dockerfile
title: "Your First Dockerfile"
level: beginner
order: 5
duration: 26
tags:
  - dockerfile
  - build
  - images
  - cmd
  - build-context
---

# Learning Objectives

By the end of this lesson you will be able to:

- Write a Dockerfile using `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, and `CMD`.
- Build an image from it with `docker build -t`.
- Explain what the **build context** is and why it matters.
- Use a `.dockerignore` file to keep the build clean and fast.
- Tell the difference between `RUN` and `CMD`, and prefer the exec form.

# Why It Matters

Pulling other people's images is useful, but sooner or later you need to package **your own**
application. A **Dockerfile** is a plain-text recipe that tells Docker how to build an image step by
step. Once you can write one, you can containerize anything — and everything later (Compose, CI/CD)
builds on this skill.

# Concept Explanation

### What a Dockerfile is

A Dockerfile is a text file (named `Dockerfile`, no extension) containing **instructions**, one per
line, each written in UPPERCASE. Docker reads it top to bottom and produces an image, adding a layer
for most instructions.

### The core instructions

- **`FROM`** — the base image to start from. Every Dockerfile begins here.
- **`WORKDIR`** — sets the working directory inside the image (and creates it). Later `COPY`, `RUN`,
  and `CMD` run relative to it.
- **`COPY`** — copies files from your project into the image.
- **`RUN`** — executes a command **at build time**, and the result becomes part of the image (for
  example, installing dependencies).
- **`EXPOSE`** — documents which port the app listens on. It does **not** publish the port — that is
  still `-p` at run time.
- **`CMD`** — the default command to run **when a container starts**. There is exactly one effective
  `CMD` per image.

### RUN vs CMD — a key distinction

This trips everyone up at first:

- **`RUN` happens once, at build time.** It changes the image (e.g. `RUN pip install flask` bakes
  Flask into a layer).
- **`CMD` happens each time a container starts.** It is the process the container runs.

### Exec form vs shell form

`CMD` (and `RUN`, `ENTRYPOINT`) can be written two ways:

- **Exec form** (preferred): a JSON array — `CMD ["python", "-m", "http.server", "8000"]`. It runs
  the program directly, so it receives Unix signals like `SIGTERM` (important for clean `docker
  stop`).
- **Shell form**: `CMD python -m http.server 8000`. This wraps the command in `/bin/sh -c`, which
  can swallow signals.

Prefer the **exec form** (JSON array) for `CMD` and `ENTRYPOINT`.

### The build context

When you run `docker build .`, that `.` is the **build context** — the directory Docker packages up
and sends to the daemon so `COPY` can find your files. A `COPY` can only copy files **inside** the
context. If the context is huge (say it includes `node_modules` or `.git`), builds are slow and
images can bloat — which is what `.dockerignore` fixes.

### `.dockerignore`

A `.dockerignore` file (like `.gitignore`) lists paths to leave **out** of the build context:

```text
.git
node_modules
*.log
.env
```

This speeds up builds and prevents secrets or junk from being copied into your image.

# Key Terminology

- **Dockerfile** — a text recipe of instructions for building an image.
- **Instruction** — one build step (`FROM`, `COPY`, `RUN`, …), usually creating a layer.
- **Build context** — the directory sent to the daemon; `COPY` reads from here.
- **`.dockerignore`** — lists files to exclude from the build context.
- **Exec form** — the JSON-array way of writing `CMD`/`ENTRYPOINT`, which handles signals correctly.

# Syntax and Options

| Instruction | What it does | Notes |
| --- | --- | --- |
| `FROM image:tag` | Chooses the base image | Required; comes first |
| `WORKDIR /app` | Sets/creates the working directory | Later steps are relative to it |
| `COPY src dest` | Copies files from context into image | `dest` is inside the image |
| `RUN command` | Runs a command **at build time** | Result is baked into a layer |
| `EXPOSE 8000` | Documents the listening port | Does **not** publish it |
| `CMD ["exe","arg"]` | Default command **at run time** | Prefer the exec (array) form |

# Hands-On Walkthrough

Build a tiny image that serves a folder over HTTP — no application code required, just an
`index.html`.

```bash
# 1. Make a project folder with one page.
mkdir mysite && cd mysite
echo "<h1>Hello from my first image</h1>" > index.html
```

Create a file named `Dockerfile` next to it:

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000"]
```

```bash
# 2. Build it. -t names (tags) the image; the "." is the build context.
docker build -t mysite:1.0 .

# 3. Run it, publishing the port.
docker run -d --name mysite -p 8000:8000 mysite:1.0

# 4. Visit http://localhost:8000 — you'll see your page.
```

During the build you will see each instruction run in order:

```text
 => [1/3] FROM docker.io/library/python:3.13-slim
 => [2/3] WORKDIR /app
 => [3/3] COPY . .
 => exporting to image
 => => naming to docker.io/library/mysite:1.0
```

You built and ran your own image.

# Real World Analogy

A Dockerfile is a **recipe card**. `FROM` is "start with a store-bought pie crust" (the base image).
`RUN` steps are the prep you do once while cooking (chop, bake) — baked into the finished dish.
`CMD` is the serving instruction on the card — "reheat and serve" — followed every time someone
actually eats it. `.dockerignore` is deciding which ingredients from the pantry you *don't* bring to
the kitchen.

# Examples

## Example 1 — Basic: a static page (recap)

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000"]
```

**Why this works:** `FROM` gives you Python, `COPY . .` brings your files in, and the exec-form
`CMD` starts Python's built-in web server when the container runs. `EXPOSE` documents port 8000;
publishing still happens with `-p` at run time.

## Example 2 — Real-world: a Node app with dependencies

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Here `server.js` is a small program that starts an HTTP server on port 3000.

**Why this works:** Copying `package.json`/`package-lock.json` and running `npm ci` **before**
copying the rest of the code means the dependency layer is cached and only rebuilt when your
dependencies change — not on every code edit. This ordering trick is covered in depth in the
best-practices lesson.

## Example 3 — Best practice / edge case: add a `.dockerignore`

```text
.git
node_modules
npm-debug.log
.env
Dockerfile
```

**Why this works:** Excluding `node_modules` and `.git` from the build context makes the build far
faster and keeps large or sensitive files out of the image. `RUN npm ci` will recreate
`node_modules` inside the image cleanly.

# Common Mistakes

- **Thinking `EXPOSE` publishes a port.** It only documents it. You still need `-p` when you run.
- **Confusing `RUN` and `CMD`.** `RUN` builds the image (once); `CMD` runs when a container starts
  (every time).
- **Using shell form for `CMD`** and then finding `docker stop` is slow — the process did not receive
  `SIGTERM`. Use the exec (JSON-array) form.
- **Copying everything, including junk.** Without a `.dockerignore`, `COPY . .` can pull in
  `node_modules`, `.git`, and secrets.
- **Forgetting the `.` in `docker build -t name .`** — that dot is the build context, not optional.

# Best Practices

- Start `FROM` a **specific, slim** base image (`python:3.13-slim`, `node:22-alpine`).
- Always add a **`.dockerignore`** before your first build.
- Put things that change rarely (installing dependencies) **early**, and things that change often
  (your source) **late**, to use the build cache.
- Use the **exec form** for `CMD` and `ENTRYPOINT`.
- Tag every build with a meaningful version (`-t app:1.0`), not just `latest`.

# Summary

- A **Dockerfile** is a recipe of instructions; Docker runs them top to bottom to build an image.
- `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, and `CMD` are the core instructions.
- `RUN` runs **at build time** (bakes into the image); `CMD` runs **at container start**.
- `EXPOSE` documents a port; publishing still needs `-p` at run time.
- The **build context** (`.`) is what gets sent to the daemon; a **`.dockerignore`** keeps it lean.
- Build with `docker build -t name:tag .` and prefer the **exec form** for `CMD`.

# Flash Cards

Q: What is the difference between RUN and CMD in a Dockerfile?
A: RUN executes at build time and its result is baked into the image; CMD sets the default command that runs each time a container starts.

Q: Does EXPOSE publish a port?
A: No. EXPOSE only documents which port the app listens on; you still publish it at run time with -p host:container.

Q: What is the build context in docker build -t name .?
A: The directory (here ".") that Docker packages and sends to the daemon; COPY can only read files inside this context.

Q: Why prefer the exec form of CMD (a JSON array) over the shell form?
A: The exec form runs the program directly so it receives signals like SIGTERM, which lets docker stop shut it down cleanly; the shell form wraps it in /bin/sh -c and can swallow signals.

Q: What does a .dockerignore file do?
A: It lists paths to exclude from the build context, speeding up builds and keeping large or sensitive files (like .git, node_modules, .env) out of the image.

Q: Which instruction must appear first in a Dockerfile, and what does it do?
A: FROM, which chooses the base image the rest of the build starts from.

# Exercises

### Easy
Create a folder with an `index.html`, write the Python `http.server` Dockerfile from the
walkthrough, build it with a version tag, and run it. Confirm the page loads in your browser.

### Medium
Add a `.dockerignore` that excludes a dummy `secret.txt` and a `logs/` folder from your project.
Rebuild and use `docker exec` to confirm those files are **not** inside the image.

### Challenging
Take the Node example Dockerfile and reorder it so `COPY . .` comes *before* `RUN npm ci`. Explain
what this does to the build cache when you later change one line of source code, and why the original
ordering is better.

# Further Reading

- Dockerfile reference — <https://docs.docker.com/reference/dockerfile/>
- `docker build` reference — <https://docs.docker.com/reference/cli/docker/buildx/build/>
- Build context — <https://docs.docker.com/build/concepts/context/>
- `.dockerignore` — <https://docs.docker.com/build/concepts/context/#dockerignore-files>
