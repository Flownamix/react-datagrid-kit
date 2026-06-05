import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const storybookConfigDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-docs"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      tsconfigPath: resolve(storybookConfigDir, "../tsconfig.json")
    }
  },
  viteFinal: async (viteConfig) => mergeConfig(viteConfig, {
    resolve: {
      alias: [
        {
          find: /^@flownamix\/react-data-grid-kit$/,
          replacement: resolve(storybookConfigDir, "../../../packages/react-data-grid-kit/src/index.ts")
        },
        {
          find: /^@flownamix\/react-data-grid-kit\/headless$/,
          replacement: resolve(storybookConfigDir, "../../../packages/react-data-grid-kit/src/headless.ts")
        },
        {
          find: /^@flownamix\/react-data-grid-kit\/styles\.css$/,
          replacement: resolve(storybookConfigDir, "../../../packages/react-data-grid-kit/src/styles/styles.css")
        },
        {
          find: /^@flownamix\/react-data-grid-kit\/tokens\.css$/,
          replacement: resolve(storybookConfigDir, "../../../packages/react-data-grid-kit/src/styles/tokens.css")
        }
      ]
    }
  })
};

export default config;
