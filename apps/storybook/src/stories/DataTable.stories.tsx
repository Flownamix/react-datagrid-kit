import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
  type DataTableProps,
  type DataTableRowId
} from "@flownamix/react-data-grid-kit";
import { AccountCell, AccountMobileCard, PipelineMetric, StatusPill } from "../components/storyCells";
import { AccountFilter, ActivityFilter } from "../components/filterControls";
import { accounts, type AccountRow, type AccountStatus } from "../fixtures/accounts";

const columns: Array<DataTableColumn<AccountRow>> = [
  {
    id: "account",
    header: "Account",
    width: "minmax(240px, 2fr)",
    sortable: true,
    filterLabel: "Filter accounts",
    filterControl: ({ value, setFilter, clearFilter, close }) => (
      <AccountFilter value={value} setFilter={setFilter} clearFilter={clearFilter} close={close} />
    ),
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
      <div className="story-filter" role="group" aria-label="Status options">
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
    filterControl: ({ value, setFilter, clearFilter, close }) => (
      <ActivityFilter value={value} setFilter={setFilter} clearFilter={clearFilter} close={close} />
    ),
    sortAccessor: (row) => row.lastActivity,
    quickSearchText: (row) => row.lastActivity,
    renderCell: (row) => row.lastActivity
  }
];

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
    actions: <button className="story-button" type="button">Export</button>
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

const virtualizedAccounts: AccountRow[] = Array.from({ length: 30 }, (_, index) => {
  const source = accounts[index % accounts.length]!;
  return {
    ...source,
    id: `server-${String(index + 1).padStart(3, "0")}`,
    name: `${source.name} ${index + 1}`,
    pipeline: source.pipeline + index * 25000,
    risk: Math.min(99, source.risk + (index % 5) * 3)
  };
});

const localFilterColumns: Array<DataTableColumn<AccountRow>> = columns.map((column) => {
  if (column.id === "account") {
    return {
      ...column,
      filterFn: (row, value) => {
        const filter = typeof value === "object" && value !== null ? value as { term?: string; region?: string } : {};
        const term = filter.term?.trim().toLowerCase();
        const region = filter.region;
        const matchesTerm = !term || `${row.name} ${row.segment} ${row.owner}`.toLowerCase().includes(term);
        const matchesRegion = !region || region === "all" || row.region.toLowerCase().replace(/\s+/g, "-") === region;
        return matchesTerm && matchesRegion;
      }
    };
  }

  if (column.id === "lastActivity") {
    return {
      ...column,
      filterFn: (row, value) => {
        const filter = typeof value === "object" && value !== null ? value as { after?: string; sla?: string } : {};
        const after = filter.after ? new Date(filter.after) : undefined;
        const rowDate = new Date(row.lastActivity);
        const matchesDate = !after || rowDate >= after;
        const matchesSla = !filter.sla || filter.sla === "all" || (filter.sla === "late" ? row.risk >= 30 : row.lastActivity >= "2026-05-30");
        return matchesDate && matchesSla;
      }
    };
  }

  return column;
});

