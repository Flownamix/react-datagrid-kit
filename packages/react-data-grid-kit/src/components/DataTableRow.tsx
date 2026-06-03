import * as React from "react";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import { columnClassName, pinnedCellStyle, type DataTablePinnedLayout } from "../model/layout";
import { isColumnEditable, plainText, resolveEditValue } from "../model/editing";
import type { DataTableColumn, DataTableIcons, DataTableRowId } from "../types";
import { cx } from "../utils/cx";
import { eventStartedInInteractiveElement, keyboardEventStartedInChild } from "../utils/interactiveEvents";
import { DataTableEditCell } from "./DataTableEditCell";
import { DataTableSelectionCheckbox } from "./DataTableSelectionCheckbox";

export interface DataTableRowProps<T> {
  row: T;
  rowId: DataTableRowId;
  columns: Array<DataTableColumn<T>>;
  icons: DataTableIcons;
  editing: DataTableEditingApi<T>;
  pinned: DataTablePinnedLayout;
  template: string;
  rowIndex: number;
  columnStartIndex: number;
  totalColumnCount: number;
  selectable: boolean;
  rowSelectable: boolean;
  selected: boolean;
  selectionMutable: boolean;
  hasActions: boolean;
  rowAriaLabel?: (row: T) => string;
  onSelectedChange: (rowId: DataTableRowId, checked: boolean) => void;
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  renderRowActions?: (row: T) => React.ReactNode;
}

export function DataTableRow<T>({
  row,
  rowId,
  columns,
  icons,
  editing,
  pinned,
  template,
  rowIndex,
  columnStartIndex,
  totalColumnCount,
  selectable,
  rowSelectable,
  selected,
  selectionMutable,
  hasActions,
  rowAriaLabel,
  onSelectedChange,
  onRowClick,
  onRowContextMenu,
  renderRowActions
}: DataTableRowProps<T>): React.ReactElement {
  return (
    <div
      className="rdtg-row"
      role="row"
      aria-rowindex={rowIndex}
      aria-label={rowAriaLabel?.(row)}
      aria-selected={selected}
      style={{ gridTemplateColumns: template }}
      data-selected={selected ? "true" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onClick={(event) => {
        if (eventStartedInInteractiveElement(event)) {
          return;
        }
        onRowClick?.(row);
      }}
      onKeyDown={(event) => {
        if (!onRowClick) {
          return;
        }
        if (keyboardEventStartedInChild(event)) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRowClick(row);
        }
      }}
      onContextMenu={(event) => onRowContextMenu?.(row, event)}
    >
      {selectable ? (
        <div
          className="rdtg-cell rdtg-selectionCell"
          role="gridcell"
          aria-colindex={1}
          data-row-id={rowId}
          data-pinned={pinned.selection ? "true" : undefined}
          data-pin-side={pinned.selection?.side}
          data-pin-edge={pinned.selection?.edge ? "true" : undefined}
          data-rdtg-grid-cell="true"
          tabIndex={-1}
          style={pinnedCellStyle(pinned.selection)}
          onClick={(event) => event.stopPropagation()}
        >
          <DataTableSelectionCheckbox
            ariaLabel={`Select row ${rowId}`}
            checked={selected}
            disabled={!selectionMutable || !rowSelectable}
            onCheckedChange={(checked) => onSelectedChange(rowId, checked)}
          />
        </div>
      ) : null}
      {columns.map((column, columnIndex) => {
        const editable = isColumnEditable(column, row, rowId);
        const editingThisCell = editing.editingCell?.rowId === rowId && editing.editingCell.columnId === column.id;
        const editValue = editing.draftInitialized ? editing.draftValue : resolveEditValue(column, row, rowId);
        const ariaColumnIndex = columnStartIndex + columnIndex;
        const pinnedCell = pinned.columns[column.id];

        return (
          <div
            key={column.id}
            className={cx(
              "rdtg-cell",
              editable ? "rdtg-cellEditable" : undefined,
              editingThisCell ? "rdtg-cellEditing" : undefined,
              `rdtg-align-${column.align ?? "start"}`,
              columnClassName(column, row)
            )}
            role="gridcell"
            aria-colindex={ariaColumnIndex}
            tabIndex={-1}
            data-row-id={rowId}
            data-column-id={column.id}
            data-pinned={pinnedCell ? "true" : undefined}
            data-pin-side={pinnedCell?.side}
            data-pin-edge={pinnedCell?.edge ? "true" : undefined}
            data-editable={editable ? "true" : undefined}
            data-editing={editingThisCell ? "true" : undefined}
            data-rdtg-grid-cell="true"
            style={pinnedCellStyle(pinnedCell)}
            onDoubleClick={(event) => {
              if (editable && !eventStartedInInteractiveElement(event)) {
                editing.startEditing(row, rowId, column, "desktop");
              }
            }}
          >
            {editingThisCell && column.renderEditCell ? (
              <DataTableEditCell
                row={row}
                rowId={rowId}
                column={column}
                value={editValue}
                setValue={editing.setDraftValue}
                commit={(value) => editing.commitEditing(row, rowId, column, value)}
                cancel={editing.cancelEditing}
                pending={editing.commitPending}
                error={editing.commitError}
                autoFocus={editing.editingSource === undefined || editing.editingSource === "desktop"}
              />
            ) : (
              <>
                {column.renderCell(row, { row, rowId, column })}
                {editable ? (
                  <button
                    type="button"
                    className="rdtg-editTrigger"
                    aria-label={`Edit ${plainText(column.header)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      editing.startEditing(row, rowId, column, "desktop");
                    }}
                  >
                    <icons.Edit aria-hidden="true" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        );
      })}
      {hasActions ? (
        <div
          className="rdtg-cell rdtg-actionCell"
          role="gridcell"
          aria-colindex={totalColumnCount}
          data-row-id={rowId}
          data-pinned={pinned.actions ? "true" : undefined}
          data-pin-side={pinned.actions?.side}
          data-pin-edge={pinned.actions?.edge ? "true" : undefined}
          data-rdtg-grid-cell="true"
          tabIndex={-1}
          style={pinnedCellStyle(pinned.actions)}
          onClick={(event) => event.stopPropagation()}
        >
          {renderRowActions?.(row) ?? <icons.More aria-hidden="true" />}
        </div>
      ) : null}
    </div>
  );
}
