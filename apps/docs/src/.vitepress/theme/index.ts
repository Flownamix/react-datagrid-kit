import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import LiveDataTableExample from "./LiveDataTableExample.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LiveDataTableExample", LiveDataTableExample);
  }
} satisfies Theme;
