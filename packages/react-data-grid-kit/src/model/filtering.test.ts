import { describe, expect, it } from "vitest";
import { applyColumnFiltersUpdate, columnFiltersToFilters, filtersToColumnFilters, rowMatchesQuickSearch } from "./filtering";
import type { DataTableColumn } from "../types";

describe("TanStack column filter adapters", () => {
  it("converts package filter state into TanStack column filters for filterable columns only", () => {
    expect(filtersToColumnFilters({ company: "acme", owner: "nandi" }, ["company"])).toEqual([
      { id: "company", value: "acme" }
    ]);
  });

  it("merges TanStack column filters back into package filter state", () => {
    expect(columnFiltersToFilters([{ id: "company", value: "northwind" }], { company: "acme", owner: "nandi" }))
      .toEqual({ company: "northwind", owner: "nandi" });
  });

  it("applies TanStack column filter updater functions while preserving non-local filter state", () => {
    expect(applyColumnFiltersUpdate(
      { company: "acme", owner: "nandi", savedView: "late" },
      ["company", "owner"],
      (current) => current.filter((filter) => filter.id !== "owner")
    )).toEqual({ company: "acme", savedView: "late" });
  });
});

interface SearchRow {
  id: string;
  company: string;
  owner: string;
  region: string;
}

describe("quick search matching", () => {
  const row: SearchRow = {
    id: "1",
    company: "Acme Finance",
    owner: "Nandi",
    region: "Gauteng"
  };
  const columns: Array<DataTableColumn<SearchRow>> = [
    {
      id: "company",
      header: "Company",
      quickSearchText: (candidate) => `${candidate.company} ${candidate.owner}`,
      renderCell: (candidate) => candidate.company
    },
    {
      id: "region",
      header: "Region",
      quickSearchable: false,
      renderCell: (candidate) => candidate.region
    }
  ];

  it("matches explicit column quick-search text case-insensitively", () => {
    expect(rowMatchesQuickSearch({ columns, query: "nandi", row, rowId: row.id })).toBe(true);
  });

  it("excludes columns opted out of quick search", () => {
    expect(rowMatchesQuickSearch({ columns, query: "gauteng", row, rowId: row.id })).toBe(false);
  });
});
