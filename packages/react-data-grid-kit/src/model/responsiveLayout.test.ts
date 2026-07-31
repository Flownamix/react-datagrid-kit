import { describe, expect, it } from "vitest";
import type { DataTableColumn } from "../types";
import { responsiveColumnLayout, responsiveGridTemplate } from "./responsiveLayout";

interface Row {
  id: string;
}

function column(
  id: string,
  responsiveMode: DataTableColumn<Row>["responsiveMode"] = "auto",
  responsivePriority = 100,
  width = "160px"
): DataTableColumn<Row> {
  return {
    id,
    header: id,
    width,
    responsiveMode,
    responsivePriority,
    renderCell: (row) => row.id
  };
}

describe("responsiveColumnLayout", () => {
  it("keeps all columns when they fit", () => {
    const columns = [column("name"), column("status")];
    const layout = responsiveColumnLayout({
      columns,
      availableWidth: 400,
      columnSizing: {},
      columnPinning: {},
      selectable: false,
      hasActions: false,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name", "status"]);
    expect(layout.detailColumns).toEqual([]);
    expect(layout.hasExpander).toBe(false);
  });

  it("keeps always columns and packs automatic columns by priority", () => {
    const columns = [
      column("name", "always", 100, "180px"),
      column("date", "auto", 10, "120px"),
      column("owner", "auto", 20, "140px"),
      column("metadata", "auto", 30, "180px")
    ];
    const layout = responsiveColumnLayout({
      columns,
      availableWidth: 500,
      columnSizing: {},
      columnPinning: {},
      selectable: false,
      hasActions: true,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name", "date"]);
    expect(layout.detailColumns.map(({ id }) => id)).toEqual(["owner", "metadata"]);
    expect(layout.hasExpander).toBe(true);
  });

  it("moves detail-only columns out of the summary even when space is available", () => {
    const columns = [column("name", "always"), column("metadata", "detail-only")];
    const layout = responsiveColumnLayout({
      columns,
      availableWidth: 1200,
      columnSizing: {},
      columnPinning: {},
      selectable: false,
      hasActions: false,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name"]);
    expect(layout.detailColumns.map(({ id }) => id)).toEqual(["metadata"]);
  });

  it("prefers pinned automatic columns before unpinned columns", () => {
    const columns = [column("name", "always"), column("status", "auto", 10), column("owner", "auto", 30)];
    const layout = responsiveColumnLayout({
      columns,
      availableWidth: 400,
      columnSizing: {},
      columnPinning: { right: ["owner"] },
      selectable: false,
      hasActions: false,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name", "owner"]);
    expect(layout.detailColumns.map(({ id }) => id)).toEqual(["status"]);
  });

  it("keeps responsive tracks within the available grid using fractional tracks", () => {
    expect(responsiveGridTemplate({
      columns: [column("name", "always", 0, "180px"), column("status", "auto", 10, "120px")],
      selectable: true,
      hasActions: true,
      hasExpander: true,
      columnSizing: {}
    })).toBe("44px 44px minmax(0, 180fr) minmax(0, 120fr) 152px");
  });

  it("uses the minimum track from flexible minmax widths for packing", () => {
    const columns = [column("name", "always", 0, "minmax(240px, 2fr)"), column("status", "auto", 10, "120px")];
    const layout = responsiveColumnLayout({
      columns,
      availableWidth: 350,
      columnSizing: {},
      columnPinning: {},
      selectable: false,
      hasActions: false,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name"]);
    expect(layout.detailColumns.map(({ id }) => id)).toEqual(["status"]);
  });

  it("shrinks protected columns to their configured minimum before collapsing priority fields", () => {
    const name = { ...column("name", "always", 0, "230px"), minWidth: 140 };
    const layout = responsiveColumnLayout({
      columns: [name, column("date", "auto", 10, "170px"), column("result", "auto", 10, "148px")],
      availableWidth: 676,
      columnSizing: {},
      columnPinning: {},
      selectable: false,
      hasActions: true,
      enabled: true
    });

    expect(layout.summaryColumns.map(({ id }) => id)).toEqual(["name", "date", "result"]);
    expect(layout.detailColumns).toEqual([]);
  });
});
