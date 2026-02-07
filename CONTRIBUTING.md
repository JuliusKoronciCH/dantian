# Contributing

Thanks for helping improve Dantian. This guide focuses on local development, testing, and release steps.

## Prerequisites

- Node.js (see the toolchain versions in `requirements/dantian-plan.md`)
- Yarn (via Corepack)

Enable Corepack if needed:

```bash
corepack enable
```

## Setup

```bash
yarn install --immutable
```

## Common Scripts

- `yarn lint` — run ESLint on `lib/**/*.{ts,tsx}`
- `yarn lint:fix` — auto-fix lint issues where possible
- `yarn format` — format all files with Prettier
- `yarn format:check` — verify formatting
- `yarn typecheck` — TypeScript typecheck
- `yarn test` — Vitest unit tests
- `yarn storybook` — run Storybook locally
- `yarn build-storybook` — build Storybook static output
- `yarn test-storybook` — run Storybook interaction tests against a running Storybook
- `yarn test-storybook:ci` — run Storybook tests against a static build
- `yarn e2e` — Playwright end-to-end tests (starts Storybook via Playwright webServer)
- `yarn build` — build library output to `dist/`

## Development Workflow

1. Create a feature branch.
2. Make changes with tests where relevant.
3. Run the local check set before opening a PR:

```bash
yarn lint
yarn format:check
yarn typecheck
yarn test
yarn build
```

If the change affects Storybook or E2E flows, also run:

```bash
yarn build-storybook
yarn test-storybook:ci
yarn e2e
```

## Coding Standards

- TypeScript-first; React components in `lib/` and `lib/stories/` use `.tsx`.
- Use `camelCase` for variables/functions and `PascalCase` for types/components.
- Run Prettier and ESLint before submitting a PR.

## Commits and PRs

- Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- PRs should include a summary, tests run, and screenshots for Storybook/UI changes.

## Release Process

See `requirements/release-checklist.md` for the release steps and gates. Use `yarn standard-version` to bump versions and `yarn npm publish` to publish.
