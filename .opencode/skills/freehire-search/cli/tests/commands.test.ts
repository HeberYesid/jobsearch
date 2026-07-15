import { afterEach, describe, expect, test } from "bun:test";
import { runSearch } from "../src/commands/search";

const originalFetch = globalThis.fetch;
const originalStdoutWrite = process.stdout.write;

function mockJob(slug: string, title: string): unknown {
  return {
    public_slug: slug,
    source: "test",
    external_id: "1",
    url: `https://freehire.dev/jobs/${slug}`,
    title,
    company: "TestCo",
    company_slug: "testco",
    location: "Remote",
    description: "",
    skills: [],
    work_mode: "remote",
    regions: ["latam"],
    countries: ["CO"],
    cities: [],
    posted_at: "2026-07-01T00:00:00Z",
    created_at: null,
    enrichment: {},
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.stdout.write = originalStdoutWrite;
});

describe("runSearch", () => {
  test("returns results in JSON format", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [mockJob("slug-1", "Backend Engineer")],
          meta: { total: 1 },
        }),
        { headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    let stdout = "";
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    }) as typeof process.stdout.write;

    const code = await runSearch({
      query: "backend",
      jobage: 9999,
      page: 1,
      limit: 25,
      format: "json",
      regions: [],
      countries: [],
      cities: [],
      seniority: [],
      category: [],
      skills: [],
      facets: {},
    });

    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0].id).toBe("slug-1");
    expect(parsed.meta.total).toBe(1);
  });

  test("handles empty results", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ data: [], meta: { total: 0 } }),
        { headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    let stdout = "";
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    }) as typeof process.stdout.write;

    const code = await runSearch({
      jobage: 9999,
      page: 1,
      limit: 25,
      format: "json",
      regions: [],
      countries: [],
      cities: [],
      seniority: [],
      category: [],
      skills: [],
      facets: {},
    });

    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.results).toHaveLength(0);
  });
});
