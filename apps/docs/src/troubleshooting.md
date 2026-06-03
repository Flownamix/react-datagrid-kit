# Troubleshooting

## The table has no styling

Import the stylesheet once in the app:

```tsx
import "@flownamix/react-data-grid-kit/styles.css";
```

## Filters are too simple

Pass a real React control to `filterControl`. The table does not own filtering state because enterprise products often need server facets, date ranges, permissions, and saved views.

## Dense rows clip custom content

Increase `rowHeight` for compact layouts with rich templates. `density="compact"` changes spacing, but it does not assume every custom cell has the same content structure.

## Group counts do not match visible rows

Use `loadedCount` and `totalCount` when data is partially loaded. Visible rows represent the rows currently available to the table, not necessarily the full server-side group.

## Header sorting updates state but rows do not move

Check whether `manualSorting` is set. In manual mode the table emits `onSortChange`, but the host application must fetch or sort rows and pass the next `rows` array back in. For local sorting, make sure the column has both `sortable: true` and `sortAccessor`.

## Quick search does not filter rows

If `manualFiltering` is set, quick search is server query state and does not filter locally. Fetch matching rows in the host app. For local quick search with rich cells, add `quickSearchText` to columns whose `renderCell` returns complex React templates.

## A column does not show in the built-in column menu

The column may have `hideable: false`, or `toolbar.columnVisibility.columnIds` may be limiting the menu. Hidden columns are also omitted from resize handles, keyboard navigation, desktop cells, and built-in mobile fields.

## Pinned columns overlap or use odd offsets

Pair pinned columns with pixel sizing through `defaultColumnSizing` or controlled `columnSizing`. Flexible CSS tracks can render, but saved enterprise views should store pixel widths so sticky offsets are predictable.

## Resize handles are missing

Only columns with `resizable: true` render resize separators. Hidden columns do not render handles. Resize handles are desktop-only and update `columnSizing` state.

## Inline edits disappear while saving

The edited row or column probably left the visible model because of filtering, column visibility, grouping collapse, or refreshed editability. The table intentionally clears the editor and ignores stale async commits in that case.

## Controlled state callbacks fire but UI does not change

For controlled props, callbacks request a state change but the table waits for the host to pass the next controlled value. Update the matching controlled prop in response to `onXChange`.

## Mobile cards ignore column visibility

Built-in mobile fields honor column visibility. Custom `renderCard` content is app-owned, so it must read the same saved-view state in the host if cards should hide or reorder fields.

## Storybook looks right but docs are unclear

Treat Storybook as visual documentation and VitePress as canonical integration documentation. Add long-form guidance to VitePress first, then keep Storybook descriptions short and example-driven.
