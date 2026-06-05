import type * as React from "react";
import type { DataTableGroup, DataTableGroupSummary, DataTableRowId, DataTableVisibleItem } from "../types";

export function defaultCollapsedIds<T>(groups: Array<DataTableGroup<T>> | undefined): string[] {
  return groups?.filter((group) => group.defaultCollapsed && group.collapsible !== false).map((group) => group.id) ?? [];
}

export function pruneCollapsedIds<T>(groupIds: string[], groups: Array<DataTableGroup<T>> | undefined): string[] {
  const validIds = new Set(groups?.filter((group) => group.collapsible !== false).map((group) => group.id) ?? []);
  return groupIds.filter((groupId) => validIds.has(groupId));
}

export function groupRows<T>({
  rows,
  groups,
  collapsedGroupIds,
  getRowId,
  serverVirtualization
}: {
  rows: T[];
  groups: Array<DataTableGroup<T>> | undefined;
  collapsedGroupIds: string[];
  getRowId: (row: T) => DataTableRowId;
  serverVirtualization?: {
    enabled: boolean;
    showEndSentinel?: boolean;
    rows?: {
      hasMoreRows: boolean;
      loadingMore?: boolean;
      loadMoreError?: React.ReactNode;
    };
  };
}): Array<DataTableVisibleItem<T>> {
  if (!groups?.length) {
    const rowItems = rows.map((row) => ({ kind: "row" as const, id: getRowId(row), row }));
    const loadItem = serverVirtualization?.enabled && serverVirtualization.rows
      ? loadMoreItem<T>({
        scope: "rows",
        rowCount: rowItems.length,
        hasMoreRows: serverVirtualization.rows.hasMoreRows,
        loadingMore: serverVirtualization.rows.loadingMore,
        loadMoreError: serverVirtualization.rows.loadMoreError,
        showEndSentinel: serverVirtualization.showEndSentinel ?? true
      })
      : undefined;

    return loadItem ? [...rowItems, loadItem] : rowItems;
  }

  const usedRowIds = new Set<DataTableRowId>();
  const collapsed = new Set(collapsedGroupIds);

  const groupedItems = groups.flatMap((group) => {
    const groupRows = uniqueRows(resolveGroupRows(group, rows, getRowId), getRowId, usedRowIds);
    const groupItem: DataTableVisibleItem<T> = {
      kind: "group",
      id: group.id,
      group,
      rows: groupRows
    };

    if (collapsed.has(group.id)) {
      return [groupItem];
    }

    const rowItems = groupRows.map((row, groupIndex) => ({
      kind: "row" as const,
      id: getRowId(row),
      row,
      groupId: group.id,
      groupIndex
    }));
    const groupLoadItem = serverVirtualization?.enabled
      ? loadMoreItem({
        scope: "group",
        group,
        rowCount: groupRows.length,
        hasMoreRows: resolveGroupHasMoreRows(group, groupRows),
        loadingMore: group.loadingMore,
        loadMoreError: group.loadMoreError,
        showEndSentinel: serverVirtualization.showEndSentinel ?? true
      })
      : undefined;

    return [
      groupItem,
      ...rowItems,
      ...(groupLoadItem ? [groupLoadItem] : [])
    ];
  });

  const ungroupedRows = rows.filter((row) => !usedRowIds.has(getRowId(row)));
  return [
    ...groupedItems,
    ...ungroupedRows.map((row) => ({ kind: "row" as const, id: getRowId(row), row }))
  ];
}

export function resolveGroupRows<T>(
  group: DataTableGroup<T>,
  rows: T[],
  getRowId: (row: T) => DataTableRowId
): T[] {
  if (group.rows) {
    return group.rows;
  }

  if (!group.rowIds?.length) {
    return [];
  }

  const groupRowIds = new Set(group.rowIds);
  return rows.filter((row) => groupRowIds.has(getRowId(row)));
}

export function summarizeGroup<T>(group: DataTableGroup<T>, rows: T[]): DataTableGroupSummary<T> {
  return {
    group,
    visibleRows: rows,
    totalCount: group.totalCount,
    loadedCount: group.loadedCount ?? rows.length
  };
}

export function resolveGroupHasMoreRows<T>(group: DataTableGroup<T>, rows: T[]): boolean {
  if (typeof group.hasMoreRows === "boolean") {
    return group.hasMoreRows;
  }

  const loadedCount = group.loadedCount ?? rows.length;
  return Boolean(
    group.state === "partial"
    || (typeof group.totalCount === "number" && group.totalCount > loadedCount)
  );
}

export function toggleCollapsedGroup(groupIds: string[], groupId: string): string[] {
  const next = new Set(groupIds);
  if (next.has(groupId)) {
    next.delete(groupId);
  } else {
    next.add(groupId);
  }
  return Array.from(next);
}

function uniqueRows<T>(
  rows: T[],
  getRowId: (row: T) => DataTableRowId,
  usedRowIds: Set<DataTableRowId>
): T[] {
  return rows.filter((row) => {
    const rowId = getRowId(row);
    if (usedRowIds.has(rowId)) {
      return false;
    }
    usedRowIds.add(rowId);
    return true;
  });
}

function loadMoreItem<T>({
  scope,
  group,
  rowCount,
  hasMoreRows,
  loadingMore,
  loadMoreError,
  showEndSentinel
}: {
  scope: "rows" | "group";
  group?: DataTableGroup<T>;
  rowCount: number;
  hasMoreRows: boolean;
  loadingMore?: boolean;
  loadMoreError?: React.ReactNode;
  showEndSentinel: boolean;
}): Extract<DataTableVisibleItem<T>, { kind: "loadMore" }> | undefined {
  if (loadMoreError) {
    return {
      kind: "loadMore",
      id: loadMoreItemId(scope, group?.id, "error"),
      scope,
      status: "error",
      group,
      groupId: group?.id,
      rowCount,
      error: loadMoreError
    };
  }

  if (loadingMore) {
    return {
      kind: "loadMore",
      id: loadMoreItemId(scope, group?.id, "loading"),
      scope,
      status: "loading",
      group,
      groupId: group?.id,
      rowCount
    };
  }

  if (!hasMoreRows && showEndSentinel) {
    return {
      kind: "loadMore",
      id: loadMoreItemId(scope, group?.id, "end"),
      scope,
      status: "end",
      group,
      groupId: group?.id,
      rowCount
    };
  }

  return undefined;
}

function loadMoreItemId(scope: "rows" | "group", groupId: string | undefined, status: "loading" | "error" | "end"): string {
  return scope === "group" ? `${groupId ?? "group"}:load-more:${status}` : `rows:load-more:${status}`;
}
