---
slug: declarative-iac-gitops
title: "Infrastructure as Code & GitOps"
topic: orchestration-and-iac
kind: concept
summary: "Manage infrastructure and deployments declaratively via Git repositories using IaC and GitOps principles."
tags: [iac, gitops, declarative, terraform]
related: [kubernetes-pods-and-deployments, devops-pipeline-stages, capstone-containerize-ship-operate]
---
> **In one line:** GitOps uses Git as the single source of truth for declaratively automated infrastructure and deployments.

## The idea
Historically, infrastructure management was imperative: administrators logged into web consoles or ran terminal commands (`docker run`, `kubectl apply`) by hand. This led to configuration drift, untracked changes, and catastrophic outages when undocumented servers crashed.

**Infrastructure as Code (IaC)** replaces manual operations by storing infrastructure definitions in declarative, version-controlled text files (Terraform, CloudFormation, Kubernetes YAML, Compose).

**GitOps** takes IaC to its logical conclusion for container platforms:
1. **Declarative state:** The entire desired state of the production environment is declared in a Git repository.
2. **Git as single source of truth:** Changes are made exclusively via Git pull requests with mandatory code reviews.
3. **Automated reconciliation:** A GitOps controller (like **ArgoCD** or **Flux**) runs inside the cluster, continuously comparing the live cluster state with the Git repository. If someone manually modifies a pod or drift occurs, the controller automatically forces the cluster back into alignment with Git.

```flow
git-repo: Git Repository | Desired state @blue
gitops: ArgoCD or Flux | Reconciliation loop @primary
k8s-cluster: Kubernetes Cluster | Live actual state @green
git-repo -> gitops: Webhook sync
gitops -> k8s-cluster: Apply manifests
```

| Property | Manual Deployments | GitOps Deployment Pattern |
|---|---|---|
| Source of Truth | Live cluster memory (transient) | Git repository (version controlled) |
| Change Management | Manual terminal commands | Peer-reviewed Git Pull Requests |
| Drift Remediation | Manual investigation | Automated reconciliation agent |
| Audit Trail | Incomplete shell history | 100% complete immutable Git commit log |

## See it
In a GitOps workflow, deploying a new image version to production is literally a one-line git commit editing a manifest:

```yaml
# Inside git repository: deploy/production/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  template:
    spec:
      containers:
        - name: api
          # Changing this line in git automatically triggers cluster deployment!
          image: ghcr.io/my-org/my-api:sha-7b3f91a
```

## Go deeper
GitOps delivers instant, bulletproof disaster recovery. If an entire cloud region is destroyed, operators can provision a fresh Kubernetes cluster, point the GitOps controller to the Git repository, and watch the entire application stack rebuild itself identically in minutes.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Infrastructure as Code stores environment configurations in version-controlled declarative text files.
- GitOps establishes Git as the single source of truth for production deployment state.
- Automated controllers (ArgoCD, Flux) continuously reconcile live cluster resources against Git.
