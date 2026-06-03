import * as React from "react";
import {
  clampColumnSize,
  columnResizeBounds,
  pinnedCellStyle,
  resolveColumnResizeStartSize,
  type DataTablePinnedLayout
} from "../model/layout";
import { plainText } from "../model/editing";
import type { ColumnDropPlacement } from "../model/columnOrdering";
import type {
  DataTableColumn,
  DataTableColumnSizingState,
  DataTableColumnSizingUpdater,
  DataTableFilterState,
  DataTableIcons,
  DataTableSort
} from "../types";
import { DataTableFilterPopover } from "./DataTableFilterPopover";
import { DataTableSelectionCheckbox } from "./DataTableSelectionCheckbox";
import { cx } from "../utils/cx";

const KEYBOARD_RESIZE_STEP = 16;
const KEYBOARD_RESIZE_LARGE_STEP = 40;

export interface DataTableHeaderProps<T> {
  columns: Array<DataTableColumn<T>>;
  icons: DataTableIcons;
  selectable: boolean;
  hasActions: boolean;
  totalColumnCount: number;
  template: string;
  sort?: DataTableSort;
  manualSorting: boolean;
  filters: DataTableFilterState;
  columnSizing: DataTableColumnSizingState;
  pinned: DataTablePinnedLayout;
  enableColumnReordering: boolean;
  allSelected: boolean;
  partiallySelected: boolean;
  selectionMutable: boolean;
  onSortChange: (column: DataTableColumn<T>) => void;
  onFilterChange: (columnId: string, value: unknown) => void;
  onFilterClear: (columnId: string) => void;
  onColumnReorder: (sourceId: string, targetId: string, placement: ColumnDropPlacement) => void;
  onColumnSizingChange: (sizing: DataTableColumnSizingUpdater) => void;
  onSelectAll: (checked: boolean) => void;
}

