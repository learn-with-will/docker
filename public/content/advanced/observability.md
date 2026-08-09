---
id: lesson-23
slug: observability
title: "Observability: Logs, Metrics & Health"
level: advanced
order: 23
duration: 26
tags:
  - observability
  - metrics
  - logging
  - tracing
  - monitoring
---

# Learning Objectives

By the end of this lesson you will be able to:

- Name the three pillars of observability and what each is for.
- Explain structured logging and why it beats plain text.
- Describe what metrics are and the pull-based model Prometheus uses.
- Distinguish liveness from readiness checks.
- Understand tracing and how alerting turns signals into action.

# Why It Matters

Once your containers run across a pipeline and maybe a cluster, you cannot watch them by hand. When
something goes wrong at 2 a.m., **observability** is the difference between "we can see exactly which
service is slow and why" and "everything's on fire and we're guessing." It is the "operate" end of the
DevOps lifecycle — how you know your deployed containers are actually healthy.

# Concept Explanation

### Monitoring vs observability

**Monitoring** answers *known* questions: "is CPU above 80%?", "is the service up?" — dashboards and
alerts you set up in advance. **Observability** is the broader property of being able to ask **new**
questions about your system from its outputs, including ones you did not anticipate ("why are requests
from this one customer slow?"). Good observability is built from three kinds of data.

### The three pillars

- **Logs** — timestamped records of discrete events ("request failed", "user logged in"). Great for
  detail and debugging a specific incident.
- **Metrics** — numeric measurements over time (request rate, error count, latency, memory use). Cheap
  to store and perfect for trends, dashboards, and alerts.
- **Traces** — the path of a single request as it flows **across services**, with timing at each hop.
  Essential for finding *where* time goes in a distributed system.

Together they answer different questions: metrics tell you *something is wrong*, traces tell you *where*,
and logs tell you *why*.

### Structured logging

You already know to log to **stdout/stderr**. The next step is **structured logging**: emit logs as
machine-readable records (typically JSON) with consistent fields, rather than free-form text.

```json
{"time":"2026-08-09T10:15:00Z","level":"error","service":"api","route":"/orders","status":500,"latency_ms":812,"msg":"db timeout"}
```

Structured logs can be filtered, searched, and aggregated ("show all 500s on /orders in the last hour")
in a way plain-text logs cannot. A log collector ships them to a central system for querying.

### Metrics and the pull model

A **metric** is a named number tracked over time. Common types:

- **Counter** — only goes up (total requests, total errors).
- **Gauge** — goes up and down (memory in use, active connections).
- **Histogram** — buckets observations to summarize a distribution (request latency percentiles).

**Prometheus** is the de facto standard for metrics in the container world. It uses a **pull model**:
each service exposes a `/metrics` endpoint, and Prometheus **scrapes** it on a schedule, storing the
values as time series. **Grafana** then queries Prometheus to draw dashboards. (Prometheus and Grafana
are both CNCF-hosted projects widely used with Kubernetes.)

### Health checks: liveness vs readiness

You met Docker's `HEALTHCHECK`. Orchestrators refine this into two distinct probes (Kubernetes calls
them exactly this):

- **Liveness** — "is the app **alive**?" If it fails, the platform **restarts** the container (e.g. it
  is deadlocked).
- **Readiness** — "is the app **ready to serve traffic**?" If it fails, the platform **stops sending it
  traffic** (but does not restart it) until it recovers — useful during startup or while a dependency is
  briefly unavailable.

Getting these right prevents both "we kept sending traffic to a broken instance" and "we restarted a
container that was just warming up."

### Tracing and alerting

- **Distributed tracing** follows one request across many services, assigning it a shared ID so you can
  see the full timeline and spot the slow hop. OpenTelemetry is the common, vendor-neutral standard for
  producing traces (and metrics/logs).
- **Alerting** turns signals into action: define thresholds or conditions (often around **SLIs** —
  service level indicators like error rate or latency, and **SLOs** — the targets for them) and notify a
  human or system when they are breached. The goal is to alert on **symptoms users feel**, not on every
  minor blip.

# Key Terminology

- **Observability** — the ability to understand a system's internal state from its outputs.
- **Logs / Metrics / Traces** — the three pillars: events, numbers over time, and per-request paths.
- **Structured logging** — machine-readable (e.g. JSON) logs with consistent fields.
- **Prometheus** — a metrics system that **scrapes** `/metrics` endpoints (pull model).
- **Liveness vs readiness** — restart-if-dead vs stop-sending-traffic-if-not-ready.
- **SLI / SLO** — a measured indicator of service level and the target for it.

# Syntax and Options

| Pillar / Concept | Answers the question | Typical tool |
| --- | --- | --- |
| Logs | *Why* did this happen? | Log collector + central store |
| Metrics | *Is* something wrong; what's the trend? | Prometheus + Grafana |
| Traces | *Where* is the time/failure? | OpenTelemetry-based tracing |
| Liveness probe | Should we restart it? | Orchestrator |
| Readiness probe | Should we send it traffic? | Orchestrator |

# Hands-On Walkthrough

This lesson is conceptual, but you can connect it to what you have already run.

