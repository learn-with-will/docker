---
id: lesson-17
slug: devops-and-cicd
title: "DevOps & the CI/CD Lifecycle"
level: advanced
order: 17
duration: 24
tags:
  - devops
  - cicd
  - pipeline
  - twelve-factor
  - culture
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what DevOps is, as both a culture and a set of practices.
- Distinguish **continuous integration**, **continuous delivery**, and **continuous deployment**.
- Describe the stages of a typical CI/CD pipeline.
- Say where container images fit as the deployable artifact.
- Summarize the twelve-factor principles most relevant to containers.

# Why It Matters

You now know how to build and run containers. DevOps is the culture and automation that turns that
skill into a reliable *flow*: code that moves from a developer's commit to production quickly, safely,
and repeatedly. Containers are the ideal unit for this flow — an immutable artifact that runs the same
everywhere — which is exactly why "Docker" and "DevOps" belong in the same course.

# Concept Explanation

### DevOps is culture first

**DevOps** is a way of working that brings **development** and **operations** together to deliver
software faster and more reliably. Before DevOps, developers "threw code over the wall" to a separate
operations team, and the two had opposing incentives (devs want change; ops want stability). DevOps
replaces that with **shared ownership**, **automation**, and **fast feedback**.

It is often summarized as **CALMS**: **C**ulture, **A**utomation, **L**ean, **M**easurement, and
**S**haring. The tools matter, but the culture — collaboration and shared responsibility — comes
first.

### Continuous integration (CI)

**Continuous integration** means developers merge small changes into a shared branch **frequently**,
and every change automatically triggers a **build and test**. The goal is to catch integration
problems early, while they are small. A CI run typically:

1. Checks out the code.
2. Installs dependencies.
3. Builds the project.
4. Runs automated tests (and often linting/security checks).

If any step fails, the change is rejected before it spreads.

### Continuous delivery vs continuous deployment

These share the initials **CD** but differ in the last step:

- **Continuous *delivery*** — every change that passes CI is automatically prepared and **ready to
  release**, but a human clicks the button to deploy to production.
- **Continuous *deployment*** — every change that passes all checks is **deployed to production
  automatically**, with no manual gate.

Both rely on a trustworthy pipeline; the difference is whether a person approves the final step.

### The pipeline

A **CI/CD pipeline** is the automated sequence a change flows through:

```text
Commit ─▶ Build ─▶ Test ─▶ Package (build image) ─▶ Publish (push image) ─▶ Deploy ─▶ Operate
   │         │        │            │                       │                  │          │
 trigger   compile  unit/integ  container image      registry (tag+digest)  rollout   monitor
```

Each stage is automated, and a failure stops the line. The earlier a problem is caught, the cheaper
it is to fix.

### Where containers fit

Containers make CI/CD dramatically simpler. The pipeline's key output is a **container image** — an
**immutable, versioned artifact**. Because the image bundles the app and its dependencies, "the thing
you tested" and "the thing you deploy" are byte-for-byte identical (pin the digest). You **build once**
and **promote the same image** through staging to production, rather than rebuilding per environment.

### Twelve-factor principles that matter here

The **twelve-factor app** methodology describes how to build services that thrive in this model. The
factors most relevant to containers:

- **Config in the environment** — no config baked into the image (you saw this with env vars).
- **Stateless processes** — keep state in backing services (databases, caches), so containers are
  disposable and scalable.
- **Logs as event streams** — write to stdout/stderr; let the platform route them.
- **Dev/prod parity** — keep environments as similar as possible (containers help enormously).

# Key Terminology

- **DevOps** — a culture and practice uniting development and operations for fast, reliable delivery.
- **CI (continuous integration)** — frequent merges with automated build and test.
- **Continuous delivery** — always ready to release, with a human approving the deploy.
- **Continuous deployment** — automatic deploy of every passing change.
- **Pipeline** — the automated stages a change flows through.
- **Artifact** — the versioned output that gets deployed (here, a container image).

# Syntax and Options

| Term | One-line meaning |
| --- | --- |
| CI | Merge often; auto build + test every change |
| Continuous delivery | Auto-prepare a release; human approves deploy |
| Continuous deployment | Auto-deploy every passing change |
| Artifact | The immutable image you build once and promote |
| CALMS | Culture, Automation, Lean, Measurement, Sharing |

# Hands-On Walkthrough

This lesson is conceptual, but you can map it onto the containers you already know. Trace one change
through a pipeline in your head (or on paper):

```text
1. You commit a code change and open a pull request.
2. CI runs: checkout -> install -> build -> test. Red? The PR is blocked.
3. Green? CI builds a Docker image and tags it (e.g. api:1.5.0 and api:sha-9f3a1c).
4. CI pushes the image to a registry (GHCR).
5. Delivery: the image is deployed to staging automatically; a human approves production.
   Deployment: it goes straight to production.
6. Operate: monitoring and logs confirm the release is healthy (next lessons).
```

