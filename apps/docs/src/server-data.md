# Server Data and Async States

The table can run entirely on client-side rows. When sorting, filtering, quick search, pagination, saved views, or refresh states are server-owned, the host application owns fetch state and passes the current result window into `DataTable`.

## Manual Sorting and Filtering

Use `manualSorting` when the server owns row order. Use `manualFiltering` when the server owns filtered rows or search results.

```tsx
const [sort, setSort] = useState<DataTableSort | undefined>({
  columnId: "pipeline",
  direction: "descending"
});
const [filters, setFilters] = useState<DataTableFilterState>({});
const [quickSearch, setQuickSearch] = useState("");

const query = { sort, filters, quickSearch, page };
const result = useAccountsQuery(query);

<DataTable
  rows={result.rows}
  columns={columns}
  getRowId={(row) => row.id}
  sort={sort}
  onSortChange={setSort}
  manualSorting
  filters={filters}
  onFiltersChange={setFilters}
  quickSearch={quickSearch}
  onQuickSearchChange={setQuickSearch}
  manualFiltering
  loading={result.loading}
  stale={result.fetching && !result.loading}
  error={result.error}
/>
```

In manual mode, user interactions update state and callbacks, but the table preserves the supplied `rows`. Fetch the new server result and pass it back in.

## Pagination Metadata

The package does not own pagination controls. Use `totalRowCount` and `rowIndexOffset` so footers and ARIA metadata describe the full result set.

```tsx
<DataTable
  rows={page.rows}
  columns={columns}
  getRowId={(row) => row.id}
  totalRowCount={page.total}
  rowIndexOffset={page.offset}
  renderFooter={({ visibleRowCount, totalRowCount, rowIndexOffset }) => (
    <div>
      Rows {rowIndexOffset + 1}-{rowIndexOffset + visibleRowCount} of {totalRowCount}
    </div>
  )}
/>
```

`rowIndexOffset` is zero-based. If a page starts at row 251, pass `250`.

Grouped tables use group rows and visible grouped items for `aria-rowcount`; use group `totalCount`, `loadedCount`, `countLabel`, and `state` to describe server-side group completeness.

## Server Virtualization

Use `serverVirtualization` when the host app wants load signals from the active virtualized viewport. The table still does not fetch data. It reports ranges and end-reached requests; the host loads rows and passes the next `rows` or `groups` back in.

```tsx
<DataTable
  rows={result.rows}
  columns={columns}
  getRowId={(row) => row.id}
  totalRowCount={result.total}
  rowIndexOffset={result.offset}
  serverVirtualization={{
    loadingMore: result.loadingMore,
    loadMoreError: result.loadMoreError,
    onRowsRangeChange: (range) => trackVisibleServerRange(range),
    onRowsEndReached: ({ requestedStartIndex }) => {
      fetchRows({ offset: requestedStartIndex });
    }
  }}
/>
```

Ungrouped range indexes are absolute server row indexes. Grouped range indexes are local to the group:

```tsx
<DataTable
  rows={result.rows}
  columns={columns}
  getRowId={(row) => row.id}
  groups={result.groups}
  serverVirtualization={{
    onGroupEndReached: ({ groupId, requestedStartIndex }) => {
      fetchGroupRows({ groupId, offset: requestedStartIndex });
    }
  }}
/>
```

For grouped data, set `totalCount`, `loadedCount`, `hasMoreRows`, `loadingMore`, or `loadMoreError` on each group. If `hasMoreRows` is omitted, partial groups are treated as having more rows when `totalCount > loadedCount` or `state` is `"partial"`.

Desktop and mobile lists are both virtualized. Only the active responsive surface emits server virtualization callbacks, so a hidden desktop grid and hidden mobile list do not duplicate fetch requests.

## Loading, Empty, Error, and Stale

Use `loading` for initial or blocking loads. Use `stale` when old rows remain visible while a refresh is in flight. Use `error` when rows could not be loaded.

```tsx
<DataTable
  rows={result.rows}
  columns={columns}
  getRowId={(row) => row.id}
  loading={result.loading}
  stale={result.refetching}
  error={result.error}
  loadingState={{
    title: "Loading accounts",
    description: "Fetching the latest account queue."
  }}
  emptyState={{
    title: "No matching accounts",
    description: "Adjust filters or clear quick search."
  }}
  errorState={{
    title: "Accounts could not be loaded",
    description: "Retry the query or contact support.",
    action: <button type="button" onClick={result.retry}>Retry</button>
  }}
/>
```

The shorthand labels `loadingLabel`, `emptyLabel`, and `errorLabel` still work for simple integrations. Use the state objects when the screen needs a title, description, or action.

## Row Actions and Context Menus

Use `renderRowActions` for explicit per-row controls:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  renderRowActions={(row) => (
    <button type="button" onClick={() => openAccount(row.id)}>
      Open
    </button>
  )}
/>
```

Use `onRowClick` for row activation and `onRowContextMenu` for app-owned context menus. Native buttons, links, inputs, selects, textareas, common ARIA interactive roles, and elements marked with `data-rdtg-stop-row-click` do not trigger row activation.

## Fetching Checklist

- Debounce server quick search in the host app if needed.
- Keep `rows` stable until a replacement result arrives when using `stale`.
- Pass `totalRowCount` and `rowIndexOffset` for server-paged, ungrouped data.
- Use `serverVirtualization` for viewport-driven loading; de-dupe, cancellation, retries, and fetch state remain in the host app.
- Use controlled `sort`, `filters`, and `quickSearch` when they are part of the query key.
- Use stable row ids across refreshes so selection, editing, and grouping stay coherent.
