import type * as React from "react";
import type { DataTableColumn, DataTableColumnPinningState, DataTableColumnSizingState } from "../types";

const DEFAULT_COLUMN_TRACK = "minmax(140px, 1fr)";
const DEFAULT_COLUMN_SIZE = 160;
const DEFAULT_COLUMN_MIN_SIZE = 80;
const DEFAULT_COLUMN_MAX_SIZE = 720;
const SELECTION_COLUMN_SIZE = 44;
const ACTION_COLUMN_SIZE = 56;

export interface DataTablePinnedCellMeta {
  side: "left" | "right";
  offset: number;
  edge?: boolean;
}

export interface DataTablePinnedLayout {
  columns: Record<string, DataTablePinnedCellMeta>;
  selection?: DataTablePinnedCellMeta;
  actions?: DataTablePinnedCellMeta;
}

export function gridTemplate<T>({
  columns,
  selectable,
  hasActions,
  columnSizing = {}
}: {
  columns: Array<DataTableColumn<T>>;
  selectable: boolean;
  hasActions: boolean;
  columnSizing?: DataTableColumnSizingState;
}): string {
  return [
    selectable ? "44px" : null,
    ...columns.map((column) => columnTrack(column, columnSizing)),
    hasActions ? "56px" : null
  ].filter(Boolean).join(" ");
}

export function columnClassName<T>(column: DataTableColumn<T>, row: T): string | undefined {
  return typeof column.className === "function" ? column.className(row) : column.className;
}

export function columnTrack<T>(
  column: DataTableColumn<T>,
  columnSizing: DataTableColumnSizingState
): string {
  const size = columnSizing[column.id];
  return isUsableSize(size) ? `${Math.round(size)}px` : column.width ?? DEFAULT_COLUMN_TRACK;
}

export function columnResizeBounds<T>(column: DataTableColumn<T>): { min: number; max: number } {
  const min = isUsableSize(column.minWidth) ? column.minWidth : DEFAULT_COLUMN_MIN_SIZE;
  const rawMax = isUsableSize(column.maxWidth) ? column.maxWidth : DEFAULT_COLUMN_MAX_SIZE;
  return { min, max: Math.max(min, rawMax) };
}

export function clampColumnSize<T>(column: DataTableColumn<T>, size: number): number {
  const { min, max } = columnResizeBounds(column);
  return Math.min(Math.max(Math.round(size), min), max);
}

export function resolveColumnResizeStartSize<T>({
  column,
  columnSizing,
  measuredSize
}: {
  column: DataTableColumn<T>;
  columnSizing: DataTableColumnSizingState;
  measuredSize?: number;
}): number {
  if (isUsableSize(measuredSize)) {
    return clampColumnSize(column, measuredSize);
  }

  const stateSize = columnSizing[column.id];
  if (isUsableSize(stateSize)) {
    return clampColumnSize(column, stateSize);
  }

  const parsedWidth = parsePixelWidth(column.width);
  return clampColumnSize(column, parsedWidth ?? DEFAULT_COLUMN_SIZE);
}

export function pinnedLayout<T>({
  columns,
  selectable,
  hasActions,
  columnSizing,
  columnPinning
}: {
  columns: Array<DataTableColumn<T>>;
  selectable: boolean;
  hasActions: boolean;
  columnSizing: DataTableColumnSizingState;
  columnPinning: DataTableColumnPinningState;
}): DataTablePinnedLayout {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const leftColumns = uniqueColumnIds(columnPinning.left)
    .map((columnId) => columnById.get(columnId))
    .filter((column): column is DataTableColumn<T> => Boolean(column));
  const leftColumnIds = new Set(leftColumns.map((column) => column.id));
  const rightColumns = uniqueColumnIds(columnPinning.right)
    .filter((columnId) => !leftColumnIds.has(columnId))
    .map((columnId) => columnById.get(columnId))
    .filter((column): column is DataTableColumn<T> => Boolean(column));
  const layout: DataTablePinnedLayout = { columns: {} };

  if (leftColumns.length > 0 && selectable) {
    layout.selection = { side: "left", offset: 0 };
  }

  let leftOffset = leftColumns.length > 0 && selectable ? SELECTION_COLUMN_SIZE : 0;
  leftColumns.forEach((column, index) => {
    layout.columns[column.id] = {
      side: "left",
      offset: leftOffset,
      edge: index === leftColumns.length - 1
    };
    leftOffset += columnPixelSize(column, columnSizing);
  });

  if (rightColumns.length > 0 && hasActions) {
    layout.actions = { side: "right", offset: 0 };
  }

  let rightOffset = rightColumns.length > 0 && hasActions ? ACTION_COLUMN_SIZE : 0;
  [...rightColumns].reverse().forEach((column, index) => {
    layout.columns[column.id] = {
      side: "right",
      offset: rightOffset,
      edge: index === rightColumns.length - 1
    };
    rightOffset += columnPixelSize(column, columnSizing);
  });

  return layout;
}

export function pinnedCellStyle(meta: DataTablePinnedCellMeta | undefined): React.CSSProperties | undefined {
  if (!meta) {
    return undefined;
  }

  return {
    [meta.side === "left" ? "--rdtg-pin-left" : "--rdtg-pin-right"]: `${meta.offset}px`
  } as React.CSSProperties;
}

function parsePixelWidth(width: string | undefined): number | undefined {
  const match = width?.trim().match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  return isUsableSize(value) ? value : undefined;
}

function isUsableSize(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function columnPixelSize<T>(column: DataTableColumn<T>, columnSizing: DataTableColumnSizingState): number {
  const size = columnSizing[column.id];
  if (isUsableSize(size)) {
    return clampColumnSize(column, size);
  }

  return parsePixelWidth(column.width) ?? DEFAULT_COLUMN_SIZE;
}

function uniqueColumnIds(ids: string[] | undefined): string[] {
  return Array.from(new Set(ids ?? []));
}
