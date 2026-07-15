## 1. Lint script

- [x] 1.1 Create `tools/lint_skills.py` — validates `.opencode/skills/*/SKILL.md` frontmatter (name + description required), `.opencode/commands/*.md` frontmatter presence, `opencode.json` valid JSON with permission object. Exit 0 on success, 1 with failure list. Uses PyYAML for frontmatter parsing.

## 2. Security guards script

- [x] 2.1 Create `tools/security_guards.py` — checks `opencode.json` permissions against allowlist (catches widening), `.gitignore` required personal-data rules present (profile/, documents/*, job_scraper/*), `.opencode/**/package.json` no forbidden lifecycle scripts (preinstall/install/postinstall/prepare/prepack) or trustedDependencies. Exit 0 on success, 1 with failure list. Stdlib only (no PyYAML needed).

## 3. CI workflow

- [x] 3.1 Create `.github/workflows/ci.yml` — 5 jobs: lint (ubuntu, python 3.12, pip pyyaml, run lint_skills.py), security-guards (ubuntu, python 3.12, run security_guards.py), latex-smoke (texlive/texlive:latest container, lualatex cv/main_example.tex, xelatex cover_letters/cover_example.tex, check log for errors), cli-typecheck (matrix: linkedin-search + freehire-search, setup-bun, bun install, bun run typecheck in each cli dir), placeholder-integrity (upstream-only: github.repository == 'HeberYesid/jobsearch', grep for [PLACEHOLDER] tokens in template files). Actions pinned to commit SHAs. permissions: contents: read. Triggers: push to main, pull_request, workflow_dispatch.

## 4. Documentation

- [x] 4.1 Create `SETUP.md` — prerequisites installation (choco install miktex poppler, bun, node 20+, openspec), verification commands (lualatex --version, xelatex --version, pdftotext -v, bun --version), first-run workflow (/setup → /scrape → /apply), notes on optional vs required tools
- [x] 4.2 Create `CONTRIBUTING.md` — how to add a portal scraper (create .opencode/skills/<name>/SKILL.md + cli/, follow linkedin-search pattern, add to cli-typecheck matrix), how to add CV/cover letter templates, how to run CI checks locally (python tools/lint_skills.py, python tools/security_guards.py, bun run typecheck), OpenSpec workflow (openspec new change → write artifacts → validate → archive), honesty rules for contributors
- [x] 4.3 Update `README.md` — add CI badge, link to SETUP.md and CONTRIBUTING.md in relevant sections

## 5. Verification and archive

- [x] 5.1 Run `python tools/lint_skills.py` locally — verify it passes
- [x] 5.2 Run `python tools/security_guards.py` locally — verify it passes
- [x] 5.3 Run `openspec validate ci-pipeline`
- [x] 5.4 Run `openspec archive ci-pipeline`
