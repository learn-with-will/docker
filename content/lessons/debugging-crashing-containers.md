---
slug: debugging-crashing-containers
title: "Debugging Crashing Containers"
topic: debugging-observability
kind: pitfall
summary: "Systematically diagnose and fix containers stuck in crash loops or exiting immediately upon startup."
tags: [crashloop, exit-code, oomkilled, debugging]
related: [stop-signals-and-exit-codes, docker-inspect-formatting, container-logs]
---
> **In one line:** Troubleshoot crashing containers by reading exit codes, checking OOMKilled status, and overriding entrypoints.

## The idea
One of the most frustrating experiences for developers is launching a container only for it to exit half a second later:
```text
docker run -d my-app
# Container disappears immediately from docker ps!
```

A container runs only as long as its primary process (PID 1) runs. If PID 1 crashes, throws an unhandled exception, or finishes its work, the container transitions to Exited immediately.

Follow this systematic four-step debugging protocol:
1. **List all containers (`docker ps -a`):** Locate the container and read its **Status** and **Exit Code**.
2. **Read the logs (`docker logs <container>`):** Inspect stack traces, missing configuration errors, or missing files.
3. **Check OOM status (`docker inspect`):** Confirm whether the host kernel terminated the container for exceeding memory limits (`OOMKilled: true`).
4. **Override entrypoint with a shell:** Launch the container interactively with `--entrypoint sh` to explore the filesystem.

| Diagnostic Symptom | Probable Cause | Action |
|---|---|---|
| Exit Code `0` | Process completed its task and exited | Ensure long-running server command is used |
| Exit Code `1` / `2` | Uncaught app exception or config error | Check `docker logs` for stack trace |
| Exit Code `137` + `OOMKilled: true` | Memory limit exceeded | Increase `--memory` allocation |
| Exit Code `127` | Executable or library not found | Check Dockerfile path / missing glibc |

## See it
Debug a container that fails to start:

```bash
# 1. Inspect recent exited containers
docker ps -a --filter "status=exited" --format "table {{.Names}}	{{.Status}}"

# 2. Check the exit code and OOM state
docker inspect failing-app --format 'ExitCode: {{.State.ExitCode}}, OOMKilled: {{.State.OOMKilled}}, Error: "{{.State.Error}}"'

# 3. Read the crash logs
docker logs failing-app
```

If the container crashes due to a broken entrypoint, launch an interactive shell to debug inside the image:

```bash
# Override the entrypoint to keep container alive for interactive debugging
docker run --rm -it --entrypoint sh failing-image
```

## Go deeper
A common cause of `Exit Code 127` on Alpine Linux is attempting to run a Go or C++ binary compiled against standard GNU `glibc`. Because Alpine uses `musl libc`, the dynamic linker fails to load the binary. Recompile with `CGO_ENABLED=0` for a static binary.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- A container exits the moment its PID 1 process terminates.
- Check exit codes and `OOMKilled` flags using `docker inspect`.
- Override broken entrypoints with `--entrypoint sh` to explore the container filesystem interactively.
