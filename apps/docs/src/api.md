# API Reference

## `DataTableProps<T>`

Required props:

- `rows: T[]`
- `columns: DataTableColumn<T>[]`
- `getRowId: (row: T) => string`

The base row model, sorting pipeline, and row-selection state are powered by TanStack Table. The public API remains package-specific so consumers do not need to wire TanStack directly for standard table screens.

Core integration props:

- `groups?: DataTableGroup<T>[]`
- `selectedIds?: string[]`
- `onSelectedIdsChange?: (selectedIds: string[]) => void`
- `sort?: { columnId: string; direction: "ascending" | "descending" }`
- `defaultSort?: { columnId: string; direction: "ascending" | "descending" }`
- `onSortChange?: (sort) => void`
- `manualSorting?: boolean`
- `filters?: Record<string, unknown>`
- `defaultFilters?: Record<string, unknown>`
- `onFiltersChange?: (filters) => void`
- `manualFiltering?: boolean`
- `quickSearch?: string`
- `defaultQuickSearch?: string`
- `onQuickSearchChange?: (quickSearch) => void`
- `columnVisibility?: Record<string, boolean>`
- `defaultColumnVisibility?: Record<string, boolean>`
- `onColumnVisibilityChange?: (visibility) => void`
- `columnOrder?: string[]`
- `defaultColumnOrder?: string[]`
- `onColumnOrderChange?: (order) => void`
- `enableColumnReordering?: boolean`
- `columnSizing?: Record<string, number>`
- `defaultColumnSizing?: Record<string, number>`
- `onColumnSizingChange?: (sizing) => void`
- `columnPinning?: { left?: string[]; right?: string[] }`
- `defaultColumnPinning?: { left?: string[]; right?: string[] }`
- `onColumnPinningChange?: (pinning) => void`
- `editingCell?: { rowId: string; columnId: string }`
- `defaultEditingCell?: { rowId: string; columnId: string }`
- `onEditingCellChange?: (cell) => void`
- `onCellEditCommit?: ({ row, rowId, column, value }) => void | Promise<void> | { close?: boolean; error?: ReactNode }`
- `loading?: boolean`
- `error?: boolean | Error`
- `stale?: boolean`
- `totalRowCount?: number`
- `rowIndexOffset?: number`
- `loadingLabel?: string`
- `emptyLabel?: string`
- `errorLabel?: string`
- `loadingState?: DataTableStateLabel`
- `emptyState?: DataTableStateLabel`
- `errorState?: DataTableStateLabel`
- `renderRowActions?: (row: T) => ReactNode`
- `renderCard?: (row: T) => ReactNode`
- `toolbar?: boolean | DataTableToolbarConfig<T>`
- `renderToolbar?: (context) => ReactNode`
- `renderFooter?: (context) => ReactNode`
- `renderGroupHeader?: (group, summary, context) => ReactNode`
- `renderMobileGroupHeader?: (group, summary, context) => ReactNode`
- `collapsedGroupIds?: string[]`
- `defaultCollapsedGroupIds?: string[]`
- `onCollapsedGroupIdsChange?: (groupIds) => void`

Layout and behavior:

- `height?: number`
- `mobileHeight?: number`
- `rowHeight?: number`
- `groupHeight?: number`
- `minWidth?: string`
- `density?: "compact" | "comfortable"`
- `motion?: "system" | "always" | "reduced"`
- `isRowSelectable?: (row: T) => boolean`
- `rowAriaLabel?: (row: T) => string`
- `ariaLabel?: string`
- `ariaLabelledBy?: string`
- `onRowClick?: (row: T) => void`
- `onRowContextMenu?: (row: T, event: MouseEvent) => void`
- `icons?: Partial<DataTableIcons>`
- `className?: string`
- `tableClassName?: string`

Selection behavior:

- Omit both `selectedIds` and `onSelectedIdsChange` for a non-selectable table.
- Pass `onSelectedIdsChange` for mutable selection. `selectedIds` may be controlled or omitted for internal selection state.
- Pass `selectedIds` without `onSelectedIdsChange` only when selection is read-only; checkboxes render disabled so the current selection can be inspected but not changed.
- Use `isRowSelectable` for locked, permission-restricted, archived, or failed rows. Disabled rows remain visible but their checkboxes cannot be changed, and select-all skips them.

