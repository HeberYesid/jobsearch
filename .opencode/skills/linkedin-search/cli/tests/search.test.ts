import { afterEach, describe, expect, test } from "bun:test";
import { runSearch } from "../src/commands/search";
import { parseJobCards, jobageToTPR, workTypeFlag } from "../src/helpers";

const originalFetch = globalThis.fetch;
const originalStdoutWrite = process.stdout.write;

function searchCard(id: string, title: string): string {
  return `<li>
    <div data-entity-urn="urn:li:jobPosting:${id}">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/${id}"></a>
      <h3 class="base-search-card__title">${title}</h3>
    </div>
  </li>`;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.stdout.write = originalStdoutWrite;
});

describe("runSearch", () => {
  test("--limit 0 emits zero results", async () => {
    globalThis.fetch = (async () => new Response(searchCard("123456", "Engineer"))) as typeof fetch;

    let stdout = "";
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    }) as typeof process.stdout.write;

    const code = await runSearch({
      location: "Bogotá, Colombia",
      jobage: 9999,
      page: 1,
      limit: 0,
      format: "json",
    });

    expect(code).toBe(0);
    expect(JSON.parse(stdout).results).toHaveLength(0);
  });

  test("parses job cards from HTML", () => {
    const html = searchCard("4426311357", "Senior Backend Engineer");
    const cards = parseJobCards(html);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("4426311357");
    expect(cards[0].title).toBe("Senior Backend Engineer");
    expect(cards[0].url).toBe("https://www.linkedin.com/jobs/view/4426311357");
  });

  test("malformed cards are skipped", () => {
    const html = `<div data-entity-urn="urn:li:jobPosting:999">no title here</div>`;
    const cards = parseJobCards(html);
    expect(cards).toHaveLength(0);
  });
});

describe("jobageToTPR", () => {
  test("converts days to seconds string", () => {
    expect(jobageToTPR(7)).toBe("r604800");
    expect(jobageToTPR(30)).toBe("r2592000");
  });

  test("returns null for 0 or 9999+", () => {
    expect(jobageToTPR(0)).toBeNull();
    expect(jobageToTPR(9999)).toBeNull();
  });
});

describe("workTypeFlag", () => {
  test("maps remote/hybrid/onsite", () => {
    expect(workTypeFlag("remote")).toBe("2");
    expect(workTypeFlag("hybrid")).toBe("3");
    expect(workTypeFlag("onsite")).toBe("1");
    expect(workTypeFlag("on-site")).toBe("1");
  });

  test("returns null for undefined/unknown", () => {
    expect(workTypeFlag(undefined)).toBeNull();
    expect(workTypeFlag("unknown")).toBeNull();
  });
});
