# HANDOFF: EKONOMIA -> MASTER -- wpiecie scalonej tury (WIRE 1+2+3)

**Data:** 2026-06-25  
**Sesja:** Grupa B (Sonnet-subagent)  
**Status:** DOWIEZIONY + przetestowany (23/23 tests pass)  
**Superseduje:** EKONOMIA-do-MASTER_wealth.md (wpiecie Wealth jest juz zrobione tutaj)

---

## Co zmienione

### 1. `gra/src/game/turn-economy.ts` (GLOWNY PLIK -- backup: .bak-EKONOMIA)

**WIRE 1 -- Zdrowie:**
- Nowy helper `loadHealthParams(raw, difficulty)` -- czyta `society-params.json["zdrowie"]` 14 param.
- Nowy helper `computeCityHealth(ludnosc, tiles, builtIds, hp)` -- oblicza pkt zdrowia per miasto.
- `toEconomyCity(city, params, isCapital, zdrowie=0)` -- NOWY 4. parametr; backward compat (default=0).
- W petli per-miasto: wywoluje `computeCityHealth()` i przekazuje do `toEconomyCity()`.

**WIRE 2 -- splitPraca:**
- Import `{ splitPraca }` z `./production`.
- W petli per-miasto: `splitPraca(yld.praca, udzialBudynki)` -> `{doBudynkow, doPuli}`.
- `CityEconomyTick` ma nowe pola: `doBudynkow`, `doPuli`.
- `EconomyTickResult` ma nowe pole: `totalPracaPula` (suma doPuli ze wszystkich miast).

**WIRE 3 -- Luksus->Wealth:**
- Import `{ advanceWealth, loadWealthParams, freshWealthState, WealthState, WealthTickResult }` z `./wealth`.
- `advanceCityEconomy()` ma nowe parametry:
  - `builtByCity: ReadonlyMap<string, readonly string[]> = new Map()` -- id budynkow per miasto
  - `playerEra: number = 1` -- era gracza (dla cap/prog Wealth)
- Co ture per miasto: `advanceWealth(prevWealth, luksus, pieniadz, playerEra, wealthParams)`.
- WealthState persystowany na `(city as any).wealthState` (dynamiczne pole, bez zmiany interfejsu City).
- Pieniadz do skarbca = `Math.floor(yld.pieniadz * wt.mnoznik)` (KONTRAKT: tylko podatek, nie nauka).
- `CityEconomyTick` ma nowe pola: `pieniadzBrutto`, `wealthMnoznik`, `wealthZadowolenie`.
- `totalPieniadz` w EconomyTickResult = suma po mnoznikach Wealth.

**Zadanie 4 (no-dupe check):** Brak dubla. `playerState.ts` tylko bankuje gotowe sumy z `turn-economy.ts`. Potwierdzone -- brak zmian.

### 2. `gra/src/game/research.ts` -- ORPHAN (backup: .bak-EKONOMIA)
- NIKT nie importuje research.ts (grep potwierdzony).
- `research-test.cjs` testuje `chooseAIResearch` z `ai.ts`, NIE research.ts.
- Backup: `research.ts.bak-EKONOMIA`.
- Plik NIE moze byc usuniety przez bash (OneDrive). **Master musi usunac recznie na Windows.**

---

## Sygnatury publiczne (zmiany backward-compat)

### `toEconomyCity` (turn-economy.ts)
```typescript
// PRZED:
export function toEconomyCity(city: City, params: EconParams, isCapital: boolean): EconomyCity

// PO:
export function toEconomyCity(city: City, params: EconParams, isCapital: boolean, zdrowie: number = 0): EconomyCity
```
**Backward compat: 4. param opcjonalny (domyslnie 0).**

### `advanceCityEconomy` (turn-economy.ts)
```typescript
// PRZED:
export function advanceCityEconomy(
  cities, map, data, difficulty?, econUnits?, growthMultByCity?
): EconomyTickResult

// PO:
export function advanceCityEconomy(
  cities, map, data, difficulty?,
  econUnits?,
  growthMultByCity?,
  builtByCity?: ReadonlyMap<string, readonly string[]>,  // NOWY (default: empty Map)
  playerEra?: number,                                     // NOWY (default: 1)
): EconomyTickResult
```
**Backward compat: nowe parametry opcjonalne. Istniejace wywolania w main.ts dzialaja bez zmian.**

