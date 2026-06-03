# Contributing

Keep the package integration-first:

- Do not hardcode domain-specific cell layouts into the core table.
- Keep filters consumer-owned.
- Add model tests for grouping, sorting, and selection changes.
- Update the relevant VitePress page when a public prop, type, or workflow changes.

Before opening a change, run:

```bash
pnpm typecheck
pnpm test
pnpm docs:build
```
