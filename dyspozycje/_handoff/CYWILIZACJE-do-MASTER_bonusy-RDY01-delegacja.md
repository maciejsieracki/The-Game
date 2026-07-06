# HANDOFF CYWILIZACJE → MASTER: Bonusy cywilizacji RDY-01 — delegacja do lane'ów

**Data:** 2026-06-26  
**Od:** Grupa D / CYWILIZACJE (czat tematyczny)  
**Do:** MASTER (Master Silnik) — **rozdać dyspozycje**, nie implementować logiki bonusów w `main.ts` poza wiązaniem ownerId→bonusy  
**Decyzje Macieja:** D4 T3=A (schemat `bonusy[]`); D4-Q1 Excel najpierw → **korekta 2026-06-26:** „wdrażaj efekty, Excel poprawię później — napiszę gdy zmienię”

**Status paczki:** **GOTOWE** — Master rozsyla do UNITS / EKONOMIA / UI / SILNIK

---

## 1. Model (jedna strona)

Cywilizacja = **paczka parametrów** w `gra/data/civs.json` → pole `bonusy[]` (27 wpisów, 9 nacji × 3).

Każdy wpis:

| Pole | Znaczenie |
|------|-----------|
| `typ` | `bonus_walka`, `bonus_obrona`, `bonus_zloto`, `bonus_nauka`, `koszt_redukcja`, `jednostka_specjalna` |
| `cel` | `piechota`, `lukownicy`, `kawaleria`, `rydwany`, `handel`, `budynki`, … |
| `wartosc` | liczba (0.2 = +20%) lub string (nazwa jedn. spec.) |
| `realizuje` | **`walka`** / **`miasto`** / **`ekonomia`** — **routing lane'a** |
| `opis` | tekst UI / warunki (np. las, szarża) |

Przepływ runtime:

```
Excel (Panel-efekty) → export-bonusy-cyw.py → civs.json
Start gry → player.civBonusy[] (+ AI: civKey z aiOwnerCivMap)
Każdy system czyta bonusy przez helpery → mnożnik na istniejące parametry
```

**Excel kanon review:** `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` → arkusz „Bonusy cywilizacji”  
**Przegląd całości lane CYW:** `Panel-CYWILIZACJE.xlsx` (pogląd, nie źródło eksportu)  
**Mnożnik handlu:** `Cywilizacje.xlsx` → `export-civs.py` (osobno, już jest)

---

## 2. Mapowanie lane → odpowiedzialność

| Lane | `realizuje` / temat | Pliki | Status 2026-06-26 |
|------|---------------------|-------|-------------------|
| **CYWILIZACJE** | dane, Excel, eksport, kontrakt | `civs.json`, `export-bonusy-cyw.py` (TODO), `civ-bonuses.ts` | eksport **TODO**; kontrakt **GOTOWY** |
| **EKONOMIA** | ekonomia + miasto | `economy.ts`, `turn-economy.ts`, `production.ts` | **GOTOWE** (handel, nauka, rekrutacja, budynki) |
| **UNITS** | walka + jednostki spec. + bitwa 3D | `combat.ts`, `battleScene.ts`, `manualBattle.ts`, `units.json`, `production.ts` (filtr spec.) | auto-resolve **częściowo**; bitwa 3D + spec. **TODO** |
| **SILNIK** | integracja tylko | `main.ts` | `civBonusyForOwnerId` + resolveCombat **częściowo**; reszta wiązań **TODO** |
| **UI** | wyświetlanie | `newGameFlow.ts`, `preBattle.ts` | stringi startowe **częściowo**; tooltips bonusów **TODO** |

**Zasada:** logika bonusów **nie** w `main.ts` — tylko przekazanie `civBonusy[]` do modułów lane'ów.

---

## 3. Kontrakt wspólny (CYWILIZACJE dostarcza, lane'y konsumują)

**Plik:** `gra/src/game/civ-bonuses.ts`

