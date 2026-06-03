# React Data Grid Kit

Enterprise-grade React data table primitives and styled components for dense
product workflows.

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

## Development References

- Root package README: `packages/react-data-grid-kit/README.md`
- Package development docs: `apps/docs/src`
- Visual review examples: `apps/storybook/src`
- Contribution notes: `CONTRIBUTING.md`