const editableColumns: Array<DataTableColumn<AccountRow>> = columns.map((column) => {
  if (column.id === "status") {
    return {
      ...column,
      editable: true,
      getEditValue: (row) => row.status,
      renderEditCell: ({ value, setValue, commit, cancel }) => (
        <form className="story-inlineEdit story-inlineEditSelect" aria-label="Edit status">
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

  if (column.id === "owner") {
    return {
      ...column,
      editable: (row) => row.status !== "blocked",
      getEditValue: (row) => row.owner,
      renderEditCell: ({ value, setValue, commit, cancel }) => (
        <form className="story-inlineEdit" aria-label="Edit owner">
          <input
            aria-label="Owner"
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
          <InlineEditActions onCommit={() => commit()} onCancel={cancel} />
        </form>
      )
    };
  }

  return column;
});

const validatingEditableColumns: Array<DataTableColumn<AccountRow>> = columns.map((column) => {
  if (column.id !== "owner") {
    return column;
  }

  return {
    ...column,
    editable: true,
    getEditValue: (row) => row.owner,
    renderEditCell: ({ value, setValue, commit, cancel, pending, error, errorId }) => (
      <form className="story-inlineEdit" aria-label="Edit owner with validation">
        <input
          aria-label="Owner"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : "false"}
          value={String(value ?? "")}
          disabled={pending}
          onChange={(event) => setValue(event.target.value)}
        />
        <InlineEditActions pending={pending} onCommit={() => commit()} onCancel={cancel} />
      </form>
    )
  };
});

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
    <span className="story-inlineActions">
      <button
        type="button"
        className="story-inlineAction save"
        aria-label={pending ? "Saving" : "Save"}
        disabled={pending}
        data-pending={pending ? "true" : undefined}
        onClick={() => onCommit()}
      >
        <CheckIcon aria-hidden="true" size={13} />
      </button>
      <button
        type="button"
        className="story-inlineAction cancel"
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

const resizableColumns: Array<DataTableColumn<AccountRow>> = columns.map((column) => ({
  ...column,
  resizable: true,
  minWidth: column.id === "account" ? 220 : 104,
  maxWidth: column.id === "account" ? 520 : 280
}));

const meta = {
  title: "Components/DataTable/Enterprise",
  component: DataTable<AccountRow>,
  parameters: {
    layout: "fullscreen"
  },
  decorators: [
    (Story) => (
      <div className="storybook-surface">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof DataTable<AccountRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

function SelectableAccountsExample(args: DataTableProps<AccountRow>) {
  const [selectedIds, setSelectedIds] = useState<Array<DataTableRowId>>(args.selectedIds ?? []);

  return <DataTable {...args} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} />;
}

function EditableCellsExample(args: DataTableProps<AccountRow>) {
  const [editableRows, setEditableRows] = useState(accounts);

  return (
    <DataTable
      {...args}
      rows={editableRows}
      onCellEditCommit={({ rowId, column, value }) => {
        setEditableRows((current) => current.map((row) => {
          if (row.id !== rowId) {
            return row;
          }
          if (column.id === "owner") {
            return { ...row, owner: String(value ?? "") };
          }
          if (column.id === "status" && isAccountStatus(value)) {
            return { ...row, status: value };
          }
          return row;
        }));
      }}
    />
  );
}

function AsyncEditableCellsExample(args: DataTableProps<AccountRow>) {
  const [editableRows, setEditableRows] = useState(accounts);

  return (
    <DataTable
      {...args}
      rows={editableRows}
      onCellEditCommit={async ({ rowId, column, value }) => {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 450);
        });

        const nextOwner = String(value ?? "").trim();
        if (!nextOwner) {
          return { close: false, error: "Owner is required" };
        }

        setEditableRows((current) => current.map((row) => {
          if (row.id !== rowId || column.id !== "owner") {
            return row;
          }
          return { ...row, owner: nextOwner };
        }));
        return undefined;
      }}
    />
  );
}

function ControlledEditingLifecycleExample(args: DataTableProps<AccountRow>) {
  const [editableRows, setEditableRows] = useState(accounts);
  const [editingCell, setEditingCell] = useState<DataTableCellEdit | undefined>({
    rowId: "acc-001",
    columnId: "owner"
  });

  return (
    <div className="story-controlledEditing">
      <div className="story-toolbar" aria-label="Controlled edit launcher">
        <button
          className="story-button primary"
          type="button"
          onClick={() => setEditingCell({ rowId: "acc-001", columnId: "owner" })}
        >
          Edit first owner
        </button>
        <button
          className="story-button"
          type="button"
          onClick={() => setEditingCell({ rowId: "acc-004", columnId: "owner" })}
        >
          Edit second owner
        </button>
        <button className="story-button" type="button" onClick={() => setEditingCell(undefined)}>
          Close editor
        </button>
        <span className="story-subtle">
          Active: {editingCell ? `${editingCell.rowId} / ${editingCell.columnId}` : "none"}
        </span>
      </div>
      <DataTable
        {...args}
        rows={editableRows}
        editingCell={editingCell}
        onEditingCellChange={setEditingCell}
        onCellEditCommit={async ({ rowId, column, value }) => {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 650);
          });

          const nextOwner = String(value ?? "").trim();
          if (!nextOwner) {
            return { close: false, error: "Owner is required" };
          }

          setEditableRows((current) => current.map((row) => {
            if (row.id !== rowId || column.id !== "owner") {
              return row;
            }
            return { ...row, owner: nextOwner };
          }));
          return undefined;
        }}
      />
    </div>
  );
}

