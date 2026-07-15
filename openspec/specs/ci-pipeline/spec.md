# ci-pipeline Specification

## Purpose
TBD - created by archiving change ci-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Skill and command lint
The `tools/lint_skills.py` script SHALL validate every `SKILL.md` found under `.opencode/skills/*/SKILL.md` has YAML frontmatter with non-empty `name` and `description` keys. It SHALL validate every `.opencode/commands/*.md` file starts with YAML frontmatter. It SHALL validate `opencode.json` is valid JSON with a `permission` object. The script SHALL exit 0 on success and 1 with a failure list otherwise.

#### Scenario: All skills valid
- **WHEN** `tools/lint_skills.py` runs and all SKILL.md files have valid frontmatter with name and description
- **THEN** the script prints "OK" with the count of skills and commands, and exits 0

#### Scenario: Skill missing frontmatter
- **WHEN** a SKILL.md file does not start with `---` YAML frontmatter
- **THEN** the script reports the file as missing frontmatter and exits 1

#### Scenario: Skill missing required key
- **WHEN** a SKILL.md file's frontmatter does not contain a `name` or `description` key
- **THEN** the script reports the missing key and exits 1

#### Scenario: Command missing frontmatter
- **WHEN** a command `.md` file under `.opencode/commands/` does not start with YAML frontmatter
- **THEN** the script reports the file and exits 1

#### Scenario: opencode.json invalid
- **WHEN** `opencode.json` is not valid JSON or lacks a `permission` object
- **THEN** the script reports the error and exits 1

### Requirement: Security guards
The `tools/security_guards.py` script SHALL check three surfaces: (1) `opencode.json` permissions match an allowlist of expected entries, (2) `.gitignore` contains required personal-data ignore rules, (3) no `.opencode/**/package.json` contains forbidden lifecycle scripts (preinstall, install, postinstall, prepare, prepack) or `trustedDependencies`. The script SHALL exit 0 on success and 1 with a failure list otherwise.

#### Scenario: Permissions match allowlist
- **WHEN** `opencode.json` permissions contain only allowlisted entries
- **THEN** the script passes the permissions check

#### Scenario: Permission widened
- **WHEN** `opencode.json` contains a permission entry not in the allowlist
- **THEN** the script reports the entry and exits 1, with a message instructing the contributor to add it to the allowlist in the same PR

#### Scenario: Gitignore rule missing
- **WHEN** `.gitignore` is missing a required personal-data rule (e.g., `profile/`)
- **THEN** the script reports the missing rule and exits 1

#### Scenario: Forbidden lifecycle script
- **WHEN** a `package.json` under `.opencode/` contains a `postinstall` script
- **THEN** the script reports the file and the forbidden script name, and exits 1

#### Scenario: All guards pass
- **WHEN** permissions, gitignore rules, and package manifests all pass
- **THEN** the script prints "OK" and exits 0

### Requirement: LaTeX smoke compilation
The CI pipeline SHALL include a job that compiles `cv/main_example.tex` with `lualatex` and `cover_letters/cover_example.tex` with `xelatex` in a TeX Live container. The job SHALL check for LaTeX errors in the log (lines starting with `!`) and fail if errors are found. The job SHALL NOT assert page counts (templates contain placeholder tokens, not real data).

#### Scenario: Templates compile cleanly
- **WHEN** the LaTeX smoke job runs and both templates compile without errors
- **THEN** the job passes and both PDF files are produced

#### Scenario: LaTeX error in CV template
- **WHEN** `cv/main_example.tex` produces a log with lines starting with `!`
- **THEN** the job fails with an error message showing the LaTeX errors

#### Scenario: LaTeX error in cover letter template
- **WHEN** `cover_letters/cover_example.tex` produces a log with lines starting with `!`
- **THEN** the job fails with an error message showing the LaTeX errors

### Requirement: CLI typecheck
The CI pipeline SHALL include a matrix job that typechecks each installed CLI scraper (linkedin-search, freehire-search) by running `bun install` and `bun run typecheck` in each CLI's directory. The job SHALL NOT run live portal tests (network-flaky, LinkedIn ToS).

#### Scenario: CLI typechecks pass
- **WHEN** the typecheck job runs for linkedin-search and freehire-search
- **THEN** both CLIs pass `bun run typecheck` with exit code 0

#### Scenario: CLI typecheck fails
- **WHEN** a CLI has a TypeScript type error
- **THEN** the matrix job for that CLI fails and the error is reported

### Requirement: Placeholder integrity (upstream only)
The CI pipeline SHALL include a job that verifies tracked template files still contain expected `[PLACEHOLDER]` tokens. This job SHALL run only on the upstream repository (`github.repository == 'HeberYesid/jobsearch'`), not on forks.

#### Scenario: Placeholders present (upstream)
- **WHEN** the placeholder-integrity job runs on the upstream repo and all template files contain their expected `[PLACEHOLDER]` tokens
- **THEN** the job passes

#### Scenario: Placeholder removed (upstream)
- **WHEN** a tracked template file is missing an expected `[PLACEHOLDER]` token
- **THEN** the job fails with an error indicating personal data may have been committed

#### Scenario: Fork bypasses placeholder check
- **WHEN** the CI runs on a fork (not `HeberYesid/jobsearch`)
- **THEN** the placeholder-integrity job is skipped

### Requirement: CI workflow structure
The CI workflow SHALL run on push to the default branch, pull requests, and manual dispatch. The workflow SHALL use read-only permissions (`permissions: contents: read`). Actions SHALL be pinned to commit SHAs (not floating tags). The workflow SHALL NOT include live portal smoke tests or dependency review (MVP scope).

#### Scenario: CI triggers
- **WHEN** a push is made to the default branch or a pull request is opened
- **THEN** the CI workflow runs all jobs

#### Scenario: Read-only permissions
- **WHEN** the CI workflow runs
- **THEN** the `GITHUB_TOKEN` has only `contents: read` permission

### Requirement: Setup documentation
The repo SHALL include a `SETUP.md` file with detailed setup instructions: prerequisites installation commands (choco for MiKTeX + poppler, bun, node, openspec), verification commands, and first-run workflow (`/setup` → `/scrape` → `/apply`).

#### Scenario: User follows setup guide
- **WHEN** a new user reads `SETUP.md`
- **THEN** they find installation commands for all prerequisites, verification commands, and step-by-step first-run instructions

### Requirement: Contributing documentation
The repo SHALL include a `CONTRIBUTING.md` file with guidelines for adding new portal scrapers, adding CV/cover letter templates, running CI checks locally, and using the OpenSpec workflow for spec-driven changes.

#### Scenario: Contributor reads contributing guide
- **WHEN** a contributor reads `CONTRIBUTING.md`
- **THEN** they find instructions for adding portals, templates, running local CI checks, and the OpenSpec propose→apply→archive workflow

