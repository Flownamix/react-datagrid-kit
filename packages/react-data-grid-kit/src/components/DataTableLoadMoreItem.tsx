import * as React from "react";
import type { DataTableIcons, DataTableVisibleItem } from "../types";

export interface DataTableLoadMoreRowProps<T> {
  item: Extract<DataTableVisibleItem<T>, { kind: "loadMore" }>;
  columns: number;
  rowIndex: number;
  icons: DataTableIcons;
}

export interface DataTableLoadMoreMobileItemProps<T> {
  item: Extract<DataTableVisibleItem<T>, { kind: "loadMore" }>;
  icons: DataTableIcons;
}

export function DataTableLoadMoreRow<T>({
  item,
  columns,
  rowIndex,
  icons
}: DataTableLoadMoreRowProps<T>): React.ReactElement {
  return (
    <div className="rdtg-loadMoreRow" role="row" aria-rowindex={rowIndex} data-status={item.status} data-scope={item.scope}>
      <div className="rdtg-loadMoreCell" role="gridcell" aria-colindex={1} aria-colspan={columns}>
        <DataTableLoadMoreContent item={item} icons={icons} />
      </div>
    </div>
  );
}

export function DataTableLoadMoreMobileItem<T>({
  item,
  icons
}: DataTableLoadMoreMobileItemProps<T>): React.ReactElement {
  return (
    <div className="rdtg-mobileLoadMore" role="listitem" data-status={item.status} data-scope={item.scope}>
      <DataTableLoadMoreContent item={item} icons={icons} />
    </div>
  );
}

function DataTableLoadMoreContent<T>({
  item,
  icons
}: DataTableLoadMoreMobileItemProps<T>): React.ReactElement {
  const subject = item.scope === "group" ? "group rows" : "rows";

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
