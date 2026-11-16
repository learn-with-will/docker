---
slug: dockerfile-anatomy
title: "Dockerfile Core Instructions"
topic: dockerfiles
kind: technique
summary: "Write production Dockerfiles using FROM, WORKDIR, COPY, and RUN instructions."
tags: [dockerfile, from, workdir, copy, run]
related: [cmd-vs-entrypoint, exec-vs-shell-form, build-context-dockerignore]
---
> **In one line:** A Dockerfile is an automated build script whose instructions create sequential, cached filesystem layers.

## The idea
A `Dockerfile` is a text document containing sequential instructions that the Docker build engine executes to assemble a container image. Instead of manually installing software inside an interactive container and saving snapshots, a Dockerfile makes your build process declarative, reproducible, and trackable in version control.

Four instructions form the backbone of almost every Dockerfile:
- **`FROM <image>[:tag]`**: Defines the base image. Every valid Dockerfile must start with `FROM` (or an `ARG` used inside `FROM`).
- **`WORKDIR <path>`**: Sets the working directory for subsequent instructions. If the directory does not exist, Docker creates it automatically. Never use raw `RUN cd /path` commands because directory changes do not persist across layers.
- **`COPY <src> <dest>`**: Copies files from the host build context into the container filesystem.
- **`RUN <command>`**: Executes shell commands during the build phase to install dependencies, compile binaries, and configure system libraries. Each `RUN` instruction commits a new read-only layer.

| Instruction | Purpose | Creates Layer? | Example |
|---|---|---|---|
| `FROM` | Specifies base OS or runtime | Yes (base image) | `FROM alpine:3.20` |
| `WORKDIR` | Sets current working path | No (metadata only) | `WORKDIR /usr/src/app` |
| `COPY` | Copies files into image | Yes (file diffs) | `COPY package*.json ./` |
| `RUN` | Executes build-time commands | Yes (command delta) | `RUN npm ci --omit=dev` |

## See it
Here is a complete, production-grade Dockerfile for a Node.js microservice:

```docker
# Start from official Node.js Alpine base image
FROM node:22-alpine

# Set dedicated application directory
WORKDIR /app

# Copy dependency manifests first to leverage layer cache
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/

# Declare default start command in exec form
CMD ["node", "src/index.js"]
```

Build the image and assign a local tag using the build command:

```bash
# Build the image using the current directory as build context
docker build -t my-node-service:1.0 .
```

## Go deeper
Notice how the instructions separate copying `package.json` from copying application source code `src/`. Because Docker caches build layers based on file checksums, source code edits in `src/` will reuse the cached `RUN npm ci` layer, shortening build times from minutes to milliseconds.

## Watch out
- Avoid using `ADD` when `COPY` suffices; `ADD` has complex automatic tarball extraction and remote URL fetching behaviors that can introduce unexpected security risks.

## Remember
- `FROM` initializes the build stage and specifies the base parent image.
- Use `WORKDIR` rather than `cd` to set the working directory for subsequent instructions.
- Separate dependency installation from application code copying to maximize build cache reuse.
