import * as React from "react";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import { isColumnEditable, plainText, resolveEditValue } from "../model/editing";
import type { DataTableColumn, DataTableIcons, DataTableRowId } from "../types";
import { cx } from "../utils/cx";
import { DataTableEditCell } from "./DataTableEditCell";

export interface DataTableMobileFieldProps<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
  icons: DataTableIcons;
  editing: DataTableEditingApi<T>;
}

export function DataTableMobileField<T>({
  row,
  rowId,
  column,
  icons,
  editing
}: DataTableMobileFieldProps<T>): React.ReactElement {
  const editable = isColumnEditable(column, row, rowId);
  const editingThisCell = editing.editingCell?.rowId === rowId && editing.editingCell.columnId === column.id;
  const editValue = editing.draftInitialized ? editing.draftValue : resolveEditValue(column, row, rowId);

  return (
    <div
      className={cx(
        "rdtg-mobileField",
        editable ? "rdtg-mobileFieldEditable" : undefined,
        editingThisCell ? "rdtg-mobileFieldEditing" : undefined
      )}
      data-column-id={column.id}
      data-editable={editable ? "true" : undefined}
      data-editing={editingThisCell ? "true" : undefined}
    >
      <div className="rdtg-mobileFieldHeader">
        <span className="rdtg-mobileLabel">{column.header}</span>
        {editable && !editingThisCell ? (
          <button
            type="button"
            className="rdtg-editTrigger rdtg-mobileEditTrigger"
            aria-label={`Edit ${plainText(column.header)}`}
            onClick={(event) => {
              event.stopPropagation();
              editing.startEditing(row, rowId, column, "mobile");
            }}
          >
            <icons.Edit aria-hidden="true" />
          </button>
        ) : null}
      </div>
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
          autoFocus={editing.editingSource === undefined || editing.editingSource === "mobile"}
        />
      ) : (
        <div className="rdtg-mobileValue">{column.renderCell(row, { row, rowId, column })}</div>
      )}
    </div>
  );
}
