import type { RowSelectionState, Updater } from "@tanstack/react-table";
import type { DataTableRowId } from "../types";

export function selectedIdsToRowSelection(selectedIds: DataTableRowId[]): RowSelectionState {
  return selectedIds.reduce<RowSelectionState>((state, rowId) => {
    state[rowId] = true;
    return state;
  }, {});
}

export function rowSelectionToSelectedIds(rowSelection: RowSelectionState): DataTableRowId[] {
  return Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([rowId]) => rowId);
}

export function applyRowSelectionUpdate(
  selectedIds: DataTableRowId[],
  updater: Updater<RowSelectionState>
): DataTableRowId[] {
  const current = selectedIdsToRowSelection(selectedIds);
  const next = typeof updater === "function" ? updater(current) : updater;
  return rowSelectionToSelectedIds(next);
}
