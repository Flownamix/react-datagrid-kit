import type {
  DataTableColumn,
  DataTableColumnPinningState,
  DataTableColumnSizingState
} from "../types";

export const RESPONSIVE_EXPANDER_SIZE = 44;
export const RESPONSIVE_SELECTION_SIZE = 44;
export const RESPONSIVE_ACTION_SIZE = 152;

const DEFAULT_COLUMN_SIZE = 160;
const DEFAULT_RESPONSIVE_PRIORITY = 100;

export interface ResponsiveColumnLayout<T> {
  summaryColumns: Array<DataTableColumn<T>>;
  detailColumns: Array<DataTableColumn<T>>;
  hasExpander: boolean;
}

export function responsiveColumnLayout<T>({
  columns,
  availableWidth,
  columnSizing,
  columnPinning,
  selectable,
  hasActions,
  enabled
}: {
  columns: Array<DataTableColumn<T>>;
  availableWidth: number;
  columnSizing: DataTableColumnSizingState;
  columnPinning: DataTableColumnPinningState;
  selectable: boolean;
  hasActions: boolean;
  enabled: boolean;
}): ResponsiveColumnLayout<T> {
  if (!enabled || availableWidth <= 0 || columns.length === 0) {
    return { summaryColumns: columns, detailColumns: [], hasExpander: false };
  }

  const detailOnly = columns.filter((column) => column.responsiveMode === "detail-only");
  const candidates = columns.filter((column) => column.responsiveMode !== "detail-only");
  const reservedWithoutExpander = (selectable ? RESPONSIVE_SELECTION_SIZE : 0)
    + (hasActions ? RESPONSIVE_ACTION_SIZE : 0);
  const allPreferredWidth = candidates.reduce(
    (total, column) => total + preferredColumnSize(column, columnSizing),
    reservedWithoutExpander
  );

  if (detailOnly.length === 0 && allPreferredWidth <= availableWidth) {
    return { summaryColumns: columns, detailColumns: [], hasExpander: false };
  }

  const pinnedIds = new Set([...(columnPinning.left ?? []), ...(columnPinning.right ?? [])]);
  const protectedColumns = candidates.filter((column) => column.responsiveMode === "always");
  const automaticColumns = candidates
    .filter((column) => column.responsiveMode !== "always")
    .map((column, index) => ({ column, index }))
    .sort((left, right) => {
      const pinnedDifference = Number(pinnedIds.has(right.column.id)) - Number(pinnedIds.has(left.column.id));
      if (pinnedDifference !== 0) {
        return pinnedDifference;
      }

      const priorityDifference = responsivePriority(left.column) - responsivePriority(right.column);
      return priorityDifference !== 0 ? priorityDifference : left.index - right.index;
    });
  const retainedIds = new Set(protectedColumns.map((column) => column.id));
  let usedWidth = reservedWithoutExpander + RESPONSIVE_EXPANDER_SIZE
    + protectedColumns.reduce((total, column) => total + minimumResponsiveColumnSize(column, columnSizing), 0);

  automaticColumns.forEach(({ column }) => {
    const columnWidth = preferredColumnSize(column, columnSizing);
    if (usedWidth + columnWidth <= availableWidth) {
      retainedIds.add(column.id);
      usedWidth += columnWidth;
    }
  });

  // A responsive summary row must retain at least one data column when one exists.
  if (retainedIds.size === 0 && automaticColumns.length > 0) {
    retainedIds.add(automaticColumns[0].column.id);
  }

  const summaryColumns = columns.filter(
    (column) => column.responsiveMode !== "detail-only" && retainedIds.has(column.id)
  );
  const detailColumns = columns.filter((column) => !retainedIds.has(column.id));

  return {
    summaryColumns,
    detailColumns,
    hasExpander: detailColumns.length > 0
  };
}

export function responsiveGridTemplate<T>({
  columns,
  selectable,
  hasActions,
  hasExpander,
  columnSizing
}: {
  columns: Array<DataTableColumn<T>>;
  selectable: boolean;
  hasActions: boolean;
  hasExpander: boolean;
  columnSizing: DataTableColumnSizingState;
}): string {
  return [
    hasExpander ? `${RESPONSIVE_EXPANDER_SIZE}px` : null,
    selectable ? `${RESPONSIVE_SELECTION_SIZE}px` : null,
    ...columns.map((column) => `minmax(0, ${preferredColumnSize(column, columnSizing)}fr)`),
    hasActions ? `${RESPONSIVE_ACTION_SIZE}px` : null
  ].filter(Boolean).join(" ");
}

export function preferredColumnSize<T>(
  column: DataTableColumn<T>,
  columnSizing: DataTableColumnSizingState
): number {
  const explicitSize = columnSizing[column.id];
  if (isUsableSize(explicitSize)) {
    return explicitSize;
  }

  return parsePixelWidth(column.width)
    ?? column.minWidth
    ?? parseMinmaxPixelWidth(column.width)
    ?? DEFAULT_COLUMN_SIZE;
}

function responsivePriority<T>(column: DataTableColumn<T>): number {
  return Number.isFinite(column.responsivePriority)
    ? Number(column.responsivePriority)
    : DEFAULT_RESPONSIVE_PRIORITY;
}

function minimumResponsiveColumnSize<T>(
  column: DataTableColumn<T>,
  columnSizing: DataTableColumnSizingState
): number {
  return isUsableSize(column.minWidth)
    ? column.minWidth
    : preferredColumnSize(column, columnSizing);
}

function parsePixelWidth(width: string | undefined): number | undefined {
  const match = width?.trim().match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return isUsableSize(value) ? value : undefined;
}

function parseMinmaxPixelWidth(width: string | undefined): number | undefined {
  const match = width?.trim().match(/^minmax\(\s*(\d+(?:\.\d+)?)px\s*,/i);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return isUsableSize(value) ? value : undefined;
}

function isUsableSize(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
