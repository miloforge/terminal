import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Clock } from "lucide-react";
import type { FaqSegment, LogSegment } from "@types";
import { MarkdownBlock } from "@components/MarkdownBlock";
import { buildShareLink } from "@utils";

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

export function formatMonthYear(date: string) {
  const trimmed = date.trim();
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(trimmed);
  if (!match) return trimmed;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return trimmed;

  return MONTH_YEAR_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}
export function FaqAccordion({ items }: { items: FaqSegment["items"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="t-faq">
      {items.map((item, idx) => {
        const open = openIndex === idx;
        return (
          <div key={idx} className={`t-faqItem${open ? " is-open" : ""}`}>
            <button
              type="button"
              className="t-faqSummary"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : idx)}
            >
              <span className="t-faqChevron" aria-hidden="true">
                ▸
              </span>
              {item.question}
            </button>
            <div
              className="t-faqAnswer"
              style={{ maxHeight: open ? "320px" : "0px" }}
            >
              <div className="t-faqAnswerInner">{item.answer}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LogAccordion({ items }: { items: LogSegment["items"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const panelInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [panelHeights, setPanelHeights] = useState<Record<number, number>>({});
  const openItem = openIndex === null ? null : items[openIndex];
  const showCollapseButton = openItem?.markdownVariant === "blog";

  const syncPanelHeight = (idx: number) => {
    const panelInner = panelInnerRefs.current[idx];
    if (!panelInner) return;

    const nextHeight = Math.ceil(
      panelInner.getBoundingClientRect().height || panelInner.scrollHeight,
    );
    setPanelHeights((current) =>
      current[idx] === nextHeight ? current : { ...current, [idx]: nextHeight },
    );
  };

  useLayoutEffect(() => {
    if (openIndex === null) return;

    syncPanelHeight(openIndex);
    const panelInner = panelInnerRefs.current[openIndex];
    if (!panelInner) return;

    const handleResize = () => syncPanelHeight(openIndex);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;

    observer?.observe(panelInner);
    window.addEventListener("resize", handleResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [openIndex, items]);

  return (
    <div className="t-logAccordion">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const displayDate = formatMonthYear(item.date);
        const summaryMeta = item.readingTimeLabel || displayDate;
        const compactReadingTime =
          item.readingMinutes === undefined ? null : `${item.readingMinutes}'`;
        const contentKind =
          item.markdownVariant === "blog" ? "blog post" : "entry";
        const panelId = `log-panel-${item.slug || idx}`;
        const summaryHelpId = `log-summary-help-${item.slug || idx}`;
        const shareCommand = item.slug && `blog read ${item.slug}`;
        const shareText =
          shareCommand && typeof window !== "undefined"
            ? buildShareLink(shareCommand, window.location.href)
            : `${displayDate} — ${item.note}`;
        return (
          <div
            key={idx}
            className={`t-logItem${isOpen ? " is-open" : ""}${item.markdownVariant === "blog" ? " is-blog" : ""}`}
          >
            <button
              type="button"
              className="t-logSummary"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-describedby={summaryHelpId}
              aria-label={`${isOpen ? "Collapse" : "Open"} ${contentKind}: ${item.note}${summaryMeta ? `. ${summaryMeta}.` : ""} This row is clickable.`}
              data-clickable-row="true"
              onClick={() => {
                if (isOpen) {
                  setOpenIndex(null);
                  return;
                }

                syncPanelHeight(idx);
                setOpenIndex(idx);
              }}
            >
              <span className="t-logChevron" aria-hidden="true">
                ▸
              </span>
              <span className="t-logTitle">{item.note}</span>
              {summaryMeta ? (
                <span className="t-logReadTime" aria-hidden="true">
                  {compactReadingTime || summaryMeta}
                  {compactReadingTime ? (
                    <Clock
                      className="t-logReadTimeIcon"
                      size={15}
                      strokeWidth={2.15}
                    />
                  ) : null}
                </span>
              ) : null}
              <span id={summaryHelpId} className="t-srOnly">
                Clickable row: press Enter or Space to{" "}
                {isOpen ? "collapse" : "open"} this {contentKind}.
              </span>
            </button>

            <div
              id={panelId}
              className="t-logPanel"
              style={{
                maxHeight: isOpen ? `${panelHeights[idx] ?? 0}px` : "0px",
              }}
            >
              <div
                ref={(node) => {
                  panelInnerRefs.current[idx] = node;
                }}
                className="t-logPanelInner"
              >
                {item.body ? (
                  <MarkdownBlock
                    segment={{
                      type: "markdown",
                      markdown: item.body,
                      variant: item.markdownVariant,
                      date: item.date,
                    }}
                  />
                ) : (
                  <div className="t-logEmpty">No content</div>
                )}
                {shareCommand ? (
                  <button
                    type="button"
                    className="t-logShare"
                    onClick={(e) => {
                      e.stopPropagation();
                      void navigator.clipboard.writeText(shareText);
                    }}
                    aria-label={`Copy share command for ${item.note}`}
                    title="Copy to share"
                  >
                    Copy to share
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      {showCollapseButton ? (
        <button
          type="button"
          className="t-logCollapseFloating"
          aria-label="Collapse open blog post"
          title="Collapse open blog post"
          onClick={() => setOpenIndex(null)}
        >
          <ArrowUp size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
