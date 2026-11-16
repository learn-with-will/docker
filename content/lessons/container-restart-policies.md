---
slug: container-restart-policies
title: "Container Restart Policies"
topic: container-management
kind: pattern
summary: "Configure automatic container recovery after crashes or system reboots using restart policies."
tags: [restart-policy, always, unless-stopped, on-failure]
related: [lifecycle-commands, stop-signals-and-exit-codes, compose-services-and-build]
---
> **In one line:** Set --restart policies to ensure containers automatically restart on crashes or host reboots.

## The idea
In production environments, physical servers reboot for kernel updates and application processes occasionally crash due to transient network failures or memory leaks.

Without an explicit configuration, Docker defaults to `--restart no`, meaning an exited container stays exited until a human operator intervenes.

Docker provides four built-in restart policies to automate self-healing:
- **`no`**: Default. Do not restart the container automatically under any circumstances.
- **`on-failure[:max-retries]`**: Restarts the container only if it exits with a non-zero exit code. Useful for batch jobs and workers.
- **`always`**: Always restarts the container if it stops. If manually stopped, it restarts as soon as the Docker daemon reboots.
- **`unless-stopped`**: Identical to `always`, except that if an operator explicitly executes `docker stop`, the container remains stopped even after host or daemon reboots.

| Policy | Behavior on Crash | Behavior on Manual Stop | Behavior on Host Reboot |
|---|---|---|---|
| `no` | Stays stopped | Stays stopped | Stays stopped |
| `on-failure` | Restarts | Stays stopped | Restarts only if crashed before reboot |
| `always` | Restarts | Restarts on reboot | Restarts automatically |
| `unless-stopped` | Restarts | Stays stopped | Restarts unless explicitly stopped |

## See it
Launch a resilient database service configured with `unless-stopped`:

```bash
# Deploy PostgreSQL with self-healing restart policy
docker run -d --name resilient-db --restart unless-stopped -e POSTGRES_PASSWORD=secret postgres:alpine

# Inspect the container's restart policy configuration
docker inspect resilient-db --format 'Restart Policy: {{.HostConfig.RestartPolicy.Name}}'

# Test stopping the container manually
docker stop resilient-db
docker inspect resilient-db --format 'Status: {{.State.Status}}'
```

The inspect command confirms the restart configuration:

```text
Restart Policy: unless-stopped
Status: exited
```

## Go deeper
To prevent a crashed container from overwhelming the host CPU in an infinite crash loop, the Docker Engine implements an exponential backoff delay (100ms, 200ms, 400ms, up to a maximum of 1 minute) before triggering successive restarts.

## Watch out
- Do not pair `--restart` with `--rm`; Docker will reject the command because ephemeral containers cannot be restarted.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Prefer `--restart unless-stopped` for production daemons and database containers.
- Use `--restart on-failure:5` for background batch workers to prevent runaway crash loops.
- Docker applies exponential backoff delays to prevent crash-looping containers from consuming host CPU.
