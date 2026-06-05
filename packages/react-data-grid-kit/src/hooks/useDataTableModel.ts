import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { applyColumnFiltersUpdate, filtersToColumnFilters, rowMatchesQuickSearch } from "../model/filtering";
import { defaultCollapsedIds, groupRows, pruneCollapsedIds, toggleCollapsedGroup } from "../model/grouping";
import { applyRowSelectionUpdate, selectedIdsToRowSelection } from "../model/rowSelection";
import { compareSortValues } from "../model/sorting";
import type {
  DataTableColumn,
  DataTableColumnOrderState,
  DataTableColumnPinningState,
  DataTableColumnSizingState,
  DataTableColumnVisibilityState,
  DataTableFilterState,
  DataTableGroup,
  DataTableRowId,
  DataTableServerVirtualization,
  DataTableSort,
  DataTableVisibleItem
} from "../types";
import { useControllableArrayState, useControllableState } from "../utils/controllable";

export interface UseDataTableModelOptions<T> {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowId: (row: T) => DataTableRowId;
  groups?: Array<DataTableGroup<T>>;
  selectedIds?: Array<DataTableRowId>;
  onSelectedIdsChange?: (selectedIds: Array<DataTableRowId>) => void;
  sort?: DataTableSort;
  sortControlled?: boolean;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort | undefined) => void;
  manualSorting: boolean;
  filters?: DataTableFilterState;
  defaultFilters?: DataTableFilterState;
  onFiltersChange?: (filters: DataTableFilterState) => void;
  manualFiltering: boolean;
  serverVirtualization?: DataTableServerVirtualization<T>;
  totalRowCount?: number;
  rowIndexOffset: number;
  quickSearch?: string;
  quickSearchControlled?: boolean;
  defaultQuickSearch?: string;
  onQuickSearchChange?: (quickSearch: string) => void;
  columnVisibility?: DataTableColumnVisibilityState;
  defaultColumnVisibility?: DataTableColumnVisibilityState;
  onColumnVisibilityChange?: (visibility: DataTableColumnVisibilityState) => void;
  columnOrder?: DataTableColumnOrderState;
  defaultColumnOrder?: DataTableColumnOrderState;
  onColumnOrderChange?: (order: DataTableColumnOrderState) => void;
  columnSizing?: DataTableColumnSizingState;
  defaultColumnSizing?: DataTableColumnSizingState;
  onColumnSizingChange?: (sizing: DataTableColumnSizingState) => void;
  columnPinning?: DataTableColumnPinningState;
  defaultColumnPinning?: DataTableColumnPinningState;
  onColumnPinningChange?: (pinning: DataTableColumnPinningState) => void;
  collapsedGroupIds?: Array<string>;
  defaultCollapsedGroupIds?: Array<string>;
  onCollapsedGroupIdsChange?: (groupIds: Array<string>) => void;
  isRowSelectable?: (row: T) => boolean;
  height: number;
  rowHeight: number;
  groupHeight: number;
}

export interface DataTableVirtualItem {
  key: React.Key;
  index: number;
  start: number;
  size?: number;
}

