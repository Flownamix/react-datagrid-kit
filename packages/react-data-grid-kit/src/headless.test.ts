import { describe, expect, expectTypeOf, it } from "vitest";
import { groupRows, nextSort, selectedIdsToRowSelection } from "./headless";
import type {
  DataTableColumnOrderState,
  DataTableColumnOrderUpdater,
  DataTableColumnPinningState,
  DataTableColumnSizingState,
  DataTableColumnVisibilityState,
  DataTableDensity,
  DataTableMotionPreference,
  DataTableRenderContext,
  DataTableRowId
} from "./headless";

interface Row {
  id: string;
  company: string;
}

describe("headless entrypoint", () => {
  it("exports model helpers from the headless package entry", () => {
    expect(selectedIdsToRowSelection(["1"])).toEqual({ "1": true });
    expect(nextSort({ id: "company", header: "Company", sortable: true, renderCell: (row: Row) => row.company }, undefined))
      .toEqual({ columnId: "company", direction: "ascending" });
    expect(nextSort(
      { id: "company", header: "Company", sortable: true, renderCell: (row: Row) => row.company },
      { columnId: "company", direction: "descending" }
    )).toBeUndefined();
    expect(groupRows({
      rows: [{ id: "1", company: "Acme" }],
      groups: undefined,
      collapsedGroupIds: [],
      getRowId: (row) => row.id
    })).toEqual([{ kind: "row", id: "1", row: { id: "1", company: "Acme" } }]);
  });

  it("exports saved-view and render-context types for integration code", () => {
    expectTypeOf<DataTableColumnVisibilityState>().toEqualTypeOf<Record<string, boolean>>();
    expectTypeOf<DataTableColumnOrderState>().toEqualTypeOf<string[]>();
    expectTypeOf<DataTableColumnOrderUpdater>().toEqualTypeOf<
      DataTableColumnOrderState | ((current: DataTableColumnOrderState) => DataTableColumnOrderState)
    >();
    expectTypeOf<DataTableColumnSizingState>().toEqualTypeOf<Record<string, number>>();
    expectTypeOf<DataTableColumnPinningState>().toEqualTypeOf<{ left?: string[]; right?: string[] }>();
    expectTypeOf<DataTableRowId>().toEqualTypeOf<string>();
    expectTypeOf<DataTableDensity>().toEqualTypeOf<"compact" | "comfortable">();
    expectTypeOf<DataTableMotionPreference>().toEqualTypeOf<"system" | "always" | "reduced">();
    expectTypeOf<DataTableRenderContext<Row>["setColumnOrder"]>().parameters.toEqualTypeOf<[DataTableColumnOrderUpdater]>();
  });
});