| Eksport | Używa |
|---------|--------|
| `civCombatStatMultipliers(bonusy, unit, ctx)` | UNITS / `combat.ts` |
| `civBuildingCostDiscount`, `buildingCostAfterCivDiscount` | EKONOMIA / `production.ts` |
| `unitCombatCategory` | UNITS (testy) |
| `CivBonusEntry` | typ w `ResolveCombatOpts`, `AvailabilityContext` |

**EKONOMIA (osobno, już było):** `civBonusyForCivKey`, `civEconomyYieldMultipliers` w `economy.ts`; `civRecruitmentDiscount` w `production.ts`.

**Start gry:** `main.ts` ustawia `player.civBonusy` z wybranej cyw (`civs.json`).

---

## 4. Jednostki specjalne ≠ bonus procentowy

`typ: jednostka_specjalna` → **UNITS**, nie mnożnik:

- Definicja w `gra/data/units.json` (np. Falanga, `"W zamian za": "Włócznik"`, `Klasa: Specjalna`)
- Produkcja: dla `typCywilizacji=grecy` oferuj Falangę zamiast Włócznika (filtr w `production.ts` / `availableProduction`)
- Bonus `bonus_obrona` na piechotę działa **dodatkowo** na staty jednostki w walce

---

## 5. Podsumowanie 27 efektów (z `_handoff/CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md`)

| Dział | Liczba | Lane |
|-------|--------|------|
| walka (w tym jednostki spec. jako wpisy opisowe) | 23 | UNITS |
| miasto | 1 | EKONOMIA |
| ekonomia | 3 | EKONOMIA |

Szczegółowa tabela per nacja: `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md` (bez zmian).

---

## 6. Kolejność delegacji (propozycja dla Mastera)

| Krok | Lane | Batch | AC skrót |
|------|------|-------|----------|
| 1 | **CYWILIZACJE** | `export-bonusy-cyw.py` | Excel → overlay `civs.json["bonusy"]`; Maciej „Excel OK” → re-export |
| 2 | **UNITS** | bitwa 3D | `battleScene.ts` + `manualBattle.ts`: `attackerCivBonusy` / `defenderCivBonusy` jak w auto-resolve |
| 3 | **UNITS** | jednostki spec. | filtr produkcji per cyw + testy combat |
| 4 | **UI** | preBattle + wybór cyw | lista bonusów z JSON (`opis`), nie tylko stringi „Bonus startowy” |
| 5 | **SILNIK** | integracja | przekazać `getCivBonusy` wszędzie gdzie brakuje; **bez** nowej logiki bonusów |

**EKONOMIA:** batch RDY-01 **zamknięty** — tylko regresja po zmianie Excelu.

---

## 7. Handoffy per lane (Master wysyła Composerowi)

| Plik | Odbiorca |
|------|----------|
| `_handoff/CYWILIZACJE-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md` | UNITS |
| `_handoff/CYWILIZACJE-do-EKONOMIA_bonusy-ekonomia-miasto.md` | EKONOMIA |
| `_handoff/CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` | UI |
| Ten plik | MASTER (hub) |

---

## 8. Testy bramkowe

| Test | Lane |
|------|------|
| `node tools/civ-bonusy-test.cjs` | CYWILIZACJE + EKONOMIA + kontrakt walki |
| `node tools/combat-test.cjs` | UNITS (regresja po zmianach combat) |
| `node tools/battle-smoke.cjs` | UNITS + SILNIK (po bitwie 3D) |

---

## 9. Prośba do Mastera

1. **Rozdać** dyspozycje z §6 do `UNITS.md`, `EKONOMIA.md` (informacyjnie), `UI.md`.
2. **SILNIK:** tylko wiązania ownerId→bonusy; nie duplikować `civ-bonuses.ts`.
3. **CYWILIZACJE:** zlecić `export-bonusy-cyw.py` (Composer w lane CYW).
4. Zaktualizować wiersz **#10** w `DZIENNIK-MASTERA.md` (bonusy per lane — delegacja w toku).
5. Maciej edytuje Excel **asynchronicznie** — po „Excel OK” CYW robi re-export, lane'y bez zmian kodu (tylko JSON).

*— Grupa D / CYWILIZACJE, 2026-06-26*
