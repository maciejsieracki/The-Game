# Pliki — kandydaci do archiwum / usunięcia

**Status:** PROPOZYCJA — **decyzja należy do Macieja** (nie usuwać bez potwierdzenia).

Data: 2026-06-26 · kontekst: audyt Grupa D, porządki w `Civ-CYWILIZACJE/`

---

## Usuń bezpiecznie (śmieci sesji)

| Plik | Powód |
|------|-------|
| `Civ-CYWILIZACJE/.~lock.Panel-CYWILIZACJE.xlsx#` | Lock LibreOffice/Excel — plik tymczasowy |

---

## Przenieś do `_archiwum/` (historyczne, nie kasować)

| Plik | Powód | Zamiennik |
|------|-------|-----------|
| `PROPOZYCJA-dyplomacja-AI-v0.1.md` | Wczesna propozycja przed T1–T4 | `SPEC-Respekt.md` + `diplomacy.ts` + `D3-dyplomacja.md` |
| `Civ-DANE/DOKUMENTACJA-DANE-cywilizacje.md` | Lane DANE scalony → CYWILIZACJE | `DOKUMENTACJA-DEV-CYWILIZACJE.md` |
| `dyspozycje/_scalone/DANE/*` | Scalone 2026-06-26 | `dyspozycje/CYWILIZACJE.md` |
| `dyspozycje/_scalone/AI/*` | j.w. | j.w. |
| `dyspozycje/_scalone/DYPLOMACJA/*` | j.w. | j.w. |

---

## Zachować, ale nie traktować jako kanon (regenerowalne)

| Plik | Uwaga |
|------|-------|
| `Bonusy-cywilizacji-9x3.xlsx` | Zawsze można wygenerować: `python3 gra/tools/gen-bonusy-cyw-xlsx.py` |
| Kopie w `_generowane/` | Tylko gdy główny Excel zablokowany |

---

## NIE usuwać

| Plik | Powód |
|------|-------|
| `Panel-efekty-cyw-dyplomacja.xlsx` | **Kanon review bonusów** |
| `Panel-CYWILIZACJE.xlsx` | Dashboard — brak generatora w repo |
| `Cywilizacje.xlsx`, `Technologie-drzewko.xlsx` (root) | Ścieżki w `export-*.py` |
| `Dyplomacja/Dyplomacja.xlsx`, `Civ-AI/AI-parametry.xlsx` | Pipeline lane D |
| `gra/tools/export-data.py` | Oznaczyć DEPRECATED — nie uruchamiać |

---

## Duplikaty do scalenia (opcjonalnie)

| Duplikat | Kanon |
|----------|-------|
| Opis bonusów w `Bonusy-cywilizacji-9x3.xlsx` | `Panel-efekty-cyw-dyplomacja.xlsx` |
| Stary wpis D4-Q1 „BLOK Excel” w `CYWILIZACJE-DO-MASTERA.md` | Superseded przez D4-RDY01 |

---

## Po decyzji Macieja

- [x] Usunąć lock file (2026-06-27)
- [x] Przenieść PROPOZYCJA do `_archiwum/` (2026-06-27)
- [x] Dodać wpis w `DZIENNIK-MASTERA.md`: ARCHIWUM porządki Gr-D (2026-06-27)

*— Grupa D, 2026-06-26*
