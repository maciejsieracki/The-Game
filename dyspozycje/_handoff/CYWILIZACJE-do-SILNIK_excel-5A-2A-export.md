# CYWILIZACJE → SILNIK: Excel 5A + 2A — dane w JSON (2026-06-27)

**Flaga:** **→ SILNIK: INFO** (brak wymaganego wpiecia main.ts — loader już importuje)

---

## Co przesłano

| JSON | Źródło Excel | Skrypt re-export |
|------|--------------|------------------|
| `gra/data/civs.json` bonusy[] | `Panel-efekty-cyw-dyplomacja.xlsx` | `python tools/export-bonusy-cyw.py` |
| `gra/data/civ-ai.json` | `Cywilizacje.xlsx` → AI-zachowanie | `python tools/export-civ-ai.py` |
| `gra/data/civ-params.json` | `Cywilizacje.xlsx` → Parametry-cyw | `python tools/export-civ-params.py` |
| `gra/data/diplomacy.json` perNacja | `Cywilizacje.xlsx` → Dyplomacja | `python tools/export-civ-dyplomacy-nations.py` |

**Loader:** `gra/src/data/loader.ts` — `data.civAi`, `data.civParams`  
**Helper:** `gra/src/game/civ-ai-data.ts` — `civAiAggressionNorm`, `isKopiaTypuObronna`

---

## Opcjonalne wpiecie (P2) — **DONE 2026-06-27 (lane CYW)**

- `diplomacy.ts`: `aiDiplomacyStance` + `initialRelation` czytają `civ-ai.json` / `perNacja` przez `civ-ai-data.ts`.
- **SILNIK (1 linia):** `main.ts` `DiplomacjaInputs` — użyć `resolveArchetypeAggression` / `resolveArchetypeTrade` (patrz `…-do-SILNIK_delegacje-poza-lane-D.md` §7).

**DoD:** diplomacy-test 135/135 ✅ · build + ai-test w bramce Silnika.

---

## Maciej — strojenie balansu

1. Edytuj komórki w Excelu (zamknij plik przed skryptem).
2. Z katalogu `gra/`: uruchom odpowiedni `export-*.py`.
3. Build kanonu — MASTER.

**Seed początkowy:** `python tools/seed-cywilizacje-excel.py` (tylko gdy arkusze puste).
