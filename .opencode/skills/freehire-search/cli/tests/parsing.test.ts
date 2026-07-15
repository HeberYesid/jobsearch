import { describe, expect, test } from "bun:test";
import { normalizeSlug, cleanHtml, toResult, toDetail, baseUrl } from "../src/helpers";
import type { FreehireJob } from "../src/helpers";

describe("normalizeSlug", () => {
  test("extracts slug from URL", () => {
    expect(normalizeSlug("https://freehire.dev/jobs/golang-zensar-2bxu6dxm")).toBe("golang-zensar-2bxu6dxm");
  });

  test("accepts bare slug", () => {
    expect(normalizeSlug("golang-zensar-2bxu6dxm")).toBe("golang-zensar-2bxu6dxm");
  });

  test("rejects empty and invalid", () => {
    expect(normalizeSlug("")).toBeNull();
    expect(normalizeSlug("   ")).toBeNull();
    expect(normalizeSlug("not a slug!")).toBeNull();
  });
});

describe("cleanHtml", () => {
  test("strips tags and decodes entities", () => {
    expect(cleanHtml("<p>Hello &amp; welcome</p>")).toBe("Hello & welcome");
  });

  test("converts br and p tags to newlines", () => {
    expect(cleanHtml("<p>Line 1</p><p>Line 2</p>")).toBe("Line 1\nLine 2");
  });

  test("returns null for empty input", () => {
    expect(cleanHtml(null)).toBeNull();
    expect(cleanHtml("")).toBeNull();
  });
});

describe("toResult", () => {
  test("maps freehire job to result shape", () => {
    const job: FreehireJob = {
      public_slug: "golang-zensar-2bxu6dxm",
      source: "greenhouse",
      external_id: "123",
      url: "https://freehire.dev/jobs/golang-zensar-2bxu6dxm",
      title: "Go Engineer",
      company: "Zensar",
      company_slug: "zensar",
      location: "Berlin, Germany",
      description: "",
      skills: ["go", "kubernetes"],
      work_mode: "remote",
      regions: ["eu"],
      countries: ["DE"],
      cities: ["Berlin"],
      posted_at: "2026-07-01T00:00:00Z",
      created_at: null,
      enrichment: {},
    };
    const result = toResult(job);
    expect(result.id).toBe("golang-zensar-2bxu6dxm");
    expect(result.title).toBe("Go Engineer");
    expect(result.company).toBe("Zensar");
    expect(result.work_mode).toBe("remote");
    expect(result.skills).toEqual(["go", "kubernetes"]);
  });

  test("nulls for missing fields", () => {
    const job: FreehireJob = {
      public_slug: "slug-1",
      source: "",
      external_id: "",
      url: "",
      title: "",
      company: "",
      company_slug: "",
      location: "",
      description: "",
      skills: [],
      regions: [],
      countries: [],
      cities: [],
      posted_at: null,
      created_at: null,
      enrichment: {},
    };
    const result = toResult(job);
    expect(result.company).toBeNull();
    expect(result.location).toBeNull();
    expect(result.date).toBeNull();
  });
});

describe("toDetail", () => {
  test("includes enrichment fields", () => {
    const job: FreehireJob = {
      public_slug: "slug-1",
      source: "",
      external_id: "",
      url: "https://freehire.dev/jobs/slug-1",
      title: "Engineer",
      company: "Co",
      company_slug: "co",
      location: "Remote",
      description: "<p>Description here</p>",
      skills: ["go"],
      work_mode: "remote",
      regions: [],
      countries: [],
      cities: [],
      posted_at: "2026-07-01T00:00:00Z",
      created_at: null,
      enrichment: {
        seniority: "senior",
        category: "backend",
        employment_type: "full-time",
        salary_min: 80000,
        salary_max: 120000,
        salary_currency: "USD",
      },
    };
    const detail = toDetail(job);
    expect(detail.seniority).toBe("senior");
    expect(detail.category).toBe("backend");
    expect(detail.salary).toBe("USD 80000–120000");
    expect(detail.description).toBe("Description here");
  });
});

describe("baseUrl", () => {
  test("defaults to freehire.dev", () => {
    delete process.env.FREEHIRE_API_URL;
    expect(baseUrl()).toBe("https://freehire.dev");
  });

  test("honors env var", () => {
    process.env.FREEHIRE_API_URL = "http://localhost:8080";
    expect(baseUrl()).toBe("http://localhost:8080");
    delete process.env.FREEHIRE_API_URL;
  });

  test("strips trailing slashes", () => {
    process.env.FREEHIRE_API_URL = "http://localhost:8080/";
    expect(baseUrl()).toBe("http://localhost:8080");
    delete process.env.FREEHIRE_API_URL;
  });
});
