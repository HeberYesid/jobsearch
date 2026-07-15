---
name: job-application-assistant
description: AI job application assistant for the LatAm + remote market. Loads candidate profile, evaluates job fit across 7 dimensions, drafts tailored CV and cover letter in LaTeX, and runs ATS checks. Bilingual ES+EN with posting language detection.
license: MIT
---

# Job Application Assistant

This skill provides the reference framework for the AI job search workflow. It is loaded by `/setup`, `/scrape`, and `/apply`.

## Reference Files

| File | Purpose |
|------|---------|
| `01-candidate-profile.md` | CV structure (experience, education, skills, certifications, languages) |
| `02-behavioral-profile.md` | Values, work style, culture preferences |
| `03-writing-style.md` | Tone and voice for ES and EN |
| `04-job-evaluation.md` | 7-dimension fit framework + deal-breakers |
| `05-cv-templates.md` | moderncv tailoring rules |
| `06-cover-letter-templates.md` | Cover letter structure rules |
| `07-language-detection.md` | Posting language detection + profile section selection |

## Honesty Rules (non-negotiable)

- **Never fabricate** skills, experience, or qualifications.
- Keywords from a posting that the profile doesn't support → **acknowledged gaps**, never stuffed.
- Every claim in the CV and cover letter must be defensible in an interview — traceable to `profile/`.

## Language Rules

- The profile is **bilingual (ES + EN)**.
- `/apply` detects the posting's language and generates in that language.
- **Never translate claims** between languages — find the equivalent in the other profile section or mark as a gap.

## Data Flow

```
/setup → profile/*.md (gitignored, real data)
/scrape → profile/search-queries.md → job_scraper/ (results)
/apply → profile/*.md → cv/main.tex + cover_letters/cover.tex → PDF + ATS check
```

Skill files (this directory) are committed templates with `[PLACEHOLDER]` tokens. Real data lives only in `profile/`.
