import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  CheckIcon,
  CloseIcon,
  DataTable,
  type DataTableCellEdit,
  type DataTableColumn,
  type DataTableColumnOrderState,
  type DataTableColumnPinningState,
  type DataTableColumnSizingState,
  type DataTableColumnVisibilityState,
  type DataTableGroup,
  type DataTableRowId
} from "@flownamix/react-data-grid-kit";
import { AccountCell, AccountMobileCard, PipelineMetric, StatusPill } from "./cells";
import { accounts, type AccountRow, type AccountStatus } from "./data";
import { AccountFilter, ActivityFilter } from "./filterControls";
import "./liveDataTableExamples.css";

interface LiveDataTableExample {
  title: string;
  description: string;
  Component: ComponentType;
}

const baseColumns: Array<DataTableColumn<AccountRow>> = [
  {
    id: "account",
    header: "Account",
    width: "minmax(240px, 2fr)",
    sortable: true,
    filterLabel: "Filter accounts",
    filterActive: ({ value }) => {
      const filter = typeof value === "object" && value !== null ? value as { term?: string; region?: string } : {};
      return Boolean(filter.term || filter.region);
    },
    filterControl: ({ value, setFilter, clearFilter, close }) => (
      <AccountFilter value={value} setFilter={setFilter} clearFilter={clearFilter} close={close} />
    ),
    filterFn: (row, value) => {
      const filter = typeof value === "object" && value !== null ? value as { term?: string; region?: string } : {};
      const term = filter.term?.trim().toLowerCase();
      const region = filter.region;
      const matchesTerm = !term || `${row.name} ${row.segment} ${row.owner}`.toLowerCase().includes(term);
      const matchesRegion = !region || row.region.toLowerCase().replace(/\s+/g, "-") === region;

      return matchesTerm && matchesRegion;
    },
    sortAccessor: (row) => row.name,
    quickSearchText: (row) => `${row.name} ${row.segment} ${row.owner} ${row.region}`,
    renderCell: (row) => <AccountCell row={row} />
  },
  {
    id: "owner",
    header: "Owner",
    width: "minmax(140px, 1fr)",
    sortable: true,
    sortAccessor: (row) => row.owner,
    quickSearchText: (row) => row.owner,
    renderCell: (row) => row.owner
  },
  {
    id: "status",
    header: "Status",
    width: "132px",
    filterLabel: "Filter status",
    filterControl: (
      <div className="docsExample-checkboxFilter" role="group" aria-label="Status options">
        <label><input type="checkbox" defaultChecked /> Active</label>
        <label><input type="checkbox" defaultChecked /> In review</label>
        <label><input type="checkbox" /> Blocked</label>
      </div>
    ),
    quickSearchText: (row) => row.status === "review" ? "in review" : row.status,
    renderCell: (row) => <StatusPill status={row.status} />
  },
  {
    id: "pipeline",
    header: "Pipeline",
    width: "160px",
    align: "end",
    sortable: true,
    sortAccessor: (row) => row.pipeline,
    quickSearchText: (row) => row.pipeline,
    renderCell: (row) => <PipelineMetric row={row} />
  },
  {
    id: "lastActivity",
    header: "Last activity",
    width: "150px",
    sortable: true,
    filterLabel: "Filter activity",
    filterActive: ({ value }) => {
      const filter = typeof value === "object" && value !== null ? value as { after?: string; sla?: string } : {};
      return Boolean(filter.after || filter.sla);
    },
    filterControl: ({ value, setFilter, clearFilter, close }) => (
      <ActivityFilter value={value} setFilter={setFilter} clearFilter={clearFilter} close={close} />
    ),
    filterFn: (row, value) => {
      const filter = typeof value === "object" && value !== null ? value as { after?: string; sla?: string } : {};
      const after = filter.after ? new Date(filter.after) : undefined;
      const rowDate = new Date(row.lastActivity);
      const matchesDate = !after || rowDate >= after;
      const matchesSla = !filter.sla || filter.sla === "all" || (filter.sla === "late" ? row.risk >= 30 : row.lastActivity >= "2026-05-30");

      return matchesDate && matchesSla;
    },
    sortAccessor: (row) => row.lastActivity,
    quickSearchText: (row) => row.lastActivity,
    renderCell: (row) => row.lastActivity
  }
];

