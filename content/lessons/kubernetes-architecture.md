---
slug: kubernetes-architecture
title: "Kubernetes Control Plane & Nodes"
topic: orchestration-and-iac
kind: concept
summary: "A conceptual tour of Kubernetes architecture: the API server, etcd, scheduler, kubelet, and worker nodes."
tags: [kubernetes, control-plane, kubelet, api-server]
related: [why-orchestration, docker-swarm-vs-kubernetes, kubernetes-pods-and-deployments]
since: "1.0"
---
> **In one line:** The Kubernetes control plane manages desired state while worker nodes execute container workloads via kubelet.

## The idea
A Kubernetes cluster divides responsibilities into two distinct architectural tiers: the **Control Plane** (the brain) and **Worker Nodes** (the muscle).

**The Control Plane (Master Nodes):**
Maintains the desired state, schedules workloads, and responds to cluster events:
1. **`kube-apiserver`:** The central gateway. All external `kubectl` commands and internal node communications communicate strictly via this REST API.
2. **`etcd`:** A highly consistent, distributed key-value store that holds the entire cluster state, configurations, and secrets.
3. **`kube-scheduler`:** Evaluates unassigned workloads and selects the optimal worker node based on resource availability, affinity, and taints.
4. **`kube-controller-manager`:** Runs background reconciliation loops (Node Controller, Replication Controller) to enforce desired state.

**Worker Nodes:**
Physical or virtual machines that actually run application containers:
1. **`kubelet`:** An agent that registers the node with the API server, receives container specifications (PodSpecs), and instructs the container runtime to launch containers.
2. **Container Runtime (containerd / CRI-O):** The OCI engine that pulls images and executes container processes.
3. **`kube-proxy`:** Manages host network routing rules and packet forwarding for Kubernetes Services.

```flow
client: kubectl CLI | Developer terminal @primary
api-server: kube-apiserver | Central REST API @primary
etcd: etcd | Distributed key-value store @amber
scheduler: kube-scheduler | Node placement @blue
controller: kube-controller | Reconciler @blue
kubelet: kubelet daemon | Runs on worker nodes @green
client -> api-server
api-server -> etcd
api-server -> scheduler
api-server -> controller
api-server -> kubelet
```

## See it
Use `kubectl` to query cluster nodes and component health:

```bash
# List all physical/virtual worker nodes in the cluster
kubectl get nodes -o wide
```

The output shows node statuses, Kubernetes versions, and the underlying container runtime:

```text
NAME       STATUS   ROLES           AGE   VERSION   CONTAINER-RUNTIME
node-01    Ready    control-plane   32d   v1.31.0   containerd://1.7.20
node-02    Ready    worker          32d   v1.31.0   containerd://1.7.20
node-03    Ready    worker          32d   v1.31.0   containerd://1.7.20
```

## Go deeper
Notice the container runtime listed above is `containerd://`. Kubernetes communicates with runtimes via the standardized **Container Runtime Interface (CRI)**, proving that your Docker-built OCI images run natively without requiring the Docker desktop daemon on the cluster nodes.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- The control plane components (API server, etcd, scheduler, controllers) manage cluster state.
- Worker nodes execute containers via the `kubelet` agent and an OCI runtime like `containerd`.
- All cluster communications flow strictly through the authenticated `kube-apiserver`.
