## Why

The candidate-profile capability (Fase 1) gives `/apply` everything it needs to evaluate a single posting, but the framework has no way to *find* postings. A job-search capability closes that gap: it searches multiple portals, deduplicates across runs, and presents matches ranked by quick-fit signal — so the user can pick a posting and hand it to `/apply`.

## What Changes

- **New scraper CLI: `linkedin-search`** — bun TypeScript CLI that queries LinkedIn's public `jobs-guest` endpoints. Country-agnostic (location passed via `-l` flag), zero runtime dependencies, `search` + `detail` commands, JSON/table/plain output, retry with backoff on 429/5xx.
- **New scraper CLI: `freehire-search`** — bun TypeScript CLI that queries the freehire.dev public REST API. Tech-focused, multi-market via facet flags (`--region`, `--country`, `--remote`), zero runtime dependencies, `search` + `detail` commands, `FREEHIRE_API_URL` env var for self-hosting.
- **New skill: `job-scraper`** — orchestrates `/scrape`: loads `job_scraper/seen_jobs.json` state, discovers installed portal CLIs by reading each `SKILL.md`, runs searches in parallel, fetches detail for promising matches, quick-fits each job, deduplicates against seen + tracker, presents results table sorted by fit. Falls back to WebSearch when bun is unavailable or a CLI fails.
- **New command: `/scrape`** — the slash command that triggers the job-scraper skill. Accepts optional focus area or "broad" argument.
- **New file: `profile/search-queries.md`** — search strategy file (role categories, keywords, locations, portals) produced by `/setup` and consumed by `/scrape`. Gitignored (contains personal preferences).
- **Deduplication state**: `job_scraper/seen_jobs.json` — persists seen jobs across runs with fit/status metadata.

## Capabilities

### New Capabilities
- `job-search`: Multi-portal job posting search, deduplication, quick-fit assessment, and ranked presentation. Includes two country-agnostic scraper CLIs (linkedin-search, freehire-search), the job-scraper orchestration skill, and the `/scrape` command.

### Modified Capabilities
- `candidate-profile`: `/setup` now also produces `profile/search-queries.md` (search strategy derived from the candidate profile). This is an additive extension — no existing requirements change, only a new output file.

## Impact

- **New code**: ~8 TypeScript files per scraper CLI (cli.ts, helpers.ts, commands/search.ts, commands/detail.ts, package.json, tsconfig.json + tests), 1 SKILL.md per scraper, 1 job-scraper SKILL.md, 1 scrape.md command.
- **Dependencies**: zero runtime deps for both CLIs (bun + fetch only). Dev deps: typescript, @types/bun.
- **State files**: `job_scraper/seen_jobs.json` (gitignored), `profile/search-queries.md` (gitignored).
- **External services**: LinkedIn public jobs-guest endpoints (personal use, ToS-limited), freehire.dev public API (best-effort, no SLA).
- **CI**: both CLIs typecheck with `tsc --noEmit` and test with `bun test`.
