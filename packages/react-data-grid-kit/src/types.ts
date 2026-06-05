import type * as React from "react";

export type DataTableRowId = string;
export type DataTableSortDirection = "ascending" | "descending";
export type DataTableDensity = "compact" | "comfortable";
export type DataTableMotionPreference = "system" | "always" | "reduced";
export type DataTableGroupState = "loaded" | "loading" | "error" | "empty" | "partial";
export type DataTableFilterState = Record<string, unknown>;
export type DataTableQuickSearchUpdater = string | ((current: string) => string);
export type DataTableColumnVisibilityState = Record<string, boolean>;
export type DataTableColumnVisibilityUpdater =
  | DataTableColumnVisibilityState
  | ((current: DataTableColumnVisibilityState) => DataTableColumnVisibilityState);
export type DataTableColumnOrderState = string[];
export type DataTableColumnOrderUpdater =
  | DataTableColumnOrderState
  | ((current: DataTableColumnOrderState) => DataTableColumnOrderState);
export type DataTableColumnSizingState = Record<string, number>;
export type DataTableColumnSizingUpdater =
  | DataTableColumnSizingState
  | ((current: DataTableColumnSizingState) => DataTableColumnSizingState);
export interface DataTableColumnPinningState {
  left?: string[];
  right?: string[];
}
export type DataTableColumnPinningUpdater =
  | DataTableColumnPinningState
  | ((current: DataTableColumnPinningState) => DataTableColumnPinningState);

export interface DataTableSort {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumnContext<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
}

export interface DataTableFilterContext<T> {
  column: DataTableColumn<T>;
  value: unknown;
  filters: DataTableFilterState;
  setFilter: (value: unknown) => void;
  clearFilter: () => void;
  close: () => void;
}

export interface DataTableFilterActiveContext<T> {
  column: DataTableColumn<T>;
  value: unknown;
  filters: DataTableFilterState;
}

export interface DataTableColumnFilterContext<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
  value: unknown;
  filters: DataTableFilterState;
}

export interface DataTableCellEdit {
  rowId: DataTableRowId;
  columnId: string;
}

export interface DataTableEditCellContext<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
  value: unknown;
  setValue: (value: unknown) => void;
  commit: (...args: [] | [unknown]) => void | Promise<void>;
  cancel: () => void;
  pending: boolean;
  error?: React.ReactNode;
  errorId?: string;
}

export interface DataTableCellEditCommit<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
  value: unknown;
}

export interface DataTableCellEditCommitResult {
  close?: boolean;
  error?: React.ReactNode;
}

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  width?: string;
  minWidth?: number;
  maxWidth?: number;
  hideable?: boolean;
  reorderable?: boolean;
  resizable?: boolean;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | boolean | Date | null | undefined;
  quickSearchable?: boolean;
  quickSearchText?: (row: T, context: DataTableColumnContext<T>) => string | number | boolean | Date | null | undefined;
  filterControl?: React.ReactNode | ((context: DataTableFilterContext<T>) => React.ReactNode);
  filterActive?: boolean | ((context: DataTableFilterActiveContext<T>) => boolean);
  filterFn?: (row: T, value: unknown, context: DataTableColumnFilterContext<T>) => boolean;
  filterLabel?: string;
  editable?: boolean | ((row: T, context: DataTableColumnContext<T>) => boolean);
  getEditValue?: (row: T, context: DataTableColumnContext<T>) => unknown;
  renderEditCell?: (context: DataTableEditCellContext<T>) => React.ReactNode;
  renderCell: (row: T, context: DataTableColumnContext<T>) => React.ReactNode;
  className?: string | ((row: T) => string | undefined);
  align?: "start" | "center" | "end";
  hideOnMobile?: boolean;
}

export interface DataTableGroupSummary<T> {
  group: DataTableGroup<T>;
  visibleRows: T[];
  totalCount?: number;
  loadedCount: number;
}

export interface DataTableGroupHeaderContext<T> {
  group: DataTableGroup<T>;
  summary: DataTableGroupSummary<T>;
  collapsed: boolean;
  collapsible: boolean;
  icons: DataTableIcons;
  toggle: () => void;
}

