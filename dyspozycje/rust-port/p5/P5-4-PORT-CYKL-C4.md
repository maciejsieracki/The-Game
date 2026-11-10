# P5.4 — Port cyklu C4 do `src-tauri/frontend-v2/` (karty encji + nauka, 10 modułów, DTO + harness DOM)

**Temat:** `R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Baza kodu:** `origin/rust-port/parity-v2` @ `9ec9c9d8` (detached, izolowany worktree; zawiera P5.1, P5.2, P5.3). **Pin web:** `edb8fb56` (wyłącznie `git show` / `git ls-tree` / `git archive` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§3, §6.1, §6.9, §6.11, §8, §9), `p5/P5-1-UI-SHELL-SKELETON.md`, `p5/P5-3-PORT-LEVEL1A.md` (wzorzec), `p4/P4-5B-MAP-UI-SEAM.md`.
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora. Nic nie było uruchamiane w Tauri ani w realnej przeglądarce.
**Logi:** `dyspozycje/autobot/runs/R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1/r1-logi/` (każdy kończy się `EXIT=<kod>`).

## 0. Wynik w skrócie (kryterium binarne z dispatchu)

| Kryterium | Stan | Dowód (`r1-logi/`) |
|---|---|---|
| Wszystkie moduły z zakresu w `frontend-v2/src/ui/` (lub pominięte z powodem) | TAK: **10/10** modułów cyklu C4, 0 pominiętych (każda zależność UI spoza cyklu była już w `frontend-v2`) | §2, `11-diff-stat.log` |
| Każdy z tabelą zmian vs pin | TAK | §2, §3, `diffs/*.diff` (8 diffów; 2 pliki identyczne bajtowo) |
| `npm ci` / `tsc --noEmit` / `npm run check` / `vite build` EXIT=0 | TAK / TAK / TAK / TAK | `01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log` (chunk `portCycleC4-*.js` 165,31 kB) |
| Brama 0 trafień na całym `src/` | TAK: `plików=95 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=413 niezgodnych=0` | `03-check.log` |
| Harness DOM 0 różnic | TAK: **1649 przypadków, 0 różnic**, 10/10 modułów porównanych z pinem, asercje v2 9/9 | `05-dom-harness-c4.log` (+ `.json`) |
| Mutacje harnessu wykrywane | TAK: **20/20** (EXIT=1 każda), pliki przywrócone bajtowo | `06-harness-mutations-c4.log` |
| Regresja P5.2 / P5.3 | 3861 / 0 oraz 3618 / 0 różnic | `07-dom-harness-p52-regresja.log`, `08-dom-harness-p53-regresja.log` |
| Kalibracja bramy na tych samych 10 plikach | pin: 38 trafień w 8 plikach (EXIT=1) → v2: 0 trafień w 12 plikach (EXIT=0) | `09-gate-calibration-pin-c4.log`, `10-gate-v2-c4.log` |
| Zero zmian poza allowlistą | TAK | §9, `13-allowlist-git-status.log` |

## 1. Architektura portu (co dochodzi w tej rundzie)

| Plik (`v2:`) | Rola |
|---|---|
| `ui/entityCards/*.ts`, `ui/sciencePicker.ts`, `ui/scienceHubHud.ts`, `ui/techDiscoveryNotice.ts` (8 zmienionych + 2 kopie bajtowe) | 10 modułów cyklu C4 (§2) |
| `controller/entityCardRules.ts` (NOWY) | dostawca `BuildingCardRulesDto` (P5-0 §6.11 `EntityCardDto::Building`, zapytanie `entity_card`) — wzorzec `controller/unitThumbnails.ts`; atrapa MOCK zwraca stałe zera (P5.13) |
| `controller/index.ts`, `controller/mockCatalog.ts` (zmiana) | eksport dostawcy; atrapa katalogu: `tech: { technologie: [] }`, `wonders: { cuda: [] }` (kształty JSON czytane przy ewaluacji modułów), `techTerrainUnlockLabels: {}` |
| `viewmodel/types.ts` (zmiana) | `EraGateInfoDto` (konkretny zamiast `NieZmierzonoDto`) + `EraGateMissingTechDto`, `EraGateWonderStatusDto`; `HubTechEntryDto`; `ResearchViewDto.{treeEpoch, hubEntries}`; `BuildingCardStateDto`, `BuildingCardRulesDto`; `StaticCatalogDto.techTerrainUnlockLabels`. Każde z komentarzem `plik:linia` źródła web |
| `ui/portCycleC4.ts` (NOWY), `main.ts` (zmiana) | dynamiczny import po instalacji katalogu (jak `portLevel1a.ts`), aby `vite build` kompilował moduły; niczego nie montuje (ZAŁOŻENIE P5.4-Z1) |
| `tools/pin-manifest.json` | +2 wpisy (kopie bajtowe `renderer.ts`, `wonderAdapter.ts`); niezależnie SHA-1 blobów `git ls-tree edb8fb56` = `git hash-object` kopii: 2/2 (`12-blob-sha1-kopie.log`) |
| `tools/dom-harness/run-c4.mjs`, `mutate-c4.mjs` | harness i kontrola czułości (§6); `package.json`: skrypty `harness:c4`, `harness:c4:mutate` (bez nowych zależności, `package-lock.json` bez zmian) |

Dane gry nie są kopiowane (D-UI-4): `src/` nie zawiera plików z `gra/data/**`; moduły czytają te same pliki przez `StaticCatalogDto` (w harnessie = JSON pinu, w atrapie = puste fikstury MOCK).

## 2. Tabela modułów (status, zmiany względem pinu)

Liczby z `11-diff-stat.log`. „Harness” = `05-dom-harness-c4.log`.

| Wiersz PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) | Harness (przyp./różn.) |
|---:|---|---|---|---|---|---|---:|
| 16 | `entityCards/registry.ts` | BEZP. | PRZENIESIONY (dane → katalog) | 194 → 192 | +9/−11 | importy `:20-25` → `UnitDefDto`/`BuildingDefDto` + `staticCatalog()`; `:34,59,84,104,180` odczyt pól katalogu (`buildings`, `terrainImprovements`, `tech`, `units`, `wonders`) | 312 / 0 |
| 17 | `techDiscoveryNotice.ts` | BEZP. | PRZENIESIONY (dane → katalog) | 946 → 945 | +9/−10 | importy `:46-49` → `staticCatalog()`; `:53` typ `ImprovementKey` → lokalny alias `string`; `:129,353-355,507` odczyt katalogu | 69 / 0 (+1/1 asercja) |
| 19 | `entityCards/unitAdapter.ts` | BEZP. | PRZENIESIONY (reguła → katalog) | 291 → 290 | +9/−10 | importy `:39-41`; lokalny typ `CounterDef` (pola czytane w `collectCounters`); `:46` kontry z katalogu; `:104-109` `categoryOf` → `unitCategoryFromCatalog(Jednostka, true)` | 76 / 0 |
| 20 | `sciencePicker.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 1666 → 1648 | +24/−42 | importy `:13-19,29`; `SciencePickerConfig`: `getPlayerEra`/`getTempoGry`/`getDifficulty` (`:97-109`) → `getResearchView`; `:132` etykiety ulepszeń z katalogu; `:160,292` odczyt katalogu; `:489-497` lista huba z DTO; `:521-526` epoka drzewka z DTO; `:1078,1117,1176-1180` koszt z DTO | 258 / 0 (+2/2 asercje) |
| 22 | `entityCards/buildingAdapter.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 340 → 352 | +45/−33 | importy `:35-49` → typy DTO, `staticCatalog`, `buildingCardRules`; lokalny typ `BuildingDef` (pola czytane w adapterze) i aliasy `BuildingCostPace`/`GameDifficulty` = `string`; `BuildingCardCityState extends BuildingCardStateDto`; sygnatura adaptera `(buildingRow: BuildingDefDto)` + rzutowanie; `:137,152` efekty poziomów, `:159-165` etykiety surowców, `:257-259` mnożnik roli, `:267` obrona strukturalna, `:278-280` koszt pracy/surowców, `:296-297` utrzymanie → pola `BuildingCardRulesDto` | 215 / 0 (+1/1 asercja) |
| 23 | `scienceHubHud.ts` | BEZP. | PRZENIESIONY (stała/typy → DTO) | 792 → 794 | +6/−4 | importy `:10,15-16` → `BuildingDefDto`, `EraGateInfoDto`, `staticCatalog`; `:94` `PLAN_MAX` = `constants.researchQueueMax` | 67 / 0 (+2/2 asercje) |
| 24 | `entityCards/improvementAdapter.ts` | BEZP. | PRZENIESIONY (dane → katalog) | 249 → 250 | +3/−2 | import `:26` → `staticCatalog()`; `:71` odczyt katalogu | 24 / 0 |
| 25 | `entityCards/technologyAdapter.ts` | BEZP. | PRZENIESIONY (dane → katalog) | 386 → 384 | +6/−8 | importy `:33-36` → `staticCatalog()`; `:100,108,135-136` odczyt katalogu | 33 / 0 |
| 35 | `entityCards/renderer.ts` | PRZECH. | KOPIA BAJTOWA | 1212 | 0 | — | 575 / 0 (+1/1 asercja) |
| 45 | `entityCards/wonderAdapter.ts` | PRZECH. | KOPIA BAJTOWA | 156 | 0 | — | 20 / 0 |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty, komentarze nagłówkowe) — `diffs/*.diff`.

**Pominięte z zakresu dispatchu: brak.** Wszystkie zależności UI spoza cyklu (`icons/brandAssets.ts`, `unitInfographic.ts`, `unitMiniPreview.ts`, `techUnlockParse.ts`, `techIcons.ts`, `naukaLabel.ts`, `icons/scienceOwlIcon.ts`, `escapeOverlayStack.ts`, `hoverDetailDock.ts`, `hudPanelDismiss.ts`, `sidePanelLayout.ts`, `entityCards/{slug,types,civpediaOpenGate}.ts`) były już w `frontend-v2` (P5.1/P5.2). Poza zakresem (dispatch): `newGameFlow.ts`, `perfTestPanel.ts`/`sceneTimingReport.ts` (D-UI-7), `cityPanel.ts`, `hud.ts`, moduły zależne od `main.ts`.

**ZAŁOŻENIE P5.4-Z0 (zakres „zależności przechodnich”):** dispatch każe dołączyć „zależności przechodnie, które po tym porcie staną się dostępne”. Zależności (w dół grafu) cyklu C4 były już przeniesione; moduły zależne od C4, które się odblokowały (`buildModeHud.ts`, `techTreeView.ts`, `unitInfoCard.ts`, wiersze 54/56/57 PQ), są BEZPOŚREDNIE z własnymi importami logiki i kolumną „Cykl” = `—` — nie są zależnościami C4, więc zostają w kolejce (wpisane w `PORTING-QUEUE.md` jako odblokowane).

## 3. Mapowanie import → DTO / kontroler

| Moduł | Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|---|
| `entityCards/registry.ts` | `:20` `type UnitDef, BuildingDef` (`data/loader`) | typy resolverów | `UnitDefDto`, `BuildingDefDto` | §6.1 |
| | `:21-25` `buildings.json`, `units.json`, `terrain-improvements.json`, `tech.json`, `wonders.json` | `:34,59,84,104,180` | `staticCatalog().{buildings, terrainImprovements, tech, units, wonders}` | §6.1 (D-UI-4) |
| `techDiscoveryNotice.ts` | `:46-49` 4 × JSON | `:129,353-355,507` | `staticCatalog()` | §6.1 |
| | `:53` `type ImprovementKey` (`render/improvements`) | typ mapy `:127` | alias `string` (klucz obiektu `terrain-improvements.json`) | — (typ) |
| `entityCards/unitAdapter.ts` | `:39` `type CounterDef, UnitDef` | typy | lokalny `CounterDef` (3 pola), `UnitDefDto` | §6.1 |
| | `:40` `counters.json` | `:46` | `staticCatalog().counters` | §6.1 |
| | `:41` `categoryOf` (`units/setup`) | `:104-109` | `unitCategoryFromCatalog(Jednostka, true)` | §6.1 `unit_category` |
| `sciencePicker.ts` | `:13-15` `tech.json`, `buildings.json` | `:160,292` | `staticCatalog().{tech, buildings}` | §6.1 |
| | `:17` `terrainUnlockLabelsForTech` (`game/improvement-tech`) | `:132` | `StaticCatalogDto.techTerrainUnlockLabels[nazwa]` | §6.9 `terrain_unlock_labels` → katalog: **ROZSZ. Z4-4** |
| | `:18-19` `type TempoGry`, `scaledResearchCost`, `type GameDifficulty` | `:1176-1180` (← `:496,1078,1117`) | `ResearchViewDto.techs[].effectiveCost` (hak `getResearchView`) | §6.9 `effective_cost` |
| | `:29` `buildHubTechEntries` (`scienceHubSnapshotLogic.ts`, REGUŁA bez importu logiki) | `:489-497` | `ResearchViewDto.hubEntries: HubTechEntryDto[]` | **ROZSZ. Z4-2** |
| | hak `getPlayerEra` + `currentEpochLabel` | `:521-526` | `ResearchViewDto.treeEpoch` | **ROZSZ. Z4-3** |
| `entityCards/buildingAdapter.ts` | `:35` `type BuildingDef`, `:36` `buildings.json` | typ, `:53,209` | lokalny `BuildingDef` (= `BuildingDefDto` + pola czytane), `staticCatalog().buildings` | §6.1 |
| | `:38-42` `buildingEffectAtLevel`, `buildingWorkCost`, `itemCost` (`game/production`) | `:137,152,278-279` | `rules.yieldAtDisplayLevel`, `rules.yieldScale`, `rules.workCost` | §6.11 Building: **ROZSZ. Z4-1** |
| | `:43-44` `type BuildingCostPace`, `type GameDifficulty` | `BuildingCardCityState` | `BuildingCardStateDto` (`string`) | §6.11 |
| | `:45` `buildingUpkeep`, `buildingResourceUpkeep` (`game/economy-upkeep`); `:46` `type BuildingRecord` | `:296-297` | `rules.upkeepGold`, `rules.upkeepResources` | Z4-1 |
| | `:47` `buildingStockCost`, `stockResourceLabel` (`game/building-stock-cost`) | `:165,280,291` | `rules.stockCost`, `rules.resourceLabels` | Z4-1 |
| | `:48` `mnoznikRoleForBuildingId`, `cumulativeMnoznikForBuildingId` (`game/unit-building-bonuses`) | `:257-259` | `rules.mnoznikRole`, `rules.cumulativeMnoznik` | Z4-1 |
| | `:49` `buildingStructuralDefenseBonusLine` (`game/building-upgrades`) | `:267` | `rules.structuralDefenseLine` | Z4-1 |
| `scienceHubHud.ts` | `:10` `type BuildingDef` | rzutowanie `:74` | `BuildingDefDto` | §6.1 |
| | `:15` `RESEARCH_QUEUE_MAX` (`game/playerState`) | `:94` | `staticCatalog().constants.researchQueueMax` | §6.1 `research_queue_max` |
| | `:16` `type EraGateInfo` (`game/era-gate-ui`) | `:121,354` | `EraGateInfoDto` (konkretny) | §6.9 `era_gate` |
| `entityCards/improvementAdapter.ts` | `:26` `terrain-improvements.json` | `:71` | `staticCatalog().terrainImprovements` | §6.1 |
| `entityCards/technologyAdapter.ts` | `:33-36` 4 × JSON | `:100,108,135-136` | `staticCatalog()` | §6.1 |

`renderer.ts` i `wonderAdapter.ts` importują wyłącznie moduły UI (cykl C4 + `escapeOverlayStack`, `hoverDetailDock`, `unitMiniPreview`, `civpediaOpenGate`) — kopie bajtowe. `unitMiniPreview.ts` (P5.2) zachował API `mountUnitMiniPreview`/`defaultOwnerColor`, więc `renderer.ts:19,56` kompiluje się bez zmian.

### 3a. Rejestr rozszerzeń kontraktu P5-0 §6 (P5.4)

Metoda jak P5.2/P5.3 §3a: każde nowe pole sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6. P5.4 NIE zmienia P5-0; rozszerzenia do wchłonięcia przy rewizji P5-0.

| Pole / typ (v2) | Sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|
| `BuildingCardRulesDto` (10 pól), `BuildingCardStateDto` | §6.11 `Building` | „koszt z tempem i trudnością, efekt na poziomach, utrzymanie, koszt surowcowy, mnożnik roli, linia obrony” — bez pól | ROZSZ. (dookreślenie pól + `resourceLabels`) | Z4-1, Z5 |
| `ResearchViewDto.hubEntries: HubTechEntryDto[]` | §6.9 | `techs[].state` | ROZSZ. (gotowa lista huba z podglądem ≤4 zablokowanych; P5.1/PQ: proponowane) | Z4-2 |
| `ResearchViewDto.treeEpoch` | §6.9 | brak (PQ: proponowane `hubEpoch`) | ROZSZ. | Z4-3 |
| `StaticCatalogDto.techTerrainUnlockLabels` | §6.9 `techs[].terrain_unlock_labels` | per tech w `ResearchViewDto` | ROZSZ. (przeniesione do katalogu — wartość zależy tylko od danych; czytana przy ewaluacji modułu) | Z4-4 |
| `ResearchViewDto.techs[].effectiveCost` | §6.9 | jest | W KONTRAKCIE | — |
| `EraGateInfoDto` (+ `MissingTech`, `WonderStatus`) | §6.9 `era_gate` | `EraGateInfoDto` bez pól | W KONTRAKCIE (dookreślenie = web `EraGateInfo`) | — |
| `constants.researchQueueMax` | §6.1 | jest | W KONTRAKCIE | — |
| `StaticCatalogDto.{tech, buildings, units, terrainImprovements, wonders, counters}` | §6.1 | „zawartość JSON 1:1” | W KONTRAKCIE (atrapa MOCK: kształty `{technologie}`/`{cuda}`) | Z6 |

## 4. Reguły gry → pola DTO (przegląd ręczny 10 modułów + 3 plików „reguł bez importu”, P5-0 §9 pkt 3)

### 4.1 Reguły usunięte z UI (liczy Rust)

| Moduł | Reguła na pinie | Pole DTO w v2 | Uwagi |
|---|---|---|---|
| `entityCards/buildingAdapter.ts` | efekt budynku na poziomie `buildingEffectAtLevel` (`:137`, skala `:152`) | `yieldAtDisplayLevel`, `yieldScale` | Z4-1 |
| | koszt pracy z tempem/trudnością `itemCost`+`buildingWorkCost` (`:278-279`), koszt surowcowy z epoką `buildingStockCost` (`:280`) | `workCost`, `stockCost` | §6.11 |
| | utrzymanie złota/surowców (`:296-297`) | `upkeepGold`, `upkeepResources` | §6.11 |
| | rola i skumulowany mnożnik koszar/kuźni (`:257-259`, łańcuch `upgradeFrom`) | `mnoznikRole`, `cumulativeMnoznik` | §6.11 |
| | linia obrony strukturalnej (`:267`) | `structuralDefenseLine` | §6.11 |
| | etykieta surowca `stockResourceLabel` (`:165,291`) | `resourceLabels` | klasa F (tekst z silnika, jak `resourceDisplayLabel` w P5.3) |
| `entityCards/unitAdapter.ts` | kategoria jednostki `categoryOf` (`:104-109`) | `StaticCatalogDto.unitCategory` | jak P5.2-Z2 |
| `sciencePicker.ts` | koszt badania `scaledResearchCost` (tempo, trudność, epoka, właściciel; `:1176-1180`, użycia `:496,1078,1117`) | `techs[].effectiveCost` | §6.9 |
| | etykiety ulepszeń odblokowanych przez tech `terrainUnlockLabelsForTech` (bramka tech ulepszeń, `:130-135`) | `techTerrainUnlockLabels` | Z4-4 |
| | **wpisana bez importu:** epoka widoczna na drzewku `currentEpochLabel` (`:521-526`: numer epoki → etykieta, przycięcie do 3 epok, zaokrąglenie; filtr `:528-532`) — ta sama formuła co `scienceHubSnapshotLogic.ts:67-69` (REGUŁA wg P5.1) | `treeEpoch` | Z4-3; znalezione w tym przeglądzie |
| | lista huba `buildHubTechEntries` (`scienceHubSnapshotLogic.ts:76-141`: normalizacja id, dodanie celu do dostępnych, epoka huba z celu albo gracza, podgląd ≤4 zablokowanych, sortowanie `localeCompare('pl')`) | `hubEntries` | Z4-2 |
| `scienceHubHud.ts` | `RESEARCH_QUEUE_MAX` (`:94`) | `constants.researchQueueMax` | §6.1 |
| | bramka awansu epoki (`EraGateInfo` — liczona w silniku już na pinie, panel tylko wyświetla) | `EraGateInfoDto` | typ |

### 4.2 Pozostawione w UI — klasyfikacja GRANICZNY (prezentacja nad polami DTO / danymi katalogu)

| Moduł | Miejsce (v2 = pin) | Dlaczego zostało |
|---|---|---|
| `entityCards/slug.ts` (P5.1) | `:30-49` `slugify` → `registry.ts:106-126` (`unitToSlug`, mapa jednostek) | klucz trasy kart (id w `data-entity-id`, link krzyżowy); P5.1: docelowo `EntityCardDto.id` z silnika — do wymiany razem z przejściem adapterów na `EntityCardDto`. Harness: 75 slugów = pin |
| `techIcons.ts` (P5.1) | `:14-47` mapa nazwa PL → ikona; użycia `technologyAdapter.ts:252,363`, `techDiscoveryNotice.ts:416,902`, `sciencePicker.ts:1072,1111,1124`, `scienceHubHud.ts:331,637` | klucz zasobu graficznego (dane, nie reguła); klucz = `Technologia` z katalogu |
| `scienceHubSnapshotLogic.ts` (P5.1) | cały plik | REGUŁA — **już nieimportowany** w v2 (asercja harnessu + mutacje C14/C15); plik zostaje jako kopia P5.1 |
| `sciencePicker.ts` | parsowanie prereq z rozmytym dopasowaniem 6 znaków (`:192-217`) | dane katalogu → krawędzie/układ drzewka i lista „Wymaga” w dymku; dostępność do badania decyduje silnik (`getAvailableTechs`). Docelowo `ResearchViewDto.techs[].prereqIds` — `NIE_ZMIERZONO` czy Rust parsuje identycznie |
| | stan węzła `computeStatus` + „cel zawsze klikalny” (`:866-876,1374-1376,1501`); tryb podglądu bez haków = wszystko dostępne (`:1366-1368`) | prezentacja zbiorów z silnika; klik → `onSelectTarget` (komenda), bez bramki w UI |
| | `techUnlockItems`/`techRequirementItems`/`buildingIconRefForName`/`isPlaceholderLabel`/`RESOURCE_LABEL_ALIAS` (`:291-460`), `prereqHint` (`:462-466`) | dobór etykiety i ikony z danych katalogu |
| | `computeLayout`, `routeEdges`, `wrapText`, `epochStyle` (`:554-858`) | geometria/kolor (klasa X) |
| | `renderProgress`: `pct` (clamp/round), ETA (`:1334-1335`) | formatowanie pól `getResearchState` |
| `scienceHubHud.ts` | `locked.slice(0, 4)` (`:540`), `canEnqueue` (`:541`), `pct`/ETA/`naukaRate` (`:328-330`), sloty planu do `PLAN_MAX` (`:516`) | widok gotowych list/liczb |
| `techDiscoveryNotice.ts` | `list()`, „kolejne technologie” i plakietka „Możesz badać” gdy jedyny prereq = ta tech (`:108-111,356,411-421`), „N · spełnione” (`:447`), `pluralPl` (`:138-144`), `EPOCH_LABEL` (`:101,534,547-548`), `buildingEffectText` (`:146-157`) | tekst z danych `tech.json` (nagłówek pliku pkt 3: „dowodliwe z samych danych”), bez stanu gracza; etykieta epoki po numerze (por. `constants.epochNumberToName`) |
| `entityCards/technologyAdapter.ts` | `list()`, `nextTechRows`, „Możesz badać”/„Wymaga też” (`:75-78,137,243-273`), `buildingEffectText` (`:80-91`), „N · spełnione” (`:330`) | jw. |
| `entityCards/unitAdapter.ts` | `collectCounters` (`:70-81`), `Math.round(próg·100)` (`:201`) | filtr danych `counters.json`; formatowanie |
| `entityCards/buildingAdapter.ts` | tekst `(poziom n: baza + przyrost × (n−1))` (`:141-143`), `hasCity ? displayLevel : 1` (`:321`), `EPOCH_LABEL` (`:73-77`), `upgradeFrom` → nazwa (`:207-213`) | formatowanie pól danych/DTO; `displayLevel` podaje host (`cityPanel.ts`, poza zakresem) |
| `entityCards/improvementAdapter.ts`, `wonderAdapter.ts` | znaki `+/−`, etykiety bonusów (`BONUS_LABEL`, `DOSTEP_LABEL`) | formatowanie danych katalogu |
| `entityCards/renderer.ts` | `previewLimit` (`:294-297`), stos dialogów (`:666`), `HISTORIA_SECTION_INDEX` (`:461`) | układ/prezentacja |

Bez reguł (po przeglądzie): `entityCards/registry.ts` (poza `slug.ts`), `entityCards/wonderAdapter.ts`, `entityCards/renderer.ts`.

## 5. Zdarzenia wejścia (P4-5B)

Panele C4 słuchają kliknięć/najechań na własnych węzłach (`sciencePicker.ts:1511-1548`, `scienceHubHud.ts:725-741`, `renderer.ts` delegacja, `techDiscoveryNotice.ts:680-703` przechwytywanie) i `keydown` na wierszach huba (`scienceHubHud.ts:726`); Escape przez stos `escapeOverlayStack.ts` (P5.1, `document` capture) — zgodne z P4-5B §3.2 Z3 (fokus klawiatury w webview). Otwarcie drzewka/huba/kart w `UiState` (P4-5B §4.3) — wiązanie z ekranem gry poza tą rundą, `NIE_ZMIERZONO`.

## 6. Harness porównania DOM (`tools/dom-harness/run-c4.mjs`)

**Metoda** = P5.2/P5.3 (`build.mjs` bez zmian): oba drzewa pakowane `esbuild` z tą samą emulacją Vite, wspólny jsdom, zamrożony `Date`, kanoniczna serializacja całego `document.documentElement` (atrybuty posortowane) albo JSON/HTML wartości; log akcji (wywołania callbacków) dopisywany do DOM. Nowe w P5.4: (a) **`stash`** — `sciencePicker` tworzy nakładkę/dymek/tło RAZ i potem je odświeża, więc jego węzły wracają do `body` swojej strony po resecie; (b) **`cleanup` per strona po zrzucie** (zniszczenie huba, zamknięcie karty, odczekanie timera ukrycia `hoverDetailDock`) — inaczej słuchacze/timery jednej strony pisałyby do wspólnego `document` w trakcie drugiej; (c) wyjątek po jednej stronie = wynik `{throw}`/`THROW:` (różnica), nie awaria harnessu; (d) `Element.prototype.scrollIntoView` = no-op (jsdom), wspólne dla obu stron; (e) `resetDoc` zdejmuje też atrybuty `<html>`/`<body>`.

**„Rust” w harnessie** (z danych/funkcji pinu): `StaticCatalogDto` = `gra/data/*.json` + `categoryOf` + `terrainUnlockLabelsForTech` + `RESEARCH_QUEUE_MAX`; `BuildingCardRulesDto` = te same wywołania co pin `buildingAdapter.ts` (§3); `ResearchViewDto` = `scaledResearchCost` (z tymi samymi `tempo`/`difficulty`, które pin dostaje hakami, a przy ich braku `standardowa`/`normal` jak pin `:1177-1178`), `hubEpochLabel(era, null, …)` (ta sama formuła co pin `:521-526`) i `buildHubTechEntries` z `scienceHubSnapshotLogic.ts` pinu. Wiersz syntetyczny jednostki dostaje kategorię w katalogu „Rust” (Rust zna każdą jednostkę, którą wysyła; ZAŁOŻENIE P5.2-Z2).

**Wyniki** (`05-dom-harness-c4.log`, EXIT=0): `modułów=10 przypadków=1649 różnic=0 consoleErrors=0`.

| Moduł | Przyp. | Różn. | Pokrycie |
|---|---:|---:|---|
| `entityCards/registry.ts` | 312 | 0 | wszystkie resolvery × wszystkie id + nieznane/`_meta`/puste; `technologyIdFromName`, `unitToSlug` |
| `techDiscoveryNotice.ts` | 69 | 0 | mapa nazwa→klucz; 32 technologie (6 × 5 wariantów `kind`/`eraIndex`/akcji, reszta po 1); 12 × interakcje: karta obok (link krzyżowy, podmiana satelity, ✕ satelity), „Rozpocznij badanie”, „Otwórz drzewo”, tło, ✕, nieznana technologia. Asercja: ścieżka `entityCards` (nie legacy) 56/56 |
| `entityCards/unitAdapter.ts` | 76 | 0 | 75 jednostek + wiersz syntetyczny (Opis/Top3/Historia/„W zamian za”/Super-jednostka) |
| `sciencePicker.ts` | 258 | 0 | `techToSlug`/`techNameFromSlug`/`techUnlockItems`/`techRequirementItems` dla wszystkich; 9 scenariuszy (podgląd bez haków, tempo/trudność, epoki 0/1/2/2,6/9/brak, cel nazwą/slugiem/nieznany, plan) × `getScienceHubSnapshot` (właściciel 0/1) × tryb legacy/dock: drzewko, 3 dymki, zakładki epok, „Skocz do celu”, wybór celu, zamknięcie ✕/„Lista”/tło. Asercje: drzewko SVG bez gałęzi błędu 18/18; brak `buildHubTechEntries(` w v2 |
| `entityCards/buildingAdapter.ts` | 215 | 0 | 42 budynki × 5 stanów miasta (brak / poziom 1–3 × tempo `niski|normalny|wysoki` × trudność `easy|normal|hard` × właściciel 0/1) + syntetyk (historia/opis/top3/nieistniejący `upgradeFrom`). Asercja: dostawca DTO wołany |
| `scienceHubHud.ts` | 67 | 0 | `unlockIconSvg` dla wszystkich pozycji + 4 brzegowe; 17 konfiguracji (postęp ×4, plan ×4, bramka epoki ×4, z/bez haków akcji, pusta lista): stan otwarty w logu, klik wiersza/zablokowanego/„Karta”/Enter/usuń z planu/wiersz planu/cel/„Drzewo”/✕/toggle. Asercje 2/2 |
| `entityCards/improvementAdapter.ts` | 24 | 0 | 23 ulepszenia + syntetyk (wszystkie pola opcjonalne) |
| `entityCards/technologyAdapter.ts` | 33 | 0 | 32 technologie + syntetyk (bez prereq, `Historia`, `Dostęp do surowca.`) |
| `entityCards/renderer.ts` | 575 | 0 | `ENTITY_CARD_CSS`; `buildEntityCardData` dla 5 rodzajów × wszystkie id (+ budynki × 5 stanów, + nieznane); `renderEntityCard` 191 kart; 6 × dialog (link krzyżowy, wiersz, tło, `dismiss`), 6 × inline, 2 × hover (220 ms realnie). Asercja: 191/191 kart z tytułem |
| `entityCards/wonderAdapter.ts` | 20 | 0 | 19 cudów + syntetyk |

**Czułość** (`06-harness-mutations-c4.log`): 20 mutacji — C1–C17 w modułach zmienionych (każdy odczyt nowego pola DTO/katalogu: `tech`, `unitCategory`, `counters`, `workCost`, `yieldScale`, `yieldAtDisplayLevel`, `resourceLabels`, `cumulativeMnoznik`, `upkeepGold`, `terrainImprovements`, `units`, `effectiveCost`, `treeEpoch`, `hubEntries`, `techTerrainUnlockLabels`, `researchQueueMax`), C18–C19 w kopiach bajtowych (`renderer.ts`, `wonderAdapter.ts`), C20 tekst panelu bramki epoki → **20/20 wykrytych**, pliki przywrócone bajtowo.

**`jsdomErrors=75`** (`05-dom-harness-c4.log`): wyłącznie „Not implemented: HTMLCanvasElement's getContext()” — strona pin: `unitMiniPreview.ts` pinu po `requestAnimationFrame` próbuje skopiować obraz WebGL do canvasu 2D (atrapa `three`). Nie wpływa na zrzuty (robione przed rAF). v2 nie ma canvasu (placeholder D-UI-3).

**NIE_ZMIERZONO (harness):** (1) realny WebView/Tauri; (2) miniatura jednostki po rAF (D-UI-3, jak P5.2); (3) klawisz Escape i zamknięcie kliknięciem poza hubem (`escapeOverlayStack`/`bindHudPanelOutsideDismiss`, moduły P5.1 — wspólny `document` obu stron); (4) przeciąganie planu badań (DnD, jsdom bez `DataTransfer`); (5) `scrollIntoView` i pozycja dymka (jsdom bez układu); (6) fallback `_legacyShowTechDiscoveryNotice` (`techDiscoveryNotice.ts:880-935`) i gałąź `catch` renderu drzewka (`sciencePicker.ts:1434-1443`) — nieosiągalne na danych pinu; (7) zbieżność wzorów „Rust” z przyszłym silnikiem — harness odtwarza funkcje pinu.

## 7. Uruchomienie bram (odtworzenie)

```bash
cd src-tauri/frontend-v2
npm ci && npx tsc --noEmit && npm run check && npx vite build
git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
node tools/dom-harness/run-c4.mjs --pin-dir <PIN_DIR>         # EXIT 0 ⇔ 0 różnic
node tools/dom-harness/mutate-c4.mjs --pin-dir <PIN_DIR>      # EXIT 0 ⇔ każda mutacja wykryta
node tools/dom-harness/run.mjs --pin-dir <PIN_DIR>            # regresja P5.2
node tools/dom-harness/run-level1a.mjs --pin-dir <PIN_DIR>    # regresja P5.3
rm -rf node_modules dist
```

## 8. ZAŁOŻENIA

- **P5.4-Z0 (zakres):** §2 — moduły zależne od C4, które się odblokowały, nie są „zależnościami” C4; zostają w kolejce.
- **P5.4-Z1 (montaż):** `portCycleC4.ts` tylko zbiera moduły dla `vite build`; żaden panel nie jest wpięty do ekranu (jak P5.3-Z1). Import po `installStaticCatalog` (P5.2-Z1: `registry.ts`, adaptery, `sciencePicker.ts`, `techDiscoveryNotice.ts`, `scienceHubHud.ts` czytają katalog przy ewaluacji).
- **P5.4-Z4-1 (karta budynku):** wartości liczone w Rust dostarcza `BuildingCardRulesDto` dla pary (id budynku, `BuildingCardStateDto`); stan domyślny bez miasta = pin `DEFAULT_CITY_STATE` (`L1`, `niski`, `normal`, właściciel 0). `yieldScale` ma `maksPoziom` pozycji; `resourceLabels` obejmuje klucze `stockCost` ∪ `upkeepResources` (brak klucza → sam klucz). Adapter zachowuje strukturę formaterów pina (parametry `baza`/`przyrost` zostają, wartość efektu z DTO).
- **P5.4-Z4-2 / Z4-3 (hub i epoka drzewka):** `buildHubTechEntries` i `currentEpochLabel` to reguły wpisane bez importu (`PORTING-QUEUE.md`: `scienceHubSnapshotLogic.ts` REGUŁA) — wynik z `ResearchViewDto`. Hak `getResearchView(ownerId)` zastępuje `getPlayerEra`/`getTempoGry`/`getDifficulty` (zmiana API dla `main.ts`).
- **P5.4-Z3 (brak `getResearchView`):** koszt = `Koszt nauki` z katalogu, wszystkie epoki, pusta lista huba. Pin bez haków liczył koszt z domyślnym tempem/trudnością; v2 nie odtwarza tej reguły w UI (P5.13) — w grze hak zawsze podaje Rust (P5-0 Z3: brak trybu „panel bez silnika”). Harness zawsze podaje DTO (także w trybie podglądu), więc różnica nie jest mierzona.
- **P5.4-Z4-4 (`techTerrainUnlockLabels` w katalogu):** P5-0 §6.9 umieszcza `terrain_unlock_labels` w `ResearchViewDto.techs[]`; wartość zależy wyłącznie od `terrain-improvements.json`/`tech.json`, a pin czyta ją przy budowie `TECH_MAP` (ewaluacja modułu, `:182`) — więc katalog statyczny (klucz = nazwa technologii).
- **P5.4-Z5 (synchroniczne zapytanie karty):** karta budowana jest synchronicznie (hover, `renderer.ts:746-764`); kontroler ma odpowiadać z pamięci podręcznej odpowiedzi Rust. Komenda/zapytanie Rust: `NIE_ZMIERZONO`.
- **P5.4-Z6 (atrapa MOCK katalogu):** `tech`/`wonders` w kształcie JSON (`{technologie: []}`, `{cuda: []}`), bo moduły C4 odczytują je przy ewaluacji (`.technologie`, `.cuda`); wcześniejsze `[]` rzuciłoby w `main.ts` po imporcie `portCycleC4`. Typy pól katalogu zostają `unknown` (jak P5.2).
- **P5.4-Z7 (kategoria jednostki):** lookup po surowym `Jednostka` (klucz katalogu), pin wołał `categoryOf(text(Jednostka), …)` — identyczne dla danych pinu (75/75 w harnessie).

## 9. Allowlista, Git, sprzątanie

- Zmienione/nowe ścieżki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` bez zmian — brak nowych zależności), `dyspozycje/rust-port/p5/P5-4-PORT-CYKL-C4.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1/**` (`13-allowlist-git-status.log`). Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
- `node_modules`, `dist` usunięte (`14-cleanup.log`). Commit w worktree jawnym `git add <ścieżki>` (logi `git add -f`), bez push.
- `.gitattributes` w katalogu runu: `r1-logi/diffs/*.diff -whitespace` (precedens P5.2/P5.3).

## 10. NIE_ZMIERZONO (zbiorczo)

1. Realny WebView/okno Tauri (nic nie uruchamiano; `tauri.conf.json` bez zmian).
2. Komendy/zapytania Rust dostarczające nowe DTO (`BuildingCardRulesDto`, `ResearchViewDto.{treeEpoch, hubEntries, techs[].effectiveCost}`, `techTerrainUnlockLabels`, `EraGateInfoDto`) — dziś tylko harness i atrapa MOCK.
3. Czy Rust parsuje prereq technologii identycznie jak drzewko (`sciencePicker.ts:192-217`, rozmyte dopasowanie 6 znaków) — dziś UI z katalogu.
4. Pozycje z §6 „NIE_ZMIERZONO (harness)”.