function EditingSavedViewLifecycleExample(args: DataTableProps<AccountRow>) {
  const [editableRows, setEditableRows] = useState(accounts);

  return (
    <DataTable
      {...args}
      rows={editableRows}
      onCellEditCommit={async ({ rowId, column, value }) => {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 650);
        });

        const nextOwner = String(value ?? "").trim();
        if (!nextOwner) {
          return { close: false, error: "Owner is required" };
        }

        setEditableRows((current) => current.map((row) => {
          if (row.id !== rowId || column.id !== "owner") {
            return row;
          }
          return { ...row, owner: nextOwner };
        }));
        return undefined;
      }}
      renderToolbar={({ columnVisibility, setColumnVisibility }) => {
        const ownerVisible = columnVisibility.owner !== false;

        return (
          <div className="story-toolbar" aria-label="Saved view edit lifecycle">
            <button
              className="story-button"
              type="button"
              onClick={() => setColumnVisibility((current) => ({ ...current, owner: false }))}
            >
              Hide owner
            </button>
            <button
              className="story-button primary"
              type="button"
              onClick={() => setColumnVisibility((current) => ({ ...current, owner: true }))}
            >
              Show owner
            </button>
            <span className="story-subtle" aria-live="polite">
              Owner {ownerVisible ? "visible" : "hidden"}
            </span>
          </div>
        );
      }}
    />
  );
}

function ColumnVisibilityExample(args: DataTableProps<AccountRow>) {
  return (
    <DataTable
      {...args}
      renderToolbar={({ columns, visibleColumns, columnVisibility, setColumnVisibility }) => {
        const visibleColumnIds = new Set(visibleColumns.map((column) => column.id));
        const setColumnVisible = (columnId: string, visible: boolean) => {
          setColumnVisibility((current) => ({ ...current, [columnId]: visible }));
        };
        const resetColumns = () => {
          setColumnVisibility({});
        };

        return (
          <div className="story-columnToolbar" aria-label="Saved view columns">
            <div className="story-toolbar">
              <button className="story-button primary" type="button" onClick={resetColumns}>
                Reset view
              </button>
              <span className="story-subtle">{visibleColumns.length} visible columns</span>
            </div>
            <div className="story-columnToggleList" role="group" aria-label="Visible columns">
              {columns.map((column) => (
                <label key={column.id} className="story-columnToggle">
                  <input
                    type="checkbox"
                    checked={visibleColumnIds.has(column.id)}
                    onChange={(event) => setColumnVisible(column.id, event.target.checked)}
                  />
                  <span>{column.header}</span>
                </label>
              ))}
            </div>
            <span className="story-subtle">
              State: {JSON.stringify(columnVisibility as DataTableColumnVisibilityState)}
            </span>
          </div>
        );
      }}
    />
  );
}

function ColumnOrderingExample(args: DataTableProps<AccountRow>) {
  return (
    <DataTable
      {...args}
      toolbar={{
        quickSearch: { placeholder: "Search accounts" },
        columnVisibility: { label: "Columns" },
        renderActions: ({ setColumnOrder }) => {
          const useOperationsView = () => {
            setColumnOrder(["account", "status", "pipeline", "owner", "lastActivity"]);
          };
          const useRelationshipView = () => {
            setColumnOrder(["account", "owner", "lastActivity", "status", "pipeline"]);
          };
          const resetOrder = () => setColumnOrder([]);

          return (
            <>
              <button className="story-button primary" type="button" onClick={useOperationsView}>
                Operations view
              </button>
              <button className="story-button" type="button" onClick={useRelationshipView}>
                Relationship view
              </button>
              <button className="story-button" type="button" onClick={resetOrder}>
                Reset order
              </button>
            </>
          );
        },
        renderSummary: ({ columnOrder, visibleColumns }) => (
          <span>
            {visibleColumns.map((column) => column.header).join(" / ")} | {JSON.stringify(columnOrder as DataTableColumnOrderState)}
          </span>
        )
      }}
    />
  );
}

function FirstClassToolbarExample(args: DataTableProps<AccountRow>) {
  return (
    <DataTable
      {...args}
      toolbar={{
        quickSearch: { placeholder: "Search account, owner, status..." },
        columnVisibility: { label: "Columns" },
        renderActions: ({ selectedCount }) => (
          <>
            <button className="story-button primary" type="button" disabled={selectedCount === 0}>
              Assign {selectedCount || ""}
            </button>
            <button className="story-button" type="button">Export</button>
          </>
        ),
        renderSummary: ({ visibleRowCount, totalRowCount, quickSearch }) => (
          <span>
            {visibleRowCount} of {totalRowCount} rows{quickSearch ? ` matching "${quickSearch}"` : ""}
          </span>
        )
      }}
    />
  );
}

