# Candidate Profile Structure

This file defines the structure of `profile/candidate-profile.md`. The `/setup` command generates this file from the user's source materials. Both ES and EN sections are populated in a single pass.

## Structure

```
## Spanish (ES)

### Resumen
[PLACEHOLDER_ES_SUMMARY]

### Experiencia Profesional
[PLACEHOLDER_ES_EXPERIENCE_1]
- Puesto: [PLACEHOLDER_JOB_TITLE]
- Empresa: [PLACEHOLDER_COMPANY]
- Fechas: [PLACEHOLDER_DATES]
- Ubicacion: [PLACEHOLDER_LOCATION]
- Descripcion: [PLACEHOLDER_ES_DESCRIPTION]

### Educacion
[PLACEHOLDER_ES_EDUCATION]

### Habilidades
[PLACEHOLDER_ES_SKILLS]

### Certificaciones
[PLACEHOLDER_ES_CERTIFICATIONS]

### Idiomas
[PLACEHOLDER_ES_LANGUAGES]

## English (EN)

### Summary
[PLACEHOLDER_EN_SUMMARY]

### Professional Experience
[PLACEHOLDER_EN_EXPERIENCE_1]
- Title: [PLACEHOLDER_JOB_TITLE]
- Company: [PLACEHOLDER_COMPANY]
- Dates: [PLACEHOLDER_DATES]
- Location: [PLACEHOLDER_LOCATION]
- Description: [PLACEHOLDER_EN_DESCRIPTION]

### Education
[PLACEHOLDER_EN_EDUCATION]

### Skills
[PLACEHOLDER_EN_SKILLS]

### Certifications
[PLACEHOLDER_EN_CERTIFICATIONS]

### Languages
[PLACEHOLDER_EN_LANGUAGES]

## Acknowledged Gaps
[PLACEHOLDER_GAPS] — skills/experience the candidate lacks, explicitly marked. Never fabricated.
```

## Rules

- Both ES and EN sections MUST be populated from the same source materials.
- Claims MUST NOT be translated between sections. Find the equivalent or mark as a gap.
- Each experience entry should include: title, company, dates, location, description.
- Skills should be grouped by category (e.g., Languages, Frameworks, Tools, Cloud, Soft skills).
- Acknowledged gaps section lists skills/experience the candidate doesn't have — these are NOT included in CV drafts unless explicitly addressed.
