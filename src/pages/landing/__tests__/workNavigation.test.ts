import { describe, expect, it } from "vitest";
import {
  getCaseTransitionXOffset,
  getWorkEntryIndex,
  getWorkNavigationTarget,
} from "../workNavigation";

describe("work case navigation", () => {
  it("enters work on the first case when scrolling forward", () => {
    expect(getWorkEntryIndex(1, 3)).toBe(0);
  });

  it("enters work on the last case when scrolling backward", () => {
    expect(getWorkEntryIndex(-1, 3)).toBe(2);
  });

  it("replaces the active case before leaving the work section", () => {
    expect(getWorkNavigationTarget(0, 1, 3)).toEqual({
      type: "case",
      index: 1,
    });
  });

  it("resumes section navigation after the last case", () => {
    expect(getWorkNavigationTarget(2, 1, 3)).toEqual({
      type: "section",
      direction: 1,
    });
  });

  it("resumes section navigation before the first case", () => {
    expect(getWorkNavigationTarget(0, -1, 3)).toEqual({
      type: "section",
      direction: -1,
    });
  });

  it("moves cases right-to-left when scrolling forward", () => {
    expect(getCaseTransitionXOffset(1, "enter", 24)).toBe(24);
    expect(getCaseTransitionXOffset(1, "exit", 24)).toBe(-24);
  });

  it("moves cases left-to-right when scrolling backward", () => {
    expect(getCaseTransitionXOffset(-1, "enter", 24)).toBe(-24);
    expect(getCaseTransitionXOffset(-1, "exit", 24)).toBe(24);
  });
});
