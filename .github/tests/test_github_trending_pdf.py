"""Regression checks for independently published daily archives and PDF headers."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from select_github_trending_report import select_day
from build_github_trending_pdf import Report


class ReportDateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.archive = self.root / "archive"
        self.archive.mkdir()
        for day in ("2026-11-06", "2026-11-07"):
            (self.archive / f"{day}.md").write_text(f"# Report {day}\n")

    def test_stale_latest_does_not_select_yesterday(self):
        (self.root / "latest.md").write_text("# Report 2026-11-06\n")
        self.assertEqual(select_day(self.archive), "2026-11-07")

    def test_missing_latest_is_allowed(self):
        self.assertEqual(select_day(self.archive), "2026-11-07")

    def test_backfill_uses_requested_date(self):
        self.assertEqual(select_day(self.archive, "2026-11-06"), "2026-11-06")

    def test_missing_backfill_fails_instead_of_falling_back(self):
        with self.assertRaises(FileNotFoundError):
            select_day(self.archive, "2026-11-05")

    def test_invalid_dates_and_paths_are_rejected(self):
        for value in ("2026-11-31", "2026-2-01", "../2026-11-07", "2026-11-07; echo bad"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                select_day(self.archive, value)

    def test_empty_archive_fails(self):
        with tempfile.TemporaryDirectory() as empty:
            with self.assertRaises(FileNotFoundError):
                select_day(Path(empty))

    def test_non_date_files_are_ignored(self):
        (self.archive / "README.md").write_text("not a report")
        self.assertEqual(select_day(self.archive), "2026-11-07")

    def test_calendar_order_crosses_year_boundary(self):
        (self.archive / "2027-01-01.md").write_text("# New year")
        self.assertEqual(select_day(self.archive), "2027-01-01")

    def test_pdf_header_uses_report_day(self):
        for day in ("2026-11-06", "2026-11-07", "2027-01-01"):
            with self.subTest(day=day):
                pdf = Report(report_day=day)
                for method in ("set_font", "set_text_color", "cell", "ln"):
                    setattr(pdf, method, Mock())
                pdf.header()
                self.assertEqual(pdf.cell.call_args.args[2], f"GitHub 商业机会 · {day}")


if __name__ == "__main__":
    unittest.main()
