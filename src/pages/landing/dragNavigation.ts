export type DragNavigationDirection = 1 | -1;

const dragNavigationThreshold = 56;
const verticalDominanceRatio = 1.15;

export function getDragNavigationDirection(
  deltaX: number,
  deltaY: number,
): DragNavigationDirection | null {
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);

  if (verticalDistance < dragNavigationThreshold) return null;
  if (verticalDistance <= horizontalDistance * verticalDominanceRatio) {
    return null;
  }

  return deltaY < 0 ? 1 : -1;
}
