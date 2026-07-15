---
name: remotive-search
description: >
  Use this skill to search live remote tech / software / engineering job
  listings via the Remotive public API. The categories are curated for remote
  roles (default: software-dev). Trigger phrases: remotive jobs, remotive
  search, remote tech jobs.
license: MIT
---

# Remotive Search Skill

Search live remote job listings from the **[Remotive](https://remotive.com)** job
board — a public API aggregating remote roles from across the web, curated for
remote / distributed teams. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`.

> This is a job-portal-skill following the same pattern as `linkedin-search` and
> `freehire-search`. Unlike the HTML-scraping portals, it uses Remotive's public
> JSON API, so results are structured without parsing markup.

## API: Attribution + Data Freshness

This skill uses Remotive's public API (`GET https://remotive.com/api/remote-jobs`)
which is free, open, and requires **no authentication**.

**Attribution required per Remotive ToS.** If you display results publicly, you
must credit Remotive as the source.

**Data freshness:** Job postings on Remotive may be delayed up to 24 hours
behind the original source. Always verify details (especially application
deadlines) on the original listing.

## Commands

### Search job listings

```bash
bun run .opencode/skills/remotive-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, company). Client-side filter.
- `--jobage <days>` — posted within N days (client-side date filter).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.
- `--category <name>` — Remotive category slug. Default `software-dev`.

### Fetch full job detail

```bash
bun run .opencode/skills/remotive-search/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the numeric job ID from a `search` result (e.g. `1234567`). Returns the
full description, category, tags, and salary.

## Usage examples

```bash
# Latest remote software-dev roles, table view
bun run .opencode/skills/remotive-search/cli/src/cli.ts search --limit 10 --format table

# Search for "react" roles posted in the last 7 days
bun run .opencode/skills/remotive-search/cli/src/cli.ts search -q "react" --jobage 7 --format table

# Customer support roles (non-software category)
bun run .opencode/skills/remotive-search/cli/src/cli.ts search --category customer-support --format table

# Full details for a specific job
bun run .opencode/skills/remotive-search/cli/src/cli.ts detail 1234567 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "total" }, "results": [...] }`; each result
carries at least `id`, `title`, `company`, `location`, `date`, and `url`
(missing values are `null`). All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is from Remotive's public API at `https://remotive.com/api/remote-jobs` —
  no credentials required.
- The API returns all matching jobs in one response (no pagination). All
  filtering (query, jobage, limit) is performed client-side.
- Category defaults to `software-dev`. See [Remotive categories](https://remotive.com/remote-jobs)
  for available category slugs.
- `id` is a numeric integer — pass it as-is to `detail`.
- The CLI retries 429/5xx with exponential backoff. An unreachable API exits
  non-zero with a clear error message.
- Attribution required per Remotive's Terms of Service.
