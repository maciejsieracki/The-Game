#!/usr/bin/env python3
"""Remove /t and /turę suffixes from player-visible strings in cityPanel.ts."""
import re
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src" / "ui" / "cityPanel.ts"
text = path.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

out: list[str] = []
for line in lines:
    stripped = line.lstrip()
    if stripped.startswith("import ") or stripped.startswith("} from "):
        out.append(line)
        continue
    if stripped.startswith("//"):
        out.append(line)
        continue
    if stripped.startswith("*") and not stripped.startswith("*/"):
        out.append(line)
        continue
    if stripped.startswith("/**"):
        out.append(line)
        continue

    s = line
    replacements = [
        ("label: '/t'", "label: ''"),
        ("Granice · +/t", "Granice · +"),
        ("patrz przyrost /t powyżej", "patrz przyrost powyżej"),
        ("Bilans plonów / turę", "Bilans plonów"),
        ("Utrzymanie/t =", "Utrzymanie ="),
        ("Pieniądz/t i Nauka/t", "Pieniądz i Nauka"),
        ("'Przyrost/t'", "'Przyrost'"),
        ("'Praca/t'", "'Praca'"),
        ("'Praca brutto/t'", "'Praca brutto'"),
        ("'Żywność brutto/t'", "'Żywność brutto'"),
        ("'Pieniądz miasta/t'", "'Pieniądz miasta'"),
        ("'Saldo puli/t'", "'Saldo puli'"),
        ("'Przyrost / turę'", "'Przyrost'"),
        ("'Odnowa / turę'", "'Odnowa'"),
        ("'→ armia / turę'", "'→ armia'"),
        ("'Armia / turę (miasto)'", "'Armia (miasto)'"),
        ("'Netto / turę'", "'Netto'"),
        ("'Szerzenie / turę'", "'Szerzenie'"),
        ("imperium / turę", "imperium"),
        ("miasta / turę", "miasta"),
        ("miasto / turę", "miasto"),
        ("max/turę", "max"),
        ("~5%/turę", "~5%"),
        ("(%/turę)", "(%)"),
        ("miasto/t", "miasto"),
        ("💰/turę", "💰"),
        ("🔨/t", "🔨"),
        ("💰/t", "💰"),
        (" + '/t'", ""),
        (' + "/t"', ""),
    ]
    for old, new in replacements:
        s = s.replace(old, new)

    s = re.sub(r"/turę", "", s)
    s = re.sub(r" / turę", "", s)
    s = re.sub(r"\}/t(?=[`\"'\),])", "}", s)
    s = re.sub(r"\}/turę(?=[`\"'\),])", "}", s)
    s = re.sub(r"(?<=[\w%\)\}])\/t(?=[`\"'\), \-—·])", "", s)
    s = re.sub(r"(?<=[\w%\)\}])\/t(?=`)", "", s)
    s = re.sub(r"signed\(praca\.total\) \+ ' \\u\{1F528\}/t'", "signed(praca.total) + ' \\u{1F528}'", s)

    out.append(s)

path.write_text("".join(out), encoding="utf-8")
print(f"Updated {path}")
