# HANDOFF UI -> MASTER (dla MIASTO): paczka zwrotna kontraktu produkcji
Data: 2026-06-25. Lane: UI (src/ui/cityPanel.ts).
Odpowiedź na: MIASTO-do-UI_kontrakt-produkcji.md (2026-06-22 + aktualizacje).

---

## Sekcja A — Importy z production.ts, których UI używa DZIŚ

Plik źródłowy: `gra/src/ui/cityPanel.ts` (blok import na górze pliku).

```ts
import {
  availableProduction,
  frontItem,
  enqueue,
  dequeue,
  buildingProductionItem,
  type CityProduction,
  type ProductionItem,
} from '../game/production';
```

Używane symbole:
- `availableProduction` — lista pozycji do kolejki (budynki + jednostki), w `renderBuildList`.
- `frontItem` — aktualnie budowana pozycja, w `renderProd` i `renderBuildList`.
- `enqueue` — dodanie pozycji do kolejki (przycisk „Buduj" i „Ulepsz"), przez `addItem`.
- `dequeue` — usunięcie pozycji z kolejki (przyciski „Usuń" / ✕), w `renderProd`.
- `buildingProductionItem` — buduje `ProductionItem` dla ulepszenia budynku na poziom `2` (hardkodowane), w `renderBuildList`.
- `type CityProduction` — typ stanu kolejki (kolejka + postep + opcjonalnie wstrzymana).
- `type ProductionItem` — typ pojedynczej pozycji kolejki.

NIE importowane przez UI (ale dostępne w production.ts): `unitProductionItem`, `itemCost`, `epochNumber`, `EPOCH_BY_NAME`, `DEFAULT_UNIT_COST`, `BUILDING_LEVEL_FACTOR`, `advanceProduction`, `setPaused`, `rushCost`, `rushProduction`, `populationCostOf`.

---

## Sekcja B — Czego UI POTRZEBUJE od MIASTO (mapowanie na API z kontraktu)

### B.1 `buildingLevelForEpoch` + `buildingEffectAtLevel` — przycisk „Ulepsz" (gating po epoce)

Sygnatury (z production.ts, Aktualizacja 2 kontraktu):
```ts
buildingLevelForEpoch(
  epokaWejscia: number,
  cityEpoch: number,
  maksPoziom: number,
): number
// zwraca: 1 w epoce wejscia, +1/epoke, cap maksPoziom

buildingEffectAtLevel(baza: number, level: number): number
// zwraca: baza * BUILDING_LEVEL_FACTOR^(level-1), tj. 1.10^(level-1)
```

Jak UI tego użyje:
- `buildingLevelForEpoch` zastąpi hardkodowane `level = 2` w `renderBuildList`. Przycisk „Ulepsz" pojawi się TYLKO gdy `buildingLevelForEpoch(def.epokaWejscia, cityEpoch, def.maksPoziom) > currentBuildingLevel`, tzn. miasto weszło w nową epokę i budynek jeszcze nie awansował.
- `buildingEffectAtLevel` — UI użyje do wyświetlania efektów budynku (np. „Stolarnia poz. 2: +2,2 Praca/t") bez liczenia `1.10^` po stronie panelu.
- `cityEpoch` pochodzi z `cfg.getEpoch(city.ownerId)` — hook już istnieje w `CityPanelConfig`.
- `currentBuildingLevel` per miasto per budynek — UI nie trzyma tej mapy; potrzebuje hooka od SILNIK (patrz Sekcja E, pytanie E.1).

### B.2 `rushCost` + `rushProduction` — przycisk „Wykup"

Sygnatury (z production.ts):
```ts
rushCost(prod: CityProduction): number
// zwraca: max(0, ceil(front.koszt - postep)); 0 gdy kolejka pusta

rushProduction(prod: CityProduction): AdvanceProductionResult
// zwraca: { prod: CityProduction, completed: ProductionItem | null }
// natychmiast konczy front; caller odejmuje rushCost() ze skarbca i aplikuje completed
```

Jak UI tego użyje:
- Dziś koszt Wykupu w `renderProd` liczy: `Math.ceil(Math.max(0, front.koszt - prod.postep) * UI_PARAMS.panel_miasta.rush_cost_mnoznik)`. Po wejściu API — zastąpić wywołaniem `rushCost(prod)` (mnożnik wbudowany w `rushCost`, 1 Praca = 1 Pieniądz wg kontraktu).
- `rushProduction` wykona natychmiastowe ukończenie po stronie logiki; wynik `completed` + koszt `rushCost()` przekaże do `cfg.onRushBuy` (hook silnika, już istnieje w `CityPanelConfig`).
- Dopóki `cfg.onRushBuy` jest opcjonalny, panel może wywoływać `rushProduction` lokalnie i ustawiać nowy stan przez `setProd`.

### B.3 `setPaused` + pole `CityProduction.wstrzymana?` — przycisk „Wstrzymaj" (nowy)

Sygnatury (z production.ts):
```ts
setPaused(prod: CityProduction, paused: boolean): CityProduction
// zwraca: nowy CityProduction z flaga wstrzymana = paused

// pole w CityProduction (opcjonalne, brak = nie wstrzymane):
wstrzymana?: boolean
```

Jak UI tego użyje:
- Nowy przycisk „Wstrzymaj / Wznów" w sekcji `renderProd` (obok „Usuń" i „Wykup").
- Klik: `setProd(city.id, setPaused(getProd(city.id), !prod.wstrzymana))` + `rerender()`.
- Etykieta dynamiczna: gdy `prod.wstrzymana === true` → „▶ Wznów"; inaczej → „⏸ Wstrzymaj".
- Pasek postępu może sygnalizować stan wstrzymany (np. zmiana koloru / ikonka).
- `wstrzymana` jest opcjonalne: dotychczasowy odczyt `{kolejka, postep}` działa bez zmian.

### B.4 `populationCostOf` — rekrutacja jednostki (koszt populacji)

Sygnatura (z production.ts):
```ts
populationCostOf(item: ProductionItem): number
// zwraca: 1 dla jednostki (UNIT_POPULATION_COST z miasto-params.json, domyslnie 1), 0 dla budynku
```

Jak UI tego użyje:
- W `renderBuildList` przy jednostkach: wyświetlić „−1 lud." obok kosztu Pracy, gdy `populationCostOf(item) > 0`.
- W `renderProd` przy froncie będącym jednostką: informacja o koszcie populacji w opisie.
- UI NIE odejmuje populacji — robi to SILNIK po `completed`; panel tylko informuje gracza.

---

## Sekcja C — Co działa BEZ zmian (kontrakt zamrożony, sek. 2)

Następujące elementy działają już teraz i NIE wymagają żadnych zmian po stronie MIASTO ani SILNIK:

- Odczyt `{kolejka, postep}` z `CityProduction` — używany w `renderProd` do paska postępu i ETA.
- `frontItem(prod)` — wyświetlenie aktualnie budowanej pozycji.
- `enqueue(prod, item)` / `dequeue(prod, index)` — mutacje kolejki przez przyciski UI.
- `availableProduction(city, data, techs, ctx)` — lista dostępnych pozycji w `renderBuildList`.
- Typy `ProductionItem` i `CityProduction` — stabilne kształty pól (`kind`, `id`, `nazwa`, `koszt`; `kolejka`, `postep`).
- Fallback `localProd` (Map) — panel działa solo bez silnika.
- Hook `cfg.getProduction` / `cfg.setProduction` — integracja z pętlą tury przez SILNIK (opcjonalna).
- `cfg.onChange` — callback po zmianie kolejki; nie wymaga zmian.

---

## Sekcja D — Zmiany po stronie `cityPanel.ts` gdy nowe API wejdzie

Wszystkie zmiany to edycje istniejących funkcji lub dodanie jednego przycisku — interfejs publiczny (`showCityPanel` / `hideCityPanel` / `isCityPanelOpen`) pozostaje bez zmian.

1. **Import** — dodać do bloku import z `'../game/production'`:
   `buildingLevelForEpoch`, `buildingEffectAtLevel`, `rushCost`, `rushProduction`, `setPaused`, `populationCostOf`.

2. **`renderBuildList` — „Ulepsz"**: zastąpić hardkodowane `buildingProductionItem(id, data, 2)` logiką:
   - pobrać `cityEpoch` z `cfg.getEpoch(city.ownerId)`,
   - pobrać `currentLevel` z nowego hooka `cfg.getBuildingLevel(cityId, buildingId)` (patrz E.1),
   - wyliczyć `targetLevel = buildingLevelForEpoch(def.epokaWejscia, cityEpoch, def.maksPoziom)`,
   - przycisk „Ulepsz" pojawia się TYLKO gdy `targetLevel > currentLevel`,
   - przekazać `targetLevel` do `buildingProductionItem(id, data, targetLevel)`.

3. **`renderBuildList` — jednostki**: dodać `populationCostOf(item)` do wyświetlanego kosztu (gdy > 0: „−1 lud.").

4. **`renderProd` — „Wykup"**: zastąpić lokalny mnożnik `rush_cost_mnoznik` wywołaniem `rushCost(prod)`; wywołać `rushProduction(prod)` zamiast ręcznego `dequeue`.

5. **`renderProd` — nowy przycisk „Wstrzymaj/Wznów"**: wywołanie `setPaused(prod, !prod.wstrzymana)` przez `setProd`; etykieta dynamiczna.

6. **`renderProd` — jednostka w froncie**: wyświetlić `populationCostOf(front) > 0 ? '−1 lud.' : ''` w opisie kosztu.

---

## Sekcja E — Pytania i luki (kontrakt nie precyzuje)

**E.1 Hook `cfg.getBuildingLevel(cityId, buildingId) -> number` — brak w `CityPanelConfig`.**
`buildingLevelForEpoch` wymaga znajomości BIEZACEGO poziomu budynku w danym mieście, żeby UI wiedziało czy awans jest dostępny. Kto trzyma tę mapę (poziom per-miasto per-budynek)? Warianty:
  a) SILNIK dostarcza hook `cfg.getBuildingLevel` (analogicznie do `cfg.getBuiltBuildingIds`),
  b) MIASTO wypycha gotowy `currentLevel` jako dodatkowe pole w strukturze przekazywanej SILNIKOWI,
  c) UI trzyma lokalnie (Map<cityId, Map<buildingId, level>>) — niezalecane, stan rozproszony.
  **Prośba do Mastera: decyzja, kto odpowiada za tę mapę i jak jest dostarczona do panelu.**

