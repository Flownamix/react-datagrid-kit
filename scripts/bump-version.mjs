import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const bumpType = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
const validBumpTypes = new Set(["patch", "minor", "major"]);

if (!validBumpTypes.has(bumpType)) {
  console.error("Usage: pnpm version:bump <patch|minor|major> [--dry-run]");
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = path.join(
  repoRoot,
  "packages",
  "react-data-grid-kit",
  "package.json",
);

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const versionParts = packageJson.version.split(".").map((part) => Number(part));

if (
  versionParts.length !== 3 ||
  versionParts.some((part) => !Number.isInteger(part) || part < 0)
) {
  console.error(`Cannot bump unsupported version: ${packageJson.version}`);
  process.exit(1);
}

const [major, minor, patch] = versionParts;

const nextVersion =
  bumpType === "major"
    ? `${major + 1}.0.0`
    : bumpType === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

packageJson.version = nextVersion;

if (!dryRun) {
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

console.log(
  `${packageJson.name}: ${versionParts.join(".")} -> ${nextVersion}${
    dryRun ? " (dry run)" : ""
  }`,
);
