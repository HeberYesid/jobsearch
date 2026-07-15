#!/usr/bin/env python3
"""Lint the repo's skill, command, and config files.

Run from anywhere: python tools/lint_skills.py

Checks:
- Every SKILL.md (.opencode/skills/*) has YAML frontmatter that parses,
  with non-empty `name` and `description` keys
- Every .opencode/commands/*.md starts with YAML frontmatter
- opencode.json is valid JSON with a `permission` object

Exit code 0 on success, 1 with a failure list otherwise.
"""

import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("lint_skills.py requires PyYAML: pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def check_skill(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append(
            f"{rel(path)}: missing YAML frontmatter (file must start with ---)"
        )
        return
    end = text.find("\n---", 4)
    if end == -1:
        errors.append(f"{rel(path)}: unterminated YAML frontmatter")
        return
    try:
        data = yaml.safe_load(text[4:end])
    except yaml.YAMLError as exc:
        errors.append(f"{rel(path)}: frontmatter is not valid YAML: {exc}")
        return
    if not isinstance(data, dict):
        errors.append(f"{rel(path)}: frontmatter did not parse to a mapping")
        return
    for key in ("name", "description"):
        if not data.get(key):
            errors.append(f"{rel(path)}: frontmatter missing required key '{key}'")


def check_command(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append(
            f"{rel(path)}: command file must start with YAML frontmatter (---)"
        )


def check_config() -> None:
    path = ROOT / "opencode.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"opencode.json: {exc}")
        return
    if not isinstance(data.get("permission"), dict):
        errors.append("opencode.json: expected 'permission' to be an object")


def main() -> int:
    skills = sorted(ROOT.glob(".opencode/skills/*/SKILL.md"))
    commands = sorted(ROOT.glob(".opencode/commands/*.md"))
    if not skills:
        errors.append("no SKILL.md files found under .opencode/skills/")
    if not commands:
        errors.append("no command files found under .opencode/commands/")

    for skill in skills:
        check_skill(skill)
    for command in commands:
        check_command(command)
    check_config()

    if errors:
        print(f"lint_skills: {len(errors)} failure(s)")
        for err in errors:
            print(f"  - {err}")
        return 1
    print(
        f"lint_skills: OK ({len(skills)} skills, {len(commands)} commands, opencode.json)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
