---
description: >
  Search job portals for postings matching your profile. Deduplicates across
  runs and presents matches ranked by quick-fit. Accepts optional focus area
  or "broad" to run all search categories.
---

Search for job postings matching your profile. This is step 2 of the workflow (/setup → /scrape → /apply).

Load the `job-scraper` skill for the orchestration workflow.

## Arguments

- `$ARGUMENTS` is optional. If provided, it can be:
  - A focus area: `/scrape data science` — prioritizes queries from that category in `profile/search-queries.md`
  - "broad": `/scrape broad` — runs all query categories instead of just the top 3

## Prerequisites

1. The user must have run `/setup` first — `/scrape` reads `profile/search-queries.md` for the search strategy. If the file is missing, prompt the user to run `/setup`.
2. `bun` must be installed for CLI-based search. If `bun --version` fails, the scraper falls back to WebSearch (noted in the output).

## Execution

Follow the job-scraper skill's 6-step workflow:

1. **Load state** — read `job_scraper/seen_jobs.json`, `job_search_tracker.csv` (if exists), and `profile/search-queries.md`
2. **Search** — discover installed portal CLIs via `.opencode/skills/*/SKILL.md`, run searches in parallel with `--format json`, fall back to WebSearch for gaps
3. **Fetch & parse** — for promising matches, fetch full detail via each portal's `detail` command or WebFetch; skip already-seen jobs
4. **Quick-fit assessment** — tag each job high/medium/low based on title+snippet vs core skills
5. **Deduplicate & store** — update `job_scraper/seen_jobs.json` with all fetched jobs
6. **Present results** — Markdown table sorted by fit (high first), with high-match highlights; offer handoff to `/apply`

## Portal Discovery

The scraper discovers installed portals by reading `SKILL.md` files under `.opencode/skills/*/SKILL.md`. Currently installed portals:

- **linkedin-search** — LinkedIn public job listings (any country/region, remote). `-l` flag for location, `-q` for keywords.
- **freehire-search** — freehire.dev aggregator (tech-focused, multi-market). `--region latam` for LatAm, `--country CO` for Colombia, `--remote` for remote.

Read each portal's `SKILL.md` for exact CLI invocation and supported flags. Do not guess flags — use the documented interface.

## Honesty Rules

- **Never fabricate** job postings. Only present jobs from actual search output.
- If a portal CLI fails, log the error and continue with other portals.
- If no new jobs are found, state "No new positions found" — do not re-present old results.
