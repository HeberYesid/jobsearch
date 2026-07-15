---
name: getonboard-search
description: >
  Use this skill to search tech jobs in Latin America via GetOnBoard's public
  API — a Chilean job platform focused on tech/IT roles across the region
  (and remote). Covers programming, DevOps, data, design, product, and more.
  Trigger phrases: getonboard jobs, getonbrd, get on board, latam tech jobs,
  "are there any <tech role> jobs in <latam city>", busca trabajo tecnología.
license: MIT
---

# GetOnBoard Search Skill

Search live tech job listings from **[GetOnBoard](https://www.getonbrd.com)** —
the leading tech job platform in Latin America, with a heavy focus on Chile,
remote roles across the region, and growing coverage in LATAM. No authentication
required and **zero runtime dependencies** — it runs with just `bun`.

> This skill follows the same job-portal-skill pattern as `linkedin-search` and
> `freehire-search`. It queries GetOnBoard's public JSON:API at
> `https://www.getonbrd.com/api/v0/search/jobs` — structured data, no HTML parsing.

## When to use this skill

- Search for tech/IT job openings across Latin America or remotely
- Filter by job category (Programming, DevOps, Data, Design, Product, etc.)
- Filter by modality (remote, hybrid, onsite)
- Filter by recency (posted within N days)
- Get the full description of a specific job posting

## Commands

### Search job listings

```bash
bun run .opencode/skills/getonboard-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). Recommended.
- `--jobage <days>` — posted within N days (client-side filter).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side). Default 25.
- `--format json|table|plain` — default `json`.
- `--category <name>` — filter by category (Programming, SysAdmin/DevOps/QA, Data, etc.).
- `--modality <mode>` — `remote` | `hybrid` | `onsite` (client-side filter).

### Fetch full job detail

```bash
bun run .opencode/skills/getonboard-search/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the job slug from `search` results (e.g. `senior-software-engineer-java-angular-english-23people-santiago-e811`).
You may also pass a full `https://www.getonbrd.com/jobs/<slug>` URL.
Since the search API returns full data, detail re-fetches search results and filters by slug.

## Usage examples

```bash
# Remote React roles
bun run .opencode/skills/getonboard-search/cli/src/cli.ts search -q "react" --modality remote --format table

# Programming jobs in Chile, last 14 days
bun run .opencode/skills/getonboard-search/cli/src/cli.ts search -q "software engineer" --category Programming --jobage 14 --format table

# DevOps roles, any modality
bun run .opencode/skills/getonboard-search/cli/src/cli.ts search --category "SysAdmin / DevOps / QA" --limit 10 --format table

# Full details for a specific job
bun run .opencode/skills/getonboard-search/cli/src/cli.ts detail senior-software-engineer-java-angular-english-23people-santiago-e811 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing `id` (slug) to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "total_pages" }, "results": [...] }`; each
result carries at least `id` (the job slug), `title`, `company`, `location`,
`date`, `url`, `salary`, `category`, and `modality` (missing values are `null`).

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and
the process exits with code `1`.

## Notes

- Data is from GetOnBoard's public API at `https://www.getonbrd.com/api/v0` —
  no authentication or API key required.
- Company names are fetched via a parallel API call (`/api/v0/companies/{id}`)
  and cached per session.
- The `category_name` field maps to GetOnBoard's internal categories
  (Programming, SysAdmin / DevOps / QA, Data, Design, Product, etc.).
- The `remote_modality` field uses values like `fully_remote`, `remote_local`,
  `hybrid`, and `onsite`.
- Salary is in USD (numeric, monthly).
- `published_at` is a Unix timestamp (seconds).
