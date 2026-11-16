---
slug: stop-signals-and-exit-codes
title: "Stop Signals & Exit Codes"
topic: dockerfiles
kind: concept
summary: "Understand Linux signals, STOPSIGNAL instructions, and standard exit codes like 0, 1, 137, and 143."
tags: [sigterm, sigkill, exit-codes, graceful-shutdown]
related: [exec-vs-shell-form, lifecycle-commands, debugging-crashing-containers]
---
> **In one line:** Exit codes tell you why a container stopped, while STOPSIGNAL configures how it terminates.

## The idea
When a container stops, it reports a numerical **exit code** between 0 and 255. Reading exit codes allows developers and automated monitoring agents to immediately diagnose whether a process finished successfully, crashed with an unhandled exception, or was terminated by the kernel.

Standard Docker exit code conventions:
- **0:** Successful termination (process completed its task naturally).
- **1 to 125:** Application-level errors (uncaught exceptions, missing configuration, syntax errors).
- **126:** Command cannot be invoked (permission problem on binary).
- **127:** File not found (missing binary or invalid entrypoint path).
- **137 (128 + 9):** Process terminated by `SIGKILL` (often triggered by host out-of-memory OOM killer or `docker kill`).
- **143 (128 + 15):** Process terminated cleanly by `SIGTERM` (graceful stop).

By default, Docker sends `SIGTERM` (signal 15) during `docker stop`. If your application expects a different termination signal (for example, NGINX uses `SIGQUIT` for graceful shutdown), you declare it using the `STOPSIGNAL` instruction.

| Exit Code | Meaning | Typical Root Cause |
|---|---|---|
| `0` | Success | Normal process completion |
| `1` | General Error | App exception / crash in code |
| `137` | Fatal error: killed (SIGKILL) | Linux OOM killer or forced docker kill / stop timeout |
| `143` | Terminated (SIGTERM) | Graceful shutdown requested by host |

## See it
Declare a custom stop signal in a Dockerfile:

```docker
FROM nginx:alpine

# Configure NGINX for graceful connection draining stop
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
```

Query the exit code of an exited container using formatted inspection:

```bash
# Inspect the exit code of any stopped container
docker inspect my-stopped-app --format 'Exit Code: {{.State.ExitCode}}, OOMKilled: {{.State.OOMKilled}}'
```

The query indicates whether the failure was caused by out-of-memory:

```text
Exit Code: 137, OOMKilled: true
```

## Go deeper
When Linux terminates a process via an operating system signal, the conventional exit code is `128 + Signal Number`. Since `SIGKILL` is signal 9, its exit code is `128 + 9 = 137`. Since `SIGTERM` is signal 15, its exit code is `128 + 15 = 143`.

## Watch out
- If `docker inspect` displays `ExitCode: 137` and `OOMKilled: true`, the container exceeded its cgroup memory limit and was killed by the kernel.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Exit code 0 signals clean completion; codes above 128 indicate signal-driven termination.
- Exit code 137 typically indicates an out-of-memory (OOM) kill or forced shutdown.
- Use `STOPSIGNAL` to customize the termination signal sent during `docker stop`.
