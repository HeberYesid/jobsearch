## 1. Skill reference files (job-application-assistant)

- [x] 1.1 Create `.opencode/skills/job-application-assistant/SKILL.md` with frontmatter (name, description) and overview of the 7 reference files
- [x] 1.2 Create `01-candidate-profile.md` with CV structure template (experience, education, skills, certifications, languages) using `[PLACEHOLDER]` tokens for both ES and EN sections
- [x] 1.3 Create `02-behavioral-profile.md` with values, work style, culture preferences template using `[PLACEHOLDER]` tokens
- [x] 1.4 Create `03-writing-style.md` with tone/voice guidance for ES and EN cover letters and CV summaries
- [x] 1.5 Create `04-job-evaluation.md` with 7-dimension fit framework (skills, experience, culture, location, career alignment, modality, salary band) and deal-breaker rules
- [x] 1.6 Create `05-cv-templates.md` with moderncv tailoring rules (section selection, ordering, [PLACEHOLDER] mapping to cv/main_example.tex)
- [x] 1.7 Create `06-cover-letter-templates.md` with cover letter structure rules (opening, body, closing) and [PLACEHOLDER] mapping to cover_letters/cover_example.tex
- [x] 1.8 Create `07-language-detection.md` with posting language detection heuristics (keywords, script, locale indicators) and ES/EN profile section selection logic

## 2. /setup command

- [x] 2.1 Create `.opencode/commands/setup.md` with frontmatter (description, agent) and command body
- [x] 2.2 Implement Path A logic: scan `documents/` subfolders, read files, extract profile data
- [x] 2.3 Implement Path B logic: accept pasted CV text and extract profile data
- [x] 2.4 Implement Path C logic: guided interview questions for experience, education, skills, values, writing style
- [x] 2.5 Implement auto-detection: check `documents/` first, accept pasted CV, fall back to interview
- [x] 2.6 Implement bilingual generation: produce both ES and EN profile sections in a single pass from the same source materials
- [x] 2.7 Implement no-translation rule: find equivalent claims from source materials or mark as gap, never auto-translate
- [x] 2.8 Implement idempotency: detect existing `profile/` files, ask what to update, merge new info
- [x] 2.9 Implement gap detection: identify missing skills/experience and mark as "acknowledged gaps" in profile

## 3. Profile output structure

- [x] 3.1 Define `profile/candidate-profile.md` structure (ES section + EN section, experience, education, skills, certifications, languages)
- [x] 3.2 Define `profile/behavioral-profile.md` structure (values, work style, culture preferences)
- [x] 3.3 Define `profile/writing-style.md` structure (ES tone, EN tone, do/don't lists)
- [x] 3.4 Define `profile/job-evaluation.md` structure (7-dimension preferences, deal-breakers)
- [x] 3.5 Define `profile/cv-templates.md` structure (tailoring rules, section selection preferences)
- [x] 3.6 Define `profile/cover-letter-templates.md` structure (opening/body/closing patterns)
- [x] 3.7 Define `profile/search-queries.md` structure (keyword queries for Colombia + LatAm + remote)

## 4. Verification

- [x] 4.1 Verify all skill files contain only `[PLACEHOLDER]` tokens (no real personal data in committed files)
- [x] 4.2 Verify `profile/` is gitignored and `.gitkeep` files exist in `documents/` subfolders
- [x] 4.3 Verify `/setup` command references correct paths (skill files, profile/ files, documents/ folder)
- [x] 4.4 Verify `04-job-evaluation.md` includes all 7 dimensions (skills, experience, culture, location, career alignment, modality, salary band)
- [x] 4.5 Verify `07-language-detection.md` covers ES/EN detection and profile section mapping
- [x] 4.6 Run `openspec validate candidate-profile` to confirm spec validity
