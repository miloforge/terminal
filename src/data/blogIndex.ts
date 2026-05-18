export type BlogPost = {
  slug: string;
  title: string;
  date?: string;
  tags: string[];
  summary?: string;
  body: string;
  plainLines: string[];
};

type SearchHit = {
  slug: string;
  title: string;
  summary?: string;
  score: number;
};

type ParsedFrontMatter = {
  title?: string;
  slug?: string;
  date?: string;
  tags?: string[];
  summary?: string;
};

type BlogSource = {
  slug: string;
  aliases?: string[];
  raw: string;
};

const blogModules = import.meta.glob("./blogs/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const legacySlugAliases: Record<string, string[]> = {
  "70-genai": ["2025-01-15-ship"],
  "tab-autocomplete": ["2025-01-21-tab"],
  "chatbot-training-alignment": ["2025-03-08-chatbot"],
  "cybersecurity-harsh-truth": ["2025-03-20-beautiful-lies"],
  "design-tradeoffs": ["2025-04-20-design-tradeoffs"],
  "premature-scaling": ["2025-05-04-overengineering-caching"],
  "algorithm-beats-language": ["2025-08-09-algorithm-beats-language"],
  "evm-ctf-eip7702": ["2025-09-11-ctf-eip7702"],
  "rust-iterators": ["2025-11-05-rust-iterators"],
  "free-will": ["2026-01-11-freedome"],
  "agentic-workflow": ["2026-01-17-agentic-workflow"],
  "automation-risk": ["0_downsides_of_automation"],
};

const sources: BlogSource[] = Object.entries(blogModules).map(([path, raw]) => {
  const fallbackSlug = path
    .split("/")
    .pop()!
    .replace(/\.md$/, "");

  return {
    slug: fallbackSlug,
    aliases: legacySlugAliases[fallbackSlug],
    raw,
  };
});

function parseFrontMatter(raw: string): { meta: ParsedFrontMatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw.trim() };

  const front = match[1];
  const body = match[2] || "";

  const meta: ParsedFrontMatter = {};
  front
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key || !rest.length) return;
      const valueRaw = rest.join(":").trim();
      if (!valueRaw) return;

      if (valueRaw.startsWith("[") && valueRaw.endsWith("]")) {
        try {
          const parsed = JSON.parse(valueRaw);
          if (key.trim() === "tags" && Array.isArray(parsed)) {
            meta.tags = parsed.map(String);
            return;
          }
        } catch (_) {
          /* fallthrough */
        }
      }

      const cleaned = valueRaw.replace(/^\"|\"$/g, "").trim();
      (meta as Record<string, string>)[key.trim()] = cleaned;
    });

  return { meta, body: body.trim() };
}

function markdownToPlainLines(markdown: string): string[] {
  const withoutCodeFences = markdown.replace(/```[\s\S]*?```/g, (block) => {
    return block.replace(/```/g, "");
  });

  const replacedLinks = withoutCodeFences.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  const stripped = replacedLinks
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r/g, "");

  return stripped.split(/\n/).map((line) => line.trimEnd());
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const blogMap = new Map<string, BlogPost>();
const aliasMap = new Map<string, string>();
const tagCounts = new Map<string, number>();
const invertedIndex = new Map<string, Set<string>>();

function indexOnce() {
  if (blogMap.size) return;

  sources.forEach(({ slug: fallbackSlug, aliases = [], raw }) => {
    const { meta, body } = parseFrontMatter(raw);
    const slug = meta.slug || fallbackSlug;
    const title = meta.title || slug;
    const tags = meta.tags?.map((t) => t.toLowerCase()) || [];
    const plainLines = markdownToPlainLines(body);

    const post: BlogPost = {
      slug,
      title,
      date: meta.date,
      tags,
      summary: meta.summary,
      body,
      plainLines,
    };

    blogMap.set(slug, post);
    aliases
      .concat(legacySlugAliases[slug] || [])
      .forEach((alias) => aliasMap.set(alias.toLowerCase(), slug));

    tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    const tokens = tokenize([title, ...plainLines].join(" "));
    const unique = new Set(tokens);
    unique.forEach((token) => {
      const existing = invertedIndex.get(token) || new Set<string>();
      existing.add(slug);
      invertedIndex.set(token, existing);
    });
  });
}

function getAll(): BlogPost[] {
  indexOnce();
  return Array.from(blogMap.values()).sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return a.title.localeCompare(b.title);
  });
}

function findBySlugOrTitle(input: string): BlogPost | undefined {
  indexOnce();
  const lowered = input.toLowerCase();
  if (blogMap.has(lowered)) return blogMap.get(lowered);

  const canonicalSlug = aliasMap.get(lowered);
  if (canonicalSlug) return blogMap.get(canonicalSlug);

  const bySlug = Array.from(blogMap.values()).find((p) => p.slug.toLowerCase() === lowered);
  if (bySlug) return bySlug;

  return Array.from(blogMap.values()).find((p) => p.title.toLowerCase().includes(lowered));
}

function filterByTag(tag?: string): BlogPost[] {
  if (!tag) return getAll();
  const t = tag.toLowerCase();
  return getAll().filter((post) => post.tags.includes(t));
}

function search(query: string): SearchHit[] {
  indexOnce();
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const scores = new Map<string, number>();

  tokens.forEach((token) => {
    const slugs = invertedIndex.get(token);
    if (!slugs) return;
    slugs.forEach((slug) => {
      scores.set(slug, (scores.get(slug) || 0) + 1);
    });
  });

  return Array.from(scores.entries())
    .map(([slug, score]) => {
      const post = blogMap.get(slug)!;
      return { slug, title: post.title, summary: post.summary, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const postA = blogMap.get(a.slug);
      const postB = blogMap.get(b.slug);
      if (postA?.date && postB?.date) return postB.date.localeCompare(postA.date);
      return a.title.localeCompare(b.title);
    });
}

function listTags(): Array<{ tag: string; count: number }> {
  indexOnce();
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function linesForSearch(): Array<{ slug: string; title: string; lines: string[] }> {
  indexOnce();
  return Array.from(blogMap.values()).map((post) => ({
    slug: post.slug,
    title: post.title,
    lines: post.plainLines,
  }));
}

export const blogIndex = {
  getAll,
  findBySlugOrTitle,
  filterByTag,
  search,
  listTags,
  linesForSearch,
};

export type BlogIndex = typeof blogIndex;
