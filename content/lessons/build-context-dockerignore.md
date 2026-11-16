---
slug: build-context-dockerignore
title: "Build Context & .dockerignore"
topic: dockerfiles
kind: technique
summary: "Exclude node_modules, secrets, and large git trees using .dockerignore to keep the build context fast and secure."
tags: [build-context, dockerignore, performance, caching]
related: [dockerfile-anatomy, layer-caching-order, secrets-hygiene]
---
> **In one line:** The build context is the local file tree sent to the build engine; .dockerignore filters out unnecessary files.

## The idea
When you execute `docker build -t my-app .`, the trailing dot `.` specifies the **build context**.

Before executing the first Dockerfile instruction, the Docker client packages all files from the build context directory and uploads them to the Docker daemon (or BuildKit engine). If your directory contains large build directories like `node_modules/`, `.git/`, test reports, or media assets, uploading the build context can take minutes and consume gigabytes of memory.

A **`.dockerignore`** file sits in the root of your build context. Similar to `.gitignore`, it tells the Docker build client which files and patterns to exclude before uploading the context.

Filtering files via `.dockerignore` delivers three vital benefits:
1. **Speed:** Slashing context upload size from hundreds of megabytes to a few kilobytes.
2. **Cache hit rate:** Preventing edits in unrelated files (such as `README.md`) from busting Dockerfile cache layers.
3. **Security:** Preventing local `.env` files, private SSH keys, and passwords from being accidentally copied into public images.

| File Pattern | Why Exclude in .dockerignore |
|---|---|
| `.git/` | Contains entire repository history; balloons context size |
| `node_modules/` | Host binaries conflict with container Linux architecture |
| `.env*` | Prevents local developer secrets from leaking into image layers |
| `*.log` | Ephemeral host logfiles waste build storage |

## See it
Create an enterprise-grade `.dockerignore` in your project root:

```text
# Ignore version control metadata
.git/
.gitignore

# Ignore local dependency folders and build outputs
node_modules/
dist/
build/

# Ignore sensitive credentials and local configs
.env*
*.pem
*.key

# Ignore editor and OS metadata
.vscode/
.idea/
.DS_Store
```

Test build context transfer speed:

```bash
# Build image and observe the first output line
docker build -t my-app .
# Output: [internal] load build context: 1.2MB (excluding node_modules)
```

## Go deeper
BuildKit supports negative pattern matching in `.dockerignore` using the `!` operator. You can exclude everything by default and re-include only necessary source files:
```text
*
!src/
!package*.json
```

## Watch out
- If you copy `node_modules/` from a macOS or Windows host into a Linux container, native C++ compiled dependencies (like bcrypt or sharp) will fail to execute.

## Remember
- The build context is the entire directory tree sent to the daemon prior to building.
- Always add a comprehensive `.dockerignore` file to every containerized project repository.
- Exclude host dependencies (`node_modules`), `.git`, and local credential files.
