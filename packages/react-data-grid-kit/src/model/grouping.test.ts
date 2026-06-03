import { describe, expect, it } from "vitest";
import { defaultCollapsedIds, groupRows, pruneCollapsedIds, toggleCollapsedGroup } from "./grouping";

interface Row {
  id: string;
  status: string;
}

const rows: Row[] = [
  { id: "a", status: "ready" },
  { id: "b", status: "ready" },
  { id: "c", status: "blocked" }
];

describe("groupRows", () => {
  it("resolves groups by row ids and keeps ungrouped rows visible", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: [],
      groups: [{ id: "ready", label: "Ready", rowIds: ["a", "b"] }]
    });

    expect(items.map((item) => item.id)).toEqual(["ready", "a", "b", "c"]);
  });

  it("preserves the incoming row order for row-id groups so sorting applies inside groups", () => {
    const sortedRows = [rows[2]!, rows[1]!, rows[0]!];
    const items = groupRows({
      rows: sortedRows,
      getRowId: (row) => row.id,
      collapsedGroupIds: [],
      groups: [{ id: "ready", label: "Ready", rowIds: ["a", "b"] }]
    });

    expect(items.map((item) => item.id)).toEqual(["ready", "b", "a", "c"]);
  });

  it("does not duplicate rows assigned to more than one group", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: [],
      groups: [
        { id: "first", label: "First", rowIds: ["a", "b"] },
        { id: "second", label: "Second", rowIds: ["b", "c"] }
      ]
    });

    expect(items.map((item) => item.id)).toEqual(["first", "a", "b", "second", "c"]);
  });

  it("hides group children when collapsed", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: ["ready"],
      groups: [{ id: "ready", label: "Ready", rowIds: ["a", "b"] }]
    });

    expect(items.map((item) => item.id)).toEqual(["ready", "c"]);
  });
});

describe("collapsed group normalization", () => {
  it("does not allow non-collapsible groups to start collapsed", () => {
    expect(defaultCollapsedIds([
      { id: "ready", label: "Ready", defaultCollapsed: true },
      { id: "fixed", label: "Fixed", defaultCollapsed: true, collapsible: false }
    ])).toEqual(["ready"]);
  });

  it("prunes controlled collapsed ids for non-collapsible groups", () => {
    expect(pruneCollapsedIds(["ready", "fixed"], [
      { id: "ready", label: "Ready" },
      { id: "fixed", label: "Fixed", collapsible: false }
    ])).toEqual(["ready"]);
  });
});

describe("toggleCollapsedGroup", () => {
  it("toggles group id membership", () => {
    expect(toggleCollapsedGroup([], "ready")).toEqual(["ready"]);
    expect(toggleCollapsedGroup(["ready", "blocked"], "ready")).toEqual(["blocked"]);
  });
});
