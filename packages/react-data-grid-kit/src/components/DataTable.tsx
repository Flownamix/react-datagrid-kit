import * as React from "react";
import { defaultIcons } from "../icons";
import { moveColumnInOrder, type ColumnDropPlacement } from "../model/columnOrdering";
import { isColumnEditable } from "../model/editing";
import { gridTemplate, pinnedLayout } from "../model/layout";
import { nextSort } from "../model/sorting";
import type { DataTableIcons, DataTableProps, DataTableRenderContext } from "../types";
import { cx } from "../utils/cx";
import { useDataTableEditing } from "../hooks/useDataTableEditing";
import { useDataTableKeyboardNavigation } from "../hooks/useDataTableKeyboardNavigation";
import { useDataTableModel, type DataTableVirtualItem } from "../hooks/useDataTableModel";
import { DataTableDesktopBody } from "./DataTableDesktopBody";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableMobileList } from "./DataTableMobileList";
import { DataTableToolbar } from "./DataTableToolbar";
import type { DataTableVirtualSurface, DataTableVisibleItem } from "../types";

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_GROUP_HEIGHT = 48;

export function DataTable<T>(props: DataTableProps<T>): React.ReactElement {
  const {
    rows,
    columns,
    getRowId,
    groups,
    selectedIds,
    onSelectedIdsChange,
    sort,
    defaultSort,
    onSortChange,
    manualSorting = false,
    filters,
    defaultFilters,
    onFiltersChange,
    manualFiltering = false,
    quickSearch,
    defaultQuickSearch,
    onQuickSearchChange,
    columnVisibility,
    defaultColumnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    defaultColumnOrder,
    onColumnOrderChange,
    enableColumnReordering = false,
    columnSizing,
    defaultColumnSizing,
    onColumnSizingChange,
    columnPinning,
    defaultColumnPinning,
    onColumnPinningChange,
    editingCell,
    defaultEditingCell,
    onEditingCellChange,
    onCellEditCommit,
    loading,
    error,
    stale,
    serverVirtualization,
    totalRowCount,
    rowIndexOffset = 0,
    loadingLabel = "Loading rows",
    emptyLabel = "No rows to show",
    errorLabel = "Rows could not be loaded",
    loadingState,
    emptyState,
    errorState,
    height = 560,
    mobileHeight = 520,
    rowHeight = DEFAULT_ROW_HEIGHT,
    groupHeight = DEFAULT_GROUP_HEIGHT,
    minWidth = "720px",
    density = "comfortable",
    motion = "system",
    isRowSelectable,
    rowAriaLabel,
    ariaLabel,
    ariaLabelledBy,
    onRowClick,
    onRowContextMenu,
    renderRowActions,
    renderCard,
    toolbar,
    renderToolbar,
    renderFooter,
    renderGroupHeader,
    renderMobileGroupHeader,
    collapsedGroupIds,
    defaultCollapsedGroupIds,
    onCollapsedGroupIdsChange,
    icons,
    className,
    tableClassName
  } = props;
  const sortControlled = hasOwnProp(props, "sort");
  const quickSearchControlled = hasOwnProp(props, "quickSearch");
  const editingCellControlled = hasOwnProp(props, "editingCell");
  const mergedIcons = React.useMemo<DataTableIcons>(() => ({ ...defaultIcons, ...icons }), [icons]);
  const serverOverscan = Math.max(0, serverVirtualization?.overscan ?? 8);
  const serverLoadThreshold = Math.max(0, serverVirtualization?.loadThreshold ?? 8);
  const selectable = Boolean(onSelectedIdsChange || selectedIds);
  const selectionMutable = Boolean(onSelectedIdsChange);
  const hasActions = Boolean(renderRowActions);
  const editing = useDataTableEditing({
    editingCell,
    editingCellControlled,
    defaultEditingCell,
    onEditingCellChange,
    onCellEditCommit
  });
  const {
    allVisibleSelected,
    contentMotionKey,
    currentColumnSizing,
    currentColumnOrder,
    currentColumnPinning,
    currentColumnVisibility,
    currentFilters,
    currentQuickSearch,
    currentSort,
    handleColumnVisibilityChange,
    handleColumnOrderChange,
    handleColumnPinningChange,
    getRowCanSelect,
    handleFilterChange,
    handleFilterClear,
    handleQuickSearchChange,
    handleColumnSizingChange,
    handleGroupToggle,
    handleRowSelection,
    handleSelectAll,
    handleSortChange,
    normalizedCollapsedIds,
    parentRef,
    renderedVirtualItems,
    selectedSet,
    someVisibleSelected,
    totalSize,
    visibleColumns,
    visibleItems
  } = useDataTableModel({
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
  });
  const totalColumnCount = visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);
  const [mobileVirtualItems, setMobileVirtualItems] = React.useState<Array<DataTableVirtualItem>>([]);
  const activeSurface = useActiveDataTableSurface();
  const template = React.useMemo(
    () => gridTemplate({ columns: visibleColumns, selectable, hasActions, columnSizing: currentColumnSizing }),
    [currentColumnSizing, hasActions, selectable, visibleColumns]
  );
  const pinned = React.useMemo(
    () => pinnedLayout({
      columns: visibleColumns,
      selectable,
      hasActions,
      columnSizing: currentColumnSizing,
      columnPinning: currentColumnPinning
    }),
    [currentColumnPinning, currentColumnSizing, hasActions, selectable, visibleColumns]
  );
  const setDesktopFrame = React.useCallback((node: HTMLDivElement | null) => {
    parentRef.current = node;
  }, [parentRef]);
  const handleColumnReorder = React.useCallback((sourceId: string, targetId: string, placement: ColumnDropPlacement) => {
    handleColumnOrderChange((current) => moveColumnInOrder({
      currentOrder: current,
      allColumnIds: columns.map((column) => column.id),
      sourceId,
      targetId,
      placement
    }));
  }, [columns, handleColumnOrderChange]);
  const pageRowStep = Math.max(1, Math.floor(height / Math.max(rowHeight, 1)) - 1);
  const keyboardNavigation = useDataTableKeyboardNavigation({
    columns: visibleColumns,
    visibleItems,
    editing,
    pageRowStep
  });

  const showEmpty = !loading && !error && visibleItems.length === 0;
  const selectedIdsForContext = React.useMemo(() => Array.from(selectedSet), [selectedSet]);
  const visibleRowsForContext = React.useMemo(
    () => visibleItems.flatMap((item) => item.kind === "row" ? [item.row] : []),
    [visibleItems]
  );
  React.useEffect(() => {
    const editedCell = editing.editingCell;
    if (!editedCell) {
      return;
    }

    const editedColumn = visibleColumns.find((column) => column.id === editedCell.columnId);
    const editedItem = visibleItems.find((item) => item.kind === "row" && item.id === editedCell.rowId);
    if (!editedColumn || !editedItem || editedItem.kind !== "row") {
      editing.resetEditing();
      return;
    }

    if (!isColumnEditable(editedColumn, editedItem.row, editedCell.rowId)) {
      editing.resetEditing();
    }
  }, [editing, visibleColumns, visibleItems]);
  const loadedRowCount = visibleRowsForContext.length;
  const resolvedTotalRowCount = Math.max(totalRowCount ?? loadedRowCount, loadedRowCount);
  const normalizedRowIndexOffset = Math.max(0, rowIndexOffset);
  const ariaRowCount = groups ? visibleItems.length + 1 : resolvedTotalRowCount + 1;
  const activeVirtualItems = activeSurface === "mobile" ? mobileVirtualItems : renderedVirtualItems;
  useServerVirtualizationCallbacks({
    activeSurface,
    groups,
    loadedRowCount,
    loadThreshold: serverLoadThreshold,
    normalizedRowIndexOffset,
    resolvedTotalRowCount,
    serverVirtualization,
    visibleItems,
    visibleRows: visibleRowsForContext,
    virtualItems: activeVirtualItems
  });
  const renderContext = React.useMemo<DataTableRenderContext<T>>(() => ({
    rows,
    columns,
    visibleColumns,
    quickSearch: currentQuickSearch,
    setQuickSearch: handleQuickSearchChange,
    columnVisibility: currentColumnVisibility,
    setColumnVisibility: handleColumnVisibilityChange,
    columnOrder: currentColumnOrder,
    setColumnOrder: handleColumnOrderChange,
    columnSizing: currentColumnSizing,
    setColumnSizing: handleColumnSizingChange,
    columnPinning: currentColumnPinning,
    setColumnPinning: handleColumnPinningChange,
    visibleRows: visibleRowsForContext,
    visibleItems,
    visibleRowCount: loadedRowCount,
    totalRowCount: resolvedTotalRowCount,
    rowIndexOffset: normalizedRowIndexOffset,
    selectedIds: selectedIdsForContext,
    selectedCount: selectedIdsForContext.length,
    allVisibleSelected,
    someVisibleSelected,
    sort: currentSort,
    filters: currentFilters,
    loading: Boolean(loading),
    error: Boolean(error),
    stale: Boolean(stale)
  }), [
    allVisibleSelected,
    columns,
    currentColumnOrder,
    currentColumnPinning,
    currentColumnSizing,
    currentColumnVisibility,
    currentFilters,
    currentQuickSearch,
    currentSort,
    error,
    handleColumnVisibilityChange,
    handleColumnOrderChange,
    handleColumnPinningChange,
    handleColumnSizingChange,
    handleQuickSearchChange,
    loadedRowCount,
    loading,
    normalizedRowIndexOffset,
    rows,
    selectedIdsForContext,
    someVisibleSelected,
    stale,
    resolvedTotalRowCount,
    visibleColumns,
    visibleItems,
    visibleRowsForContext
  ]);
  const dataAttributes = {
    "data-density": density,
    "data-motion": motion,
    "data-stale": stale ? "true" : undefined
  };

  return (
    <section
      className={cx("rdtg-root", className)}
      style={{
        "--rdtg-height": `${height}px`,
        "--rdtg-mobile-height": `${mobileHeight}px`,
        "--rdtg-row-height": `${rowHeight}px`,
        "--rdtg-group-height": `${groupHeight}px`
      } as React.CSSProperties}
      {...dataAttributes}
    >
      {toolbar ? (
        <DataTableToolbar config={toolbar === true ? true : toolbar} context={renderContext} />
      ) : null}
      {renderToolbar ? (
        <div className="rdtg-toolbar">
          {renderToolbar(renderContext)}
        </div>
      ) : null}
      <div ref={setDesktopFrame} className="rdtg-desktopFrame">
        <div
          className={cx("rdtg-table", tableClassName)}
          role="grid"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-rowcount={ariaRowCount}
          aria-colcount={totalColumnCount}
          onFocus={(event) => {
            if (event.target === event.currentTarget) {
              keyboardNavigation.focusInitialCell(event.currentTarget);
            }
          }}
          onKeyDownCapture={keyboardNavigation.onGridKeyDown}
          style={{
            minWidth
          } as React.CSSProperties}
        >
          <DataTableHeader
            columns={visibleColumns}
            icons={mergedIcons}
            selectable={selectable}
            hasActions={hasActions}
            totalColumnCount={totalColumnCount}
            template={template}
            sort={currentSort}
            manualSorting={manualSorting}
            filters={currentFilters}
            columnSizing={currentColumnSizing}
            pinned={pinned}
            enableColumnReordering={enableColumnReordering}
            onColumnSizingChange={handleColumnSizingChange}
            onColumnReorder={handleColumnReorder}
            onSortChange={(column) => handleSortChange(nextSort(column, currentSort))}
            onFilterChange={handleFilterChange}
            onFilterClear={handleFilterClear}
            allSelected={allVisibleSelected}
            partiallySelected={someVisibleSelected}
            selectionMutable={selectionMutable}
            onSelectAll={handleSelectAll}
          />
          <DataTableDesktopBody
            columns={visibleColumns}
            contentMotionKey={contentMotionKey}
            collapsedGroupIds={normalizedCollapsedIds}
            emptyLabel={emptyLabel}
            emptyState={emptyState}
            error={Boolean(error)}
            errorLabel={errorLabel}
            errorState={errorState}
            getRowCanSelect={getRowCanSelect}
            hasActions={hasActions}
            icons={mergedIcons}
            editing={editing}
            totalColumnCount={totalColumnCount}
            rowIndexOffset={groups ? 0 : normalizedRowIndexOffset}
            loading={Boolean(loading)}
            loadingLabel={loadingLabel}
            loadingState={loadingState}
            motion={motion}
            onGroupToggle={handleGroupToggle}
            onRowClick={onRowClick}
            onRowContextMenu={onRowContextMenu}
            onSelectedChange={handleRowSelection}
            pinned={pinned}
            renderGroupHeader={renderGroupHeader}
            renderRowActions={renderRowActions}
            rowAriaLabel={rowAriaLabel}
            selectedIds={selectedSet}
            selectable={selectable}
            selectionMutable={selectionMutable}
            showEmpty={showEmpty}
            template={template}
            totalSize={totalSize}
            visibleItems={visibleItems}
            virtualItems={renderedVirtualItems}
          />
        </div>
      </div>
      <DataTableMobileList
        visibleItems={visibleItems}
        contentMotionKey={contentMotionKey}
        mobileHeight={mobileHeight}
        rowHeight={rowHeight}
        groupHeight={groupHeight}
        overscan={serverOverscan}
        renderCard={renderCard}
        columns={visibleColumns}
        icons={mergedIcons}
        editing={editing}
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
        selectedIds={selectedSet}
        selectable={selectable}
        isRowSelectable={isRowSelectable}
        selectionMutable={selectionMutable}
        loading={loading}
        error={Boolean(error)}
        loadingLabel={loadingLabel}
        errorLabel={errorLabel}
        emptyLabel={emptyLabel}
        loadingState={loadingState}
        errorState={errorState}
        emptyState={emptyState}
        rowAriaLabel={rowAriaLabel}
        onRowClick={onRowClick}
        onSelectedChange={handleRowSelection}
        collapsedGroupIds={normalizedCollapsedIds}
        onGroupToggle={handleGroupToggle}
        onVirtualItemsChange={setMobileVirtualItems}
        renderMobileGroupHeader={renderMobileGroupHeader}
      />
      {renderFooter ? (
        <div className="rdtg-footer">
          {renderFooter(renderContext)}
        </div>
      ) : null}
    </section>
  );
}