**E.2 Decyzja 4c (czyj `etaTurns`).**
UI ma lokalny `etaTurns()` w `cityPanel.ts`. Kontrakt wspomina możliwość helpera z `production.ts`. Preferencja UI: MIASTO może wystawić `etaTurns` jako eksport, UI go zaimportuje i usunie duplikat — ale nie jest to bloker; lokalna wersja działa poprawnie.

**E.3 Pole `wstrzymana` a `cfg.setProduction` / zapis gry.**
Gdy SILNIK obsługuje `setProduction`, flaga `wstrzymana` musi być zachowana przy serializacji stanu. Kontrakt potwierdza, że `enqueue`/`dequeue` zachowują flagę. Prośba o potwierdzenie, że SILNIK/zapis gry serializuje `wstrzymana?: boolean`.

**E.4 `rushProduction` vs `cfg.onRushBuy` — kto kończy front.**
Kontrakt definiuje `rushProduction` jako czystą funkcję (AdvanceProductionResult). Hook `cfg.onRushBuy(cityId, item, koszt)` w `CityPanelConfig` jest po stronie UI. Czy SILNIK po otrzymaniu `onRushBuy` wywołuje też `rushProduction` sam, czy UI wywołuje `rushProduction` lokalnie i przekazuje tylko wynik? Potrzebna decyzja, żeby nie podwójnie kończyć produkcji.

**E.5 Pole `nazwyPoziomow` w `BuildingDef` / `buildings.json`.**
Kontrakt (Aktualizacja 1) wspomina `nazwyPoziomow[poziom-1]` jako nazwę wyświetlaną danego poziomu. Czy to pole trafi do `BuildingDef` w `buildings.json`? Jeśli tak — UI użyje go w etykiecie „Ulepsz" (np. „Stolarnia → Wielka Stolarnia"). Prośba o potwierdzenie, że pole będzie dostępne przez `data.buildings`.
