# Filtering

Filtering is intentionally consumer-owned. The table provides controlled or uncontrolled filter state, but it does not prescribe whether filtering happens locally, on the server, through saved views, or through a domain-specific query builder.

```tsx
const [filters, setFilters] = useState({
  account: { term: "", region: "all" }
});

const columns = [
  {
    id: "account",
    header: "Account",
    filterLabel: "Filter accounts",
    filterActive: ({ value }) => Boolean(value?.term),
    filterFn: (row, value) => row.name.includes(value.term),
    filterControl: ({ value, setFilter, clearFilter, close }) => (
      <AccountFilter
        value={value}
        onChange={setFilter}
        onReset={clearFilter}
        onApply={close}
      />
    ),
    renderCell: (row) => <AccountCell row={row} />
  }
];

<DataTable
  rows={filteredRows}
  columns={columns}
  getRowId={(row) => row.id}
  filters={filters}
  onFiltersChange={setFilters}
/>;
```

This keeps the package flexible for enterprise apps where filters may include search, multi-select, server-owned facets, date ranges, saved views, permissions, or domain-specific controls.

Use `defaultFilters` when the table can own temporary filter UI state. Use `filters` with `onFiltersChange` when filters are part of the page URL, server query, saved view, or external form state.

Local filtering is opt-in. Add `filterFn` to a column when TanStack should apply the filter to the row model. Omit `filterFn`, or set `manualFiltering`, when the server owns the filtered `rows`.

The package owns the popover shell around each custom filter. Trigger buttons expose expanded and active state, the popover is a labelled dialog with a styled header and form-control defaults, focus moves into the custom control when it opens, and Escape returns focus to the trigger.

## Quick Search

Quick search is separate from column filters. It is designed for a toolbar search box that scans visible row data.

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  toolbar={{
    quickSearch: { placeholder: "Search accounts" },
    columnVisibility: true
  }}
  defaultQuickSearch="energy"
/>
```

For local quick search, provide `quickSearchText` when `renderCell` is a rich template:

```tsx
{
  id: "account",
  header: "Account",
  quickSearchText: (row) => `${row.name} ${row.owner} ${row.region}`,
  renderCell: (row) => <AccountCell row={row} />
}
```

Set `quickSearchable: false` on columns that should not be searched. With `manualFiltering`, quick search state is emitted but rows are not filtered locally; fetch the server result in the host app.

## Active State

By default, a filter is active when its value is not `undefined`, not `null`, not an empty string, and not an empty array. Use `filterActive` when a filter value is an object and only some fields should count:

```tsx
{
  id: "activity",
  header: "Activity",
  filterActive: ({ value }) => {
    const filter = value as { after?: string; sla?: string } | undefined;
    return Boolean(filter?.after || filter?.sla);
  },
  filterControl: ActivityFilter,
  renderCell: (row) => row.lastActivity
}
```

## Column Filter Context

`filterControl` receives `DataTableFilterContext<T>` with `column`, `value`, `filters`, `setFilter`, `clearFilter`, and `close`.

`filterActive` receives `DataTableFilterActiveContext<T>` with `column`, `value`, and `filters`.

`filterFn` receives `(row, value, context)`, where `context` is `DataTableColumnFilterContext<T>`. The context includes `row`, `rowId`, `column`, `value`, and the complete `filters` object, which is useful when one filter needs to consider another filter's value.

## Related Guides

- `/toolbar-and-slots` covers the built-in quick search control.
- `/server-data` covers manual server filtering and query state.
- `/headless` covers helper functions for adapting filter state outside React.
