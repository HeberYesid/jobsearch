---
name: arc-search
description: >
  Search remote developer jobs on Arc.dev — a curated remote-job board for
  software engineers, designers, product managers, and more. Scrapes arc.dev's
  Next.js pages (zero runtime dependencies). Trigger phrases: arc.dev jobs,
  arc search, arc dev, arc remote jobs.
license: MIT
---

# Arc Search Skill

Search live remote job listings from **[Arc.dev](https://arc.dev/remote-jobs)** — a
curated board for remote tech roles. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`. The HTML is scraped from arc.dev's Next.js
pages, extracting structured data from the embedded `__NEXT_DATA__` JSON.

> This is an HTML-scraping portal skill, like `linkedin-search`. Arc.dev is a Next.js
> site that embeds its data in a `<script id="__NEXT_DATA__">` tag, so parsing does
> not depend on fragile DOM selectors — it reads the server-rendered JSON directly.

## Personal use only

This uses Arc's public job pages; automated access is against Arc's Terms of Service,
so **keep volume low and don't use it commercially or for bulk data collection.**
Run it on your own responsibility.

## When to use this skill

- Search for remote developer jobs by keyword on Arc.dev
- Filter by recency (posted within N days) or skill
- Get the full description of a specific job posting
- Timezone overlap filter (useful for LatAm candidates coordinating with US/EU time zones)

## Commands

### Search job listings

```bash
bun run .opencode/skills/arc-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). Recommended.
- `--jobage <days>` — posted within N days. Omit for all postings.
- `--skill <name>` — filter by a specific skill/tag.
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .opencode/skills/arc-search/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the job slug from `search` results (e.g. `senior-ceph-rook-engineer-ft-emea`).
Returns the full description, skills, salary, timezone info, and apply link.

## Usage examples

```bash
# React developer roles, table view
bun run .opencode/skills/arc-search/cli/src/cli.ts search -q "react" --format table

# Senior roles with salary data, JSON
bun run .opencode/skills/arc-search/cli/src/cli.ts search -q "senior engineer" --format json

# Devops jobs posted in the last 14 days
bun run .opencode/skills/arc-search/cli/src/cli.ts search -q "devops" --jobage 14 --format table

# Full details for a specific job
bun run .opencode/skills/arc-search/cli/src/cli.ts detail senior-ceph-rook-engineer-ft-emea --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing `id` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count" }, "results": [...] }`; each result carries at
least `id` (the Arc slug), `title`, `company`, `location`, `date`, and `url` (missing
values are `null`). All errors are written to **stderr** as `{ "error": "...", "code": "..." }`
and the process exits with code `1`.

## Extra: timezone overlap

Arc.dev listings often specify required timezone overlap (e.g. "Min. 6 hr working
overlap with Berlin"). The `timezone` field in detail output captures this, which
is useful for LatAm candidates evaluating US/EU remote roles.

## Notes

- Data is scraped from Arc's public pages — no credentials required.
- Arc is a Next.js site; data is extracted from the `__NEXT_DATA__` script tag (server-
  rendered JSON), not from fragile DOM selectors.
- `id` in search results is the URL slug — pass it as-is to `detail`.
- `date` is the posting date when available; may be `null` for undated postings.
- The CLI retries 429/5xx with exponential backoff. Keep volume low (see ToS note above).
