---
slug: prometheus-metrics-scraping
title: "Container Metrics & Prometheus"
topic: debugging-observability
kind: technique
summary: "Expose application and container metrics endpoints for automated Prometheus metric collection and alerting."
tags: [prometheus, metrics, scraping, monitoring]
related: [three-pillars-observability, healthcheck-instruction, container-resource-limits]
---
> **In one line:** Instrument applications to expose standard /metrics endpoints for automated scraping by Prometheus.

## The idea
Unlike logging systems (which push events out to collectors), **Prometheus** operates on a **pull model (scraping)**:
At regular intervals (e.g. every 15 seconds), the Prometheus monitoring server sends an HTTP GET request to each container's `/metrics` endpoint, collects the current time-series counters and gauges, and indexes them in its local time-series database.

Prometheus supports four fundamental metric types:
- **Counter:** A cumulative metric that only increases (or resets to zero on restart), such as total HTTP requests served (`http_requests_total`).
- **Gauge:** A value that goes up and down, such as active concurrent websocket connections or free memory.
- **Histogram:** Samples observations (usually request durations or payload sizes) and counts them in configurable buckets.
- **Summary:** Samples observations and calculates configurable quantiles (e.g. P50, P90, P99 latency).

| Metric Type | Example Metric Name | Question Answered |
|---|---|---|
| Counter | `http_requests_total` | How many total requests have we received? |
| Gauge | `active_db_connections` | How many connections are open right now? |
| Histogram | `http_request_duration_seconds_bucket` | What percentage of requests finished under 200ms? |

## See it
Expose Prometheus metrics in a Node.js microservice using the official `prom-client` library:

```text
const express = require('express');
const client = require('prom-client');
const app = express();

// Enable collection of default Node.js and system metrics
client.collectDefaultMetrics();

// Define custom business metric
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'status_code']
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(8080);
```

Test querying the metrics endpoint using `curl`:

```bash
curl -s http://localhost:8080/metrics | grep process_resident_memory_bytes
```

The query yields the process memory metric:

```text
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 38428672
```

## Go deeper
To monitor container-level resource statistics (CPU, memory, network, and disk I/O) without modifying application code, deploy Google's open-source **cAdvisor (Container Advisor)** as a standalone daemon container. cAdvisor auto-discovers all containers on the host and exports Prometheus metrics natively.

## Remember
- Prometheus uses an HTTP pull model to scrape metrics endpoints on regular intervals.
- Use Counters for cumulative events and Gauges for fluctuating states.
- Deploy cAdvisor alongside microservices to collect container-level cgroup metrics automatically.
