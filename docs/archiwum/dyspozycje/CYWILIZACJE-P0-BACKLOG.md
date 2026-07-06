# CYWILIZACJE — P0 Backlog (2026-06-27)

**Od Macieja:** wszystkie pozycje „częściowe” i „tylko handoff” → zadania wykonawcze.  
**Status ogólny:** patrz tabela poniżej.

---

## Tabela wykonawcza

| ID | Decyzja | Wykonawca | Status | Następny krok |
|----|---------|-----------|--------|---------------|
| **P0-1** | Fix 4 FAIL bonusów | **CYW** | **GOTOWE** | `civ-bonusy-test` 30/30 PASS |
| **P0-2** | Modal wojny D3-Q1=A | **UI** → **SILNIK** | **UI GOTOWE** | SILNIK batch D-P0-1 |
| **P0-3** | Panel dyplomacji 4B | **UI** → **SILNIK** | **UI GOTOWE** | SILNIK batch D-P0-1 |
| **P0-4** | Drzewko filtr epoki D1-Q1 | **UI** → **SILNIK** | **UI GOTOWE** | SILNIK batch D-P0-2 |
| **P0-5** | Bonusy w kreatorze (D4-Q3 UI) | **UI** | **GOTOWE** | — |
| **P0-6** | Bonusy bitwa 3D (D4-Q3) | **UNITS** | **GOTOWE** | SILNIK: przekaż bonusy do BattleScene/ManualBattle |
| **P0-7** | preBattle bonusy | **UI** | **CZEKA** | `UI.md` § P0-D4 |
| **P0-8** | Jednostki spec. produkcja | **UNITS** | **GOTOWE** | `production.ts` — bez main.ts |
| **P0-9** | E1 roster | **SILNIK** | **GOTOWE** | wpięte w main.ts |
| **P0-10** | Religie 9/9 gameplay | **CYW**+SILNIK | **JSON OK** | po v1.0 (bonusy religii) |
| **P0-11** | AI arkusze 5A | **CYW** | **GOTOWE** | `civ-ai.json` + `civ-params.json` + export scripts |
| **P0-12** | Porządki 4C | **CYW** | **GOTOWE** | lock/PROPOZYCJA usunięte lub niedostępne na dysku |
| **P0-13** | Bonusy Excel 2A | **CYW** | **GOTOWE** | `export-bonusy-cyw.py` → civs.json |

---

## Handoff hub Silnika

**START:** `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_F-GRUPA-D-P0-integracja.md`

---

## CYW — pozostałe (bez Silnika)

1. ~~**P0-11:** wypełnić arkusze AI~~ → **DONE** (seed + export 2026-06-27). Maciej stroi w Excelu → re-export.
2. Meldunek: append `CYWILIZACJE-DO-MASTERA.md` po każdym batchu.