Row activation behavior:

- `onRowClick` makes desktop rows and mobile cards keyboard reachable with Enter and Space activation.
- Native interactive descendants such as buttons, links, inputs, selects, and textareas do not bubble into row activation.
- Common ARIA interactive roles and focusable custom controls are also treated as row-activation boundaries.
- Add `data-rdtg-stop-row-click` to custom composite widgets inside cells or cards when the widget should fully own pointer and keyboard events.

Accessibility metadata:

- Provide `ariaLabel` or `ariaLabelledBy` so the desktop grid and mobile list have a stable accessible name.
- The desktop grid exposes `aria-rowcount`, `aria-colcount`, header `aria-colindex`, row `aria-rowindex`, and cell `aria-colindex` metadata. These indexes account for selection and action columns and remain meaningful when the desktop body is virtualized.
- For ungrouped server-paged data, pass `totalRowCount` and zero-based `rowIndexOffset` so `aria-rowcount`, `aria-rowindex`, and slot summaries describe the full result set instead of only the loaded page.
- Desktop keyboard navigation supports Arrow keys, Home/End, Ctrl/Cmd+Home, Ctrl/Cmd+End, and PageUp/PageDown. Page movement uses the configured row height and table height to move by a visible viewport-sized row step.
- Use `rowAriaLabel` when the visible cells do not clearly identify a row for row-level activation.

Integration slots:

- Use `toolbar` when a screen should get package-owned standard controls such as quick search and column visibility controls. Pass `toolbar={true}` for the default quick-search plus column-controls toolbar, or configure `{ quickSearch, columnVisibility, renderActions, renderSummary }`.
- Use `renderToolbar` and `renderFooter` for fully app-owned controls, saved-view controls, summaries, pagination controls, or app-specific actions.
- Slots receive `{ rows, columns, visibleColumns, quickSearch, setQuickSearch, columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, columnSizing, setColumnSizing, columnPinning, setColumnPinning, visibleRows, visibleItems, visibleRowCount, totalRowCount, rowIndexOffset, selectedIds, selectedCount, allVisibleSelected, someVisibleSelected, sort, filters, loading, error, stale }`.
- The table does not own pagination, navigation, exporting, or mutations inside these slots. Consumers render those controls and wire them to their app state.
- `totalRowCount` defaults to the loaded visible row count. When a server result set is larger than the supplied `rows`, pass the known total count and the zero-based offset of the first loaded row so pagination footers can render ranges such as `251-300 of 842`.

First-class toolbar:

- `toolbar={true}` renders quick search, column controls, and no host actions. Configure `toolbar.quickSearch` or `toolbar.columnVisibility` as `false` to remove either standard control.
- `toolbar.quickSearch` accepts `{ label, placeholder, clearLabel }`. The value is backed by `quickSearch`, `defaultQuickSearch`, and `onQuickSearchChange`, and is also exposed to custom slots as `quickSearch` and `setQuickSearch`.
- Local quick search is TanStack global filtering. Columns can provide `quickSearchText` for custom cell templates, rely on `sortAccessor`, or fall back to simple text rendered by `renderCell`. Set `quickSearchable: false` to exclude a column.
- With `manualFiltering`, quick search remains visible state but does not filter the supplied `rows`; use `onQuickSearchChange` to update server query state and feed the next page of rows back into the table.
- `toolbar.columnVisibility` accepts `{ label, resetLabel, emptyLabel, columnIds, allowHideAll }`. The menu updates the same TanStack-backed column visibility state as `defaultColumnVisibility`, `columnVisibility`, and `setColumnVisibility`.
- Set `hideable: false` on columns that should never appear in the built-in column-controls menu.

`DataTableToolbarConfig<T>`:

- `ariaLabel?: string`
- `quickSearch?: boolean | DataTableToolbarQuickSearchConfig`
- `columnVisibility?: boolean | DataTableToolbarColumnVisibilityConfig`
- `renderActions?: (context: DataTableRenderContext<T>) => ReactNode`
- `renderSummary?: (context: DataTableRenderContext<T>) => ReactNode`

