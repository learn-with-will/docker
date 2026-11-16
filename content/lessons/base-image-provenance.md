---
slug: base-image-provenance
title: "Base Image Provenance & Trust"
topic: security
kind: pattern
summary: "Secure your container supply chain by verifying digital signatures, SLSA provenance, and digest pinning."
tags: [supply-chain, provenance, digest-pinning, official-images]
related: [tags-and-digests, minimal-base-images, vulnerability-scanning]
---
> **In one line:** Protect your container supply chain by pinning digests, verifying image signatures, and sourcing official images.

## The idea
Software supply chain security has become a paramount concern in cloud engineering. Attackers increasingly target dependencies and upstream container images rather than attempting direct front-door attacks on production servers.

Common supply chain risks:
- **Tag poisoning:** An attacker compromises a third-party Docker Hub account and updates `my-tool:v1` with an image containing cryptominers or backdoors.
- **Typosquatting:** Malicious actors publish images with names similar to popular official images (e.g. `ubunto` instead of `ubuntu`).
- **Build tampering:** CI/CD runners building images from unverified source trees.

Enterprise container supply chain defense relies on three complementary controls:
1. **Curated Official Images:** Start exclusively from verified official images or hardened internal corporate base registries.
2. **Digest Pinning:** Pin `FROM` statements to immutable SHA-256 digests rather than mutable tags.
3. **Cryptographic Signatures & SLSA Provenance:** Use tools like **Sigstore Cosign** or **Docker Content Trust** to sign images during build and verify signatures before cluster deployment.

| Security Layer | Mechanism | Protection |
|---|---|---|
| Image Sourcing | Official Repositories | Avoids untrusted community code |
| Immutability | SHA-256 Digest Pinning | Prevents tag poisoning attacks |
| Cryptographic Trust | Sigstore Cosign / Docker Trust | Verifies binary authenticity and origin |

## See it
Pin your Dockerfile base image to a verified cryptographic digest:

```docker
// Before (Mutable tag: vulnerable to upstream tag changes)
FROM node:22-alpine

// After (Pinned digest: 100% immutable and reproducible)
FROM node:22-alpine@sha256:7e09fa2b3...
```

Verify a digital signature using Sigstore Cosign:

```bash
# Verify the image signature against the official developer public key
cosign verify --key cosign.pub ghcr.io/my-org/my-app:1.0.0
```

The tool confirms that the signature is cryptographically valid and matches the digest:

```text
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

## Go deeper
Modern build platforms generate **SLSA (Supply-chain Levels for Software Artifacts)** provenance attestations. These attestations record the exact git repository, commit SHA, workflow file, and builder environment that compiled the image, creating a tamper-evident audit trail.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.

## Remember
- Never pull base images from unverified community repositories in production.
- Pin base images to cryptographic SHA-256 digests to prevent upstream tag poisoning.
- Adopt Sigstore Cosign or Docker Content Trust to cryptographically sign and verify release images.
