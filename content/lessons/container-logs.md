---
slug: container-logs
title: "Inspecting Container Logs"
topic: container-management
kind: tool
summary: "Stream and filter container stdout and stderr streams using the docker logs command."
tags: [docker-logs, stdout, stderr, follow]
related: [executing-commands, docker-logs-and-drivers, structured-json-logging]
---
> **In one line:** The docker logs command captures and displays whatever the container PID 1 writes to standard output and error.

## The idea
In traditional server environments, applications write logs to local files such as `/var/log/app.log`, which require rotation daemons, logrotate scripts, and disk monitoring.

Docker adopts the Twelve-Factor App logging philosophy: an application inside a container should never manage log files. Instead, it should simply write unbuffered output to **standard output (`stdout`)** and **standard error (`stderr`)**.

The Docker logging subsystem intercepts these two streams, timestamps the messages, tags them with stream identifiers, and stores them via the active logging driver (defaulting to the `json-file` or `local` driver). You inspect this stream anytime using `docker logs`.

| Flag | Description | Example |
|---|---|---|
| `-f` (`--follow`) | Stream live log output in real time | `docker logs -f web` |
| `--tail <n>` | Show only the last `n` lines of logs | `docker logs --tail 50 web` |
| `-t` (`--timestamps`) | Prepend RFC3339 timestamps to each line | `docker logs -t web` |
| `--since <time>` | Filter logs generated after a duration/timestamp | `docker logs --since 15m web` |

## See it
Launch a background container that periodically logs information:

```bash
# Run container generating log output every second
docker run -d --name ticker alpine sh -c 'while true; do echo "Tick $(date)"; sleep 1; done'

# Read the last 3 log entries with timestamps
docker logs --tail 3 -t ticker

# Follow live output stream (press Ctrl+C to disconnect)
docker logs -f --tail 5 ticker
```

The terminal displays formatted timestamps alongside the application output:

```text
2026-11-16T12:00:01.102341Z Tick Mon Nov 16 12:00:01 UTC 2026
2026-11-16T12:00:02.105812Z Tick Mon Nov 16 12:00:02 UTC 2026
2026-11-16T12:00:03.109204Z Tick Mon Nov 16 12:00:03 UTC 2026
```

## Go deeper
If an application running in a container buffers its output (common in Python when `PYTHONUNBUFFERED` is not set), logs may appear delayed or fail to show up in `docker logs` until the process terminates. Ensure environment flags disable output buffering.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- Containerized applications must stream logs directly to stdout and stderr.
- Use `docker logs -f --tail 100` to follow live stream output without loading entire historical logs.
- Ensure language runtimes disable I/O stream buffering so logs flush immediately.
