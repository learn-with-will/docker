---
slug: oci-standards
title: "The OCI Standards"
topic: foundations
kind: concept
summary: "The Open Container Initiative standardizes container image formats, runtime specifications, and distribution APIs."
tags: [oci, standards, runtime, image-spec]
related: [docker-architecture, image-layers, tags-and-digests]
---
> **In one line:** OCI specifications ensure that any compliant image runs on any compliant container runtime without modification.

## The idea
In the early days of containerization, Docker defined both the image format and the runtime engine. To prevent vendor lock-in and foster an open ecosystem, Docker and other industry leaders established the **Open Container Initiative (OCI)** in 2015 under the Linux Foundation.

The OCI maintains three fundamental specifications that govern modern cloud-native systems:
1. **The Image Specification (image-spec):** Defines the on-disk structure of a container image. An OCI image consists of content-addressable tar layers, an image manifest listing layer SHA-256 digests, and a JSON configuration file describing environment variables, labels, and entrypoints.
2. **The Runtime Specification (runtime-spec):** Defines the lifecycle and configuration of an executing container. It specifies how an unpacked filesystem bundle and a `config.json` file are consumed by runtimes like runc, crun, or Kata Containers.
3. **The Distribution Specification (distribution-spec):** Standardizes the HTTP API for pushing, pulling, and searching images across registries such as Docker Hub, Amazon ECR, and GitHub Container Registry (GHCR).

| Specification | Artifact | Purpose |
|---|---|---|
| Image Spec | Tarball layers + JSON manifest | Portable image archiving and hashing |
| Runtime Spec | Rootfs directory + config.json | Execution contract for kernel runtimes |
| Distribution Spec | HTTP REST Registry API | Interoperable registry push and pull |

## See it
Modern images created with Docker automatically comply with OCI standards. You can inspect an image manifest directly using `buildx imagetools`:

```bash
# Pull an image and inspect its OCI media type
docker buildx imagetools inspect alpine:3.20 --raw
```

The response displays the standardized OCI manifest media type:

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "digest": "sha256:beef1234..."
  }
}
```

## Go deeper
Because Docker complies with OCI specifications, you can build an image with Docker and run it seamlessly on Kubernetes with containerd or CRI-O, or execute it on lightweight microVM runtimes like AWS Firecracker. The format is universal across the cloud landscape.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- The OCI guarantees vendor-neutral container formats and prevents vendor lock-in across cloud providers.
- The Image Spec defines layer tarballs, manifests, and image configuration JSON.
- The Runtime Spec and Distribution Spec standardize execution environments and registry APIs.