export interface DataTableGroup<T> {
  id: string;
  label: React.ReactNode;
  rows?: T[];
  rowIds?: DataTableRowId[];
  totalCount?: number;
  loadedCount?: number;
  hasMoreRows?: boolean;
  loadingMore?: boolean;
  loadMoreError?: React.ReactNode;
  countLabel?: React.ReactNode;
  summary?: React.ReactNode | ((summary: DataTableGroupSummary<T>) => React.ReactNode);
  progressLabel?: React.ReactNode;
  progressValue?: number;
  state?: DataTableGroupState;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  depth?: number;
  actions?: React.ReactNode;
}

export interface DataTableIcons {
  Sort: React.ComponentType<DataTableIconProps & { direction: DataTableSortDirection | "none" }>;
  Filter: React.ComponentType<DataTableIconProps & { active?: boolean }>;
  Expand: React.ComponentType<DataTableIconProps & { expanded?: boolean }>;
  Edit: React.ComponentType<DataTableIconProps>;
  Loading: React.ComponentType<DataTableIconProps>;
  More: React.ComponentType<DataTableIconProps>;
}

export interface DataTableIconProps {
  className?: string;
  size?: number;
  title?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export interface DataTableStateLabel {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export interface DataTableRenderContext<T> {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  visibleColumns: Array<DataTableColumn<T>>;
  quickSearch: string;
  setQuickSearch: (value: DataTableQuickSearchUpdater) => void;
  columnVisibility: DataTableColumnVisibilityState;
  setColumnVisibility: (visibility: DataTableColumnVisibilityUpdater) => void;
  columnOrder: DataTableColumnOrderState;
  setColumnOrder: (order: DataTableColumnOrderUpdater) => void;
  columnSizing: DataTableColumnSizingState;
  setColumnSizing: (sizing: DataTableColumnSizingUpdater) => void;
  columnPinning: DataTableColumnPinningState;
  setColumnPinning: (pinning: DataTableColumnPinningUpdater) => void;
  visibleRows: T[];
  visibleItems: Array<DataTableVisibleItem<T>>;
  visibleRowCount: number;
  totalRowCount: number;
  rowIndexOffset: number;
  selectedIds: Array<DataTableRowId>;
  selectedCount: number;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  sort?: DataTableSort;
  filters: DataTableFilterState;
  loading: boolean;
  error: boolean;
  stale: boolean;
}

export interface DataTableToolbarQuickSearchConfig {
  label?: string;
  placeholder?: string;
  clearLabel?: string;
}

export interface DataTableToolbarColumnVisibilityConfig {
  label?: string;
  resetLabel?: string;
  emptyLabel?: string;
  columnIds?: string[];
  allowHideAll?: boolean;
}

export interface DataTableToolbarConfig<T> {
  ariaLabel?: string;
  quickSearch?: boolean | DataTableToolbarQuickSearchConfig;
  columnVisibility?: boolean | DataTableToolbarColumnVisibilityConfig;
  renderActions?: (context: DataTableRenderContext<T>) => React.ReactNode;
  renderSummary?: (context: DataTableRenderContext<T>) => React.ReactNode;
}

export type DataTableVirtualSurface = "desktop" | "mobile";

export interface DataTableRowsVirtualRange<T> {
  surface: DataTableVirtualSurface;
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  rows: T[];
  loadedCount: number;
  totalRowCount: number;
  rowIndexOffset: number;
}

export interface DataTableRowsLoadRequest<T> extends DataTableRowsVirtualRange<T> {
  requestedStartIndex: number;
}

export interface DataTableGroupVirtualRange<T> {
  surface: DataTableVirtualSurface;
  group: DataTableGroup<T>;
  groupId: string;
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  rows: T[];
  loadedCount: number;
  totalCount?: number;
}

export interface DataTableGroupLoadRequest<T> extends DataTableGroupVirtualRange<T> {
  requestedStartIndex: number;
}

export interface DataTableServerVirtualization<T> {
  overscan?: number;
  loadThreshold?: number;
  hasMoreRows?: boolean;
  loadingMore?: boolean;
  loadMoreError?: React.ReactNode;
  onRowsRangeChange?: (range: DataTableRowsVirtualRange<T>) => void;
  onRowsEndReached?: (request: DataTableRowsLoadRequest<T>) => void;
  onGroupRangeChange?: (range: DataTableGroupVirtualRange<T>) => void;
  onGroupEndReached?: (request: DataTableGroupLoadRequest<T>) => void;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowId: (row: T) => DataTableRowId;
  groups?: Array<DataTableGroup<T>>;
  selectedIds?: Array<DataTableRowId>;
  onSelectedIdsChange?: (selectedIds: Array<DataTableRowId>) => void;
  sort?: DataTableSort;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort | undefined) => void;
  manualSorting?: boolean;
  filters?: DataTableFilterState;
  defaultFilters?: DataTableFilterState;
  onFiltersChange?: (filters: DataTableFilterState) => void;
  manualFiltering?: boolean;
  quickSearch?: string;
  defaultQuickSearch?: string;
  onQuickSearchChange?: (quickSearch: string) => void;
  columnVisibility?: DataTableColumnVisibilityState;
  defaultColumnVisibility?: DataTableColumnVisibilityState;
  onColumnVisibilityChange?: (visibility: DataTableColumnVisibilityState) => void;
  columnOrder?: DataTableColumnOrderState;
  defaultColumnOrder?: DataTableColumnOrderState;
  onColumnOrderChange?: (order: DataTableColumnOrderState) => void;
  enableColumnReordering?: boolean;
  columnSizing?: DataTableColumnSizingState;
  defaultColumnSizing?: DataTableColumnSizingState;
  onColumnSizingChange?: (sizing: DataTableColumnSizingState) => void;
  columnPinning?: DataTableColumnPinningState;
  defaultColumnPinning?: DataTableColumnPinningState;
  onColumnPinningChange?: (pinning: DataTableColumnPinningState) => void;
  editingCell?: DataTableCellEdit;
  defaultEditingCell?: DataTableCellEdit;
  onEditingCellChange?: (cell: DataTableCellEdit | undefined) => void;
  onCellEditCommit?: (
    commit: DataTableCellEditCommit<T>
  ) => void | DataTableCellEditCommitResult | Promise<void | DataTableCellEditCommitResult>;
  loading?: boolean;
  error?: boolean | Error;
  stale?: boolean;
  serverVirtualization?: DataTableServerVirtualization<T>;
  totalRowCount?: number;
  rowIndexOffset?: number;
  loadingLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
  loadingState?: DataTableStateLabel;
  emptyState?: DataTableStateLabel;
  errorState?: DataTableStateLabel;
  height?: number;
  mobileHeight?: number;
  rowHeight?: number;
  groupHeight?: number;
  minWidth?: string;
  density?: DataTableDensity;
  motion?: DataTableMotionPreference;
  isRowSelectable?: (row: T) => boolean;
  rowAriaLabel?: (row: T) => string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  renderRowActions?: (row: T) => React.ReactNode;
  renderCard?: (row: T) => React.ReactNode;
  toolbar?: boolean | DataTableToolbarConfig<T>;
  renderToolbar?: (context: DataTableRenderContext<T>) => React.ReactNode;
  renderFooter?: (context: DataTableRenderContext<T>) => React.ReactNode;
  renderGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
  renderMobileGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
  collapsedGroupIds?: Array<string>;
  defaultCollapsedGroupIds?: Array<string>;
  onCollapsedGroupIdsChange?: (groupIds: Array<string>) => void;
  icons?: Partial<DataTableIcons>;
  className?: string;
  tableClassName?: string;
}

export type DataTableVisibleItem<T> =
  | { kind: "group"; id: string; group: DataTableGroup<T>; rows: T[] }
  | { kind: "row"; id: DataTableRowId; row: T; groupId?: string; groupIndex?: number }
  | {
    kind: "loadMore";
    id: string;
    scope: "rows" | "group";
    status: "loading" | "error" | "end";
    group?: DataTableGroup<T>;
    groupId?: string;
    rowCount: number;
    error?: React.ReactNode;
  };
