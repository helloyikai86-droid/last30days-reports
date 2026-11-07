#!/usr/bin/env python3
"""Select a real dated archive without depending on the separately updated latest.md."""
from __future__ import annotations

from datetime import date
from pathlib import Path
import re
import sys


def validate_day(value: str) -> str:
    if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value):
        raise ValueError("Report date must use YYYY-MM-DD")
    date.fromisoformat(value)
    return value


def select_day(archive: Path, requested: str = "") -> str:
    if requested:
        day = validate_day(requested)
        if not (archive / f"{day}.md").is_file():
            raise FileNotFoundError(f"Missing dated archive: {day}.md")
        return day
    days = sorted(
        validate_day(path.stem)
        for path in archive.glob("20??-??-??.md")
        if path.is_file()
    )
    if not days:
        raise FileNotFoundError("No dated Markdown archives found")
    return days[-1]


if __name__ == "__main__":
    try:
        print(select_day(Path("github-trending/archive"), sys.argv[1] if len(sys.argv) > 1 else ""))
    except (ValueError, FileNotFoundError) as exc:
        sys.exit(str(exc))
