---
id: lesson-22
slug: infrastructure-as-code
title: "Infrastructure as Code"
level: advanced
order: 22
duration: 24
tags:
  - iac
  - declarative
  - gitops
  - automation
  - configuration
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what Infrastructure as Code (IaC) is and why it matters.
- Distinguish declarative from imperative approaches.
- List the benefits of managing infrastructure through version-controlled files.
- Separate configuration from secrets.
- Describe the GitOps idea and how it relates to containers and Kubernetes.

# Why It Matters

You have been writing Infrastructure as Code all along without naming it: a Dockerfile, a
`compose.yaml`, a Kubernetes manifest, a GitHub Actions workflow — all are code that defines how
software is built and run. **IaC** takes that principle and applies it to entire environments: servers,
networks, databases, clusters. The result is infrastructure that is repeatable, reviewable, and
recoverable — the operational backbone of DevOps.

# Concept Explanation

### What IaC is

**Infrastructure as Code** means defining and managing infrastructure through **machine-readable files**
kept in version control, instead of clicking around a console or running ad-hoc commands. You describe
what you want — "a virtual machine of this size, a network with these rules, a database here" — in code,
and a tool makes it real.

### Declarative vs imperative

There are two styles, and the distinction mirrors what you saw with orchestration:

- **Imperative** — you specify the **steps**: "create this, then attach that, then open this port." You
  are responsible for the order and for the current state.
- **Declarative** — you specify the **end state**: "these resources should exist, configured like this."
  The tool figures out what to create, change, or delete to get there, and can re-run safely
  (**idempotent**).

Most modern IaC is **declarative**. Your Dockerfile, Compose file, and Kubernetes manifests are all
declarative descriptions of a desired state.

### Why IaC is worth it

- **Repeatable** — spin up an identical environment (dev, staging, prod) from the same files.
- **Reviewable** — infrastructure changes go through pull requests and code review like any code.
- **Versioned & auditable** — Git history shows who changed what, when, and why; you can roll back.
- **Recoverable** — rebuild lost infrastructure from the definitions instead of from memory.
- **Consistent** — no more "it works on that server because someone tweaked it by hand" (configuration
  drift).

### Configuration vs secrets

IaC separates two kinds of inputs:

- **Configuration** — non-sensitive settings (sizes, regions, feature flags, replica counts). These
  live in the code/config files.
- **Secrets** — sensitive values (passwords, API keys, certificates). These must **not** sit in plain
  text in the repository. Store them in a dedicated **secrets manager** (or the platform's secret
  mechanism) and reference them — the same principle you applied to container secrets.

### The tooling landscape (vendor-neutral)

Many tools implement IaC. Some provision cloud resources declaratively across providers; others
configure servers; container-world files (Dockerfiles, Compose, Kubernetes manifests) describe the
application layer. You do not need to learn a specific product here — what transfers is the
**mindset**: describe infrastructure in files, review them, apply them with a tool, and keep them in
Git.

### GitOps

**GitOps** applies IaC plus the desired-state model to operations: the **Git repository is the single
source of truth** for what should be running, and an automated agent **continuously reconciles** the
live system to match Git. To change production, you open a pull request; when it merges, the agent
rolls the change out. Benefits: every change is reviewed and audited, the system self-corrects drift
back toward Git, and rollback is "revert the commit." It pairs naturally with Kubernetes, whose
declarative manifests are exactly what a GitOps agent applies.

# Key Terminology

- **Infrastructure as Code (IaC)** — managing infrastructure through version-controlled files.
- **Declarative** — describe the desired end state; the tool reconciles to it (idempotent).
- **Imperative** — specify the ordered steps to reach a state.
- **Idempotent** — re-running produces the same result without duplicate side effects.
- **Configuration drift** — when a live system diverges from its defined state.
- **GitOps** — Git as the source of truth, with an agent reconciling the system to match it.

# Syntax and Options

| Concept | One-line meaning |
| --- | --- |
| Declarative IaC | State the end result; the tool makes it so |
| Imperative IaC | Script the exact steps yourself |
| Idempotent | Safe to apply repeatedly; converges to desired state |
| Config vs secrets | Settings in code; sensitive values in a secrets manager |
| GitOps | Merge to Git → agent reconciles the live system |

# Hands-On Walkthrough

You have already practiced IaC thinking. Map the files you know onto the concept:

```text
Dockerfile        -> declares how the IMAGE is built (desired image contents)
compose.yaml      -> declares the multi-service app for one host (desired local stack)
k8s manifests     -> declare Deployments/Services (desired cluster state)
CI workflow YAML  -> declares the pipeline (desired automation)
```

Now imagine adding infrastructure definitions (a cluster, a database, a network) as more files in the
same repository, reviewed by pull request and applied by a tool. A GitOps loop would look like:

