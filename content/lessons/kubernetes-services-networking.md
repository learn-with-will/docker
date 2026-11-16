---
slug: kubernetes-services-networking
title: "Kubernetes Services & Networking"
topic: orchestration-and-iac
kind: concept
summary: "Provide stable IP endpoints and load balancing across dynamic pods using Kubernetes Services."
tags: [services, clusterip, nodeport, loadbalancer]
related: [kubernetes-pods-and-deployments, kubectl-basics, user-defined-bridge]
since: "1.0"
---
> **In one line:** A Kubernetes Service provides a stable IP address, DNS name, and load balancer across a dynamic set of Pods.

## The idea
Pods in Kubernetes are ephemeral. When a Deployment performs a rolling update or reschedules a failed container, the old Pods are terminated and new Pods are assigned entirely new, dynamic private IP addresses.

How can frontend clients reliably connect to a backend API if the backend Pod IPs change constantly?

A **Kubernetes Service** provides an immutable virtual IP address (ClusterIP) and a persistent internal DNS name. Using **label selectors**, the Service automatically discovers all healthy Pods matching those labels and load-balances incoming traffic across them.

Three primary Service types:
1. **ClusterIP (Default):** Exposes the service on an internal-only IP. Reachable only from within the cluster.
2. **NodePort:** Exposes the service on a static high-numbered port (30000–32767) across every worker node's physical IP address.
3. **LoadBalancer:** Integrates with cloud providers (AWS, GCP, Azure) to provision an external cloud load balancer routing public internet traffic directly into the cluster.

```flow
client: External Client | Internet @primary
svc: Kubernetes Service | Stable ClusterIP: 10.96.0.50 @blue
pod1: Pod 1 (api) | 10.244.1.12 @green
pod2: Pod 2 (api) | 10.244.2.45 @green
pod3: Pod 3 (api) | 10.244.3.89 @green
client -> svc: Requests to service name
svc -> pod1: Load balanced
svc -> pod2: Load balanced
svc -> pod3: Load balanced
```

| Service Type | Scope | Accessibility | Typical Use Case |
|---|---|---|---|
| **ClusterIP** | Internal | Inside cluster only | Databases, internal APIs, Redis caches |
| **NodePort** | Host ports | Physical node IPs | Local testing, bare-metal clusters |
| **LoadBalancer** | Public | Internet | Public-facing ingress proxies & web portals |

## See it
Define a Kubernetes Service manifest targeting pods labeled `app: api`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: 8080
```

Other pods anywhere in the cluster can now reach the API backend using standard DNS: `http://api-service/`.

## Go deeper
For complex HTTP/HTTPS routing, SSL termination, and path-based routing (e.g. `/api` vs `/static`), teams deploy an **Ingress Controller** (such as ingress-nginx or Traefik) fronting their ClusterIP services, consolidating multiple routes behind a single cloud load balancer.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Kubernetes Services provide stable IP addresses and internal DNS hostnames for dynamic pods.
- Label selectors automatically connect Services to healthy backend pod replicas.
- Use ClusterIP for internal microservices and LoadBalancer or Ingress for public web traffic.
