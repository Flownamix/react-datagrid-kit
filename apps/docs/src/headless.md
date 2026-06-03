# Headless Helpers

Use `@flownamix/react-data-grid-kit/headless` in shared integration code, saved-view stores, server adapters, and tests that need the package model helpers without importing React components or CSS.

```ts
import {
  applyColumnFiltersUpdate,
  applyRowSelectionUpdate,
  groupRows,
  nextSort,
  rowMatchesQuickSearch,
  selectedIdsToRowSelection,
  type DataTableColumnOrderState,
  type DataTableRenderContext
} from "@flownamix/react-data-grid-kit/headless";
```

## Exported Helpers

Grouping:

- `groupRows`
- `summarizeGroup`
- `toggleCollapsedGroup`

Filtering:

- `filtersToColumnFilters`
- `columnFiltersToFilters`
- `applyColumnFiltersUpdate`
- `rowMatchesQuickSearch`

Row selection:

- `selectedIdsToRowSelection`
- `rowSelectionToSelectedIds`
- `applyRowSelectionUpdate`

Sorting:

- `compareSortValues`
- `nextSort`

The headless entrypoint also exports public integration types so saved-view utilities can stay aligned with the component API.

State setters use updater aliases that match the React component's slot setters:

- `DataTableQuickSearchUpdater`
- `DataTableColumnVisibilityUpdater`
- `DataTableColumnOrderUpdater`
- `DataTableColumnSizingUpdater`
- `DataTableColumnPinningUpdater`

The headless entrypoint also exports context and rendering types such as `DataTableColumnContext`, `DataTableFilterContext`, `DataTableFilterActiveContext`, `DataTableColumnFilterContext`, `DataTableEditCellContext`, `DataTableGroupHeaderContext`, `DataTableGroupSummary`, and `DataTableVisibleItem`.

## Saved View Utilities

Use exported state types when persisting user preferences:

```ts
export interface SavedAccountView {
  columnVisibility: DataTableColumnVisibilityState;
  columnOrder: DataTableColumnOrderState;
  columnSizing: DataTableColumnSizingState;
  columnPinning: DataTableColumnPinningState;
  sort?: DataTableSort;
  filters: DataTableFilterState;
  quickSearch: string;
}
```

## Sorting Cycles

`nextSort` implements the same header cycle used by the table:

```ts
const next = nextSort(column, currentSort);
```

The cycle is ascending, descending, and then cleared. When cleared, `nextSort` returns `undefined`.

## Quick Search Matching

`rowMatchesQuickSearch` uses the same matching rules as local toolbar quick search:

```ts
const visible = rows.filter((row) =>
  rowMatchesQuickSearch({
    columns,
    query: quickSearch,
    row,
    rowId: row.id
  })
);
```

Use this in tests or server-adapter fixtures when you want behavior to match the component's local quick search semantics.

## What Headless Does Not Export

The headless entrypoint is for model helpers and public types. It does not export React components, hooks, stylesheet side effects, or internal layout helpers.
