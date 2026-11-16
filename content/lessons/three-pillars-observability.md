---
slug: three-pillars-observability
title: "The Three Pillars in Containers"
topic: debugging-observability
kind: concept
summary: "Implement logs, metrics, and distributed tracing across containerized architectures for holistic observability."
tags: [observability, logs, metrics, traces]
related: [docker-logs-and-drivers, structured-json-logging, prometheus-metrics-scraping]
---
> **In one line:** Modern container observability unites logs (events), metrics (aggregates), and distributed traces (request paths).

## The idea
When deploying monolithic applications on physical servers, operators logged in via SSH and ran `top` or grepped log files. In microservice environments—where hundreds of ephemeral containers start, scale, and terminate across a cluster—SSH debugging is impossible.

**Observability** is the measure of how well you can infer the internal state of a system based on its external outputs.

Cloud-native container observability rests upon three pillars:
1. **Logs (What happened):** Discrete, timestamped event records detailing specific occurrences (e.g. `User 42 failed password authentication`). Emitted as structured JSON to `stdout`.
2. **Metrics (Aggregated health):** Numerical measurements aggregated over time intervals (e.g. `HTTP request rate: 450 req/sec`, `Memory usage: 78%`, `P99 latency: 120ms`). Scraped by tools like Prometheus.
3. **Traces (Where time was spent):** Request journey maps that track a single user transaction across multiple microservices via distributed correlation IDs (OpenTelemetry, Jaeger).

```flow
client: User Request | correlation-id: 123 @primary
proxy: NGINX Proxy | logs event @blue
api: Core API | emits metrics @green
db: Database | records query trace @amber
client -> proxy: Trace start
proxy -> api: Propagate trace header
api -> db: SQL Query
```

| Observability Pillar | Primary Data Type | Typical Tool | Question Answered |
|---|---|---|---|
| Logs | Timestamped text / JSON | Loki, Elasticsearch, Fluent Bit | "Why did user 42 get an error?" |
| Metrics | Numerical time-series | Prometheus, Grafana, Datadog | "Are error rates spiking right now?" |
| Traces | Span graphs with timestamps | OpenTelemetry, Jaeger, Tempo | "Which microservice caused the 3s delay?" |

## See it
Observe how an application container exposes metrics and structured logs simultaneously:

```bash
# Query the application metrics endpoint
curl http://localhost:8080/metrics | head -n 5
```

The endpoint yields Prometheus-formatted metrics:

```text
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="GET",handler="/api",status="200"} 1420
http_requests_total{method="POST",handler="/api",status="500"} 3
```

## Go deeper
Standardize on the CNCF **OpenTelemetry (OTel)** framework. OpenTelemetry provides language-agnostic SDKs that instrument applications to collect traces, metrics, and logs using a single unified protocol (OTLP) without vendor lock-in.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Logs record discrete events; metrics track aggregated system performance; traces map request lifecycles.
- Containerized applications must stream logs to stdout and expose metrics endpoints over HTTP.
- Adopt OpenTelemetry to unify tracing and metrics instrumentation across languages.
