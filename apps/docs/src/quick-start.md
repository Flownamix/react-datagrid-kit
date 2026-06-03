# Quick Start

Install the package in a React application and import the stylesheet once.

```tsx
import { DataTable, type DataTableColumn } from "@flownamix/react-data-grid-kit";
import "@flownamix/react-data-grid-kit/styles.css";

type Account = {
  id: string;
  name: string;
  owner: string;
};

const columns: Array<DataTableColumn<Account>> = [
  {
    id: "name",
    header: "Account",
    sortable: true,
    sortAccessor: (row) => row.name,
    renderCell: (row) => <strong>{row.name}</strong>
  },
  {
    id: "owner",
    header: "Owner",
    renderCell: (row) => row.owner
  }
];

export function AccountsTable({ rows }: { rows: Account[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      ariaLabel="Accounts"
      toolbar
      defaultSort={{ columnId: "name", direction: "ascending" }}
    />
  );
}
```

The API keeps rendering in consumer code. The table owns layout, selection, sort wiring, grouping, responsive behavior, motion, and accessibility mechanics.

Read `/concepts` after this page for the ownership model. The short version: use uncontrolled `defaultX` props for simple table-owned state, and controlled `x` plus `onXChange` props when URL state, saved views, server queries, or parent components own state.

Use `defaultSort` when the table can manage sorting internally. Local sorting requires a column `sortAccessor`. Header clicks cycle ascending, descending, and no sort; clearing sort restores the supplied row order in uncontrolled local mode.

Use `sort`, `onSortChange`, and `manualSorting` together when server data, URL state, or saved views own the sort contract. In manual sorting mode, the table updates sort UI and change events but preserves the row order supplied by your application. Controlled integrations receive `onSortChange(undefined)` when users clear the active sort.

For selection, pass `onSelectedIdsChange` when users should be able to change selected rows. Passing only `selectedIds` renders a read-only selection state.

Use `renderToolbar` and `renderFooter` when a screen needs bulk actions, result summaries, or pagination controls that can read the table's modeled state without duplicating selection, filter, and sort calculations.

Use `toolbar` for package-owned standard controls. `toolbar={true}` renders quick search and column controls; configure `toolbar.quickSearch`, `toolbar.columnVisibility`, `toolbar.renderActions`, and `toolbar.renderSummary` when a screen needs host actions in the same control bar. Quick search can be controlled with `quickSearch` and `onQuickSearchChange`, initialized with `defaultQuickSearch`, and is local TanStack global filtering unless `manualFiltering` is enabled.

For server-paged data, keep page state and fetching in your application. Pass `totalRowCount` and zero-based `rowIndexOffset` so footer slots and desktop ARIA metadata describe the full result set while the table renders the loaded `rows`.

Use `defaultColumnVisibility` for table-owned saved-view defaults, or `columnVisibility` with `onColumnVisibilityChange` when a parent application owns user preferences or URL state. The built-in toolbar column-controls menu and custom toolbar slots both update the same state; set `hideable: false` on columns that should stay locked.

Use `defaultColumnOrder` for table-owned saved-view ordering, or `columnOrder` with `onColumnOrderChange` when saved views, URL state, or user preferences own the arrangement. The order is TanStack-backed and drives desktop headers, desktop cells, built-in mobile fields, and `visibleColumns` in slots. Set `enableColumnReordering` when users should be able to drag desktop header handles into a custom order.

Use `defaultColumnSizing` for table-owned widths, or `columnSizing` with `onColumnSizingChange` when saved views, URL state, or user preferences own resizable column widths. Set `resizable: true` on columns that should expose desktop resize handles, and use `minWidth`/`maxWidth` to keep the layout inside practical bounds.

Use `defaultColumnPinning` for table-owned saved-view pins, or `columnPinning` with `onColumnPinningChange` when a parent application persists pinned columns. Pinning is TanStack-backed and reorders visible columns into left, center, and right regions. Desktop cells use native sticky positioning in the table scroll frame; pair pinned columns with pixel sizing for predictable offsets in horizontally scrollable tables.

For inline editing, add `editable`, `getEditValue`, and `renderEditCell` to the editable column, then persist changes in `onCellEditCommit`. Editors can be simple inline controls such as text inputs or selects; they do not need a popover when the value is a compact enum. The table owns the editing interaction state, focuses the editor on open, supports Escape cancel and Ctrl/Cmd+Enter commit, keeps async saves pending in-place, and renders returned or thrown validation errors without mutating your row data. If the edited row or column leaves the visible model, stale drafts and async commits are discarded. Built-in mobile fields use the same editing contract; custom `renderCard` content owns its own mobile edit UI.

## Next Steps

- `/toolbar-and-slots`: add quick search, column controls, actions, summaries, and pagination controls.
- `/columns`: wire saved-view visibility, order, sizing, pinning, and header drag reorder.
- `/server-data`: connect manual sorting/filtering, server pagination metadata, loading, stale, and error states.
- `/editing`: add inline editing with async validation.
- `/responsive-rendering`: choose built-in mobile fields or custom mobile cards.
- `/api`: look up exact prop and type signatures.
