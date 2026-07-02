import { useMemo, useState } from "react";
import type { SearchHitsSegment as SearchHitsSegmentType } from "@types";
import type { ExecuteCommand } from "../types";
import { DownloadIntegrity } from "@components/terminal/DownloadIntegrity";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightQuery(text: string, query: string): string {
  const escaped = escapeHtml(text);
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map(escapeRegex);

  if (!tokens.length) return escaped;
  const regex = new RegExp(`(${tokens.join("|")})`, "gi");
  return escaped.replace(regex, "<mark>$1</mark>");
}

export function renderSearchSnippet(
  hit: SearchHitsSegmentType["hits"][number],
  query: string,
): string {
  const renderLine = (text: string, emphasize?: boolean) => {
    const body = highlightQuery(text, query);
    return `${emphasize ? '<span class="t-searchLineFocus">' : ""}${body}${emphasize ? "</span>" : ""}`;
  };

  const lines: string[] = [];

  hit.before.forEach((text) => {
    lines.push(renderLine(text));
  });

  lines.push(renderLine(hit.line, true));

  hit.after.forEach((text, idx) => {
    lines.push(renderLine(text));
  });

  return lines.join("\n");
}

export function SearchHits({
  segment,
  executeCommand,
}: {
  segment: SearchHitsSegmentType;
  executeCommand: ExecuteCommand;
}) {
  const { hits, query } = segment;
  const [open, setOpen] = useState(true);
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>(
    {},
  );
  const [itemCollapsed, setItemCollapsed] = useState<Record<string, boolean>>(
    {},
  );

  const grouped = useMemo(() => {
    type Entry = {
      key: string;
      title: string;
      readCommand: string;
      downloadCommand?: string;
      snippets: typeof hits;
    };
    const by: Record<string, { label: string; items: Entry[] }> = {};
    const labelFor: Record<
      SearchHitsSegmentType["hits"][number]["source"],
      string
    > = {
      blog: "Blogs",
      resume: "Resume",
      work: "Work",
    };
    hits.forEach((hit) => {
      const sourceKey = hit.source;
      const entryKey = `${hit.source}::${hit.title}::${hit.readCommand}::${hit.downloadCommand || ""}`;

      if (!by[sourceKey]) {
        by[sourceKey] = {
          label: labelFor[hit.source] || hit.source,
          items: [],
        };
      }

      const existing = by[sourceKey].items.find(
        (item) => item.key === entryKey,
      );
      if (existing) {
        existing.snippets.push(hit);
      } else {
        by[sourceKey].items.push({
          key: entryKey,
          title: hit.title,
          readCommand: hit.readCommand,
          downloadCommand: hit.downloadCommand,
          snippets: [hit],
        });
      }
    });
    return by;
  }, [hits]);

  if (!open) return null;

  const toggleGroup = (key: string) =>
    setGroupCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleItem = (id: string) =>
    setItemCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="t-searchModal" role="dialog" aria-modal="true">
      <div className="t-searchOverlay" />
      <div className="t-searchWindow">
        <div className="t-searchHeader">
          <div className="t-searchHeaderLeft">
            <span className="t-searchEyebrow">Search</span>
            <span className="t-searchHeading">
              “{query}” — {hits.length} result{hits.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="t-searchHeaderActions">
            <button
              type="button"
              className="t-searchClose t-pressable"
              aria-label="Close search results"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
        </div>

        <div className="t-searchGroups">
          {Object.entries(grouped).map(([key, group]) => {
            const collapsed = groupCollapsed[key] ?? false;
            return (
              <div className="t-searchGroup" key={key} data-source={key}>
                <button
                  type="button"
                  className="t-searchGroupHead"
                  onClick={() => toggleGroup(key)}
                >
                  <span className="t-searchCaret">{collapsed ? "▸" : "▾"}</span>
                  <span className={`t-searchTag is-${key}`}>{group.label}</span>
                  <span className="t-searchCount">{group.items.length}</span>
                </button>

                {!collapsed ? (
                  <div className="t-searchGroupBody">
                    {group.items.map((entry) => {
                      const folded = itemCollapsed[entry.key] ?? false;
                      return (
                        <div
                          className="t-searchHit"
                          key={entry.key}
                          data-source={key}
                        >
                          <button
                            type="button"
                            className="t-searchHead"
                            onClick={() => toggleItem(entry.key)}
                          >
                            <span className="t-searchCaret">
                              {folded ? "▸" : "▾"}
                            </span>
                            <span className="t-searchTitle">{entry.title}</span>
                          </button>

                          {!folded ? (
                            <>
                              {entry.snippets.map((hit) => (
                                <pre
                                  key={hit.id}
                                  className="t-searchSnippet"
                                  dangerouslySetInnerHTML={{
                                    __html: renderSearchSnippet(hit, query),
                                  }}
                                />
                              ))}
                              <div className="t-searchActions">
                                <button
                                  type="button"
                                  className="t-commandLink t-pressable"
                                  onClick={() =>
                                    executeCommand(entry.readCommand)
                                  }
                                  aria-label={`Read more from ${entry.title}`}
                                >
                                  Read more
                                </button>
                                {entry.downloadCommand ? (
                                  <button
                                    type="button"
                                    className="t-commandLink t-pressable"
                                    onClick={() =>
                                      executeCommand(entry.downloadCommand!)
                                    }
                                    aria-label={`Download ${entry.title}`}
                                  >
                                    Download
                                  </button>
                                ) : null}
                              </div>
                              {entry.downloadCommand ? (
                                <DownloadIntegrity
                                  command={entry.downloadCommand}
                                />
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