Notice the container image is the hinge: built once in step 3, promoted unchanged through steps 4–6.

# Real World Analogy

A CI/CD pipeline is an **assembly line with quality gates**. Raw material (a commit) enters; each
station builds, tests, and packages it; a station that finds a defect **stops the line** so it never
reaches the customer. The **container image** is the sealed, labeled product coming off the line —
you ship the exact unit that passed inspection, not a fresh one assembled at the store.

# Examples

## Example 1 — Basic: a minimal CI definition (in words)

A CI job that, on every push: checks out code, installs dependencies, and runs the test suite,
failing the job if any test fails.

**Why this works:** It gives fast feedback on every change and prevents broken code from merging —
the foundation everything else builds on.

## Example 2 — Real-world: build-once, promote-many

A pipeline builds `api:1.5.0` once, pushes it, deploys that exact image to **staging**, and — after
approval — deploys the **same digest** to production.

**Why this works:** Promoting one immutable image guarantees production runs precisely what was tested
in staging. Rebuilding per environment risks subtle differences.

## Example 3 — Best practice / edge case: delivery vs deployment for risk

A team uses **continuous deployment** for a low-risk internal tool (every green change ships) but
**continuous delivery** for the customer-facing app (green changes wait for a human to approve).

**Why this works:** The pipeline is the same; only the final gate differs, matched to each service's
risk tolerance.

# Common Mistakes

- **Treating DevOps as only tools.** Without the culture of shared ownership and fast feedback, tools
  alone do not deliver.
- **Confusing continuous delivery and deployment.** Delivery keeps a human gate; deployment is fully
  automatic.
- **Rebuilding artifacts per environment.** Build once and promote the same image to keep tested and
  deployed identical.
- **Baking config into the image**, breaking build-once-run-anywhere and leaking secrets.
- **Skipping tests to "go faster."** A pipeline without meaningful gates just ships bugs faster.

# Best Practices

- Invest in **culture**: shared ownership, blameless learning, and automation people trust.
- Keep changes **small and frequent** so CI catches problems while they are cheap.
- Make the **container image** the single, immutable artifact you **build once and promote**.
- Follow **twelve-factor** habits: config in the environment, stateless processes, logs to stdout.
- Choose **delivery vs deployment per service**, based on its risk.

# Summary

- **DevOps** unites development and operations around shared ownership, automation, and fast feedback
  (CALMS).
- **CI** merges changes frequently with automated build and test; **continuous delivery** keeps a
  human deploy gate, while **continuous deployment** removes it.
- A **pipeline** automates commit → build → test → package → publish → deploy → operate, stopping on
  failure.
- The **container image** is the immutable artifact — **build once, promote unchanged**.
- **Twelve-factor** habits (config in env, stateless, logs as streams, dev/prod parity) make services
  fit this model.

# Flash Cards

Q: What is DevOps, in one sentence?
A: A culture and set of practices that unite development and operations through shared ownership, automation, and fast feedback to deliver software quickly and reliably.

Q: What is continuous integration (CI)?
A: The practice of merging small changes frequently, with every change automatically triggering a build and automated tests to catch problems early.

Q: What is the difference between continuous delivery and continuous deployment?
A: In continuous delivery every passing change is made ready to release but a human approves the production deploy; in continuous deployment every passing change is deployed to production automatically.

Q: Why is a container image an ideal CI/CD artifact?
A: It is immutable and versioned and bundles the app with its dependencies, so you build it once and promote the exact same image through staging to production — what you tested is what you deploy.

Q: What does CALMS stand for?
A: Culture, Automation, Lean, Measurement, and Sharing — a summary of the DevOps mindset.

Q: Name two twelve-factor habits that matter for containers.
A: Keep configuration in the environment (not baked into the image) and keep processes stateless (store state in backing services); also log to stdout/stderr and keep dev/prod parity.

# Exercises

### Easy
In your own words, explain the difference between continuous delivery and continuous deployment, and
give one example of a service you would run each way.

### Medium
Draw the stages of a CI/CD pipeline from commit to operate, and mark which stage produces the
container image and which stage pushes it to a registry.

### Challenging
Explain why "build once, promote the same image" is safer than rebuilding the artifact for each
environment. Include how pinning a digest strengthens the guarantee.

# Further Reading

- The Twelve-Factor App — <https://12factor.net/>
- CI/CD with Docker — <https://docs.docker.com/build/ci/>
- GitHub: About continuous integration — <https://docs.github.com/en/actions/concepts/overview/continuous-integration>
- CNCF (cloud native landscape) — <https://www.cncf.io/>
