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
  getRowId
}: {
  rows: T[];
  groups: Array<DataTableGroup<T>> | undefined;
  collapsedGroupIds: string[];
  getRowId: (row: T) => DataTableRowId;
}): Array<DataTableVisibleItem<T>> {
  if (!groups?.length) {
    return rows.map((row) => ({ kind: "row", id: getRowId(row), row }));
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

    return [
      groupItem,
      ...groupRows.map((row) => ({
        kind: "row" as const,
        id: getRowId(row),
        row,
        groupId: group.id
      }))
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
