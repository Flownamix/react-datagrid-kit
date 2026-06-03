import { describe, expect, it } from "vitest";
import { moveColumnInOrder } from "./columnOrdering";

describe("moveColumnInOrder", () => {
  it("moves a source column before a target column in the normalized order", () => {
    expect(moveColumnInOrder({
      currentOrder: ["owner", "score"],
      allColumnIds: ["company", "owner", "score", "region"],
      sourceId: "score",
      targetId: "owner",
      placement: "before"
    })).toEqual(["score", "owner", "company", "region"]);
  });

  it("moves a source column after a target column and preserves missing columns", () => {
    expect(moveColumnInOrder({
      currentOrder: ["company"],
      allColumnIds: ["company", "owner", "score"],
      sourceId: "company",
      targetId: "score",
      placement: "after"
    })).toEqual(["owner", "score", "company"]);
  });

  it("ignores stale source or target ids without dropping known columns", () => {
    expect(moveColumnInOrder({
      currentOrder: ["missing", "score", "score"],
      allColumnIds: ["company", "owner", "score"],
      sourceId: "missing",
      targetId: "owner",
      placement: "before"
    })).toEqual(["score", "company", "owner"]);
  });
});
