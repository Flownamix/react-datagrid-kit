# Toolbar and Slots

The package has two toolbar paths:

- `toolbar` renders package controls for common table tasks.
- `renderToolbar` renders a fully app-owned control area with access to the modeled table state.

Use `renderFooter` for pagination, result summaries, totals, and secondary metadata below the table.

## First-Class Toolbar

Use `toolbar={true}` when you want the default quick search and column visibility controls:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  ariaLabel="Accounts"
  toolbar
/>
```

Configure the controls when labels, placeholders, host actions, or summaries need to match the screen:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  ariaLabel="Accounts"
  toolbar={{
    ariaLabel: "Account table controls",
    quickSearch: {
      placeholder: "Search account, owner, or region"
    },
    columnVisibility: {
      label: "Columns",
      resetLabel: "Reset columns"
    },
    renderActions: ({ selectedCount }) => (
      <>
        <button type="button" disabled={selectedCount === 0}>
          Assign {selectedCount || ""}
        </button>
        <button type="button">Export</button>
      </>
    ),
    renderSummary: ({ visibleRowCount, totalRowCount, quickSearch }) => (
      <span>
        {visibleRowCount} of {totalRowCount} rows
        {quickSearch ? ` matching "${quickSearch}"` : ""}
      </span>
    )
  }}
/>
```

Disable a standard control by setting it to `false`:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  toolbar={{
    quickSearch: false,
    columnVisibility: { label: "Fields" }
  }}
/>
```

<LiveDataTableExample name="toolbar-filtering" />

## Quick Search

Quick search uses `quickSearch`, `defaultQuickSearch`, and `onQuickSearchChange`.

In local filtering mode, quick search filters the supplied `rows`. A column participates unless `quickSearchable` is `false`. For custom cell templates, provide `quickSearchText`:

```tsx
const columns = [
  {
    id: "account",
    header: "Account",
    quickSearchText: (row) => `${row.name} ${row.owner} ${row.region}`,
    renderCell: (row) => <AccountCell row={row} />
  },
  {
    id: "internalScore",
    header: "Internal score",
    quickSearchable: false,
    renderCell: (row) => row.internalScore
  }
];
```

With `manualFiltering`, quick search remains controlled state for a server query. The table does not filter rows locally:

```tsx
const [quickSearch, setQuickSearch] = useState("");

<DataTable
  rows={page.rows}
  columns={columns}
  getRowId={(row) => row.id}
  toolbar
  quickSearch={quickSearch}
  onQuickSearchChange={setQuickSearch}
  manualFiltering
/>
```

Fetch the next server result set when `quickSearch` changes, then pass the returned rows back in.

## Column Controls

The built-in column menu updates `columnVisibility` state. Use `hideable: false` for fields that must stay visible, such as the primary identity column:

```tsx
const columns = [
  {
    id: "account",
    header: "Account",
    hideable: false,
    renderCell: (row) => row.name
  },
  {
    id: "owner",
    header: "Owner",
    renderCell: (row) => row.owner
  }
];
```

Limit the menu to specific columns with `columnIds`, or allow a user to hide every hideable column with `allowHideAll`.

## Custom Toolbar Slot

Use `renderToolbar` when the app needs complete control over the toolbar layout:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  renderToolbar={({ selectedCount, columnOrder, setColumnOrder }) => (
    <div aria-label="Saved view toolbar">
      <button type="button" disabled={selectedCount === 0}>
        Assign {selectedCount || ""}
      </button>
      <button
        type="button"
        onClick={() => setColumnOrder(["account", "status", "owner"])}
      >
        Operations view
      </button>
      <span>{columnOrder.join(", ") || "Default order"}</span>
    </div>
  )}
/>
```

The render context includes rows, visible columns, quick search, saved-view column state setters, visible rows/items, selection state, sort state, filters, loading, error, and stale flags.

## Footer Slot

Use `renderFooter` for pagination and result metadata:

```tsx
<DataTable
  rows={page.rows}
  columns={columns}
  getRowId={(row) => row.id}
  totalRowCount={page.total}
  rowIndexOffset={page.offset}
  renderFooter={({ visibleRowCount, totalRowCount, rowIndexOffset }) => (
    <div aria-label="Page summary">
      Rows {rowIndexOffset + 1}-{rowIndexOffset + visibleRowCount} of {totalRowCount}
    </div>
  )}
/>
```

The table does not own page navigation. Render Previous/Next controls in the toolbar or footer and connect them to the host application's fetch state.
