import { describe, expect, it } from "vitest";
import { highlightQuery, renderSearchSnippet } from "../SearchHits";
import type { SearchHit } from "@types";

describe("SearchHits helpers", () => {
  it("escapes HTML before marking query matches", () => {
    const html = highlightQuery("<script>alert('x')</script>", "script");

    expect(html).toContain("&lt;<mark>script</mark>&gt;");
    expect(html).not.toContain("<script>");
  });

  it("treats regex characters in queries as literal text", () => {
    const html = highlightQuery("Use a+b safely, not ab.", "a+b");

    expect(html).toContain("<mark>a+b</mark>");
    expect(html).not.toContain("<mark>ab</mark>");
  });

  it("renders before, focused, and after lines in order", () => {
    const hit: SearchHit = {
      id: "hit-1",
      source: "blog",
      title: "Retry Safety",
      location: "blog",
      lineNumber: 12,
      before: ["before retry"],
      line: "retry invariant",
      after: ["after retry"],
      readCommand: "blog read retry-safety",
    };

    expect(renderSearchSnippet(hit, "retry")).toBe(
      [
        "before <mark>retry</mark>",
        '<span class="t-searchLineFocus"><mark>retry</mark> invariant</span>',
        "after <mark>retry</mark>",
      ].join("\n"),
    );
  });
});
