---
slug: docker-inspect-formatting
title: "Inspecting Containers with Go Templates"
topic: debugging-observability
kind: tool
summary: "Query container configuration, IP addresses, and state deeply using docker inspect and Go templates."
tags: [docker-inspect, go-templates, json-formatting, metadata]
related: [pulling-and-inspecting-images, debugging-crashing-containers, healthcheck-instruction]
---
> **In one line:** Extract precise container metadata and diagnostic fields using docker inspect --format and Go template syntax.

## The idea
The command `docker inspect` is the ultimate diagnostic microscope for Docker objects. When executed against a container or image, it returns an exhaustive JSON array containing hundreds of lines of internal daemon state:
- Network configurations, assigned IP addresses, and gateway routes.
- Writable layer disk paths and volume mount bindings.
- Process IDs, exit codes, health states, and resource limits.
- Environment variables and entrypoint arguments.

Sifting through hundreds of lines of raw JSON in terminal sessions is slow. Docker CLI commands accept the **`-f` (`--format`)** flag, which evaluates **Go template syntax** directly on the daemon before returning data.

| Query Target | Go Template Expression |
|---|---|
| Container IP address | `{{.NetworkSettings.IPAddress}}` |
| Host PID | `{{.State.Pid}}` |
| Container status | `{{.State.Status}}` |
| Exit code | `{{.State.ExitCode}}` |
| Restart count | `{{.RestartCount}}` |
| Formatted JSON output | `{{json .State}}` |

## See it
Extract targeted diagnostic attributes from a running container:

```bash
# Launch a test container
docker run -d --name inspect-target -p 8080:80 nginx:alpine

# Extract the container's private IP on the default bridge
docker inspect inspect-target --format '{{.NetworkSettings.IPAddress}}'

# Extract the host PID of the container's root process
docker inspect inspect-target --format 'Host PID: {{.State.Pid}}'

# Extract volume mount points as formatted JSON
docker inspect inspect-target --format '{{json .Mounts}}'
```

The commands return clean, scriptable outputs:

```text
172.17.0.2
Host PID: 6812
[]
```

## Go deeper
You can iterate through maps and arrays using Go template range blocks:
```bash
docker inspect inspect-target --format '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{end}}'
```
This directly prints formatted port mappings for shell scripting automation.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.


Always verify error handling and failure recovery mechanisms during staging deployments. Testing simulated network disconnects, resource exhaustion limits, and process crashes guarantees that systems degrade gracefully under adverse conditions.

## Remember
- `docker inspect` exposes the complete internal state of containers, images, and volumes.
- Use `--format '{{.Path.To.Field}}'` to extract exact scalar values without parsing giant JSON payloads.
- Use `{{json .}}` to output cleanly formatted JSON objects for processing with `jq`.