```text
Local, with plain Docker:
  docker logs -f api          # the "logs" pillar (make these structured/JSON)
  docker stats                # a taste of the "metrics" pillar (CPU/mem over time)

In production:
  - The app also exposes /metrics; Prometheus scrapes it every 15s.
  - Grafana graphs request rate, error rate, and latency from those metrics.
  - A readiness probe hits /ready; a liveness probe hits /healthz.
  - Traces (via OpenTelemetry) show a slow request spent 600ms in the database call.
  - An alert fires when the error-rate SLO is breached, paging an on-call engineer.
```

Same mental model as `docker logs`/`docker stats`, scaled up and made queryable and automatic.

# Real World Analogy

Observability is like the **instrumentation of a hospital patient**. **Metrics** are the continuous
vital-sign monitors (heart rate, blood pressure) — cheap, always on, great for spotting a trend or
triggering an alarm. **Logs** are the detailed chart notes for each event ("administered medication at
10:15"). **Traces** are following one test sample through every lab station to see where the delay was.
**Liveness/readiness** are "is the patient alive?" versus "is the patient ready to be discharged?" — very
different questions with very different responses.

# Examples

## Example 1 — Basic: structured logs you can query

Switch from `print("error saving order")` to a JSON log line with `level`, `route`, `status`, and
`latency_ms` fields.

**Why this works:** Now you can ask precise questions ("all `status:500` on `/orders` in the last
hour") and aggregate across many containers, which free-form text makes painful.

## Example 2 — Real-world: metrics-driven dashboard and alert

The app exposes `/metrics`; Prometheus scrapes request count, error count, and latency histogram;
Grafana graphs them; an alert fires when the 5-minute error rate exceeds the SLO.

**Why this works:** Metrics are cheap to store over time, so they power both the at-a-glance dashboard
and the automated alert on the symptom users actually feel (errors).

## Example 3 — Best practice / edge case: liveness vs readiness during startup

An app that needs 20 seconds to warm up passes **liveness** immediately (the process is alive) but
fails **readiness** until warm-up completes.

**Why this works:** The platform does not restart the healthy-but-warming container (liveness passes),
and it correctly withholds traffic until the app is actually ready (readiness fails, then passes) —
avoiding both needless restarts and errors from premature traffic.

# Common Mistakes

- **Only logging, no metrics.** Logs are detailed but expensive to scan for trends; metrics are what you
  alert and dashboard on.
- **Free-form text logs** that cannot be filtered or aggregated. Emit structured logs.
- **Conflating liveness and readiness**, causing needless restarts (or traffic sent to a
  not-ready app).
- **Alerting on causes, not symptoms**, producing noise. Alert on what users feel (errors, latency).
- **Adding tracing everywhere at once** without a plan; start where latency actually matters.

# Best Practices

- Use **all three pillars**: metrics to detect and alert, traces to localize, logs to explain.
- Emit **structured logs** to stdout/stderr and ship them to a central, queryable store.
- Expose **metrics** (Prometheus-style) and visualize with dashboards; alert on **SLOs/symptoms**.
- Implement **liveness and readiness** probes deliberately and test them.
- Adopt a vendor-neutral standard like **OpenTelemetry** so instrumentation is portable.

# Summary

- **Observability** lets you understand a system from its outputs; **monitoring** watches known
  questions.
- The **three pillars** are **logs** (why), **metrics** (is-it-wrong/trends), and **traces** (where).
- Prefer **structured logging** to stdout; expose **metrics** for a pull-based system like **Prometheus**
  and dashboard them in **Grafana**.
- **Liveness** decides restarts; **readiness** decides whether to send traffic — they are different.
- **Alert on symptoms/SLOs**, use **tracing** to localize latency, and standardize on
  **OpenTelemetry**.

# Flash Cards

Q: What are the three pillars of observability?
A: Logs (timestamped records of discrete events), metrics (numeric measurements over time), and traces (the path and timing of a single request across services).

Q: What question does each pillar best answer?
A: Metrics tell you that something is wrong (and the trend), traces tell you where the time or failure is, and logs tell you why it happened.

Q: What is structured logging and why prefer it?
A: Emitting logs as machine-readable records (usually JSON) with consistent fields, so they can be filtered, searched, and aggregated — unlike free-form text.

Q: How does Prometheus collect metrics?
A: With a pull model: each service exposes a /metrics endpoint and Prometheus scrapes it on a schedule, storing the values as time series (often visualized in Grafana).

Q: What is the difference between a liveness and a readiness probe?
A: Liveness asks whether the app is alive and, if it fails, the platform restarts the container; readiness asks whether the app can serve traffic and, if it fails, the platform stops sending it traffic without restarting it.

Q: What should you alert on, and what are SLIs/SLOs?
A: Alert on symptoms users actually feel (like error rate and latency). An SLI is a measured indicator of service level; an SLO is the target you set for that indicator.

# Exercises

### Easy
For each of the three pillars, write one question about a running service that it is best suited to
answer.

### Medium
Convert a plain-text log message into a structured JSON log line with at least four useful fields, and
explain one query the structured version makes easy that the text version does not.

### Challenging
Design health checks for an app that takes 15 seconds to warm up and depends on a database. Specify what
its liveness and readiness probes should check, and explain what the platform does when each fails
during startup and during a brief database outage.

# Further Reading

- Kubernetes liveness/readiness probes — <https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/>
- Prometheus overview — <https://prometheus.io/docs/introduction/overview/>
- OpenTelemetry — <https://opentelemetry.io/docs/what-is-opentelemetry/>
- Google SRE: monitoring & SLOs — <https://sre.google/sre-book/monitoring-distributed-systems/>
