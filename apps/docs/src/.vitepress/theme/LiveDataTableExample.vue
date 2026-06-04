<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Root } from "react-dom/client";

const props = defineProps<{
  name: string;
}>();

const mountEl = ref<HTMLDivElement | null>(null);
const status = ref<"idle" | "loading" | "ready" | "error">("idle");
const errorMessage = ref("");

let root: Root | undefined;
let renderRun = 0;

async function renderExample() {
  if (!mountEl.value) {
    return;
  }

  const currentRun = ++renderRun;
  status.value = "loading";
  errorMessage.value = "";

  try {
    const [{ createElement }, { createRoot }, { getLiveDataTableExample }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("../../examples/liveDataTableExamples")
    ]);

    if (currentRun !== renderRun || !mountEl.value) {
      return;
    }

    const example = getLiveDataTableExample(props.name);

    if (!example) {
      throw new Error(`Unknown live table example: ${props.name}`);
    }

    root?.unmount();
    root = createRoot(mountEl.value);
    root.render(createElement(example.Component));
    status.value = "ready";
  } catch (error) {
    status.value = "error";
    errorMessage.value = error instanceof Error ? error.message : "The live example could not be loaded.";
  }
}

onMounted(() => {
  void renderExample();
});

watch(() => props.name, () => {
  void renderExample();
});

onBeforeUnmount(() => {
  renderRun += 1;
  root?.unmount();
  root = undefined;
});
</script>

<template>
  <figure class="docs-liveExample" :data-example="name">
    <div ref="mountEl" class="docs-liveExampleMount" :aria-busy="status === 'loading'"></div>
    <figcaption v-if="status === 'loading'" class="docs-liveExampleStatus">
      Loading live example...
    </figcaption>
    <figcaption v-if="status === 'error'" class="docs-liveExampleStatus error" role="alert">
      {{ errorMessage }}
    </figcaption>
  </figure>
</template>

<style scoped>
.docs-liveExample {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 24px 0;
  overflow: hidden;
}

.docs-liveExampleMount {
  min-height: 280px;
}

.docs-liveExampleStatus {
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 13px;
  margin: 0;
  padding: 10px 14px;
}

.docs-liveExampleStatus.error {
  color: var(--vp-c-danger-1);
}
</style>
