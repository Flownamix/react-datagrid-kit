import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const file of ["styles.css", "tokens.css"]) {
  const source = resolve(repoRoot, "packages/react-data-grid-kit/src/styles", file);
  const target = resolve(repoRoot, "packages/react-data-grid-kit/dist", file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}
