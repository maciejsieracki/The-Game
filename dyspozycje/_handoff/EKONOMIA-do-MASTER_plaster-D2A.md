# HANDOFF: EKONOMIA → MASTER — plaster EKONOMIA+UI (D2=A)

**Data:** 2026-06-26. **Lane:** EKONOMIA (+ ex-MIASTO moduły). **Decyzja Macieja:** D2=A („idź"). **Status:** GOTOWE-do-wpiecia (kod lane + testy); MASTER integruje w `main.ts` + cityPanel (UI).

---

## Co przesyłam

### production.ts — ekonomia miasta (Q1/Q4)

| Eksport | Opis |
|---|---|
| `splitPraca(cityPraca, udzialBudynki)` | `{ doBudynkow, doPuli }` — podział Pracy miasta |
| `unitCostMode(def)` | zawsze `'pieniadz'` (decyzja 2026-06-25) |
| `unitPurchaseCost(def, civBonusy?)` | koszt zakupu ze skarbca (+ ulga Zulusi -10%) |
| `buildableProduction(...)` | tylko budynki do kolejki za Pracę |
| `purchasableUnits(..., ctx?)` | jednostki do kupna za Pieniądz |
| `availableProduction` | bez zmian (kompat wsteczna) |

### turn-economy.ts — WIRE 2 (już podłączony w lane)

- `splitPraca(yld.praca, suwaakPracaBudynki/100)` w `advanceCityEconomy`.
- Wynik w `CityEconomyTick`: `doBudynkow`, `doPuli`, `totalPracaPula`.

### cities.ts — gate terytorialny (Q3, ex-MIASTO)

- `canFoundCity(q, r, cities, map, opts?: { withinTerritory?: (q,r)=>boolean })`.
- `foundCity(settler, ..., opts?)` — ten sam `opts`.
- **Bez `opts`** → zachowanie jak dawniej (teren + dystans ≥5).
- **Z `opts.withinTerritory`** → dodatkowy warunek; failure: `reason: 'poza terytorium'`.
- `foundCityAt` — bez opts (bazowy gate); wioska→miasto używa `foundCityFromVillage` z tym samym kontraktem.

**Status gate terytorialnego:** API **GOTOWE** w `cities.ts`. Predykat `withinTerritory` dostarcza **MAPA/silnik** (granica kultury / posterunek). W `main.ts` **nie podpięty** — DEFERRED do batchu plaster (MASTER przekazuje callback z `territory.ts`).

---

## Co MASTER ma z tym zrobić

1. **Kolejka produkcji:** `buildableProduction` + `advanceProduction(doBudynkow)` z ticka (zamiast całej `praca`).
2. **Kup jednostkę:** UI lista `purchasableUnits`; klik → `unitPurchaseCost` ze skarbca gracza → spawn → `populationCostOf`.
3. **Pula Pracy:** `doPuli` z ticka → globalny skarbiec Pracy gracza (wydatki na ulepszenia terenu — MAPA, osobny batch).
4. **Gate terytorialny:** przy zakładaniu miasta/osiedla przekazać:
   ```typescript
   canFoundCity(q, r, cities, map, {
     withinTerritory: (q, r) => isInPlayerTerritory(q, r, ownerId),
   });
   ```
   Implementacja `isInPlayerTerritory` → lane MAPA (`territory.ts`, decyzja 1B: bazowy radius + kultura).

---

## Testy (zielone przed wpieciem)

| Test | Zakres |
|---|---|
| `node tools/wire-ekonomia-test.cjs` | WIRE 2 splitPraca (3 scenariusze) |
| `node tools/logic-test.cjs` | splitPraca, unitPurchaseCost, Koszary gate |
| `node tools/split-output-test.cjs` | splitOutput 4 strumienie |

---

## DoD (po wpieciu MASTER)

- [ ] Kolejka budynków zużywa `doBudynkow`, nie całą Pracę miasta.
- [ ] Jednostki kupowane za Pieniądz (`purchasableUnits`), nie w kolejce Pracy.
- [ ] Gate terytorialny aktywny przy osiedlaniu (predykat z MAPA) **lub** świadomie odłożony z komentarzem w main.ts.
- [ ] `wire-ekonomia-test` + `logic-test` zielone po buildzie.
- [ ] cityPanel (UI) dostosowany do nowych list (standby UI po sygnale wpiecia).

---

## Powiązane handoffy

- `_handoff/MIASTO-do-MASTER_moduly-gotowe.md` — pierwotna paczka Q1/Q3/Q4.
- `_handoff/EKONOMIA-do-MASTER_mnoznik-per-cyw.md` — ownerCivMap (osobny param, nie blokuje plaster).
- `_handoff/MAPA-do-MASTER_mapSize-reconcile.md` — terytorium 1B.

**Flaga:** GOTOWE / czeka MASTER batch BLK-02 (D2=A).
