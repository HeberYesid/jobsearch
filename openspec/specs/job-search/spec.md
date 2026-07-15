# job-search Specification

## Purpose
TBD - created by archiving change job-search. Update Purpose after archive.
## Requirements
### Requirement: LinkedIn search CLI
The system SHALL provide a `linkedin-search` CLI that searches LinkedIn's public `jobs-guest` endpoints for job listings in any country/region or remotely, without authentication. The CLI SHALL have zero runtime dependencies (runs with plain `bun`) and SHALL support `search` and `detail` commands.

#### Scenario: Search by keyword and location
- **WHEN** the user runs `linkedin-search search -q "software engineer" -l "Bogotá, Colombia" --format json`
- **THEN** the CLI returns a JSON object with `meta.count` and `results` array, each result containing `id`, `title`, `company`, `location`, `date`, and `url`

#### Scenario: Search with recency and remote filters
- **WHEN** the user runs `linkedin-search search -q "data analyst" -l "Remote" --jobage 7 --remote remote --format table`
- **THEN** the CLI returns only postings from the last 7 days with workplace type "remote", formatted as a human-readable table

#### Scenario: Detail lookup by job ID
- **WHEN** the user runs `linkedin-search detail <id> --format plain`
- **THEN** the CLI returns the full job description, seniority, employment type, job function, industries, and apply URL as readable text

#### Scenario: Missing required location flag
- **WHEN** the user runs `linkedin-search search -q "engineer"` without `--location` or `-l`
- **THEN** the CLI writes a JSON error to stderr with code `NO_LOCATION` and exits with code 1

#### Scenario: Rate limit retry
- **WHEN** LinkedIn returns HTTP 429 or 5xx
- **THEN** the CLI retries with exponential backoff (up to 6 attempts) before failing with a clear error message

### Requirement: freehire search CLI
The system SHALL provide a `freehire-search` CLI that queries the freehire.dev public REST API for tech-focused job listings across many markets. The CLI SHALL have zero runtime dependencies, support `search` and `detail` commands, and honor the `FREEHIRE_API_URL` environment variable for self-hosting.

#### Scenario: Search with facet filters
- **WHEN** the user runs `freehire-search search -q "backend engineer" --seniority senior --region latam --format json`
- **THEN** the CLI returns JSON with `meta.total` and `results` array, each result containing `id` (slug), `title`, `company`, `location`, `date`, `url`, `work_mode`, `regions`, `countries`, and `skills`

#### Scenario: Search with remote and category filters
- **WHEN** the user runs `freehire-search search -q "react" --remote remote --category frontend --format table`
- **THEN** the CLI returns only remote frontend roles, formatted as a table with slug, title, company, location, and date columns

#### Scenario: Detail lookup by slug
- **WHEN** the user runs `freehire-search detail <slug> --format plain`
- **THEN** the CLI returns the full description, seniority, category, employment type, salary (if available), skills, and URL as readable text

#### Scenario: API unreachable
- **WHEN** the freehire.dev API is unreachable (connection refused, DNS failure, or timeout)
- **THEN** the CLI throws a clear error message identifying the base URL and exits with code 1 without retrying the connection

#### Scenario: Self-hosted base URL
- **WHEN** the `FREEHIRE_API_URL` environment variable is set to `http://localhost:8080`
- **THEN** the CLI queries that base URL instead of `https://freehire.dev` for all API calls

### Requirement: CLI output contract
Both scraper CLIs SHALL share a consistent output contract: search results as `{ meta: { count, page, total? }, results: [...] }` in JSON mode, detail as a flat JSON object, errors as `{ "error": "...", "code": "..." }` on stderr with exit code 1. The `id` field SHALL be the portal-specific identifier consumable by that portal's `detail` command.

#### Scenario: JSON search output shape
- **WHEN** any portal CLI runs `search --format json`
- **THEN** stdout contains a JSON object with `meta` (including `count`) and `results` (array of job objects with at minimum `id`, `title`, `company`, `location`, `date`, `url`)

#### Scenario: Error output shape
- **WHEN** any portal CLI encounters an error
- **THEN** stderr contains a JSON object with `error` (message) and `code` (machine-readable code), and the process exits with code 1

### Requirement: Scraper skill discovery
The job-scraper skill SHALL discover installed portal CLIs by reading every `SKILL.md` found under `.opencode/skills/*/SKILL.md`. It SHALL NOT hardcode portal names. Each portal's `SKILL.md` documents its CLI invocation and supported flags.

#### Scenario: Automatic portal discovery
- **WHEN** `/scrape` runs and `linkedin-search` and `freehire-search` skills are installed under `.opencode/skills/`
- **THEN** the scraper reads both `SKILL.md` files and invokes both CLIs without any hardcoded portal list

#### Scenario: New portal auto-inclusion
- **WHEN** a new portal skill is added under `.opencode/skills/<new-portal>/SKILL.md` (e.g. via future `/add-portal`)
- **THEN** the next `/scrape` run automatically discovers and invokes that portal's CLI without changes to the job-scraper skill

