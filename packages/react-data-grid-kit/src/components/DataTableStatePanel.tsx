import * as React from "react";
import type { DataTableIcons, DataTableStateLabel } from "../types";

export interface DataTableStatePanelProps {
  icons: DataTableIcons;
  label: string;
  state?: DataTableStateLabel;
  tone: "loading" | "empty" | "error";
}

export function DataTableStatePanel({ icons, label, state, tone }: DataTableStatePanelProps): React.ReactElement {
  return (
    <div className="rdtg-statePanel" role={tone === "error" ? "alert" : "status"} data-tone={tone}>
      {tone === "loading" ? <icons.Loading aria-hidden="true" /> : null}
      <div className="rdtg-stateTitle">{state?.title ?? label}</div>
      {state?.description ? <div className="rdtg-stateDescription">{state.description}</div> : null}
      {state?.action ? <div className="rdtg-stateAction">{state.action}</div> : null}
    </div>
  );
}
