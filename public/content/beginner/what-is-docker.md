---
id: lesson-01
slug: what-is-docker
title: "What Is Docker & Why Containers?"
level: beginner
order: 1
duration: 20
tags:
  - fundamentals
  - containers
  - images
  - architecture
  - oci
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **container** is and how it differs from a **virtual machine**.
- Describe the relationship between an **image** and a **container**.
- Name the main parts of the Docker architecture: the CLI, the daemon, containerd, and a registry.
- Explain what the **OCI** standard is and why it matters for portability.
- Say, in plain terms, which problems Docker actually solves.

# Why It Matters

"It works on my machine" is one of the oldest problems in software. An application that runs
perfectly on your laptop can fail on a teammate's computer or on a server because the operating
system, the language runtime, the libraries, or a dozen small settings are different.

A **container** packages your application together with everything it needs to run — the code, the
runtime, the system libraries, and the settings — into one unit that runs the same way
everywhere. Docker is the most popular tool for building and running containers. Learning it means
your software behaves the same on your machine, your teammate's machine, and in production.

# Concept Explanation

### What is a container?

A container is an **isolated process** running on your computer. It shares the host machine's
**kernel** (the core of the operating system), but it has its own isolated view of the filesystem,
its own network interface, and its own set of running processes. Linux provides this isolation
through two kernel features: **namespaces** (which decide *what a process can see*) and **cgroups**
(which decide *how many resources it can use*).

Because a container is just an isolated process, it starts in a fraction of a second and adds
almost no overhead.

### How is that different from a virtual machine?

A **virtual machine (VM)** runs a complete guest operating system — its own kernel and all — on top
of a **hypervisor**. That is heavier: each VM includes a full OS, takes gigabytes of disk, and
takes seconds to minutes to boot.

```text
Virtual machines                     Containers
┌───────┐ ┌───────┐ ┌───────┐        ┌───────┐ ┌───────┐ ┌───────┐
│ App A │ │ App B │ │ App C │        │ App A │ │ App B │ │ App C │
├───────┤ ├───────┤ ├───────┤        ├───────┤ ├───────┤ ├───────┤
│Guest  │ │Guest  │ │Guest  │        │ (just the app + its libs) │
│  OS   │ │  OS   │ │  OS   │        └───────┴───────┴───────────┘
├───────┴─┴───────┴─┴───────┤        ┌───────────────────────────┐
│        Hypervisor         │        │      Docker Engine        │
├───────────────────────────┤        ├───────────────────────────┤
│         Host OS           │        │   Host OS (shared kernel) │
└───────────────────────────┘        └───────────────────────────┘
```

The key difference: **a container shares the host's kernel; a VM brings its own.** That is why
containers are smaller and faster. (They are not automatically "more secure" than a VM — sharing a
kernel is a trade-off — but they are far more efficient.)

### Images versus containers

There are two words people mix up constantly:

- An **image** is a read-only template — a snapshot of a filesystem plus some metadata about how to
  run it. Images are built once and never change.
- A **container** is a **running instance** of an image. When you start a container, Docker adds a
  thin **writable layer** on top of the read-only image so the process can create and change files.

The relationship is like a class and an object, or a recipe and a meal: one image can produce many
containers, each isolated from the others.

### The Docker architecture

Docker uses a **client–server** design:

- The **Docker client** (`docker`) is the command-line tool you type into.
- The **Docker daemon** (`dockerd`) is a background service that does the real work — building
  images, running containers, managing storage and networks.
- Under the hood the daemon uses **containerd** (a container runtime that manages the container
  lifecycle) and **runc** (which actually creates the container process using the kernel features
  above).
- A **registry** (such as Docker Hub) is a server that stores and distributes images.

When you run a command, the client sends it to the daemon, which pulls images from a registry if
needed and runs your container.

### The OCI standard

