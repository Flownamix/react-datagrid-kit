# React Data Grid Kit

Enterprise-grade React data table primitives and styled components for dense
product workflows.

The product in this repository is the private Flownamix package
`@flownamix/react-data-grid-kit`.

The docs and Storybook apps are development workspaces. They exist to help build,
review, test, and explain the package; they are not part of the shipped product.

## Product Package

- A typed React data table package for operational product screens.
- TanStack Table-powered row, sorting, selection, and optional local filtering
  models.
- Styled desktop table and mobile card rendering.
- Grouped operational states, row selection, sorting, filters, quick search,
  column visibility, ordering, resizing, pinning, inline editing, and toolbar
  slots.

## Development Workspaces

- `apps/docs` is the VitePress authoring and reference site for package
  development.
- `apps/storybook` is the visual development and interaction review surface.
- Neither app is a runtime dependency of the package.

## Package Import

```tsx
import { DataTable, type DataTableColumn } from "@flownamix/react-data-grid-kit";
import "@flownamix/react-data-grid-kit/styles.css";
```

## Workspace Layout

```text
packages/react-data-grid-kit    Package source, tests, build config, README
apps/docs                       Development docs workspace
apps/storybook                  Visual development and review workspace
scripts                         Package verification and build helpers
```

## Requirements

- Node.js 22 or newer for CI parity.
- pnpm 11.1.1.

The repo declares the package manager in `package.json`, so Corepack can prepare
the right pnpm version if your Node installation supports it:

```bash
corepack enable
pnpm install
```

## Local Development

Run the package checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Build the package, development docs, and Storybook review surface:

```bash
pnpm build
```

Run Storybook:

```bash
pnpm dev:storybook
```

Run the docs site:

```bash
pnpm dev:docs
```

## Validation Before Commit

Use the same checks as CI before adding changes to Git:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:package
```

The repository ignores generated outputs such as `node_modules`, package
`dist`, Storybook static output, VitePress output, Playwright artifacts, logs,
and local environment files.

## Development References

- Root package README: `packages/react-data-grid-kit/README.md`
- Package development docs: `apps/docs/src`
- Visual review examples: `apps/storybook/src`
- Contribution notes: `CONTRIBUTING.md`

## Package Status

This package is currently `UNLICENSED` and prepared for private/internal
evaluation only. Do not publish publicly or grant production redistribution
rights until legal selects the final license.

Publishing is configured as restricted package access with provenance enabled.
Run `pnpm verify:package` after `pnpm build` to confirm package export targets
exist before preparing a release candidate.
