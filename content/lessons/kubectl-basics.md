---
slug: kubectl-basics
title: "Cluster Operations with kubectl"
topic: orchestration-and-iac
kind: tool
summary: "Manage Kubernetes resources effectively using kubectl apply, get, describe, logs, and exec."
tags: [kubectl, apply, get, describe, logs]
related: [kubernetes-pods-and-deployments, kubernetes-services-networking, declarative-iac-gitops]
since: "1.0"
---
> **In one line:** The kubectl command-line tool communicates with the kube-apiserver to deploy, inspect, and troubleshoot cluster resources.

## The idea
**`kubectl`** (Kubernetes Control) is the standard command-line interface used to manage Kubernetes clusters. It reads credentials and cluster endpoints from your configuration file (`~/.kube/config`) and translates commands into authenticated HTTP REST requests against the `kube-apiserver`.

Everyday operations rely on a core set of imperative and declarative commands:
- **`kubectl apply -f <path>`**: Declaratively applies YAML manifests (creating or updating resources to match).
- **`kubectl get <resource>`**: Lists resources (pods, deployments, services) with high-level status.
- **`kubectl describe <resource> <name>`**: Displays detailed metadata, controller status, and recent **system events** (indispensable for diagnosing why a pod cannot start).
- **`kubectl logs <pod-name>`**: Streams stdout/stderr from containers running inside a pod.
- **`kubectl exec -it <pod-name> -- <cmd>`**: Spawns an interactive shell inside a running pod container.

| Command | Action | Common Flags |
|---|---|---|
| `kubectl apply -f .` | Creates/updates all manifests in folder | `-R` (recursive) |
| `kubectl get pods` | Lists pods | `-o wide`, `-w` (watch), `-A` (all namespaces) |
| `kubectl describe pod <p>` | Shows lifecycle events and errors | None |
| `kubectl logs <p>` | Streams container output | `-f` (follow), `--tail=50`, `-c <container>` |

## See it
Troubleshoot a failing pod using `describe` and `logs`:

```bash
# 1. View pods and identify unhealthy states (e.g. CrashLoopBackOff or ImagePullBackOff)
kubectl get pods

# 2. Inspect events at the bottom of the describe output
kubectl describe pod api-deployment-7b89f-4f1a2
```

The events section highlights exact failure reasons:

```text
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  45s                default-scheduler  Successfully assigned node-02
  Normal   Pulling    44s                kubelet            Pulling image "app:v2"
  Warning  Failed     42s                kubelet            Failed to pull image "app:v2": rpc error: code = NotFound
```

Stream live logs from an active pod:

```bash
kubectl logs -f deployment/api-deployment --tail 20
```

## Go deeper
Kubernetes organizes resources into virtual sub-clusters called **Namespaces** (`default`, `kube-system`, `production`). Always append `-n <namespace>` or set your active context namespace using tools like `kubens` to avoid accidentally altering the wrong environment.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- `kubectl apply -f` is the standard declarative entrypoint for managing cluster resources.
- Use `kubectl describe` to inspect system events when diagnosing container startup failures.
- Stream pod logs with `kubectl logs -f` and access running containers with `kubectl exec`.
