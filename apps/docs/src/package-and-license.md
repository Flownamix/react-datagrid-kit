# Package and License

The package is configured for private/internal evaluation and restricted publishing.

Current package status:

- Package name: `@flownamix/react-data-grid-kit`
- License field: `UNLICENSED`
- Publishing: restricted package access with provenance enabled
- Included package files: `dist`, `README.md`, and `LICENSE`

Do not publish publicly, redistribute, sublicense, or grant production publication rights until the package owner and legal team replace the placeholder license with a final license.

Run these checks before preparing a release candidate:

```bash
pnpm build
pnpm verify:package
```

`pnpm verify:package` checks that the package manifest includes required publish files and that every declared export target exists in `dist`.
