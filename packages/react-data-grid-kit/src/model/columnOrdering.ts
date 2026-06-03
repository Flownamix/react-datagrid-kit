export type ColumnDropPlacement = "before" | "after";

export function moveColumnInOrder({
  currentOrder,
  allColumnIds,
  sourceId,
  targetId,
  placement
}: {
  currentOrder: string[];
  allColumnIds: string[];
  sourceId: string;
  targetId: string;
  placement: ColumnDropPlacement;
}): string[] {
  if (sourceId === targetId) {
    return normalizeColumnOrder(currentOrder, allColumnIds);
  }

  const orderedIds = normalizeColumnOrder(currentOrder, allColumnIds);
  if (!orderedIds.includes(sourceId) || !orderedIds.includes(targetId)) {
    return orderedIds;
  }

  const withoutSource = orderedIds.filter((columnId) => columnId !== sourceId);
  const targetIndex = withoutSource.indexOf(targetId);
  if (targetIndex < 0) {
    return orderedIds;
  }

  const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;
  return [
    ...withoutSource.slice(0, insertIndex),
    sourceId,
    ...withoutSource.slice(insertIndex)
  ];
}

function normalizeColumnOrder(currentOrder: string[], allColumnIds: string[]): string[] {
  const validColumnIds = new Set(allColumnIds);
  const orderedIds = uniqueColumnIds(currentOrder).filter((columnId) => validColumnIds.has(columnId));
  const orderedIdSet = new Set(orderedIds);

  return [
    ...orderedIds,
    ...allColumnIds.filter((columnId) => !orderedIdSet.has(columnId))
  ];
}

function uniqueColumnIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
