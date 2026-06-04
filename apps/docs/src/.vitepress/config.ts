import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "React Data Grid Kit",
  description: "React data table package documentation.",
  base: "/react-datagrid-kit/",
  cleanUrls: true,
  vite: {
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: "@flownamix/react-data-grid-kit/headless",
          replacement: fileURLToPath(new URL("../../../../packages/react-data-grid-kit/src/headless.ts", import.meta.url))
        },
        {
          find: "@flownamix/react-data-grid-kit",
          replacement: fileURLToPath(new URL("../../../../packages/react-data-grid-kit/src/index.ts", import.meta.url))
        }
      ]
    }
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/quick-start" },
      { text: "Examples", link: "/examples" },
      { text: "API", link: "/api" }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/Flownamix/react-datagrid-kit" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Overview", link: "/" },
          { text: "Quick Start", link: "/quick-start" },
          { text: "Examples", link: "/examples" },
          { text: "Core Concepts", link: "/concepts" },
          { text: "Toolbar and Slots", link: "/toolbar-and-slots" },
          { text: "Columns and Saved Views", link: "/columns" },
          { text: "Server Data", link: "/server-data" },
          { text: "Inline Editing", link: "/editing" },
          { text: "Grouping", link: "/grouping" },
          { text: "Filtering", link: "/filtering" },
          { text: "Responsive Rendering", link: "/responsive-rendering" },
          { text: "Theming", link: "/theming" },
          { text: "Icons", link: "/icons" },
          { text: "Accessibility", link: "/accessibility" }
        ]
      },
      {
        text: "Reference",
        items: [
          { text: "API", link: "/api" },
          { text: "Headless Helpers", link: "/headless" },
          { text: "Troubleshooting", link: "/troubleshooting" },
          { text: "Package and License", link: "/package-and-license" },
          { text: "Contributing", link: "/contributing" }
        ]
      }
    ],
    search: {
      provider: "local"
    }
  }
});
