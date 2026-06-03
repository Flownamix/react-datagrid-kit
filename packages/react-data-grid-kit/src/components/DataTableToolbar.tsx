import * as React from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import type { DataTableColumn, DataTableRenderContext, DataTableToolbarConfig } from "../types";

export interface DataTableToolbarProps<T> {
  config: true | DataTableToolbarConfig<T>;
  context: DataTableRenderContext<T>;
}

export function DataTableToolbar<T>({
  config,
  context
}: DataTableToolbarProps<T>): React.ReactElement {
  const resolvedConfig = config === true ? {} : config;
  const quickSearchConfig = resolvedConfig.quickSearch === undefined ? true : resolvedConfig.quickSearch;
  const columnVisibilityConfig = resolvedConfig.columnVisibility === undefined ? true : resolvedConfig.columnVisibility;
  const showQuickSearch = quickSearchConfig !== false;
  const showColumnVisibility = columnVisibilityConfig !== false;
  const summary = resolvedConfig.renderSummary?.(context);
  const actions = resolvedConfig.renderActions?.(context);

  return (
    <div className="rdtg-toolbar rdtg-builtInToolbar" role="toolbar" aria-label={resolvedConfig.ariaLabel ?? "Table controls"}>
      <div className="rdtg-toolbarPrimary">
        {showQuickSearch ? (
          <DataTableQuickSearch
            context={context}
            config={quickSearchConfig === true ? {} : quickSearchConfig}
          />
        ) : null}
        {showColumnVisibility ? (
          <DataTableColumnVisibilityControl
            context={context}
            config={columnVisibilityConfig === true ? {} : columnVisibilityConfig}
          />
        ) : null}
      </div>
      {actions || summary ? (
        <div className="rdtg-toolbarSecondary">
          {actions ? <div className="rdtg-toolbarActions">{actions}</div> : null}
          {summary ? <div className="rdtg-toolbarSummary">{summary}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function DataTableQuickSearch<T>({
  config,
  context
}: {
  config: Exclude<DataTableToolbarConfig<T>["quickSearch"], boolean | undefined>;
  context: DataTableRenderContext<T>;
}): React.ReactElement {
  const label = config?.label ?? "Quick search";
  const clearLabel = config?.clearLabel ?? "Clear quick search";
  const searchId = React.useId();

  return (
    <div className="rdtg-quickSearch">
      <label className="rdtg-visuallyHidden" htmlFor={searchId}>{label}</label>
      <SearchGlyph className="rdtg-quickSearchIcon" aria-hidden="true" />
      <input
        id={searchId}
        type="search"
        value={context.quickSearch}
        placeholder={config?.placeholder ?? "Search rows"}
        onChange={(event) => context.setQuickSearch(event.target.value)}
      />
      {context.quickSearch ? (
        <button
          type="button"
          className="rdtg-quickSearchClear"
          aria-label={clearLabel}
          onClick={() => context.setQuickSearch("")}
        >
          <CloseGlyph aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function DataTableColumnVisibilityControl<T>({
  config,
  context
}: {
  config: Exclude<DataTableToolbarConfig<T>["columnVisibility"], boolean | undefined>;
  context: DataTableRenderContext<T>;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const popoverId = React.useId();
  const titleId = React.useId();
  const label = config?.label ?? "Columns";
  const resetLabel = config?.resetLabel ?? "Reset columns";
  const columns = React.useMemo(
    () => resolveColumnControlColumns(context.columns, config?.columnIds),
    [config?.columnIds, context.columns]
  );
  const hideableColumns = React.useMemo(
    () => columns.filter((column) => column.hideable !== false),
    [columns]
  );
  const visibleColumnIds = React.useMemo(
    () => new Set(context.visibleColumns.map((column) => column.id)),
    [context.visibleColumns]
  );
  const visibleHideableCount = hideableColumns.filter((column) => visibleColumnIds.has(column.id)).length;
  const activeHiddenCount = hideableColumns.length - visibleHideableCount;
  const { refs, floatingStyles, context: floatingContext } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const click = useClick(floatingContext);
  const dismiss = useDismiss(floatingContext);
  const role = useRole(floatingContext, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  const setReference = React.useCallback((node: HTMLButtonElement | null) => {
    refs.setReference(node);
  }, [refs]);
  const setFloating = React.useCallback((node: HTMLDivElement | null) => {
    refs.setFloating(node);
  }, [refs]);

  const setColumnVisible = React.useCallback(
    (columnId: string, visible: boolean) => {
      context.setColumnVisibility((current) => ({ ...current, [columnId]: visible }));
    },
    [context]
  );
  const resetColumns = React.useCallback(() => {
    context.setColumnVisibility((current) => {
      const next = { ...current };
      hideableColumns.forEach((column) => {
        delete next[column.id];
      });
      return next;
    });
  }, [context, hideableColumns]);

  return (
    <>
      <button
        ref={setReference}
        type="button"
        className="rdtg-toolbarButton"
        aria-label={activeHiddenCount > 0 ? `${label}, ${activeHiddenCount} hidden` : label}
        aria-controls={open ? popoverId : undefined}
        aria-expanded={open ? "true" : "false"}
        data-active={activeHiddenCount > 0 ? "true" : undefined}
        {...getReferenceProps()}
      >
        <ColumnsGlyph aria-hidden="true" />
        <span>{label}</span>
        {activeHiddenCount > 0 ? <span className="rdtg-toolbarBadge">{activeHiddenCount}</span> : null}
      </button>
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={floatingContext} modal={false} returnFocus>
            <div
              ref={setFloating}
              id={popoverId}
              className="rdtg-toolbarPopoverPositioner"
              style={floatingStyles}
              aria-labelledby={titleId}
              {...getFloatingProps()}
            >
              <div className="rdtg-toolbarPopover">
                <div className="rdtg-toolbarPopoverHeader">
                  <div id={titleId} className="rdtg-toolbarPopoverTitle">{label}</div>
                  <button type="button" className="rdtg-toolbarTextButton" onClick={resetColumns}>
                    {resetLabel}
                  </button>
                </div>
                <div className="rdtg-columnControlList" role="group" aria-label={label}>
                  {hideableColumns.length > 0 ? hideableColumns.map((column) => {
                    const visible = visibleColumnIds.has(column.id);
                    const disableLastVisible = !config?.allowHideAll && visible && visibleHideableCount <= 1;

                    return (
                      <label key={column.id} className="rdtg-columnControl">
                        <input
                          type="checkbox"
                          checked={visible}
                          disabled={disableLastVisible}
                          onChange={(event) => setColumnVisible(column.id, event.target.checked)}
                        />
                        <span>{column.header}</span>
                      </label>
                    );
                  }) : (
                    <div className="rdtg-columnControlEmpty">{config?.emptyLabel ?? "No configurable columns"}</div>
                  )}
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}

function resolveColumnControlColumns<T>(
  columns: Array<DataTableColumn<T>>,
  columnIds: string[] | undefined
): Array<DataTableColumn<T>> {
  if (!columnIds?.length) {
    return columns;
  }

  const requestedColumnIds = new Set(columnIds);
  return columns.filter((column) => requestedColumnIds.has(column.id));
}

function SearchGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

function ColumnsGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16" {...props}>
      <rect height="16" rx="2" width="16" x="4" y="4" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
    </svg>
  );
}

function CloseGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
