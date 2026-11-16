---
slug: container-lifecycle-states
title: "Container Lifecycle States"
topic: foundations
kind: concept
summary: "Trace a container across its distinct states: created, running, paused, exited, and destroyed."
tags: [lifecycle, created, running, exited]
related: [running-first-container, docker-run-flags, lifecycle-commands]
---
> **In one line:** A container transitions from created to running, can be paused or stopped, and eventually exits before removal.

## The idea
A container is not merely an on/off switch; it progresses through a deterministic state machine managed by containerd and runc:

1. **Created:** The container's writable layer and namespaces have been initialized by the daemon, but its primary process has not yet been executed.
2. **Running:** The root process (PID 1) is actively executing on the host CPU.
3. **Paused:** The kernel cgroup freezer suspends all thread execution in the container without terminating processes or clearing memory.
4. **Exited (Stopped):** The main process terminated, either cleanly (exit code 0) or due to an error / signal (such as exit code 137). The container filesystem remains intact on disk.
5. **Dead / Removed:** The container metadata and writable storage layer are purged from host disk storage.

```flow
created: Created | docker create @neutral
running: Running | active container @green
paused: Paused | cgroups SIGSTOP @amber
stopped: Stopped | exit status preserved @neutral
removed: Removed | storage freed @red
created -> running: start
running -> paused: pause
running -> stopped: stop or kill
stopped -> removed: rm
```

## See it
You can inspect the exact lifecycle state of any container using the formatted inspect command:

```bash
# Create a container without starting it
docker create --name state-demo alpine sleep 60

# Inspect its state
docker inspect state-demo --format 'Status: {{.State.Status}}, Running: {{.State.Running}}'

# Start the container and observe the state transition
docker start state-demo
docker inspect state-demo --format 'Status: {{.State.Status}}, PID: {{.State.Pid}}'
```

The inspect command tracks the lifecycle transitions:

```text
Status: created, Running: false
Status: running, PID: 5821
```

## Go deeper
When a container exits, its file changes are **not** immediately deleted. The writable container layer continues to consume disk space until you explicitly call `docker rm` or launch the container with the ephemeral `--rm` flag.

## Watch out
- Exited containers retain their assigned IP allocations until deleted or restarted, which can exhaust private subnet pools in large test suites.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- The primary container states are created, running, paused, exited, and removed.
- Pausing uses the Linux cgroup freezer to suspend execution without dropping memory state.
- Exited containers retain their writable layer until explicitly purged with docker rm.
