# Contributing

Keep the package integration-first:

- Do not hardcode domain-specific cell layouts into the core table.
- Keep filters consumer-owned.
- Add model tests for grouping, sorting, and selection changes.
- Add Storybook examples for user-visible states.
- Keep long-form guidance in VitePress and keep Storybook docs lean.

Before opening a change, run:

```bash
pnpm typecheck
pnpm test
pnpm storybook:build
pnpm docs:build
```