const compactColumns: Array<DataTableColumn<AccountRow>> = baseColumns.map((column) => ({
  ...column,
  resizable: false
}));

const savedViewColumns: Array<DataTableColumn<AccountRow>> = baseColumns.map((column) => ({
  ...column,
  hideable: column.id !== "account",
  resizable: true,
  minWidth: column.id === "account" ? 220 : 104,
  maxWidth: column.id === "account" ? 520 : 280
}));

const editableColumns: Array<DataTableColumn<AccountRow>> = baseColumns.map((column) => {
  if (column.id === "owner") {
    return {
      ...column,
      editable: (row) => row.status !== "blocked",
      getEditValue: (row) => row.owner,
      renderEditCell: ({ value, setValue, commit, cancel, pending, error, errorId }) => (
        <form className="docsExample-inlineEdit" aria-label="Edit owner">
          <input
            aria-label="Owner"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? "true" : "false"}
            disabled={pending}
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
          />
          <InlineEditActions pending={pending} onCommit={() => commit()} onCancel={cancel} />
        </form>
      )
    };
  }

  if (column.id === "status") {
    return {
      ...column,
      editable: true,
      getEditValue: (row) => row.status,
      renderEditCell: ({ value, setValue, commit, cancel }) => (
        <form className="docsExample-inlineEdit docsExample-inlineEditSelect" aria-label="Edit status">
          <select
            aria-label="Status"
            value={String(value ?? "active")}
            onChange={(event) => setValue(event.target.value as AccountStatus)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
          >
            <option value="active">Active</option>
            <option value="review">In review</option>
            <option value="blocked">Blocked</option>
          </select>
          <InlineEditActions onCommit={() => commit()} onCancel={cancel} />
        </form>
      )
    };
  }

  return column;
});

const groups: Array<DataTableGroup<AccountRow>> = [
  {
    id: "priority",
    label: "Priority enterprise accounts",
    rowIds: ["acc-001", "acc-004", "acc-005"],
    totalCount: 18,
    loadedCount: 3,
    countLabel: "3 loaded of 18",
    progressLabel: "Syncing remaining accounts",
    progressValue: 17,
    state: "partial"
  },
  {
    id: "healthy",
    label: "Healthy book",
    rowIds: ["acc-002", "acc-003", "acc-006"],
    totalCount: 3,
    loadedCount: 3,
    progressValue: 100,
    state: "loaded",
    actions: <button className="docsExample-button" type="button">Export</button>
  },
  {
    id: "exceptions",
    label: "Integration exceptions",
    rowIds: [],
    totalCount: 4,
    loadedCount: 0,
    progressLabel: "Needs retry",
    progressValue: 0,
    state: "error",
    defaultCollapsed: true
  }
];

export const liveDataTableExamples: Record<string, LiveDataTableExample> = {
  "quick-start": {
    title: "Quick start table",
    description: "A sorted account table with the default toolbar.",
    Component: QuickStartExample
  },
  "toolbar-filtering": {
    title: "Toolbar, selection, and filters",
    description: "Quick search, column controls, row selection, and custom filter popovers.",
    Component: ToolbarFilteringExample
  },
  "saved-views": {
    title: "Saved-view column state",
    description: "Controlled column visibility, order, sizing, and pinning.",
    Component: SavedViewsExample
  },
  "inline-editing": {
    title: "Async inline editing",
    description: "Editable cells with async validation and pending state.",
    Component: InlineEditingExample
  },
  "grouping": {
    title: "Grouped server states",
    description: "Collapsible groups with partial, loaded, and error metadata.",
    Component: GroupingExample
  },
  "responsive": {
    title: "Responsive cards",
    description: "The same modeled rows rendered as a desktop grid or mobile cards.",
    Component: ResponsiveExample
  }
};

