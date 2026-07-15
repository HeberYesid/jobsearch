## Context

Fase 1 delivered the candidate profile (`/setup` + 7 skill files + `profile/`). The framework can evaluate a single posting via `/apply` (Fase 3), but has no way to discover postings. This capability adds two country-agnostic scraper CLIs and an orchestration skill that searches, deduplicates, and presents matches.

The reference repo (MadsLorentzen/ai-job-search) ships 4 Danish-specific scrapers + 2 country-agnostic ones. Per the locked decisions, our MVP includes only the 2 country-agnostic scrapers (linkedin-search + freehire-search). Colombia-specific portals (Computrabajo, Elempleo, etc.) are post-MVP via `/add-portal`.

Both CLIs are adapted from the reference repo's source, ported to our `.opencode/skills/` path structure with OpenCode-compatible SKILL.md frontmatter.

## Goals / Non-Goals

**Goals:**
- Two working scraper CLIs (linkedin-search, freehire-search) that run with `bun` and zero runtime dependencies
- A `/scrape` command that orchestrates multi-portal search, deduplicates, and presents ranked results
- Graceful degradation: if bun is missing or a CLI fails, fall back to WebSearch
- Deduplication across runs via `job_scraper/seen_jobs.json`
- Search strategy derived from the candidate profile via `profile/search-queries.md`
- Personal-use ToS compliance (low volume, no commercial use)

**Non-Goals:**
- Colombia-specific portal scrapers (post-MVP via `/add-portal`)
- `/rank` batch-scoring command (post-MVP)
- Authenticated portal access (declined by design)
- Salary lookup integration during search (salary is a fit-eval dimension in `/apply`, not a search filter)
- PDF verification loop or relevance-weighted CV cutting (tech debt, Fase 3 scope)

## Decisions

### 1. Scraper path: `.opencode/skills/` (not `.agents/skills/`)
**Choice**: Place scraper skills under `.opencode/skills/<name>/` with `SKILL.md` + `cli/` subdirectory.
**Rationale**: OpenCode-first principle. OpenCode natively discovers skills in `.opencode/skills/`. The reference repo uses `.agents/skills/` (Claude Code convention), but our runtime is OpenCode. The agnostic porting phase can later copy these to `.agents/skills/` if needed.
**Alternative**: `.agents/skills/` (portable across runtimes). Rejected because OpenCode is the primary runtime and `.opencode/` is its native path.

### 2. LinkedIn scraper: public jobs-guest endpoints, regex HTML parsing
**Choice**: Use LinkedIn's unauthenticated `jobs-guest` endpoints (`seeMoreJobPostings/search` + `jobPosting/<id>`). Parse the shallow HTML with regex (no DOM parser dependency).
**Rationale**: Zero deps, country-agnostic (location is a query param), stable markup. The reference repo validated this approach across 64 commits.
**Alternative**: `node-html-parser` dependency. Rejected — known nesting bugs on LinkedIn cards, adds a runtime dep, and the markup is shallow enough for regex.

### 3. freehire scraper: public REST API, JSON envelope
**Choice**: Query freehire.dev's `/api/v1/jobs/search` and `/api/v1/jobs/{slug}` endpoints. No API key. `FREEHIRE_API_URL` env var for self-hosting.
**Rationale**: Structured JSON results (skills, seniority, category) vs HTML scraping. Tech-focused but covers LatAm via `--region latam` facet. Best-effort service (no SLA) — CLI fails gracefully with non-zero exit on outage.
**Alternative**: None needed — this is the only structured-API job aggregator in the reference repo.

### 4. CLI output contract: shared JSON schema across scrapers
**Choice**: Both CLIs emit `{ meta: { count, page, total? }, results: [...] }` for search and a flat object for detail. `id` field is the portal-specific identifier (LinkedIn numeric ID, freehire slug). Errors go to stderr as `{ "error": "...", "code": "..." }` with exit code 1.
**Rationale**: The job-scraper skill can treat all portal results uniformly for deduplication and presentation. The `detail` command accepts the `id` from a search result.
**Alternative**: Portal-specific output formats. Rejected — complicates orchestration.

### 5. Orchestration: discover scrapers by reading SKILL.md files
**Choice**: The job-scraper skill discovers installed portal CLIs by globbing `.opencode/skills/*/SKILL.md` and reading each file's documented CLI invocation. It does NOT hardcode portal names.
**Rationale**: Extensibility — portals added later via `/add-portal` are automatically discovered without changes to the scraper skill. This matches the reference repo's pattern.
**Alternative**: Hardcoded portal list. Rejected — not extensible.

### 6. Deduplication: seen_jobs.json + application tracker
**Choice**: `job_scraper/seen_jobs.json` tracks every fetched job by URL-or-company-title key with metadata (title, company, url, first_seen, fit, status). The scraper also checks `job_search_tracker.csv` (if it exists) for already-applied companies.
**Rationale**: Prevents re-presenting jobs across runs. The status field (`new/skipped/evaluated/ranked/expired`) supports future `/rank` and `/outcome` commands additively.
**Alternative**: In-memory dedup only. Rejected — users run `/scrape` multiple times across sessions.

### 7. Quick-fit assessment (not full evaluation)
**Choice**: The scraper does a rapid 3-level fit check (high/medium/low) based on title and snippet match against core profile skills. It does NOT run the full 7-dimension evaluation from `04-job-evaluation.md`.
**Rationale**: The full evaluation requires fetching the complete posting and scoring 7 dimensions — too expensive for every search hit. Quick-fit pre-filters; the user picks a job for the full `/apply` evaluation.
**Alternative**: Full evaluation on every hit. Rejected — too slow and token-expensive for a search sweep.

### 8. WebSearch fallback
**Choice**: If `bun --version` fails or a specific CLI exits non-zero, the scraper falls back to `WebSearch` for portals listed in `search-queries.md` that lack a CLI skill.
**Rationale**: The framework must work even if bun is not installed (e.g., a user who only wants `/apply` with pasted postings). The fallback is noted in the output.
**Alternative**: Require bun. Rejected — reduces accessibility for users who only need the apply workflow.

## Risks / Trade-offs

- **LinkedIn HTML parsing fragility** → LinkedIn may change markup, breaking the regex parser. Mitigation: the parser splits on `data-entity-urn` and parses each card independently so one malformed card doesn't break the rest. CI smoke tests validate the parser against a fixture.
- **LinkedIn ToS violation** → Automated access is against LinkedIn's Terms of Service. Mitigation: SKILL.md carries a prominent personal-use-only warning, the CLI has built-in retry backoff (not hammering), and the user is responsible for volume.
- **freehire.dev outage** → Best-effort service with no SLA. Mitigation: CLI exits non-zero with a clear error message; the scraper skill logs the failure and continues with other portals. `FREEHIRE_API_URL` allows self-hosting.
- **Colombia-specific portals missing** → MVP has no Computrabajo/Elempleo scrapers. Mitigation: `/add-portal` (post-MVP) generates market-specific scrapers. Meanwhile, WebSearch fallback covers portals without CLI skills.
- **Search-queries.md depends on /setup** → If the user runs `/scrape` before `/setup`, there's no search strategy. Mitigation: the scrape command checks for `profile/search-queries.md` and prompts the user to run `/setup` first if missing.
