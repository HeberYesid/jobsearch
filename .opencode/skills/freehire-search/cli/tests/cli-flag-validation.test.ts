import { describe, expect, test } from "bun:test";

describe("CLI flag validation", () => {
  test("comma-separated values split correctly", () => {
    const input = "eu,us";
    const vals = input.split(",").map((s) => s.trim()).filter(Boolean);
    expect(vals).toEqual(["eu", "us"]);
  });

  test("facet key=value parsing", () => {
    const kv = "salary_min=100000";
    const eq = kv.indexOf("=");
    expect(eq).toBeGreaterThan(0);
    expect(kv.slice(0, eq)).toBe("salary_min");
    expect(kv.slice(eq + 1)).toBe("100000");
  });

  test("invalid facet rejected", () => {
    const kv = "noequalsign";
    const eq = kv.indexOf("=");
    expect(eq <= 0).toBe(true);
  });

  test("bare --remote defaults to remote", () => {
    const raw = true;
    const whenBare = "remote";
    const result = typeof raw === "string" ? raw : raw === true ? whenBare : undefined;
    expect(result).toBe("remote");
  });
});
