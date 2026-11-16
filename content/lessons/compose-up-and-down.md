---
slug: compose-up-and-down
title: "Managing Compose Stacks: up & down"
topic: compose
kind: tool
summary: "Manage multi-container application lifecycles with docker compose up, down, ps, and logs."
tags: [compose-up, compose-down, detached, logs]
related: [compose-services-and-build, compose-networking-dns, compose-depends-on-health]
---
> **In one line:** Use docker compose up -d to launch stacks, logs -f to monitor them, and down -v to clean up.

## The idea
Managing multiple interdependent containers individually with single Docker CLI commands quickly leads to state drift. Docker Compose abstracts the entire application into unified lifecycle operations:

- **`docker compose up`**: Analyzes the `compose.yaml` graph, creates missing networks and volumes, builds updated images, and boots containers in dependency order.
- **`docker compose down`**: Stops running containers, removes containers and default networks, and cleans up execution state.
- **`docker compose ps`**: Displays the status, port mappings, and health states of all containers belonging to the project.
- **`docker compose logs -f [service]`**: Aggregates and color-codes log output from all services into a single unified terminal stream.

| Command | Action | Key Options |
|---|---|---|
| `docker compose up` | Creates and starts stack | `-d` (detached), `--build` (force rebuild) |
| `docker compose down` | Stops and destroys stack | `-v` (also remove volumes), `--rmi all` |
| `docker compose ps` | Lists project containers | `--format table`, `-a` (show all) |
| `docker compose restart` | Restarts service processes | `[service-name]` |

## See it
Launch, inspect, and tear down a multi-container stack:

```bash
# Launch entire application stack in background
docker compose up -d

# Inspect status of stack services
docker compose ps
```

The command lists all services and their port bindings:

```text
NAME                  IMAGE             COMMAND                  SERVICE   STATUS    PORTS
myproject-web-1       myproject-web     "docker-entrypoint.s…"   web       running   0.0.0.0:8080->8080/tcp
myproject-db-1        postgres:16       "docker-entrypoint.s…"   db        running   5432/tcp
```

Stream logs from a specific service:

```bash
# Stream live logs from the web container only
docker compose logs -f --tail 20 web

# Tear down containers and delete named volumes completely
docker compose down -v
```

## Go deeper
When you edit `compose.yaml` and re-run `docker compose up -d`, Compose performs smart state reconciliation: it restarts only the specific containers whose configurations or images have changed, leaving unaffected services running undisturbed.

## Watch out
- Running `docker compose down -v` permanently purges all attached named volumes; omit `-v` if you wish to retain database data.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `docker compose up -d` creates networks, builds images, and starts containers in the background.
- `docker compose ps` and `docker compose logs -f` provide unified stack visibility.
- `docker compose down -v` safely stops containers, unplugs networks, and removes volumes.
