import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../MarkdownBlock";

describe("renderMarkdown", () => {
  it("keeps soft line breaks as article flow instead of forced breaks", async () => {
    const html = await renderMarkdown("First sentence.\nSecond sentence.");

    expect(html).not.toContain("<br");
    expect(html).toContain("First sentence.\nSecond sentence.");
  });

  it("highlights fenced code blocks with the declared language", async () => {
    const html = await renderMarkdown("```ts\nconst answer = 42;\n```");

    expect(html).toContain('class="hljs language-ts"');
    expect(html).toContain("hljs-keyword");
    expect(html).toContain("answer");
  });

  it("wraps GitHub-flavored tables for stable blog rendering", async () => {
    const html = await renderMarkdown("| Invariant | Evidence |\n| --- | --- |\n| At most once | ledger row |");

    expect(html).toContain('<div class="t-markdownTable"><table>');
    expect(html).toContain("<th>Invariant</th>");
    expect(html).toContain("<td>ledger row</td>");
  });
});
