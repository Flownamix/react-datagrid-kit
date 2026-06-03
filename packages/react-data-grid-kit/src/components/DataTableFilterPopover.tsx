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
import type { DataTableColumn, DataTableFilterState, DataTableIcons } from "../types";

export interface DataTableFilterPopoverProps<T> {
  column: DataTableColumn<T>;
  filters: DataTableFilterState;
  icons: DataTableIcons;
  onFilterChange: (columnId: string, value: unknown) => void;
  onFilterClear: (columnId: string) => void;
}

export function DataTableFilterPopover<T>({
  column,
  filters,
  icons,
  onFilterChange,
  onFilterClear
}: DataTableFilterPopoverProps<T>): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const popoverId = React.useId();
  const titleId = React.useId();
  const value = filters[column.id];
  const active = resolveFilterActive(column, filters);
  const filterLabel = column.filterLabel ?? `Filter ${plainText(column.header)}`;
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  const setReference = React.useCallback((node: HTMLButtonElement | null) => {
    refs.setReference(node);
  }, [refs]);
  const setFloating = React.useCallback((node: HTMLDivElement | null) => {
    refs.setFloating(node);
  }, [refs]);

  const content = typeof column.filterControl === "function"
    ? column.filterControl({
      column,
      value,
      filters,
      setFilter: (nextValue) => onFilterChange(column.id, nextValue),
      clearFilter: () => onFilterClear(column.id),
      close: () => setOpen(false)
    })
    : column.filterControl;

  return (
    <>
      <button
        ref={setReference}
        type="button"
        className="rdtg-filterButton"
        aria-controls={open ? popoverId : undefined}
        aria-expanded={open ? "true" : "false"}
        aria-label={filterLabel}
        aria-pressed={active ? "true" : "false"}
        data-active={active ? "true" : undefined}
        {...getReferenceProps()}
      >
        <icons.Filter active={active} aria-hidden="true" />
      </button>
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} returnFocus>
            <div
              ref={setFloating}
              id={popoverId}
              className="rdtg-filterPopoverPositioner"
              style={floatingStyles}
              aria-labelledby={titleId}
              {...getFloatingProps()}
            >
              <div className="rdtg-filterPopover">
                <div className="rdtg-filterPopoverHeader">
                  <div id={titleId} className="rdtg-filterPopoverTitle">{filterLabel}</div>
                </div>
                <div className="rdtg-filterPopoverContent">
                  {content}
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}

function resolveFilterActive<T>(column: DataTableColumn<T>, filters: DataTableFilterState): boolean {
  const value = filters[column.id];

  if (typeof column.filterActive === "function") {
    return column.filterActive({ column, value, filters });
  }

  if (typeof column.filterActive === "boolean") {
    return column.filterActive;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

function plainText(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "column";
}