### `CityEconomyTick` -- nowe pola (addytywne, nie lama main.ts)
- `pieniadzBrutto: number` -- pieniadz przed mnoznikiem Wealth
- `zdrowie: number` -- obliczone zdrowie
- `doBudynkow: number`, `doPuli: number` -- wynik splitPraca
- `wealthMnoznik: number`, `wealthZadowolenie: number` -- wynik Wealth tick

### `EconomyTickResult` -- nowe pole (addytywne)
- `totalPracaPula: number` -- suma doPuli

---

## Co MAIN.TS musi zrobic (lista dla mastera)

1. **Przekazac `builtByCity`:** do `advanceCityEconomy` przekazac `cityBuilt` (juz istnieje w main.ts jako `Map<string, string[]>`).
   ```typescript
   advanceCityEconomy(cities, map, data, 'normal', econUnits, growthMultMap, cityBuilt, player.era)
   ```

2. **WealthState persist:** juz persystowany przez `(city as any).wealthState` w turn-economy.ts -- master nie musi nic robic, ale moze dodac `wealthState` do interfejsu `City` w cities.ts.

3. **Zadowolenie z Wealth:** `wt.zadowolenie` (per `CityEconomyTick.wealthZadowolenie`) zastepuje poprzedni wklad `luksus->szczescie` w main.ts (linia ~1313 `haBuildings` sekcja). **To jest cross-lane: wymagana zmiana w main.ts.**
   - Usunac lub zostawic stary `szczescie_luksus_na_mieszkanca` -- ale teraz Wealth jest zrodlem.

4. **Pieniadz dla gracza:** `pieniadzGracza += tk.pieniadz` w main.ts juz dobrze -- `tk.pieniadz` jest po mnozniku Wealth (po naszej zmianie). Nie trzeba nic zmieniac.

5. **Usuniecie research.ts:** plik `gra/src/game/research.ts` jest orphanem; usunac recznie.

---

## Testy

| Test | Wynik |
|------|-------|
| `node tools/wire-ekonomia-test.cjs` (nowy) | 23/23 PASS |
| `node tools/wealth-test.cjs` | 25/25 PASS |
| `node tools/upkeep-test.cjs` | 51/51 PASS |
| `node tools/converters-test.cjs` | 30/30 PASS |
| `node tools/logic-test.cjs` | DEHYDRACJA (culture-religion.ts, setup.ts, main.ts uciate w bash) |
| `node tools/auto-manage-test.cjs` | DEHYDRACJA (setup.ts uciety) |
| `npx vite build` | DEHYDRACJA (main.ts uciety) |

**Nota o dehydracji:** logic-test/auto-manage-test/vite-build nie dzialaja w srodowisku bash/OneDrive (pliki culture-religion.ts, units/setup.ts, main.ts widoczne jako uciate przez cloud stub). To blad srodowiska, nie naszego kodu. Standalone testy (wealth, upkeep, converters, wire-ekonomia) potwierdzaja poprawnosc loiki. Przed dehydracją logic-test dał 163/163 (potwierdzono na starcie sesji).

---

## DoD (po stronie mastera)

- [ ] `advanceCityEconomy` wywolane z `cityBuilt` i `player.era` w main.ts
- [ ] `wealthZadowolenie` wpiety do szczescia-miasta w main.ts (zastepuje luksus->szczescie)
- [ ] `research.ts` usuniety recznie (na Windows)
- [ ] Build kanonu bez regresji (`npx vite build`, NIE `npm run build`)
- [ ] `node tools/logic-test.cjs` zielony (163/163) po stronie mastera (chmura sync)

---

*Superseduje EKONOMIA-do-MASTER_wealth.md -- Wealth jest juz wpiete w turn-economy.ts.*
*Logika w turn-economy/economy = moj lane; instancja + main.ts = master.*
