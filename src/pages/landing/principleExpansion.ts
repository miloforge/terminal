export type PrincipleExpansionState = {
  selectedIndex: number | null;
};

export function getExpandedPrincipleIndex({
  selectedIndex,
}: PrincipleExpansionState) {
  return selectedIndex;
}

export function selectPrinciple(requestedIndex: number) {
  return requestedIndex;
}