function ServerVirtualizedRowsExample(args: DataTableProps<AccountRow>) {
  const [loadedCount, setLoadedCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedRows = virtualizedAccounts.slice(0, loadedCount);

  return (
    <DataTable
      {...args}
      rows={loadedRows}
      totalRowCount={virtualizedAccounts.length}
      serverVirtualization={{
        loadingMore,
        onRowsEndReached: ({ requestedStartIndex }) => {
          if (loadingMore || requestedStartIndex >= virtualizedAccounts.length) {
            return;
          }

          setLoadingMore(true);
          window.setTimeout(() => {
            setLoadedCount((current) => Math.min(current + 6, virtualizedAccounts.length));
            setLoadingMore(false);
          }, 400);
        }
      }}
      renderFooter={({ visibleRowCount, totalRowCount }) => (
        <div className="story-tableFooter" aria-label="Virtualized server summary">
          <span>{visibleRowCount} loaded rows</span>
          <span>{totalRowCount} server rows</span>
        </div>
      )}
    />
  );
}

function ServerVirtualizedGroupsExample(args: DataTableProps<AccountRow>) {
  const [priorityCount, setPriorityCount] = useState(4);
  const [reviewCount, setReviewCount] = useState(3);
  const [loadingGroupId, setLoadingGroupId] = useState<string | undefined>();
  const priorityRows = virtualizedAccounts.slice(0, priorityCount);
  const reviewRows = virtualizedAccounts.slice(12, 12 + reviewCount);
  const groupedRows = [...priorityRows, ...reviewRows];
  const virtualGroups: Array<DataTableGroup<AccountRow>> = [
    {
      id: "priority",
      label: "Priority server group",
      rowIds: priorityRows.map((row) => row.id),
      totalCount: 12,
      loadedCount: priorityRows.length,
      loadingMore: loadingGroupId === "priority",
      state: priorityRows.length < 12 ? "partial" : "loaded"
    },
    {
      id: "review",
      label: "Review server group",
      rowIds: reviewRows.map((row) => row.id),
      totalCount: 10,
      loadedCount: reviewRows.length,
      loadingMore: loadingGroupId === "review",
      state: reviewRows.length < 10 ? "partial" : "loaded"
    }
  ];

  return (
    <DataTable
      {...args}
      rows={groupedRows}
      groups={virtualGroups}
      serverVirtualization={{
        onGroupEndReached: ({ groupId }) => {
          if (loadingGroupId) {
            return;
          }

          setLoadingGroupId(groupId);
          window.setTimeout(() => {
            if (groupId === "priority") {
              setPriorityCount((current) => Math.min(current + 4, 12));
            } else {
              setReviewCount((current) => Math.min(current + 4, 10));
            }
            setLoadingGroupId(undefined);
          }, 400);
        }
      }}
    />
  );
}

function ColumnResizingExample(args: DataTableProps<AccountRow>) {
  return (
    <DataTable
      {...args}
      renderToolbar={({ columnSizing, setColumnSizing }) => {
        const resetSizing = () => setColumnSizing({});
        const useOperationsView = () => {
          setColumnSizing({
            account: 340,
            owner: 168,
            status: 132,
            pipeline: 176,
            lastActivity: 172
          });
        };

        return (
          <div className="story-columnToolbar" aria-label="Saved view sizing">
            <div className="story-toolbar">
              <button className="story-button primary" type="button" onClick={useOperationsView}>
                Operations view
              </button>
              <button className="story-button" type="button" onClick={resetSizing}>
                Reset widths
              </button>
              <span className="story-subtle">Resizable saved-view widths</span>
            </div>
            <span className="story-subtle">
              State: {JSON.stringify(columnSizing as DataTableColumnSizingState)}
            </span>
          </div>
        );
      }}
    />
  );
}

function ColumnPinningExample(args: DataTableProps<AccountRow>) {
  return (
    <DataTable
      {...args}
      renderToolbar={({ columnPinning, setColumnPinning }) => {
        const useRelationshipView = () => {
          setColumnPinning({ left: ["account"], right: ["status"] });
        };
        const useRevenueView = () => {
          setColumnPinning({ left: ["account"], right: ["pipeline"] });
        };
        const resetPinning = () => setColumnPinning({});

        return (
          <div className="story-columnToolbar" aria-label="Saved view pinning">
            <div className="story-toolbar">
              <button className="story-button primary" type="button" onClick={useRelationshipView}>
                Relationship view
              </button>
              <button className="story-button" type="button" onClick={useRevenueView}>
                Revenue view
              </button>
              <button className="story-button" type="button" onClick={resetPinning}>
                Clear pins
              </button>
              <span className="story-subtle">Pinned saved-view columns</span>
            </div>
            <span className="story-subtle">
              State: {JSON.stringify(columnPinning as DataTableColumnPinningState)}
            </span>
          </div>
        );
      }}
    />
  );
}

export const EnterpriseAccounts: Story = {
  render: (args) => <SelectableAccountsExample {...args} />,
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Enterprise accounts",
    groups,
    selectedIds: ["acc-001"],
    defaultSort: { columnId: "pipeline", direction: "descending" },
    defaultFilters: {
      account: { term: "energy", region: "gauteng" },
      lastActivity: { after: "2026-05-01", sla: "late" }
    },
    density: "comfortable",
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />,
    renderRowActions: (row) => <button className="story-button story-iconButton" type="button" aria-label={`Open ${row.name}`}>...</button>
  }
};

