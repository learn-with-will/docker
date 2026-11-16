---
slug: read-only-rootfs
title: "Read-Only Root Filesystems"
topic: security
kind: pattern
summary: "Prevent runtime tampering and malware persistence by running containers with --read-only filesystems."
tags: [read-only, security, tmpfs, immutability]
related: [dropping-linux-capabilities, tmpfs-mounts, non-root-user]
---
> **In one line:** Run containers with --read-only to lock down the root filesystem against runtime malware modification.

## The idea
When an attacker exploits a code vulnerability in a running web application (such as remote code execution via Log4j or SQL injection), their immediate goal is persistence:
- Writing executable webshells into `/tmp` or web root directories.
- Modifying system binaries in `/bin` or configuration files in `/etc`.
- Downloading cryptominers or trojans into the container filesystem.

You can neutralize this entire class of attacks by launching containers with a **read-only root filesystem** (`--read-only`).

When a container runs in read-only mode, the Linux kernel refuses all write operations to the container's root filesystem. If the application legitimately needs to write temporary scratch files (such as pidfiles or cache buffers), you explicitly mount dedicated, restricted **`tmpfs` in-memory mounts** at those specific paths.

| Filesystem Component | Mount Type | Permissions | Purpose |
|---|---|---|---|
| Root Filesystem (`/`) | Read-Only | `ro` | Application code & system binaries |
| Temporary storage (`/tmp`) | `tmpfs` | `rw,noexec,nosuid` | Scratch buffers; blocks binary execution |
| Persistent data (`/data`) | Named Volume | `rw` | Database storage |

## See it
Deploy an NGINX container with an immutable read-only root filesystem and restricted scratch mounts:

```bash
# Run NGINX with read-only root, mounting tmpfs at required writable paths
docker run -d --name immutable-web \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=32m \
  --tmpfs /var/run:rw,noexec,nosuid,size=4m \
  -p 8080:80 \
  nginx:alpine
```

Test writing an unauthorized file to the web root:

```bash
docker exec immutable-web touch /usr/share/nginx/html/hack.html
```

The operating system blocks the modification:

```text
touch: /usr/share/nginx/html/hack.html: Read-only file system
```

## Go deeper
Notice the security options attached to the tmpfs mount: `noexec` prevents the Linux kernel from executing any binary located in that memory mount, and `nosuid` disables setuid privilege escalation.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- `--read-only` locks the container root filesystem, preventing attackers from modifying files.
- Mount dedicated `tmpfs` in-memory filesystems to specific paths that require scratch writes.
- Apply `noexec` and `nosuid` mount options to scratch mounts to block malicious payload execution.
