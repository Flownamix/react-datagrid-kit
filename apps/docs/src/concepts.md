# Core Concepts

`DataTable` is a package-owned table shell around consumer-owned data and rendering. Use it when an application needs selection, sorting, filtering, saved-view column state, grouping, inline editing, responsive mobile rendering, and accessible keyboard behavior.

The package does not own your data source. Rows come from your application, and mutations go back through callbacks. TanStack Table powers the row model, sorting, filtering, selection, column visibility, column order, column sizing, and column pinning under the package API.

## Required Shape

Every table needs:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  ariaLabel="Accounts"
/>
```

`rows` is the currently loaded dataset. In local mode that can be the full client-side dataset. In server mode it is usually the current page or current query result window.

`columns` describes data columns only. Selection and row actions are added by the table when you pass selection props or `renderRowActions`.

`getRowId` must return a stable string id. Selection, editing, grouping by `rowIds`, virtualization, and stale async edit protection all depend on that id staying stable across refreshes.

## Controlled and Uncontrolled State

Most state supports the same pattern:

- `defaultX` initializes table-owned state.
- `x` plus `onXChange` makes the host application own state.
- Passing `x={undefined}` for props that support undefined, such as `sort` and `editingCell`, is an explicit controlled empty state.

Use uncontrolled defaults when the table can own its state. Use controlled state for URL state, saved views, user preferences, server queries, or parent-owned grid shells.

Common controlled state pairs:

- `sort`, `onSortChange`, `manualSorting`
- `filters`, `onFiltersChange`, `manualFiltering`
- `quickSearch`, `onQuickSearchChange`
- `columnVisibility`, `onColumnVisibilityChange`
- `columnOrder`, `onColumnOrderChange`
- `columnSizing`, `onColumnSizingChange`
- `columnPinning`, `onColumnPinningChange`
- `editingCell`, `onEditingCellChange`
- `collapsedGroupIds`, `onCollapsedGroupIdsChange`

## Local Mode and Manual Mode

Local mode means the table transforms the supplied `rows`. Local sorting needs `sortable: true` and `sortAccessor`. Local column filtering needs a column `filterFn`. Local quick search uses TanStack global filtering and each column's `quickSearchText`, `sortAccessor`, or simple rendered text.

Manual mode means the host application transforms rows before passing them to the table. Use `manualSorting` and `manualFiltering` for server-backed queries, URL-backed searches, or saved-view query state. In manual mode the controls still emit state changes, but the table preserves the supplied row order and row set.

## Rendering Ownership

Cell content is consumer-owned:

```tsx
const columns = [
  {
    id: "account",
    header: "Account",
    renderCell: (row) => <AccountCell row={row} />
  }
];
```

The package owns the surrounding table mechanics: grid roles, column headers, filter popovers, resize handles, selection checkboxes, row virtualization, mobile field layout, empty/loading/error panels, and motion. Put domain-specific UI in `renderCell`, `filterControl`, `renderEditCell`, `renderRowActions`, `renderCard`, toolbar slots, or group header slots.

## What to Read Next

- Use `/quick-start` to get a minimal table rendering.
- Use `/columns` for saved views, resizing, ordering, pinning, and column visibility.
- Use `/toolbar-and-slots` for quick search, column controls, actions, summaries, and pagination slots.
- Use `/server-data` for server sorting, filtering, pagination metadata, stale states, and async fetch patterns.
- Use `/editing` for inline edit lifecycle and async validation.
- Use `/responsive-rendering` for mobile cards and built-in mobile fields.
