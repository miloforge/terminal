import { describe, expect, it } from "vitest";
import {
  getExpandedPrincipleIndex,
  selectPrinciple,
} from "../principleExpansion";

describe("principle expansion", () => {
  it("starts with every item folded", () => {
    expect(getExpandedPrincipleIndex({ selectedIndex: null })).toBeNull();
  });

  it("expands the last hovered, focused, clicked, or touched item", () => {
    const selectedIndex = selectPrinciple(2);

    expect(getExpandedPrincipleIndex({ selectedIndex })).toBe(2);
  });

  it("keeps the hovered item expanded after hover leaves", () => {
    const selectedIndexAfterHover = selectPrinciple(2);

    expect(
      getExpandedPrincipleIndex({ selectedIndex: selectedIndexAfterHover }),
    ).toBe(2);
  });

  it("keeps one item expanded when the same item is selected again", () => {
    expect(selectPrinciple(1)).toBe(1);
  });
});
