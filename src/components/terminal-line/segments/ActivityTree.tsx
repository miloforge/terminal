import { useState } from "react";
import type { ActivityTreeNode, ActivityTreeSegment } from "@types";
import type { ExecuteCommand } from "../types";

export function ActivityTree({
  segment,
  executeCommand,
}: {
  segment: ActivityTreeSegment;
  executeCommand: ExecuteCommand;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    const walk = (nodes: ActivityTreeNode[]) => {
      nodes.forEach((node) => {
        state[node.id] = false;
        if (node.children?.length) walk(node.children);
      });
    };
    walk(segment.nodes);
    return state;
  });
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const toggleNode = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNodes = (nodes: ActivityTreeNode[]) => (
    <ul className="t-activityTreeList">
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const isOpen = hasChildren ? open[node.id] !== false : false;
        const isActive = activeNodeId === node.id;

        const handleSelect = () => {
          setActiveNodeId((prev) => (prev === node.id ? null : node.id));
        };

        return (
          <li key={node.id} className="t-activityTreeNode">
            <div className="t-activityTreeHead">
              {hasChildren ? (
                <button
                  type="button"
                  className="t-activityTreeToggle"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.title}`}
                  aria-expanded={isOpen}
                  onClick={() => toggleNode(node.id)}
                >
                  {isOpen ? "▾" : "▸"}
                </button>
              ) : (
                <span className="t-activityTreeSpacer" aria-hidden="true" />
              )}

              <div className="t-activityTreeContent">
                <div className="t-activityTreeTitleRow">
                  {node.command ? (
                    <button
                      type="button"
                      className="t-activityTreeAction"
                      aria-label={`Run ${node.title}: ${node.command}`}
                      onClick={() => {
                        handleSelect();
                        if (node.command) executeCommand(node.command);
                      }}
                    >
                      <span className="t-activityTreeTitle">{node.title}</span>
                      {node.period ? (
                        <span className="t-activityTreePeriod">
                          {node.period}
                        </span>
                      ) : null}
                      <span className="t-activityTreeRun" aria-hidden="true">
                        RUN
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="t-activityTreeTitleButton"
                      aria-label={`Show details for ${node.title}`}
                      aria-pressed={isActive}
                      onClick={handleSelect}
                    >
                      <span className="t-activityTreeTitle">{node.title}</span>
                      {node.period ? (
                        <span className="t-activityTreePeriod">
                          {node.period}
                        </span>
                      ) : null}
                    </button>
                  )}
                </div>

                {node.summary && isActive ? (
                  <div className="t-activityTreeSummary">{node.summary}</div>
                ) : null}

                {node.tags?.length && isActive ? (
                  <div className="t-activityTreeTags">
                    {node.tags.map((tag) => (
                      <span
                        key={`${node.id}-${tag}`}
                        className="t-activityTreeTag"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {hasChildren && isOpen ? renderNodes(node.children!) : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="t-activityTree">
      {segment.title ? (
        <div className="t-activityTreeHeading">{segment.title}</div>
      ) : null}
      {renderNodes(segment.nodes)}
    </div>
  );
}
