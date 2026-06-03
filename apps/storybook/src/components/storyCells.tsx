import type { AccountRow } from "../fixtures/accounts";
import { currency } from "../fixtures/accounts";

export function AccountCell({ row }: { row: AccountRow }) {
  return (
    <div className="story-accountCell">
      <strong>{row.name}</strong>
      <span>{row.segment} / {row.region}</span>
    </div>
  );
}

export function StatusPill({ status }: { status: AccountRow["status"] }) {
  const label = status === "active" ? "Active" : status === "review" ? "In review" : "Blocked";
  return <span className={`story-status ${status}`}>{label}</span>;
}

export function PipelineMetric({ row }: { row: AccountRow }) {
  return (
    <div className="story-metric">
      <strong>{currency(row.pipeline)}</strong>
      <span className="story-subtle">{row.risk}% risk</span>
    </div>
  );
}

export function AccountMobileCard({ row }: { row: AccountRow }) {
  return (
    <div className="story-card">
      <div className="story-cardHeader">
        <AccountCell row={row} />
        <StatusPill status={row.status} />
      </div>
      <div className="story-cardGrid">
        <div>
          <span className="story-subtle">Owner</span>
          <div>{row.owner}</div>
        </div>
        <div>
          <span className="story-subtle">Pipeline</span>
          <div>{currency(row.pipeline)}</div>
        </div>
      </div>
    </div>
  );
}