The **Open Container Initiative (OCI)** is an open standard for container **image** and **runtime**
formats. Because Docker builds OCI-compliant images, those images also run on other OCI-compliant
tools (like Podman or Kubernetes' runtimes). Standardization is why "build once, run anywhere"
holds true beyond Docker itself.

# Key Terminology

- **Container** — an isolated process that shares the host kernel but has its own filesystem,
  network, and process space.
- **Image** — a read-only template (layered filesystem + metadata) used to create containers.
- **Kernel** — the core of the operating system that manages hardware and processes.
- **Docker daemon (`dockerd`)** — the background service that builds and runs containers.
- **Registry** — a service that stores and shares images (e.g. Docker Hub).
- **OCI** — the Open Container Initiative, the open standard for image and runtime formats.

# Syntax and Options

| Term | What it is | Analogy |
| --- | --- | --- |
| Image | Read-only template | A recipe |
| Container | Running instance of an image | A cooked meal |
| Registry | Store of images | A cookbook library |
| `dockerd` | The engine doing the work | The kitchen |

# Hands-On Walkthrough

You do not need to understand every command yet — just watch how the pieces connect. Check that
Docker is installed and run one container:

```bash
docker version
docker run docker/whalesay cowsay "Hello from a container"
```

What happens, step by step:

```text
1. The docker client sends "run docker/whalesay" to the daemon.
2. The daemon does not have the image locally, so it pulls it from Docker Hub (a registry).
3. The daemon creates a container from that image and starts it.
4. The program prints its output, the process finishes, and the container exits.
```

You just used the client, the daemon, and a registry — the whole architecture — in one command.

# Real World Analogy

Think of a **shipping container**. Before standardized containers, moving goods meant repacking
them for every truck, train, and ship. The standardized steel box changed that: whatever is inside,
every crane and vessel handles the box the same way.

A Docker image is that box for software. Whatever language or libraries are inside, any machine
running Docker handles it the same way — and the OCI standard is the international agreement on the
box's dimensions.

# Examples

## Example 1 — Basic: one image, many containers

```bash
docker run --name web1 -d nginx
docker run --name web2 -d nginx
```

**Why this works:** Both containers are created from the same read-only `nginx` image, but each gets
its own writable layer and its own isolated process, so they run independently. One image, two
containers.

## Example 2 — Real-world: the same image everywhere

A team builds an image of their app and pushes it to a registry. A teammate and the production
server both pull the *same* image:

```bash
docker pull myteam/orders-api:1.4.0
```

**Why this works:** Because the image includes the app *and* its dependencies, and because it is
identified by an exact version, everyone runs a byte-for-byte identical environment. "Works on my
machine" stops being a problem.

## Example 3 — Best practice / edge case: containers are disposable

```bash
docker run --rm alpine echo "I run, then I vanish"
```

**Why this works:** The `--rm` flag deletes the container as soon as it exits. Containers are meant
to be **disposable**: you throw them away and start fresh from the image. (Anything you need to keep
belongs in a volume — a later lesson.)

# Common Mistakes

- **Thinking a container is a small VM.** It is an isolated *process* sharing the host kernel, not a
  machine with its own OS.
- **Confusing images and containers.** The image is the template; the container is the running
  instance. You can have many containers from one image.
- **Assuming containers keep their changes.** By default, everything a container writes disappears
  when it is removed. Persisted data needs a volume.
- **Believing Docker is only for Linux apps on Linux.** Docker Desktop runs a lightweight Linux VM
  on macOS and Windows so Linux containers run there too.

# Best Practices

- Treat containers as **disposable and identical** — rebuild from the image rather than patching a
  running container.
- Pin images to a **specific version** (tag or digest) so everyone runs the same thing.
- Keep one main **concern per container** (e.g. one app or one service), which keeps images small
  and easy to reason about.
- Get comfortable with the mental model — image vs container vs registry — before memorizing
  commands.

# Summary

- A **container** is an isolated process that shares the host **kernel**; a **VM** brings its own
  full OS, which makes it heavier.
- An **image** is a read-only template; a **container** is a running instance of one, with a thin
  writable layer on top.
- Docker is **client–server**: the `docker` CLI talks to the `dockerd` daemon, which uses
  containerd and runc and pulls images from a **registry**.
- The **OCI** standard keeps images portable across compliant tools.
- Containers solve "works on my machine" by packaging the app *with* its dependencies.

# Flash Cards

Q: What is the key difference between a container and a virtual machine?
A: A container shares the host operating system's kernel and is just an isolated process; a VM runs its own full guest OS on a hypervisor.

Q: What is the difference between an image and a container?
A: An image is a read-only template; a container is a running instance of that image, with a thin writable layer added on top.

Q: What are the two Linux kernel features that make containers possible?
A: Namespaces (what a process can see) and cgroups (how many resources it can use).

Q: What does the Docker daemon (dockerd) do?
A: It is the background service that builds images and runs containers; the docker CLI sends it your commands.

Q: What is a registry?
A: A service, such as Docker Hub, that stores and distributes images so they can be pulled and pushed.

Q: What does OCI stand for and why does it matter?
A: The Open Container Initiative — an open standard for image and runtime formats that keeps images portable across compliant tools.

# Exercises

### Easy
Run `docker run --rm hello-world` and read the message it prints. In your own words, list the steps
the daemon took to produce that output.

### Medium
Explain to a non-technical friend, in three sentences, why a container is lighter than a virtual
machine. Use the shipping-container analogy.

### Challenging
Run two containers from the same image (for example `nginx`) with different names, then run
`docker ps`. Describe what is shared between them (the image layers) and what is separate (each
container's writable layer and process).

# Further Reading

- Docker overview — <https://docs.docker.com/get-started/docker-overview/>
- Docker architecture — <https://docs.docker.com/get-started/docker-overview/#docker-architecture>
- What is a container? — <https://www.docker.com/resources/what-container/>
- Open Container Initiative — <https://opencontainers.org/>
