import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(repoRoot, "packages/react-data-grid-kit");
const packageJsonPath = resolve(packageRoot, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

const requiredFiles = [
  "README.md",
  "LICENSE",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/headless.js",
  "dist/headless.d.ts",
  "dist/styles.css",
  "dist/tokens.css"
];

const failures = [];

if (packageJson.license !== "UNLICENSED") {
  failures.push("package.json must use license \"UNLICENSED\" until legal selects a final license.");
}

for (const file of ["README.md", "LICENSE", "dist"]) {
  if (!packageJson.files?.includes(file)) {
    failures.push(`package.json files must include ${file}.`);
  }
}

for (const file of requiredFiles) {
  try {
    await access(resolve(packageRoot, file));
  } catch {
    failures.push(`Missing package artifact: ${file}`);
  }
}

for (const [exportPath, exportValue] of Object.entries(packageJson.exports ?? {})) {
  const targets = typeof exportValue === "string"
    ? [exportValue]
    : Object.values(exportValue).filter((value) => typeof value === "string");

  for (const target of targets) {
    try {
      await access(resolve(packageRoot, target));
    } catch {
      failures.push(`Export ${exportPath} points to missing target ${target}.`);
    }
  }
}

if (failures.length > 0) {
  stderr.write(`${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  exit(1);
}

stdout.write("Package manifest and export targets are valid.\n");
