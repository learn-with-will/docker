---
id: lesson-09
slug: dockerfile-best-practices
title: "Dockerfile Best Practices & Layer Caching"
level: intermediate
order: 9
duration: 26
tags:
  - dockerfile
  - layer-cache
  - dockerignore
  - entrypoint
  - best-practices
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain how the build cache decides which layers to reuse.
- Order Dockerfile instructions so dependency installs stay cached.
- Reduce image size and layers with combined `RUN` steps and a good `.dockerignore`.
- Choose between `CMD` and `ENTRYPOINT`, and combine them.
- Apply a checklist of everyday Dockerfile best practices.

# Why It Matters

A careless Dockerfile rebuilds everything on every code change, producing slow builds and bloated
images. A well-ordered one rebuilds in seconds and ships lean images. The difference is almost
entirely about understanding **layer caching** — the single most valuable Dockerfile skill — plus a
handful of habits that keep images small, secure, and predictable.

# Concept Explanation

### How the build cache works

Each instruction in a Dockerfile produces a **layer**. When you rebuild, Docker walks the
instructions top to bottom and, for each one, asks: *"have I built this exact instruction, with the
same inputs, before?"*

- If **yes**, it reuses the cached layer — instantly.
- If **no**, it rebuilds that layer **and every layer after it**.

That last part is the key: **a cache miss cascades.** Once one layer changes, nothing below it can
be reused. For `COPY` and `ADD`, the "inputs" include the *contents* of the files being copied — so
changing a copied file invalidates that layer and everything after.

### Order for cache friendliness

Put instructions that change **rarely** near the top and things that change **often** near the
bottom. The classic pattern: copy your dependency manifest and install dependencies **before**
copying the rest of your source.

```dockerfile
FROM node:22-alpine
WORKDIR /app

# Changes rarely -> stays cached across code edits
COPY package.json package-lock.json ./
RUN npm ci

# Changes often -> only this layer (and below) rebuilds when you edit code
COPY . .
CMD ["node", "server.js"]
```

Now editing `server.js` reuses the cached `npm ci` layer; only the final `COPY` re-runs. If you had
copied everything first, every code edit would reinstall all dependencies.

### Fewer, cleaner layers

Each `RUN` is a layer. Chain related commands with `&&`, and clean up in the **same** `RUN` so the
junk never becomes part of a layer:

```dockerfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

Cleaning up in a *later* `RUN` would not shrink the image, because the earlier layer already
contains the files.

### A strong `.dockerignore`

Keep the build context small and safe:

```text
.git
node_modules
dist
*.log
.env
```

Smaller context = faster builds and no accidental copying of secrets or huge folders.

### CMD vs ENTRYPOINT

Both define what runs, but they play different roles:

- **`CMD`** provides **default arguments** (or a default command) that are **easy to override** at
  `docker run`.
- **`ENTRYPOINT`** sets the **fixed executable** that always runs; arguments after it (or in `CMD`)
  are appended.

A common, powerful pattern is to combine them — `ENTRYPOINT` names the program, `CMD` gives default
arguments:

```dockerfile
ENTRYPOINT ["python", "-m", "http.server"]
CMD ["8000"]
```

`docker run img` serves on 8000; `docker run img 9000` serves on 9000 (the `CMD` default is
overridden, the `ENTRYPOINT` stays). Use the **exec (array) form** for both.

# Key Terminology

- **Build cache** — reuse of previously built layers when an instruction and its inputs are
  unchanged.
- **Cache invalidation** — a changed instruction/file forces that layer and all below it to rebuild.
- **`ENTRYPOINT`** — the fixed executable a container always runs.
- **`CMD`** — default arguments/command, easily overridden at run time.
- **`--no-install-recommends`** — installs only required packages, keeping images smaller (Debian/
  Ubuntu bases).

# Syntax and Options

| Technique | Why |
| --- | --- |
| Copy manifest + install deps before source | Keeps the dependency layer cached across code edits |
| Chain `RUN` with `&&` and clean up in-line | Fewer, smaller layers |
| Pin base image tags (`node:22-alpine`) | Reproducible, predictable builds |
| `.dockerignore` | Small context, no secret leakage |
| `ENTRYPOINT` + `CMD` | Fixed program with overridable default args |

# Hands-On Walkthrough

See caching in action.

```bash
# Build once (cold — everything runs).
docker build -t cachedemo .

# Change ONLY a source file, not dependencies.
echo "// tweak" >> server.js

# Build again — watch the output.
docker build -t cachedemo .
```

With the manifest-first ordering, the rebuild shows:

```text
 => CACHED [2/5] WORKDIR /app
 => CACHED [3/5] COPY package.json package-lock.json ./
 => CACHED [4/5] RUN npm ci
 => [5/5] COPY . .          ← only this re-ran
