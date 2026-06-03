import { describe, expect, it } from "vitest";
import { applyRowSelectionUpdate, rowSelectionToSelectedIds, selectedIdsToRowSelection } from "./rowSelection";

describe("TanStack row selection adapters", () => {
  it("converts the public selectedIds array into TanStack rowSelection state", () => {
    expect(selectedIdsToRowSelection(["a", "b"])).toEqual({ a: true, b: true });
  });

  it("converts TanStack rowSelection state back into the public selectedIds array", () => {
    expect(rowSelectionToSelectedIds({ a: true, b: false, c: true })).toEqual(["a", "c"]);
  });

  it("applies TanStack rowSelection updater functions to the public selectedIds array", () => {
    expect(applyRowSelectionUpdate(["a"], (current) => ({ ...current, b: true, a: false }))).toEqual(["b"]);
  });
});
