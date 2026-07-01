import { describe, expect, it } from "vitest";
import {
  getClientRoutePathForClick,
  getClientRoutePath,
  parseAppRoute,
  withBasePath,
} from "../appRouting";

const base = "/terminal/";
const current = {
  origin: "https://milaforge.dev",
  pathname: "/terminal/blog/",
  search: "",
  hash: "",
};

describe("app routing", () => {
  it("parses blog routes under the configured base path", () => {
    expect(parseAppRoute("/terminal/blog/automation-risk/", base)).toEqual({
      name: "blog",
      slug: "automation-risk",
    });
  });

  it("builds canonical app paths with the configured base path", () => {
    expect(withBasePath("/blog/automation-risk/", base)).toBe(
      "/terminal/blog/automation-risk/",
    );
  });

  it("allows same-origin app routes to be handled by React", () => {
    expect(
      getClientRoutePath(
        "https://milaforge.dev/terminal/blog/automation-risk/",
        current,
        base,
      ),
    ).toBe("/terminal/blog/automation-risk/");
  });

  it("normalizes the blog index to the prerendered slash route", () => {
    expect(
      getClientRoutePath("https://milaforge.dev/terminal/blog", current, base),
    ).toBe("/terminal/blog/");
  });

  it("keeps blog topic filters in client-handled routes", () => {
    expect(
      getClientRoutePath(
        "https://milaforge.dev/terminal/blog/?tag=security",
        current,
        base,
      ),
    ).toBe("/terminal/blog/?tag=security");
  });

  it("keeps external and out-of-app links as document navigations", () => {
    expect(
      getClientRoutePath(
        "https://example.com/terminal/blog/automation-risk/",
        current,
        base,
      ),
    ).toBeNull();
    expect(
      getClientRoutePath("https://milaforge.dev/other/blog/", current, base),
    ).toBeNull();
  });

  it("allows unmodified left-clicks on same-origin app links to stay in React", () => {
    expect(
      getClientRoutePathForClick(
        { button: 0 },
        "https://milaforge.dev/terminal/blog/",
        "",
        false,
        current,
        base,
      ),
    ).toBe("/terminal/blog/");
  });

  it("preserves browser navigation for modified, download, and new-tab clicks", () => {
    expect(
      getClientRoutePathForClick(
        { button: 0, metaKey: true },
        "https://milaforge.dev/terminal/blog/",
        "",
        false,
        current,
        base,
      ),
    ).toBeNull();
    expect(
      getClientRoutePathForClick(
        { button: 0 },
        "https://milaforge.dev/terminal/blog/",
        "_blank",
        false,
        current,
        base,
      ),
    ).toBeNull();
    expect(
      getClientRoutePathForClick(
        { button: 0 },
        "https://milaforge.dev/terminal/blog/",
        "",
        true,
        current,
        base,
      ),
    ).toBeNull();
  });

  it("preserves native same-page hash navigation", () => {
    expect(
      getClientRoutePathForClick(
        { button: 0 },
        "https://milaforge.dev/terminal/blog/automation-risk/#failure-mode",
        "",
        false,
        {
          origin: "https://milaforge.dev",
          pathname: "/terminal/blog/automation-risk/",
          search: "",
          hash: "",
        },
        base,
      ),
    ).toBeNull();
  });
});
