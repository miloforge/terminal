export type WorkNavigationDirection = 1 | -1;
export type CaseTransitionPhase = "enter" | "exit";

type CaseNavigationTarget = {
  type: "case";
  index: number;
};

type SectionNavigationTarget = {
  type: "section";
  direction: WorkNavigationDirection;
};

export type WorkNavigationTarget =
  | CaseNavigationTarget
  | SectionNavigationTarget;

export function getWorkEntryIndex(
  direction: WorkNavigationDirection,
  itemCount: number,
) {
  if (itemCount <= 0) return 0;
  return direction > 0 ? 0 : itemCount - 1;
}

export function getWorkNavigationTarget(
  currentIndex: number,
  direction: WorkNavigationDirection,
  itemCount: number,
): WorkNavigationTarget {
  if (itemCount <= 0) {
    return { type: "section", direction };
  }

  const boundedIndex = Math.min(Math.max(currentIndex, 0), itemCount - 1);
  const nextIndex = boundedIndex + direction;

  if (nextIndex < 0 || nextIndex >= itemCount) {
    return { type: "section", direction };
  }

  return { type: "case", index: nextIndex };
}

export function getCaseTransitionXOffset(
  direction: WorkNavigationDirection,
  phase: CaseTransitionPhase,
  distance = 32,
) {
  const magnitude = Math.abs(distance);
  const entryOffset = direction > 0 ? magnitude : -magnitude;

  return phase === "enter" ? entryOffset : -entryOffset;
}
