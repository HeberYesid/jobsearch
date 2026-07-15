# Cover Letter Tailoring Rules

This file defines how `/apply` tailors `cover_letters/cover_example.tex` for a specific posting.

## Template

Source template: `cover_letters/cover_example.tex` (custom `cover.cls`).
Compile with: `xelatex cover_letters/cover.tex` (1 page target).

## Structure

### Metadata (cover.cls commands)
- `\covername{}` — candidate's full name (from profile)
- `\coveraddress{}` — candidate's city, country (from profile)
- `\coverphone{}`, `\coveremail{}`, `\coverlink{}` — contact info (from profile)
- `\recipientname{}` — hiring manager name (from posting, or "Hiring Manager" if unknown)
- `\recipientcompany{}` — company name (from posting)
- `\recipientaddress{}` — company location (from posting)
- `\coverdate{}` — current date
- `\coversubject{}` — job title from posting

### Body Structure
1. **[GREETING]**: "Dear [Hiring Manager Name]" or "Dear Hiring Team" (ES: "Estimado equipo de seleccion").
2. **[OPENING_PARAGRAPH]**: State the role applying for, brief hook referencing company mission or recent work.
3. **[BODY_PARAGRAPH_1]**: Most relevant experience — connect a specific achievement to a posting requirement.
4. **[BODY_PARAGRAPH_2]**: Second most relevant experience or skill alignment. Address a posting pain point.
5. **[CLOSING_PARAGRAPH]**: Express enthusiasm, reference culture fit, call to action (interview request).
6. **[CLOSING]**: "Sincerely, [Name]" (ES: "Atentamente, [Name]").

## Tailoring Rules

1. **Language**: Detect posting language, generate in that language from matching profile section.
2. **Tone**: Follow profile/writing-style.md for the detected language.
3. **Company research**: The reviewer subagent researches the company; incorporate specific references (not generic fluff).
4. **No fabrication**: Every claim MUST trace to profile. Unsupported requirements — mention transferable skills or acknowledge as a growth area.
5. **Length**: 1 page target. If exceeding, trim body paragraphs (keep opening + closing).
6. **ATS-friendly**: Avoid headers/footers with critical info. Use standard fonts. Contact info in the cover.cls header block.

## Placeholder Mapping
- All `[PLACEHOLDER_*]` tokens in `cover_example.tex` — replaced with tailored content.
- No raw tokens in the generated `cover.tex`.
