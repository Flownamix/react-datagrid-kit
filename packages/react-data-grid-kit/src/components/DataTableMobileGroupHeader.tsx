import * as React from "react";
import { summarizeGroup } from "../model/grouping";
import type { DataTableGroup, DataTableGroupHeaderContext, DataTableGroupSummary, DataTableIcons } from "../types";

export interface DataTableMobileGroupHeaderProps<T> {
  group: DataTableGroup<T>;
  rows: T[];
  collapsed: boolean;
  icons: DataTableIcons;
  onToggle: (groupId: string) => void;
  renderMobileGroupHeader?: (
    group: DataTableGroup<T>,
    summary: DataTableGroupSummary<T>,
    context: DataTableGroupHeaderContext<T>
  ) => React.ReactNode;
}

export function DataTableMobileGroupHeader<T>({
  group,
  rows,
  collapsed,
  icons,
  onToggle,
  renderMobileGroupHeader
}: DataTableMobileGroupHeaderProps<T>): React.ReactElement {
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
    <section
      className="rdtg-mobileGroup"
      data-state={group.state ?? "loaded"}
      data-depth={group.depth ?? 0}
      style={{ "--rdtg-group-depth": group.depth ?? 0 } as React.CSSProperties}
    >
      {renderMobileGroupHeader ? (
        renderMobileGroupHeader(group, summary, context)
      ) : (
        <>
          <button
            type="button"
            className="rdtg-mobileGroupToggle"
            disabled={!collapsible}
            aria-expanded={!collapsed}
            onClick={toggle}
          >
            <icons.Expand expanded={!collapsed} aria-hidden="true" />
            <span className="rdtg-mobileGroupLabel">{group.label}</span>
          </button>
          <div className="rdtg-mobileGroupMeta">
            {group.countLabel ?? `${summary.loadedCount}${summary.totalCount ? ` of ${summary.totalCount}` : ""}`}
            {group.progressLabel ? <span>{group.progressLabel}</span> : null}
            {group.summary ? <span>{typeof group.summary === "function" ? group.summary(summary) : group.summary}</span> : null}
          </div>
          {progressValue !== undefined ? (
            <div className="rdtg-groupProgress" aria-hidden="true">
              <span style={{ width: `${progressValue}%` }} />
            </div>
          ) : null}
          {group.actions ? <div className="rdtg-mobileGroupActions">{group.actions}</div> : null}
        </>
      )}
    </section>
  );
}
