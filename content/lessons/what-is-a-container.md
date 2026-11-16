---
slug: what-is-a-container
title: "What Is a Container?"
topic: foundations
kind: concept
summary: "A container is a sandboxed, isolated process on the host operating system that shares the host Linux kernel."
tags: [containers, kernel, isolation, processes]
related: [containers-vs-vms, namespaces-and-cgroups, docker-architecture]
---
> **In one line:** A container is an isolated host process that shares the host operating system kernel.

## The idea
When people first encounter Docker, they frequently imagine that a container is a lightweight virtual machine. In reality, a container is simply an isolated user-space process running directly on the host operating system. It executes machine code natively on the host CPU without any hypervisor or virtualization layer translating system calls or emulating hardware devices.

The host operating system kernel provides this illusion of a private machine through two core mechanisms built natively into the Linux kernel: namespaces and control groups (cgroups). Namespaces restrict what a containerized process can see, providing private views of filesystem mount trees, process ID hierarchies, network interfaces, and inter-process communication channels. Control groups restrict what a process can consume, strictly enforcing hard limits and metering on CPU cycles, physical memory, swap space, and disk I/O bandwidth.

Because a container does not boot a second operating system or maintain separate kernel data structures, starting a container is as fast as starting any standard executable file on your workstation.

| Dimension | Container | Virtual Machine |
|---|---|---|
| Architecture | Isolated process on shared kernel | Full guest OS on hypervisor |
| Startup time | 50 to 500 milliseconds | 20 to 120 seconds |
| Memory footprint | Megabytes (app + libraries only) | Gigabytes (guest OS overhead) |
| Isolation boundary | Kernel namespaces & cgroups | Hardware-assisted hypervisor |

## See it
You can run an isolated process using the Docker command-line interface. The container starts, executes its entrypoint, and exits immediately when its main process terminates:

```bash
# Run a minimal Alpine Linux container and print kernel release
docker run --rm alpine uname -a

# Inspect the PID of the isolated process from the host perspective
docker run -d --name demo-proc alpine sleep 30
docker inspect demo-proc --format 'Container State: {{.State.Status}}, Host PID: {{.State.Pid}}'
```

The command output reveals that the container reports the exact same Linux kernel release as your host operating system, proving that no separate guest kernel was booted:

```text
Linux docker-desktop 6.6.26-linuxkit #1 SMP PREEMPT_DYNAMIC x86_64 Linux
Container State: running, Host PID: 4192
```

## Go deeper
Every container has a top-level process running with process ID 1 inside its own private PID namespace. Inside the container, this process acts as the init system, adopting orphaned child processes and handling system signals. However, if you inspect the host process table with standard host tools like `ps aux`, that exact same process appears with a completely standard host PID. The host kernel simply translates process IDs across namespace boundaries.

## Watch out
- Do not store critical persistent data inside the container's top-level filesystem; any files written outside mounted volumes are lost when the container is destroyed.

## Remember
- A container is an isolated host process running directly on the shared host kernel.
- Linux namespaces restrict visibility while cgroups enforce resource consumption limits.
- Containers launch in milliseconds because they execute natively without hypervisor overhead.
