# Grouping

Use groups when rows need section headers, collapse state, group-level metadata, or server-side completeness indicators.

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  groups={[
    {
      id: "priority",
      label: "Priority accounts",
      rowIds: ["acc-001", "acc-004"],
      totalCount: 18,
      loadedCount: 2,
      state: "partial",
      progressLabel: "Syncing remaining accounts",
      progressValue: 11
    }
  ]}
/>;
```

Use `rowIds` when groups are produced by a server query and `rows` when the group already owns its dataset. `state`, `totalCount`, `loadedCount`, `progressLabel`, and `summary` let the UI represent partial loads, empty groups, and integration errors without pretending every group is complete.

Desktop and mobile render from the same grouped visibility model. Collapse state, partial/error states, counts, progress, and selected rows remain visible on mobile.

Desktop collapse and expand motion is tied to the grouped visibility model. When a group collapses, rows leave the live model immediately and the desktop body keeps short-lived inert visual exits for the configured collapse duration, so app state, keyboard targets, and screen-reader metadata update without a visual snap. Use `motion="reduced"` to skip those transient exits.

Use `renderGroupHeader` and `renderMobileGroupHeader` when a grouped workflow needs a custom header layout. Both callbacks receive `(group, summary, context)`, where `context` includes `collapsed`, `collapsible`, `icons`, and `toggle`, so custom headers can keep the table's built-in collapse behavior.

The grouping support types are exported for shared renderers and server adapters. `DataTableGroupState` names the supported state values, `DataTableGroupSummary<T>` describes loaded/total group counts and visible rows, and `DataTableGroupHeaderContext<T>` provides the collapse state and `toggle` function for custom group headers.

## Controlled Collapse

Use uncontrolled defaults when groups can own their initial collapsed state:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  groups={[
    { id: "exceptions", label: "Exceptions", rowIds: [], defaultCollapsed: true }
  ]}
/>
```

Use `collapsedGroupIds` and `onCollapsedGroupIdsChange` when the host app persists group collapse in a saved view or URL:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  groups={groups}
  collapsedGroupIds={collapsedGroupIds}
  onCollapsedGroupIdsChange={setCollapsedGroupIds}
/>
```

If `collapsible` is `false`, the group stays expanded even if defaults, controlled state, built-in controls, or custom group headers try to collapse it.

## Server Group States

Use group metadata to avoid misleading users when only part of a server group is loaded:

```tsx
{
  id: "priority",
  label: "Priority accounts",
  rowIds: ["acc-001", "acc-004"],
  totalCount: 18,
  loadedCount: 2,
  countLabel: "2 loaded of 18",
  state: "partial",
  progressLabel: "Syncing remaining accounts",
  progressValue: 11,
  actions: <button type="button">Retry</button>
}
```

Use `state="error"` for group-level integration failures and `state="empty"` for known-empty groups. Use `depth` when rendering hierarchical group levels.

## Custom Group Headers

Custom headers should call `context.toggle` instead of mutating collapse state directly:

```tsx
renderGroupHeader={(group, summary, context) => (
  <button
    type="button"
    aria-expanded={!context.collapsed}
    onClick={context.toggle}
  >
    {group.label} ({summary.loadedCount})
  </button>
)}
```

Use `renderMobileGroupHeader` when the mobile group header needs a different layout, but keep the same toggle context so desktop and mobile stay synchronized.
