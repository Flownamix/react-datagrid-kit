import type { Preview } from "@storybook/react-vite";
import "@flownamix/react-data-grid-kit/styles.css";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    actions: { disable: true },
    controls: { expanded: true },
    docs: {
      toc: true
    },
    options: {
      storySort: {
        order: ["Docs", ["Overview", "Quick Start", "Theming", "Icons", "Accessibility"], "Components"]
      }
    }
  }
};

export default preview;
