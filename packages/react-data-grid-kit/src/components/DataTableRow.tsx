import * as React from "react";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import { columnClassName, pinnedCellStyle, type DataTablePinnedLayout } from "../model/layout";
import { isColumnEditable, plainText, resolveEditValue } from "../model/editing";
import type {
  DataTableColumn,
  DataTableIcons,
  DataTableResponsiveRowsConfig,
  DataTableRowId
} from "../types";
import { cx } from "../utils/cx";
import { eventStartedInInteractiveElement, keyboardEventStartedInChild } from "../utils/interactiveEvents";
import { DataTableEditCell } from "./DataTableEditCell";
import { DataTableSelectionCheckbox } from "./DataTableSelectionCheckbox";

export interface DataTableRowProps<T> {
  row: T;
  rowId: DataTableRowId;
  columns: Array<DataTableColumn<T>>;
  detailColumns: Array<DataTableColumn<T>>;
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
  hasExpander: boolean;
  expanded: boolean;
  rowAriaLabel?: (row: T) => string;
  onSelectedChange: (rowId: DataTableRowId, checked: boolean) => void;
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  onExpandedChange: (rowId: DataTableRowId) => void;
  renderRowActions?: (row: T) => React.ReactNode;
  renderResponsiveDetails?: DataTableResponsiveRowsConfig<T>["renderDetails"];
}

export function DataTableRow<T>({
  row,
  rowId,
  columns,
  detailColumns,
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
  hasExpander,
  expanded,
  rowAriaLabel,
  onSelectedChange,
  onRowClick,
  onRowContextMenu,
  onExpandedChange,
  renderRowActions,
  renderResponsiveDetails
}: DataTableRowProps<T>): React.ReactElement {
  const generatedDetailsId = React.useId();
  const detailsId = `rdtg-row-details-${generatedDetailsId}`;
  const activateRow = React.useCallback(() => {
    if (hasExpander) {
      onExpandedChange(rowId);
    }
    onRowClick?.(row);
  }, [hasExpander, onExpandedChange, onRowClick, row, rowId]);

  return (
    <div className="rdtg-rowBundle" data-expanded={expanded ? "true" : undefined}>
      <div
        className="rdtg-row"
        role="row"
        aria-rowindex={rowIndex}
        aria-label={rowAriaLabel?.(row)}
        aria-selected={selected}
        aria-expanded={hasExpander ? expanded : undefined}
        aria-controls={hasExpander ? detailsId : undefined}
        style={{ gridTemplateColumns: template }}
        data-selected={selected ? "true" : undefined}
        tabIndex={onRowClick || hasExpander ? 0 : undefined}
        onClick={(event) => {
          if (eventStartedInInteractiveElement(event)) {
            return;
          }
          activateRow();
        }}
        onKeyDown={(event) => {
          if (!onRowClick && !hasExpander) {
            return;
          }
          if (keyboardEventStartedInChild(event)) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activateRow();
          }
        }}
        onContextMenu={(event) => onRowContextMenu?.(row, event)}
      >
        {hasExpander ? (
          <div
            className="rdtg-cell rdtg-expanderCell"
            role="gridcell"
            aria-colindex={1}
            data-row-id={rowId}
            data-pinned={pinned.expander ? "true" : undefined}
            data-pin-side={pinned.expander?.side}
            data-pin-edge={pinned.expander?.edge ? "true" : undefined}
            data-rdtg-grid-cell="true"
            tabIndex={-1}
            style={pinnedCellStyle(pinned.expander)}
          >
            <button
              type="button"
              className="rdtg-rowExpandButton"
              aria-controls={detailsId}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} row details`}
              onClick={(event) => {
                event.stopPropagation();
                onExpandedChange(rowId);
              }}
            >
              <icons.Expand expanded={expanded} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {selectable ? (
        <div
          className="rdtg-cell rdtg-selectionCell"
          role="gridcell"
          aria-colindex={hasExpander ? 2 : 1}
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
      {hasExpander && expanded ? (
        <div
          id={detailsId}
          className="rdtg-responsiveDetails"
          role="region"
          aria-label="Additional row details"
        >
          {renderResponsiveDetails
            ? renderResponsiveDetails({ row, rowId, columns: detailColumns })
            : detailColumns.map((column) => (
              <div key={column.id} className="rdtg-responsiveDetailField">
                <div className="rdtg-responsiveDetailLabel">{column.detailLabel ?? column.header}</div>
                <div className="rdtg-responsiveDetailValue">
                  {column.renderCell(row, { row, rowId, column })}
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}
