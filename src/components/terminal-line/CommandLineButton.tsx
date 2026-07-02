type CommandLineButtonProps = {
  commandLabel: string;
  isCollapsed?: boolean;
  isHistoricalCommand?: boolean;
  onToggleCollapse?: () => void;
  promptGlyph: string;
};

export function CommandLineButton({
  commandLabel,
  isCollapsed,
  isHistoricalCommand,
  onToggleCollapse,
  promptGlyph,
}: CommandLineButtonProps) {
  const stateClass = isCollapsed ? " is-collapsed" : " is-open";
  const historyClass = isHistoricalCommand ? " is-historical" : "";

  return (
    <button
      type="button"
      className={`t-lineCommand${stateClass}${historyClass}`}
      aria-expanded={!isCollapsed}
      aria-label={`${isCollapsed ? "Expand" : "Collapse"} output for ${commandLabel || "command"}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggleCollapse?.();
      }}
    >
      <span className="t-lineCaret" aria-hidden="true">
        {promptGlyph}
      </span>
      <span className="t-lineCommandText">{commandLabel}</span>
    </button>
  );
}