export function useDataTableModel<T>({
  rows,
  columns,
  getRowId,
  groups,
  selectedIds,
  onSelectedIdsChange,
  sort,
  sortControlled,
  defaultSort,
  onSortChange,
  manualSorting,
  filters,
  defaultFilters,
  onFiltersChange,
  manualFiltering,
  serverVirtualization,
  totalRowCount,
  rowIndexOffset,
  quickSearch,
  quickSearchControlled,
  defaultQuickSearch,
  onQuickSearchChange,
  columnVisibility,
  defaultColumnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  defaultColumnOrder,
  onColumnOrderChange,
  columnSizing,
  defaultColumnSizing,
  onColumnSizingChange,
  columnPinning,
  defaultColumnPinning,
  onColumnPinningChange,
  collapsedGroupIds,
  defaultCollapsedGroupIds,
  onCollapsedGroupIdsChange,
  isRowSelectable,
  height,
  rowHeight,
  groupHeight
}: UseDataTableModelOptions<T>) {
  const [currentSort, setSort] = useControllableState<DataTableSort | undefined>({
    value: sort,
    defaultValue: defaultSort,
    controlled: sortControlled,
    onChange: onSortChange
  });
  const [internalSelectedIds, setSelectedIds] = useControllableArrayState<DataTableRowId>({
    value: selectedIds,
    defaultValue: [],
    onChange: onSelectedIdsChange
  });
  const rowSelection = React.useMemo<RowSelectionState>(
    () => selectedIdsToRowSelection(internalSelectedIds),
    [internalSelectedIds]
  );
  const handleTanStackRowSelectionChange = React.useCallback(
    (updater: RowSelectionState | ((current: RowSelectionState) => RowSelectionState)) => {
      setSelectedIds((current) => applyRowSelectionUpdate(current, updater));
    },
    [setSelectedIds]
  );

  const [currentFilters, setFilters] = useControllableState<DataTableFilterState>({
    value: filters,
    defaultValue: defaultFilters ?? {},
    onChange: onFiltersChange
  });
  const [currentQuickSearch, setQuickSearch] = useControllableState<string>({
    value: quickSearch ?? "",
    defaultValue: defaultQuickSearch ?? "",
    controlled: quickSearchControlled,
    onChange: onQuickSearchChange
  });
  const filterableColumnIds = React.useMemo(
    () => columns.filter((column) => column.filterFn).map((column) => column.id),
    [columns]
  );
  const columnFilters = React.useMemo<ColumnFiltersState>(
    () => filtersToColumnFilters(currentFilters, filterableColumnIds),
    [currentFilters, filterableColumnIds]
  );
  const handleTanStackColumnFiltersChange = React.useCallback(
    (updater: ColumnFiltersState | ((current: ColumnFiltersState) => ColumnFiltersState)) => {
      setFilters((current) => applyColumnFiltersUpdate(current, filterableColumnIds, updater));
    },
    [filterableColumnIds, setFilters]
  );
  const handleTanStackGlobalFilterChange = React.useCallback(
    (updater: Updater<string>) => {
      setQuickSearch((current) => typeof updater === "function" ? updater(current) : updater);
    },
    [setQuickSearch]
  );
  const [currentColumnVisibility, setColumnVisibility] = useControllableState<DataTableColumnVisibilityState>({
    value: columnVisibility,
    defaultValue: defaultColumnVisibility ?? {},
    onChange: onColumnVisibilityChange
  });
  const handleTanStackColumnVisibilityChange = React.useCallback(
    (updater: VisibilityState | ((current: VisibilityState) => VisibilityState)) => {
      setColumnVisibility((current) => normalizeColumnVisibilityUpdate(current, updater));
    },
    [setColumnVisibility]
  );
  const [currentColumnOrder, setColumnOrder] = useControllableState<DataTableColumnOrderState>({
    value: columnOrder,
    defaultValue: defaultColumnOrder ?? [],
    onChange: onColumnOrderChange
  });
  const handleColumnOrderChange = React.useCallback(
    (updater: ColumnOrderState | ((current: ColumnOrderState) => ColumnOrderState)) => {
      setColumnOrder((current) => normalizeColumnOrderUpdate(current, updater));
    },
    [setColumnOrder]
  );
  const [currentColumnSizing, setColumnSizing] = useControllableState<DataTableColumnSizingState>({
    value: columnSizing,
    defaultValue: defaultColumnSizing ?? {},
    onChange: onColumnSizingChange
  });
  const handleTanStackColumnSizingChange = React.useCallback(
    (updater: ColumnSizingState | ((current: ColumnSizingState) => ColumnSizingState)) => {
      setColumnSizing((current) => normalizeColumnSizingUpdate(current, updater));
    },
    [setColumnSizing]
  );
  const [currentColumnPinning, setColumnPinning] = useControllableState<DataTableColumnPinningState>({
    value: columnPinning,
    defaultValue: defaultColumnPinning ?? {},
    onChange: onColumnPinningChange
  });
  const handleColumnPinningChange = React.useCallback(
    (updater: DataTableColumnPinningState | ((current: DataTableColumnPinningState) => DataTableColumnPinningState)) => {
      setColumnPinning((current) => normalizeColumnPinningUpdate(current, updater));
    },
    [setColumnPinning]
  );
  const handleTanStackColumnPinningChange = React.useCallback(
    (updater: ColumnPinningState | ((current: ColumnPinningState) => ColumnPinningState)) => {
      handleColumnPinningChange(updater);
    },
    [handleColumnPinningChange]
  );

  const tanStackColumns = React.useMemo<Array<ColumnDef<T>>>(() => columns.map((column) => ({
    id: column.id,
    accessorFn: column.sortAccessor ?? ((row) => getRowId(row)),
    enableSorting: Boolean(column.sortable && (manualSorting || column.sortAccessor)),
    enableColumnFilter: Boolean(column.filterFn),
    enableResizing: Boolean(column.resizable),
    size: columnSizingValue(column.width),
    minSize: column.minWidth,
    maxSize: column.maxWidth,
    filterFn: column.filterFn
      ? (row, _columnId, value) => column.filterFn?.(row.original, value, {
        row: row.original,
        rowId: row.id,
        column,
        value,
        filters: currentFilters
      }) ?? true
      : undefined,
    sortingFn: (leftRow, rightRow, columnId) => compareSortValues(leftRow.getValue(columnId), rightRow.getValue(columnId))
  })), [columns, currentFilters, getRowId, manualSorting]);
  const sortingState = React.useMemo<SortingState>(
    () => currentSort ? [{ id: currentSort.columnId, desc: currentSort.direction === "descending" }] : [],
    [currentSort]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table owns the row model and exposes non-compiler-memoizable helpers.
  const table = useReactTable({
    data: rows,
    columns: tanStackColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: (row) => isRowSelectable?.(row.original) ?? true,
    manualFiltering,
    manualSorting,
    onColumnFiltersChange: handleTanStackColumnFiltersChange,
    onGlobalFilterChange: handleTanStackGlobalFilterChange,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnPinningChange: handleTanStackColumnPinningChange,
    onColumnSizingChange: handleTanStackColumnSizingChange,
    onColumnVisibilityChange: handleTanStackColumnVisibilityChange,
    onRowSelectionChange: handleTanStackRowSelectionChange,
    state: {
      columnFilters,
      columnOrder: currentColumnOrder,
      columnPinning: currentColumnPinning,
      columnSizing: currentColumnSizing,
      columnVisibility: currentColumnVisibility,
      globalFilter: currentQuickSearch,
      sorting: sortingState,
      rowSelection
    },
    globalFilterFn: (row, _columnId, value) => rowMatchesQuickSearch({
      columns,
      query: String(value ?? ""),
      row: row.original,
      rowId: row.id
    })
  });
  const modeledRows = table.getRowModel().rows.map((row) => row.original);
  const visibleColumns = React.useMemo(() => {
    const visibility = currentColumnVisibility;
    const columnById = new Map(columns.map((column) => [column.id, column]));
    const hasPinnedColumns = Boolean(currentColumnPinning.left?.length || currentColumnPinning.right?.length);
    const tanStackVisibleColumns = hasPinnedColumns
      ? [
        ...table.getLeftVisibleLeafColumns(),
        ...table.getCenterVisibleLeafColumns(),
        ...table.getRightVisibleLeafColumns()
      ]
      : table.getVisibleLeafColumns();

    return tanStackVisibleColumns
      .map((column) => columnById.get(column.id))
      .filter((column): column is DataTableColumn<T> => Boolean(column && visibility[column.id] !== false));
  // TanStack's table instance is stable while these helpers read column order from table state.
  // Keep order in the deps so saved-view toolbar updates rebuild the package visible column list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, currentColumnOrder, currentColumnPinning, currentColumnVisibility, table]);

  const [collapsedIds, setCollapsedIds] = useControllableArrayState<string>({
    value: collapsedGroupIds,
    defaultValue: defaultCollapsedGroupIds ?? defaultCollapsedIds(groups),
    onChange: onCollapsedGroupIdsChange
  });
  const normalizedCollapsedIds = React.useMemo(
    () => pruneCollapsedIds(collapsedIds, groups),
    [collapsedIds, groups]
  );
  const serverVirtualizationEnabled = Boolean(serverVirtualization);
  const serverHasMoreRows = serverVirtualization?.hasMoreRows;
  const serverLoadingMore = serverVirtualization?.loadingMore;
  const serverLoadMoreError = serverVirtualization?.loadMoreError;
  const serverShowEndSentinel = serverVirtualization?.showEndSentinel;
  const visibleItems = React.useMemo(
    () => {
      const normalizedOffset = Math.max(0, rowIndexOffset);
      const hasMoreRows = serverVirtualizationEnabled
        ? serverHasMoreRows
          ?? (typeof totalRowCount === "number" ? totalRowCount > normalizedOffset + modeledRows.length : true)
        : false;
      const showEndSentinel = serverShowEndSentinel
        ?? (typeof serverHasMoreRows === "boolean" || typeof totalRowCount === "number");

      return groupRows({
        rows: modeledRows,
        groups,
        collapsedGroupIds: normalizedCollapsedIds,
        getRowId,
        serverVirtualization: serverVirtualizationEnabled
          ? {
            enabled: true,
            showEndSentinel,
            rows: groups?.length
              ? undefined
              : {
                hasMoreRows,
                loadingMore: serverLoadingMore,
                loadMoreError: serverLoadMoreError
              }
          }
          : undefined
      });
    },
    [
      getRowId,
      groups,
      modeledRows,
      normalizedCollapsedIds,
      rowIndexOffset,
      serverHasMoreRows,
      serverLoadMoreError,
      serverLoadingMore,
      serverShowEndSentinel,
      serverVirtualizationEnabled,
      totalRowCount
    ]
  );
  const selectableVisibleRowIds = React.useMemo(
    () => visibleItems
      .filter((item): item is Extract<DataTableVisibleItem<T>, { kind: "row" }> => item.kind === "row")
      .filter((item) => table.getRow(item.id).getCanSelect())
      .map((item) => item.id),
    [table, visibleItems]
  );
  const selectedSet = React.useMemo(
    () => new Set(Object.keys(rowSelection).filter((rowId) => rowSelection[rowId])),
    [rowSelection]
  );
  const allVisibleSelected = selectableVisibleRowIds.length > 0 && selectableVisibleRowIds.every((rowId) => selectedSet.has(rowId));
  const someVisibleSelected = !allVisibleSelected && selectableVisibleRowIds.some((rowId) => selectedSet.has(rowId));

  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => visibleItems[index]?.kind === "group" ? groupHeight : rowHeight,
    initialRect: { height, width: 1024 },
    overscan: Math.max(0, serverVirtualization?.overscan ?? 8)
  });
  const measuredVirtualItems = virtualizer.getVirtualItems();
  const renderedVirtualItems: Array<DataTableVirtualItem> = measuredVirtualItems.length > 0
    ? measuredVirtualItems
    : visibleItems.map((item, index) => ({
      key: item.id,
      index,
      start: offsetForIndex(visibleItems, index, rowHeight, groupHeight),
      size: visibleItems[index]?.kind === "group" ? groupHeight : rowHeight
    }));
  const contentMotionKey = React.useMemo(() => {
    const first = visibleItems[0]?.id ?? "empty";
    const last = visibleItems.at(-1)?.id ?? "empty";
    return `${visibleItems.length}:${first}:${last}:${currentSort?.columnId ?? "none"}:${currentSort?.direction ?? "none"}:${normalizedCollapsedIds.join(",")}:${filterMotionKey(currentFilters)}:${currentQuickSearch}`;
  }, [currentFilters, currentQuickSearch, currentSort, normalizedCollapsedIds, visibleItems]);

  const handleSortChange = React.useCallback(
    (columnSort: DataTableSort | undefined) => {
      setSort(columnSort);
    },
    [setSort]
  );
  const handleGroupToggle = React.useCallback(
    (groupId: string) => {
      const group = groups?.find((candidate) => candidate.id === groupId);
      if (group?.collapsible === false) {
        return;
      }
      setCollapsedIds((current) => toggleCollapsedGroup(current, groupId));
    },
    [groups, setCollapsedIds]
  );
  const handleFilterChange = React.useCallback(
    (columnId: string, value: unknown) => {
      setFilters((current) => {
        const next = { ...current };
        if (value === undefined) {
          delete next[columnId];
        } else {
          next[columnId] = value;
        }
        return next;
      });
    },
    [setFilters]
  );
  const handleFilterClear = React.useCallback(
    (columnId: string) => {
      setFilters((current) => {
        const next = { ...current };
        delete next[columnId];
        return next;
      });
    },
    [setFilters]
  );
  const handleRowSelection = React.useCallback(
    (rowId: DataTableRowId, checked: boolean) => {
      table.getRow(rowId).toggleSelected(checked);
    },
    [table]
  );
  const getRowCanSelect = React.useCallback(
    (rowId: DataTableRowId) => table.getRow(rowId).getCanSelect(),
    [table]
  );
  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      table.setRowSelection((current) => {
        const next = { ...current };
        selectableVisibleRowIds.forEach((rowId) => {
          if (checked) {
            next[rowId] = true;
          } else {
            delete next[rowId];
          }
        });
        return next;
      });
    },
    [selectableVisibleRowIds, table]
  );

  return {
    allVisibleSelected,
    contentMotionKey,
    currentColumnPinning,
    currentColumnOrder,
    currentColumnSizing,
    currentColumnVisibility,
    currentFilters,
    currentQuickSearch,
    currentSort,
    handleFilterChange,
    handleFilterClear,
    handleQuickSearchChange: setQuickSearch,
    handleColumnPinningChange,
    handleColumnOrderChange,
    handleColumnSizingChange: setColumnSizing,
    handleColumnVisibilityChange: setColumnVisibility,
    handleGroupToggle,
    handleRowSelection,
    handleSelectAll,
    handleSortChange,
    getRowCanSelect,
    normalizedCollapsedIds,
    parentRef,
    renderedVirtualItems,
    selectedSet,
    someVisibleSelected,
    totalSize: virtualizer.getTotalSize(),
    visibleColumns,
    visibleItems
  };
}

