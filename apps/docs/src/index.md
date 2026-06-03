---
layout: home
hero:
  name: React Data Grid Kit
  text: React table components for data-heavy workflows
  tagline: Typed columns, custom cell templates, filter controls, grouped rows, and accessible responsive rendering.
actions:
  - theme: brand
    text: Quick Start
    link: /quick-start
  - theme: alt
    text: API Reference
    link: /api
features:
  - title: Integration-first API
    details: Start with the core concepts, then compose toolbar controls, saved views, server data, editing, and responsive rendering.
  - title: Grouped row states
    details: Groups support row ids, direct rows, partial loads, progress, states, summaries, and controlled collapse.
  - title: Durable package contracts
    details: Controlled and uncontrolled state patterns are documented for sorting, filters, quick search, column state, editing, selection, and groups.
  - title: API reference
    details: Props, types, slots, and state updaters are documented alongside the workflow guides that use them.
---

## Documentation Map

Read `/quick-start` first when adding the package to an app. Read `/concepts` next when deciding what state the table should own and what the host application should own.

Use the workflow guides for implementation:

- `/toolbar-and-slots` for quick search, column controls, bulk actions, summaries, and pagination slots.
- `/columns` for visibility, ordering, resizing, pinning, and saved views.
- `/server-data` for manual sorting, manual filtering, pagination metadata, loading, stale refreshes, and errors.
- `/editing` for inline editors, async validation, and controlled edit state.
- `/responsive-rendering` for built-in mobile fields and custom mobile cards.
- `/headless` for model helpers used by saved-view stores, adapters, and tests.

Use `/api` as the prop and type reference after the workflow is clear.
