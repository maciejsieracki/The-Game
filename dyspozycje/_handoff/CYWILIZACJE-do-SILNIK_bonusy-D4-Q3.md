# HANDOFF CYWILIZACJE → SILNIK (Grupa F): Bonusy D4-Q3 — test suite ZIELONY

**Data:** 2026-06-27  
**Od:** CYWILIZACJE (Grupa D)  
**Do:** SILNIK (Grupa F)  
**Flaga:** **→ SILNIK: GOTOWE**  
**Decyzja:** D4-Q3=A (bonusy z `bonusy[]`, pełna forma v1.0 w toku — P1-02 = rdzeń testów)

---

## Co przesyłam

| Moduł | Plik | API |
|-------|------|-----|
| Walka | `gra/src/game/civ-bonuses.ts` | `civCombatStatMultipliers`, `unitCombatCategory`, `applyMultiplier`, `civBuildingCostDiscount`, `buildingCostAfterCivDiscount` |
| Ekonomia | `gra/src/game/economy.ts` | `civBonusyForCivKey`, `civEconomyYieldMultipliers`, ctx `civHandelMult` / `civNaukaMult` w `cityYieldPerTurn` |
| Produkcja | `gra/src/game/production.ts` | `civRecruitmentDiscount`, `unitPurchaseCost(..., bonusy)` |
| Walka integracja | `gra/src/game/combat.ts` | import z `civ-bonuses.ts` (już podpięte) |
| Tura | `gra/src/game/turn-economy.ts` | `civEconomyYieldMultipliers` → ctx miasta (już podpięte) |
| Dane | `gra/data/civs.json` | `bonusy[]` per nacja (bez zmian w P1-02) |

**Test regresji:** `node tools/civ-bonusy-test.cjs` → **30/30 PASS**

---

## Co Odbiorca (F) ma zrobić

1. **Bramka:** uruchomić `civ-bonusy-test.cjs` w suite przed ROBOCZA (oczekiwane 30/0).
2. **Weryfikacja wpięcia `main.ts`:** bonusy walki przekazywane jako `attackerCivBonusy` / `defenderCivBonusy` — już obecne; brak nowego patcha w P1-02.
3. **NIE** edytować `civ-bonuses.ts` / `civs.json` bez nowego handoffu od CYWILIZACJE.

---

## DoD (P1-02)

- [x] `civ-bonusy-test.cjs`: sekcje A–F **30/30 PASS**
- [x] Celtowie szarża: `atk +25%`, `uderzenie +15%` (osobno, nie sumowane do jednego statu)
- [x] Grecy handel / Inkowie nauka / Zulusi rekrutacja / Rzymianie budynki — PASS
- [ ] UNITS bitwa 3D (CYW-P1-03 / osobny handoff) — poza zakresem P1-02

---

## Naprawione regresje (referencja)

1. Fixture testu Grecy: `terenBazowy` w `WorkedTile` (handel z równin = 1/heks).
2. Celtowie: routing `applyWalkBonus` — słowo „ataku” w opisie szarży ma pierwszeństwo przed „pierwszym uderzeniu” (narracja, nie stat Uderzenie).

*— CYWILIZACJE, CYW-P1-02, 2026-06-27*
