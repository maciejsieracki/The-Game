# Grupa D — inwentaryzacja panelu sterowania (PANEL)

**Data:** 2026-06-28 · **Spec:** `docs/obieg/PANEL-STEROWANIA-SPEC.md`

## Pliki panelu

| Plik | Rola |
|------|------|
| `panele-sterowania/Panel-D.xlsx` | **Hub balansu D** — generuj: `python panele-sterowania/gen-panel-d.py` |
| `panele-sterowania/export-d.py` | Eksport hub → `diplomacy.json` params + `ai-params.json` |
| `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | Bonusy 9×3 (kanon) → `export-bonusy-cyw.py` |
| `Cywilizacje.xlsx` | Roster, civ-ai, civ-params → `export-civ-*.py` |
| `Dyplomacja/Dyplomacja.xlsx` | Pełna dyplomacja (akcje, nacje) → `export-diplomacy.py` |

## Arkusze Panel-D.xlsx

| Arkusz | Parametrów (≈) | JSON docelowy |
|--------|----------------|---------------|
| `_INFO` | instrukcja | — |
| `Dyplomacja` | 38 | `diplomacy.json` → `params` |
| `AI-trudnosc` | 15 | `ai-params.json` |
| `AI-archetyp` | 18+ | `ai-params.json` |
| `AI-zachowanie` | 16 | `ai-params.json` (`ekspansja_*`, `dyplomacja_*`, `ai_wycofanie_*`) |
| `Barbarzyńcy` | 10 | `ai-params.json` (klucze `barbarzyncy_*`) |
| `Zwycięstwo` | 3 | **kod** `victory.ts` (v1.1 → JSON) |
| `_Eksporty` | mapa skryptów | — |

## Stałe w kodzie (do wyprowadzenia v1.1)

| Stała | Wartość | Plik |
|-------|---------|------|
| `PROG_DOMINACJI_POWER` | 0.5 | `victory.ts` |
| `OSTATNIA_EPOKA_GRY_V1` | 3 | `victory.ts` |
| `EPOKA_SREDNIOWIECZE_BARBARZY` | 4 | `barbarians.ts` |
| `ARCHETYPE_AGGRESSION` / `TRADE` | mapa | `diplomacy.ts` (Excel 5A → civ-ai) |

## Kroki 5 (spec §3) — status D

| # | Krok | Status |
|---|------|--------|
| 1 | Inwentaryzacja | ✅ ten plik |
| 2 | Budowa panelu | ✅ `gen-panel-d.py` + `Panel-D.xlsx` |
| 3 | Wpięcie export | ✅ `export-d.py` + `test-panel-d-roundtrip.py` OK |
| 4 | Przeniesienie zadań | ✅ `docs/ROADMAP.md` § Panele |
| 5 | Archiwizacja starych | ⬜ **PANEL-MERGE** — po meldunkach D-M* w trackerze |

## Osobne pliki Excel (DO SCALENIA — PANEL-MERGE)

> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` · **Dyspozycja:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` § Grupa D

| Temat | Excel | Skrypt dziś | Docelowo |
|-------|-------|-------------|----------|
| Bonusy 9×3 cywilizacji | `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | `export-bonusy-cyw.py` | arkusz `Bonusy-cywilizacji` w Panel-D |
| AI per nacja (agresja, handel) | `Cywilizacje.xlsx` | `export-civ-ai.py` | Panel-D |
| Parametry cyw (`modWzrostu`…) | `Cywilizacje.xlsx` | `export-civ-params.py` | Panel-D |
| Akcje dyplomatyczne (koszty) | `Dyplomacja/Dyplomacja.xlsx` | `export-diplomacy.py` | Panel-D |
| AI global | `Civ-AI/AI-parametry.xlsx` | `export-ai-params.py` | Panel-D AI-* |

**Cel merge:** `export-d.py` **bez** `--full`. Do tego czasu: **eksportuj panel pełny** = tymczasowe.

## Maciej — jak kręcić balans (hub Panel-D)

1. Otwórz `Panel-D.xlsx` → zmień **Wartość** (niebieska).
2. **Tymczasowo** (do PANEL-MERGE): bonusy / civ-ai → osobne Excele lub **eksportuj panel pełny**.
3. W czacie: **eksportuj panel** (hub) lub **eksportuj panel pełny** (legacy).
4. **Po PANEL-MERGE:** wyłącznie **eksportuj panel**.

**Nie dotyka kodu:** zmiana tylko w Excel + export — Integrator nie potrzebny, chyba że nowy parametr wymaga odczytu w `.ts` (handoff 🟡).
