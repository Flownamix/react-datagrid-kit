import * as React from "react";
import { summarizeGroup } from "../model/grouping";
import type { DataTableGroup, DataTableGroupHeaderContext, DataTableGroupSummary, DataTableIcons } from "../types";

export interface DataTableGroupRowProps<T> {
  group: DataTableGroup<T>;
  rows: T[];
  columns: number;
  rowIndex: number;
  collapsed: boolean;
  icons: DataTableIcons;
  onToggle: (groupId: string) => void;
  renderGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
}

export function DataTableGroupRow<T>({
  group,
  rows,
  columns,
  rowIndex,
  collapsed,
  icons,
  onToggle,
  renderGroupHeader
}: DataTableGroupRowProps<T>): React.ReactElement {
  const summary = summarizeGroup(group, rows);
  const collapsible = group.collapsible !== false;
  const toggle = React.useCallback(() => {
    if (collapsible) {
      onToggle(group.id);
    }
  }, [collapsible, group.id, onToggle]);
  const context = React.useMemo<DataTableGroupHeaderContext<T>>(
    () => ({ group, summary, collapsed, collapsible, icons, toggle }),
    [collapsed, collapsible, group, icons, summary, toggle]
  );
  const progressValue = typeof group.progressValue === "number" ? Math.max(0, Math.min(group.progressValue, 100)) : undefined;

  return (
    <div
      className="rdtg-groupRow"
      role="row"
      aria-rowindex={rowIndex}
      data-state={group.state ?? "loaded"}
      data-depth={group.depth ?? 0}
      style={{ "--rdtg-group-depth": group.depth ?? 0 } as React.CSSProperties}
    >
      <div
        className="rdtg-groupCell"
        role="gridcell"
        aria-colindex={1}
        aria-colspan={columns}
        data-rdtg-grid-cell="true"
        tabIndex={-1}
      >
        {renderGroupHeader ? (
          renderGroupHeader(group, summary, context)
        ) : (
          <>
            <button
              type="button"
              className="rdtg-groupToggle"
              disabled={!collapsible}
              aria-expanded={!collapsed}
              onClick={toggle}
            >
              <icons.Expand expanded={!collapsed} aria-hidden="true" />
              <span className="rdtg-groupLabel">{group.label}</span>
            </button>
            <div className="rdtg-groupMeta">
              {group.countLabel ?? `${summary.loadedCount}${summary.totalCount ? ` of ${summary.totalCount}` : ""}`}
              {group.progressLabel ? <span>{group.progressLabel}</span> : null}
              {group.summary ? <span>{typeof group.summary === "function" ? group.summary(summary) : group.summary}</span> : null}
            </div>
            {progressValue !== undefined ? (
              <div className="rdtg-groupProgress" aria-hidden="true">
                <span style={{ width: `${progressValue}%` }} />
              </div>
            ) : null}
            {group.actions ? <div className="rdtg-groupActions">{group.actions}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}
