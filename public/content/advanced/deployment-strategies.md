---
id: lesson-19
slug: deployment-strategies
title: "Deployment Strategies"
level: advanced
order: 19
duration: 24
tags:
  - deployment
  - rolling
  - blue-green
  - canary
  - rollback
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the recreate, rolling, blue-green, and canary deployment strategies.
- Explain the downtime and risk trade-offs of each.
- Say why immutable container images make deployments and rollbacks safer.
- Use health checks as a gate that stops a bad release.
- Roll back quickly when a release goes wrong.

# Why It Matters

Getting a new image built is only half the job — you still have to **replace the running version**
without breaking things for users. How you do that determines whether a deploy is invisible or causes
an outage, and whether a bad release is a shrug or a crisis. These strategies are the standard toolkit,
and containers make all of them easier because each version is an immutable, swappable unit.

# Concept Explanation

### Immutable deploys: the foundation

With containers, you do not patch a running server — you **replace** its container with one built from
a new image. Because images are immutable and versioned, a deployment is "run version N+1 instead of
version N," and a **rollback** is simply "run version N again." This is what makes every strategy below
practical.

### Recreate

The simplest strategy: **stop the old version, then start the new one.**

```text
[v1 running] ── stop ──▶ (nothing) ── start ──▶ [v2 running]
```

- **Pro:** trivial; only one version runs at a time.
- **Con:** there is a **gap with downtime** between stop and start. Fine for internal tools or where
  brief downtime is acceptable.

### Rolling update

Replace instances **a few at a time**, so the service stays up throughout.

```text
[v1][v1][v1][v1] ─▶ [v2][v1][v1][v1] ─▶ [v2][v2][v1][v1] ─▶ ... ─▶ [v2][v2][v2][v2]
```

- **Pro:** no downtime; gradual; the default in orchestrators like Kubernetes.
- **Con:** both versions run simultaneously for a while (they must be compatible, especially with a
  shared database), and rollback is a second rolling update.

### Blue-green

Run **two complete environments**: **blue** (current) and **green** (new). Deploy to green, test it,
then **switch all traffic** from blue to green at once (usually at a load balancer).

```text
Traffic ─▶ [BLUE v1]      deploy+test     [GREEN v2]      switch      Traffic ─▶ [GREEN v2]
           [GREEN idle] ───────────────▶  ready          ──────────▶ [BLUE v1 kept as instant rollback]
```

- **Pro:** near-instant switch; instant rollback (switch back to blue); you test green before it takes
  traffic.
- **Con:** needs **double the resources** during the switch, and shared state (databases) needs care.

### Canary

Release the new version to a **small fraction** of users first, watch metrics, then gradually increase.

```text
95% ─▶ [v1]        watch errors/latency        50% ─▶ [v1]         100% ─▶ [v2]
 5% ─▶ [v2]  ───────────────────────────▶      50% ─▶ [v2]  ──────────────▶
```

- **Pro:** limits the blast radius — only a few users see a bad release; you decide to proceed or
  abort based on real metrics.
- **Con:** needs traffic-splitting and good monitoring; more moving parts.

### Health gates and automated rollback

Every strategy should be **gated on health**. New instances must pass a **health check** (and often a
period of good metrics) before they receive full traffic or the old ones are removed. If they fail,
the rollout **halts or reverses automatically** — the deploy stops before users are widely affected.

### Rolling back

Because you deploy immutable images, rolling back is fast and reliable: **redeploy the previous image
(ideally by digest).** Keep the prior version available (blue-green keeps it running; a registry keeps
the prior tag/digest) so recovery is a switch, not a rebuild.

# Key Terminology

- **Recreate** — stop the old version, then start the new (brief downtime).
- **Rolling update** — replace instances gradually with no downtime.
- **Blue-green** — two environments; switch traffic all at once; instant rollback.
- **Canary** — release to a small percentage first, then expand.
- **Health gate** — a check that must pass before traffic shifts or old instances retire.
- **Rollback** — redeploy the previous image (by digest) to recover.

# Syntax and Options

| Strategy | Downtime | Rollback speed | Extra resources | Best for |
| --- | --- | --- | --- | --- |
| Recreate | Yes (a gap) | Redeploy old image | None | Internal tools; downtime OK |
| Rolling | No | Second rollout | Small | Default for most services |
| Blue-green | No | Instant (switch back) | ~2x during switch | Low-risk, fast rollback needs |
| Canary | No | Stop/roll back the canary | Small | High-risk changes, big audiences |

# Hands-On Walkthrough

You can feel the difference between recreate and a manual "rolling-ish" swap even with plain Docker.

```text
Recreate (downtime):
  docker stop app && docker rm app          # app is DOWN here
  docker run -d --name app -p 80:3000 myteam/app:v2

Blue-green (no downtime), conceptually:
  # v1 (blue) is serving on the load balancer.
  docker run -d --name app-green -p 3001:3000 myteam/app:v2   # start green on a new port
  # health-check green on :3001; when healthy...
  # repoint the load balancer/proxy from blue (:3000) to green (:3001)  -> instant switch
  # keep blue running briefly as an instant rollback, then remove it
```

