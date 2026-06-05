import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DataTableEditingApi } from "../hooks/useDataTableEditing";
import type { DataTableVirtualItem } from "../hooks/useDataTableModel";
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
import { DataTableLoadMoreMobileItem } from "./DataTableLoadMoreItem";
import { eventStartedInInteractiveElement, keyboardEventStartedInChild } from "../utils/interactiveEvents";

export interface DataTableMobileListProps<T> {
  visibleItems: Array<DataTableVisibleItem<T>>;
  contentMotionKey: string;
  mobileHeight: number;
  rowHeight: number;
  groupHeight: number;
  overscan: number;
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
  onVirtualItemsChange?: (virtualItems: Array<DataTableVirtualItem>) => void;
  renderMobileGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
}

export function DataTableMobileList<T>({
  visibleItems,
  contentMotionKey,
  mobileHeight,
  rowHeight,
  groupHeight,
  overscan,
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
  onVirtualItemsChange,
  renderMobileGroupHeader
}: DataTableMobileListProps<T>): React.ReactElement {
  const parentRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual owns the mobile item measurement lifecycle.
  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => estimateMobileItemSize(visibleItems[index], rowHeight, groupHeight),
    initialRect: { height: mobileHeight, width: 360 },
    measureElement: (element) => {
      const measured = element.getBoundingClientRect().height;
      if (measured > 0) {
        return measured;
      }

      return Number((element as HTMLElement).dataset.estimateSize) || rowHeight;
    },
    overscan
  });
  const measuredVirtualItems = virtualizer.getVirtualItems();
  const renderedVirtualItems: Array<DataTableVirtualItem> = measuredVirtualItems.length > 0
    ? measuredVirtualItems
    : visibleItems.map((item, index) => ({
      key: item.id,
      index,
      start: offsetForMobileIndex(visibleItems, index, rowHeight, groupHeight)
    }));
  const renderedVirtualItemsKey = renderedVirtualItems
    .map((item) => `${item.index}:${item.start}`)
    .join("|");
  const notifiedVirtualItemsKeyRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (notifiedVirtualItemsKeyRef.current === renderedVirtualItemsKey) {
      return;
    }

    notifiedVirtualItemsKeyRef.current = renderedVirtualItemsKey;
    onVirtualItemsChange?.(renderedVirtualItems);
  }, [onVirtualItemsChange, renderedVirtualItems, renderedVirtualItemsKey]);

  return (
    <div
      ref={parentRef}
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
        <div key={contentMotionKey} className="rdtg-mobileList rdtg-mobileVirtualSpace" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {renderedVirtualItems.map((virtualItem) => {
            const item = visibleItems[virtualItem.index];
            if (!item) {
              return null;
            }
            const estimatedSize = estimateMobileItemSize(item, rowHeight, groupHeight);

            return (
              <div
                key={`${item.kind}:${item.id}`}
                ref={virtualizer.measureElement}
                className="rdtg-mobileVirtualItem"
                data-index={virtualItem.index}
                data-kind={item.kind}
                data-estimate-size={estimatedSize}
                style={{ top: `${virtualItem.start}px` }}
              >
                <MobileVisibleItem
                  item={item}
                  renderCard={renderCard}
                  columns={columns}
                  icons={icons}
                  editing={editing}
                  selectedIds={selectedIds}
                  selectable={selectable}
                  isRowSelectable={isRowSelectable}
                  selectionMutable={selectionMutable}
                  rowAriaLabel={rowAriaLabel}
                  onRowClick={onRowClick}
                  onSelectedChange={onSelectedChange}
                  collapsedGroupIds={collapsedGroupIds}
                  onGroupToggle={onGroupToggle}
                  renderMobileGroupHeader={renderMobileGroupHeader}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MobileVisibleItemProps<T> {
  item: DataTableVisibleItem<T>;
  renderCard?: (row: T) => React.ReactNode;
  columns: Array<DataTableColumn<T>>;
  icons: DataTableIcons;
  editing: DataTableEditingApi<T>;
  selectedIds: Set<DataTableRowId>;
  selectable: boolean;
  isRowSelectable?: (row: T) => boolean;
  selectionMutable: boolean;
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

function MobileVisibleItem<T>({
  item,
  renderCard,
  columns,
  icons,
  editing,
  selectedIds,
  selectable,
  isRowSelectable,
  selectionMutable,
  rowAriaLabel,
  onRowClick,
  onSelectedChange,
  collapsedGroupIds,
  onGroupToggle,
  renderMobileGroupHeader
}: MobileVisibleItemProps<T>): React.ReactElement {
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

            if (item.kind === "loadMore") {
              return <DataTableLoadMoreMobileItem item={item} icons={icons} />;
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
}

function estimateMobileItemSize<T>(
  item: DataTableVisibleItem<T> | undefined,
  rowHeight: number,
  groupHeight: number
): number {
  if (item?.kind === "group") {
    return Math.max(groupHeight, 64);
  }

  if (item?.kind === "loadMore") {
    return Math.max(rowHeight, 52);
  }

  return Math.max(rowHeight, 96);
}

function offsetForMobileIndex<T>(
  items: Array<DataTableVisibleItem<T>>,
  index: number,
  rowHeight: number,
  groupHeight: number
): number {
  let offset = 0;
  for (let cursor = 0; cursor < index; cursor += 1) {
    offset += estimateMobileItemSize(items[cursor], rowHeight, groupHeight);
  }
  return offset;
}
