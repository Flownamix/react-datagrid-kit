import { describe, expect, it } from "vitest";
import type { DataTableColumn } from "../types";
import { compareSortValues, nextSort } from "./sorting";

interface Row {
  id: string;
  amount: number | null;
  label: string;
}

const columns: Array<DataTableColumn<Row>> = [
  {
    id: "amount",
    header: "Amount",
    sortable: true,
    sortAccessor: (row) => row.amount,
    renderCell: (row) => row.amount
  },
  {
    id: "label",
    header: "Label",
    sortable: true,
    sortAccessor: (row) => row.label,
    renderCell: (row) => row.label
  }
];

describe("compareSortValues", () => {
  it("orders primitive values and leaves null values last for ascending TanStack sorting", () => {
    const rows: Row[] = [
      { id: "a", amount: 30, label: "three" },
      { id: "b", amount: null, label: "none" },
      { id: "c", amount: 10, label: "one" }
    ].sort((left, right) => compareSortValues(left.amount, right.amount));

    expect(rows.map((row) => row.id)).toEqual(["c", "a", "b"]);
  });
});

describe("nextSort", () => {
  it("cycles between ascending and descending for the active column", () => {
    expect(nextSort(columns[0]!, undefined)).toEqual({ columnId: "amount", direction: "ascending" });
    expect(nextSort(columns[0]!, { columnId: "amount", direction: "ascending" })).toEqual({
      columnId: "amount",
      direction: "descending"
    });
    expect(nextSort(columns[0]!, { columnId: "amount", direction: "descending" })).toBeUndefined();
    expect(nextSort(columns[1]!, { columnId: "amount", direction: "descending" })).toEqual({
      columnId: "label",
      direction: "ascending"
    });
  });
});