### Requirement: Deduplication across runs
The system SHALL persist seen jobs in `job_scraper/seen_jobs.json` with structure `{ seen: { <key>: { title, company, url, first_seen, fit, status } } }`. The scraper SHALL skip jobs already in the seen list or in `job_search_tracker.csv` (if present). The `status` field SHALL support additive extension by future commands (`ranked`, `expired`).

#### Scenario: First scrape
- **WHEN** the user runs `/scrape` for the first time (`job_scraper/seen_jobs.json` does not exist)
- **THEN** the scraper creates the file with `{"seen": {}}` and populates it with all fetched jobs

#### Scenario: Subsequent scrape deduplication
- **WHEN** the user runs `/scrape` again and a job URL already exists in `seen_jobs.json`
- **THEN** the scraper skips that job and does not present it in the results table

#### Scenario: Applied job deduplication
- **WHEN** a company+role combination appears in `job_search_tracker.csv`
- **THEN** the scraper skips any matching job from that company for that role

### Requirement: Quick-fit assessment
The scraper SHALL perform a rapid 3-level fit assessment (high/medium/low) for each new job based on title and snippet match against the candidate's core skills from `profile/search-queries.md`. This is NOT the full 7-dimension evaluation from `04-job-evaluation.md`.

#### Scenario: High match
- **WHEN** a job title directly involves the candidate's core skills
- **THEN** the job is tagged `fit: "high"` in `seen_jobs.json` and presented first in the results table

#### Scenario: Low match
- **WHEN** a job requires significant skills the candidate lacks
- **THEN** the job is tagged `fit: "low"` in `seen_jobs.json` and presented last in the results table

### Requirement: Search results presentation
The scraper SHALL present new jobs in a Markdown table sorted by fit (high first), with columns for fit, title, company, location, deadline, and URL. For high-match jobs, it SHALL add 2-3 bullet points explaining the match. After presenting, it SHALL ask the user if they want to evaluate any job in detail (handing off to `/apply`).

#### Scenario: Results table
- **WHEN** the scrape completes with new jobs found
- **THEN** the output includes a Markdown table sorted by fit (high → medium → low) with one row per job

#### Scenario: No new jobs
- **WHEN** the scrape completes but all found jobs are already in `seen_jobs.json`
- **THEN** the output states "No new positions found" and does not present an empty table

#### Scenario: Handoff to apply
- **WHEN** the user picks a job number from the results table
- **THEN** the scraper invokes the job-application-assistant skill workflow for that job's posting

### Requirement: Graceful degradation
The scraper SHALL fall back to `WebSearch` when `bun` is unavailable, when a specific CLI exits non-zero, or for portals listed in `search-queries.md` that have no CLI skill. The fallback SHALL be noted in the output.

#### Scenario: Bun unavailable
- **WHEN** `bun --version` fails (bun not installed)
- **THEN** the scraper skips all CLI invocations, uses `WebSearch` for all portals, and notes the fallback in the output

#### Scenario: CLI failure
- **WHEN** a portal CLI exits with a non-zero code
- **THEN** the scraper logs the error message, continues with other portals, and notes the failure in the output

### Requirement: Search strategy from profile
The `/setup` command SHALL produce `profile/search-queries.md` containing the search strategy: target role categories, keywords, geographic locations, and portal preferences. The `/scrape` command SHALL read this file to determine search parameters. If the file is missing, `/scrape` SHALL prompt the user to run `/setup` first.

#### Scenario: Scrape with search strategy
- **WHEN** `profile/search-queries.md` exists and the user runs `/scrape`
- **THEN** the scraper reads the top 3 priority query categories and translates them into each portal's flag format

#### Scenario: Scrape without search strategy
- **WHEN** `profile/search-queries.md` does not exist and the user runs `/scrape`
- **THEN** the scraper prompts the user to run `/setup` first and does not proceed with the search

#### Scenario: Broad search
- **WHEN** the user runs `/scrape broad`
- **THEN** the scraper runs all query categories from `search-queries.md`, not just the top 3

#### Scenario: Focused search
- **WHEN** the user runs `/scrape data science`
- **THEN** the scraper prioritizes queries from the "data science" category in `search-queries.md`

### Requirement: Personal use and ToS compliance
Each scraper SKILL.md SHALL carry a prominent personal-use-only warning. The LinkedIn scraper SHALL note that automated access is against LinkedIn's Terms of Service. The system SHALL NOT support authenticated or bulk access.

#### Scenario: ToS warning in skill
- **WHEN** a user reads the `linkedin-search` SKILL.md
- **THEN** the file contains a visible warning about LinkedIn ToS and personal-use-only restriction

### Requirement: Scraper state isolation
The `job_scraper/` directory SHALL be gitignored. Seen jobs, search results, and any cached data SHALL live only in `job_scraper/` and SHALL NOT be committed to the repository.

#### Scenario: Gitignore coverage
- **WHEN** the user runs `git status` after a scrape
- **THEN** no files under `job_scraper/` appear as untracked or modified

