---
slug: kubernetes-pods-and-deployments
title: "Pods, ReplicaSets & Deployments"
topic: orchestration-and-iac
kind: concept
summary: "Master Kubernetes primitives: Pods as atomic execution units and Deployments for declarative replica management."
tags: [pods, deployments, replicasets, declarative]
related: [kubernetes-architecture, kubernetes-services-networking, kubectl-basics]
since: "1.0"
---
> **In one line:** A Pod is the smallest deployable container unit; a Deployment declaratively manages replicated Pods and rolling updates.

## The idea
In Kubernetes, you almost never run single standalone containers directly. Instead, Kubernetes introduces higher-level abstractions:

**1. The Pod:**
The atomic unit of deployment in Kubernetes. A Pod encapsulates **one or more containers** that share the same network namespace (IP address and port space) and storage volumes. While multi-container pods exist (e.g. an application container alongside a logging sidecar), the vast majority of pods follow the "one container per pod" pattern.

**2. The Deployment:**
Pods are ephemeral; if a pod crashes or its node dies, the pod is gone. A **Deployment** is a declarative controller that manages a **ReplicaSet**. You declare: "Run 3 replicas of my-image." The Deployment controller automatically creates the Pods, performs zero-downtime rolling updates when the image changes, and heals pods if they crash.

```tree
Deployment web-deployment | spec replicas 3 @primary
  ReplicaSet web-deployment-7b89f | Managed controller @blue
    Pod 1 | IP 10.244.1.12 with app:v2 @green
    Pod 2 | IP 10.244.2.45 with app:v2 @green
    Pod 3 | IP 10.244.3.89 with app:v2 @green
```

| Object | Level | Purpose |
|---|---|---|
| **Container** | Runtime | The isolated process created by containerd |
| **Pod** | Atomic unit | Shared network IP, storage, and lifecycle wrapper |
| **ReplicaSet** | Controller | Guarantees exact count of matching pods |
| **Deployment** | High-level | Declarative rolling updates, rollbacks, and scale |

## See it
Here is a declarative Kubernetes Deployment manifest (`deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  labels:
    app: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api-server
          image: ghcr.io/my-org/my-api:1.4.0
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"
```

Apply the manifest and inspect the resulting pods:

```bash
# Apply manifest to cluster
kubectl apply -f deployment.yaml

# List active pods managed by the deployment
kubectl get pods -l app=api
```

The output shows three replicas running concurrently:

```text
NAME                              READY   STATUS    RESTARTS   AGE
api-deployment-7b89f4c5d-4f1a2   1/1     Running   0          12s
api-deployment-7b89f4c5d-8b9c0   1/1     Running   0          12s
api-deployment-7b89f4c5d-x3y7z   1/1     Running   0          12s
```

## Go deeper
To update the application to a new image, run `kubectl set image deployment/api-deployment api-server=ghcr.io/my-org/my-api:1.5.0`. The Deployment controller automatically triggers a zero-downtime rolling replacement of the Pods.

## Remember
- Pods are the fundamental atomic deployable units in Kubernetes, encapsulating containers.
- Deployments provide declarative replica management, self-healing, and rolling update automation.
- Never deploy raw standalone Pods in production; always manage them via Deployments.
