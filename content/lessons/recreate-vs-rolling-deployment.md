---
slug: recreate-vs-rolling-deployment
title: "Recreate vs Rolling Deployments"
topic: cicd-and-deployment
kind: pattern
summary: "Compare recreate deployment downtime with zero-downtime rolling update strategies for containerized apps."
tags: [deployment, recreate, rolling-update, zero-downtime]
related: [blue-green-deployments, canary-deployments-health-gates, tagging-strategies]
---
> **In one line:** Recreate stops all old containers before starting new ones; Rolling replaces containers incrementally for zero downtime.

## The idea
When deploying an updated container image to production, how do you transition from Version 1 to Version 2 without disrupting end users?

Two primary deployment strategies exist:

1. **Recreate Strategy:**
   - Shuts down and removes all Version 1 containers simultaneously.
   - Launches Version 2 containers once Version 1 is completely stopped.
   - **Trade-off:** Incurs user-facing **downtime** during the restart window, but guarantees that Version 1 and Version 2 never run concurrently. Necessary when an update introduces breaking database schema changes.

2. **Rolling Update Strategy:**
   - Gradually replaces Version 1 containers with Version 2 containers in batches (e.g. 25% at a time).
   - Upstream load balancers route traffic away from old containers and onto new healthy containers.
   - **Trade-off:** Achieves **zero downtime**, but requires application code and database schemas to be backward-compatible because both versions run simultaneously during rollout.

```text
Recreate Strategy (DOWNTIME):
  [V1] [V1] [V1] ---> [STOP ALL] ---> [DOWNTIME WINDOW] ---> [V2] [V2] [V2]

Rolling Update Strategy (ZERO DOWNTIME):
  Step 1: [V1] [V1] [V1] [V2]  (V2 spins up & passes healthcheck)
  Step 2: [V1] [V1] [V2] [V2]  (First V1 container retired)
  Step 3: [V1] [V2] [V2] [V2]  (Second V1 container retired)
  Step 4: [V2] [V2] [V2] [V2]  (Rollout 100% complete!)
```

| Strategy | Downtime? | Resource Overhead | Version Concurrency |
|---|---|---|---|
| Recreate | Yes (seconds to minutes) | Minimal (no extra capacity) | Never (single version active) |
| Rolling | No (zero downtime) | Moderate (temporary extra pods) | Yes (both versions run during rollout) |

## See it
Configure a rolling update deployment in Docker Compose (when deployed in Swarm mode) or Kubernetes:

```yaml
services:
  web:
    image: my-app:v2
    deploy:
      replicas: 4
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
        failure_action: rollback
```

## Go deeper
Notice `order: start-first`. This instructs the scheduler to launch and verify the health of the new container **before** stopping the old container, guaranteeing that service capacity never dips below 100% during the deployment.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Recreate causes temporary downtime but avoids multi-version database concurrency.
- Rolling updates replace instances gradually to achieve zero downtime.
- Configure `start-first` and robust healthchecks to ensure seamless rolling updates.