function offsetForIndex<T>(
  items: Array<DataTableVisibleItem<T>>,
  index: number,
  rowHeight: number,
  groupHeight: number
): number {
  let offset = 0;
  for (let cursor = 0; cursor < index; cursor += 1) {
    offset += items[cursor]?.kind === "group" ? groupHeight : rowHeight;
  }
  return offset;
}

function filterMotionKey(filters: DataTableFilterState): string {
  return Object.entries(filters)
    .map(([key, value]) => `${key}:${motionValueKey(value)}`)
    .sort()
    .join("|");
}

function motionValueKey(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `array:${value.length}`;
  }
  if (value instanceof Date) {
    return `date:${value.toISOString()}`;
  }
  if (typeof value === "object") {
    return `object:${Object.keys(value).sort().join(",")}`;
  }
  return typeof value;
}

function normalizeColumnVisibilityUpdate(
  current: DataTableColumnVisibilityState,
  updater: VisibilityState | ((current: VisibilityState) => VisibilityState)
): DataTableColumnVisibilityState {
  const next = typeof updater === "function" ? updater(current) : updater;
  return { ...next };
}

function normalizeColumnOrderUpdate(
  current: DataTableColumnOrderState,
  updater: ColumnOrderState | ((current: ColumnOrderState) => ColumnOrderState)
): DataTableColumnOrderState {
  const next = typeof updater === "function" ? updater(current) : updater;
  return uniqueColumnIds(next);
}

function normalizeColumnSizingUpdate(
  current: DataTableColumnSizingState,
  updater: ColumnSizingState | ((current: ColumnSizingState) => ColumnSizingState)
): DataTableColumnSizingState {
  const next = typeof updater === "function" ? updater(current) : updater;
  return { ...next };
}

function normalizeColumnPinningUpdate(
  current: DataTableColumnPinningState,
  updater: DataTableColumnPinningState | ((current: DataTableColumnPinningState) => DataTableColumnPinningState)
): DataTableColumnPinningState {
  const next = typeof updater === "function" ? updater(current) : updater;
  const left = uniqueColumnIds(next.left);
  const leftColumnIds = new Set(left);
  const right = uniqueColumnIds(next.right).filter((columnId) => !leftColumnIds.has(columnId));

  return {
    left,
    right
  };
}

function columnSizingValue(width: string | undefined): number | undefined {
  const match = width?.trim().match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function uniqueColumnIds(ids: string[] | undefined): string[] {
  return Array.from(new Set(ids ?? []));
}
