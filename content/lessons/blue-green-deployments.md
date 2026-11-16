---
slug: blue-green-deployments
title: "Blue-Green Deployments with Containers"
topic: cicd-and-deployment
kind: pattern
summary: "Achieve instant zero-downtime cutover and atomic rollback using blue-green container environments."
tags: [blue-green, routing, cutover, rollback]
related: [recreate-vs-rolling-deployment, canary-deployments-health-gates, recreate-vs-rolling-deployment]
---
> **In one line:** Blue-green deployments run two identical production environments, switching traffic instantly via load balancers.

## The idea
While rolling updates eliminate downtime, they introduce a period of mixed-version concurrency. If a subtle bug is discovered halfway through rollout, rolling back requires another slow rolling replacement.

A **Blue-Green Deployment** eliminates mixed versions and provides instant rollback:
- **Blue Environment:** The active production environment currently serving 100% of live user traffic.
- **Green Environment:** An identical, idle duplicate environment where the new release is deployed.

The deployment sequence:
1. Deploy Version 2 into the idle Green environment.
2. Execute full automated integration tests and smoke tests against Green in isolation.
3. Switch the reverse proxy or load balancer router to point to Green.
4. Live user traffic shifts to Green instantly (zero downtime).
5. Blue remains on standby for instant rollback if anomalies appear.

```flow
edge: Edge Router | Traffic Switch @primary
blue-env: Blue Fleet | Active v1.0 @blue
green-env: Green Fleet | Idle v2.0 @green
edge -> blue-env: 100% live traffic
edge -> green-env: 0% live traffic
```

| Dimension | Blue-Green Deployment | Rolling Deployment |
|---|---|---|
| Traffic Switch | Instantaneous (router cutover) | Gradual over minutes |
| Rollback speed | Instant (re-point router to Blue) | Slow (rolling update in reverse) |
| Infrastructure cost | High (requires 200% capacity) | Low (requires ~120% capacity) |
| Mixed versions | Never (instant 100% shift) | Yes (mixed versions during rollout) |

## See it
Achieve an instant blue-green cutover using NGINX reverse proxy configuration switching:

```text
# /etc/nginx/conf.d/upstream.conf
upstream production_backend {
    # Blue: Active production
    # server 10.0.1.10:8080;

    # Green: Newly deployed release (uncommented to cut over)
    server 10.0.1.20:8080;
}

server {
    listen 80;
    location / {
        proxy_pass http://production_backend;
    }
}
```

Execute an atomic configuration reload without dropping in-flight TCP connections:

```bash
# NGINX reloads configuration gracefully in microseconds
docker exec reverse-proxy nginx -s reload
```

## Go deeper
Database migrations in blue-green deployments must be non-breaking (expanding the schema before contracting it). The database must support both the old Blue version and the new Green version simultaneously during the cutover window.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Blue-green deployments maintain two identical environments, switching traffic at the router level.
- Provides instant zero-downtime releases and immediate atomic rollback capabilities.
- Requires non-breaking database schema changes to accommodate rapid cutovers.
