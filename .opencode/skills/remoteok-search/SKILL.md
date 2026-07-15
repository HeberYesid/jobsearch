---
name: remoteok-search
description: >
  Search live remote software / tech / engineering job listings from RemoteOK's
  public API. RemoteOK aggregates remote jobs from across the web into a single
  searchable feed — no authentication needed. Trigger phrases: remoteok jobs,
  remote ok, remoteok search, remoteok.
license: MIT
---

# RemoteOK Search Skill

Search live **remote-first** job listings from the **[RemoteOK](https://remoteok.com)**
public API — a popular aggregator focused on fully-remote tech roles. No authentication,
no API key, and **zero runtime dependencies** — it runs with just `bun`.

> This is a remote-only worked example of the repo's job-portal-skill pattern,
> like `linkedin-search` and `freehire-search`. RemoteOK exclusively lists
> remote jobs, so there is no `--location` flag.

## When to use this skill

- Search for remote tech/software job openings by keyword or skill tag
- Filter by recency or tag (React, Go, Python, Rust, etc.)
- Get the full description of a specific RemoteOK posting

## Commands

### Search job listings

```bash
bun run .opencode/skills/remoteok-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (matches title, company). Optional.
- `--tag <name>` — filter by skill tag, e.g. `--tag react`, `--tag go`, `--tag rust`. Repeatable.
- `--jobage <days>` — posted within N days (client-side filter). Omit for all.
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

Note: RemoteOK's API returns **all** jobs (no server-side pagination or query
params). All filtering (keyword, tag, recency, limit) is applied client-side.

### Fetch full job detail

```bash
bun run .opencode/skills/remoteok-search/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the numeric job ID from a `search` result. Since the search response
already contains the full job data (description, tags, salary, etc.), `detail`
is a client-side lookup by ID from the full API response — no extra network call.

## Usage examples

```bash
# React jobs
bun run .opencode/skills/remoteok-search/cli/src/cli.ts search -q "react" --format table

# Golang jobs with a tag filter
bun run .opencode/skills/remoteok-search/cli/src/cli.ts search --tag go --limit 10 --format table

# Jobs posted in the last 7 days
bun run .opencode/skills/remoteok-search/cli/src/cli.ts search --jobage 7 --format table

# Full details for a specific job
bun run .opencode/skills/remoteok-search/cli/src/cli.ts detail 123456 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing a result's `id` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "total" }, "results": [...] }`; each
result carries at least `id`, `title`, `company`, `location`, `date`, `url`,
`tags`, `salary`, `description`. Missing values are `null`. All errors are
written to **stderr** as `{ "error": "...", "code": "..." }` and the process
exits with code `1`.

## Notes

- Data is from RemoteOK's public API (`GET https://remoteok.com/api`) — no
  credentials required.
- The API returns all jobs in a single response (no pagination). Filtering is
  client-side, which is fine for moderate-volume use.
- Tags are a rich comma-separated list of skill keywords — useful for matching
  against a candidate profile's skills.
- Salary is typically a string range (e.g. `"$100K – $150K"`) or `null`.
- The API retries 5xx with exponential backoff; an unreachable API exits
  non-zero with a clear message.
