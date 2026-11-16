---
slug: exec-vs-shell-form
title: "Exec Form vs Shell Form"
topic: dockerfiles
kind: pitfall
summary: "Avoid PID 1 signal handling bugs by choosing JSON exec form over string shell form."
tags: [exec-form, shell-form, sigterm, pid1]
related: [cmd-vs-entrypoint, stop-signals-and-exit-codes, non-root-user]
---
> **In one line:** Always use exec form ["exe", "arg"] so your process runs as PID 1 and receives OS shutdown signals directly.

## The idea
Instructions like `CMD`, `ENTRYPOINT`, and `RUN` can be written in two syntaxes:
1. **Exec form:** `CMD ["node", "server.js"]` (JSON array syntax)
2. **Shell form:** `CMD node server.js` (Plain string syntax)

Under the surface, shell form implicitly wraps your command in `/bin/sh -c "node server.js"`. This means the shell (`/bin/sh`) becomes **PID 1** inside the container namespace, and your application becomes a secondary child process (PID 2).

Standard Linux shells do **not** forward OS signals like `SIGTERM` to child processes by default. When you run `docker stop`, the Docker daemon sends `SIGTERM` to PID 1. Because the shell swallows the signal, your application never learns it should shut down. It keeps serving traffic until Docker's 10-second timeout expires, whereupon Docker issues an ungraceful `SIGKILL`.

```text
Shell Form (BROKEN SIGNALS):
  dockerd --(SIGTERM)--> PID 1 (/bin/sh -c) --X [Signal Swallowed]
                                 │
                                 └── PID 2 (node server.js) [Never alerted]

Exec Form (CLEAN SIGNALS):
  dockerd --(SIGTERM)--> PID 1 (node server.js) [Receives signal directly!]
```

| Form | Syntax | Process Hierarchy | Receives Signals? |
|---|---|---|---|
| Exec Form | `["node", "app.js"]` | PID 1 = `node` | Yes; direct delivery |
| Shell Form | `node app.js` | PID 1 = `/bin/sh`, PID 2 = `node` | No; swallowed by shell |

## See it
Compare how Docker handles process inspection between the two forms:

```docker
// Before (Shell form: process hidden behind shell)
CMD node dist/index.js

// After (Exec form: process runs directly as PID 1)
CMD ["node", "dist/index.js"]
```

Verify process IDs inside a running container using `ps`:

```bash
# Inspect process table inside container running exec form
docker top web-container
# PID   COMMAND
# 1     node server.js
```

## Go deeper
If you genuinely need shell features such as environment variable expansion or pipe redirection, invoke the shell explicitly inside the exec array: `CMD ["sh", "-c", "echo $PORT && exec node server.js"]`. Using `exec` replaces the shell process with the application binary, restoring PID 1 signal handling.

## Watch out
- Do not use single quotes in exec form JSON arrays; Docker syntax requires strict double quotes: `["bin", "arg"]`.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- Shell form wraps your command inside `/bin/sh -c`, creating a signal forwarding barrier.
- Exec form ensures your application process executes directly as PID 1.
- Direct PID 1 ownership enables graceful shutdowns within the standard 10-second stop window.