function hasOwnProp<T extends object, K extends PropertyKey>(value: T, key: K): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function useActiveDataTableSurface(): DataTableVirtualSurface {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => undefined;
    }

    const media = window.matchMedia("(max-width: 720px)");
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }, []);
  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "desktop";
    }

    return window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  }, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => "desktop");
}

function useServerVirtualizationCallbacks<T>({
  activeSurface,
  groups,
  loadedRowCount,
  loadThreshold,
  normalizedRowIndexOffset,
  resolvedTotalRowCount,
  serverVirtualization,
  visibleItems,
  visibleRows,
  virtualItems
}: {
  activeSurface: DataTableVirtualSurface;
  groups: Array<NonNullable<DataTableProps<T>["groups"]>[number]> | undefined;
  loadedRowCount: number;
  loadThreshold: number;
  normalizedRowIndexOffset: number;
  resolvedTotalRowCount: number;
  serverVirtualization: DataTableProps<T>["serverVirtualization"];
  visibleItems: Array<DataTableVisibleItem<T>>;
  visibleRows: T[];
  virtualItems: Array<DataTableVirtualItem>;
}) {
  const rowsRangeKeyRef = React.useRef<string | undefined>(undefined);
  const rowsEndKeyRef = React.useRef<string | undefined>(undefined);
  const groupRangeKeysRef = React.useRef(new Map<string, string>());
  const groupEndKeysRef = React.useRef(new Map<string, string>());

  React.useEffect(() => {
    if (!serverVirtualization || virtualItems.length === 0) {
      return;
    }

    if (!groups?.length) {
      const range = rowRangeFromVirtualItems({
        activeSurface,
        loadedRowCount,
        normalizedRowIndexOffset,
        resolvedTotalRowCount,
        visibleRows,
        virtualItems
      });

      if (range) {
        const rangeKey = [
          range.surface,
          range.startIndex,
          range.endIndex,
          range.visibleStartIndex,
          range.visibleEndIndex,
          range.loadedCount,
          range.totalRowCount,
          range.rowIndexOffset
        ].join(":");
        if (rowsRangeKeyRef.current !== rangeKey) {
          rowsRangeKeyRef.current = rangeKey;
          serverVirtualization.onRowsRangeChange?.(range);
        }

        const hasMoreRows = serverVirtualization.hasMoreRows
          ?? resolvedTotalRowCount > normalizedRowIndexOffset + loadedRowCount;
        const reachesEnd = range.endIndex - normalizedRowIndexOffset >= Math.max(0, loadedRowCount - loadThreshold);
        if (
          hasMoreRows
          && reachesEnd
          && !serverVirtualization.loadingMore
          && !serverVirtualization.loadMoreError
        ) {
          const requestKey = [
            range.surface,
            normalizedRowIndexOffset,
            loadedRowCount,
            resolvedTotalRowCount
          ].join(":");
          if (rowsEndKeyRef.current !== requestKey) {
            rowsEndKeyRef.current = requestKey;
            serverVirtualization.onRowsEndReached?.({
              ...range,
              requestedStartIndex: normalizedRowIndexOffset + loadedRowCount
            });
          }
        }
      }

      return;
    }

    const nextGroupRangeKeys = new Map<string, string>();
    groups.forEach((group) => {
      const range = groupRangeFromVirtualItems({ activeSurface, group, visibleItems, virtualItems });
      if (!range) {
        return;
      }

      const rangeKey = [
        range.surface,
        range.groupId,
        range.startIndex,
        range.endIndex,
        range.visibleStartIndex,
        range.visibleEndIndex,
        range.loadedCount,
        range.totalCount ?? "unknown"
      ].join(":");
      nextGroupRangeKeys.set(group.id, rangeKey);
      if (groupRangeKeysRef.current.get(group.id) !== rangeKey) {
        serverVirtualization.onGroupRangeChange?.(range);
      }

      const hasMoreRows = group.hasMoreRows
        ?? Boolean(group.state === "partial" || (typeof group.totalCount === "number" && group.totalCount > range.loadedCount));
      const reachesEnd = range.endIndex >= Math.max(0, range.loadedCount - loadThreshold);
      if (hasMoreRows && reachesEnd && !group.loadingMore && !group.loadMoreError) {
        const requestKey = [
          range.surface,
          group.id,
          range.loadedCount,
          range.totalCount ?? "unknown"
        ].join(":");
        if (groupEndKeysRef.current.get(group.id) !== requestKey) {
          groupEndKeysRef.current.set(group.id, requestKey);
          serverVirtualization.onGroupEndReached?.({
            ...range,
            requestedStartIndex: range.loadedCount
          });
        }
      }
    });

    groupRangeKeysRef.current = nextGroupRangeKeys;
  }, [
    activeSurface,
    groups,
    loadedRowCount,
    loadThreshold,
    normalizedRowIndexOffset,
    resolvedTotalRowCount,
    serverVirtualization,
    visibleItems,
    visibleRows,
    virtualItems
  ]);
}

