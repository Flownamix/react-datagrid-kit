import * as React from "react";
import type { DataTableColumn, DataTableRowId } from "../types";

const FOCUSABLE_SELECTOR = [
  "input:not([type='hidden']):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export interface DataTableEditCellProps<T> {
  row: T;
  rowId: DataTableRowId;
  column: DataTableColumn<T>;
  value: unknown;
  setValue: (value: unknown) => void;
  commit: (value: unknown) => void | Promise<void>;
  cancel: () => void;
  pending: boolean;
  error?: React.ReactNode;
  autoFocus?: boolean;
}

export function DataTableEditCell<T>({
  row,
  rowId,
  column,
  value,
  setValue,
  commit,
  cancel,
  pending,
  error,
  autoFocus = true
}: DataTableEditCellProps<T>): React.ReactElement {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const errorId = React.useId();

  React.useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const root = rootRef.current;
    if (!root || root.contains(document.activeElement)) {
      return;
    }

    root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
  }, [autoFocus]);

  return (
    <div
      ref={rootRef}
      className="rdtg-editCell"
      aria-busy={pending ? "true" : "false"}
      aria-describedby={error ? errorId : undefined}
      data-rdtg-stop-row-click
      data-pending={pending ? "true" : undefined}
      data-error={error ? "true" : undefined}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (pending) {
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
          return;
        }

        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          void commit(value);
        }
      }}
    >
      <div className="rdtg-editCellControl">
        {column.renderEditCell?.({
          row,
          rowId,
          column,
          value,
          setValue,
          commit: (...commitArgs: [] | [unknown]) => {
            if (pending) {
              return undefined;
            }
            return commit(commitArgs.length === 0 ? value : commitArgs[0]);
          },
          cancel,
          pending,
          error,
          errorId: error ? errorId : undefined
        })}
      </div>
      {error ? (
        <div id={errorId} className="rdtg-editError" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
