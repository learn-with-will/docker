---
slug: docker-logs-and-drivers
title: "Logging Drivers & Output Handling"
topic: debugging-observability
kind: technique
summary: "Configure logging drivers like json-file, local, and syslog with automatic size-based log rotation."
tags: [logging, log-drivers, json-file, syslog]
related: [container-logs, structured-json-logging, three-pillars-observability]
---
> **In one line:** Configure logging drivers and log rotation to prevent runaway container output from consuming all host disk space.

## The idea
When an application inside a container writes to `stdout` and `stderr`, the Docker daemon captures that output through a configurable **logging driver**.

By default, Docker uses the `json-file` or `local` driver, storing every log line as a JSON object on the host filesystem (`/var/lib/docker/containers/<id>/<id>-json.log`). If a high-throughput microservice generates megabytes of log output per second without rotation, this log file will grow indefinitely until the host filesystem runs out of disk space, crashing all containers on the machine.

Docker supports diverse pluggable logging drivers:
- **`local` / `json-file`:** Writes to local host files with automatic log rotation support.
- **`syslog` / `journald`:** Forwards logs directly into the Linux host system logger.
- **`fluentd` / `gelf` / `awslogs`:** Streams log events directly over the network to centralized collectors (Elasticsearch, Graylog, AWS CloudWatch).

| Logging Driver | Destination | Rotation Support | Typical Environment |
|---|---|---|---|
| `local` | Host disk (optimized binary) | Built-in automatic rotation | Local development & standalone hosts |
| `json-file` | Host disk (JSON format) | Configurable via `max-size` | Standard default Linux Docker |
| `awslogs` | AWS CloudWatch Logs | Cloud-managed retention | Production EC2 & ECS clusters |
| `fluentd` | Fluentd / Fluent Bit daemon | Centralized aggregation | Large-scale microservice platforms |

## See it
Launch a container with strict log rotation limits:

```bash
# Run container configured to keep at most 3 log files of 10MB each
docker run -d --name rot-app \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  alpine sh -c 'while true; do echo "Active log $(date)"; sleep 1; done'
```

Inspect the container's active logging configuration:

```bash
docker inspect rot-app --format 'Driver: {{.HostConfig.LogConfig.Type}}, Options: {{json .HostConfig.LogConfig.Config}}'
# Driver: json-file, Options: {"max-file":"3","max-size":"10m"}
```

## Go deeper
To avoid configuring rotation flags on every individual `docker run` command, define default global logging options in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "5"
  }
}
```


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Unconstrained container log generation can fill the host disk and cause catastrophic outages.
- Always configure `max-size` and `max-file` when using the `json-file` driver.
- Set global daemon logging defaults in `/etc/docker/daemon.json`.