```

`CACHED` on the dependency layers means the slow `npm ci` was skipped entirely. Reverse the ordering
(copy source before installing) and you would see `npm ci` run every single time.

# Real World Analogy

Building an image is like **assembling a sandwich in a fixed order**. If you change the bottom slice
(a low, early layer), you must rebuild everything stacked on top. So you put the parts that rarely
change at the bottom (the plate, the base) and the part you swap constantly (the filling — your code)
at the top. Rearranging so the volatile part is on top means most of the sandwich is reused each
time.

# Examples

## Example 1 — Basic: cache-friendly ordering

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

**Why this works:** `requirements.txt` changes far less often than your code, so the `pip install`
layer stays cached across code edits. `--no-cache-dir` also keeps pip's download cache out of the
image.

## Example 2 — Real-world: one clean RUN for OS packages

```dockerfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl \
 && rm -rf /var/lib/apt/lists/*
```

**Why this works:** Update, install, and clean happen in **one** layer, so the apt package lists
never bloat the image. `--no-install-recommends` avoids pulling in extras you did not ask for.

## Example 3 — Best practice / edge case: ENTRYPOINT + CMD

```dockerfile
ENTRYPOINT ["python", "-m", "http.server"]
CMD ["8000"]
```

```text
docker run img         -> serves on port 8000 (CMD default)
docker run img 9000    -> serves on port 9000 (CMD overridden, ENTRYPOINT fixed)
```

**Why this works:** `ENTRYPOINT` locks in *what program runs*; `CMD` supplies a *default argument*
users can override — a clean, predictable command-line interface for your image.

# Common Mistakes

- **Copying all source before installing dependencies**, so every code change reinstalls everything.
- **Cleaning up in a separate `RUN`**, which does not shrink the image because the earlier layer
  already holds the files.
- **Using `:latest` base images**, making builds non-reproducible.
- **No `.dockerignore`**, so `node_modules`, `.git`, and secrets get copied in and slow the build.
- **Overriding `ENTRYPOINT` by accident** when you meant to pass arguments — know which of
  `CMD`/`ENTRYPOINT` you are changing.

# Best Practices

- **Order for the cache:** stable steps first, volatile steps (your code) last.
- **Combine and clean up** package installs in a single `RUN`.
- **Pin** base images to specific tags; prefer **slim/alpine** variants.
- Always ship a **`.dockerignore`**.
- Use **`ENTRYPOINT` + `CMD`** to give images a clear, overridable command interface, in exec form.
- Keep to **one main concern per image**, which keeps it small and cacheable.

# Summary

- Each instruction is a **layer**; a cache miss on one layer **rebuilds every layer below it**.
- Put **rarely-changing** steps first — copy dependency manifests and install **before** copying
  source — to keep expensive layers cached.
- **Chain and clean up** `RUN` commands in one layer; keep a solid **`.dockerignore`**.
- **`ENTRYPOINT`** fixes the program; **`CMD`** gives overridable defaults; combine them in exec
  form.
- Pin base image versions and prefer slim variants for lean, reproducible builds.

# Flash Cards

Q: When a Dockerfile layer's cache is invalidated, what happens to the layers after it?
A: They are all rebuilt too. A cache miss cascades: once a layer changes, no layer below it can be reused.

Q: Why copy package.json and install dependencies before copying the rest of the source?
A: Dependencies change less often than code, so the install layer stays cached across code edits; only the final COPY re-runs when you change source.

Q: Why chain apt-get install and rm -rf /var/lib/apt/lists/* in a single RUN?
A: Each RUN is a layer; cleaning up in the same RUN keeps the junk out of the image. Cleaning in a later RUN would not shrink it, because the earlier layer already contains the files.

Q: What is the difference between CMD and ENTRYPOINT?
A: ENTRYPOINT sets the fixed executable that always runs; CMD provides default arguments (or a default command) that are easy to override at docker run.

Q: What is the benefit of combining ENTRYPOINT and CMD?
A: ENTRYPOINT locks in the program while CMD supplies default arguments the user can override, giving the image a clean, predictable command-line interface.

Q: Why pin base image tags instead of using latest?
A: Pinning makes builds reproducible and predictable; latest can change under you, producing different images from the same Dockerfile.

# Exercises

### Easy
Write a Dockerfile that copies a dependency manifest and installs dependencies before copying
source. Build it, change one source line, rebuild, and confirm the dependency layer shows `CACHED`.

### Medium
Take a Dockerfile with three separate `RUN apt-get` lines and combine them into one `RUN` with `&&`
plus a cleanup of the apt lists. Compare the image sizes before and after with `docker images`.

### Challenging
Create an image using `ENTRYPOINT ["python", "-m", "http.server"]` and `CMD ["8000"]`. Run it with
no arguments and then with `9000`, and explain exactly which of `ENTRYPOINT`/`CMD` changed and why.

# Further Reading

- Building best practices — <https://docs.docker.com/build/building/best-practices/>
- Cache in builds — <https://docs.docker.com/build/cache/>
- `ENTRYPOINT` and `CMD` — <https://docs.docker.com/reference/dockerfile/#entrypoint>
- `.dockerignore` — <https://docs.docker.com/build/concepts/context/#dockerignore-files>