export function DataTableHeader<T>({
  columns,
  icons,
  selectable,
  hasActions,
  totalColumnCount,
  template,
  sort,
  manualSorting,
  filters,
  columnSizing,
  pinned,
  enableColumnReordering,
  allSelected,
  partiallySelected,
  selectionMutable,
  onSortChange,
  onFilterChange,
  onFilterClear,
  onColumnReorder,
  onColumnSizingChange,
  onSelectAll
}: DataTableHeaderProps<T>): React.ReactElement {
  const [draggingColumnId, setDraggingColumnId] = React.useState<string | undefined>();
  const [dropTarget, setDropTarget] = React.useState<{ columnId: string; placement: ColumnDropPlacement } | undefined>();

  const clearDragState = React.useCallback(() => {
    setDraggingColumnId(undefined);
    setDropTarget(undefined);
  }, []);

  React.useEffect(() => {
    if (!draggingColumnId) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      setDropTarget(resolvePointerDropTarget({ sourceId: draggingColumnId, clientX: event.clientX, clientY: event.clientY }));
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      const target = resolvePointerDropTarget({ sourceId: draggingColumnId, clientX: event.clientX, clientY: event.clientY });
      if (target) {
        onColumnReorder(draggingColumnId, target.columnId, target.placement);
      }
      clearDragState();
    };

    const handlePointerCancel = () => {
      clearDragState();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });
    document.addEventListener("pointercancel", handlePointerCancel, { once: true });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [clearDragState, draggingColumnId, onColumnReorder]);

  return (
    <div className="rdtg-header" role="rowgroup">
      <div className="rdtg-headerRow" role="row" aria-rowindex={1} style={{ gridTemplateColumns: template }}>
        {selectable ? (
          <div
            className="rdtg-headerCell rdtg-selectionCell"
            role="columnheader"
            aria-colindex={1}
            data-rdtg-grid-cell="true"
            data-pinned={pinned.selection ? "true" : undefined}
            data-pin-side={pinned.selection?.side}
            data-pin-edge={pinned.selection?.edge ? "true" : undefined}
            tabIndex={-1}
            style={pinnedCellStyle(pinned.selection)}
          >
            <DataTableSelectionCheckbox
              ariaLabel="Select all visible rows"
              checked={allSelected}
              indeterminate={partiallySelected}
              disabled={!selectionMutable}
              onCheckedChange={onSelectAll}
            />
          </div>
        ) : null}
        {columns.map((column, columnIndex) => {
          const sortingEnabled = Boolean(column.sortable && (manualSorting || column.sortAccessor));
          const direction = sortingEnabled && sort?.columnId === column.id ? sort.direction : "none";
          const ariaColumnIndex = columnIndex + (selectable ? 2 : 1);
          const pinnedCell = pinned.columns[column.id];
          const reorderable = enableColumnReordering && column.reorderable !== false;
          const targetPlacement = dropTarget?.columnId === column.id ? dropTarget.placement : undefined;
          return (
            <div
              key={column.id}
              className={cx("rdtg-headerCell", `rdtg-align-${column.align ?? "start"}`)}
              role="columnheader"
              aria-colindex={ariaColumnIndex}
              aria-sort={direction === "none" ? "none" : direction}
              data-column-id={column.id}
              data-pinned={pinnedCell ? "true" : undefined}
              data-pin-side={pinnedCell?.side}
              data-pin-edge={pinnedCell?.edge ? "true" : undefined}
              data-reorderable={reorderable ? "true" : undefined}
              data-dragging={draggingColumnId === column.id ? "true" : undefined}
              data-drop-target={targetPlacement ? "true" : undefined}
              data-drop-placement={targetPlacement}
              data-rdtg-grid-cell="true"
              tabIndex={-1}
              style={pinnedCellStyle(pinnedCell)}
            >
              {reorderable ? (
                <button
                  type="button"
                  className="rdtg-reorderHandle"
                  aria-label={`Reorder ${plainText(column.header)}`}
                  title={`Drag to reorder ${plainText(column.header)}`}
                  onClick={(event) => event.preventDefault()}
                  onPointerDown={(event) => {
                    if (event.button !== 0) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    setDraggingColumnId(column.id);
                    setDropTarget(undefined);
                  }}
                >
                  <span aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                className="rdtg-headerButton"
                disabled={!sortingEnabled}
                onClick={() => onSortChange(column)}
              >
                <span className="rdtg-headerLabel">{column.header}</span>
                {sortingEnabled ? <icons.Sort direction={direction} aria-hidden="true" /> : null}
              </button>
              {column.filterControl ? (
                <DataTableFilterPopover
                  column={column}
                  filters={filters}
                  icons={icons}
                  onFilterChange={onFilterChange}
                  onFilterClear={onFilterClear}
                />
              ) : null}
              {column.resizable ? (
                <DataTableColumnResizeHandle
                  column={column}
                  columnSizing={columnSizing}
                  label={plainText(column.header) === "cell" ? column.id : plainText(column.header)}
                  onColumnSizingChange={onColumnSizingChange}
                />
              ) : null}
            </div>
          );
        })}
        {hasActions ? (
          <div
            className="rdtg-headerCell rdtg-actionCell"
            role="columnheader"
            aria-label="Actions"
            aria-colindex={totalColumnCount}
            data-rdtg-grid-cell="true"
            data-pinned={pinned.actions ? "true" : undefined}
            data-pin-side={pinned.actions?.side}
            data-pin-edge={pinned.actions?.edge ? "true" : undefined}
            tabIndex={-1}
            style={pinnedCellStyle(pinned.actions)}
          />
        ) : null}
      </div>
    </div>
  );
}

function dropPlacementForEvent(element: HTMLElement, clientX: number): ColumnDropPlacement {
  const rect = element.getBoundingClientRect();
  return clientX > rect.left + rect.width / 2 ? "after" : "before";
}

function resolvePointerDropTarget({
  sourceId,
  clientX,
  clientY
}: {
  sourceId: string;
  clientX: number;
  clientY: number;
}): { columnId: string; placement: ColumnDropPlacement } | undefined {
  const element = document.elementFromPoint(clientX, clientY);
  const headerCell = element?.closest<HTMLElement>(".rdtg-headerCell[data-column-id]");
  const columnId = headerCell?.dataset.columnId;

  if (!headerCell || !columnId || columnId === sourceId || headerCell.dataset.reorderable !== "true") {
    return undefined;
  }

  return {
    columnId,
    placement: dropPlacementForEvent(headerCell, clientX)
  };
}

function DataTableColumnResizeHandle<T>({
  column,
  columnSizing,
  label,
  onColumnSizingChange
}: {
  column: DataTableColumn<T>;
  columnSizing: DataTableColumnSizingState;
  label: string;
  onColumnSizingChange: (sizing: DataTableColumnSizingUpdater) => void;
}): React.ReactElement {
  const [resizing, setResizing] = React.useState(false);
  const dragRef = React.useRef<{ startX: number; startSize: number } | undefined>(undefined);
  const { min, max } = columnResizeBounds(column);
  const currentSize = resolveColumnResizeStartSize({ column, columnSizing });

  const setColumnSize = React.useCallback(
    (size: number) => {
      onColumnSizingChange((current) => ({
        ...current,
        [column.id]: clampColumnSize(column, size)
      }));
    },
    [column, onColumnSizingChange]
  );

  React.useEffect(() => {
    if (!resizing) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      setColumnSize(drag.startSize + event.clientX - drag.startX);
    };
    const handlePointerUp = () => {
      dragRef.current = undefined;
      setResizing(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizing, setColumnSize]);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const headerCell = event.currentTarget.closest(".rdtg-headerCell");
      const measuredSize = headerCell instanceof HTMLElement ? headerCell.getBoundingClientRect().width : undefined;
      dragRef.current = {
        startX: event.clientX,
        startSize: resolveColumnResizeStartSize({ column, columnSizing, measuredSize })
      };
      setResizing(true);
    },
    [column, columnSizing]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Home") {
        setColumnSize(min);
        return;
      }

      if (event.key === "End") {
        setColumnSize(max);
        return;
      }

      const step = event.shiftKey ? KEYBOARD_RESIZE_LARGE_STEP : KEYBOARD_RESIZE_STEP;
      setColumnSize(currentSize + (event.key === "ArrowRight" ? step : -step));
    },
    [currentSize, max, min, setColumnSize]
  );

  return (
    <button
      type="button"
      className="rdtg-resizeHandle"
      role="separator"
      aria-label={`Resize ${label}`}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={currentSize}
      data-resizing={resizing ? "true" : undefined}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <span aria-hidden="true" />
    </button>
  );
}
