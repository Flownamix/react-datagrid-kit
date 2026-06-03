import type { DataTableColumn, DataTableSort } from "../types";

export function nextSort<T>(column: DataTableColumn<T>, current: DataTableSort | undefined): DataTableSort | undefined {
  if (current?.columnId === column.id && current.direction === "descending") {
    return undefined;
  }

  return {
    columnId: column.id,
    direction: current?.columnId === column.id && current.direction === "ascending" ? "descending" : "ascending"
  };
}

export function compareSortValues(left: unknown, right: unknown): number {
  if (left === right) {
    return 0;
  }
  if (left === null || left === undefined) {
    return 1;
  }
  if (right === null || right === undefined) {
    return -1;
  }
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}