```text
1. Open a PR that changes a manifest (e.g. replicas: 3 -> 5).
2. Teammates review and merge it.
3. A GitOps agent notices Git changed and reconciles the cluster to 5 replicas.
4. If someone hand-edits the cluster to 4, the agent restores it to 5 (drift correction).
```

Nothing is changed by hand in production; Git is the source of truth.

# Real World Analogy

IaC is the difference between **assembling furniture from memory** and **following the printed
instructions kept in a binder**. The binder (version-controlled code) means anyone can build the exact
same piece, you can see what changed between editions, and if a shelf collapses you rebuild it
identically. **GitOps** adds a diligent assistant who watches the finished room and, whenever something
drifts from the binder, quietly fixes it back.

# Examples

## Example 1 — Basic: declarative beats clicking

Instead of clicking through a console to create a server, you write a definition file and apply it.

**Why this works:** The file is repeatable and reviewable; a teammate (or you, in six months) can
recreate the exact same server, and Git records why it exists.

## Example 2 — Real-world: environments from the same code

The same infrastructure definitions, with different variables, produce **dev**, **staging**, and
**production** environments.

**Why this works:** Parameterizing one set of definitions keeps environments consistent and eliminates
"works in staging, breaks in prod" surprises caused by hand-built differences.

## Example 3 — Best practice / edge case: GitOps drift correction

Someone manually scales a Kubernetes Deployment down to save resources; the GitOps agent scales it back
to the value declared in Git.

**Why this works:** Git is the source of truth, so any out-of-band change is treated as drift and
corrected. To make the change stick, you change Git — which means it gets reviewed and recorded.

# Common Mistakes

- **Making changes by hand** in the console alongside IaC, causing drift the tools then fight.
- **Committing secrets** into IaC files; keep them in a secrets manager and reference them.
- **Treating imperative scripts as IaC.** Ad-hoc scripts you must run in order are fragile; prefer
  declarative, idempotent definitions.
- **Not version-controlling** the definitions, losing the audit trail and rollback ability.
- **Forgetting IaC needs testing too** — a bad definition can break infrastructure just like bad app
  code.

# Best Practices

- Keep **all** infrastructure definitions in **version control** and change them via pull requests.
- Prefer **declarative, idempotent** definitions over imperative scripts.
- Separate **configuration** (in code) from **secrets** (in a secrets manager).
- Parameterize definitions so **one source** produces consistent dev/staging/prod environments.
- Consider **GitOps** for Kubernetes so the cluster self-heals toward Git and every change is reviewed.

# Summary

- **Infrastructure as Code** manages infrastructure through **version-controlled files** instead of
  manual clicks or ad-hoc commands.
- **Declarative** definitions describe the desired end state and are **idempotent**; imperative ones
  script the steps. Your Dockerfiles, Compose files, and Kubernetes manifests are declarative IaC.
- IaC makes infrastructure **repeatable, reviewable, versioned, auditable, and recoverable**, and fights
  **configuration drift**.
- Keep **secrets out of the files**; use a secrets manager.
- **GitOps** makes Git the source of truth, with an agent continuously reconciling the system to match.

# Flash Cards

Q: What is Infrastructure as Code?
A: Defining and managing infrastructure through machine-readable, version-controlled files instead of manual console clicks or ad-hoc commands.

Q: What is the difference between declarative and imperative infrastructure?
A: Declarative describes the desired end state and lets the tool reconcile to it (idempotent); imperative specifies the exact ordered steps you must run yourself.

Q: Name three benefits of IaC.
A: It is repeatable (identical environments from the same files), reviewable (changes go through pull requests), and versioned/auditable (Git history shows who changed what, with easy rollback).

Q: How should secrets be handled in IaC?
A: Keep them out of the files; store sensitive values in a dedicated secrets manager (or the platform's secret mechanism) and reference them, keeping only non-sensitive configuration in code.

Q: What is GitOps?
A: An approach where the Git repository is the single source of truth for the desired state, and an automated agent continuously reconciles the live system to match Git — so changes happen via pull requests and drift is auto-corrected.

Q: What is configuration drift?
A: When a live system diverges from its defined/desired state, usually because of manual, out-of-band changes; declarative IaC and GitOps detect and correct it.

# Exercises

### Easy
List the files you have already written in this course that are examples of Infrastructure as Code, and
say what desired state each one declares.

### Medium
Explain the difference between declarative and imperative infrastructure with a concrete example, and
say why idempotency makes declarative definitions safe to re-apply.

### Challenging
Describe a GitOps workflow for changing the number of replicas of a Kubernetes Deployment from 3 to 5:
how the change is proposed, reviewed, applied, and what happens if someone later changes the live count
by hand.

# Further Reading

- Kubernetes: declarative object management — <https://kubernetes.io/docs/concepts/overview/working-with-objects/object-management/>
- The Twelve-Factor App: Config — <https://12factor.net/config>
- OpenGitOps principles — <https://opengitops.dev/>
- CNCF landscape (provisioning & automation) — <https://landscape.cncf.io/>
