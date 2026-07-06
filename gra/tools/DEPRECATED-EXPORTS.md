# DEPRECATED — skrypty eksportu legacy

**Data:** 2026-06-30 · **PANEL-MERGE**

Stare skrypty w `gra/tools/export-*.py` (poza wywołaniami z `panele-sterowania/`) są **przestarzałe**.

## Kanon (używaj tego)

| Grupa | Panel | Eksport |
|-------|-------|---------|
| A | `panele-sterowania/Panel-A.xlsx` | `export-a.py` |
| B | `panele-sterowania/Panel-B.xlsx` | `export-b.py` |
| C | `panele-sterowania/Panel-C.xlsx` | `export-c.py` |
| D | `panele-sterowania/Panel-D.xlsx` | `export-d.py` |
| E | `panele-sterowania/Panel-E.xlsx` | `export-e.py` |

Maciej w czacie grupy: **eksportuj panel**.

## Lista deprecated

| Skrypt | Było | Archiwum Excel |
|--------|------|----------------|
| `export-ulepszenia.py` | MIASTO/Ulepszenia-terenu | `docs/archiwum/panele-legacy/` |
| `export-panel.py` | Panel-przeglad-danych | j.w. |
| `export-tech.py` | Technologie-drzewko | j.w. |
| `export-bonusy-cyw.py` | Panel-efekty-cyw-dyplomacja | j.w. |
| `export-civs.py` | Cywilizacje.xlsx | j.w. |
| `export-civ-ai.py` | Cywilizacje.xlsx | j.w. |
| `export-civ-params.py` | Cywilizacje.xlsx | j.w. |
| `export-civ-dyplomacy-nations.py` | Cywilizacje.xlsx | j.w. |
| `export-diplomacy.py` | Dyplomacja.xlsx | j.w. |
| `export-ai-params.py` | AI-parametry.xlsx | j.w. |
| `export-data.py` | **wszystkie** (NIEBEZPIECZNY) | — |

Skrypty pozostają w repo **tylko jako fallback awaryjny** (czytają z `docs/archiwum/panele-legacy/`).

**NIGDY** nie uruchamiaj `export-data.py` — nadpisuje wiele JSON naraz.
