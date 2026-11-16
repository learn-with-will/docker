---
slug: image-layers
title: "Image Layers & Immutability"
topic: images-and-registries
kind: concept
summary: "Docker images are immutable stacks of read-only tarball layers combined via an overlay filesystem."
tags: [images, layers, read-only, union-fs]
related: [tags-and-digests, layer-caching-order, dockerfile-anatomy]
---
> **In one line:** An image is an immutable stack of read-only filesystem layers joined by an overlay filesystem.

## The idea
When you download or build a Docker image, you are not downloading a single monolithic hard drive image. Instead, an image is constructed from an ordered stack of read-only filesystem diffs termed **layers**.

Each instruction in a Dockerfile that modifies the filesystem (such as `RUN`, `COPY`, or `ADD`) produces a new immutable layer. Each layer contains only the delta—the files added, changed, or deleted relative to the layer beneath it.

The storage driver (modern Docker uses **overlay2**) joins these read-only layers together with a thin, writable container layer on top using union mounts. The container process observes a single unified filesystem view:

```text
┌──────────────────────────────────────────────┐
│ Writable Container Layer (R/W: changes only) │
├──────────────────────────────────────────────┤
│ Layer 3: COPY ./app /app         (Read-Only) │
├──────────────────────────────────────────────┤
│ Layer 2: RUN npm install         (Read-Only) │
├──────────────────────────────────────────────┤
│ Layer 1: FROM node:22-alpine     (Read-Only) │
└──────────────────────────────────────────────┘
```

Because image layers are read-only and immutable, multiple containers created from the same base image share the identical read-only layers in host memory and disk, radically saving storage space.

| Property | Image Layers | Container Layer |
|---|---|---|
| Mutability | Strictly Read-Only (immutable) | Read-Write (ephemeral) |
| Sharing | Shared across all containers from that image | Private to one specific container |
| Lifetime | Persists until explicitly deleted from host | Deleted when container is removed |

## See it
Inspect the layer history of an official image to view each instruction and its corresponding layer size:

```bash
# Inspect the layer stack of Alpine Linux
docker history alpine:3.20

# Inspect the overlay2 filesystem driver directories for an image
docker inspect alpine:3.20 --format '{{json .GraphDriver.Data}}'
```

The output illustrates the immutable layer stack and size contributions:

```text
IMAGE          CREATED        CREATED BY                                      SIZE
91ef0af613e6   5 months ago   /bin/sh -c #(nop)  CMD ["/bin/sh"]              0B
<missing>      5 months ago   /bin/sh -c #(nop) ADD file:29b... in /          3.62MB
```

## Go deeper
When a container modifies an existing file residing in a read-only image layer, the storage driver performs a **Copy-on-Write (CoW)** operation. It copies the file from the lower read-only layer up into the container's top writable layer before editing. The underlying image layer remains pristine.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Images consist of an immutable stack of read-only filesystem layers.
- Storage drivers use union mounting (overlay2) to present layers as a single unified tree.
- Modifying image files triggers a copy-on-write operation into the private writable layer.