export function getLiveDataTableExample(name: string): LiveDataTableExample | undefined {
  return liveDataTableExamples[name];
}

function QuickStartExample() {
  return (
    <ExampleShell>
      <DataTable
        rows={accounts}
        columns={compactColumns}
        getRowId={(row) => row.id}
        ariaLabel="Accounts"
        toolbar
        defaultSort={{ columnId: "account", direction: "ascending" }}
        height={340}
        mobileHeight={360}
      />
    </ExampleShell>
  );
}

function ToolbarFilteringExample() {
  const [selectedIds, setSelectedIds] = useState<Array<DataTableRowId>>(["acc-001"]);

  return (
    <ExampleShell>
      <DataTable
        rows={accounts}
        columns={baseColumns}
        getRowId={(row) => row.id}
        ariaLabel="Selectable accounts"
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        toolbar={{
          ariaLabel: "Account table controls",
          quickSearch: { placeholder: "Search account, owner, or region" },
          columnVisibility: { label: "Columns", resetLabel: "Reset columns" },
          renderActions: ({ selectedCount }) => (
            <>
              <button className="docsExample-button primary" type="button" disabled={selectedCount === 0}>
                Assign {selectedCount || ""}
              </button>
              <button className="docsExample-button" type="button">Export</button>
            </>
          ),
          renderSummary: ({ visibleRowCount, totalRowCount, quickSearch }) => (
            <span className="docsExample-summary">
              {visibleRowCount} of {totalRowCount} accounts{quickSearch ? ` matching "${quickSearch}"` : ""}
            </span>
          )
        }}
        defaultFilters={{
          account: { region: "gauteng" }
        }}
        height={360}
        mobileHeight={400}
      />
    </ExampleShell>
  );
}

function SavedViewsExample() {
  const [columnVisibility, setColumnVisibility] = useState<DataTableColumnVisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<DataTableColumnOrderState>(["account", "status", "pipeline", "owner", "lastActivity"]);
  const [columnSizing, setColumnSizing] = useState<DataTableColumnSizingState>({ account: 300, pipeline: 176 });
  const [columnPinning, setColumnPinning] = useState<DataTableColumnPinningState>({ left: ["account"], right: ["status"] });

  return (
    <ExampleShell>
      <DataTable
        rows={accounts}
        columns={savedViewColumns}
        getRowId={(row) => row.id}
        ariaLabel="Saved view accounts"
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
        columnPinning={columnPinning}
        onColumnPinningChange={setColumnPinning}
        enableColumnReordering
        toolbar={{
          quickSearch: { placeholder: "Search saved view" },
          columnVisibility: true,
          renderActions: () => (
            <>
              <button
                className="docsExample-button"
                type="button"
                onClick={() => {
                  setColumnVisibility({ owner: false });
                  setColumnOrder(["account", "status", "pipeline", "lastActivity", "owner"]);
                  setColumnSizing({ account: 320, pipeline: 176 });
                  setColumnPinning({ left: ["account"], right: ["status"] });
                }}
              >
                Operations view
              </button>
              <button
                className="docsExample-button"
                type="button"
                onClick={() => {
                  setColumnVisibility({ status: false });
                  setColumnOrder(["account", "pipeline", "owner", "lastActivity", "status"]);
                  setColumnSizing({ account: 280, pipeline: 196 });
                  setColumnPinning({ left: ["account"], right: ["pipeline"] });
                }}
              >
                Revenue view
              </button>
              <button
                className="docsExample-button"
                type="button"
                onClick={() => {
                  setColumnVisibility({});
                  setColumnOrder(["account", "status", "pipeline", "owner", "lastActivity"]);
                  setColumnSizing({ account: 300, pipeline: 176 });
                  setColumnPinning({ left: ["account"], right: ["status"] });
                }}
              >
                Reset
              </button>
            </>
          )
        }}
        height={360}
        mobileHeight={400}
        minWidth="860px"
      />
    </ExampleShell>
  );
}

