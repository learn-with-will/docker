---
slug: macvlan-and-ipvlan
title: "Macvlan & IPvlan Networks"
topic: networking
kind: concept
summary: "Assign containers direct physical IP addresses on your local network using macvlan and ipvlan drivers."
tags: [macvlan, ipvlan, physical-network, routing]
related: [default-bridge-network, host-and-none-networking, network-security-isolation]
---
> **In one line:** Macvlan assigns a unique MAC address and physical LAN IP to a container, making it appear as a physical device on your network.

## The idea
Standard bridge networks place containers behind a virtual NAT router. To outside physical network devices, all container traffic appears to originate from the Docker host's single physical IP address.

In legacy enterprise migrations, network monitoring, or telecommunications environments, this NAT abstraction can be problematic:
- Legacy network security devices expect each service to have its own unique physical MAC address.
- Network appliances route traffic directly without NAT translation.

Docker provides two advanced drivers to connect containers directly to the underlying physical network:
- **Macvlan:** Assigns a unique virtual MAC address to each container. To network switches and routers, the container looks like a separate physical server connected to the physical switch.
- **IPvlan:** Shares the host's existing physical MAC address while assigning unique IP addresses. Useful when network switches enforce security limits on the number of MAC addresses allowed per switch port.

| Driver | MAC Address per Container | Layer | Use Case |
|---|---|---|---|
| `bridge` | Virtual internal MAC | Layer 3 (NAT) | Standard microservices and cloud apps |
| `macvlan` | Unique virtual MAC on physical LAN | Layer 2 | Legacy app migration, network monitoring |
| `ipvlan` | Shares host physical MAC | Layer 2 or Layer 3 | High-density containers on strict network switches |

## See it
Create a macvlan network binding containers directly to physical interface `eth0`:

```bash
# Create macvlan network attached to physical host interface eth0
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  physical-net
```

Run a container assigned a static IP directly from your physical office subnet:

```bash
docker run -d --name direct-lan --network physical-net --ip=192.168.1.185 nginx:alpine
```

External devices on your physical local area network can now ping `192.168.1.185` directly without configuring any port forwarding.

## Go deeper
Due to a security constraint in Linux kernel macvlan design, the **Docker host itself cannot communicate directly with its own macvlan containers** over the physical parent interface. If the host needs to talk to the container, you must configure a macvlan sub-interface on the host.

## Watch out
- Ensure your network router or switch does not drop unknown MAC addresses when using macvlan in virtualized environments like VMware ESXi.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Macvlan assigns unique virtual MAC and IP addresses directly on the physical LAN.
- IPvlan shares the host physical MAC address to satisfy strict switch port security rules.
- By default, the Docker host cannot directly ping its own macvlan child containers.
