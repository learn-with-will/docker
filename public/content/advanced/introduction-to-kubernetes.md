---
id: lesson-21
slug: introduction-to-kubernetes
title: "Introduction to Kubernetes"
level: advanced
order: 21
duration: 30
tags:
  - kubernetes
  - pods
  - deployments
  - services
  - kubectl
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe a Kubernetes cluster: the control plane and worker nodes.
- Explain what a Pod, a Deployment, and a Service are.
- Read a simple Deployment and Service manifest.
- Use core `kubectl` commands to apply and inspect resources.
- See how the Docker image you build actually runs on a cluster.

# Why It Matters

Kubernetes (often written **K8s**) is the industry-standard container orchestrator — every major cloud
offers a managed version, and it is where a great many containerized apps run in production. You do not
need to master it to benefit from this course, but you should be able to read a basic manifest and know
how your image fits in. This lesson is a conceptual tour, verified against the official docs, so the
vocabulary stops being intimidating.

# Concept Explanation

### A cluster: control plane + nodes

A Kubernetes **cluster** is a set of machines split into two roles:

- The **control plane** is the brain. It makes global decisions and maintains the desired state. Key
  components: the **API server** (the front door you talk to), **etcd** (a key-value store holding
  cluster state), the **scheduler** (assigns Pods to nodes), and the **controller manager** (runs the
  reconciliation loops).
- **Worker nodes** run your workloads. Each node runs the **kubelet** (an agent that starts and watches
  containers), a network proxy (**kube-proxy**), and a **container runtime** (commonly **containerd** —
  the same project Docker uses).

You declare what you want to the API server; the control plane makes it so on the nodes.

### Pods: the smallest deployable unit

A **Pod** is the smallest thing Kubernetes deploys. It wraps **one or more containers** that share a
network identity (one IP) and storage. In practice a Pod usually holds **one** container — your app.
Pods are **ephemeral**: they can be created and destroyed at any time, getting a new IP each time. That
is why you rarely manage Pods directly.

### Deployments: managing Pods for you

You almost always manage Pods through a **Deployment**. A Deployment describes the desired state for a
set of identical Pods — which image, how many replicas — and manages a **ReplicaSet** that keeps that
number of Pods running. Deployments give you:

- **Self-healing** — a crashed Pod is replaced to maintain the replica count.
- **Scaling** — change `replicas` and Kubernetes adds or removes Pods.
- **Rolling updates and rollbacks** — change the image and Kubernetes replaces Pods gradually (and can
  roll back).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: ghcr.io/acme/web:1.4.0
          ports:
            - containerPort: 3000
