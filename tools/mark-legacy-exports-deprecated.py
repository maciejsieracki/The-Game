#!/usr/bin/env python3
"""Jednorazowo: DEPRECATED + ścieżki archiwum w gra/tools/export-*.py (PANEL-MERGE)."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEP_HASH = "# DEPRECATED (2026-06-30 — PANEL-MERGE): Excel w docs/archiwum/panele-legacy/.\n# Kanon: panele-sterowania/Panel-{A..E}.xlsx + export-{a..e}.py — nie używać do nowych zmian.\n"
DEP_DOC = (
    "DEPRECATED (2026-06-30 — PANEL-MERGE):\n"
    "  Excel: docs/archiwum/panele-legacy/\n"
    "  Kanon: panele-sterowania/Panel-{A..E}.xlsx + export-{a..e}.py\n"
    "  Nie używać do nowych zmian balansu.\n\n"
)

DOCSTRING_FILES = [
    "gra/tools/export-bonusy-cyw.py",
    "gra/tools/export-civ-ai.py",
    "gra/tools/export-civ-params.py",
    "gra/tools/export-civs.py",
    "gra/tools/export-civ-dyplomacy-nations.py",
    "gra/tools/export-diplomacy.py",
    "gra/tools/export-tech.py",
    "gra/tools/export-data.py",
]

HASH_FILES = [
    "gra/tools/export-ulepszenia.py",
    "gra/tools/export-panel.py",
    "gra/tools/export-ai-params.py",
]

PATH_FIXES = [
    (
        "gra/tools/export-bonusy-cyw.py",
        'HERE, "..", "..", "Civ-CYWILIZACJE", "Panel-efekty-cyw-dyplomacja.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", '
        '"Civ-CYWILIZACJE", "Panel-efekty-cyw-dyplomacja.xlsx"',
    ),
    (
        "gra/tools/export-civ-ai.py",
        'HERE, "..", "..", "Cywilizacje.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", "Cywilizacje.xlsx"',
    ),
    (
        "gra/tools/export-civ-params.py",
        'HERE, "..", "..", "Cywilizacje.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", "Cywilizacje.xlsx"',
    ),
    (
        "gra/tools/export-civs.py",
        'HERE, "..", "..", "Cywilizacje.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", "Cywilizacje.xlsx"',
    ),
    (
        "gra/tools/export-civ-dyplomacy-nations.py",
        'HERE, "..", "..", "Cywilizacje.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", "Cywilizacje.xlsx"',
    ),
    (
        "gra/tools/export-tech.py",
        'HERE, "..", "..", "Technologie-drzewko.xlsx"',
        'HERE, "..", "..", "docs", "archiwum", "panele-legacy", "Technologie-drzewko.xlsx"',
    ),
    (
        "gra/tools/export-diplomacy.py",
        '"..", "..", "Dyplomacja", "Dyplomacja.xlsx"',
        '"..", "..", "docs", "archiwum", "panele-legacy", "Dyplomacja", "Dyplomacja.xlsx"',
    ),
    (
        "gra/tools/export-diplomacy.py",
        '"..", "..", "Dyplomacja.xlsx"',
        '"..", "..", "docs", "archiwum", "panele-legacy", "Dyplomacja", "Dyplomacja.xlsx"',
    ),
    (
        "gra/tools/export-ulepszenia.py",
        '"..", "..", "MIASTO", "Ulepszenia-terenu.xlsx"',
        '"..", "..", "docs", "archiwum", "panele-legacy", "MIASTO", "Ulepszenia-terenu.xlsx"',
    ),
    (
        "gra/tools/export-panel.py",
        '"MIASTO", "Panel-przeglad-danych.xlsx"',
        '"docs", "archiwum", "panele-legacy", "MIASTO", "Panel-przeglad-danych.xlsx"',
    ),
    (
        "gra/tools/export-ai-params.py",
        '"Civ-AI", "AI-parametry.xlsx"',
        '"docs", "archiwum", "panele-legacy", "Civ-AI", "AI-parametry.xlsx"',
    ),
]


def mark_deprecated(path: pathlib.Path, mode: str):
    t = path.read_text(encoding="utf-8")
    if "DEPRECATED (2026-06-30" in t:
        return False
    if mode == "doc":
        needle = '#!/usr/bin/env python3\n"""'
        if needle not in t:
            return False
        t = t.replace(needle, '#!/usr/bin/env python3\n"""' + DEP_DOC, 1)
    else:
        needle = "#!/usr/bin/env python3\n"
        if not t.startswith(needle):
            return False
        t = t.replace(needle, needle + DEP_HASH, 1)
    path.write_text(t, encoding="utf-8")
    return True


def main():
    for rel in DOCSTRING_FILES:
        p = ROOT / rel
        if p.exists() and mark_deprecated(p, "doc"):
            print("deprecated doc:", rel)
    for rel in HASH_FILES:
        p = ROOT / rel
        if p.exists() and mark_deprecated(p, "hash"):
            print("deprecated hash:", rel)
    for rel, old, new in PATH_FIXES:
        p = ROOT / rel
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8")
        if old in t:
            p.write_text(t.replace(old, new), encoding="utf-8")
            print("path fix:", rel)


if __name__ == "__main__":
    main()
