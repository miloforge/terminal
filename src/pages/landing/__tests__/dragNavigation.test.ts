import { describe, expect, it } from "vitest";
import { getDragNavigationDirection } from "../dragNavigation";

describe("getDragNavigationDirection", () => {
  it("moves to the next section after an upward vertical drag", () => {
    expect(getDragNavigationDirection(6, -80)).toBe(1);
  });

  it("moves to the previous section after a downward vertical drag", () => {
    expect(getDragNavigationDirection(-8, 80)).toBe(-1);
  });

  it("ignores short accidental drags", () => {
    expect(getDragNavigationDirection(0, -40)).toBeNull();
  });

  it("ignores mostly horizontal drags", () => {
    expect(getDragNavigationDirection(90, -70)).toBeNull();
  });
});
