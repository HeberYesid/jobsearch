## 1. linkedin-search CLI

- [x] 1.1 Create `package.json` (zero runtime deps, bun scripts, typecheck)
- [x] 1.2 Create `tsconfig.json` (ESNext, bundler, bun types, strict)
- [x] 1.3 Create `src/helpers.ts` (SEARCH_URL, DETAIL_URL, htmlFetch with retry, parseJobCards, parseJobDetail, jobageToTPR, workTypeFlag, decodeHtmlEntities, clean, writeError)
- [x] 1.4 Create `src/commands/search.ts` (buildUrl, renderTable, runSearch)
- [x] 1.5 Create `src/commands/detail.ts` (normalizeId, runDetail)
- [x] 1.6 Create `src/cli.ts` (flag parsing, command dispatch, help text)
- [x] 1.7 Create `tests/search.test.ts` (limit 0 emits zero results, HTML parsing fixture)
- [x] 1.8 Create `SKILL.md` (OpenCode frontmatter, personal-use ToS warning, command reference, usage examples)
- [x] 1.9 Run `tsc --noEmit` and `bun test` — both pass

## 2. freehire-search CLI

- [x] 2.1 Create `package.json` (zero runtime deps, bun scripts, typecheck)
- [x] 2.2 Create `tsconfig.json` (ESNext, bundler, bun types, strict)
- [x] 2.3 Create `src/helpers.ts` (baseUrl, apiGet with retry, FreehireJob/JobResult/JobDetailResult types, toResult, toDetail, cleanHtml, normalizeSlug, formatSalary, writeError)
- [x] 2.4 Create `src/commands/search.ts` (buildQuery, renderTable, renderPlain, runSearch)
- [x] 2.5 Create `src/commands/detail.ts` (renderPlain, runDetail)
- [x] 2.6 Create `src/cli.ts` (flag parsing, facet repeat handling, command dispatch, help text)
- [x] 2.7 Create `tests/` directory with test files (helpers parsing, CLI flag validation, commands)
- [x] 2.8 Create `SKILL.md` (OpenCode frontmatter, tech-focused scope note, hosted-service dependency note, command reference, usage examples)
- [x] 2.9 Run `tsc --noEmit` and `bun test` — both pass

## 3. job-scraper skill

- [x] 3.1 Create `SKILL.md` under `.opencode/skills/job-scraper/` (6-step orchestration: load state, search via CLI discovery, fetch & parse, quick-fit, deduplicate & store, present results; WebSearch fallback; important rules)

## 4. /scrape command

- [x] 4.1 Create `.opencode/commands/scrape.md` (frontmatter with description, trigger phrases, optional arguments: focus area / "broad"; invokes job-scraper skill workflow)

## 5. Search strategy integration

- [x] 5.1 Add search-queries.md generation to `.opencode/skills/job-application-assistant/SKILL.md` reference table
- [x] 5.2 Update `.opencode/commands/setup.md` to produce `profile/search-queries.md` (role categories, keywords, locations, portal preferences derived from profile)
- [x] 5.3 Add `profile/search-queries.md` to `.gitignore` (verify it's covered by existing profile/ rule)

## 6. Verification

- [x] 6.1 Both CLIs typecheck: `tsc --noEmit` passes in each cli/ dir
- [x] 6.2 Both CLIs tests pass: `bun test` passes in each cli/ dir (7 + 18 = 25 tests)
- [x] 6.3 `openspec validate job-search` passes
- [x] 6.4 SKILL.md frontmatter validates (name matches dir name, lowercase-hyphen, description present)
- [x] 6.5 seen_jobs.json structure matches spec in job-scraper SKILL.md
- [x] 6.6 /scrape command references correct paths (.opencode/skills/*/SKILL.md, job_scraper/seen_jobs.json, profile/search-queries.md)
