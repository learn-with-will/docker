---
slug: cmd-vs-entrypoint
title: "CMD vs ENTRYPOINT"
topic: dockerfiles
kind: pitfall
summary: "Master the interaction between ENTRYPOINT for container executables and CMD for default arguments."
tags: [cmd, entrypoint, defaults, arguments]
related: [dockerfile-anatomy, exec-vs-shell-form, stop-signals-and-exit-codes]
---
> **In one line:** ENTRYPOINT sets the fixed executable; CMD supplies default arguments that callers can override.

## The idea
The relationship between `CMD` and `ENTRYPOINT` is one of the most frequently misunderstood aspects of Docker authoring. Both instructions configure what happens when a container starts, but they serve distinct roles in the container contract.

Think of `ENTRYPOINT` as the binary being invoked, and `CMD` as the default parameters passed to that binary:
- **`ENTRYPOINT`**: Defines the immutable executable that the container runs. It turns the container into an executable CLI tool.
- **`CMD`**: Provides default parameters. If a user passes arguments to `docker run <image> <args>`, those user arguments completely overwrite the `CMD` values while preserving the `ENTRYPOINT`.

```text
Final Container Execution Command:
  [ ENTRYPOINT ] + [ CMD or CLI arguments ]

Example 1: Default run
  ENTRYPOINT ["nginx"] + CMD ["-g", "daemon off;"]
  => nginx -g "daemon off;"

Example 2: Caller overrides arguments (docker run web -T)
  ENTRYPOINT ["nginx"] + Caller arguments ["-T"]
  => nginx -T
```

| Dockerfile Configuration | CLI Invocation | Executed Process |
|---|---|---|
| `CMD ["echo", "Hello"]` | `docker run my-img` | `echo Hello` |
| `CMD ["echo", "Hello"]` | `docker run my-img date` | `date` (CMD overridden) |
| `ENTRYPOINT ["git"]` + `CMD ["status"]` | `docker run my-img` | `git status` |
| `ENTRYPOINT ["git"]` + `CMD ["status"]` | `docker run my-img log` | `git log` (CMD overridden) |

## See it
Create an image configured with an `ENTRYPOINT` and default `CMD` parameters:

```docker
FROM alpine:3.20

# Fixed executable
ENTRYPOINT ["ping"]

# Default argument (ping localhost by default)
CMD ["-c", "3", "127.0.0.1"]
```

Test running the container with default settings and with CLI overrides:

```bash
# Runs default: ping -c 3 127.0.0.1
docker run --rm ping-tool

# Overrides CMD: runs ping 8.8.8.8
docker run --rm ping-tool -c 1 8.8.8.8
```

## Go deeper
If you need to completely bypass an image's configured `ENTRYPOINT` (for example, to launch a troubleshooting shell), supply the `--entrypoint` flag on the command line: `docker run --rm -it --entrypoint sh ping-tool`.

## Watch out
- Combining shell-form `ENTRYPOINT` with `CMD` causes Docker to ignore `CMD` completely; always use the JSON array exec form for both instructions.


> **Tip:** When designing container architectures for scale, establish automated validation tests in your CI/CD pipeline to verify configuration contracts. Validating environment variable definitions, verifying network connectivity across isolated bridges, and enforcing non-root user permissions prevents deployment regressions from reaching production clusters.

## Remember
- `ENTRYPOINT` defines the container's executable; `CMD` provides default arguments.
- Any arguments appended to `docker run` replace `CMD` but append to `ENTRYPOINT`.
- Always write both instructions in JSON array exec form: `["executable", "arg1"]`.