export const ReadOnlySelection: Story = {
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Read-only account selection",
    selectedIds: ["acc-001", "acc-004"],
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  }
};

export const ConditionalSelection: Story = {
  render: (args) => <SelectableAccountsExample {...args} />,
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Conditionally selectable accounts",
    groups,
    selectedIds: ["acc-001"],
    isRowSelectable: (row) => row.status !== "blocked",
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  }
};

export const LocalFiltering: Story = {
  args: {
    rows: accounts,
    columns: localFilterColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Locally filtered accounts",
    defaultFilters: {
      account: { term: "health", region: "all" }
    },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  },
  parameters: {
    docs: {
      description: {
        story: "Filter controls can be arbitrary React forms with object-shaped values. The package popover provides labelled dialog semantics, initial focus, Escape dismissal, and return focus; columns opt into TanStack local filtering by providing filterFn."
      }
    }
  }
};

export const ReducedMotion: Story = {
  args: {
    rows: accounts,
    columns: localFilterColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Reduced motion accounts",
    groups,
    motion: "reduced",
    defaultFilters: {
      account: { term: "health", region: "all" }
    },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  }
};

export const DenseRowsWithArbitraryTemplates: Story = {
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Compact account rows",
    density: "compact",
    rowHeight: 52,
    renderCard: (row) => <AccountMobileCard row={row} />
  }
};

export const KeyboardNavigation: Story = {
  render: (args) => <EditableCellsExample {...args} />,
  args: {
    rows: accounts,
    columns: editableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Keyboard navigable account owners",
    selectedIds: ["acc-001"],
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  },
  parameters: {
    docs: {
      description: {
        story: "Desktop grid focus enters the first cell, arrow keys move between visible cells, Home/End and PageUp/PageDown support grid-scale movement, Space toggles focused selection/group controls, and F2 or Enter opens an editable cell. Custom interactive content keeps ownership of its own keyboard events."
      }
    }
  }
};

export const InlineEditing: Story = {
  render: (args) => <EditableCellsExample {...args} />,
  args: {
    rows: accounts,
    columns: editableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Editable account owners",
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  },
  parameters: {
    docs: {
      description: {
        story: "Inline editing can use compact icon actions for save/cancel and simple controls such as a status select for enum values. The table owns focus, commit, and cancel lifecycle while the editor template stays app-owned."
      }
    }
  }
};

export const MobileInlineEditing: Story = {
  render: (args) => <EditableCellsExample {...args} />,
  args: {
    rows: accounts,
    columns: editableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Mobile editable account owners",
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "The built-in mobile field layout honors editable columns. Custom renderCard content remains app-owned."
      }
    }
  }
};

export const AsyncInlineEditing: Story = {
  render: (args) => <AsyncEditableCellsExample {...args} />,
  args: {
    rows: accounts,
    columns: validatingEditableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Async editable account owners",
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Commit handlers can return a promise. Pending state stays in the editor, and validation errors keep the editor open."
      }
    }
  }
};

