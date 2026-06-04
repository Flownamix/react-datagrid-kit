# Columns and Saved Views

Column state is TanStack-backed and exposed through package-level controlled/uncontrolled props. Use it for saved views, user preferences, URL state, and parent-owned grid shells.

## Column Definition

A data column needs an `id`, `header`, and `renderCell`:

```tsx
const columns: Array<DataTableColumn<Account>> = [
  {
    id: "account",
    header: "Account",
    width: "minmax(240px, 2fr)",
    sortable: true,
    sortAccessor: (row) => row.name,
    renderCell: (row) => <AccountCell row={row} />
  }
];
```

Use stable ids. Column visibility, order, sizing, pinning, filters, sorting, and editing all key off `column.id`.

## Visibility

Use `defaultColumnVisibility` for table-owned defaults:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  defaultColumnVisibility={{
    internalScore: false
  }}
/>
```

Use `columnVisibility` with `onColumnVisibilityChange` when saved views, user preferences, or URL state own the current view. Values are keyed by column id. `false` hides a column; `true` and missing keys are visible.

Hidden columns are removed from desktop headers, desktop cells, built-in mobile fields, keyboard navigation, resize handles, and column index metadata. Custom `renderCard` content is app-owned, so it must read the same state if mobile cards should mirror hidden columns.

Set `hideable: false` to keep a column out of the built-in toolbar column menu.

## Ordering and Drag Reorder

Use `defaultColumnOrder` for initial saved-view order or `columnOrder` with `onColumnOrderChange` for controlled state:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  defaultColumnOrder={["account", "status", "owner", "lastActivity"]}
  enableColumnReordering
/>
```

`enableColumnReordering` renders desktop header drag handles. Header dragging updates the same column order state as `setColumnOrder` in toolbar slots.

Set `reorderable: false` on columns that should not be moved by header drag. Missing known columns keep their original `columns` prop order after the ordered ids.

## Sizing and Resize Handles

Use `width` for the initial CSS grid track. Use `defaultColumnSizing` or `columnSizing` for pixel sizing state:

```tsx
const columns = [
  {
    id: "account",
    header: "Account",
    width: "minmax(240px, 2fr)",
    resizable: true,
    minWidth: 220,
    maxWidth: 520,
    renderCell: (row) => row.name
  }
];

<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  defaultColumnSizing={{
    account: 320
  }}
/>
```

Resizable columns expose always-visible desktop resize separators. Pointer drag, ArrowLeft/ArrowRight, Shift+ArrowLeft/Shift+ArrowRight, Home, and End update the same column sizing state.

Use pixel sizing for pinned columns. Sticky offsets can fall back to default widths for flexible tracks, but persisted pinned layouts should store pixel widths for predictable pinning.

## Pinning

Use `defaultColumnPinning` or controlled `columnPinning`:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  defaultColumnPinning={{
    left: ["account"],
    right: ["status"]
  }}
/>
```

Pinned desktop columns are rendered in left, center, and right regions through TanStack's visible leaf column model. Native sticky positioning keeps body cells locked inside the table scroll frame. If left data columns are pinned, the selection column is also sticky so pinned cells do not cover checkboxes. If right data columns are pinned, the actions column is sticky for the same reason.

## Saved View Example

A parent-owned saved view can control all column state:

```tsx
function AccountsGrid({ rows, savedView, onSavedViewChange }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      columnVisibility={savedView.columnVisibility}
      onColumnVisibilityChange={(columnVisibility) =>
        onSavedViewChange({ ...savedView, columnVisibility })
      }
      columnOrder={savedView.columnOrder}
      onColumnOrderChange={(columnOrder) =>
        onSavedViewChange({ ...savedView, columnOrder })
      }
      columnSizing={savedView.columnSizing}
      onColumnSizingChange={(columnSizing) =>
        onSavedViewChange({ ...savedView, columnSizing })
      }
      columnPinning={savedView.columnPinning}
      onColumnPinningChange={(columnPinning) =>
        onSavedViewChange({ ...savedView, columnPinning })
      }
      enableColumnReordering
      toolbar
    />
  );
}
```

Keep saved view objects keyed by stable column ids. When a column is removed from the schema, stale ids are ignored by the visible column model.

<LiveDataTableExample name="saved-views" />
