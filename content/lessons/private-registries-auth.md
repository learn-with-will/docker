---
slug: private-registries-auth
title: "Private Registries & Authentication"
topic: images-and-registries
kind: technique
summary: "Securely authenticate with private registries using docker login and credential helpers."
tags: [docker-login, credentials, authentication, security]
related: [docker-hub, github-container-registry, tagging-strategies]
---
> **In one line:** Authenticate to private registries with docker login and store auth tokens safely using credential helpers.

## The idea
Proprietary microservices and corporate applications cannot be published to public registries. Organizations deploy private registries—hosted on AWS ECR, Google Artifact Registry, Azure ACR, Harbor, or self-hosted registry servers.

To pull or push private images, the Docker daemon must present valid authentication tokens. The `docker login` command verifies credentials against the registry's authorization endpoint and saves an auth token in Docker's client configuration file (`~/.docker/config.json`).

By default, saving passwords directly in plaintext inside `config.json` is a severe security vulnerability. Modern Docker installations configure **credential helpers** (such as `secretservice` on Linux, `osxkeychain` on macOS, or `wincred` on Windows) to store access tokens securely in the operating system's native encrypted keychain.

| Credential Store | Platform | Storage Location |
|---|---|---|
| `osxkeychain` | macOS | Native Apple Keychain |
| `wincred` | Windows | Windows Credential Manager |
| `pass` / `secretservice` | Linux | Kernel secret keyring / libsecret |

## See it
Log into a private registry securely by piping your token to standard input:

```bash
# Securely log into a private Harbor registry
cat my-token.txt | docker login registry.internal.company.com -u deploy-agent --password-stdin

# Inspect client config to verify credential helper activation
cat ~/.docker/config.json
```

Notice that the configuration records the registry endpoint and delegates storage to a secure helper:

```json
{
  "auths": {
    "registry.internal.company.com": {}
  },
  "credsStore": "osxkeychain"
}
```

## Go deeper
For cloud registries like AWS ECR, credentials expire every 12 hours. Operators configure the AWS CLI helper (`docker-credential-ecr-login`) so Docker automatically negotiates fresh short-lived STS tokens during push and pull operations without requiring manual logins.

## Watch out
- Never pass passwords as command-line arguments (`-p password`); process listing tools (`ps aux`) and shell history logbooks expose command arguments.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.


In production environments, always monitor resource utilization and kernel metric counters. Tracking memory working set size, container CPU throttling percentages via cgroups, and filesystem disk I/O wait times ensures that underlying infrastructure resources are allocated efficiently across microservices.


Adopting industry-standard naming conventions and comprehensive metadata labels makes container infrastructure dramatically easier to maintain. Labeling images with build timestamps, git commit SHAs, team ownership, and issue tracker IDs accelerates incident response during production troubleshooting.

## Remember
- Always supply passwords to `docker login` via `--password-stdin` to avoid shell history leakage.
- Use native credential helpers (osxkeychain, wincred, secretservice) to prevent storing plaintext tokens.
- Enterprise cloud registries rely on automated credential helpers to refresh short-lived tokens.