`DataTableToolbarQuickSearchConfig`:

- `label?: string`
- `placeholder?: string`
- `clearLabel?: string`

`DataTableToolbarColumnVisibilityConfig`:

- `label?: string`
- `resetLabel?: string`
- `emptyLabel?: string`
- `columnIds?: string[]`
- `allowHideAll?: boolean`

`DataTableRenderContext<T>`:

- `rows`, `columns`, `visibleColumns`
- `quickSearch`, `setQuickSearch`
- `columnVisibility`, `setColumnVisibility`
- `columnOrder`, `setColumnOrder`
- `columnSizing`, `setColumnSizing`
- `columnPinning`, `setColumnPinning`
- `visibleRows`, `visibleItems`, `visibleRowCount`, `totalRowCount`, `rowIndexOffset`
- `selectedIds`, `selectedCount`, `allVisibleSelected`, `someVisibleSelected`
- `sort`, `filters`, `loading`, `error`, `stale`

Related context and updater exports:

- `DataTableQuickSearchUpdater` is the accepted value for `setQuickSearch`.
- `DataTableColumnVisibilityUpdater`, `DataTableColumnOrderUpdater`, `DataTableColumnSizingUpdater`, and `DataTableColumnPinningUpdater` are the accepted values for the corresponding setter functions in `DataTableRenderContext`.
- `DataTableVisibleItem<T>` describes entries in `visibleItems`; each item is either a group item with `{ kind: "group", group, rows }` or a row item with `{ kind: "row", row, groupId }`.
- `DataTableColumnContext<T>` is passed to `renderCell`, `quickSearchText`, `editable`, and `getEditValue`.
- `DataTableFilterContext<T>` is passed to custom `filterControl` render functions.
- `DataTableFilterActiveContext<T>` is passed to `filterActive` functions.
- `DataTableColumnFilterContext<T>` is passed to `filterFn`.
- `DataTableEditCellContext<T>` is passed to `renderEditCell`.
- `DataTableCellEditCommit<T>` is passed to `onCellEditCommit`.
- `DataTableCellEditCommitResult` is the optional result returned by `onCellEditCommit` to keep the editor open or show validation feedback.
- `DataTableGroupSummary<T>` and `DataTableGroupHeaderContext<T>` are passed to group summary/header render functions.

Headless entrypoint:

- Import `@flownamix/react-data-grid-kit/headless` when app-owned saved-view stores, server adapters, or tests need the package model helpers without importing the React component or stylesheet.
- The headless entrypoint exports grouping, filtering, row-selection, and sorting helpers such as `groupRows`, `filtersToColumnFilters`, `rowMatchesQuickSearch`, `applyRowSelectionUpdate`, and `nextSort`.
- It also exports the public integration types, including `DataTableColumnVisibilityState`, `DataTableColumnOrderState`, `DataTableColumnSizingState`, `DataTableColumnPinningState`, `DataTableRenderContext`, and `DataTableRowId`, so shared utilities can stay type-aligned with the component API.

Column visibility:

- Column visibility is backed by TanStack Table state. Use `defaultColumnVisibility` when the table can own the current view, or `columnVisibility` with `onColumnVisibilityChange` when the URL, saved view, user preference store, or parent app owns it.
- Visibility values are keyed by column id. `false` hides a column; missing keys and `true` values are visible.
- Hidden columns are removed from desktop headers, desktop cells, built-in mobile fields, keyboard navigation, and `aria-colcount`/`aria-colindex` calculations. Selection and action columns keep their own indexes.
- The built-in `toolbar` column-controls menu reads and updates this same state. Set `hideable: false` on columns that should stay locked in a saved view.
- `renderToolbar` receives the full `columns` list, the current `visibleColumns`, the current `columnVisibility`, and `setColumnVisibility` so a host can render a column chooser without duplicating package state.
- Custom `renderCard` mobile content remains app-owned. If a card should honor column visibility, use controlled state in the host or render the built-in mobile fields instead.

Column ordering:

