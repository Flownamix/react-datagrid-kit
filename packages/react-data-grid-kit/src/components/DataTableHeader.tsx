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
const COLUMN_REORDER_ACTIVATION_DISTANCE = 4;
const COLUMN_REORDER_EDGE_SCROLL_ZONE = 36;
const COLUMN_REORDER_MAX_SCROLL_STEP = 18;

type ColumnPinRegion = "left" | "center" | "right";

interface ColumnDragSession {
  active: boolean;
  currentX: number;
  currentY: number;
  sourceId: string;
  sourceLabel: string;
  sourceRegion: ColumnPinRegion;
  startX: number;
  startY: number;
}

interface ColumnDropTarget {
  columnId: string;
  destinationColumnId: string;
  placement: ColumnDropPlacement;
  valid: boolean;
}

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
  const [dragSession, setDragSession] = React.useState<ColumnDragSession | undefined>();
  const [dropTarget, setDropTarget] = React.useState<ColumnDropTarget | undefined>();
  const desktopFrameRef = React.useRef<HTMLElement | undefined>(undefined);
  const columnRegions = React.useMemo(() => {
    const regions = new Map<string, ColumnPinRegion>();
    columns.forEach((column) => {
      regions.set(column.id, pinned.columns[column.id]?.side ?? "center");
    });
    return regions;
  }, [columns, pinned.columns]);
  const orderedColumnIds = React.useMemo(() => columns.map((column) => column.id), [columns]);
  const activeDragSession = dragSession?.active ? dragSession : undefined;
  const dragActive = Boolean(activeDragSession);

  const clearDragState = React.useCallback(() => {
    setDragSession(undefined);
    setDropTarget(undefined);
    desktopFrameRef.current = undefined;
  }, []);

  React.useEffect(() => {
    if (!dragActive || typeof document === "undefined") {
      return undefined;
    }

    document.body.dataset.rdtgReorderDragging = "true";

    return () => {
      delete document.body.dataset.rdtgReorderDragging;
    };
  }, [dragActive]);

  React.useEffect(() => {
    if (!dragSession) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const active = dragSession.active || pointerDistance(dragSession.startX, dragSession.startY, event.clientX, event.clientY) >= COLUMN_REORDER_ACTIVATION_DISTANCE;
      const nextSession = {
        ...dragSession,
        active,
        currentX: event.clientX,
        currentY: event.clientY
      };

      setDragSession(nextSession);

      if (!active) {
        setDropTarget(undefined);
        return;
      }

      scrollFrameNearHorizontalEdge(desktopFrameRef.current, event.clientX);
      setDropTarget(resolvePointerDropTarget({
        columnRegions,
        clientX: event.clientX,
        clientY: event.clientY,
        orderedColumnIds,
        sourceId: dragSession.sourceId,
        sourceRegion: dragSession.sourceRegion
      }));
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      const active = dragSession.active || pointerDistance(dragSession.startX, dragSession.startY, event.clientX, event.clientY) >= COLUMN_REORDER_ACTIVATION_DISTANCE;
      const target = active
        ? resolvePointerDropTarget({
          columnRegions,
          clientX: event.clientX,
          clientY: event.clientY,
          orderedColumnIds,
          sourceId: dragSession.sourceId,
          sourceRegion: dragSession.sourceRegion
        })
        : undefined;

      if (target?.valid) {
        onColumnReorder(dragSession.sourceId, target.destinationColumnId, target.placement);
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
  }, [clearDragState, columnRegions, dragSession, onColumnReorder, orderedColumnIds]);

  return (
    <div className="rdtg-header" role="rowgroup" data-reorder-dragging={activeDragSession ? "true" : undefined}>
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
          const target = dropTarget?.columnId === column.id ? dropTarget : undefined;
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
              data-dragging={activeDragSession?.sourceId === column.id ? "true" : undefined}
              data-drop-target={target ? "true" : undefined}
              data-drop-destination={dropTarget?.valid && dropTarget.destinationColumnId === column.id ? "true" : undefined}
              data-drop-placement={target?.placement}
              data-drop-valid={target ? String(target.valid) : undefined}
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
                    desktopFrameRef.current = event.currentTarget.closest<HTMLElement>(".rdtg-desktopFrame") ?? undefined;
                    setDragSession({
                      active: false,
                      currentX: event.clientX,
                      currentY: event.clientY,
                      sourceId: column.id,
                      sourceLabel: plainText(column.header),
                      sourceRegion: columnRegions.get(column.id) ?? "center",
                      startX: event.clientX,
                      startY: event.clientY
                    });
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
      {activeDragSession ? (
        <div
          aria-hidden="true"
          className="rdtg-reorderPreview"
          style={{
            transform: `translate3d(${activeDragSession.currentX + 12}px, ${activeDragSession.currentY + 12}px, 0)`
          }}
        >
          {activeDragSession.sourceLabel}
        </div>
      ) : null}
    </div>
  );
}

