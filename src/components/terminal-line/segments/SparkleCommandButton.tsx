import { SparklesCore } from "@components/ui/sparkles";
import { useTerminalTone } from "@hooks/useTerminalTone";

export function SparkleCommandButton({
  label,
  ariaLabel,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  const tone = useTerminalTone();
  const particleColor = tone === "light" ? "#050506" : "#f6fbff";

  return (
    <button
      type="button"
      className="t-commandLink t-pressable is-sparkle"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="t-sparkleSurface" aria-hidden="true">
        <SparklesCore
          background="transparent"
          className="t-sparkleCanvas"
          minSize={0.4}
          maxSize={1.2}
          particleColor={particleColor}
          particleDensity={120}
          speed={0.4}
        />
      </span>
      <span className="t-sparkleLabel">{label}</span>
    </button>
  );
}
