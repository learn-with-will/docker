---
slug: volume-drivers-and-plugins
title: "Volume Drivers & Cloud Storage"
topic: storage-and-volumes
kind: concept
summary: "Attach distributed cloud block stores and network filesystems using Docker volume plugins."
tags: [volume-drivers, cloud-storage, nfs, ebs]
related: [named-volumes, storage-best-practices, why-orchestration]
---
> **In one line:** Volume drivers extend Docker storage beyond local disk to network filesystems (NFS) and cloud block stores (EBS).

## The idea
By default, Docker named volumes use the built-in **`local`** volume driver. This driver writes files directly to the local disk partition of the physical host running the Docker Engine.

In distributed production architectures—where containers may be rescheduled onto different physical servers—local storage is insufficient. If Server A crashes, containers rescheduled on Server B cannot access Server A's local hard drive.

Docker provides a **Volume Plugin API** that allows third-party storage providers to implement custom volume drivers:
- **NFS / SMB:** Mounts shared network storage appliances across multiple hosts simultaneously.
- **AWS EBS / EFS:** Automatically provisions, attaches, and formats cloud block devices or elastic filesystems.
- **Ceph / GlusterFS:** Distributed software-defined storage clusters providing high-availability replication.

| Driver | Storage Type | Access Mode | Typical Use Case |
|---|---|---|---|
| `local` | Host hard drive | Single host only | Standalone development and single-node databases |
| `local` (NFS opt) | Network File System | Shared across nodes | Multi-server shared read/write media assets |
| Cloud Plugin (EBS) | Cloud block device | Single node attachment | Cloud-native resilient database volumes |

## See it
You can configure the built-in `local` driver to mount an external NFS network share directly:

```bash
# Create a named volume connected to a remote NFS server
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.150,rw \
  --opt device=:/mnt/shared-data \
  nfs-media-vol
```

Verify the volume configuration and mount it into an application container:

```bash
docker run -d --name media-app -v nfs-media-vol:/data nginx:alpine
```

## Go deeper
Cloud volume drivers operate asynchronously. When an orchestrator launches a container, the volume driver talks to cloud provider APIs (like AWS EC2), detaches the volume from any old failed node, attaches it to the new node, and mounts it before starting the container process.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- The default `local` driver binds volume data strictly to the host physical disk.
- Volume plugins allow Docker to mount cloud block devices (EBS) and network shares (NFS).
- Networked volume drivers enable persistent state to follow containers across clustered nodes.
