import type { AccountRow } from "./data";
import { currency } from "./data";

export function AccountCell({ row }: { row: AccountRow }) {
  return (
    <div className="docsExample-accountCell">
      <strong>{row.name}</strong>
      <span>{row.segment} / {row.region}</span>
    </div>
  );
}

export function StatusPill({ status }: { status: AccountRow["status"] }) {
  const label = status === "active" ? "Active" : status === "review" ? "In review" : "Blocked";

  return <span className={`docsExample-status ${status}`}>{label}</span>;
}

export function PipelineMetric({ row }: { row: AccountRow }) {
  return (
    <div className="docsExample-metric">
      <strong>{currency(row.pipeline)}</strong>
      <span>{row.risk}% risk</span>
    </div>
  );
}

export function AccountMobileCard({ row }: { row: AccountRow }) {
  return (
    <article className="docsExample-card">
      <div className="docsExample-cardHeader">
        <AccountCell row={row} />
        <StatusPill status={row.status} />
      </div>
      <div className="docsExample-cardGrid">
        <div>
          <span>Owner</span>
          <strong>{row.owner}</strong>
        </div>
        <div>
          <span>Pipeline</span>
          <strong>{currency(row.pipeline)}</strong>
        </div>
      </div>
    </article>
  );
}
