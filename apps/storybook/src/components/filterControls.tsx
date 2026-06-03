interface AccountFilterValue {
  term?: string;
  region?: string;
}

interface ActivityFilterValue {
  after?: string;
  sla?: string;
}

function asAccountFilterValue(value: unknown): AccountFilterValue {
  return typeof value === "object" && value !== null ? value as AccountFilterValue : {};
}

function asActivityFilterValue(value: unknown): ActivityFilterValue {
  return typeof value === "object" && value !== null ? value as ActivityFilterValue : {};
}

export function AccountFilter({
  value,
  setFilter,
  clearFilter,
  close
}: {
  value: unknown;
  setFilter: (value: AccountFilterValue) => void;
  clearFilter: () => void;
  close: () => void;
}) {
  const current = asAccountFilterValue(value);

  return (
    <form className="story-filter" aria-label="Account filter">
      <label>
        Search account
        <input
          placeholder="Name, segment, owner"
          value={current.term ?? ""}
          onChange={(event) => setFilter({ ...current, term: event.target.value })}
        />
      </label>
      <label>
        Region
        <select
          value={current.region ?? "all"}
          onChange={(event) => setFilter({ ...current, region: event.target.value === "all" ? undefined : event.target.value })}
        >
          <option value="all">All regions</option>
          <option value="gauteng">Gauteng</option>
          <option value="western-cape">Western Cape</option>
          <option value="kzn">KwaZulu-Natal</option>
        </select>
      </label>
      <div className="story-filterFooter">
        <button type="button" onClick={clearFilter}>Reset</button>
        <button type="button" data-primary="true" onClick={close}>Apply</button>
      </div>
    </form>
  );
}

export function ActivityFilter({
  value,
  setFilter,
  clearFilter,
  close
}: {
  value: unknown;
  setFilter: (value: ActivityFilterValue) => void;
  clearFilter: () => void;
  close: () => void;
}) {
  const current = asActivityFilterValue(value);

  return (
    <form className="story-filter" aria-label="Activity filter">
      <label>
        Last activity after
        <input
          type="date"
          value={current.after ?? ""}
          onChange={(event) => setFilter({ ...current, after: event.target.value })}
        />
      </label>
      <label>
        SLA
        <select
          value={current.sla ?? "all"}
          onChange={(event) => setFilter({ ...current, sla: event.target.value === "all" ? undefined : event.target.value })}
        >
          <option value="all">All accounts</option>
          <option value="late">Late follow-up</option>
          <option value="today">Due today</option>
        </select>
      </label>
      <div className="story-filterFooter">
        <button type="button" onClick={clearFilter}>Reset</button>
        <button type="button" data-primary="true" onClick={close}>Apply</button>
      </div>
    </form>
  );
}