function resolvePointerDropTarget({
  columnRegions,
  sourceId,
  sourceRegion,
  clientX,
  clientY,
  orderedColumnIds
}: {
  columnRegions: Map<string, ColumnPinRegion>;
  sourceId: string;
  sourceRegion: ColumnPinRegion;
  clientX: number;
  clientY: number;
  orderedColumnIds: string[];
}): ColumnDropTarget | undefined {
  if (typeof document.elementFromPoint !== "function") {
    return undefined;
  }

  const element = document.elementFromPoint(clientX, clientY);
  const headerCell = element?.closest<HTMLElement>(".rdtg-headerCell[data-column-id]");
  const columnId = headerCell?.dataset.columnId;

  if (!headerCell || !columnId || columnId === sourceId || headerCell.dataset.reorderable !== "true") {
    return undefined;
  }

  const placement = dropPlacementForHoveredColumnSlot({ orderedColumnIds, sourceId, targetId: columnId });
  if (!placement) {
    return undefined;
  }

  const targetRegion = columnRegions.get(columnId) ?? "center";
  if (targetRegion !== sourceRegion) {
    return {
      columnId,
      destinationColumnId: columnId,
      placement,
      valid: false
    };
  }

  return {
    columnId,
    destinationColumnId: columnId,
    placement,
    valid: true
  };
}

function dropPlacementForHoveredColumnSlot({
  orderedColumnIds,
  sourceId,
  targetId
}: {
  orderedColumnIds: string[];
  sourceId: string;
  targetId: string;
}): ColumnDropPlacement | undefined {
  const sourceIndex = orderedColumnIds.indexOf(sourceId);
  const targetIndex = orderedColumnIds.indexOf(targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return undefined;
  }

  return targetIndex > sourceIndex ? "after" : "before";
}

function pointerDistance(startX: number, startY: number, currentX: number, currentY: number): number {
  return Math.hypot(currentX - startX, currentY - startY);
}

function scrollFrameNearHorizontalEdge(frame: HTMLElement | undefined, clientX: number): void {
  if (!frame) {
    return;
  }

  const delta = horizontalEdgeScrollDelta(frame, clientX);
  if (delta !== 0) {
    frame.scrollLeft += delta;
  }
}

function horizontalEdgeScrollDelta(frame: HTMLElement, clientX: number): number {
  const rect = frame.getBoundingClientRect();
  const maxScrollLeft = Math.max(0, frame.scrollWidth - frame.clientWidth);

  if (maxScrollLeft <= 0) {
    return 0;
  }

  const leftDistance = clientX - rect.left;
  if (leftDistance < COLUMN_REORDER_EDGE_SCROLL_ZONE && frame.scrollLeft > 0) {
    return -edgeScrollStep(leftDistance);
  }

  const rightDistance = rect.right - clientX;
  if (rightDistance < COLUMN_REORDER_EDGE_SCROLL_ZONE && frame.scrollLeft < maxScrollLeft) {
    return edgeScrollStep(rightDistance);
  }

  return 0;
}

function edgeScrollStep(distanceFromEdge: number): number {
  const intensity = (COLUMN_REORDER_EDGE_SCROLL_ZONE - Math.max(0, distanceFromEdge)) / COLUMN_REORDER_EDGE_SCROLL_ZONE;
  return Math.ceil(intensity * COLUMN_REORDER_MAX_SCROLL_STEP);
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
