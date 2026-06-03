# Theming

The stylesheet exposes CSS custom properties for color, typography, borders, radius, density, and motion.

```css
.crm-shell {
  --rdtg-color-primary: #0f766e;
  --rdtg-color-surface: #ffffff;
  --rdtg-color-border: #d7dde5;
  --rdtg-radius-md: 6px;
}
```

Use `density="compact"` for dense work queues and `density="comfortable"` when cells contain richer templates.

Motion is restrained: row-model changes, selected rows, popovers, state panels, group headers, and mobile cards use transitions driven by the motion tokens. Filter popovers fade in and scale from `0.95` without translating, so placement stays stable while the shell appears. Group collapse and expand use `--rdtg-motion-collapse`, which defaults to a slower 500ms timing so grouped rows do not feel abrupt. Use `motion="system"` by default so `prefers-reduced-motion` is respected, `motion="reduced"` when a product area must avoid animation regardless of OS settings, and `motion="always"` only when product requirements explicitly allow motion.
