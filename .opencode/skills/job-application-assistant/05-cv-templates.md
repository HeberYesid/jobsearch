# CV Tailoring Rules (moderncv)

This file defines how `/apply` tailors `cv/main_example.tex` for a specific posting.

## Template

Source template: `cv/main_example.tex` (moderncv, banking style, blue color).
Compile with: `lualatex cv/main.tex` (2 pages target).

## Tailoring Rules

### Section Selection
1. **Always include**: Contact info, Experience, Education, Skills, Languages.
2. **Conditional include**: Certifications (only if relevant to posting).
3. **Optional**: Profile summary (include if posting values executive summaries).
4. **Order**: Summary, Experience, Education, Skills, Languages, Certifications.

### Content Tailoring
1. **Job title** in `\title{}` MUST match the posting's title (or close equivalent).
2. **Profile summary** MUST reference the posting's key requirements (only if supported by profile — never fabricate).
3. **Experience descriptions** reordered to put most relevant role first.
4. **Skills section** reordered to match posting's priority order. Only include skills the candidate actually has.
5. **Keywords** from posting that match candidate's skills — naturally integrated into descriptions, not listed in a separate "keywords" section.

### Page Management (MVP)
- Target: 2 pages.
- If content exceeds 2 pages: trim oldest or least relevant experience entries first.
- Simple rule: cut from the bottom up (oldest first). Smart relevance-weighted cutting is tech debt (post-MVP).

### Placeholder Mapping
- `[FIRSTNAME]` / `[FAMILYNAME]` — from profile/candidate-profile.md
- `[JOB_TITLE]` — from posting (tailored per application)
- `[PHONE_NUMBER]`, `[EMAIL_ADDRESS]`, etc. — from profile/candidate-profile.md
- `[DATES_N]`, `[JOB_TITLE_N]`, `[COMPANY_N]`, `[DESCRIPTION_N]` — from profile, reordered for relevance
- `[SKILL_CATEGORY_N]`, `[SKILL_LIST_N]` — from profile, reordered for posting priority

## Rules
- Every `[PLACEHOLDER]` in the generated `cv/main.tex` MUST be replaced — no raw tokens in output.
- Claims MUST trace to profile/candidate-profile.md. Unsupported posting keywords — acknowledged gaps, NOT stuffed.
