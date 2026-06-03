import * as React from "react";
import type { DataTableColumn, DataTableIcons, DataTableProps, DataTableRowId, DataTableVisibleItem } from "../types";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import type { DataTableVirtualItem } from "../hooks/useDataTableModel";
import type { DataTablePinnedLayout } from "../model/layout";
import { DataTableGroupRow } from "./DataTableGroupRow";
import { DataTableRow } from "./DataTableRow";
import { DataTableStatePanel } from "./DataTableStatePanel";

const COLLAPSE_EXIT_DURATION = 520;

export interface DataTableDesktopBodyProps<T> {
  columns: Array<DataTableColumn<T>>;
  contentMotionKey: string;
  collapsedGroupIds: Array<string>;
  emptyLabel: string;
  emptyState: DataTableProps<T>["emptyState"];
  error: boolean;
  errorLabel: string;
  errorState: DataTableProps<T>["errorState"];
  getRowCanSelect: (rowId: DataTableRowId) => boolean;
  hasActions: boolean;
  icons: DataTableIcons;
  editing: DataTableEditingApi<T>;
  loading: boolean;
  loadingLabel: string;
  loadingState: DataTableProps<T>["loadingState"];
  motion: DataTableProps<T>["motion"];
  onGroupToggle: (groupId: string) => void;
  onRowClick: DataTableProps<T>["onRowClick"];
  onRowContextMenu: DataTableProps<T>["onRowContextMenu"];
  onSelectedChange: (rowId: DataTableRowId, checked: boolean) => void;
  pinned: DataTablePinnedLayout;
  renderGroupHeader: DataTableProps<T>["renderGroupHeader"];
  renderRowActions: DataTableProps<T>["renderRowActions"];
  rowAriaLabel: DataTableProps<T>["rowAriaLabel"];
  selectedIds: Set<string>;
  selectable: boolean;
  selectionMutable: boolean;
  showEmpty: boolean;
  template: string;
  totalColumnCount: number;
  rowIndexOffset: number;
  totalSize: number;
  visibleItems: Array<DataTableVisibleItem<T>>;
  virtualItems: Array<DataTableVirtualItem>;
}

