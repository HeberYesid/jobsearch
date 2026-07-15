# documents/ — Source Materials for /setup

Place your source documents here. `/setup` Path A reads this folder to build your profile automatically.

## Layout

```
documents/
├── cv/            ← your current CV(s) — any format (.pdf, .tex, .md, .docx)
├── linkedin/      ← exported LinkedIn profile (PDF or text)
├── diplomas/      ← degrees, certificates, transcripts
├── references/    ← reference letters, contact info
└── applications/  ← past applications, cover letters, job descriptions you kept
```

## Usage

1. Drop files into the relevant subfolders.
2. Run `/setup`.
3. The assistant reads everything, extracts your profile, and writes it to `profile/` (gitignored).

## Privacy

**Everything in this folder is gitignored.** Your personal documents never get committed. Only `documents/README.md` (this file) is tracked.