function rowRangeFromVirtualItems<T>({
  activeSurface,
  loadedRowCount,
  normalizedRowIndexOffset,
  resolvedTotalRowCount,
  visibleRows,
  virtualItems
}: {
  activeSurface: DataTableVirtualSurface;
  loadedRowCount: number;
  normalizedRowIndexOffset: number;
  resolvedTotalRowCount: number;
  visibleRows: T[];
  virtualItems: Array<DataTableVirtualItem>;
}) {
  const first = virtualItems[0];
  const last = virtualItems.at(-1);
  if (!first || !last) {
    return undefined;
  }

  const localStart = Math.min(first.index, loadedRowCount);
  const localEnd = Math.min(last.index + 1, loadedRowCount);
  const startIndex = normalizedRowIndexOffset + localStart;
  const endIndex = normalizedRowIndexOffset + localEnd;

  return {
    surface: activeSurface,
    startIndex,
    endIndex,
    visibleStartIndex: startIndex,
    visibleEndIndex: endIndex,
    rows: visibleRows.slice(localStart, localEnd),
    loadedCount: loadedRowCount,
    totalRowCount: resolvedTotalRowCount,
    rowIndexOffset: normalizedRowIndexOffset
  };
}

function groupRangeFromVirtualItems<T>({
  activeSurface,
  group,
  visibleItems,
  virtualItems
}: {
  activeSurface: DataTableVirtualSurface;
  group: NonNullable<DataTableProps<T>["groups"]>[number];
  visibleItems: Array<DataTableVisibleItem<T>>;
  virtualItems: Array<DataTableVirtualItem>;
}) {
  const groupRows = visibleItems.filter(
    (item): item is Extract<DataTableVisibleItem<T>, { kind: "row" }> => item.kind === "row" && item.groupId === group.id
  );
  const loadedCount = group.loadedCount ?? groupRows.length;
  const virtualLocalIndexes = virtualItems.flatMap((virtualItem) => {
    const item = visibleItems[virtualItem.index];
    if (!item) {
      return [];
    }

    if (item.kind === "row" && item.groupId === group.id) {
      return [item.groupIndex ?? 0];
    }

    if (item.kind === "loadMore" && item.groupId === group.id) {
      return [loadedCount];
    }

    return [];
  });

  if (virtualLocalIndexes.length === 0) {
    return undefined;
  }

  const localStart = Math.min(...virtualLocalIndexes, loadedCount);
  const localEnd = Math.min(Math.max(...virtualLocalIndexes) + 1, loadedCount);

  return {
    surface: activeSurface,
    group,
    groupId: group.id,
    startIndex: localStart,
    endIndex: localEnd,
    visibleStartIndex: localStart,
    visibleEndIndex: localEnd,
    rows: groupRows.slice(localStart, localEnd).map((item) => item.row),
    loadedCount,
    totalCount: group.totalCount
  };
}
