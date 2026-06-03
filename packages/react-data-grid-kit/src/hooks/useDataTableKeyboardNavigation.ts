import * as React from "react";
import type { DataTableColumn, DataTableRowId, DataTableVisibleItem } from "../types";
import type { DataTableEditingApi } from "./useDataTableEditing";
import { isColumnEditable } from "../model/editing";

const GRID_CELL_SELECTOR = "[data-rdtg-grid-cell='true'][aria-colindex]";
const GRID_ROW_SELECTOR = "[role='row'][aria-rowindex]";
const EDITOR_SELECTOR = ".rdtg-editCell";
const TEXT_INPUT_SELECTOR = [
  "input:not([type='button']):not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='reset'])",
  "select",
  "textarea",
  "[contenteditable='true']"
].join(",");
const PACKAGE_INTERACTIVE_SELECTOR = [
  ".rdtg-headerButton",
  ".rdtg-filterButton",
  ".rdtg-checkbox",
  ".rdtg-editTrigger",
  ".rdtg-groupToggle"
].join(",");
const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-rdtg-stop-row-click]"
].join(",");

export interface UseDataTableKeyboardNavigationOptions<T> {
  columns: Array<DataTableColumn<T>>;
  visibleItems: Array<DataTableVisibleItem<T>>;
  editing: DataTableEditingApi<T>;
  pageRowStep: number;
}

export interface DataTableKeyboardNavigation {
  focusInitialCell: (grid: HTMLElement) => void;
  onGridKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

interface IndexedCell {
  element: HTMLElement;
  rowIndex: number;
  columnIndex: number;
}

export function useDataTableKeyboardNavigation<T>({
  columns,
  visibleItems,
  editing,
  pageRowStep
}: UseDataTableKeyboardNavigationOptions<T>): DataTableKeyboardNavigation {
  const rowById = React.useMemo(() => {
    const nextRows = new Map<DataTableRowId, T>();
    visibleItems.forEach((item) => {
      if (item.kind === "row") {
        nextRows.set(item.id, item.row);
      }
    });
    return nextRows;
  }, [visibleItems]);
  const columnById = React.useMemo(() => {
    const nextColumns = new Map<string, DataTableColumn<T>>();
    columns.forEach((column) => nextColumns.set(column.id, column));
    return nextColumns;
  }, [columns]);

  const focusInitialCell = React.useCallback((grid: HTMLElement) => {
    const firstCell = getCells(grid)[0]?.element;
    if (firstCell) {
      focusCell(firstCell);
    }
  }, []);

  const startEditingFromCell = React.useCallback(
    (cell: HTMLElement): boolean => {
      const rowId = cell.dataset.rowId;
      const columnId = cell.dataset.columnId;
      if (!rowId || !columnId) {
        return false;
      }

      const column = columnById.get(columnId);
      if (!rowById.has(rowId) || !column) {
        return false;
      }

      const row = rowById.get(rowId) as T;
      if (!isColumnEditable(column, row, rowId)) {
        return false;
      }

      editing.startEditing(row, rowId, column, "desktop");
      return true;
    },
    [columnById, editing, rowById]
  );

  const onGridKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (shouldIgnoreGridKey(event)) {
        return;
      }

      const grid = event.currentTarget;
      const currentCell = findCurrentCell(event.target, grid);

      if ((event.key === "Enter" || event.key === "F2") && currentCell) {
        if (startEditingFromCell(currentCell)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (event.key === " " && currentCell) {
        const toggle = currentCell.querySelector<HTMLElement>(".rdtg-groupToggle:not(:disabled)");
        const checkbox = currentCell.querySelector<HTMLElement>(".rdtg-checkbox:not(:disabled)");
        if (toggle || checkbox) {
          event.preventDefault();
          event.stopPropagation();
          (toggle ?? checkbox)?.click();
        }
        return;
      }

      const nextCell = findNextCell(grid, currentCell, event.key, event.ctrlKey || event.metaKey, pageRowStep);
      if (!nextCell) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      focusCell(nextCell);
    },
    [pageRowStep, startEditingFromCell]
  );

  return React.useMemo(
    () => ({ focusInitialCell, onGridKeyDown }),
    [focusInitialCell, onGridKeyDown]
  );
}

function shouldIgnoreGridKey(event: React.KeyboardEvent<HTMLElement>): boolean {
  if (event.altKey || event.shiftKey) {
    return true;
  }

  if (!["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Enter", "F2", "Home", "PageDown", "PageUp", " "].includes(event.key)) {
    return true;
  }

  if (!(event.target instanceof Element)) {
    return true;
  }

  if (event.target.closest(EDITOR_SELECTOR) || event.target.closest(TEXT_INPUT_SELECTOR)) {
    return true;
  }

  const interactive = event.target.closest(INTERACTIVE_SELECTOR);
  if (
    interactive
    && interactive !== event.currentTarget
    && !interactive.matches(PACKAGE_INTERACTIVE_SELECTOR)
    && !interactive.matches(GRID_CELL_SELECTOR)
  ) {
    return true;
  }

  return false;
}

function findCurrentCell(target: EventTarget, grid: HTMLElement): HTMLElement | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  const cell = target.closest<HTMLElement>(GRID_CELL_SELECTOR);
  if (cell && grid.contains(cell)) {
    return cell;
  }

  return undefined;
}

