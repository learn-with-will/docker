# Docker & DevOps Learning Portal

A **frontend-only** Docker & DevOps course: read Markdown lessons, take quizzes, and
track your progress — all in the browser. No sign-up, no backend.

## What this is

The portal shell is built with React 19, Vite, TypeScript, React Router,
Tailwind CSS v4, `marked`, and PrismJS. It renders a **24-lesson curriculum** covering
Docker and the DevOps practices around it, from your first container to shipping and
operating a containerized app. Every lesson is written in plain, welcoming English and
verified against the official documentation (see **Sources** below).

Progress, bookmarks, and quiz scores live in `localStorage` under
`docker-learning-*` keys, so nothing leaves your machine.

## Run it locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## How the content works

The app is **data-driven** — adding a lesson needs no code changes:

1. Write the lesson Markdown in `public/content/<level>/<slug>.md` with YAML front-matter.
2. Add a matching entry to `public/content/course-manifest.json`.
3. Add a quiz at `public/quizzes/lesson-NN.json`.

> **Code fences** must declare one of the highlighted languages: `dockerfile`,
> `bash`, `yaml`, `json`, or `text` (see `src/core/prism.ts`).

## Curriculum

**Beginner — Docker foundations:** what Docker & containers are · installing Docker &
your first container · images, tags & Docker Hub · managing containers · your first
Dockerfile · volumes & bind mounts · container networking · configuration & the
container lifecycle.

**Intermediate — building well & multi-service:** Dockerfile best practices & layer
caching · multi-stage builds & small images · Docker Compose · Compose in depth ·
registries & tagging · container security · logging, monitoring & debugging · BuildKit,
Buildx & multi-platform images.

**Advanced — DevOps around Docker:** DevOps & the CI/CD lifecycle · CI/CD with GitHub
Actions · deployment strategies · orchestration concepts · introduction to Kubernetes ·
infrastructure as code · observability · a capstone that ties it all together.

## Accuracy: no hallucination

Every command, flag, default, and behavior is verified against official documentation.
The per-lesson authoring contract lives in `prompts/docker-authoring-prompt.md`, and the
phase-by-phase overview in `prompts/docker-study-pathway.md`.

**Sources:**

- **Docker documentation** — <https://docs.docker.com/> (Engine, CLI, Dockerfile
  reference, volumes, networking, build).
- **The Compose Specification** — <https://docs.docker.com/compose/> and
  <https://compose-spec.io/>.
- **Open Container Initiative** — <https://opencontainers.org/> (image & runtime specs).
- **BuildKit** — <https://docs.docker.com/build/> and
  <https://github.com/moby/buildkit>.
- **Kubernetes documentation** — <https://kubernetes.io/docs/> (the intro lesson).
- **GitHub Actions documentation** — <https://docs.github.com/actions> (the CI/CD lesson).
- **The Twelve-Factor App** — <https://12factor.net/>.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`BASE_PATH=/<repo>/` and publishes `dist/` to GitHub Pages.

---

React 19 · Vite · TypeScript · React Router · Tailwind CSS v4 · marked · PrismJS ·
localStorage.
