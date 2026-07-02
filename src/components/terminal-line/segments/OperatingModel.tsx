import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type { OperatingModelSegment } from "@types";

export function OperatingModel({ segment }: { segment: OperatingModelSegment }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openDescriptionIndex, setOpenDescriptionIndex] = useState<
    number | null
  >(null);
  const headingId = "intro-operating-title";

  useEffect(() => {
    if (openDescriptionIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDescriptionIndex(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDescriptionIndex]);

  const activateStep = (index: number) => {
    setActiveIndex(index);
    setOpenDescriptionIndex((current) => (current === index ? current : null));
  };

  return (
    <section className="intro-operating" aria-labelledby={headingId}>
      <div className="intro-sectionKicker font-mono">{segment.kicker}</div>
      <h2 id={headingId} className="intro-sectionTitle">
        {segment.title}
      </h2>
      <div className="intro-operatingDeck" role="list">
        {segment.steps.map((step, index) => {
          const isActive = activeIndex === index;
          const isDescriptionOpen = openDescriptionIndex === index;
          const tooltipId = `intro-operating-${step.index}-description`;

          return (
            <div
              key={step.index}
              className={`intro-operatingFold${isActive ? " is-active" : ""}`}
              role="listitem"
              onMouseEnter={() => activateStep(index)}
            >
              <button
                type="button"
                className="intro-operatingFoldButton"
                aria-pressed={isActive}
                onClick={() => activateStep(index)}
                onFocus={() => activateStep(index)}
              >
                <span className="intro-stepIndex font-mono">{step.index}</span>
                <span className="intro-operatingTitle">{step.title}</span>
              </button>
              <span className="intro-operatingCopy" aria-hidden={!isActive}>
                <span className="intro-operatingSummary">
                  {step.summary}
                </span>
                {isActive ? (
                  <span className="intro-descriptionAnchor">
                    <button
                      type="button"
                      className="intro-descriptionButton"
                      aria-label={`${isDescriptionOpen ? "Hide" : "Show"} ${step.title} description`}
                      aria-expanded={isDescriptionOpen}
                      aria-controls={tooltipId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenDescriptionIndex((current) =>
                          current === index ? null : index,
                        );
                      }}
                    >
                      <Info size={14} aria-hidden="true" />
                    </button>
                    {isDescriptionOpen ? (
                      <span
                        id={tooltipId}
                        className="intro-descriptionTooltip"
                        role="tooltip"
                      >
                        {step.description}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