- Column ordering is backed by TanStack Table state and expressed as an array of column ids. The array describes the preferred data-column order; missing known columns keep their original `columns` prop order after the ordered ids.
- Use `defaultColumnOrder` when the table can own saved-view defaults, or `columnOrder` with `onColumnOrderChange` when URL state, user preferences, or a parent grid shell owns the order.
- Set `enableColumnReordering` to render desktop header drag handles that update the same column-order state. Set `reorderable: false` on a column that should stay out of header drag/drop.
- Ordering affects desktop headers, desktop cells, built-in mobile fields, keyboard navigation, and `visibleColumns` in integration slots. Custom `renderCard` mobile content remains app-owned.
- Column visibility and pinning are applied through TanStack's visible leaf column model. Hidden columns are omitted, and pinned columns are rendered in left, center, and right regions while preserving the relevant saved-view order.
- `renderToolbar` receives `columnOrder` and `setColumnOrder` so a host can render order presets, reset actions, persistence controls, or a drag-and-drop column manager without duplicating package state.

Column sizing:

- Column sizing is backed by TanStack Table state and expressed as pixel widths keyed by column id.
- Use `defaultColumnSizing` when the table can own the current widths, or `columnSizing` with `onColumnSizingChange` when saved views, URL state, user preferences, or a parent grid shell owns them.
- `width` remains the initial CSS grid track for columns without sizing state. Once a column has a sizing value, desktop headers and rows use a pixel track such as `240px`.
- Set `resizable: true` on a column to render a resize separator in the desktop header. Use `minWidth` and `maxWidth` to bound pointer and keyboard resizing.
- Resize separators are labelled vertical separators with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`. ArrowLeft/ArrowRight resize in small steps, Shift+ArrowLeft/Shift+ArrowRight resize in larger steps, and Home/End jump to the configured minimum or maximum.
- `renderToolbar` receives `columnSizing` and `setColumnSizing` so a host can render saved-view width presets, reset actions, or persistence controls without duplicating package state.

Column pinning:

- Column pinning is backed by TanStack Table state and expressed as `{ left?: string[]; right?: string[] }`, keyed by column id.
- Use `defaultColumnPinning` when the table can own saved-view defaults, or `columnPinning` with `onColumnPinningChange` when URL state, user preferences, or a parent grid shell owns the pinned layout.
- Pinned desktop data columns are reordered into left, center, and right regions using TanStack's visible leaf column model. Built-in mobile fields receive the same visible column order; custom `renderCard` content remains app-owned.
- Desktop pinning uses native sticky positioning inside the table's scroll frame, so body cells stay locked without scroll-linked transform updates.
- When left data columns are pinned, the selection column becomes sticky so pinned cells do not cover row checkboxes. When right data columns are pinned, the actions column becomes sticky for the same reason.
- Sticky offsets are calculated from column sizing state and pixel `width` values. For non-pixel flexible tracks, the table falls back to the package's default column width, so persisted pinned layouts should pair pinning with pixel sizing for the pinned columns.
- `renderToolbar` receives `columnPinning` and `setColumnPinning` so a host can render saved-view pin presets, clear actions, or persistence controls without duplicating package state.

State panels:

- `loading`, `error`, and the derived empty state choose which state panel is shown when there are no visible rows or the table cannot render row content.
- `loadingLabel`, `emptyLabel`, and `errorLabel` are simple string fallbacks.
- `loadingState`, `emptyState`, and `errorState` accept `{ title, description, action }` for richer panels.
- `stale` keeps the current rows visible and marks the table as refreshing instead of replacing the table with a loading panel.

Sorting behavior:

- Local sorting requires `sortable: true` and `sortAccessor` on the column.
- `sort`/`defaultSort` control the visible sort state. They do not make sorting server-owned by themselves.
- Header activation cycles the active column through ascending, descending, and no sort. In uncontrolled local mode, clearing sort restores the supplied row order.
- Passing `sort={undefined}` explicitly keeps sort controlled in an empty state. Header clicks call `onSortChange`, but the table does not update sort UI or row order until the host supplies the next `sort` value.
- Controlled and manual integrations receive `onSortChange(undefined)` when the active sort is cleared.
- Set `manualSorting` when the server, URL state, saved view, or parent application owns row order. In manual mode, clicking a sortable header updates sort state through `onSortChange`, but the table preserves the supplied `rows` order.
- Accessorless sortable columns are disabled in local mode and enabled in manual mode, so server-backed tables can expose sort fields that do not map cleanly to a local primitive accessor.

## `DataTableColumn<T>`

- `id: string`
- `header: ReactNode`
- `width?: string`
- `minWidth?: number`
- `maxWidth?: number`
- `hideable?: boolean`
- `reorderable?: boolean`
- `resizable?: boolean`
- `sortable?: boolean`
- `sortAccessor?: (row: T) => string | number | boolean | Date | null | undefined`
- `quickSearchable?: boolean`
- `quickSearchText?: (row: T, context) => string | number | boolean | Date | null | undefined`
- `filterControl?: ReactNode | ((context) => ReactNode)`
- `filterActive?: boolean | ((context) => boolean)`
- `filterFn?: (row, value, context) => boolean`
- `filterLabel?: string`
- `editable?: boolean | ((row, context) => boolean)`
- `getEditValue?: (row, context) => unknown`
- `renderEditCell?: (context) => ReactNode`
- `renderCell: (row: T, context) => ReactNode`
- `className?: string | ((row: T) => string | undefined)`
- `align?: "start" | "center" | "end"`
- `hideOnMobile?: boolean`

Column notes:

- `width` is a CSS grid track used before a column has pixel sizing state. Use strings such as `160px`, `minmax(220px, 2fr)`, or `1fr`.
- `minWidth` and `maxWidth` bound resizable columns and keyboard resizing.
- `align` affects both header and cell alignment.
- `className` is applied to desktop data cells for that column. Use it for narrow semantic styling hooks, not domain layout.
- `hideOnMobile` removes the column from the built-in mobile field layout. It does not affect custom `renderCard` content.

Filter render functions receive `{ value, filters, setFilter, clearFilter, close }`. Values can store date ranges, server facet objects, saved-view IDs, or multi-field query models instead of being limited to predefined option lists.

Filter trigger buttons expose `aria-expanded`, `aria-controls`, and active state. Open filter content is rendered as a labelled dialog, focuses the first reachable custom control, closes on Escape or outside interaction, and returns focus to the trigger.

When a column provides `filterFn`, the package adapts `filters` into TanStack column filters and applies client-side filtering. Omit `filterFn` for server-owned filters, or set `manualFiltering` to keep filter state visible while leaving the supplied `rows` untouched.

Inline edit render functions receive `{ row, rowId, column, value, setValue, commit, cancel, pending, error, errorId }`.

- Set `editable` and `renderEditCell` on columns that can be edited.
- Render whatever control matches the data shape: text inputs, selects, segmented controls, date pickers, or compact icon actions. The table provides the lifecycle and focus contract; the editor markup stays app-owned.
- Use `getEditValue` to derive the initial draft value from the row. This value is also used when a host app opens an editor with `editingCell` or `defaultEditingCell`.
- Use `defaultEditingCell` for uncontrolled initial edit state, or `editingCell` with `onEditingCellChange` when the host app controls which cell is being edited.
- Passing `editingCell={undefined}` explicitly keeps editing controlled in a closed state. Edit triggers call `onEditingCellChange`, but the editor does not open until the host supplies the requested cell.
- When a controlled host switches `editingCell` to another cell, the table resets the previous draft value, validation message, and pending state. Any stale async commit from the previous cell is ignored so it cannot close or dirty the newly active editor.
- While a controlled editor is open, the displayed edit value follows refreshed `rows` until the user changes the draft. After the draft is dirty, later server refreshes do not overwrite the user's in-progress edit.
- When the edited row or column leaves the visible model because of column visibility, filtering, grouping collapse, or editability changes, the table resets the draft, pending state, and validation message. Controlled hosts receive `onEditingCellChange(undefined)`, and stale async commits from the removed editor are ignored.
- Editors focus their first focusable control when opened, Escape cancels editing, and Ctrl+Enter or Cmd+Enter commits the current value. Custom editors may still provide explicit save/cancel controls or field-specific shortcuts.
- `commit()` commits the current edit value. `commit(value)` commits the provided value, including explicit `undefined`.
- `onCellEditCommit` receives the committed value. The table does not mutate rows; the host app updates its data source after validation or persistence.
- Commit handlers may return a promise. While it is pending, the editor remains open, `pending` is `true`, duplicate commits are ignored, and Escape cancel is blocked so an in-flight save is not hidden accidentally.
- Successful commits close by default. Return `{ close: false }` to keep editing open after a successful save, or `{ close: false, error: "Message" }` to keep it open with an inline `role="alert"` validation message. Thrown or rejected errors also keep the editor open and render the error message.
- Use `errorId` with `aria-describedby` and `aria-invalid` inside custom controls when `error` is present. The table assigns the same id to the package-rendered alert so field-level validation is announced from the focused editor control.
- The built-in mobile field layout honors editable columns with the same editing state and keyboard contract. When `renderCard` is supplied, mobile card markup is fully app-owned and should provide its own edit controls where needed.

## `DataTableGroup<T>`

- `id: string`
- `label: ReactNode`
- `rows?: T[]`
- `rowIds?: string[]`
- `totalCount?: number`
- `loadedCount?: number`
- `countLabel?: ReactNode`
- `state?: "loaded" | "loading" | "error" | "empty" | "partial"`
- `summary?: ReactNode | ((summary) => ReactNode)`
- `progressLabel?: ReactNode`
- `progressValue?: number`
- `collapsible?: boolean`
- `defaultCollapsed?: boolean`
- `depth?: number`
- `actions?: ReactNode`

Grouped tables use the same visible item model on desktop and mobile. Mobile cards keep group headers, collapse state, group metadata, and row selection instead of flattening grouped data.

When `collapsible` is `false`, the group cannot be collapsed by `defaultCollapsed`, controlled `collapsedGroupIds`, built-in toggles, or a custom group header calling `context.toggle`.

Group notes:

- `rowIds` references rows from the top-level `rows` prop. Use it when the server returns groups and a shared result row array.
- `rows` embeds group-specific rows. Use it when the group payload already owns its row array.
- `totalCount` describes the full server-side group size. `loadedCount` describes rows available to the table. If omitted, `loadedCount` falls back to visible loaded rows.
- `countLabel` overrides the built-in count text.
- `summary` renders additional group metadata. If it is a function, it receives `{ group, visibleRows, totalCount, loadedCount }`.
- `progressValue` is a percentage from `0` to `100`; `progressLabel` labels the progress.
- `state` changes visual treatment for loading, error, empty, partial, and loaded groups.
- `depth` indents nested or hierarchical group rows.
- `actions` renders package-owned group action content in the built-in group header.

`DataTableGroupState` is the exported union for group state values: `"loaded"`, `"loading"`, `"error"`, `"empty"`, and `"partial"`.

`DataTableGroupSummary<T>` includes `group`, `visibleRows`, `totalCount`, and `loadedCount`. It is used by group summaries, `renderGroupHeader`, and `renderMobileGroupHeader`.

`DataTableGroupHeaderContext<T>` includes `group`, `summary`, `collapsed`, `collapsible`, `icons`, and `toggle`. Use it when custom group headers need to preserve the built-in collapse behavior.

## `DataTableStateLabel`

- `title?: ReactNode`
- `description?: ReactNode`
- `action?: ReactNode`

Use state labels for loading, empty, and error panels when a screen needs more than the simple label props.

## `DataTableIcons`

- `Sort`
- `Filter`
- `Expand`
- `Edit`
- `Loading`
- `More`

Pass `icons?: Partial<DataTableIcons>` to override only the icons needed by an application. Icon components receive `className`, `size`, optional `title`, and icon-specific state props such as sort direction, filter active state, or expanded state.

`DataTableIconProps` is the shared prop contract for icon components. The package also exports `defaultIcons` and the default icon components `SortIcon`, `FilterIcon`, `ExpandIcon`, `EditIcon`, `CheckIcon`, `CloseIcon`, `LoadingIcon`, and `MoreIcon`.

## Scalar Type Aliases

- `DataTableRowId` is the string row identifier returned by `getRowId`.
- `DataTableSortDirection` is `"ascending"` or `"descending"`.
- `DataTableDensity` is `"compact"` or `"comfortable"`.
- `DataTableMotionPreference` is `"system"`, `"always"`, or `"reduced"`.
