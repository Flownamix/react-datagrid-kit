# Package and License

The package is published under the MIT License.

Current package status:

- Package name: `@flownamix/react-data-grid-kit`
- License field: `MIT`
- Publishing: public package access with provenance enabled
- Included package files: `dist`, `README.md`, and `LICENSE`

Run these checks before preparing a release candidate:

```bash
pnpm build
pnpm verify:package
```

`pnpm verify:package` checks that the package manifest includes required publish files and that every declared export target exists in `dist`.
