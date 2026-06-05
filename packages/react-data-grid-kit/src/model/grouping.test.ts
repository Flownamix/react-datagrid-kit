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

  it("appends an ungrouped loading sentinel only when server virtualization is enabled", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: [],
      groups: undefined,
      serverVirtualization: {
        enabled: true,
        rows: {
          hasMoreRows: true,
          loadingMore: true
        }
      }
    });

    expect(items.map((item) => item.kind)).toEqual(["row", "row", "row", "loadMore"]);
    expect(items.at(-1)).toMatchObject({
      kind: "loadMore",
      scope: "rows",
      status: "loading",
      rowCount: 3
    });
  });

  it("appends group sentinels for expanded partial groups", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: [],
      groups: [{
        id: "ready",
        label: "Ready",
        rowIds: ["a", "b"],
        totalCount: 4,
        loadingMore: true
      }],
      serverVirtualization: {
        enabled: true
      }
    });

    expect(items.map((item) => item.kind)).toEqual(["group", "row", "row", "loadMore", "row"]);
    expect(items[3]).toMatchObject({
      kind: "loadMore",
      scope: "group",
      status: "loading",
      groupId: "ready",
      rowCount: 2
    });
  });

  it("does not append group sentinels for collapsed groups", () => {
    const items = groupRows({
      rows,
      getRowId: (row) => row.id,
      collapsedGroupIds: ["ready"],
      groups: [{
        id: "ready",
        label: "Ready",
        rowIds: ["a", "b"],
        totalCount: 4,
        loadingMore: true
      }],
      serverVirtualization: {
        enabled: true
      }
    });

    expect(items.map((item) => item.kind)).toEqual(["group", "row"]);
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
