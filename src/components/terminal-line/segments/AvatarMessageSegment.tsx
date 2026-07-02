import { useEffect, useMemo, useState } from "react";
import type { AvatarSegment } from "@types";
import type { ExecuteCommand } from "../types";

export function AvatarMessageSegment({
  segment,
  executeCommand,
}: {
  segment: AvatarSegment;
  executeCommand: ExecuteCommand;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const allowModal = useMemo(
    () => !segment.disableModal && !segment.onClickCommand,
    [segment.disableModal, segment.onClickCommand],
  );

  useEffect(() => {
    if (!allowModal || !isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allowModal, isOpen]);

  const handleAvatarClick = () => {
    if (segment.onClickCommand) {
      executeCommand(segment.onClickCommand);
      return;
    }
    if (!allowModal) return;
    setIsOpen(true);
  };

  const avatarAriaLabel = segment.onClickCommand
    ? `Run ${segment.onClickCommand}`
    : "Open profile photo";

  return (
    <>
      <span className="t-avatarMessage">
        <span className="t-avatarMedia">
          <button
            type="button"
            className="t-avatarPhoto"
            aria-label={avatarAriaLabel}
            onClick={handleAvatarClick}
          >
            <img
              src={segment.image}
              alt={segment.label ? `${segment.label} avatar` : "avatar"}
            />
          </button>
          {segment.label ? (
            <span className="t-avatarCaption">{segment.label}</span>
          ) : null}
        </span>
        <span className="t-avatarContent">
          {segment.meta ? (
            <span className="t-avatarHead">
              <span className="t-avatarMeta">{segment.meta}</span>
            </span>
          ) : null}
          {segment.lines.map((line, lineIdx) => {
            const isEmphasis = segment.emphasizeLines?.includes(lineIdx);
            return (
              <span
                key={`avatar-line-${lineIdx}`}
                className={`t-avatarLine${isEmphasis ? " is-emphasis" : ""}`}
              >
                {line}
              </span>
            );
          })}
        </span>
        {segment.bodyLines?.length ? (
          <span className="t-avatarBody">
            {segment.bodyLines.map((line, lineIdx) => (
              <span
                key={`avatar-body-line-${lineIdx}`}
                className="t-avatarLine"
              >
                {line}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      {allowModal && isOpen ? (
        <div className="t-avatarModal" role="dialog" aria-modal="true">
          <div
            className="t-avatarModal__backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="t-avatarModal__content">
            <button
              type="button"
              className="t-avatarModal__close"
              aria-label="Close photo"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            <img
              src={segment.image}
              alt={
                segment.label
                  ? `${segment.label} avatar full view`
                  : "avatar full view"
              }
            />
            {segment.label ? (
              <span className="t-avatarModal__caption">{segment.label}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