function findNextCell(
  grid: HTMLElement,
  currentCell: HTMLElement | undefined,
  key: string,
  jumpToBoundary: boolean,
  pageRowStep: number
): HTMLElement | undefined {
  const cells = getCells(grid);
  if (cells.length === 0) {
    return undefined;
  }

  if (!currentCell) {
    return cells[0]?.element;
  }

  const current = cells.find((cell) => cell.element === currentCell);
  if (!current) {
    return cells[0]?.element;
  }

  if (key === "Home" && jumpToBoundary) {
    return cells[0]?.element;
  }

  if (key === "End" && jumpToBoundary) {
    return cells[cells.length - 1]?.element;
  }

  if (key === "Home") {
    return firstCellInRow(cells, current.rowIndex)?.element;
  }

  if (key === "End") {
    return lastCellInRow(cells, current.rowIndex)?.element;
  }

  if (key === "ArrowLeft") {
    return adjacentCellInRow(cells, current.rowIndex, current.columnIndex, -1)?.element;
  }

  if (key === "ArrowRight") {
    return adjacentCellInRow(cells, current.rowIndex, current.columnIndex, 1)?.element;
  }

  if (key === "ArrowUp") {
    return nearestCellInNeighborRow(cells, current.rowIndex, current.columnIndex, -1)?.element;
  }

  if (key === "ArrowDown") {
    return nearestCellInNeighborRow(cells, current.rowIndex, current.columnIndex, 1)?.element;
  }

  if (key === "PageUp") {
    return nearestCellByRowOffset(cells, current, -pageRowStep)?.element;
  }

  if (key === "PageDown") {
    return nearestCellByRowOffset(cells, current, pageRowStep)?.element;
  }

  return undefined;
}

function getCells(grid: HTMLElement): IndexedCell[] {
  return Array.from(grid.querySelectorAll<HTMLElement>(GRID_CELL_SELECTOR))
    .map((element) => {
      const row = element.closest<HTMLElement>(GRID_ROW_SELECTOR);
      const rowIndex = Number(row?.getAttribute("aria-rowindex"));
      const columnIndex = Number(element.getAttribute("aria-colindex"));
      if (!Number.isFinite(rowIndex) || !Number.isFinite(columnIndex)) {
        return undefined;
      }
      return { element, rowIndex, columnIndex };
    })
    .filter((cell): cell is IndexedCell => Boolean(cell))
    .sort((a, b) => a.rowIndex - b.rowIndex || a.columnIndex - b.columnIndex);
}

function adjacentCellInRow(
  cells: IndexedCell[],
  rowIndex: number,
  columnIndex: number,
  direction: -1 | 1
): IndexedCell | undefined {
  const rowCells = cells.filter((cell) => cell.rowIndex === rowIndex);
  if (direction === -1) {
    return rowCells.filter((cell) => cell.columnIndex < columnIndex).at(-1);
  }
  return rowCells.find((cell) => cell.columnIndex > columnIndex);
}

function firstCellInRow(cells: IndexedCell[], rowIndex: number): IndexedCell | undefined {
  return cells.find((cell) => cell.rowIndex === rowIndex);
}

function lastCellInRow(cells: IndexedCell[], rowIndex: number): IndexedCell | undefined {
  return cells.filter((cell) => cell.rowIndex === rowIndex).at(-1);
}

function nearestCellInNeighborRow(
  cells: IndexedCell[],
  rowIndex: number,
  columnIndex: number,
  direction: -1 | 1
): IndexedCell | undefined {
  const rowIndexes = Array.from(new Set(cells.map((cell) => cell.rowIndex))).sort((a, b) => a - b);
  const nextRowIndex = direction === -1
    ? rowIndexes.filter((candidate) => candidate < rowIndex).at(-1)
    : rowIndexes.find((candidate) => candidate > rowIndex);

  if (nextRowIndex === undefined) {
    return undefined;
  }

  const rowCells = cells.filter((cell) => cell.rowIndex === nextRowIndex);
  return rowCells.find((cell) => cell.columnIndex === columnIndex)
    ?? rowCells.filter((cell) => cell.columnIndex < columnIndex).at(-1)
    ?? rowCells[0];
}

function nearestCellByRowOffset(
  cells: IndexedCell[],
  current: IndexedCell,
  offset: number
): IndexedCell | undefined {
  const scopedCells = isBodyCell(current.element) ? cells.filter((cell) => isBodyCell(cell.element)) : cells;
  const rowIndexes = Array.from(new Set(scopedCells.map((cell) => cell.rowIndex))).sort((a, b) => a - b);
  const currentPosition = rowIndexes.indexOf(current.rowIndex);
  if (currentPosition === -1) {
    return undefined;
  }

  const targetPosition = clamp(currentPosition + offset, 0, rowIndexes.length - 1);
  const targetRowIndex = rowIndexes[targetPosition];
  const rowCells = scopedCells.filter((cell) => cell.rowIndex === targetRowIndex);

  return rowCells.find((cell) => cell.columnIndex === current.columnIndex)
    ?? rowCells.filter((cell) => cell.columnIndex < current.columnIndex).at(-1)
    ?? rowCells[0];
}

function isBodyCell(cell: HTMLElement): boolean {
  return cell.matches("[role='gridcell'][data-row-id]");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function focusCell(cell: HTMLElement): void {
  const focusTarget = cell.matches("[role='columnheader']")
    ? cell.querySelector<HTMLElement>(".rdtg-headerButton:not(:disabled), .rdtg-filterButton")
    : undefined;

  (focusTarget ?? cell).focus();
}
