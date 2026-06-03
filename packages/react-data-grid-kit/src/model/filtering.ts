import type { ColumnFiltersState, Updater } from "@tanstack/react-table";
import * as React from "react";
import type { DataTableColumn, DataTableFilterState, DataTableRowId } from "../types";

export function filtersToColumnFilters(filters: DataTableFilterState, filterableColumnIds: string[]): ColumnFiltersState {
  const filterableIds = new Set(filterableColumnIds);
  return Object.entries(filters)
    .filter(([columnId, value]) => filterableIds.has(columnId) && value !== undefined)
    .map(([id, value]) => ({ id, value }));
}

export function columnFiltersToFilters(columnFilters: ColumnFiltersState, currentFilters: DataTableFilterState): DataTableFilterState {
  const next = { ...currentFilters };
  const columnFilterIds = new Set(columnFilters.map((filter) => filter.id));

  Object.keys(next).forEach((columnId) => {
    if (columnFilterIds.has(columnId)) {
      delete next[columnId];
    }
  });

  columnFilters.forEach((filter) => {
    next[filter.id] = filter.value;
  });

  return next;
}

export function applyColumnFiltersUpdate(
  currentFilters: DataTableFilterState,
  filterableColumnIds: string[],
  updater: Updater<ColumnFiltersState>
): DataTableFilterState {
  const currentColumnFilters = filtersToColumnFilters(currentFilters, filterableColumnIds);
  const nextColumnFilters = typeof updater === "function" ? updater(currentColumnFilters) : updater;
  const next = { ...currentFilters };
  filterableColumnIds.forEach((columnId) => {
    delete next[columnId];
  });

  return columnFiltersToFilters(nextColumnFilters, next);
}

export function rowMatchesQuickSearch<T>({
  columns,
  query,
  row,
  rowId
}: {
  columns: Array<DataTableColumn<T>>;
  query: string;
  row: T;
  rowId: DataTableRowId;
}): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return columns.some((column) => {
    if (column.quickSearchable === false) {
      return false;
    }

    const value = quickSearchValueForColumn({ column, row, rowId });
    return normalizeSearchText(value).includes(normalizedQuery);
  });
}

function quickSearchValueForColumn<T>({
  column,
  row,
  rowId
}: {
  column: DataTableColumn<T>;
  row: T;
  rowId: DataTableRowId;
}): unknown {
  const context = { row, rowId, column };
  const explicitValue = column.quickSearchText?.(row, context);

  if (explicitValue !== undefined && explicitValue !== null) {
    return explicitValue;
  }

  const sortValue = column.sortAccessor?.(row);

  if (sortValue !== undefined && sortValue !== null) {
    return sortValue;
  }

  return plainText(column.renderCell(row, context));
}

function normalizeSearchText(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  return String(value).trim().toLowerCase();
}

function plainText(value: React.ReactNode): string {
  if (value === undefined || value === null || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(plainText).filter(Boolean).join(" ");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
    return plainText(value.props.children);
  }

  return "";
}
