# AI Job Search — OpenCode + LatAm

Framework for AI-assisted job search: scrape postings, evaluate fit, draft tailored CV + cover letter in LaTeX, and ATS-check the output. Adapted from [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) for OpenCode + the LatAm market.

## Workflow

```
/setup  →  /scrape  →  /apply
```

1. **`/setup`** — Build your candidate profile (3 paths: `documents/` folder, paste CV, or guided interview). Output lands in `profile/` (gitignored).
2. **`/scrape`** — Search job portals (linkedin-search, freehire-search). Results land in `job_scraper/` (gitignored), deduplicated and ranked by fit.
3. **`/apply`** — Given a posting (URL or text): evaluate fit, draft CV + cover letter in LaTeX, spawn a reviewer subagent, compile PDFs, and run an ATS check.

## Honesty Rules (non-negotiable)

- **Never fabricate** skills, experience, or qualifications.
- Keywords from a posting that your profile doesn't support → **acknowledged gaps**, never stuffed into the CV.
- The CV and cover letter must be defensible in an interview — every claim traces back to `profile/`.

## Language Rules

- The profile is **bilingual (Spanish + English)**. `/setup` populates both sections.
- `/apply` **detects the posting's language** and generates the CV + cover letter in that language, drawing from the matching profile section.
- **Never translate claims** between languages. If a claim exists only in one section, find the equivalent in the other section of the profile or mark it as a gap.

## File Layout

| Path | Purpose | Committed? |
|------|---------|------------|
| `.opencode/commands/` | Slash commands (`/setup`, `/scrape`, `/apply`) | Yes |
| `.opencode/skills/` | Skills (assistant, scrapers) | Yes |
| `.opencode/agents/` | Subagents (reviewer) | Yes |
| `profile/` | Your candidate profile (real data) | No — gitignored |
| `cv/main_example.tex` | CV template (moderncv, `[PLACEHOLDER]` tokens) | Yes — template only |
| `cover_letters/` | Cover letter class + template | Yes — template only |
| `documents/` | Source materials for `/setup` Path A | No — contents gitignored |
| `job_scraper/` | Scraper state + results | No — gitignored |
| `tools/` | CI lint scripts | Yes |
| `openspec/` | Specs + change proposals | Yes |

## LaTeX

- **CV**: `lualatex cv/main.tex` (moderncv, 2 pages target)
- **Cover letter**: `xelatex cover_letters/cover.tex` (custom `cover.cls`, 1 page target)
- Fonts: Lato + Raleway (in `cover_letters/OpenFonts/`)
- ATS check: `pdftotext` extracts text → verify contact details, reading order, keyword coverage, no stuffing.

## Prerequisites

```powershell
choco install miktex poppler -y
```

Verify: `lualatex --version && xelatex --version && pdftotext -v`

## Fit Evaluation (7 dimensions)

1. **Skills** — match between posting requirements and profile
2. **Experience** — years + relevance
3. **Culture** — values, team structure, work style
4. **Location** — geography, relocation, remote feasibility
5. **Career alignment** — trajectory direction
6. **Modality** — remote / hybrid / onsite
7. **Salary band** — conditional on data availability

Deal-breakers surface explicitly; the candidate decides whether to proceed.

## Tech Debt (post-MVP, via OpenSpec)

1. **PDF verification loop** — auto-iterate LaTeX to fix orphans/overflow (dropped from MVP)
2. **Relevance-weighted CV cutting** — smart section trimming to hit 2 pages (dropped from MVP)
