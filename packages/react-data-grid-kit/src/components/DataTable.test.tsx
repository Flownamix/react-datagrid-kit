import * as React from "react";
import { act } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import type {
  DataTableColumn,
  DataTableColumnOrderState,
  DataTableColumnPinningState,
  DataTableColumnSizingState,
  DataTableFilterState
} from "../types";

interface Row {
  id: string;
  company: string;
  owner: string;
  score: number;
}

const rows: Row[] = [
  { id: "1", company: "Acme Finance", owner: "Nandi", score: 92 },
  { id: "2", company: "Northwind Logistics", owner: "Karel", score: 76 }
];

const columns: Array<DataTableColumn<Row>> = [
  {
    id: "company",
    header: "Company",
    sortable: true,
    sortAccessor: (row) => row.company,
    filterActive: true,
    filterLabel: "Filter company",
    filterControl: ({ close }) => (
      <form aria-label="Company filter">
        <input aria-label="Company search" />
        <button type="button" onClick={close}>Apply</button>
      </form>
    ),
    renderCell: (row) => (
      <div>
        <strong>{row.company}</strong>
        <span>{row.owner}</span>
      </div>
    )
  },
  {
    id: "score",
    header: "Score",
    align: "end",
    sortable: true,
    sortAccessor: (row) => row.score,
    renderCell: (row) => <meter min={0} max={100} value={row.score}>{row.score}</meter>
  }
];

function mockClientRect(element: HTMLElement, { left, width }: { left: number; width: number }): void {
  element.getBoundingClientRect = () => ({
    bottom: 32,
    height: 32,
    left,
    right: left + width,
    top: 0,
    width,
    x: left,
    y: 0,
    toJSON: () => undefined
  });
}

function mockElementFromPoint(target: Element): () => void {
  const original = document.elementFromPoint;
  document.elementFromPoint = vi.fn(() => target);

  return () => {
    document.elementFromPoint = original;
  };
}