export const ControlledInlineEditingLifecycle: Story = {
  render: (args) => <ControlledEditingLifecycleExample {...args} />,
  args: {
    rows: accounts,
    columns: validatingEditableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Controlled editable account owners",
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Host applications can control which cell is edited, including an explicitly closed state with editingCell={undefined}. Switching cells or removing the edited cell from the visible model resets draft, pending, and validation state so stale async commits cannot close or dirty another editor."
      }
    }
  }
};

export const EditingSavedViewLifecycle: Story = {
  render: (args) => <EditingSavedViewLifecycleExample {...args} />,
  args: {
    rows: accounts,
    columns: validatingEditableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Saved view editing lifecycle",
    defaultEditingCell: {
      rowId: "acc-001",
      columnId: "owner"
    },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Editing state is discarded when saved-view visibility removes the edited column. Pending async commits from that removed editor are ignored instead of restoring stale draft or validation state."
      }
    }
  }
};

export const ToolbarAndFooterSlots: Story = {
  render: (args) => <SelectableAccountsExample {...args} />,
  args: {
    rows: accounts,
    columns: localFilterColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Account queue with integration slots",
    selectedIds: ["acc-001", "acc-004"],
    defaultFilters: {
      account: { term: "energy", region: "all" }
    },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderToolbar: ({ selectedCount, visibleRowCount, filters }) => {
      const accountFilter = filters.account as { term?: string } | undefined;
      return (
        <div className="story-toolbar" aria-label="Account queue actions">
          <button className="story-button primary" type="button" disabled={selectedCount === 0}>
            Assign {selectedCount || ""}
          </button>
          <button className="story-button" type="button">Export</button>
          <span className="story-subtle">
            {visibleRowCount} visible{accountFilter?.term ? ` for "${accountFilter.term}"` : ""}
          </span>
        </div>
      );
    },
    renderFooter: ({ rows, visibleRowCount, selectedCount, sort }) => (
      <div className="story-tableFooter" aria-label="Account queue summary">
        <span>{visibleRowCount} of {rows.length} rows in view</span>
        <span>{selectedCount} selected</span>
        <span>Sort: {sort ? `${sort.columnId} ${sort.direction}` : "none"}</span>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Toolbar and footer slots receive modeled table state for bulk actions, summaries, and pagination controls without duplicating selection/filter/sort state outside the table."
      }
    }
  }
};

export const FirstClassToolbar: Story = {
  render: (args) => <FirstClassToolbarExample {...args} />,
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Account queue with package toolbar",
    selectedIds: ["acc-001"],
    onSelectedIdsChange: () => undefined,
    defaultColumnVisibility: {
      lastActivity: false
    },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />
  },
  parameters: {
    docs: {
      description: {
        story: "The first-class toolbar renders package-owned controls for quick search and column visibility while still allowing host-owned action and summary slots. Quick search is controlled/uncontrolled state and participates in TanStack local filtering unless manualFiltering is enabled."
      }
    }
  }
};

export const ServerPaginationMetadata: Story = {
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Server paged account queue",
    manualSorting: true,
    manualFiltering: true,
    stale: true,
    totalRowCount: 842,
    rowIndexOffset: 250,
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderToolbar: ({ visibleRowCount, totalRowCount, rowIndexOffset, stale }) => (
      <div className="story-toolbar" aria-label="Server page controls">
        <button className="story-button" type="button">Previous</button>
        <button className="story-button primary" type="button">Next</button>
        <span className="story-subtle">
          Rows {rowIndexOffset + 1}-{rowIndexOffset + visibleRowCount} of {totalRowCount}
        </span>
        <span className="story-chip" aria-live="polite">{stale ? "Refreshing" : "Current"}</span>
      </div>
    ),
    renderFooter: ({ visibleRowCount, totalRowCount, rowIndexOffset, sort }) => (
      <div className="story-tableFooter" aria-label="Server page summary">
        <span>Page window {rowIndexOffset + 1}-{rowIndexOffset + visibleRowCount}</span>
        <span>{totalRowCount} matching accounts</span>
        <span>Server sort: {sort ? `${sort.columnId} ${sort.direction}` : "none"}</span>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Server-owned pagination keeps fetch/page controls in the host application while the table exposes totalRowCount and rowIndexOffset for slot summaries and ARIA row metadata."
      }
    }
  }
};

