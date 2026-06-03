import type * as React from "react";
import type { DataTableColumn, DataTableRowId } from "../types";

export function isColumnEditable<T>(column: DataTableColumn<T>, row: T, rowId: DataTableRowId): boolean {
  if (!column.renderEditCell) {
    return false;
  }
  if (typeof column.editable === "function") {
    return column.editable(row, { row, rowId, column });
  }
  return column.editable === true;
}

export function resolveEditValue<T>(column: DataTableColumn<T>, row: T, rowId: DataTableRowId): unknown {
  return column.getEditValue?.(row, { row, rowId, column });
}

export function plainText(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "cell";
}
