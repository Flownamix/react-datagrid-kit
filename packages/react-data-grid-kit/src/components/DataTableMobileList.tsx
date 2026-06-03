import * as React from "react";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import type {
  DataTableColumn,
  DataTableGroup,
  DataTableGroupHeaderContext,
  DataTableGroupSummary,
  DataTableIcons,
  DataTableRowId,
  DataTableStateLabel,
  DataTableVisibleItem
} from "../types";
import { DataTableStatePanel } from "./DataTableStatePanel";
import { DataTableSelectionCheckbox } from "./DataTableSelectionCheckbox";
import { DataTableMobileGroupHeader } from "./DataTableMobileGroupHeader";
import { DataTableMobileField } from "./DataTableMobileField";
import { eventStartedInInteractiveElement, keyboardEventStartedInChild } from "../utils/interactiveEvents";

export interface DataTableMobileListProps<T> {
  visibleItems: Array<DataTableVisibleItem<T>>;
  contentMotionKey: string;
  renderCard?: (row: T) => React.ReactNode;
  columns: Array<DataTableColumn<T>>;
  icons: DataTableIcons;
  editing: DataTableEditingApi<T>;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  selectedIds: Set<DataTableRowId>;
  selectable: boolean;
  isRowSelectable?: (row: T) => boolean;
  selectionMutable: boolean;
  loading?: boolean;
  error?: boolean;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
  loadingState?: DataTableStateLabel;
  errorState?: DataTableStateLabel;
  emptyState?: DataTableStateLabel;
  rowAriaLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
  onSelectedChange: (rowId: DataTableRowId, checked: boolean) => void;
  collapsedGroupIds: string[];
  onGroupToggle: (groupId: string) => void;
  renderMobileGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
}

export function DataTableMobileList<T>({
  visibleItems,
  contentMotionKey,
  renderCard,
  columns,
  icons,
  editing,
  ariaLabel,
  ariaLabelledBy,
  selectedIds,
  selectable,
  isRowSelectable,
  selectionMutable,
  loading,
  error,
  loadingLabel,
  errorLabel,
  emptyLabel,
  loadingState,
  errorState,
  emptyState,
  rowAriaLabel,
  onRowClick,
  onSelectedChange,
  collapsedGroupIds,
  onGroupToggle,
  renderMobileGroupHeader
}: DataTableMobileListProps<T>): React.ReactElement {
  return (
    <div
      className="rdtg-mobileFrame"
      role="list"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-busy={loading ? "true" : "false"}
    >
      {loading ? (
        <DataTableStatePanel icons={icons} label={loadingLabel} state={loadingState} tone="loading" />
      ) : error ? (
        <DataTableStatePanel icons={icons} label={errorLabel} state={errorState} tone="error" />
      ) : visibleItems.length === 0 ? (
        <DataTableStatePanel icons={icons} label={emptyLabel} state={emptyState} tone="empty" />
      ) : (
        <div key={contentMotionKey} className="rdtg-mobileList">
          {visibleItems.map((item) => {
            if (item.kind === "group") {
              return (
                <DataTableMobileGroupHeader
                  key={item.id}
                  group={item.group}
                  rows={item.rows}
                  collapsed={collapsedGroupIds.includes(item.group.id)}
                  icons={icons}
                  onToggle={onGroupToggle}
                  renderMobileGroupHeader={renderMobileGroupHeader}
                />
              );
            }

            const rowId = item.id;
            const row = item.row;
            const selected = selectedIds.has(rowId);
            const rowSelectable = isRowSelectable?.(row) ?? true;

            return (
              <article
                key={rowId}
                className="rdtg-mobileCard"
                role="listitem"
                aria-label={rowAriaLabel?.(row)}
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
              >
                {selectable ? (
                  <div className="rdtg-mobileSelection" onClick={(event) => event.stopPropagation()}>
                    <DataTableSelectionCheckbox
                      ariaLabel={`Select row ${rowId}`}
                      checked={selected}
                      disabled={!selectionMutable || !rowSelectable}
                      onCheckedChange={(checked) => onSelectedChange(rowId, checked)}
                    />
                  </div>
                ) : null}
                {renderCard ? (
                  renderCard(row)
                ) : (
                  columns
                    .filter((column) => !column.hideOnMobile)
                    .map((column) => (
                      <DataTableMobileField
                        key={column.id}
                        row={row}
                        rowId={rowId}
                        column={column}
                        icons={icons}
                        editing={editing}
                      />
                    ))
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
