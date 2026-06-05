import * as React from "react";
import type { DataTableIcons, DataTableProps, DataTableVisibleItem } from "../types";

export interface DataTableLoadMoreRowProps<T> {
  item: Extract<DataTableVisibleItem<T>, { kind: "loadMore" }>;
  columns: number;
  rowIndex: number;
  icons: DataTableIcons;
  renderLoadMore?: NonNullable<DataTableProps<T>["serverVirtualization"]>["renderLoadMore"];
}

export interface DataTableLoadMoreMobileItemProps<T> {
  item: Extract<DataTableVisibleItem<T>, { kind: "loadMore" }>;
  icons: DataTableIcons;
  renderLoadMore?: NonNullable<DataTableProps<T>["serverVirtualization"]>["renderLoadMore"];
}

export function DataTableLoadMoreRow<T>({
  item,
  columns,
  rowIndex,
  icons,
  renderLoadMore
}: DataTableLoadMoreRowProps<T>): React.ReactElement {
  return (
    <div className="rdtg-loadMoreRow" role="row" aria-rowindex={rowIndex} data-status={item.status} data-scope={item.scope}>
      <div className="rdtg-loadMoreCell" role="gridcell" aria-colindex={1} aria-colspan={columns}>
        <DataTableLoadMoreContent item={item} icons={icons} renderLoadMore={renderLoadMore} />
      </div>
    </div>
  );
}

export function DataTableLoadMoreMobileItem<T>({
  item,
  icons,
  renderLoadMore
}: DataTableLoadMoreMobileItemProps<T>): React.ReactElement {
  return (
    <div className="rdtg-mobileLoadMore" role="listitem" data-status={item.status} data-scope={item.scope}>
      <DataTableLoadMoreContent item={item} icons={icons} renderLoadMore={renderLoadMore} />
    </div>
  );
}

function DataTableLoadMoreContent<T>({
  item,
  icons,
  renderLoadMore
}: DataTableLoadMoreMobileItemProps<T>): React.ReactElement {
  const subject = item.scope === "group" ? "group rows" : "rows";
  const defaultContent = defaultLoadMoreContent({ item, icons, subject });

  if (renderLoadMore) {
    return (
      <>
        {renderLoadMore({
          scope: item.scope,
          status: item.status,
          group: item.group,
          groupId: item.groupId,
          rowCount: item.rowCount,
          error: item.error,
          defaultContent
        })}
      </>
    );
  }

  return defaultContent;
}

function defaultLoadMoreContent<T>({
  item,
  icons,
  subject
}: DataTableLoadMoreMobileItemProps<T> & { subject: string }): React.ReactElement {
  if (item.status === "error") {
    return (
      <div className="rdtg-loadMoreContent" role="status">
        <span className="rdtg-loadMoreTitle">{item.error ?? `More ${subject} could not be loaded.`}</span>
      </div>
    );
  }

  if (item.status === "loading") {
    return (
      <div className="rdtg-loadMoreContent" role="status">
        <icons.Loading aria-hidden="true" />
        <span className="rdtg-loadMoreTitle">Loading more {subject}</span>
      </div>
    );
  }

  return (
    <div className="rdtg-loadMoreContent" role="status">
      <span className="rdtg-loadMoreTitle">End of {subject}</span>
    </div>
  );
}