export const ServerVirtualizedRows: Story = {
  render: (args) => <ServerVirtualizedRowsExample {...args} />,
  args: {
    rows: virtualizedAccounts.slice(0, 8),
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Virtualized server account queue",
    manualSorting: true,
    manualFiltering: true,
    height: 420,
    mobileHeight: 420,
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Server virtualization emits range and end-reached signals while the host owns fetching and appends the next result window."
      }
    }
  }
};

export const ServerVirtualizedGroups: Story = {
  render: (args) => <ServerVirtualizedGroupsExample {...args} />,
  args: {
    rows: virtualizedAccounts.slice(0, 7),
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Virtualized grouped account queue",
    height: 420,
    mobileHeight: 420,
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Grouped server virtualization requests additional rows per expanded group and renders inline group loading sentinels."
      }
    }
  }
};

export const ColumnVisibility: Story = {
  render: (args) => <ColumnVisibilityExample {...args} />,
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Saved view account columns",
    defaultColumnVisibility: {
      status: false,
      lastActivity: false
    },
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Column visibility is backed by TanStack Table state and can be controlled by saved views, URL state, or a package-owned toolbar through render context."
      }
    }
  }
};

export const ColumnOrdering: Story = {
  render: (args) => <ColumnOrderingExample {...args} />,
  args: {
    rows: accounts,
    columns: resizableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Saved view ordered account columns",
    enableColumnReordering: true,
    defaultColumnSizing: {
      account: 320,
      owner: 156,
      status: 132,
      pipeline: 168,
      lastActivity: 164
    },
    defaultColumnOrder: ["account", "owner", "status", "pipeline", "lastActivity"],
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Column ordering is TanStack-backed saved-view state. This story enables desktop header drag handles so users can define their own order, while the first-class toolbar hosts quick search, column controls, and preset/reset actions."
      }
    }
  }
};

export const ColumnResizing: Story = {
  render: (args) => <ColumnResizingExample {...args} />,
  args: {
    rows: accounts,
    columns: resizableColumns,
    getRowId: (row) => row.id,
    ariaLabel: "Resizable account columns",
    defaultColumnSizing: {
      account: 320,
      owner: 156,
      status: 132,
      pipeline: 168,
      lastActivity: 164
    },
    defaultSort: { columnId: "pipeline", direction: "descending" },
    rowAriaLabel: (row) => `${row.name}, ${row.status}`
  },
  parameters: {
    docs: {
      description: {
        story: "Resizable columns use TanStack-backed sizing state. Use defaultColumnSizing for table-owned widths or columnSizing/onColumnSizingChange when saved views, URL state, or user preferences own the widths."
      }
    }
  }
};

export const ColumnPinning: Story = {
  render: (args) => <ColumnPinningExample {...args} />,
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Pinned account columns",
    selectedIds: ["acc-001"],
    onSelectedIdsChange: () => undefined,
    defaultColumnPinning: {
      "left": ["account"]
    },
    defaultColumnSizing: {
      account: 320,
      owner: 152,
      status: 132,
      pipeline: 168,
      lastActivity: 360
    },
    minWidth: "1180px",
    rowAriaLabel: (row) => `${row.name}, ${row.status}`,
    renderCard: (row) => <AccountMobileCard row={row} />,
    renderRowActions: (row) => <button className="story-button story-iconButton" type="button" aria-label={`Open ${row.name}`}>...</button>
  },
  parameters: {
    docs: {
      description: {
        story: "Column pinning uses TanStack-backed left/right pinning state and native sticky desktop cells. Use defaultColumnPinning for table-owned saved-view defaults or columnPinning/onColumnPinningChange when a parent app persists the saved view."
      }
    }
  }
};

export const GroupingAtScale: Story = {
  args: {
    rows: accounts,
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Grouped enterprise accounts",
    groups,
    defaultCollapsedGroupIds: ["exceptions"],
    motion: "always",
    renderCard: (row) => <AccountMobileCard row={row} />
  },
  parameters: {
    docs: {
      description: {
        story: "Grouped rows use the package visibility model for real partial/error group states. Desktop collapse keeps inert visual exits for the 500ms collapse motion so rows do not disappear abruptly, while reduced motion skips the transient layer."
      }
    }
  }
};

export const LoadingState: Story = {
  args: {
    rows: [],
    columns,
    getRowId: (row) => row.id,
    ariaLabel: "Loading account rows",
    loading: true,
    loadingState: {
      title: "Refreshing account intelligence",
      description: "The table keeps layout stable while data loads."
    }
  }
};
