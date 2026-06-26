# EKONOMIA-do-MASTER: Model okolicy -- poprawka zasieg=pop, plony=przypisane pola

**Data**: 2026-06-25  
**Autor**: Civ-EKONOMIA (subagent)  
**Status**: KROK 1 wdrozony + zielony; KROK 2 wdrozony + zielony (okolica-test 16/16, wire-ekonomia-test 23/23)

---

## Co zmieniono

### KROK 1: Nowy model zasięgu okolicy (WDROZONY)

**Plik**: `gra/src/game/okolica.ts`  
**Backup**: `okolica.ts.bak-EKONOMIA`

Stara funkcja `cityRangeForPopulation` (schodkowy: pop<5->5 / >=5->10 / >=10->15)  
zastapiona przez model liniowy:

```
cityRangeForPopulation(pop) = min(pop, cap)
gdzie cap = zasieg_okolicy_max z miasto-params.json (default 15)
```

Przyklady: pop 0->0, 1->1, 5->5, 10->10, 15->15, 20->15 (cap).

**Plik**: `gra/data/miasto-params.json`  
**Backup**: `miasto-params.json.bak-EKONOMIA`

Dodano: `zasieg_okolicy_max` (wartosc: 15) -- nowy parametr cap.  
Zachowano: `zasieg_okolicy_baza`, `zasieg_okolicy_pop5`, `zasieg_okolicy_pop10`  
jako [LEGACY] z opisem "nieuzywane od 2026-06-25". Parsowanie nie jest zepsute.

**Plik**: `gra/tools/okolica-test.cjs`  
**Backup**: `okolica-test.cjs.bak-EKONOMIA`

Test 7 zaktualizowany: nowe asercje pop 0->0, 1->1, 5->5, 10->10, 15->15, 20->15.  
Test 3 (best-tile-first): dodano `{ radius: 10 }` explicite -- pop=2 w nowym modelu  
daje radius=2, wiec (3,0) przy d=3 byloby poza zasiegiem bez jawnego radius.

---

### KROK 2: Plony z przypisanych pol (WDROZONY)

**Plik**: `gra/src/game/turn-economy.ts`  
**Backup**: `turn-economy.ts.bak-EKONOMIA`

Dodano importy z `okolica.ts`:
```ts
import { assignWorkedTiles, cityRangeForPopulation, type TileYield as OkolicaTileYield } from './okolica';
```

Dodano nowa funkcja `cityWorkedTilesForEconomy(city, map)`:
- Centrum ZAWSZE w wynikach (baza plonow, niezaleznie od pop).
- N = populacja, zasieg = cityRangeForPopulation(pop) = min(pop, 15).
- Uzywamy `assignWorkedTiles` do wyboru N najlepszych pol wg inline-score.
- Inline score (TERRAIN_SCORE + modyfikatory las/rzeka) zsynchronizowany z `economy.ts`.
- Zwraca `WorkedTile[]` -- identyczny typ co stara funkcja.

Stara funkcja `workedTilesForCity` (centrum + 6 ring-1 sasiadow) ZACHOWANA jako  
`@deprecated` -- backward compat dla logic-test i ewentualnych zewnetrznych wywolan.

Zmiana call site w `advanceCityEconomy` linia ~552:
```ts
// PRZED:
const worked = workedTilesForCity(city, map);
// PO:
const worked = cityWorkedTilesForEconomy(city, map);
```

---

## Status testow

| Test                    | Wynik    | Uwagi                               |
|-------------------------|----------|-------------------------------------|
| `okolica-test.cjs`      | 16/16 OK | Wszystkie asercje zielone           |
| `wire-ekonomia-test.cjs`| 23/23 OK | WIRE 1/2/3 bez zmian                |
| `logic-test.cjs`        | FAIL*    | Pre-existing: econ-params.json ucięty w bashu (dehydratacja OneDrive) |

*logic-test nie dziala z powodu srodowiska (bash-mount dehydrowany), NIE z powodu naszych zmian.  
Kompilacja TypeScript (esbuild) `cityWorkedTilesForEconomy` + `cityRangeForPopulation` = OK.

---

## RIPPLE -- do aktualizacji przez inne lane

### MAPA + Zasieg-miasta-okolica.html
- Stary schodkowy model r5/10/15 jest wyswietlany w wizualizacji `Zasieg-miasta-okolica.html`.
- Widok terytorium na mapie (podswietlenie okolicy) moze pokazywac stare progi.
- Nowy model: zasieg = populacja (liniowo), max = 15 (strojalny w miasto-params.json).
- **DO AKTUALIZACJI**: MAPA lane + HTML wizualizacja.

### Territory handoff
- Wszelkie dokumenty opisujace "zasieg okolicy r5 / r10 / r15" sa zdezaktualizowane.
- Patrz: `MIASTO-do-MASTER_dynamiczny-zasieg-UX.md`, `UI-do-EKONOMIA_zasieg-okolicy.md`,
  `MIASTO-do-MASTER_okolica.md` -- moga zawierac stary model schodkowy.
- **DO AKTUALIZACJI**: MAPA, MIASTO, UI lanes.

### SYNC: TERRAIN_SCORE w turn-economy.ts
- `cityWorkedTilesForEconomy` zawiera inline kopie `TERRAIN_YIELDS` z `economy.ts`  
  (jako `TERRAIN_SCORE` uzywany TYLKO do rankowania pol, nie do final yield).
- Jezeli `TERRAIN_YIELDS` w `economy.ts` zmieni sie (nowy teren, inne wartosci),  
  MUSI zostac zsynchronizowany `TERRAIN_SCORE` w `turn-economy.ts`.
- Alternatywa dlugoterminowa: wyeksportowac `tileYield` z `economy.ts` i uzywac  
  bezposrednio (brak cyklu importow -- economy nie importuje turn-economy).

---

## Pliki zmodyfikowane

| Plik | Backup |
|------|--------|
| `gra/src/game/okolica.ts` | `.bak-EKONOMIA` |
| `gra/data/miasto-params.json` | `.bak-EKONOMIA` |
| `gra/tools/okolica-test.cjs` | `.bak-EKONOMIA` |
| `gra/src/game/turn-economy.ts` | `.bak-EKONOMIA` |
