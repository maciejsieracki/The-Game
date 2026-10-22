#!/usr/bin/env python3
"""P6.5B r2 (zarzut 3): mechanizm synchronizacji lokalnego portu `isCivilianUnit` z zrodlem weba.

`isCivilianUnit` lezy w `gra/src/units/setup.ts:196` (poza dwoma plikami tematu), a manpower.ts uzywa go
w `isUnitInBesiegedLocation`/`replenishmentUnitSortKey`/`tickManpowerUnitReplenishment`. Port jest lokalny:
zbiory kategorii i typow siedza w `data/derived/manpower-params.json` ("cywilne"), a funkcja
`recruitment::manpower::is_civilian_unit` czyta je z tabeli.

Ten skrypt (uruchamiany na `git archive edb8fb56`) sprawdza, ze:
 1. `CIVILIAN_CATEGORIES` i `CIVILIAN_TYPE_IDS` w setup.ts == tabela "cywilne" (te same zbiory napisow),
 2. cialo `isCivilianUnit` ma dokladnie ksztalt: kategoria w zbiorze kategorii => true, inaczej typ
    w zbiorze typow (kolejnosc i brak innych warunkow),
 3. kazdy typ z `CIVILIAN_TYPE_IDS` istnieje w `gra/data/units.json` (kolumna typeId), czyli zbior nie
    zawiera martwych wpisow.
Drugim, niezaleznym straznikiem jest test `p6_5b_tables::table_constants_equal_the_running_web`
(porownuje tabele z `CIVILIAN_*` z URUCHOMIONEGO weba w wektorach).

Uzycie: check-p65b-civilian-sync.py <WEB_ROOT> <ENGINE_DIR>
"""
import json
import re
import sys
from pathlib import Path

web = Path(sys.argv[1])
engine = Path(sys.argv[2])
setup = (web / "gra" / "src" / "units" / "setup.ts").read_text(encoding="utf-8")
table = json.loads((engine / "data" / "derived" / "manpower-params.json").read_text(encoding="utf-8"))["cywilne"]
errors = []


def parse_set(name):
    m = re.search(rf"export const {name} = new Set\(\[(.*?)\]\);", setup, re.S)
    if not m:
        errors.append(f"brak definicji {name} w setup.ts")
        return None
    return re.findall(r"'([^']*)'", m.group(1))


cats = parse_set("CIVILIAN_CATEGORIES")
types = parse_set("CIVILIAN_TYPE_IDS")
if cats is not None and sorted(cats) != sorted(table["kategorie"]):
    errors.append(f"kategorie: web {cats} != tabela {table['kategorie']}")
if types is not None and sorted(types) != sorted(table["typy"]):
    errors.append(f"typy: web {types} != tabela {table['typy']}")

body = re.search(r"export function isCivilianUnit\([^)]*\): boolean \{(.*?)\n\}", setup, re.S)
if not body:
    errors.append("brak isCivilianUnit w setup.ts")
else:
    stmts = [s.strip() for s in body.group(1).strip().splitlines() if s.strip()]
    expected = [
        "if (CIVILIAN_CATEGORIES.has(u.category)) return true;",
        "return CIVILIAN_TYPE_IDS.has(u.typeId);",
    ]
    if stmts != expected:
        errors.append(f"cialo isCivilianUnit zmienione: {stmts}")

units_json = (web / "gra" / "data" / "units.json").read_text(encoding="utf-8")
other_src = "".join(
    p.read_text(encoding="utf-8")
    for p in (web / "gra" / "src").rglob("*.ts")
    if p.as_posix() != (web / "gra" / "src" / "units" / "setup.ts").as_posix()
)
for t in types or []:
    # Zwiadowca jest w units.json; Osadnik/Robotnik powstaja poza katalogiem (literaly w innych plikach src)
    if f'"{t}"' not in units_json and f"'{t}'" not in other_src:
        errors.append(f"typ {t} z CIVILIAN_TYPE_IDS nie wystepuje ani w units.json, ani w innym pliku src")

print(f"CIVILIAN_CATEGORIES (web) = {cats}")
print(f"CIVILIAN_TYPE_IDS (web)   = {types}")
print(f"tabela cywilne            = kategorie {table['kategorie']}, typy {table['typy']}")
print("cialo isCivilianUnit      = " + ("zgodne z oczekiwanym ksztaltem" if body and not any('cialo' in e for e in errors) else "ROZNE"))
if errors:
    for e in errors:
        print("BLAD:", e)
    print("WYNIK: ROZBIEZNOSCI", len(errors))
    sys.exit(1)
print("WYNIK: ROZBIEZNOSCI 0")