Real rolling updates and canaries are usually run by an orchestrator (Kubernetes) or a platform, which
automates the instance-by-instance replacement and the health gating — but the mental model is exactly
this.

# Real World Analogy

Think of replacing the tires on a car. **Recreate** is stopping the car, taking all four off, then
putting new ones on — it does not move meanwhile. **Rolling** is a pit crew swapping one wheel at a
time while the others hold it up. **Blue-green** is having a second, identical car ready and simply
driving that one instead — with the first kept running in case you need to jump back. **Canary** is
sending one new tire out on a test lap before committing to all four.

# Examples

## Example 1 — Basic: a safe recreate for an internal tool

Stop v1, start v2, accept a few seconds of downtime.

**Why this works:** For a low-traffic internal tool, simplicity wins. One version runs at a time, so
there are no compatibility concerns between versions, and the brief gap is acceptable.

## Example 2 — Real-world: blue-green for a customer-facing app

Deploy v2 to the idle (green) environment, run smoke tests against it, then flip the load balancer.

**Why this works:** Users never hit a half-deployed state, you validate v2 before it serves real
traffic, and if something is wrong you flip back to blue **instantly** — the fastest possible
rollback.

## Example 3 — Best practice / edge case: canary a risky change

Send 5% of traffic to v2, watch error rate and latency for a while, then ramp to 25%, 50%, 100% —
aborting if metrics degrade.

**Why this works:** A bad release harms only a small slice of users, and the decision to continue is
based on **real production metrics**, not hope. It is the safest way to ship a high-risk change to a
large audience.

# Common Mistakes

- **Assuming rolling updates are always safe** — two versions run at once, so an incompatible database
  migration can break the old version mid-rollout.
- **Blue-green without accounting for shared state** (the database is not duplicated), so schema
  changes still need care.
- **Canary without good monitoring** — if you cannot see error/latency changes, you cannot judge the
  canary.
- **No health gate**, so a broken new version receives full traffic before anyone notices.
- **No fast rollback path** — not keeping the previous image/digest available turns a quick switch
  into a slow rebuild.

# Best Practices

- Deploy **immutable images** and keep the **previous version** available for instant rollback.
- **Gate every rollout on health checks** (and ideally a short metrics soak) before shifting traffic.
- Match the strategy to **risk**: recreate for trivial/internal, rolling as the default, blue-green
  for fast rollback, canary for high-risk or large-audience changes.
- Design changes to be **backward compatible** (especially database migrations) so two versions can
  coexist during a rollout.
- Practice rollbacks so recovery is routine, not improvised.

# Summary

- Container deploys are **immutable swaps**: run the new image; roll back by running the previous one
  (by digest).
- **Recreate** is simple but has downtime; **rolling** avoids downtime by replacing instances
  gradually.
- **Blue-green** switches between two full environments for instant rollback; **canary** exposes a
  small fraction first and expands based on metrics.
- **Health gates** stop or reverse a bad rollout before it spreads.
- Choose the strategy by **risk**, keep the prior version ready, and make changes backward compatible.

# Flash Cards

Q: Why do immutable container images make deployments and rollbacks safer?
A: A deploy is just "run the new image" and a rollback is "run the previous image (by digest)"; nothing is patched in place, so both directions are reliable and repeatable.

Q: What is the main drawback of the recreate strategy?
A: There is a gap of downtime between stopping the old version and starting the new one, because they do not overlap.

Q: How does a rolling update avoid downtime, and what must you watch out for?
A: It replaces instances a few at a time so the service stays up; the catch is that both versions run simultaneously, so they must be compatible (especially with a shared database).

Q: How does blue-green deployment enable instant rollback?
A: You keep the old (blue) environment running while switching traffic to the new (green) one; if green misbehaves, you switch traffic back to blue immediately.

Q: What is a canary deployment?
A: Releasing the new version to a small fraction of users first, watching real metrics, then gradually increasing traffic — limiting the blast radius of a bad release.

Q: What role do health gates play in a deployment?
A: New instances must pass health checks (and ideally a metrics soak) before receiving full traffic or retiring the old ones; failing the gate halts or reverses the rollout automatically.

# Exercises

### Easy
Describe, for a simple internal tool, why the recreate strategy is an acceptable choice and what its
one downside is.

### Medium
Explain how you would perform a blue-green deployment with a load balancer in front of two container
environments, including how you would roll back if the new version failed its smoke tests.

### Challenging
You must ship a risky change to a high-traffic app. Design a canary rollout: what fraction you start
with, which metrics you watch, your criteria to proceed or abort, and how a backward-compatible
database change keeps both versions working during the rollout.

# Further Reading

- Deployment strategies (Kubernetes docs) — <https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy>
- Blue-green deployments — <https://martinfowler.com/bliki/BlueGreenDeployment.html>
- Canary release — <https://martinfowler.com/bliki/CanaryRelease.html>
- Progressive delivery (CD concepts) — <https://docs.docker.com/build/ci/>