function InlineEditingExample() {
  const [rows, setRows] = useState(accounts);
  const [editingCell, setEditingCell] = useState<DataTableCellEdit | undefined>({
    rowId: "acc-002",
    columnId: "owner"
  });

  return (
    <ExampleShell>
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        ariaLabel="Editable accounts"
        editingCell={editingCell}
        onEditingCellChange={setEditingCell}
        onCellEditCommit={async ({ rowId, column, value }) => {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 450);
          });

          if (column.id === "owner") {
            const nextOwner = String(value ?? "").trim();

            if (!nextOwner) {
              return { close: false, error: "Owner is required" };
            }

            setRows((current) => current.map((row) => row.id === rowId ? { ...row, owner: nextOwner } : row));
          }

          if (column.id === "status" && isAccountStatus(value)) {
            setRows((current) => current.map((row) => row.id === rowId ? { ...row, status: value } : row));
          }

          return undefined;
        }}
        toolbar={{
          quickSearch: { placeholder: "Search editable rows" },
          columnVisibility: false
        }}
        height={360}
        mobileHeight={400}
      />
    </ExampleShell>
  );
}

function GroupingExample() {
  return (
    <ExampleShell>
      <DataTable
        rows={accounts}
        columns={baseColumns}
        getRowId={(row) => row.id}
        ariaLabel="Grouped accounts"
        groups={groups}
        defaultCollapsedGroupIds={["exceptions"]}
        toolbar
        height={400}
        mobileHeight={420}
        motion="reduced"
      />
    </ExampleShell>
  );
}

function ResponsiveExample() {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const responsiveColumns = useMemo(
    () => baseColumns.map((column) => column.id === "pipeline" ? { ...column, hideOnMobile: true } : column),
    []
  );

  return (
    <ExampleShell>
      <div className="docsExample-modeBar" role="group" aria-label="Preview mode">
        <button
          className="docsExample-button"
          type="button"
          aria-pressed={mode === "desktop"}
          onClick={() => setMode("desktop")}
        >
          Desktop
        </button>
        <button
          className="docsExample-button"
          type="button"
          aria-pressed={mode === "mobile"}
          onClick={() => setMode("mobile")}
        >
          Mobile
        </button>
      </div>
      <div className="docsExample-responsiveFrame" data-mode={mode}>
        <DataTable
          rows={accounts}
          columns={responsiveColumns}
          getRowId={(row) => row.id}
          ariaLabel="Responsive accounts"
          rowAriaLabel={(row) => `${row.name}, ${row.status}`}
          renderCard={(row) => <AccountMobileCard row={row} />}
          toolbar={{
            quickSearch: { placeholder: "Search accounts" },
            columnVisibility: true
          }}
          height={340}
          mobileHeight={420}
        />
      </div>
    </ExampleShell>
  );
}

function ExampleShell({ children }: { children: ReactNode }) {
  return <div className="docsExample-shell">{children}</div>;
}

function InlineEditActions({
  pending = false,
  onCommit,
  onCancel
}: {
  pending?: boolean;
  onCommit: () => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <span className="docsExample-inlineActions">
      <button
        type="button"
        className="docsExample-inlineAction save"
        aria-label={pending ? "Saving" : "Save"}
        disabled={pending}
        data-pending={pending ? "true" : undefined}
        onClick={() => onCommit()}
      >
        <CheckIcon aria-hidden="true" size={13} />
      </button>
      <button
        type="button"
        className="docsExample-inlineAction cancel"
        aria-label="Cancel"
        disabled={pending}
        onClick={onCancel}
      >
        <CloseIcon aria-hidden="true" size={13} />
      </button>
    </span>
  );
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === "active" || value === "review" || value === "blocked";
}