describe("DataTable", () => {
  it("renders arbitrary cell templates and arbitrary filter controls", async () => {
    const user = userEvent.setup();
    render(<DataTable rows={rows} columns={columns} getRowId={(row) => row.id} />);

    expect(screen.getAllByText("Acme Finance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nandi").length).toBeGreaterThan(0);

    const filterButton = screen.getByRole("button", { name: "Filter company" });
    expect(filterButton).toHaveAttribute("aria-expanded", "false");

    await user.click(filterButton);
    expect(filterButton).toHaveAttribute("aria-expanded", "true");
    expect(filterButton).toHaveAttribute("aria-controls");
    const dialog = screen.getByRole("dialog", { name: "Filter company" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("rdtg-filterPopoverPositioner");
    expect(dialog.querySelector(".rdtg-filterPopover")).toBeInTheDocument();
    expect(within(dialog).getByText("Filter company")).toHaveClass("rdtg-filterPopoverTitle");
    expect(screen.getByRole("form", { name: "Company filter" })).toBeInTheDocument();
    const filterInput = screen.getByRole("textbox", { name: "Company search" });
    expect(filterInput).toBeInTheDocument();
    await waitFor(() => expect(filterInput).toHaveFocus());

    await user.keyboard("[Escape]");
    expect(screen.queryByRole("dialog", { name: "Filter company" })).not.toBeInTheDocument();
    expect(filterButton).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(filterButton).toHaveFocus());
  });

  it("provides controlled filter state to arbitrary filter controls", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const controlledColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        filterActive: ({ value }) => Boolean((value as { term?: string } | undefined)?.term),
        filterControl: ({ value, setFilter, clearFilter }) => (
          <form aria-label="Controlled company filter">
            <span>{(value as { term?: string } | undefined)?.term}</span>
            <button type="button" onClick={() => setFilter({ term: "enterprise", facets: ["active", "risk"] })}>
              Apply enterprise filter
            </button>
            <button type="button" onClick={clearFilter}>Clear</button>
          </form>
        )
      },
      columns[1]!
    ];
    const filters: DataTableFilterState = { company: { term: "acme" } };

    render(
      <DataTable
        rows={rows}
        columns={controlledColumns}
        getRowId={(row) => row.id}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(screen.getByRole("button", { name: "Filter company" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Filter company" }));
    expect(screen.getByText("acme")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Apply enterprise filter" }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      company: { term: "enterprise", facets: ["active", "risk"] }
    });

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({});
  });

  it("supports uncontrolled filter state and derives active state from arbitrary values", async () => {
    const user = userEvent.setup();
    const uncontrolledColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        filterActive: undefined,
        filterControl: ({ value, setFilter, clearFilter }) => (
          <form aria-label="Uncontrolled company filter">
            <input
              aria-label="Company term"
              value={(value as { term?: string } | undefined)?.term ?? ""}
              onChange={(event) => setFilter({ term: event.target.value })}
            />
            <button type="button" onClick={clearFilter}>Reset filter</button>
          </form>
        )
      },
      columns[1]!
    ];

    render(
      <DataTable
        rows={rows}
        columns={uncontrolledColumns}
        getRowId={(row) => row.id}
        defaultFilters={{ company: { term: "Acme" } }}
      />
    );

    const filterButton = screen.getByRole("button", { name: "Filter company" });
    expect(filterButton).toHaveAttribute("aria-pressed", "true");

    await user.click(filterButton);
    expect(screen.getByRole("textbox", { name: "Company term" })).toHaveValue("Acme");

    await user.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(filterButton).toHaveAttribute("aria-pressed", "false");
  });

  it("uses TanStack column filtering when a column provides a local filter function", () => {
    const locallyFilteredColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        filterActive: undefined,
        filterFn: (row, value) => row.company.toLowerCase().includes(String(value).toLowerCase())
      },
      columns[1]!
    ];

    render(
      <DataTable
        rows={rows}
        columns={locallyFilteredColumns}
        getRowId={(row) => row.id}
        defaultFilters={{ company: "northwind", savedView: "server-owned" }}
      />
    );

    expect(screen.queryByText("Acme Finance")).not.toBeInTheDocument();
    expect(screen.getAllByText("Northwind Logistics").length).toBeGreaterThan(0);
  });

  it("keeps filter state server-owned when manualFiltering is enabled", () => {
    const locallyFilteredColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        filterActive: undefined,
        filterFn: (row, value) => row.company.toLowerCase().includes(String(value).toLowerCase())
      },
      columns[1]!
    ];

    render(
      <DataTable
        rows={rows}
        columns={locallyFilteredColumns}
        getRowId={(row) => row.id}
        defaultFilters={{ company: "northwind" }}
        manualFiltering
      />
    );

    expect(screen.getAllByText("Acme Finance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Northwind Logistics").length).toBeGreaterThan(0);
  });

  it("renders a first-class toolbar with local quick search and column controls", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        toolbar={{
          quickSearch: { placeholder: "Search accounts" },
          columnVisibility: true,
          renderSummary: ({ visibleRowCount }) => <span>{visibleRowCount} visible</span>
        }}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    expect(screen.getByRole("toolbar", { name: "Table controls" })).toHaveClass("rdtg-builtInToolbar");
    const search = screen.getByRole("searchbox", { name: "Quick search" });
    expect(search).toHaveAttribute("placeholder", "Search accounts");

    await user.type(search, "northwind");

    expect(within(desktopFrame).queryByText("Acme Finance")).not.toBeInTheDocument();
    expect(within(desktopFrame).getAllByText("Northwind Logistics").length).toBeGreaterThan(0);
    expect(screen.getByText("1 visible")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear quick search" }));
    expect(within(desktopFrame).getAllByText("Acme Finance").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Columns" }));
    const columnsDialog = screen.getByRole("dialog", { name: "Columns" });
    expect(columnsDialog).toHaveClass("rdtg-toolbarPopoverPositioner");

    await user.click(within(columnsDialog).getByRole("checkbox", { name: "Score" }));

    expect(within(desktopFrame).queryByRole("button", { name: "Score" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Columns, 1 hidden" })).toHaveAttribute("data-active", "true");
  });

  it("keeps toolbar quick search server-owned when manual filtering is enabled", async () => {
    const user = userEvent.setup();
    const onQuickSearchChange = vi.fn();

    function ControlledQuickSearchTable() {
      const [quickSearch, setQuickSearch] = React.useState("");

      return (
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          toolbar
          quickSearch={quickSearch}
          onQuickSearchChange={(value) => {
            onQuickSearchChange(value);
            setQuickSearch(value);
          }}
          manualFiltering
        />
      );
    }

    render(<ControlledQuickSearchTable />);

    await user.type(screen.getByRole("searchbox", { name: "Quick search" }), "acme");

    expect(onQuickSearchChange).toHaveBeenLastCalledWith("acme");
    expect(screen.getAllByText("Acme Finance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Northwind Logistics").length).toBeGreaterThan(0);
  });

  it("accepts non-serializable filter values without breaking motion keys", () => {
    const circularFilter: Record<string, unknown> = { term: "acme" };
    circularFilter.self = circularFilter;

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        defaultFilters={{ company: circularFilter }}
      />
    );

    expect(screen.getAllByText("Acme Finance").length).toBeGreaterThan(0);
  });

  it("supports controlled selection for visible rows", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={["1"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );

    await user.click(screen.getAllByRole("checkbox", { name: "Select row 2" })[0]!);
    expect(onSelectedIdsChange).toHaveBeenCalledWith(["1", "2"]);
  });

  it("does not activate the row from keyboard events inside nested controls", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onSelectedIdsChange = vi.fn();
    const interactiveColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        renderCell: (row) => <button type="button">Contact {row.company}</button>
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={interactiveColumns}
        getRowId={(row) => row.id}
        selectedIds={[]}
        onSelectedIdsChange={onSelectedIdsChange}
        onRowClick={onRowClick}
        renderRowActions={(row) => <button type="button">Open {row.company}</button>}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    within(desktopFrame).getByRole("checkbox", { name: "Select row 1" }).focus();
    await user.keyboard("[Space]");
    expect(onRowClick).not.toHaveBeenCalled();

    await user.click(within(desktopFrame).getByRole("button", { name: "Contact Acme Finance" }));
    expect(onRowClick).not.toHaveBeenCalled();

    within(desktopFrame).getByRole("button", { name: "Contact Acme Finance" }).focus();
    await user.keyboard("[Enter]");
    expect(onRowClick).not.toHaveBeenCalled();

    within(desktopFrame).getByRole("button", { name: "Open Acme Finance" }).focus();
    await user.keyboard("[Enter]");
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("does not activate mobile cards from nested custom card controls", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onSelectedIdsChange = vi.fn();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={[]}
        onSelectedIdsChange={onSelectedIdsChange}
        onRowClick={onRowClick}
        rowAriaLabel={(row) => row.company}
        renderCard={(row) => (
          <div>
            <strong>{row.company}</strong>
            <button type="button">Open mobile {row.company}</button>
            <span tabIndex={0} data-rdtg-stop-row-click>
              Focusable mobile control
            </span>
          </div>
        )}
      />
    );
    const mobileFrame = container.querySelector(".rdtg-mobileFrame") as HTMLElement;
    const firstMobileCard = within(mobileFrame).getByLabelText("Acme Finance");

    await user.click(within(firstMobileCard).getByRole("button", { name: "Open mobile Acme Finance" }));
    expect(onRowClick).not.toHaveBeenCalled();

    within(firstMobileCard).getByRole("button", { name: "Open mobile Acme Finance" }).focus();
    await user.keyboard("[Enter]");
    expect(onRowClick).not.toHaveBeenCalled();

    within(firstMobileCard).getByText("Focusable mobile control").focus();
    await user.keyboard("[Space]");
    expect(onRowClick).not.toHaveBeenCalled();

    firstMobileCard.focus();
    await user.keyboard("[Enter]");
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("exposes grid labels, counts, and virtualized cell positions", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Accounts table"
        selectedIds={["1"]}
        onSelectedIdsChange={vi.fn()}
        renderRowActions={(row) => <button type="button">Open {row.company}</button>}
      />
    );

    const grid = screen.getByRole("grid", { name: "Accounts table" });
    expect(grid).toHaveAttribute("aria-rowcount", "3");
    expect(grid).toHaveAttribute("aria-colcount", "4");

    const headerCells = container.querySelectorAll(".rdtg-headerCell");
    expect(headerCells[0]).toHaveAttribute("aria-colindex", "1");
    expect(headerCells[1]).toHaveAttribute("aria-colindex", "2");
    expect(headerCells[2]).toHaveAttribute("aria-colindex", "3");
    expect(headerCells[3]).toHaveAttribute("aria-colindex", "4");

    const firstRow = container.querySelector('.rdtg-row[aria-rowindex="2"]') as HTMLElement;
    expect(firstRow).not.toBeNull();
    expect(firstRow.querySelector(".rdtg-selectionCell")).toHaveAttribute("aria-colindex", "1");
    expect(firstRow.querySelector('[data-column-id="company"]')).toHaveAttribute("aria-colindex", "2");
    expect(firstRow.querySelector('[data-column-id="score"]')).toHaveAttribute("aria-colindex", "3");
    expect(firstRow.querySelector(".rdtg-actionCell")).toHaveAttribute("aria-colindex", "4");
  });

  it("describes server paged rows with total row count and absolute row indexes", () => {
    const { container } = render(
      <DataTable
        rows={rows.slice(0, 2)}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Paged account rows"
        totalRowCount={42}
        rowIndexOffset={20}
        renderFooter={({ totalRowCount, visibleRowCount, rowIndexOffset }) => (
          <div aria-label="Paged account summary">
            <span>{visibleRowCount} loaded</span>
            <span>{totalRowCount} total</span>
            <span>offset {rowIndexOffset}</span>
          </div>
        )}
      />
    );

    const grid = screen.getByRole("grid", { name: "Paged account rows" });
    expect(grid).toHaveAttribute("aria-rowcount", "43");
    expect(container.querySelector('.rdtg-row[aria-rowindex="22"] [data-row-id="1"]')).toBeInTheDocument();
    expect(container.querySelector('.rdtg-row[aria-rowindex="23"] [data-row-id="2"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Paged account summary")).toHaveTextContent("2 loaded");
    expect(screen.getByLabelText("Paged account summary")).toHaveTextContent("42 total");
    expect(screen.getByLabelText("Paged account summary")).toHaveTextContent("offset 20");
  });

  it("hides columns from desktop and built-in mobile layouts with default column visibility", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Visible account columns"
        defaultColumnVisibility={{ score: false }}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const mobileFrame = container.querySelector(".rdtg-mobileFrame") as HTMLElement;

    expect(screen.getByRole("grid", { name: "Visible account columns" })).toHaveAttribute("aria-colcount", "1");
    expect(within(desktopFrame).queryByRole("button", { name: "Score" })).not.toBeInTheDocument();
    expect(within(desktopFrame).queryByText("92")).not.toBeInTheDocument();
    expect(within(desktopFrame).getByText("Acme Finance")).toBeInTheDocument();
    expect(within(mobileFrame).queryByText("Score")).not.toBeInTheDocument();
    expect(within(mobileFrame).queryByText("92")).not.toBeInTheDocument();
  });

  it("keeps visible column indexes accurate when selection and actions are present", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Visible selectable accounts"
        selectedIds={[]}
        onSelectedIdsChange={vi.fn()}
        defaultColumnVisibility={{ score: false }}
        renderRowActions={(row) => <button type="button">Open {row.company}</button>}
      />
    );

    const grid = screen.getByRole("grid", { name: "Visible selectable accounts" });
    expect(grid).toHaveAttribute("aria-colcount", "3");

    const headerCells = container.querySelectorAll(".rdtg-headerCell");
    expect(headerCells[0]).toHaveAttribute("aria-colindex", "1");
    expect(headerCells[1]).toHaveAttribute("aria-colindex", "2");
    expect(headerCells[2]).toHaveAttribute("aria-colindex", "3");

    const firstRow = container.querySelector('.rdtg-row[aria-rowindex="2"]') as HTMLElement;
    expect(firstRow.querySelector(".rdtg-selectionCell")).toHaveAttribute("aria-colindex", "1");
    expect(firstRow.querySelector('[data-column-id="company"]')).toHaveAttribute("aria-colindex", "2");
    expect(firstRow.querySelector(".rdtg-actionCell")).toHaveAttribute("aria-colindex", "3");
    expect(firstRow.querySelector('[data-column-id="score"]')).not.toBeInTheDocument();
  });

  it("lets toolbar integrations update uncontrolled column visibility from render context", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        defaultColumnVisibility={{ score: false }}
        renderToolbar={({ visibleColumns, setColumnVisibility }) => (
          <div aria-label="Column visibility toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, score: true }))}>
              Show score
            </button>
          </div>
        )}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    expect(screen.getByLabelText("Column visibility toolbar")).toHaveTextContent("company");
    expect(within(desktopFrame).queryByRole("button", { name: "Score" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show score" }));

    expect(screen.getByLabelText("Column visibility toolbar")).toHaveTextContent("company,score");
    expect(within(desktopFrame).getByRole("button", { name: "Score" })).toBeInTheDocument();
  });

  it("supports controlled column visibility state", async () => {
    const user = userEvent.setup();
    const onColumnVisibilityChange = vi.fn();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        columnVisibility={{ score: false }}
        onColumnVisibilityChange={onColumnVisibilityChange}
        renderToolbar={({ visibleColumns, setColumnVisibility }) => (
          <div aria-label="Controlled column visibility toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, score: true }))}>
              Request score
            </button>
          </div>
        )}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    expect(screen.getByLabelText("Controlled column visibility toolbar")).toHaveTextContent("company");
    expect(within(desktopFrame).queryByRole("button", { name: "Score" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Request score" }));

    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ score: true });
    expect(within(desktopFrame).queryByRole("button", { name: "Score" })).not.toBeInTheDocument();
  });

  it("orders columns from uncontrolled saved-view state and exposes order to slots", async () => {
    const user = userEvent.setup();
    const orderedColumns: Array<DataTableColumn<Row>> = [
      columns[0]!,
      columns[1]!,
      {
        id: "owner",
        header: "Owner",
        renderCell: (row) => row.owner
      }
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={orderedColumns}
        getRowId={(row) => row.id}
        defaultColumnOrder={["score", "owner", "company"]}
        renderToolbar={({ columnOrder, setColumnOrder, visibleColumns }) => (
          <div aria-label="Column order toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <span>{JSON.stringify(columnOrder as DataTableColumnOrderState)}</span>
            <button type="button" onClick={() => setColumnOrder(["company", "owner", "score"])}>
              Use relationship order
            </button>
          </div>
        )}
      />
    );

    expect(screen.getByLabelText("Column order toolbar")).toHaveTextContent("score,owner,company");
    expect(screen.getByLabelText("Column order toolbar")).toHaveTextContent('["score","owner","company"]');

    const headerCells = Array.from(container.querySelectorAll<HTMLElement>(".rdtg-headerCell[data-column-id]"));
    expect(headerCells.map((cell) => cell.dataset.columnId)).toEqual(["score", "owner", "company"]);

    const firstDesktopRow = container.querySelector('.rdtg-row[aria-rowindex="2"]') as HTMLElement;
    const desktopCells = Array.from(firstDesktopRow.querySelectorAll<HTMLElement>(".rdtg-cell[data-column-id]"));
    expect(desktopCells.map((cell) => cell.dataset.columnId)).toEqual(["score", "owner", "company"]);

    const firstMobileCard = container.querySelector(".rdtg-mobileCard") as HTMLElement;
    const mobileFields = Array.from(firstMobileCard.querySelectorAll<HTMLElement>(".rdtg-mobileField[data-column-id]"));
    expect(mobileFields.map((field) => field.dataset.columnId)).toEqual(["score", "owner", "company"]);

    await user.click(screen.getByRole("button", { name: "Use relationship order" }));

    expect(screen.getByLabelText("Column order toolbar")).toHaveTextContent("company,owner,score");
    const reorderedHeaderCells = Array.from(container.querySelectorAll<HTMLElement>(".rdtg-headerCell[data-column-id]"));
    expect(reorderedHeaderCells.map((cell) => cell.dataset.columnId)).toEqual(["company", "owner", "score"]);
  });

  it("supports controlled column order state", async () => {
    const user = userEvent.setup();
    const onColumnOrderChange = vi.fn();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        columnOrder={["company", "score"]}
        onColumnOrderChange={onColumnOrderChange}
        renderToolbar={({ setColumnOrder }) => (
          <button type="button" onClick={() => setColumnOrder((current) => ["score", ...current])}>
            Request score first
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Request score first" }));

    expect(onColumnOrderChange).toHaveBeenCalledWith(["score", "company"]);
    const headerCells = Array.from(container.querySelectorAll<HTMLElement>(".rdtg-headerCell[data-column-id]"));
    expect(headerCells.map((cell) => cell.dataset.columnId)).toEqual(["company", "score"]);
  });

  it("lets users reorder columns by dragging desktop header handles", () => {
    const orderedColumns: Array<DataTableColumn<Row>> = [
      columns[0]!,
      columns[1]!,
      {
        id: "owner",
        header: "Owner",
        renderCell: (row) => row.owner
      }
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={orderedColumns}
        getRowId={(row) => row.id}
        enableColumnReordering
        defaultColumnOrder={["company", "owner", "score"]}
        renderToolbar={({ columnOrder, visibleColumns }) => (
          <div aria-label="Drag order toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <span>{JSON.stringify(columnOrder as DataTableColumnOrderState)}</span>
          </div>
        )}
      />
    );

    const scoreHandle = screen.getByRole("button", { name: "Reorder Score" });
    const companyHeader = container.querySelector<HTMLElement>('.rdtg-headerCell[data-column-id="company"]')!;
    mockClientRect(companyHeader, { left: 0, width: 160 });
    const restoreElementFromPoint = mockElementFromPoint(companyHeader);

    fireEvent.pointerDown(scoreHandle, { button: 0, clientX: 260, clientY: 16 });
    fireEvent.pointerMove(document, { clientX: 16, clientY: 16 });

    expect(companyHeader).toHaveAttribute("data-drop-target", "true");
    expect(companyHeader).toHaveAttribute("data-drop-placement", "before");

    fireEvent.pointerUp(document, { clientX: 16, clientY: 16 });
    restoreElementFromPoint();

    expect(screen.getByLabelText("Drag order toolbar")).toHaveTextContent("score,company,owner");
    expect(screen.getByLabelText("Drag order toolbar")).toHaveTextContent('["score","company","owner"]');
    const reorderedHeaderCells = Array.from(container.querySelectorAll<HTMLElement>(".rdtg-headerCell[data-column-id]"));
    expect(reorderedHeaderCells.map((cell) => cell.dataset.columnId)).toEqual(["score", "company", "owner"]);
  });

  it("emits drag reordered column order without mutating controlled state", () => {
    const onColumnOrderChange = vi.fn();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnReordering
        columnOrder={["company", "score"]}
        onColumnOrderChange={onColumnOrderChange}
      />
    );

    const scoreHandle = screen.getByRole("button", { name: "Reorder Score" });
    const companyHeader = container.querySelector<HTMLElement>('.rdtg-headerCell[data-column-id="company"]')!;
    mockClientRect(companyHeader, { left: 0, width: 160 });
    const restoreElementFromPoint = mockElementFromPoint(companyHeader);

    fireEvent.pointerDown(scoreHandle, { button: 0, clientX: 260, clientY: 16 });
    fireEvent.pointerUp(document, { clientX: 16, clientY: 16 });
    restoreElementFromPoint();

    expect(onColumnOrderChange).toHaveBeenCalledWith(["score", "company"]);
    const headerCells = Array.from(container.querySelectorAll<HTMLElement>(".rdtg-headerCell[data-column-id]"));
    expect(headerCells.map((cell) => cell.dataset.columnId)).toEqual(["company", "score"]);
  });

  it("combines column order with pinning and visibility for saved-view layouts", async () => {
    const user = userEvent.setup();
    const savedViewColumns: Array<DataTableColumn<Row>> = [
      columns[0]!,
      columns[1]!,
      {
        id: "owner",
        header: "Owner",
        renderCell: (row) => row.owner
      }
    ];

    render(
      <DataTable
        rows={rows}
        columns={savedViewColumns}
        getRowId={(row) => row.id}
        defaultColumnOrder={["owner", "score", "company"]}
        defaultColumnPinning={{ left: ["company"] }}
        defaultColumnVisibility={{ score: false }}
        renderToolbar={({ visibleColumns, setColumnOrder }) => (
          <div aria-label="Saved view order toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <button type="button" onClick={() => setColumnOrder(["score", "owner", "company"])}>
              Move score first
            </button>
          </div>
        )}
      />
    );

    expect(screen.getByLabelText("Saved view order toolbar")).toHaveTextContent("company,owner");

    await user.click(screen.getByRole("button", { name: "Move score first" }));

    expect(screen.getByLabelText("Saved view order toolbar")).toHaveTextContent("company,owner");
  });

  it("exposes uncontrolled column sizing state to integration slots", async () => {
    const user = userEvent.setup();
    const resizableColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, resizable: true, minWidth: 120, maxWidth: 320 },
      columns[1]!
    ];
    const { container } = render(
      <DataTable
        rows={rows}
        columns={resizableColumns}
        getRowId={(row) => row.id}
        defaultColumnSizing={{ company: 220 }}
        renderToolbar={({ columnSizing, setColumnSizing }) => (
          <div aria-label="Column sizing toolbar">
            <span>{columnSizing.company}</span>
            <button type="button" onClick={() => setColumnSizing((current) => ({ ...current, company: 260 }))}>
              Save wider company
            </button>
          </div>
        )}
      />
    );
    const headerRow = container.querySelector(".rdtg-headerRow") as HTMLElement;
    const firstRow = container.querySelector(".rdtg-row") as HTMLElement;

    expect(screen.getByLabelText("Column sizing toolbar")).toHaveTextContent("220");
    expect(headerRow.style.gridTemplateColumns).toContain("220px");
    expect(firstRow.style.gridTemplateColumns).toContain("220px");

    await user.click(screen.getByRole("button", { name: "Save wider company" }));

    expect(screen.getByLabelText("Column sizing toolbar")).toHaveTextContent("260");
    expect(headerRow.style.gridTemplateColumns).toContain("260px");
    expect(firstRow.style.gridTemplateColumns).toContain("260px");
  });

  it("supports controlled column sizing state", async () => {
    const user = userEvent.setup();
    const onColumnSizingChange = vi.fn();
    const controlledSizing: DataTableColumnSizingState = { company: 180 };
    const resizableColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, resizable: true, minWidth: 120, maxWidth: 320 },
      columns[1]!
    ];
    const { container } = render(
      <DataTable
        rows={rows}
        columns={resizableColumns}
        getRowId={(row) => row.id}
        columnSizing={controlledSizing}
        onColumnSizingChange={onColumnSizingChange}
        renderToolbar={({ setColumnSizing }) => (
          <button type="button" onClick={() => setColumnSizing((current) => ({ ...current, company: 260 }))}>
            Request wider company
          </button>
        )}
      />
    );
    const headerRow = container.querySelector(".rdtg-headerRow") as HTMLElement;

    expect(headerRow.style.gridTemplateColumns).toContain("180px");

    await user.click(screen.getByRole("button", { name: "Request wider company" }));

    expect(onColumnSizingChange).toHaveBeenCalledWith({ company: 260 });
    expect(headerRow.style.gridTemplateColumns).toContain("180px");
  });

  it("pins columns from uncontrolled saved-view state and exposes pinning to slots", () => {
    const pinningColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, width: "200px" },
      { ...columns[1]!, width: "96px" },
      {
        id: "owner",
        header: "Owner",
        width: "120px",
        renderCell: (row) => row.owner
      }
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={pinningColumns}
        getRowId={(row) => row.id}
        selectedIds={[]}
        onSelectedIdsChange={vi.fn()}
        defaultColumnPinning={{ left: ["owner"], right: ["company"] }}
        renderRowActions={(row) => <button type="button">Open {row.company}</button>}
        renderToolbar={({ columnPinning, visibleColumns }) => (
          <div aria-label="Column pinning toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <span>{JSON.stringify(columnPinning as DataTableColumnPinningState)}</span>
          </div>
        )}
      />
    );

    expect(screen.getByLabelText("Column pinning toolbar")).toHaveTextContent("owner,score,company");
    expect(screen.getByLabelText("Column pinning toolbar")).toHaveTextContent('"left":["owner"]');
    expect(screen.getByLabelText("Column pinning toolbar")).toHaveTextContent('"right":["company"]');

    const headerRow = container.querySelector(".rdtg-headerRow") as HTMLElement;
    expect(headerRow.style.gridTemplateColumns).toContain("44px 120px 96px 200px 56px");

    const headerCells = container.querySelectorAll(".rdtg-headerCell");
    expect(headerCells[0]).toHaveAttribute("data-pinned", "true");
    expect(headerCells[0]).toHaveAttribute("data-pin-side", "left");
    expect((headerCells[0] as HTMLElement).style.getPropertyValue("--rdtg-pin-left")).toBe("0px");

    const ownerHeader = container.querySelector<HTMLElement>('.rdtg-headerCell[data-column-id="owner"]');
    const companyHeader = container.querySelector<HTMLElement>('.rdtg-headerCell[data-column-id="company"]');
    const actionHeader = container.querySelector<HTMLElement>(".rdtg-headerCell.rdtg-actionCell");
    expect(ownerHeader).toHaveAttribute("aria-colindex", "2");
    expect(ownerHeader).toHaveAttribute("data-pin-side", "left");
    expect(ownerHeader).toHaveAttribute("data-pin-edge", "true");
    expect(ownerHeader?.style.getPropertyValue("--rdtg-pin-left")).toBe("44px");
    expect(companyHeader).toHaveAttribute("aria-colindex", "4");
    expect(companyHeader).toHaveAttribute("data-pin-side", "right");
    expect(companyHeader).toHaveAttribute("data-pin-edge", "true");
    expect(companyHeader?.style.getPropertyValue("--rdtg-pin-right")).toBe("56px");
    expect(actionHeader).toHaveAttribute("data-pin-side", "right");
    expect(actionHeader?.style.getPropertyValue("--rdtg-pin-right")).toBe("0px");

    const firstRow = container.querySelector('.rdtg-row[aria-rowindex="2"]') as HTMLElement;
    const ownerCell = firstRow.querySelector<HTMLElement>('[data-column-id="owner"]');
    const companyCell = firstRow.querySelector<HTMLElement>('[data-column-id="company"]');
    expect(ownerCell).toHaveAttribute("aria-colindex", "2");
    expect(ownerCell).toHaveAttribute("data-pin-side", "left");
    expect(ownerCell?.style.getPropertyValue("--rdtg-pin-left")).toBe("44px");
    expect(companyCell).toHaveAttribute("aria-colindex", "4");
    expect(companyCell).toHaveAttribute("data-pin-side", "right");
    expect(companyCell?.style.getPropertyValue("--rdtg-pin-right")).toBe("56px");

    const virtualItem = container.querySelector(".rdtg-virtualItem") as HTMLElement;
    expect(virtualItem.style.top).toBe("0px");
    expect(virtualItem.style.transform).toBe("");
  });

  it("keeps pinned body cells on native sticky offsets while the desktop frame scrolls", () => {
    const pinningColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, width: "240px" },
      { ...columns[1]!, width: "120px" },
      {
        id: "owner",
        header: "Owner",
        width: "180px",
        renderCell: (row) => row.owner
      }
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={pinningColumns}
        getRowId={(row) => row.id}
        selectedIds={[]}
        onSelectedIdsChange={vi.fn()}
        defaultColumnPinning={{ left: ["company"], right: ["owner"] }}
        renderRowActions={(row) => <button type="button">Open {row.company}</button>}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const table = container.querySelector(".rdtg-table") as HTMLElement;
    const firstRow = container.querySelector('.rdtg-row[aria-rowindex="2"]') as HTMLElement;
    const companyCell = firstRow.querySelector<HTMLElement>('[data-column-id="company"]');
    const ownerCell = firstRow.querySelector<HTMLElement>('[data-column-id="owner"]');

    Object.defineProperties(desktopFrame, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 640 },
      scrollLeft: { configurable: true, writable: true, value: 0 }
    });

    expect(companyCell).toHaveAttribute("data-pin-side", "left");
    expect(companyCell?.style.getPropertyValue("--rdtg-pin-left")).toBe("44px");
    expect(ownerCell).toHaveAttribute("data-pin-side", "right");
    expect(ownerCell?.style.getPropertyValue("--rdtg-pin-right")).toBe("56px");

    fireEvent.scroll(desktopFrame);
    desktopFrame.scrollLeft = 128;
    fireEvent.scroll(desktopFrame);

    expect(table.style.getPropertyValue("--rdtg-scroll-left")).toBe("");
    expect(table.style.getPropertyValue("--rdtg-scroll-right")).toBe("");
    expect(companyCell?.style.transform).toBe("");
    expect(ownerCell?.style.transform).toBe("");
  });

  it("supports controlled column pinning state", async () => {
    const user = userEvent.setup();
    const onColumnPinningChange = vi.fn();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        columnPinning={{}}
        onColumnPinningChange={onColumnPinningChange}
        renderToolbar={({ setColumnPinning }) => (
          <button type="button" onClick={() => setColumnPinning((current) => ({ ...current, left: ["score"] }))}>
            Request pinned score
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Request pinned score" }));

    expect(onColumnPinningChange).toHaveBeenCalledWith({ left: ["score"], right: [] });
    expect(container.querySelector('.rdtg-headerCell[data-column-id="score"]')).not.toHaveAttribute("data-pinned");
  });

  it("reorders visible columns when toolbar integrations update uncontrolled pinning", async () => {
    const user = userEvent.setup();
    const pinningColumns: Array<DataTableColumn<Row>> = [
      columns[0]!,
      columns[1]!,
      {
        id: "owner",
        header: "Owner",
        renderCell: (row) => row.owner
      }
    ];

    render(
      <DataTable
        rows={rows}
        columns={pinningColumns}
        getRowId={(row) => row.id}
        renderToolbar={({ visibleColumns, setColumnPinning }) => (
          <div aria-label="Pinning order toolbar">
            <span>{visibleColumns.map((column) => column.id).join(",")}</span>
            <button type="button" onClick={() => setColumnPinning({ right: ["company"] })}>
              Pin company right
            </button>
          </div>
        )}
      />
    );

    expect(screen.getByLabelText("Pinning order toolbar")).toHaveTextContent("company,score,owner");

    await user.click(screen.getByRole("button", { name: "Pin company right" }));

    expect(screen.getByLabelText("Pinning order toolbar")).toHaveTextContent("score,owner,company");
  });

  it("resizes columns with keyboard-accessible separators", async () => {
    const user = userEvent.setup();
    const resizableColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, resizable: true, minWidth: 120, maxWidth: 280 },
      columns[1]!
    ];
    const { container } = render(
      <DataTable
        rows={rows}
        columns={resizableColumns}
        getRowId={(row) => row.id}
        defaultColumnSizing={{ company: 160 }}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const headerRow = container.querySelector(".rdtg-headerRow") as HTMLElement;
    const resizeHandle = within(desktopFrame).getByRole("separator", { name: "Resize Company" });

    expect(resizeHandle).toHaveAttribute("aria-orientation", "vertical");
    expect(resizeHandle).toHaveAttribute("aria-valuemin", "120");
    expect(resizeHandle).toHaveAttribute("aria-valuemax", "280");
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "160");
    expect(resizeHandle).toHaveClass("rdtg-resizeHandle");
    expect(resizeHandle.querySelector("span")).toBeInTheDocument();

    resizeHandle.focus();
    await user.keyboard("[ArrowRight]");

    expect(resizeHandle).toHaveAttribute("aria-valuenow", "176");
    expect(headerRow.style.gridTemplateColumns).toContain("176px");

    await user.keyboard("[Home]");
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "120");
    expect(headerRow.style.gridTemplateColumns).toContain("120px");

    await user.keyboard("[End]");
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "280");
    expect(headerRow.style.gridTemplateColumns).toContain("280px");
  });

  it("resizes columns by pointer drag", () => {
    const resizableColumns: Array<DataTableColumn<Row>> = [
      { ...columns[0]!, resizable: true, minWidth: 120, maxWidth: 320 },
      columns[1]!
    ];
    const { container } = render(
      <DataTable
        rows={rows}
        columns={resizableColumns}
        getRowId={(row) => row.id}
        defaultColumnSizing={{ company: 160 }}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const headerRow = container.querySelector(".rdtg-headerRow") as HTMLElement;
    const resizeHandle = within(desktopFrame).getByRole("separator", { name: "Resize Company" });

    fireEvent.pointerDown(resizeHandle, { clientX: 100 });
    fireEvent.pointerMove(document, { clientX: 148 });
    fireEvent.pointerUp(document);

    expect(headerRow.style.gridTemplateColumns).toContain("208px");
  });

  it("supports desktop grid keyboard movement between header and body cells", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Keyboard accounts"
      />
    );

    const grid = screen.getByRole("grid", { name: "Keyboard accounts" });
    const companyHeaderButton = screen.getByRole("button", { name: "Company" });
    grid.focus();

    expect(companyHeaderButton).toHaveFocus();

    await user.keyboard("[ArrowDown]");
    const firstCompanyCell = container.querySelector<HTMLElement>('[data-row-id="1"][data-column-id="company"]');
    expect(firstCompanyCell).toHaveFocus();

    await user.keyboard("[ArrowRight]");
    expect(container.querySelector<HTMLElement>('[data-row-id="1"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[ControlLeft>][End][/ControlLeft]");
    expect(container.querySelector<HTMLElement>('[data-row-id="2"][data-column-id="score"]')).toHaveFocus();
  });

  it("supports desktop grid PageUp and PageDown movement by visible viewport rows", async () => {
    const user = userEvent.setup();
    const manyRows = Array.from({ length: 8 }, (_, index) => ({
      id: String(index + 1),
      company: `Company ${index + 1}`,
      owner: `Owner ${index + 1}`,
      score: index + 1
    }));

    const { container } = render(
      <DataTable
        rows={manyRows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Paged keyboard accounts"
        height={120}
        rowHeight={40}
      />
    );

    const grid = screen.getByRole("grid", { name: "Paged keyboard accounts" });
    grid.focus();

    await user.keyboard("[ArrowDown]");
    expect(container.querySelector<HTMLElement>('[data-row-id="1"][data-column-id="company"]')).toHaveFocus();

    await user.keyboard("[PageDown]");
    expect(container.querySelector<HTMLElement>('[data-row-id="3"][data-column-id="company"]')).toHaveFocus();

    await user.keyboard("[PageDown]");
    expect(container.querySelector<HTMLElement>('[data-row-id="5"][data-column-id="company"]')).toHaveFocus();

    await user.keyboard("[End]");
    expect(container.querySelector<HTMLElement>('[data-row-id="5"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageUp]");
    expect(container.querySelector<HTMLElement>('[data-row-id="3"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[ControlLeft>][End][/ControlLeft]");
    expect(container.querySelector<HTMLElement>('[data-row-id="8"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageDown]");
    expect(container.querySelector<HTMLElement>('[data-row-id="8"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageUp]");
    expect(container.querySelector<HTMLElement>('[data-row-id="6"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageUp]");
    expect(container.querySelector<HTMLElement>('[data-row-id="4"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageUp]");
    expect(container.querySelector<HTMLElement>('[data-row-id="2"][data-column-id="score"]')).toHaveFocus();

    await user.keyboard("[PageUp]");
    expect(container.querySelector<HTMLElement>('[data-row-id="1"][data-column-id="score"]')).toHaveFocus();
  });

  it("lets keyboard users toggle selection from focused selection cells", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Selectable keyboard accounts"
        selectedIds={[]}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );

    const grid = screen.getByRole("grid", { name: "Selectable keyboard accounts" });
    grid.focus();

    const headerSelectionCell = container.querySelector<HTMLElement>(".rdtg-headerCell.rdtg-selectionCell");
    expect(headerSelectionCell).toHaveFocus();

    await user.keyboard("[ArrowDown]");
    const firstSelectionCell = container.querySelector<HTMLElement>('.rdtg-row[aria-rowindex="2"] .rdtg-selectionCell');
    expect(firstSelectionCell).toHaveFocus();

    await user.keyboard("[Space]");
    expect(onSelectedIdsChange).toHaveBeenCalledWith(["1"]);
  });

  it("starts editable desktop cells from keyboard focus with F2 or Enter", async () => {
    const user = userEvent.setup();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Keyboard company value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        ariaLabel="Editable keyboard accounts"
      />
    );

    const grid = screen.getByRole("grid", { name: "Editable keyboard accounts" });
    grid.focus();

    await user.keyboard("[ArrowDown]");
    const firstCompanyCell = container.querySelector<HTMLElement>('[data-row-id="1"][data-column-id="company"]');
    expect(firstCompanyCell).toHaveFocus();

    fireEvent.keyDown(firstCompanyCell as HTMLElement, { key: "F2" });
    const input = within(container.querySelector(".rdtg-desktopFrame") as HTMLElement)
      .getByRole("textbox", { name: "Keyboard company value" });

    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveValue("Acme Finance");
  });

  it("provides toolbar and footer slots with modeled table state", () => {
    render(
      <DataTable
        rows={rows}
        columns={[
          {
            ...columns[0]!,
            filterActive: undefined,
            filterFn: (row, value) => row.company.toLowerCase().includes(String(value).toLowerCase())
          },
          columns[1]!
        ]}
        getRowId={(row) => row.id}
        selectedIds={["2"]}
        defaultFilters={{ company: "northwind" }}
        defaultSort={{ columnId: "score", direction: "ascending" }}
        stale
        renderToolbar={({ selectedCount, selectedIds, visibleRowCount, filters, sort, stale }) => (
          <div aria-label="Table toolbar">
            <span>{selectedCount} selected</span>
            <span>{selectedIds.join(",")}</span>
            <span>{visibleRowCount} visible</span>
            <span>{String(filters.company)}</span>
            <span>{sort?.columnId}:{sort?.direction}</span>
            <span>{stale ? "stale" : "fresh"}</span>
          </div>
        )}
        renderFooter={({ rows, visibleItems, visibleRows }) => (
          <div aria-label="Table footer">
            <span>{rows.length} total supplied</span>
            <span>{visibleRows.map((row) => row.company).join(", ")}</span>
            <span>{visibleItems.length} visible items</span>
          </div>
        )}
      />
    );

    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("1 selected");
    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("2");
    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("1 visible");
    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("northwind");
    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("score:ascending");
    expect(screen.getByLabelText("Table toolbar")).toHaveTextContent("stale");
    expect(screen.getByLabelText("Table footer")).toHaveTextContent("2 total supplied");
    expect(screen.getByLabelText("Table footer")).toHaveTextContent("Northwind Logistics");
    expect(screen.getByLabelText("Table footer")).toHaveTextContent("1 visible items");
  });

  it("respects per-row selectable rules for row and select-all controls", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={[]}
        onSelectedIdsChange={onSelectedIdsChange}
        isRowSelectable={(row) => row.id !== "2"}
      />
    );

    const disabledRowCheckbox = screen.getAllByRole("checkbox", { name: "Select row 2" })[0]!;
    expect(disabledRowCheckbox).toBeDisabled();

    await user.click(disabledRowCheckbox);
    expect(onSelectedIdsChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: "Select all visible rows" }));
    expect(onSelectedIdsChange).toHaveBeenCalledWith(["1"]);
  });

  it("renders selected ids as read-only when no selection change handler is provided", async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={["1"]}
      />
    );

    const selectedRowCheckbox = screen.getAllByRole("checkbox", { name: "Select row 1" })[0]!;
    const unselectedRowCheckbox = screen.getAllByRole("checkbox", { name: "Select row 2" })[0]!;

    expect(selectedRowCheckbox).toBeChecked();
    expect(selectedRowCheckbox).toBeDisabled();
    expect(unselectedRowCheckbox).toBeDisabled();

    await user.click(unselectedRowCheckbox);
    expect(unselectedRowCheckbox).not.toBeChecked();
  });

  it("sorts internally when sort is not controlled", async () => {
    const user = userEvent.setup();

    render(<DataTable rows={rows} columns={columns} getRowId={(row) => row.id} />);

    await user.click(screen.getByRole("button", { name: "Score" }));

    const renderedRows = screen.getAllByRole("row");
    expect(within(renderedRows[1]!).getByText("Northwind Logistics")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Score" })).toHaveAttribute("aria-sort", "ascending");
  });

  it("clears uncontrolled sorting on the third header activation", async () => {
    const user = userEvent.setup();

    render(<DataTable rows={rows} columns={columns} getRowId={(row) => row.id} />);
    const scoreHeaderButton = screen.getByRole("button", { name: "Score" });

    await user.click(scoreHeaderButton);
    await user.click(scoreHeaderButton);
    await user.click(scoreHeaderButton);

    const renderedRows = screen.getAllByRole("row");
    expect(within(renderedRows[1]!).getByText("Acme Finance")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Score" })).toHaveAttribute("aria-sort", "none");
  });

  it("treats an explicitly undefined sort prop as controlled empty state", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        sort={undefined}
        onSortChange={onSortChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Score" }));

    expect(onSortChange).toHaveBeenCalledWith({ columnId: "score", direction: "ascending" });
    const renderedRows = screen.getAllByRole("row");
    expect(within(renderedRows[1]!).getByText("Acme Finance")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Score" })).toHaveAttribute("aria-sort", "none");
  });

  it("emits undefined when a controlled sort is cleared", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        sort={{ columnId: "score", direction: "descending" }}
        onSortChange={onSortChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Score" }));

    expect(onSortChange).toHaveBeenCalledWith(undefined);
    const renderedRows = screen.getAllByRole("row");
    expect(within(renderedRows[1]!).getByText("Acme Finance")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Score" })).toHaveAttribute("aria-sort", "descending");
  });

  it("keeps row order server-owned when manualSorting is enabled", () => {
    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        defaultSort={{ columnId: "score", direction: "ascending" }}
        manualSorting
      />
    );

    const renderedRows = screen.getAllByRole("row");
    expect(within(renderedRows[1]!).getByText("Acme Finance")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Score" })).toHaveAttribute("aria-sort", "ascending");
  });

  it("requires a sort accessor for local sorting but allows accessorless manual sorting", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const accessorlessColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        sortable: true,
        sortAccessor: undefined
      },
      columns[1]!
    ];
    const { rerender } = render(
      <DataTable rows={rows} columns={accessorlessColumns} getRowId={(row) => row.id} />
    );

    expect(screen.getByRole("button", { name: "Company" })).toBeDisabled();

    rerender(
      <DataTable
        rows={rows}
        columns={accessorlessColumns}
        getRowId={(row) => row.id}
        manualSorting
        onSortChange={onSortChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Company" }));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: "company", direction: "ascending" });
  });

  it("supports inline editing with arbitrary edit controls", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue, commit, cancel }) => (
          <form aria-label="Edit company">
            <input
              aria-label="Company value"
              value={String(value ?? "")}
              onChange={(event) => setValue(event.target.value)}
            />
            <button type="button" onClick={() => commit()}>Save</button>
            <button type="button" onClick={cancel}>Cancel</button>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    const input = within(desktopFrame).getByRole("textbox", { name: "Company value" });
    expect(input).toHaveValue("Acme Finance");

    await user.clear(input);
    await user.type(input, "Acme Capital");
    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));

    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[0],
      value: "Acme Capital"
    });
    expect(within(desktopFrame).queryByRole("form", { name: "Edit company" })).not.toBeInTheDocument();
  });

  it("supports inline editing with select controls and arbitrary option values", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      columns[0]!,
      {
        ...columns[1]!,
        editable: true,
        getEditValue: (row) => row.score,
        renderEditCell: ({ value, setValue, commit, cancel }) => (
          <form aria-label="Edit score">
            <select
              aria-label="Score option"
              value={String(value ?? "")}
              onChange={(event) => setValue(Number(event.target.value))}
            >
              <option value="76">Watch</option>
              <option value="92">Healthy</option>
              <option value="100">Excellent</option>
            </select>
            <button type="button" onClick={() => commit()}>Commit score</button>
            <button type="button" onClick={cancel}>Cancel score</button>
          </form>
        )
      }
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Score" })[0]!);
    const select = within(desktopFrame).getByRole("combobox", { name: "Score option" });
    await user.selectOptions(select, "100");
    await user.click(within(desktopFrame).getByRole("button", { name: "Commit score" }));

    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[1],
      value: 100
    });
  });

  it("supports controlled inline editing state", async () => {
    const user = userEvent.setup();
    const onEditingCellChange = vi.fn();
    const onCellEditCommit = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, commit, cancel }) => (
          <div>
            <span>{String(value)}</span>
            <button type="button" onClick={() => commit()}>Commit initial value</button>
            <button type="button" onClick={cancel}>Close editor</button>
          </div>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        editingCell={{ rowId: "1", columnId: "company" }}
        onEditingCellChange={onEditingCellChange}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    expect(screen.getAllByText("Acme Finance").length).toBeGreaterThan(0);
    await user.click(within(desktopFrame).getByRole("button", { name: "Commit initial value" }));
    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[0],
      value: "Acme Finance"
    });

    onEditingCellChange.mockClear();
    expect(within(desktopFrame).getByRole("button", { name: "Close editor" })).toBeInTheDocument();
    await user.click(within(desktopFrame).getByRole("button", { name: "Close editor" }));
    expect(onEditingCellChange).toHaveBeenCalledWith(undefined);
  });

  it("treats an explicitly undefined editingCell prop as controlled closed state", async () => {
    const user = userEvent.setup();
    const onEditingCellChange = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value }) => (
          <input aria-label="Controlled closed company value" readOnly value={String(value ?? "")} />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        editingCell={undefined}
        onEditingCellChange={onEditingCellChange}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);

    expect(onEditingCellChange).toHaveBeenCalledWith({ rowId: "1", columnId: "company" });
    expect(within(desktopFrame).queryByRole("textbox", { name: "Controlled closed company value" })).not.toBeInTheDocument();
  });

  it("resets draft values when a controlled inline editor switches cells", async () => {
    const user = userEvent.setup();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Controlled company value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];
    const renderControlledTable = (rowId: string) => (
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        editingCell={{ rowId, columnId: "company" }}
      />
    );

    const { container, rerender } = render(renderControlledTable("1"));
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const firstInput = within(desktopFrame).getByRole("textbox", { name: "Controlled company value" });

    await user.type(firstInput, " Draft");
    expect(firstInput).toHaveValue("Acme Finance Draft");

    rerender(renderControlledTable("2"));

    await waitFor(() => {
      expect(within(desktopFrame).getByRole("textbox", { name: "Controlled company value" }))
        .toHaveValue("Northwind Logistics");
    });
  });

  it("syncs controlled inline editors with row refreshes until the user edits the draft", async () => {
    const user = userEvent.setup();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Refreshed company value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];
    const renderControlledTable = (currentRows: Row[]) => (
      <DataTable
        rows={currentRows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        editingCell={{ rowId: "1", columnId: "company" }}
      />
    );

    const { container, rerender } = render(renderControlledTable(rows));
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    const input = within(desktopFrame).getByRole("textbox", { name: "Refreshed company value" });
    expect(input).toHaveValue("Acme Finance");

    rerender(renderControlledTable([
      { ...rows[0]!, company: "Acme Finance SA" },
      rows[1]!
    ]));

    await waitFor(() => expect(input).toHaveValue("Acme Finance SA"));

    await user.clear(input);
    await user.type(input, "User draft");
    expect(input).toHaveValue("User draft");

    rerender(renderControlledTable([
      { ...rows[0]!, company: "Acme Finance Server Refresh" },
      rows[1]!
    ]));

    expect(input).toHaveValue("User draft");
  });

  it("clears pending state and ignores stale async commits when a controlled editor switches cells", async () => {
    const user = userEvent.setup();
    let resolveCommit: (() => void) | undefined;
    const onEditingCellChange = vi.fn();
    const onCellEditCommit = vi.fn(() => new Promise<void>((resolve) => {
      resolveCommit = resolve;
    }));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, pending, commit }) => (
          <form aria-label="Controlled async edit">
            <input aria-label="Controlled async company value" readOnly value={String(value ?? "")} />
            <button type="button" disabled={pending} onClick={() => commit()}>
              {pending ? "Saving" : "Save"}
            </button>
          </form>
        )
      },
      columns[1]!
    ];
    const renderControlledTable = (rowId: string) => (
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        editingCell={{ rowId, columnId: "company" }}
        onEditingCellChange={onEditingCellChange}
        onCellEditCommit={onCellEditCommit}
      />
    );

    const { container, rerender } = render(renderControlledTable("1"));
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));
    expect(within(desktopFrame).getByRole("button", { name: "Saving" })).toBeDisabled();

    rerender(renderControlledTable("2"));

    await waitFor(() => {
      expect(within(desktopFrame).getByRole("textbox", { name: "Controlled async company value" }))
        .toHaveValue("Northwind Logistics");
    });
    expect(within(desktopFrame).getByRole("button", { name: "Save" })).not.toBeDisabled();

    onEditingCellChange.mockClear();
    await act(async () => {
      resolveCommit?.();
    });

    expect(onEditingCellChange).not.toHaveBeenCalled();
    expect(within(desktopFrame).getByRole("textbox", { name: "Controlled async company value" }))
      .toHaveValue("Northwind Logistics");
  });

  it("discards inline editing when the edited column leaves the visible model", async () => {
    const user = userEvent.setup();
    const onEditingCellChange = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Visibility company value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onEditingCellChange={onEditingCellChange}
        renderToolbar={({ setColumnVisibility }) => (
          <div aria-label="Edit visibility toolbar">
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, company: false }))}>
              Hide company
            </button>
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, company: true }))}>
              Show company
            </button>
          </div>
        )}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    const input = within(desktopFrame).getByRole("textbox", { name: "Visibility company value" });
    await user.type(input, " Draft");
    expect(input).toHaveValue("Acme Finance Draft");

    await user.click(screen.getByRole("button", { name: "Hide company" }));

    await waitFor(() => {
      expect(within(desktopFrame).queryByRole("textbox", { name: "Visibility company value" })).not.toBeInTheDocument();
    });
    expect(onEditingCellChange).toHaveBeenLastCalledWith(undefined);

    await user.click(screen.getByRole("button", { name: "Show company" }));

    expect(within(desktopFrame).queryByRole("textbox", { name: "Visibility company value" })).not.toBeInTheDocument();
    expect(within(desktopFrame).getAllByText("Acme Finance").length).toBeGreaterThan(0);
  });

  it("drops pending inline editing and ignores stale commits when the edited column is hidden", async () => {
    const user = userEvent.setup();
    let resolveCommit: (() => void) | undefined;
    const onCellEditCommit = vi.fn(() => new Promise<void>((resolve) => {
      resolveCommit = resolve;
    }));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, pending, commit }) => (
          <form aria-label="Pending visibility edit">
            <input aria-label="Pending visibility company value" readOnly value={String(value ?? "")} />
            <button type="button" disabled={pending} onClick={() => commit()}>
              {pending ? "Saving" : "Save"}
            </button>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
        renderToolbar={({ setColumnVisibility }) => (
          <div aria-label="Pending edit visibility toolbar">
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, company: false }))}>
              Hide company
            </button>
            <button type="button" onClick={() => setColumnVisibility((current) => ({ ...current, company: true }))}>
              Show company
            </button>
          </div>
        )}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));
    expect(within(desktopFrame).getByRole("button", { name: "Saving" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Hide company" }));
    expect(within(desktopFrame).queryByRole("form", { name: "Pending visibility edit" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show company" }));
    expect(within(desktopFrame).queryByRole("form", { name: "Pending visibility edit" })).not.toBeInTheDocument();

    await act(async () => {
      resolveCommit?.();
    });

    expect(within(desktopFrame).queryByRole("form", { name: "Pending visibility edit" })).not.toBeInTheDocument();
    expect(within(desktopFrame).getAllByRole("button", { name: "Edit Company" }).length).toBeGreaterThan(0);
  });

  it("focuses inline editors and handles package-owned edit shortcuts", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const onRowClick = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Company shortcut value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
        onRowClick={onRowClick}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    const input = within(desktopFrame).getByRole("textbox", { name: "Company shortcut value" });
    await waitFor(() => expect(input).toHaveFocus());

    await user.clear(input);
    await user.type(input, "Acme Holdings");
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });

    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[0],
      value: "Acme Holdings"
    });
    expect(onRowClick).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(within(desktopFrame).queryByRole("textbox", { name: "Company shortcut value" })).not.toBeInTheDocument();
    });
  });

  it("cancels inline editing with Escape without activating the row", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const onRowClick = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Company cancel value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
        onRowClick={onRowClick}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    const input = within(desktopFrame).getByRole("textbox", { name: "Company cancel value" });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCellEditCommit).not.toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
    expect(within(desktopFrame).queryByRole("textbox", { name: "Company cancel value" })).not.toBeInTheDocument();
  });

  it("allows inline editors to commit an explicit undefined value", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ commit }) => (
          <button type="button" onClick={() => commit(undefined)}>
            Clear company
          </button>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    await user.click(within(desktopFrame).getByRole("button", { name: "Clear company" }));

    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[0],
      value: undefined
    });
  });

  it("keeps inline editors pending until asynchronous commits resolve", async () => {
    const user = userEvent.setup();
    let resolveCommit: (() => void) | undefined;
    const onCellEditCommit = vi.fn(() => new Promise<void>((resolve) => {
      resolveCommit = resolve;
    }));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue, commit, pending }) => (
          <form aria-label="Async edit company">
            <input
              aria-label="Async company value"
              value={String(value ?? "")}
              onChange={(event) => setValue(event.target.value)}
            />
            <button type="button" disabled={pending} onClick={() => commit()}>
              {pending ? "Saving" : "Save"}
            </button>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));

    expect(within(desktopFrame).getByRole("form", { name: "Async edit company" }).closest(".rdtg-editCell"))
      .toHaveAttribute("aria-busy", "true");
    expect(within(desktopFrame).getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(within(desktopFrame).getByRole("textbox", { name: "Async company value" })).toBeInTheDocument();

    await act(async () => {
      resolveCommit?.();
    });

    await waitFor(() => {
      expect(within(desktopFrame).queryByRole("form", { name: "Async edit company" })).not.toBeInTheDocument();
    });
  });

  it("keeps inline editors open and reports rejected asynchronous commits", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn(() => Promise.reject(new Error("Owner name is required")));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue, commit, error }) => (
          <form aria-label="Rejected edit company">
            <input
              aria-label="Rejected company value"
              value={String(value ?? "")}
              onChange={(event) => setValue(event.target.value)}
            />
            <button type="button" onClick={() => commit()}>Save</button>
            <span>{error ? "Has error" : "No error"}</span>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));

    expect(await within(desktopFrame).findByRole("alert")).toHaveTextContent("Owner name is required");
    expect(within(desktopFrame).getByRole("textbox", { name: "Rejected company value" })).toBeInTheDocument();
    expect(within(desktopFrame).getByText("Has error")).toBeInTheDocument();

    await user.type(within(desktopFrame).getByRole("textbox", { name: "Rejected company value" }), " Updated");
    expect(within(desktopFrame).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(desktopFrame).getByText("No error")).toBeInTheDocument();
  });

  it("exposes edit error ids so custom controls can describe validation messages", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn(() => Promise.reject(new Error("Company must be unique")));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, commit, error, errorId }) => (
          <form aria-label="Described edit company">
            <input
              aria-label="Described company value"
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? "true" : "false"}
              readOnly
              value={String(value ?? "")}
            />
            <button type="button" onClick={() => commit()}>Save</button>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    const input = within(desktopFrame).getByRole("textbox", { name: "Described company value" });
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");

    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));

    const alert = await within(desktopFrame).findByRole("alert");
    expect(alert).toHaveTextContent("Company must be unique");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("lets commit handlers keep an editor open with a validation message", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn(() => ({ close: false, error: "Choose a different company" }));
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, commit }) => (
          <form aria-label="Validation edit company">
            <input aria-label="Validation company value" readOnly value={String(value ?? "")} />
            <button type="button" onClick={() => commit()}>Save</button>
          </form>
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    await user.click(within(desktopFrame).getAllByRole("button", { name: "Edit Company" })[0]!);
    await user.click(within(desktopFrame).getByRole("button", { name: "Save" }));

    expect(within(desktopFrame).getByRole("alert")).toHaveTextContent("Choose a different company");
    expect(within(desktopFrame).getByRole("textbox", { name: "Validation company value" })).toBeInTheDocument();
  });

  it("supports inline editing in the built-in mobile field layout", async () => {
    const user = userEvent.setup();
    const onCellEditCommit = vi.fn();
    const onRowClick = vi.fn();
    const editableColumns: Array<DataTableColumn<Row>> = [
      {
        ...columns[0]!,
        editable: true,
        getEditValue: (row) => row.company,
        renderEditCell: ({ value, setValue }) => (
          <input
            aria-label="Mobile company value"
            value={String(value ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      },
      columns[1]!
    ];

    const { container } = render(
      <DataTable
        rows={rows}
        columns={editableColumns}
        getRowId={(row) => row.id}
        onCellEditCommit={onCellEditCommit}
        onRowClick={onRowClick}
        rowAriaLabel={(row) => row.company}
      />
    );
    const mobileFrame = container.querySelector(".rdtg-mobileFrame") as HTMLElement;
    const firstMobileCard = within(mobileFrame).getByLabelText("Acme Finance");

    await user.click(within(firstMobileCard).getByRole("button", { name: "Edit Company" }));
    const input = within(firstMobileCard).getByRole("textbox", { name: "Mobile company value" });
    await waitFor(() => expect(input).toHaveFocus());

    await user.clear(input);
    await user.type(input, "Acme Mobile");
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });

    expect(onCellEditCommit).toHaveBeenCalledWith({
      row: rows[0],
      rowId: "1",
      column: editableColumns[0],
      value: "Acme Mobile"
    });
    expect(onRowClick).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(within(firstMobileCard).queryByRole("textbox", { name: "Mobile company value" })).not.toBeInTheDocument();
    });
  });

  it("renders real grouped states with progress and summary metadata", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        groups={[
          {
            id: "active",
            label: "Active accounts",
            rowIds: ["1", "2"],
            totalCount: 12,
            loadedCount: 2,
            state: "partial",
            progressLabel: "2 loaded",
            progressValue: 16
          }
        ]}
      />
    );

    const group = screen.getAllByRole("button", { name: /Active accounts/ })[0]!.closest(".rdtg-groupRow");
    expect(group).not.toBeNull();
    expect(within(group as HTMLElement).getByText("2 loaded")).toBeInTheDocument();
    expect(container.querySelector(".rdtg-mobileGroup")).toHaveTextContent("Active accounts");
  });

  it("passes toggle context into custom group headers", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        groups={[
          {
            id: "active",
            label: "Active accounts",
            rowIds: ["1", "2"],
            totalCount: 2
          }
        ]}
        renderGroupHeader={(group, summary, context) => (
          <button type="button" aria-expanded={!context.collapsed} onClick={context.toggle}>
            {group.label} {summary.loadedCount}
          </button>
        )}
        renderMobileGroupHeader={(group, _summary, context) => (
          <button type="button" aria-expanded={!context.collapsed} onClick={context.toggle}>
            Mobile {group.label}
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Active accounts 2" }));
    expect(screen.getByRole("button", { name: "Active accounts 2" })).toHaveAttribute("aria-expanded", "false");
    expect(within(container.querySelector(".rdtg-mobileFrame") as HTMLElement).getByRole("button", { name: "Mobile Active accounts" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("keeps collapsing desktop group rows as inert visual exits until collapse motion completes", () => {
    vi.useFakeTimers();

    try {
      const { container } = render(
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          groups={[
            {
              id: "active",
              label: "Active accounts",
              rowIds: ["1", "2"]
            }
          ]}
          motion="always"
        />
      );
      const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
      const groupToggle = within(desktopFrame).getByRole("button", { name: /Active accounts/ });
      expect(groupToggle.querySelector(".rdtg-expandIcon")).toHaveAttribute("data-expanded", "true");

      fireEvent.click(groupToggle);

      const liveRows = container.querySelectorAll(".rdtg-virtualItem:not(.rdtg-virtualItemExiting) .rdtg-row");
      const exitingRows = container.querySelectorAll(".rdtg-virtualItemExiting");
      expect(liveRows).toHaveLength(0);
      expect(exitingRows).toHaveLength(2);
      expect(exitingRows[0]).toHaveAttribute("aria-hidden", "true");
      expect(exitingRows[0]).toHaveAttribute("inert");
      expect(within(desktopFrame).getByRole("button", { name: /Active accounts/ })).toHaveAttribute("aria-expanded", "false");
      expect(groupToggle.querySelector(".rdtg-expandIcon")).toHaveAttribute("data-expanded", "false");

      act(() => {
        vi.advanceTimersByTime(520);
      });

      expect(container.querySelectorAll(".rdtg-virtualItemExiting")).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skips collapsing row exits when reduced motion is requested", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        groups={[
          {
            id: "active",
            label: "Active accounts",
            rowIds: ["1", "2"]
          }
        ]}
        motion="reduced"
      />
    );
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;

    fireEvent.click(within(desktopFrame).getByRole("button", { name: /Active accounts/ }));

    expect(container.querySelectorAll(".rdtg-virtualItemExiting")).toHaveLength(0);
    expect(container.querySelectorAll(".rdtg-virtualItem:not(.rdtg-virtualItemExiting) .rdtg-row")).toHaveLength(0);
  });

  it("does not let custom group headers toggle non-collapsible groups", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        groups={[
          {
            id: "active",
            label: "Active accounts",
            rowIds: ["1", "2"],
            collapsible: false
          }
        ]}
        renderGroupHeader={(_group, _summary, context) => (
          <button type="button" aria-expanded={!context.collapsed} onClick={context.toggle}>
            Forced toggle
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Forced toggle" }));
    const desktopFrame = container.querySelector(".rdtg-desktopFrame") as HTMLElement;
    expect(within(desktopFrame).getByText("Acme Finance")).toBeInTheDocument();
    expect(within(desktopFrame).getByText("Northwind Logistics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forced toggle" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps grouped and selected state available in the mobile representation", () => {
    const { container } = render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={["1"]}
        groups={[
          {
            id: "active",
            label: "Active accounts",
            rowIds: ["1", "2"],
            totalCount: 12,
            loadedCount: 2,
            state: "partial",
            progressLabel: "2 loaded",
            progressValue: 16
          }
        ]}
      />
    );

    const mobileFrame = container.querySelector(".rdtg-mobileFrame");
    expect(mobileFrame).not.toBeNull();
    expect(within(mobileFrame as HTMLElement).getByRole("button", { name: /Active accounts/ })).toHaveAttribute("aria-expanded", "true");
    expect(within(mobileFrame as HTMLElement).getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
    expect(within(mobileFrame as HTMLElement).getByText("Acme Finance")).toBeInTheDocument();
  });
});