```

The `template` is the Pod blueprint; `replicas: 3` says "keep three of these running"; the `selector`
ties the Deployment to Pods with the label `app: web`.

### Services: a stable address for Pods

Because Pods come and go (and change IPs), you need a stable way to reach them. A **Service** provides a
fixed name and IP for a set of Pods (chosen by label) and **load-balances** across them:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

Other Pods reach this Service at the name `web`, and traffic is spread across the three Pods. Common
Service types: **ClusterIP** (internal, the default), **NodePort** (exposes a port on each node), and
**LoadBalancer** (asks the cloud for an external load balancer). For HTTP routing to Services, clusters
often add an **Ingress**.

### Configuration: ConfigMaps and Secrets

Kubernetes keeps configuration out of images too: **ConfigMaps** hold non-sensitive config and
**Secrets** hold sensitive values, both injected into Pods as environment variables or files — the same
config-in-the-environment idea you already know.

### kubectl: talking to the cluster

**`kubectl`** is the command-line tool for the API server. The declarative workflow is to write YAML and
**apply** it:

```bash
kubectl apply -f deployment.yaml     # create/update from a manifest
kubectl get pods                     # list Pods
kubectl get deployments,services     # list Deployments and Services
kubectl rollout status deployment/web
kubectl scale deployment web --replicas=5
kubectl logs <pod-name>
```

### Where your Docker image fits

This is the payoff: **Kubernetes runs the exact OCI image you built and pushed.** The Deployment's
`image:` field points to your registry (`ghcr.io/acme/web:1.4.0`); the kubelet pulls it and runs it in a
container inside a Pod. Everything you learned about building small, secure, pinned images applies
unchanged — Kubernetes just schedules and manages those images across the cluster.

# Key Terminology

- **Cluster** — the set of machines running Kubernetes.
- **Control plane** — the components that manage the cluster (API server, etcd, scheduler, controllers).
- **Node** — a worker machine running the kubelet and a container runtime.
- **Pod** — the smallest deployable unit; one or more containers sharing network/storage.
- **Deployment** — declares desired Pods and manages a ReplicaSet (scaling, self-healing, updates).
- **Service** — a stable network endpoint that load-balances across a set of Pods.
- **kubectl** — the CLI for interacting with the cluster.

# Syntax and Options

| Resource / Command | Purpose |
| --- | --- |
| `kind: Deployment` | Desired set of identical Pods |
| `kind: Service` | Stable address + load balancing for Pods |
| `replicas: N` | How many Pod copies to keep running |
| `selector` / `labels` | How resources find the Pods they manage/target |
| `kubectl apply -f file.yaml` | Declaratively create/update resources |
| `kubectl get / describe / logs` | Inspect resources and Pods |
| `kubectl scale ... --replicas=N` | Change the replica count |

# Hands-On Walkthrough

Trace how a Deployment keeps its promise (you can try this on a local cluster like Minikube, kind, or
Docker Desktop's built-in Kubernetes).

```bash
# 1. Apply a Deployment and a Service.
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# 2. See the Pods it created.
kubectl get pods
```

```text
NAME                   READY   STATUS    RESTARTS   AGE
web-6d4f8c9b7f-2xk9p   1/1     Running   0          20s
web-6d4f8c9b7f-7nq4d   1/1     Running   0          20s
web-6d4f8c9b7f-p8m2s   1/1     Running   0          20s
```

```bash
# 3. Delete one Pod and watch Kubernetes replace it (self-healing).
kubectl delete pod web-6d4f8c9b7f-2xk9p
kubectl get pods            # a new Pod appears to restore the desired 3
```

```bash
# 4. Scale up, then roll out a new image.
kubectl scale deployment web --replicas=5
kubectl set image deployment/web web=ghcr.io/acme/web:1.5.0
kubectl rollout status deployment/web
```

You never told Kubernetes *how* to replace a Pod or *which node* to use — you declared intent, and the
control plane reconciled reality to match.

# Real World Analogy

Kubernetes is like a **staffing agency for a chain of restaurants**. You tell the agency (the control
plane) "keep three chefs on duty making this dish" (a Deployment). If a chef calls in sick (a Pod
crashes), the agency sends a replacement automatically. Customers do not ask for a chef by name; they
order through the **counter** (a Service), which routes each order to whichever chef is free. Your recipe
(the Docker image) is exactly what each chef cooks.

# Examples

## Example 1 — Basic: a Deployment keeps N Pods running

Apply a Deployment with `replicas: 3`; delete a Pod.

**Why this works:** The Deployment's ReplicaSet notices only 2 Pods exist versus the desired 3 and
creates a replacement — self-healing, straight from the desired-state model.

## Example 2 — Real-world: expose Pods behind a Service

Add a Service selecting `app: web`.

**Why this works:** Pods are ephemeral and change IPs, but the Service gives clients one stable name and
load-balances across whatever Pods currently match the label — decoupling callers from individual Pods.

## Example 3 — Best practice / edge case: rolling update by changing the image

`kubectl set image deployment/web web=ghcr.io/acme/web:1.5.0`

**Why this works:** Kubernetes performs a rolling update — creating new Pods with the new image and
retiring old ones gradually — and can roll back if the new version is unhealthy. It is the deployment
strategy from an earlier lesson, automated.

# Common Mistakes

- **Managing Pods directly** instead of via a Deployment, losing self-healing and rolling updates.
- **Expecting a Pod's IP to be stable.** Pods are ephemeral; use a **Service** for a stable address.
- **Mismatched labels/selectors**, so a Deployment or Service does not actually target the intended
  Pods.
- **Baking config into the image** instead of using ConfigMaps/Secrets.
- **Thinking Kubernetes replaces good image practices.** It runs your images; small, secure, pinned
  images still matter.

# Best Practices

- Manage workloads with **Deployments**, not bare Pods, and expose them with **Services**.
- Use the **declarative** `kubectl apply -f` workflow and keep manifests in version control.
- Keep configuration in **ConfigMaps/Secrets**, following config-in-the-environment.
- Pin the **`image:`** to a specific tag or digest — the same discipline as everywhere else.
- Start on a **local cluster** (Docker Desktop's Kubernetes, Minikube, or kind) to learn safely.

# Summary

- A Kubernetes **cluster** has a **control plane** (API server, etcd, scheduler, controllers) and
  **worker nodes** (kubelet + container runtime).
- A **Pod** is the smallest unit (usually one container) and is **ephemeral**; you manage Pods through a
  **Deployment**, which handles scaling, self-healing, and rolling updates.
- A **Service** gives a stable address and load-balances across a labeled set of Pods.
- You interact declaratively with **`kubectl apply -f`** and inspect with `get`/`describe`/`logs`.
- Kubernetes runs the **exact OCI image** you built and pushed — all your image practices carry over.

# Flash Cards

Q: What are the two roles of machines in a Kubernetes cluster?
A: The control plane (which manages the cluster via the API server, etcd, scheduler, and controllers) and worker nodes (which run your workloads via the kubelet and a container runtime).

Q: What is a Pod?
A: The smallest deployable unit in Kubernetes — one or more containers that share a network identity and storage; in practice usually a single container. Pods are ephemeral.

Q: What does a Deployment do?
A: It declares the desired set of identical Pods (image and replica count) and manages a ReplicaSet to provide scaling, self-healing, and rolling updates/rollbacks.

Q: Why do you need a Service if you already have Pods?
A: Pods are ephemeral and change IPs; a Service provides a stable name and IP and load-balances traffic across the current set of matching Pods.

Q: What is kubectl and what is the declarative way to use it?
A: kubectl is the CLI for the Kubernetes API server; the declarative workflow is to write YAML manifests and run kubectl apply -f to create or update resources.

Q: How does the Docker image you built relate to Kubernetes?
A: Kubernetes runs that exact OCI image — a Deployment's image field points to your registry, and the kubelet pulls and runs it in a container inside a Pod.

# Exercises

### Easy
In your own words, explain the difference between a Pod, a Deployment, and a Service, and why you
usually create a Deployment rather than a Pod directly.

### Medium
Read the Deployment manifest in this lesson and identify: the image being run, how many replicas are
desired, and how the Deployment knows which Pods belong to it (the selector/labels).

### Challenging
On a local cluster (Docker Desktop, Minikube, or kind), apply the Deployment and Service, delete one
Pod, and observe the replacement. Then change the image tag and run `kubectl rollout status`. Describe
what Kubernetes did at each step in terms of the desired-state model.

# Further Reading

- Kubernetes concepts overview — <https://kubernetes.io/docs/concepts/overview/>
- Pods — <https://kubernetes.io/docs/concepts/workloads/pods/>
- Deployments — <https://kubernetes.io/docs/concepts/workloads/controllers/deployment/>
- Services — <https://kubernetes.io/docs/concepts/services-networking/service/>