export function DataTableDesktopBody<T>({
  columns,
  contentMotionKey,
  collapsedGroupIds,
  emptyLabel,
  emptyState,
  error,
  errorLabel,
  errorState,
  getRowCanSelect,
  hasActions,
  icons,
  editing,
  loading,
  loadingLabel,
  loadingState,
  motion,
  onGroupToggle,
  onRowClick,
  onRowContextMenu,
  onSelectedChange,
  pinned,
  renderGroupHeader,
  renderRowActions,
  rowAriaLabel,
  selectedIds,
  selectable,
  selectionMutable,
  showEmpty,
  template,
  totalColumnCount,
  rowIndexOffset,
  totalSize,
  visibleItems,
  virtualItems
}: DataTableDesktopBodyProps<T>): React.ReactElement {
  const exitingRows = useExitingCollapsedRows({ collapsedGroupIds, motion, visibleItems, virtualItems });

  return (
    <div className="rdtg-viewport" aria-busy={loading ? "true" : "false"}>
      {loading ? (
        <DataTableStatePanel icons={icons} label={loadingLabel} state={loadingState} tone="loading" />
      ) : error ? (
        <DataTableStatePanel icons={icons} label={errorLabel} state={errorState} tone="error" />
      ) : showEmpty ? (
        <DataTableStatePanel icons={icons} label={emptyLabel} state={emptyState} tone="empty" />
      ) : (
        <div className="rdtg-virtualSpace" data-motion-key={contentMotionKey} style={{ height: `${totalSize}px` }}>
          {virtualItems.map((virtualItem) => {
            const item = visibleItems[virtualItem.index];
            if (!item) {
              return null;
            }

            return (
              <div
                key={virtualItem.key}
                className="rdtg-virtualItem"
                style={{ top: `${virtualItem.start}px` }}
                data-index={virtualItem.index}
                data-kind={item.kind}
              >
                {item.kind === "group" ? (
                  <DataTableGroupRow
                    group={item.group}
                    rows={item.rows}
                    columns={totalColumnCount}
                    rowIndex={virtualItem.index + 2}
                    collapsed={collapsedGroupIds.includes(item.group.id)}
                    icons={icons}
                    onToggle={onGroupToggle}
                    renderGroupHeader={renderGroupHeader}
                  />
                ) : (
                  <DataTableRow
                    row={item.row}
                    rowId={item.id}
                    columns={columns}
                    icons={icons}
                    editing={editing}
                    pinned={pinned}
                    template={template}
                    rowIndex={rowIndexOffset + virtualItem.index + 2}
                    columnStartIndex={selectable ? 2 : 1}
                    totalColumnCount={totalColumnCount}
                    selectable={selectable}
                    rowSelectable={getRowCanSelect(item.id)}
                    selected={selectedIds.has(item.id)}
                    selectionMutable={selectionMutable}
                    hasActions={hasActions}
                    rowAriaLabel={rowAriaLabel}
                    onSelectedChange={onSelectedChange}
                    onRowClick={onRowClick}
                    onRowContextMenu={onRowContextMenu}
                    renderRowActions={renderRowActions}
                  />
                )}
              </div>
            );
          })}
          {exitingRows.map((exitingRow) => (
            <div
              key={`exiting-${exitingRow.key}`}
              className="rdtg-virtualItem rdtg-virtualItemExiting"
              style={{ top: `${exitingRow.start}px` }}
              data-index={exitingRow.index}
              data-kind="row"
              data-exiting="true"
              aria-hidden="true"
              inert
            >
              <DataTableRow
                row={exitingRow.item.row}
                rowId={exitingRow.item.id}
                columns={columns}
                icons={icons}
                editing={editing}
                pinned={pinned}
                template={template}
                rowIndex={rowIndexOffset + exitingRow.index + 2}
                columnStartIndex={selectable ? 2 : 1}
                totalColumnCount={totalColumnCount}
                selectable={selectable}
                rowSelectable={getRowCanSelect(exitingRow.item.id)}
                selected={selectedIds.has(exitingRow.item.id)}
                selectionMutable={selectionMutable}
                hasActions={hasActions}
                rowAriaLabel={rowAriaLabel}
                onSelectedChange={onSelectedChange}
                onRowClick={undefined}
                onRowContextMenu={undefined}
                renderRowActions={renderRowActions}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExitingCollapsedRow<T> {
  key: string;
  item: Extract<DataTableVisibleItem<T>, { kind: "row" }>;
  index: number;
  start: number;
}

function useExitingCollapsedRows<T>({
  collapsedGroupIds,
  motion,
  visibleItems,
  virtualItems
}: {
  collapsedGroupIds: string[];
  motion: DataTableProps<T>["motion"];
  visibleItems: Array<DataTableVisibleItem<T>>;
  virtualItems: Array<DataTableVirtualItem>;
}): Array<ExitingCollapsedRow<T>> {
  const prefersReducedMotion = usePrefersReducedMotion(motion);
  const previousRef = React.useRef(snapshotVisibleItems(visibleItems, virtualItems));
  const timersRef = React.useRef(new Map<string, number>());
  const [exitingRows, setExitingRows] = React.useState<Array<ExitingCollapsedRow<T>>>([]);

  React.useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  React.useLayoutEffect(() => {
    const nextSnapshot = snapshotVisibleItems(visibleItems, virtualItems);

    if (prefersReducedMotion) {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
      previousRef.current = nextSnapshot;
      window.setTimeout(() => setExitingRows([]), 0);
      return;
    }

    const collapsed = new Set(collapsedGroupIds);
    const exiting = previousRef.current.items.flatMap((previousItem): Array<ExitingCollapsedRow<T>> => {
      if (previousItem.kind !== "row" || !previousItem.groupId || !collapsed.has(previousItem.groupId)) {
        return [];
      }

      const rowKey = visibleItemKey(previousItem);
      if (nextSnapshot.itemKeys.has(rowKey)) {
        return [];
      }

      const previousVirtualItem = previousRef.current.virtualItems.get(rowKey);
      if (!previousVirtualItem) {
        return [];
      }

      return [{
        key: `${previousItem.groupId}:${previousItem.id}:${previousVirtualItem.start}`,
        item: previousItem,
        index: previousVirtualItem.index,
        start: previousVirtualItem.start
      }];
    });

    previousRef.current = nextSnapshot;

    if (exiting.length === 0) {
      return;
    }

    setExitingRows((current) => {
      const nextKeys = new Set(exiting.map((row) => row.key));
      return [
        ...current.filter((row) => !nextSnapshot.itemKeys.has(visibleItemKey(row.item)) && !nextKeys.has(row.key)),
        ...exiting
      ];
    });

    exiting.forEach((row) => {
      if (timersRef.current.has(row.key)) {
        return;
      }

      const timerId = window.setTimeout(() => {
        timersRef.current.delete(row.key);
        setExitingRows((current) => current.filter((candidate) => candidate.key !== row.key));
      }, COLLAPSE_EXIT_DURATION);
      timersRef.current.set(row.key, timerId);
    });
  }, [collapsedGroupIds, prefersReducedMotion, visibleItems, virtualItems]);

  return prefersReducedMotion ? [] : exitingRows;
}

function usePrefersReducedMotion<T>(motion: DataTableProps<T>["motion"]): boolean {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (motion !== "system" || typeof window.matchMedia !== "function") {
      return () => undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }, [motion]);
  const getSnapshot = React.useCallback(() => {
    if (motion !== "system" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, [motion]);
  const systemPrefersReduced = React.useSyncExternalStore(subscribe, getSnapshot, () => false);

  return motion === "reduced" || (motion === "system" && systemPrefersReduced);
}

function snapshotVisibleItems<T>(
  visibleItems: Array<DataTableVisibleItem<T>>,
  virtualItems: Array<DataTableVirtualItem>
) {
  const itemKeys = new Set(visibleItems.map(visibleItemKey));
  const virtualItemMap = new Map<string, DataTableVirtualItem>();

  virtualItems.forEach((virtualItem) => {
    const item = visibleItems[virtualItem.index];
    if (item) {
      virtualItemMap.set(visibleItemKey(item), virtualItem);
    }
  });

  return {
    items: visibleItems,
    itemKeys,
    virtualItems: virtualItemMap
  };
}

function visibleItemKey<T>(item: DataTableVisibleItem<T>): string {
  return `${item.kind}:${item.id}`;
}
