# Archiwum — stare panele Excel (legacy)

> **Status:** 📦 **ZARCHIWIZOWANE** (2026-06-30) — 16 plików przeniesionych z root projektu.  
> **Manifest:** [`MANIFEST.md`](MANIFEST.md)

## Kanon od 2026-06-30

Wyłącznie:

| Grupa | Panel | Eksport |
|-------|-------|---------|
| A–E | `panele-sterowania/Panel-{A..E}.xlsx` | `export-{a..e}.py` |

Maciej w czacie grupy: **eksportuj panel**.

## Skrypty legacy

`gra/tools/DEPRECATED-EXPORTS.md` — lista skryptów oznaczonych DEPRECATED (czytają z tego folderu jako fallback awaryjny).

## Mapa migracji

| Stary plik (w tym archiwum) | Zastąpiony przez |
|-----------------------------|------------------|
| `MIASTO/Ulepszenia-terenu.xlsx` | `Panel-A.xlsx` |
| `Plony-terenow.xlsx` | `Panel-A.xlsx` |
| `Ekonomia-parametry.xlsx` | `Panel-B.xlsx` |
| `MIASTO/Spoleczenstwo-parametry.xlsx` | `Panel-B.xlsx` |
| `MIASTO/Budynki.xlsx` | `Panel-B.xlsx` → `Budynki` |
| `MIASTO/Panel-przeglad-danych.xlsx` | `Panel-B.xlsx` |
| `Surowce.xlsx` | `Panel-B.xlsx` → `Surowce` |
| `Technologie-drzewko.xlsx` | `Panel-B.xlsx` → `Technologie` |
| `Jednostki.xlsx` | `Panel-C.xlsx` |
| `Macierz-walki.xlsx` | `Panel-C.xlsx` |
| `Cywilizacje.xlsx` | `Panel-D.xlsx` |
| `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | `Panel-D.xlsx` |
| `Dyplomacja/Dyplomacja.xlsx` | `Panel-D.xlsx` |
| `Civ-AI/AI-parametry.xlsx` | `Panel-D.xlsx` |
| `UI/UI-parametry.xlsx` | `Panel-E.xlsx` |
| `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` | widok pomocniczy (regeneruj: `gen-bonusy-cyw-xlsx.py`) |

Pełna orchestracja: `docs/obieg/PANEL-MERGE-ORCHESTRACJA.md`.
