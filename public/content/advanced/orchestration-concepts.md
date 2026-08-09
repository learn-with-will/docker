---
id: lesson-20
slug: orchestration-concepts
title: "Orchestration Concepts"
level: advanced
order: 20
duration: 24
tags:
  - orchestration
  - scaling
  - self-healing
  - swarm
  - kubernetes
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what container orchestration is and the problems it solves.
- Describe scheduling, scaling, self-healing, service discovery, and load balancing.
- Explain the "desired state" model and reconciliation.
- Say where plain Docker Compose stops being enough.
- Compare Docker Swarm and Kubernetes at a high level.

# Why It Matters

Everything so far runs containers on **one machine**. Real production systems run **many containers
across many machines**, need to survive hardware failures, scale up under load, and update without
downtime. Doing that by hand is impossible. **Orchestration** automates it. Understanding the concepts
here is what lets the next lesson (Kubernetes) make sense instead of feeling like alphabet soup.

# Concept Explanation

### What orchestration is

A **container orchestrator** manages containers across a **cluster** of machines (nodes). You tell it
*what* you want — "run 5 replicas of this image, keep them healthy, expose them on this port" — and it
figures out *how*: where to place containers, how to restart failed ones, and how to route traffic to
them.

### The desired-state model

This is the central idea. You declare a **desired state** (usually in YAML), and the orchestrator
continuously **reconciles** reality toward it:

```text
You declare:   "I want 5 healthy replicas of api:1.4.0"
Orchestrator:  observes 4 running (one crashed) ─▶ starts 1 more ─▶ back to 5
               observes a node died, losing 2 ─▶ reschedules 2 elsewhere ─▶ back to 5
```

You do not run imperative "start a container" commands; you state the goal, and the system keeps
matching it. This is the same declarative philosophy as Infrastructure as Code (a later lesson).

### What orchestrators provide

- **Scheduling** — deciding which node runs each container, based on resources and constraints.
- **Scaling** — running more or fewer replicas, sometimes automatically based on load (autoscaling).
- **Self-healing** — restarting crashed containers and rescheduling those on failed nodes.
- **Service discovery** — a stable name/address for a set of replicas, wherever they run.
- **Load balancing** — spreading traffic across replicas.
- **Rolling updates & rollbacks** — the deployment strategies from the previous lesson, automated.

### Where Compose stops being enough

Docker Compose is excellent for **defining and running a multi-container app on a single host**
(especially in development). But on its own it does not:

- Spread containers across **multiple machines**.
- **Reschedule** work when a machine dies.
- **Autoscale** based on load.
- Provide cluster-wide service discovery and load balancing.

When you outgrow one host — for availability or scale — you reach for an orchestrator. (Compose files
can even be a starting point that maps onto orchestrator concepts.)

### Swarm vs Kubernetes

The two orchestrators you will hear about most:

| | Docker Swarm | Kubernetes |
| --- | --- | --- |
| Built into Docker | Yes (`docker swarm`) | No (separate system) |
| Learning curve | Gentle | Steep |
| Power/flexibility | Modest | Very high |
| Ecosystem | Small | Huge (the industry standard) |
| Good for | Small clusters, simple needs | Most production at scale |

**Docker Swarm** is simpler and built right into Docker — quick to start for small setups.
**Kubernetes** is far more powerful and has become the industry standard, with a large ecosystem and
managed offerings from every cloud. It is more complex, which is why we introduce it conceptually next.

# Key Terminology

- **Orchestrator** — software that manages containers across a cluster.
- **Cluster / node** — the group of machines / an individual machine in it.
- **Desired state** — the declared goal the orchestrator maintains.
- **Reconciliation** — continuously adjusting reality to match the desired state.
- **Self-healing** — automatically replacing failed containers/nodes.
- **Service discovery** — a stable address for a changing set of replicas.

# Syntax and Options

| Capability | What it means |
| --- | --- |
| Scheduling | Placing containers on suitable nodes |
| Scaling | Adjusting replica count (manual or auto) |
| Self-healing | Restarting/rescheduling failed workloads |
| Service discovery | Stable naming for replica sets |
| Load balancing | Distributing traffic across replicas |
| Declarative config | You state the goal; the system maintains it |

# Hands-On Walkthrough

This lesson is conceptual, but you can experience the desired-state idea with a thought experiment
using ideas you know.

```text
Single host (Compose): you run "docker compose up -d --scale web=3".
  A machine dies -> all 3 web containers are gone. Nothing brings them back automatically.

Cluster (orchestrator): you declare "web: 3 replicas".
  A node dies, taking 1 replica -> the orchestrator notices state (2) != desired (3)
  -> it schedules a new replica on a healthy node -> back to 3, no human involved.
```

The difference is not the containers — it is the **control loop** that keeps watching and correcting.

# Real World Analogy

