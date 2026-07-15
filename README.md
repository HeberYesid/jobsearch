# AI Job Search (OpenCode + LatAm)

[![CI](https://github.com/HeberYesid/jobsearch/actions/workflows/ci.yml/badge.svg)](https://github.com/HeberYesid/jobsearch/actions/workflows/ci.yml)

AI-assisted job search framework: scrape postings, evaluate fit, draft tailored CV + cover letter in LaTeX, and ATS-check the output. Built for **OpenCode** and the **Latin American + remote international market**.

Adapted from [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) (Claude Code + Danish market).

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/)
- [OpenCode](https://opencode.ai/)
- [OpenSpec](https://github.com/fission-ai/openspec): `npm install -g @fission-ai/openspec@latest`
- LaTeX (MiKTeX on Windows): `choco install miktex -y`
- poppler (ATS check): `choco install poppler -y`

Verify:
```powershell
lualatex --version; xelatex --version; pdftotext -v
```

### Usage

1. **Build your profile**: run `/setup` — drop files in `documents/`, paste your CV, or do a guided interview.
2. **Search for jobs**: run `/scrape -l "Bogota, Colombia"` or `/scrape -l "remote"`.
3. **Apply**: run `/apply <posting-url>` or `/apply` then paste the posting text.

## Workflow

```
/setup  →  /scrape  →  /apply
```

| Command | What it does |
|---------|-------------|
| `/setup` | Build your bilingual (ES + EN) candidate profile |
| `/scrape` | Search LinkedIn + Freehire, deduplicate, rank by fit |
| `/apply` | Evaluate fit, draft CV + cover letter (LaTeX), review, compile, ATS check |

See [`AGENTS.md`](AGENTS.md) for full workflow rules, [`SETUP.md`](SETUP.md) for detailed setup instructions, and [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

## Features

- **Bilingual profile** (Spanish + English) — detects posting language, generates in that language
- **7-dimension fit evaluation** — skills, experience, culture, location, career alignment, modality, salary band
- **LaTeX output** — moderncv CV (lualatex) + custom cover letter class (xelatex)
- **ATS check** — pdftotext verification of contact details, reading order, keyword coverage
- **Drafter-reviewer** — a subagent with fresh context researches the company and critiques the draft
- **Honesty-first** — never fabricates skills; unsupported keywords become acknowledged gaps, not stuffing
- **Shareable** — templates use `[PLACEHOLDER]` tokens; your profile is gitignored

## License

[MIT](LICENSE)