An orchestrator is like an **air-traffic control system** for containers. You do not tell each plane
exactly which runway and gate to use; you declare the schedule and constraints, and the system
assigns gates, reroutes around a closed runway (a failed node), and adds capacity during a rush
(scaling). If a gate becomes unavailable, control **reassigns** the flight automatically — that is
reconciliation toward the desired state.

# Examples

## Example 1 — Basic: self-healing in words

You declare 3 replicas of a service. One container crashes.

**Why this works:** The orchestrator sees only 2 running versus the desired 3 and starts a replacement
automatically — no page in the middle of the night for a simple crash.

## Example 2 — Real-world: surviving a node failure

A worker node goes offline, taking several containers with it.

**Why this works:** The orchestrator detects the lost node, marks its workloads as missing, and
**reschedules** them onto healthy nodes, restoring the desired replica counts across the cluster.

## Example 3 — Best practice / edge case: choosing Swarm vs Kubernetes

A small team with a couple of servers and simple needs picks **Swarm** for its simplicity; a company
running many services at scale picks **Kubernetes** for its power and ecosystem.

**Why this works:** The right orchestrator matches the team's scale and complexity. Kubernetes is
powerful but heavy; Swarm is limited but easy — neither is "best" in the abstract.

# Common Mistakes

- **Expecting Compose to self-heal across machines.** It runs a multi-container app on one host; it is
  not a cluster orchestrator.
- **Thinking imperatively.** Orchestrators are declarative — you state desired state, not step-by-step
  actions.
- **Adopting Kubernetes for a tiny workload.** Its complexity may outweigh the benefit; simpler options
  can be right.
- **Ignoring health checks.** Self-healing and rolling updates depend on the orchestrator knowing what
  "healthy" means.
- **Assuming orchestration removes the need for good images.** It schedules your images; small, secure,
  well-built images still matter.

# Best Practices

- Reach for an orchestrator when you need **multi-host availability, scale, or self-healing** — not
  before.
- Embrace the **declarative, desired-state** model; store that config in version control.
- Define **health checks and resource requests/limits** so scheduling and self-healing work well.
- Match the tool to your **scale**: Swarm for simple, small clusters; Kubernetes for large or complex
  production.
- Keep using the container fundamentals — images, tags, security — underneath whatever orchestrator
  you choose.

# Summary

- **Orchestration** runs containers across a **cluster**, handling scheduling, scaling, self-healing,
  service discovery, and load balancing.
- Orchestrators use a **declarative desired-state** model and continuously **reconcile** reality to
  match it.
- **Docker Compose** manages a multi-container app on **one host**; it does not spread work across
  machines or self-heal across nodes.
- **Docker Swarm** is simple and built into Docker; **Kubernetes** is the powerful industry standard
  (introduced next).
- Choose an orchestrator based on your need for **availability and scale**, and keep good image
  practices underneath.

# Flash Cards

Q: What is container orchestration?
A: Software that manages containers across a cluster of machines, handling scheduling, scaling, self-healing, service discovery, load balancing, and rolling updates.

Q: What is the desired-state model?
A: You declare the goal (for example, 5 healthy replicas), and the orchestrator continuously reconciles reality toward it, correcting drift like crashed containers or failed nodes.

Q: What does self-healing mean in an orchestrator?
A: The orchestrator automatically restarts crashed containers and reschedules workloads from failed nodes onto healthy ones to restore the desired state.

Q: Why is plain Docker Compose not a substitute for an orchestrator?
A: Compose runs a multi-container app on a single host; it does not spread containers across machines, reschedule work when a machine dies, or autoscale.

Q: How do Docker Swarm and Kubernetes differ at a high level?
A: Swarm is simpler and built into Docker, good for small clusters; Kubernetes is far more powerful and the industry standard, with a big ecosystem but a steeper learning curve.

Q: Why do health checks matter to an orchestrator?
A: Self-healing and rolling updates rely on the orchestrator knowing whether a container is healthy, so it can replace unhealthy ones and gate traffic during updates.

# Exercises

### Easy
List three things an orchestrator does that plain Docker Compose on a single host does not, and give
a one-line reason each matters in production.

### Medium
Explain the desired-state model with a concrete example: what happens, step by step, when a node
running two of your five replicas suddenly fails.

### Challenging
A colleague wants to adopt Kubernetes for a single small internal service on one server. Argue both
sides — when the simplicity of Swarm (or even Compose) is the better call, and what would justify
moving to Kubernetes.

# Further Reading

- Kubernetes overview — <https://kubernetes.io/docs/concepts/overview/>
- Docker Swarm mode — <https://docs.docker.com/engine/swarm/>
- Kubernetes controllers & reconciliation — <https://kubernetes.io/docs/concepts/architecture/controller/>
- CNCF landscape — <https://landscape.cncf.io/>
