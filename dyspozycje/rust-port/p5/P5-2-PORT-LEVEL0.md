# P5.2 — Port paneli UI poziomu 0 do `src-tauri/frontend-v2/` (15 modułów, DTO + kontroler MOCK + harness DOM)

**Temat:** `R-RUSTPORT-P5-2-PORT-LEVEL0-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5, obrona r2 (odpowiedzi na zarzuty Evaluatora r1 — §12)
**Baza kodu:** `origin/rust-port/parity-v2` @ `b338830e` (detached, izolowany worktree). **Pin web:** `edb8fb56` (wyłącznie `git show` / `git ls-tree` / `git archive` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§3, §6, §7, §8, §9, §10), `p5/P5-1-UI-SHELL-SKELETON.md` (§0–§8), `p4/P4-5B-MAP-UI-SEAM.md` (przejrzany pod kątem kontraktu zdarzeń; moduły poziomu 0 nie zbierają wejścia mapy), `LEDGER.md:134` (UI-Q1..3); kod: `src-tauri/frontend-v2/**` na bazie.
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone, nie wnioskuję; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora (do rewizji). Zakaz twierdzeń o oknie Tauri — nic tu nie było uruchamiane w Tauri ani w przeglądarce.

## 0. Wynik w skrócie (kryterium binarne z dispatchu)

| Kryterium | Stan | Dowód (`dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/r1-logi/`) |
|---|---|---|
| 15 modułów poziomu 0 w `frontend-v2/src/ui/` | TAK (15/15, ścieżki 1:1 z pinem) | §2, `09-diff-stat.log` |
| Każdy z tabelą zmian vs pin, diff ograniczony do zastąpionych importów i jawnie wylistowanych miejsc | TAK | §2 (liczby), §3 (import → DTO), §4 (reguła → DTO), pełne diffy `diffs/*.diff` |
| `npm ci` EXIT=0 | TAK | `01-npm-ci.log` |
| `tsc --noEmit` EXIT=0 | TAK | `02-tsc.log` |
| `npm run check` EXIT=0, brama 0 trafień na całym `src/` | TAK: `plików=64 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=401 niezgodnych=0` | `03-check.log` |
| `vite build` EXIT=0 (tylko `frontend-v2/`) | TAK; 15 modułów w chunku `portLevel0-*.js` | `04-vite-build.log` |
| Harness DOM (tam gdzie możliwy) 0 różnic | TAK (r1 i ponownie r2: `r2-logi/05-dom-harness.log`): **3861 przypadków, 0 różnic**, 14/15 modułów porównanych z pinem; `unitMiniPreview.ts` → `NIE_ZMIERZONO` (WebGL) + 4/4 asercje struktury v2 | `05-dom-harness.log`, `05-dom-harness.json` |
| Harness wykrywa różnice (czułość) | TAK: 14/14 mutacji wykrytych (EXIT=1 każda), pliki przywrócone bajtowo | `06-harness-mutations.log` |
| Kalibracja bramy na tych samych 15 plikach pinu | 33 trafienia w 15/15 plikach (EXIT=1) → w v2 0 trafień w 15/15 (EXIT=0) | `07-gate-calibration-pin-level0.log`, `08-gate-v2-level0.log` |
| Zero zmian poza allowlistą; `tauri.conf.json` bez zmian | TAK | §10 |

## 1. Architektura portu (co zastępuje importy logiki)

| Nowy plik (`v2:`) | Rola | Zastępuje (pin) |
|---|---|---|
| `controller/staticCatalog.ts` | `installStaticCatalog` / `staticCatalog()` / `unitCategoryFromCatalog(name, withDef)` — jedyny punkt odczytu `StaticCatalogDto` przez panele | `gra/data/*.json`, `src/data/loader`, stałe `game/**`, `categoryOf` (`units/setup.ts:239`) |
| `controller/diagnostics.ts` | `PerfDiagnosticsDto` (stempel builda, przełącznik rzek) — D-UI-7 | `buildInfo.ts`, `map/riverGenSwitch.ts` |
| `controller/saveSlots.ts` | `SaveSlotsService { list, delete, allocateSlotId }` — IO/M (P5-0 §7) | `game/save.ts`, `game/fsa-autosave.ts` |
| `controller/unitThumbnails.ts` | dostawca obrazu miniatury jednostki z Rust (domyślnie `null`) — D-UI-3 | `three`, `render/units.buildUnitModel` |
| `controller/mockCatalog.ts` | ATRAPA: `MOCK_STATIC_CATALOG`, `MOCK_PERF_DIAGNOSTICS`, `MOCK_SAVE_SLOTS`, `createMockSaveSlotsService` — stałe z etykietą „MOCK”, **nie** kopia `gra/data/**` | — |
| `controller/mock.ts` (zmiana) | `get_view { key: staticCatalog }` → `MOCK_STATIC_CATALOG` | — |
| `controller/commands.ts` (zmiana) | + `ProposedCommand` `allocate_save_slot` (P5-0 §6.15: id slotu nadaje powłoka) | — |
| `viewmodel/types.ts` (zmiana) | nowe/doprecyzowane DTO: `UnitDefDto`, `BuildingDefDto`, `CivDefDto`, `CivsCatalogDto`, `StaticCatalogDto.{units,civs,unitCategoryNameOnly}`, `constants.{mapGenPhaseTotal,mapGenPhaseLabels}`, `labels.powerHudLabelPl`, `RelationDealDto`, `AcceptanceSideBalanceDto`, `PnBalancePanelDto`, `DiplomacyBasketPreviewDto.{relation, treatyGate}` + `DiplomacyTreatyGateDto`/`DiplomacyTreatyBasketPreviewDto` (r2: zastąpiły osobny `TreatyBalancePreviewDto`), `ImprovementBuildImpactDto.newLabel`, `VictoryResultDto`, `SaveSlotMetaDto`, `SaveSlotsDto.diskSlotPrefix`, `MapGenPhaseTimingsDto`, `SceneBuildTimingsDto`, `PerfDiagnosticsDto` | typy web 1:1 (każdy z komentarzem `plik:linia` źródła); zgodność z P5-0 §6 i rozszerzenia — §3a |
| `ui/portLevel0.ts` | dynamicznie importowany z `main.ts` po instalacji katalogu → `vite build` kompiluje 15 modułów; niczego nie montuje | — |
| `main.ts` (zmiana) | przed panelami: `installStaticCatalog(await getView(staticCatalog))`, `installPerfDiagnostics(MOCK)`, `installSaveSlotsService(MOCK)` | — |
| `src/ui/icons/brand/**` (+318 plików) | zasoby UI wnoszone przez `brandAssets.ts` (`import.meta.glob('./brand/**/*.svg')`, mapy JSON ikon, CSS) — kopie bajtowe pinu | — |
| `src/assets/portrety/*.jpg` (45) | portrety władców wnoszone przez `leaderPortraits.ts:172` — kopie bajtowe pinu | — |
| `tools/pin-manifest.json` | +362 wpisy (sha256 assetów); niezależna kontrola: SHA-1 blobów = `git ls-tree -r edb8fb56 gra/src/ui/icons/brand gra/src/assets/portrety` → 364/364 zgodne (0 niezgodnych; 2 wpisy były w manifeście z P5.1) | `03-check.log` (`plików=401 niezgodnych=0`) |

**Dane gry nie są kopiowane** (D-UI-4, rozstrzygnięcie tymczasowe orkiestratora): `src/` nie zawiera żadnego pliku z `gra/data/**`; JSON-y w `icons/brand/` to mapy ikon UI (`building-icon-map.json`, `icons-manifest.json`, …) z `gra/src/ui/icons/brand/`, nie dane gry.

## 2. Tabela modułów (status, zmiany względem pinu)

Liczby z `09-diff-stat.log` (`diff -u <pin>/gra/src/ui/<m> src/ui/<m>`; `+`/`−` = linie dodane/usunięte bez nagłówków). Pełne diffy: `r1-logi/diffs/<moduł>.diff`. „Harness” = `05-dom-harness.log`.

| # | Moduł | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) | Harness |
|---:|---|---|---|---|---|---|
| 1 | `icons/brandAssets.ts` | PRZENIESIONY | 267 → 267 | +3/−3 | importy `:8-9` + użycie `categoryOf` `:177` | 814 przyp., 0 różnic |
| 2 | `leaderPortraits.ts` | PRZENIESIONY | 225 → 229 | +5/−2 | importy `:17-18` → odczyt `staticCatalog().civs` przy ewaluacji (Z1) | 888 / 0 |
| 3 | `uiParams.ts` | PRZENIESIONY | 98 → 102 | +4/−1 | import `:15` → `staticCatalog().uiParams` przy ewaluacji (Z1) | 1 / 0 |
| 4 | `unitInfographic.ts` | PRZENIESIONY | 171 → 170 | +3/−4 | importy `:5-6` + ciało `unitInfographicCategory` `:98-99` | 455 / 0 |
| 5 | `power-labels.ts` | PRZENIESIONY | 36 → 36 | +4/−4 | importy `:14-15` + `mocLabel` `:17-20` | 10 / 0 + 3/3 asercje v2 |
| 6 | `unitMiniPreview.ts` | PRZEPROJEKTOWANY (D-UI-3) | 155 → 80 | +31/−93 | usunięty render WebGL (`:4-113`); zachowane API, klasy, kolejka rAF; placeholder 80×80 | `NIE_ZMIERZONO` (pin = WebGL); 4/4 asercje v2 |
| 7 | `civBrandDisplay.ts` | PRZENIESIONY | 68 → 68 | +2/−2 | import `:6` + `:33` | 108 / 0 |
| 8 | `diplomacyAcceptanceBalance.ts` | PRZENIESIONY (reguły → DTO) | 911 → 591 (r1: 589) | +69/−377 (r1: +67/−377; diff r2: `r2-logi/diffs/`) | importy `:5-14`; usunięte reguły (§4.1); sygnatury rendererów na DTO | 1245 / 0 |
| 9 | `techUnlockParse.ts` | PRZENIESIONY | 52 → 52 | +2/−2 | import `:20` + `:49` | 67 / 0 |
| 10 | `minimapHud.ts` | PRZENIESIONY | 448 → 448 | +2/−2 | import `:10` + `:246` | 3 / 0 (DOM + log wywołań canvas 2D) |
| 11 | `perfReport.ts` | PRZENIESIONY (D-UI-7: typy/struktura) | 315 → 323 | +14/−7 | importy `:4-8` + `:101`, `:163` | 37 / 0 |
| 12 | `improvementBuildConfirm.ts` | PRZENIESIONY | 93 → 92 | +6/−7 | importy `:5-7` + `:39-49` (komentarz, sygnatura, `newLabel`, `removedList`) | 96 / 0 |
| 13 | `mapLoadingOverlay.ts` | PRZENIESIONY | 260 → 258 | +2/−3 | import `:5`, stała `:7`, `:232` | 48 / 0 |
| 14 | `saveLoadDialog.ts` | PRZENIESIONY (IO → usługa) | 623 → 609 | +35/−49 | importy `:6-15`; `saveContextLine` `:51-54`; usunięty `slotIdFromLabel` `:126-129`; `summarizeSaveSlots` `:196-221`; `summarizeFsaSaveSlots` `:235-256`; `:350` (`allocateSlotId`); `:468` (`storageAvailable`, `diskSlotPrefix`) | 17 / 0 (+ kontrola niepustości: 3/3 wiersze) |
| 15 | `victoryScreen.ts` | PRZENIESIONY | 346 → 346 | +3/−3 | importy `:8-9` + `:48` | 72 / 0 |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty, kolejność elementów) — weryfikowalne w `diffs/*.diff` (każdy hunk dotyczy wyłącznie wierszy z kolumny „Zakres zmian”).

## 3. Mapowanie import → DTO / kontroler

Kolumna **P5-0 §6** (r2, zarzut 1): sekcja kontraktu `P5-0-VIEWMODEL-CATALOG.md`, z której pochodzi pole; **ROZSZ. Zn** = pola brak w P5-0 §6 → rozszerzenie kontraktu z ZAŁOŻENIEM (rejestr §3a, ZAŁOŻENIA §8).

| Moduł | Import na pinie (`plik:linia`) | Użycie na pinie | Zastąpienie w v2 | P5-0 §6 |
|---|---|---|---|---|
| `icons/brandAssets.ts` | `:8` `type { BuildingDef, UnitDef } from '../../data/loader'` | sygnatury | `BuildingDefDto`, `UnitDefDto` (`viewmodel/types.ts`) | §6.1 `buildings`, `units` (JSON 1:1) |
| | `:9` `categoryOf from '../../units/setup'` | `:177` | `unitCategoryFromCatalog(name, u !== undefined)` → `StaticCatalogDto.unitCategory` (z wierszem) / `.unitCategoryNameOnly` (bez wiersza, np. `unitIconSvg(undefined, id)`) | §6.1 `unit_category`; `unitCategoryNameOnly` = **ROZSZ. Z2** |
| `leaderPortraits.ts` | `:17` `civsRaw from '../../data/civs.json'` | `:32,44,86-87,97` | `const civsRaw = staticCatalog().civs` (przy ewaluacji, ZAŁOŻENIE Z1) | §6.1 `civs` |
| | `:18` `type { CivsData } from '../data/loader'` | rzutowania | `CivsCatalogDto` | §6.1 `civs` (typ wiersza) |
| `uiParams.ts` | `:15` `raw from '../../data/ui-params.json'` | `:98` | `const raw = staticCatalog().uiParams` (przy ewaluacji, Z1) | §6.1 `ui_params` |
| `unitInfographic.ts` | `:5` `type { UnitDef }` | sygnatury | `UnitDefDto` | §6.1 `units` |
| | `:6` `categoryOf` | `:98-99` | `unitCategoryFromCatalog(…, u !== undefined)` | §6.1 `unit_category` (+ **ROZSZ. Z2**) |
| `power-labels.ts` | `:14` `powerParams from '../../data/power-params.json'` (martwy°, P5-0 §1) | — | usunięty | — |
| | `:15` `loadPowerOpcje from '../game/power-options'` | `:19` | `staticCatalog().labels.powerHudLabelPl \|\| MOC_LABEL_PL` | §6.1 `labels` (sekcja); pole `powerHudLabelPl` = **ROZSZ. Z11** |
| `unitMiniPreview.ts` | `:4` `three`, `:5` `buildUnitModel from '../render/units'`, `:6` `categoryOf`, `:7` `type UnitDef` | `:18-113` | `controller/unitThumbnails.ts` (`unitThumbnailUrl`), `UnitDefDto` — §5 | poza §6 (P5-0 §6.8: miniatura = osobna ścieżka renderera, D-UI-3/P4-5C); `UnitDefDto` §6.1 |
| `civBrandDisplay.ts` | `:6` `civsRaw from '../../data/civs.json'` | `:33` | `staticCatalog().civs` (leniwie, w funkcji) | §6.1 `civs` |
| `diplomacyAcceptanceBalance.ts` | `:5` `type AcceptanceSideBalance` | sygnatury | `AcceptanceSideBalanceDto` | **ROZSZ. Z10** (składnik `PnBalancePanelDto`) |
| | `:6` `bilateralTreatyDisplayPw, sideDisplayOfferPw` | `:201,206-207,903` | `PnBalancePanelDto.myOfferPn/theirOfferPn`; parametr `displayOfferPw` w `renderAcceptanceCompactHtml` | **ROZSZ. Z10** |
| | `:7-13` `formatRelationModLabel, pnDealAcceptedByAi, relationPnModPct, relationSignedFromTotal, treatyPwForRole` | `:85,107,121,704,765-767,793` | `RelationDealDto.{modPct,modLabel}`, `DiplomacyBasketPreviewDto.accepted`, `DiplomacyBasketPreviewDto.treatyPw.{my,their,base}` (r2; r1: `TreatyBalancePreviewDto.{playerPw,partnerPw}`), `.treatyGate.basketFair` | §6.6 `relation.{mod_pct,mod_label}`, `accepted`, `treaty_pw`; `treatyGate` = **ROZSZ. Z9** |
| | `:14` `diplomacyFairGivePn` | `:694,790` | `DiplomacyBasketPreviewDto.fairMinPn/balancePn` (handel i traktat) | §6.6 `fair_min_pn`, `balance_pn` |
| `techUnlockParse.ts` | `:20` `unitsData from '../../data/units.json'` | `:49` | `staticCatalog().units` (leniwie) | §6.1 `units` |
| `minimapHud.ts` | `:10` `FOG_EXPLORED_BRIGHTNESS from '../game/visibility'` | `:246` | `staticCatalog().constants.fogExploredBrightness` (leniwie) | §6.1 `constants.fog_explored_brightness` |
| `perfReport.ts` | `:4` `CIV_BUILD_STAMP from '../buildInfo'` | `:163` | `perfDiagnostics().buildStamp` | §6.17 (warunkowy, D-UI-7); `PerfDiagnosticsDto` = **ROZSZ. Z15** |
| | `:5` `type MapGenPhaseTimings`, `:8` `type SceneBuildTimings` | sygnatury | `MapGenPhaseTimingsDto`, `SceneBuildTimingsDto` | §6.17 (`SceneBuildTimings`/`MapGenPhaseTimings` → `PerfReportDto`) |
| | `:6` `MAP_GEN_PHASE_LABELS` | `:101` | `staticCatalog().constants.mapGenPhaseLabels` | **ROZSZ. Z11** (brak w §6.1 `constants`) |
| | `:7` `getRiverGenEnabled, getRiverGenPhase from '../map/riverGenSwitch'` | `:93-98` | lokalne `getRiverGenEnabled/Phase` = odczyt `perfDiagnostics()` | **ROZSZ. Z15** |
| `improvementBuildConfirm.ts` | `:5` `type ImprovementBuildImpact`, `:6` `formatImprovementBuildImpactList`, `:7` `improvementDisplayName` | `:40-44,48-49` | `ImprovementBuildImpactDto` (`newLabel`, `lines`); `removedList = impact.lines.join(', ')` | §6.7 `ImprovementBuildImpactDto.lines`; `newLabel` = **ROZSZ. Z13** |
| `mapLoadingOverlay.ts` | `:5` `MAP_GEN_PHASE_TOTAL from '../map/mapGenProgress'` | `:7,232` | źródło główne: parametr `phaseTotal` (= `MapGenProgressEvent.total`, kod bez zmian względem pinu: `phaseTotal ?? …`); tylko gdy wołający go nie poda — `staticCatalog().constants.mapGenPhaseTotal` | §6.16 `MapGenProgressEvent.total`; fallback = **ROZSZ. Z11 + Z16** |
| `saveLoadDialog.ts` | `:6-14` `listSaves, loadFromLocal, deleteLocal, getLastPlayedSlotId, uniqueSlotIdFromLabel, slotSlugFromLabel, FSA_SLOT_PREFIX, loadSaveSlotMeta, extractSaveContextFields, isIdbAvailable, type SaveGame, type SaveSlotMeta from '../game/save'` | `:53,128,196-256,350,468,480,508` | `SaveSlotsService` (`controller/saveSlots.ts`): `list()` → `SaveSlotsDto {slots, lastPlayed, autosaves, storageAvailable, diskSlotPrefix}`; `delete()`; `allocateSlotId()`; `SaveSlotMetaDto` | §6.15 `slots/last_played/autosaves/storage_available`, §7 `list_saves`/`delete_save`; `diskSlotPrefix` = **ROZSZ. Z6**; pola `SaveSlotMetaDto` i `allocate_save_slot` = **ROZSZ. Z14** |
| | `:15` `listFsaAutosaveFiles, loadFsaAutosaveFile from '../game/fsa-autosave'` | `:237,240` | `SaveSlotsDto.autosaves` | §6.15 `autosaves` |
| `victoryScreen.ts` | `:8` `type VictoryResult`, `:9` `PROG_DOMINACJI_POWER from '../game/victory'` | `:12,48,80` | `VictoryResultDto`; `staticCatalog().constants.progDominacjiPower` (leniwie) | §6.13 `VictoryResult`; próg: §6.1 `constants.prog_dominacji_power` (wybór źródła spośród §6.1/§6.13 — **Z17**) |

### 3a. Rejestr rozszerzeń kontraktu P5-0 §6 (r2, zarzut 1)

Metoda: każde pole/komenda użyte przez porty P5.2 sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6/§7 (gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, odczyt przez `git show`). Pola, których tam nie ma, są rozszerzeniem — każde z ZAŁOŻENIEM w §8. P5.2 NIE zmienia P5-0 (poza allowlistą); rozszerzenia do wchłonięcia przy rewizji P5-0 albo przy implementacji DTO w Rust.

| Pole / komenda (v2) | Najbliższa sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|
| `StaticCatalogDto.unitCategoryNameOnly` | §6.1 | `unit_category: map UnitTypeKey→Category` (jedna mapa) | ROZSZ. | Z2 |
| `constants.mapGenPhaseTotal` | §6.1 `constants`, §6.16 | `MapGenProgressEvent.total` (zdarzenie), brak stałej | ROZSZ. (tylko fallback) | Z11, Z16 |
| `constants.mapGenPhaseLabels` | §6.1 `constants`, §6.17 | brak | ROZSZ. | Z11 |
| `labels.powerHudLabelPl` | §6.1 `labels` | brak (lista `labels` bez etykiety Mocy) | ROZSZ. | Z11 |
| `RelationDealDto.tradeFairMult`, `.tradeParity` | §6.6 `relation: {total, signed, mod_pct, mod_label}` | 4 pola | ROZSZ. (+2 pola) | Z12 |
| `PnBalancePanelDto`, `AcceptanceSideBalanceDto` | §6.6 | brak DTO stołu negocjacji (wiele propozycji naraz) | ROZSZ. (nowy typ wyniku) | Z10 |
| `DiplomacyBasketPreviewDto.treatyGate` (`DiplomacyTreatyGateDto`) | §6.6 `DiplomacyBasketPreviewDto` dla `mode: treaty` | `treaty_pw`, `give_pn`/`receive_pn`, `balance_pn`, `accepted` | ROZSZ. (+1 blok, `null` poza `treaty`) — r2 zastąpił osobny `TreatyBalancePreviewDto` | Z9 |
| `ImprovementBuildImpactDto.newLabel` | §6.7 | `{ lines }` | ROZSZ. | Z13 |
| `SaveSlotsDto.diskSlotPrefix` | §6.15 | `{slots, last_played, autosaves, storage_available}` | ROZSZ. | Z6 |
| pola `SaveSlotMetaDto` (`slotId, label, tura, savedAt, mapSize, worldType, civId, unitsCount, citiesCount, seed, saveOrigin`) | §6.15 | sama nazwa typu, bez pól | ROZSZ. (dookreślenie) | Z14 |
| komenda `allocate_save_slot` | §6.15 („identyfikator slotu nadaje powłoka”), §7 | `list_saves`, `load_game`, `delete_save`; brak nazwanej komendy | ROZSZ. | Z14 |
| `PerfDiagnosticsDto` (`buildStamp`, przełącznik rzek) | §6.17 (warunkowy `PerfReportDto`, D-UI-7) | tylko czasy sceny/generatora | ROZSZ. | Z15 |
| `UnitDefDto`, `BuildingDefDto`, `CivDefDto`, `CivsCatalogDto` | §6.1 („zawartość JSON 1:1”) | sekcje katalogu bez typów wiersza | W KONTRAKCIE (typ = podzbiór wiersza JSON) | — |
| `constants.fogExploredBrightness`, `constants.progDominacjiPower`, `uiParams`, `units`, `civs`, `unitCategory` | §6.1 | są | W KONTRAKCIE | — |
| `DiplomacyBasketPreviewDto.{givePn, receivePn, fairMinPn, balancePn, accepted, treatyPw, relation.{total,signed,modPct,modLabel}}` | §6.6 | są | W KONTRAKCIE | — |
| `ImprovementBuildImpactDto.lines`, `VictoryResultDto`, `VictoryDto.progDominacjiPct`, `MapGenProgressEvent`, `MapGenPhaseTimingsDto`, `SceneBuildTimingsDto` | §6.7, §6.13, §6.16, §6.17 | są | W KONTRAKCIE | — |
| `controller/unitThumbnails.ts` (URL miniatury) | §6.8 (miniatura poza `UnitCardDto`), D-UI-3 | odesłanie do renderera | poza §6 (decyzja D-UI-3 z dispatchu) | — |

Bez zmian (pozostają importy czystych modułów skopiowanych w P5.1): `./brandTokenVars`, `./hudLayout`, `./minimapLayout`, `./escapeOverlayStack`, `./formatPl`.

## 4. Reguły gry → pola DTO (przegląd ręczny 15 plików, linia po linii)

### 4.1 Reguły usunięte z UI (liczy Rust)

Kolumna **P5-0** (r2, zarzut 1): sekcja kontraktu P5-0 (§6 DTO, §7 komendy); **ROZSZ. Zn** = rozszerzenie z rejestru §3a.

| Moduł | Reguła na pinie (`plik:linia`) | Pole DTO w v2 | P5-0 |
|---|---|---|---|
| `icons/brandAssets.ts`, `unitInfographic.ts` | klasyfikacja jednostki `categoryOf(nazwa, rola, isSuper, Typ)` (`:177`, `:98-99`; `units/setup.ts:239-303`) | `StaticCatalogDto.unitCategory[nazwa]`; bez wiersza `UnitDef`: `unitCategoryNameOnly[nazwa]` (web: `categoryOf(id,'',false,undefined)`) | §6.1 `unit_category`; `unitCategoryNameOnly` ROZSZ. Z2 |
| `power-labels.ts` | rozstrzygnięcie etykiety „Mocy” z `power-params.json` + domyślna (`:19`; `game/power-options.ts:39-48`) | `StaticCatalogDto.labels.powerHudLabelPl` | §6.1 `labels`; pole ROZSZ. Z11 |
| `diplomacyAcceptanceBalance.ts` | modyfikator Relacji `relationPnModPct(relationSignedFromTotal(rel))` (`:85,107,767`) | `RelationDealDto.modPct` | §6.6 `relation.mod_pct` |
| | etykieta modyfikatora `formatRelationModLabel(rel)` (`:121`) | `RelationDealDto.modLabel` | §6.6 `relation.mod_label` |
| | parytet handlu `rel >= 100` (`:87,109,112`) | `RelationDealDto.tradeParity` | ROZSZ. Z12 |
| | mnożnik uczciwej wymiany `100 / max(1, rel)` (`:88`) | `RelationDealDto.tradeFairMult` | ROZSZ. Z12 |
| | domyślna Relacja wiersza `side.relCurrent ?? my.relCurrent ?? 100` (`:140,633`) | `PnBalancePanelDto.relation.total` | ROZSZ. Z10 (reguła wyboru: Z7) |
| | wybór wiersza głównego stołu (`pickPrimaryNegotiationRow` `:183-192`) | `PnBalancePanelDto` (cały wynik) | ROZSZ. Z10 |
| | suma PW strony z traktatem dwustronnym (`balancePanelDataFromRow` `:194-217`: `bilateralTreatyDisplayPw` `:201`, `sideDisplayOfferPw` `:206-207`) | `PnBalancePanelDto.myOfferPn/theirOfferPn` | ROZSZ. Z10 |
| | które wiersze wymagają decyzji (`filterActionableNegotiationRows` `:220-226`) | wewnątrz `PnBalancePanelDto` (konsument `diplomacyAudience.ts` — przy jego porcie) | ROZSZ. Z10 |
| | **bramka przyjęcia pakietu** (`balancePanelDataFromRows` `:229-431`: suma PW pakietu, min `pwBalance`, `blockReason` `:321,323,367`, wyjątek pokoju `uiActionId === '10'` `:366`, `canAccept` `:379`, `unifiedPwBalance` `:376`, tryb pakietu `:389-399`, `statusLabel`, `accepted = net >= 0`) | `PnBalancePanelDto.{canAccept, responderPreview, theirBalance.balancePn/accepted/statusLabel/mode, myBalance.*, actionLabel, extraOnTable}` — **wymóg (r2):** `canAccept` liczy ta sama funkcja Rust co bramka komendy przyjęcia propozycji (komentarz pola w `v2:viewmodel/types.ts`, Z10) | ROZSZ. Z10; wymóg = analog §6.6 „`accepted` liczy ta sama funkcja Rust co bramka” |
| | koszyk handlu: `fairMin = diplomacyFairGivePn(recv, min(100, rel))` (`:694`), `balancePn` (`:700`), `previewFairMin` (`:701-703`), `accepted = fairnessPreview?.accepted ?? pnDealAcceptedByAi(...)` (`:704`) | `DiplomacyBasketPreviewDto.{fairMinPn, balancePn, accepted}` (Rust: ta sama funkcja co bramka) | §6.6 (`mode: trade`) |
| | koszyk traktatu: baza (`:764`), PW partnera/gracza `treatyPwForRole` (`:765-766`), modyfikator (`:767`), koszyk netto (`:768`), wyświetlane sumy (`:769-770`), bilans asymetryczny (`:771`), `relOk` (`:772`), `basketFairMin`/`basketFair` (`:789-793`), `accepted` (`:794`), `balancePn` (`:795`) | r2: `DiplomacyBasketPreviewDto` dla `mode: 'treaty'` — `treatyPw.{base, their, my}`, `relation.modPct`, `givePn`/`receivePn`, `accepted`, `balancePn` + `treatyGate.{basketNet, myDisplayPw, theirDisplayPw, relRequired, relOk, basketFair}` (r1: osobny `TreatyBalancePreviewDto`) | §6.6 (`mode: treaty`, `treaty_pw`); `treatyGate` ROZSZ. Z9 |
| | alias pokoju: `partnerTreatyPw = treatyBasePw` (`:882-892`) | `DiplomacyBasketPreviewDto.treatyPw.their` (Rust) | §6.6 `treaty_pw.their` |
| | PW karty kompaktowej `sideDisplayOfferPw(side, bilateralPw)` (`:903`) | parametr `displayOfferPw` (Rust) | ROZSZ. Z10 |
| `improvementBuildConfirm.ts` | nazwa ulepszenia `improvementDisplayName(key)` (`:48`; `game/terrain-improvements.ts:385-387`) | `ImprovementBuildImpactDto.newLabel` | ROZSZ. Z13 |
| | lista skutków `formatImprovementBuildImpactList(impact)` (`:49`; `map/improvement-build.ts:662-671`) | `ImprovementBuildImpactDto.lines` (UI łączy `', '`; harness: `lines.join(', ') == formatImprovementBuildImpactList` dla 96 przypadków — `true`) | §6.7 `lines` |
| `saveLoadDialog.ts` | odczyt metadanych + fallback pełnego parsowania starych zapisów (`:196-221`, fallback `:206-219`; `extractSaveContextFields`, `game/save.ts:230-…`) | `SaveSlotMetaDto` (Rust zwraca meta także dla starych zapisów) | §6.15 `slots`; pola ROZSZ. Z14 |
| | walidacja „ostatnio grane” (`game/save.ts:1034-1054`: wskaźnik musi dać się wczytać) | `SaveSlotsDto.lastPlayed` | §6.15 `last_played` |
| | identyfikator nowego slotu `uniqueSlotIdFromLabel` (`:350` → `game/save.ts:1088`) | `SaveSlotsService.allocateSlotId` (komenda `allocate_save_slot`) | §6.15 (id nadaje powłoka); komenda ROZSZ. Z14 |
| | usuwanie `deleteLocal` (`:508`) | `SaveSlotsService.delete` (`delete_save`) | §7 `delete_save` |
| `victoryScreen.ts` | próg dominacji `PROG_DOMINACJI_POWER` (`:48`) | `StaticCatalogDto.constants.progDominacjiPower` | §6.1 `constants.prog_dominacji_power` (alternatywa §6.13 `VictoryDto.prog_dominacji_pct` — wybór: Z17) |
| `minimapHud.ts` | jasność mgły `FOG_EXPLORED_BRIGHTNESS` (`:246`) | `StaticCatalogDto.constants.fogExploredBrightness` | §6.1 `constants.fog_explored_brightness` |
| `mapLoadingOverlay.ts` | liczba faz `MAP_GEN_PHASE_TOTAL` (`:7,232`) | źródło główne: `phaseTotal` = `MapGenProgressEvent.total`; fallback (wołający bez `phaseTotal`): `StaticCatalogDto.constants.mapGenPhaseTotal` | §6.16 `MapGenProgressEvent.total`; fallback ROZSZ. Z11, Z16 |

### 4.2 Pozostawione w UI — klasyfikacja GRANICZNY (do oceny Evaluatora)

Logika prezentacji nad polami DTO albo nad danymi UI; żadne nie zmienia stanu gry ani nie decyduje o legalności akcji.

| Moduł | Miejsce (v2 = pin, bez zmian) | Dlaczego zostało |
|---|---|---|
| `diplomacyAcceptanceBalance.ts` | `renderPnBalancePanelHtml` (pin `:561-676`): klasa koloru `balCls`, `treatyModeAccepted = canAccept ?? accepted`, wybór `netPw`, `centerLabel`, `hint`; `verdictHtml` (`:484-538`); `isIncomingBasketTradePanel` (`:454-458`); `resolveRelationPanelContext` (`:96-100`); `formatBalanceDelta`/`balanceHint` (`:433-452`) | odwzorowanie flag/liczb DTO (`canAccept`, `accepted`, `balancePn`, `mode`) na kolor i tekst; decyzja przyjęcia przychodzi z Rust. Alternatywa (gotowe `tone/hint/verdict` w DTO) — do decyzji przy porcie `diplomacyAudience.ts` |
| `leaderPortraits.ts` | fallback epoki portretu/imienia (`:195-225`), indeks puli imion `ownerIndex mod pool.length` (`:63-64`), dopasowanie etykiet cywilizacji (`:76-169`) | wybór zasobu graficznego/nazwy z danych katalogu; indeks właściciela podaje wołający |
| `techUnlockParse.ts` | parsowanie tekstu „Odblokowuje budynek” (`:28-38`), filtr `u.Tech === techName` (`:48-52`) | dane katalogu; docelowo `ResearchViewDto.techs[].unlockedUnits` (proponowane, przy porcie `sciencePicker.ts`/`techTreeView.ts`) |
| `unitInfographic.ts` | mapa kategoria → klasa walki/etykieta (`:62-95`) | słownik etykiet UI nad kategorią z DTO |
| `icons/brandAssets.ts` | dobór ikony budynku po `kategoria` (`:86-99`), surowca/terenu po podciągu (`:113-167`) | mapowanie danych → plik SVG (zasób UI) |
| `minimapHud.ts` | odwrócenie klik → heks (`:394-409`), paleta terenu (`:129-139`) | geometria/paleta panelu (P5-0: klik → `camera_focus(q,r)`); hit-test mapy głównej (UI-Q3=B) nie dotyczy minimapy-panelu |
| `saveLoadDialog.ts` | sortowanie `compareSaveSlotsDesc` (`:164-167`), pomijanie slotów `_…` (v2 `summarizeSaveSlots`), etykiety typu świata (`:29-34`) | kolejność/etykiety listy w UI |
| `perfReport.ts` | sumy ms i „niemierzone” (`:134-160`) | arytmetyka raportu diagnostycznego, nie reguła gry |
| `victoryScreen.ts` | `Math.round(powerShare*100)` (`:52,259`) | formatowanie liczby z DTO |

Pozostałe moduły (`uiParams.ts`, `civBrandDisplay.ts`, `improvementBuildConfirm.ts`, `mapLoadingOverlay.ts`, `power-labels.ts`, `unitMiniPreview.ts`): po przeglądzie brak reguł gry wpisanych bez importu.

## 5. Moduły wymagające renderu 3D (D-UI-3, D-UI-7) — rozstrzygnięcia tymczasowe orkiestratora

| Moduł | Decyzja (dispatch) | Realizacja w v2 | Co tracimy / NIE_ZMIERZONO |
|---|---|---|---|
| `unitMiniPreview.ts` | D-UI-3: miniatura = obraz z Rust; atrapa = pusty placeholder o tym samym rozmiarze | `controller/unitThumbnails.ts` (`installUnitThumbnailProvider`, domyślnie `null`); gdy URL jest — `<img width=80 height=80 class="unit-mini-canvas">`, gdy brak — `<span data-thumb="placeholder" class="unit-mini-canvas">` 80×80 px. Zachowane: `mountUnitMiniPreview`, `defaultOwnerColor` (`0x3b7dd8`), klasy `unit-mini-preview`/`unit-mini-loading`/`unit-mini-fallback`, kolejka `requestAnimationFrame` | pin: `<canvas class="unit-mini-canvas">` z renderem WebGL; v2: placeholder → **różnica DOM zamierzona** (canvas → span/img). Komenda Rust dostarczająca obraz (P4-5C): `NIE_ZMIERZONO` |
| `perfReport.ts` | D-UI-7: tylko typy/struktura, bez sond WebGL; „przeprojektować pod Rust” | pin nie ma sond WebGL — ma tylko typy `MapGenPhaseTimings`/`SceneBuildTimings` i stan `buildInfo`/`riverGenSwitch`; w v2 typy jako DTO, stan z `PerfDiagnosticsDto` (MOCK). Tekst raportu, chip i modal — bajtowo jak pin (harness 37/0) | skąd Rust weźmie czasy sceny (renderer Rust ≠ `render/scene.ts`): `NIE_ZMIERZONO`; nazwy pól sceny zostają webowe do decyzji D-UI-7 |

## 6. Harness porównania DOM (`tools/dom-harness/`)

**Zależności (uzasadnienie):** `jsdom@29.1.1` — **ta sama wersja**, którą pin ma w `gra/package-lock.json` (`node_modules/jsdom` `"version": "29.1.1"`), wyłącznie `devDependencies`, używany tylko przez `tools/dom-harness/` (nie trafia do bundla: `04-vite-build.log`); wymaga Node `^20.19 || ^22.13 || >=24` (środowisko: Node `v22.22.0`). `esbuild@0.21.5` — **jawne** podanie wersji, którą `vite@5.4.21` już instaluje (`package-lock.json` przed i po: `node_modules/esbuild` = `0.21.5`; brak nowej paczki). Lockfile: 59 → 97 pakietów (+38 = `jsdom` i jego zależności).

**Metoda** (`tools/dom-harness/run.mjs`, nagłówek pliku): pin rozpakowany `git archive edb8fb56 gra/src gra/data` do scratch; oba drzewa pakowane `esbuild` z identyczną emulacją Vite (`?raw`, `import.meta.glob` — obrazy jako `data:` z bajtów pliku) (`build.mjs`); strona pin dostaje atrapę `three` (`three-stub.cjs`), bo `map/improvement-build.ts` → `render/improvements.ts` ładuje `three` przy ewaluacji; wspólny jsdom, zamrożony `Date`, deterministyczne URL-e `blob:`; **ODPOWIEDNIKI danych**: `StaticCatalogDto` i DTO (dyplomacja, ulepszenia, zapisy) zbudowane w harnessie z danych pinu (`<pin>/gra/data/*.json` czytane w czasie działania) i funkcji pinu (`categoryOf`, `relationPnModPct`, `diplomacyFairGivePn`, `pnDealAcceptedByAi`, `treatyPwForRole`, `sideDisplayOfferPw`, `balancePanelDataFromRows`, `improvementDisplayName`, `loadPowerOpcje`, stałe) — harness gra rolę Rust. Porównanie: kanoniczna serializacja całego `document.documentElement` (znacznik + **wszystkie** atrybuty posortowane, w tym `class` i `style`, + tekst dokładnie) albo równość JSON wartości zwracanych.

**Wyniki** (`05-dom-harness.log`, EXIT=0): `modułów=15 przypadków=3861 różnic=0 kolizji_kategorii=0 jsdomErrors=0`.

| Moduł | Przypadki | Różnice | Uwagi |
|---|---:|---:|---|
| `icons/brandAssets.ts` | 814 | 0 | wszystkie ikony manifestu × 3 rozmiary, 42 budynki, 75 jednostek (z wierszem i bez), mapy civ/epok/ustawień/ulepszeń/surowców, CSS |
| `leaderPortraits.ts` | 888 | 0 | portrety (bajty JPG jako `data:`), imiona, pule, dopasowania etykiet |
| `uiParams.ts` | 1 | 0 | `UI_PARAMS` (JSON) |
| `unitInfographic.ts` | 455 | 0 | + DOM `ensureUnitInfographicStyles` |
| `power-labels.ts` | 10 | 0 | + 3/3 asercje v2 (etykieta z `labels.powerHudLabelPl`, bo w danych pinu = domyślna „Moc”) |
| `unitMiniPreview.ts` | 0 | — | `NIE_ZMIERZONO` (pin = WebGL); 4/4 asercje struktury v2 |
| `civBrandDisplay.ts` | 108 | 0 | |
| `diplomacyAcceptanceBalance.ts` | 1245 | 0 | wiersz Relacji 22, koszyk handlu 751, traktat 384, pokój 32, stół negocjacji 15 scenariuszy (w tym 2 dające `null`; +2×13 pochodnych), karta kompaktowa 13, tooltipy 2 (suma 1245) |
| `techUnlockParse.ts` | 67 | 0 | 32 technologie + nieznana |
| `minimapHud.ts` | 3 | 0 | DOM + pełny log wywołań kontekstu 2D (rejestrator; 16 ustawień `globalAlpha` w logach) |
| `perfReport.ts` | 37 | 0 | tekst raportu × 4 ustawienia rzek, nazwy plików, chip, modal |
| `improvementBuildConfirm.ts` | 96 | 0 | (22 klucze ulepszeń z `terrain-improvements.json` + 2 nieznane) × 4 skutki |
| `mapLoadingOverlay.ts` | 48 | 0 | 4 tryby × 5 wywołań `setProgress` × błąd/bez; `formatCaughtError`; `hide()` |
| `saveLoadDialog.ts` | 17 | 0 | zapis/wczytanie: pusto i 3 sloty (kontrola: 3/3 wiersze w DOM), podsumowania, sortowanie |
| `victoryScreen.ts` | 72 | 0 | 3 rodzaje × 4 zestawy statystyk |

**Czułość** (`06-harness-mutations.log`, `tools/dom-harness/mutate.mjs`): 14 mutacji v2 (tekst, kolejność epok, mapa kategorii bez wiersza, klasa, liczba faz, stempel, wiersz FSA, mgła minimapy, odwrócona akceptacja traktatu, próg fair min, etykieta Mocy, nazwa ulepszenia, próg dominacji, filtr technologii) → **14/14 wykrytych** (EXIT=1), pliki przywrócone bajtowo (asercja w skrypcie).

**NIE_ZMIERZONO (harness):** (1) `unitMiniPreview.ts` vs pin — pin wymaga WebGL; (2) rastrowanie minimapy — porównany log wywołań 2D, nie piksele; (3) `saveLoadDialog.ts`: zapisy z dysku (FSA) i niepuste „ostatnio grane” (jsdom bez File System Access API; pin waliduje `lastPlayed` pełnym wczytaniem zapisu) — porównano `autosaves=[]`, `lastPlayed=null`; (4) akcje użytkownika (kliknięcia usuń/wczytaj/zapisz, `onMinimapClick`) — nie klikane; (5) wszystko w realnym WebView/Tauri — nie uruchamiane.

## 7. Uruchomienie bram (odtworzenie)

```bash
cd src-tauri/frontend-v2
npm ci && npx tsc --noEmit && npm run check && npx vite build
git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
node tools/dom-harness/run.mjs --pin-dir <PIN_DIR>      # EXIT 0 ⇔ 0 różnic
node tools/dom-harness/mutate.mjs --pin-dir <PIN_DIR>   # EXIT 0 ⇔ każda mutacja wykryta
rm -rf node_modules dist
```

## 8. ZAŁOŻENIA

- **P5.2-Z1 (kolejność startu):** `StaticCatalogDto` jest instalowany przed ewaluacją paneli. Dwa moduły czytają katalog przy ewaluacji (jak pin czytał JSON przy imporcie): `leaderPortraits.ts`, `uiParams.ts`; pozostałe — leniwie w funkcjach. `main.ts` instaluje katalog, potem `await import('./ui/portLevel0')`. Odczyt przed instalacją rzuca jawny błąd (`controller/staticCatalog.ts`).
- **P5.2-Z2 (kategorie jednostek):** Rust podaje dwie mapy: `unitCategory` (z pełnym wierszem `UnitDef`) i `unitCategoryNameOnly` (web `categoryOf(id,'',false,undefined)` dla wywołań bez wiersza, np. `unitIconSvg(undefined, u.Jednostka)` w `techDiscoveryNotice.ts:386`). Nazwa spoza katalogu → `'domyslny'` (web klasyfikowałby po słowach nazwy). Harness: 0 kolizji nazw w `units.json`; mutacja M3 dowodzi, że rozróżnienie map jest potrzebne (7 różnic bez niego).
- **P5.2-Z3 (zasoby UI ≠ dane gry):** `icons/brand/**` (SVG/CSS/mapy ikon) i `assets/portrety/*.jpg` skopiowane bajtowo z pinu (manifest sha256 + SHA-1 blobów `git ls-tree`); to zasoby wyglądu UI, nie dane `gra/data/**` (D-UI-4 dotyczy danych).
- **P5.2-Z4 (API konsumentów):** zmiany sygnatur (§2, PORTING-QUEUE „Zmiana API”) są dozwolone, bo jedynymi konsumentami są moduły z kolejki, które przy swoim porcie i tak przechodzą na DTO.
- **P5.2-Z5 (`ImprovementBuildImpactDto.lines`):** UI łączy linie `', '` (formatowanie, jak `formatImprovementBuildImpactList`); `newKey` zostaje w sygnaturze (`_newKey`) dla zgodności wywołań.
- **P5.2-Z6 (`SaveSlotsDto.diskSlotPrefix`):** prefiks zapisów z dysku (web `FSA_SLOT_PREFIX = 'fsa:'`) przychodzi z DTO; etykieta „(dysk)” dokleja UI jak web.
- **P5.2-Z7 (`RelationDealDto` w `PnBalancePanelDto`):** relacja wiersza głównego liczona w Rust z tą samą regułą wyboru co web (`their.relCurrent ?? my.relCurrent ?? 100`).
- **P5.2-Z8 (`portLevel0.ts`):** moduł-zbiór wyłącznie po to, by `vite build` kompilował 15 modułów; nie montuje paneli (wiązanie z ekranem gry — kolejne tematy).

Rozszerzenia kontraktu P5-0 §6 (r2, zarzuty 1–3; rejestr §3a). Każde jest **propozycją do rewizji P5-0**, nie zmianą P5-0.

- **P5.2-Z9 (dyplomacja: traktat w tym samym DTO co handel — zarzut 2):** P5-0 §6.6 przewiduje jeden wynik `diplomacy_preview_basket { mode: trade|gift|treaty }` → `DiplomacyBasketPreviewDto`. W r2 kod się do tego stosuje: osobny `TreatyBalancePreviewDto` z r1 jest **usunięty**; `renderPnBalancePanelForTreaty`/`ForPeace` przyjmują `DiplomacyTreatyBasketPreviewDto` = `Pick<DiplomacyBasketPreviewDto, givePn|receivePn|balancePn|accepted|relation|treatyPw>` + niepusty `treatyGate`. PW gracza/partnera/bazy czytane z `treatyPw.{my,their,base}` (pole P5-0). Rozszerzeniem jest tylko blok `treatyGate: DiplomacyTreatyGateDto | null` (`basketNet, myDisplayPw, theirDisplayPw, relRequired, relOk, basketFair`) — wartości, które web liczył w UI (`:768-793`), a których P5-0 §6.6 nie nazywa. Rust wypełnia go tylko dla `mode: 'treaty'`. Alternatywa (do rewizji P5-0): dopisać te pola wprost do §6.6.
- **P5.2-Z10 (dyplomacja: stół negocjacji — zarzut 2):** `PnBalancePanelDto` (+ `AcceptanceSideBalanceDto`) to wynik **innego** zapytania niż podgląd koszyka: bilans wielu propozycji już leżących na stole (pin `balancePanelDataFromRows` `:229-431`), a P5-0 §6.6 opisuje jeden koszyk budowany przed wysłaniem. Dlatego zostaje osobnym typem (proponowane zapytanie `diplomacy_table_balance`, `NIE_ZMIERZONO` w silniku). **Wymóg** dopisany w r2 (komentarz pola `PnBalancePanelDto.canAccept`, `v2:viewmodel/types.ts`): `canAccept` liczy **ta sama funkcja Rust co bramka komendy przyjęcia propozycji** — analogicznie do wymogu P5-0 §6.6 dla `accepted`; UI nie może pokazać „można przyjąć” dla pakietu, który silnik odrzuci.
- **P5.2-Z11 (stałe i etykiety katalogu spoza P5-0 §6.1):** `constants.mapGenPhaseTotal`, `constants.mapGenPhaseLabels`, `labels.powerHudLabelPl`. Pin czytał je jako stałe modułów `map/mapGenProgress.ts:6,16-27` i `game/power-options.ts:39-48`; P5-0 §6.1 ich nie wymienia. Do dopisania w §6.1 przy rewizji.
- **P5.2-Z12 (`RelationDealDto.tradeFairMult`, `.tradeParity`):** P5-0 §6.6 `relation` ma `{total, signed, mod_pct, mod_label}`. Dwa pola dodane, bo pin liczył je w UI (`:87-88,109,112`: `100 / max(1, rel)`, `rel >= 100`). Bez nich UI musiałby wykonać regułę parytetu.
- **P5.2-Z13 (`ImprovementBuildImpactDto.newLabel`):** P5-0 §6.7 ma tylko `lines`; nazwa nowego ulepszenia (pin `improvementDisplayName`, `:48`) to odczyt danych przez funkcję `game/**`, więc przychodzi z Rust.
- **P5.2-Z14 (zapisy: pola `SaveSlotMetaDto` i komenda `allocate_save_slot`):** P5-0 §6.15 nazywa `SaveSlotMetaDto` bez pól i mówi „identyfikator slotu nadaje powłoka”, bez nazwy komendy. Pola = web `SaveSlotMeta` (`game/save.ts:214-227`) + `slotId`; komenda nazwana `allocate_save_slot` (`v2:controller/commands.ts`).
- **P5.2-Z15 (`PerfDiagnosticsDto`):** P5-0 §6.17 przewiduje warunkowo tylko `PerfReportDto` z czasami. Stempel builda i przełącznik rzek (pin `buildInfo.ts`, `map/riverGenSwitch.ts`) to stan diagnostyczny spoza czasów; dostarcza go atrapa MOCK do decyzji D-UI-7.
- **P5.2-Z16 (`mapLoadingOverlay.ts`: źródło liczby faz — zarzut 3):** źródłem jest `MapGenProgressEvent.total` (P5-0 §6.16, `PORTING-QUEUE.md` wiersz 13). Kod realizuje to bez zmian względem pinu: `setProgress(faza, pct, phaseNum?, phaseTotal?)` liczy `const total = phaseTotal ?? …` (pin `:232`, v2 `:230`). Wołający przekazuje `event.total` jako `phaseTotal`; tak robi pin we wszystkich wywołaniach z callbacku generatora (`gra/src/main.ts:37007,37114,37442,37459,37720,37945` na pinie: `loading.setProgress(faza, pct, phaseNum, phaseTotal)`). Jedyne wywołanie pina bez `phaseTotal` (`main.ts:36933-36936`, postęp sceny) nie podaje też `phaseNum`, więc prefiks `n/total` jest pusty i `total` nie jest użyty. `constants.mapGenPhaseTotal` (Z11) to wyłącznie wartość zapasowa na wypadek wywołania z `phaseNum`, ale bez `phaseTotal`. Zastępuje pinową stałą `MAP_GEN_PHASE_TOTAL` i zachowuje API oraz DOM (harness 48/0, mutacja M5 wykryta). Kodu nie zmieniam: usunięcie fallbacku zmieniłoby sygnaturę/DOM względem pinu dla `phaseTotal === undefined`.
- **P5.2-Z17 (`victoryScreen.ts`: źródło progu dominacji — zarzut 3):** P5-0 podaje **dwa** źródła. §6.1 ma `constants.prog_dominacji_power` i wymienia `victoryScreen.ts` wśród konsumentów `StaticCatalogDto`. §6.13 ma `VictoryDto = VictoryResult + prog_dominacji_pct`. `PORTING-QUEUE.md` wiersz 15 wskazywał tylko §6.13. Wybór: katalog (§6.1). Powód: pin czyta próg jako stałą modułu ustaloną przy ładowaniu (`game/victory.ts:35` `PROG_DOMINACJI_POWER = eStartProgDominacjiPower()`, `data/e-start-params-loader.ts:137`), niezależną od wyniku gry. API pina `formatVictorySubtitle(rodzaj, stats)` też nie dostaje wyniku z progiem, więc jego zmiana wymagałaby zmiany sygnatury. `VictoryDto.progDominacjiPct` zostaje w `types.ts` (P5.1) dla wiązania ekranu z silnikiem; obie wartości muszą pochodzić z jednego parametru Rust (`pct = round(power·100)`). Wiersz 15 `PORTING-QUEUE.md` zaktualizowany w r2.

## 9. NIE_ZMIERZONO (zbiorczo)

1. Zachowanie w realnym WebView/oknie Tauri (nic nie uruchamiano; `tauri.conf.json` bez zmian).
2. Komendy/zapytania Rust, które dostarczą nowe DTO (`get_view staticCatalog`, `diplomacy_table_balance`, podgląd koszyka/traktatu, `list_saves`/`delete_save`/`allocate_save_slot`, obraz miniatury P4-5C, diagnostyka D-UI-7) — dziś tylko atrapa MOCK i harness.
3. Kolejność kluczy `mapGenPhaseLabels` po serializacji z Rust (wymaga mapy z zachowaniem kolejności po stronie Rust).
4. Pozycje z §6 „NIE_ZMIERZONO (harness)”.
5. Reguły bez importu w modułach POZA poziomem 0 — bez zmian względem `PORTING-QUEUE.md` (przegląd przy porcie każdego modułu).

## 10. Allowlista, Git, sprzątanie

- Zmienione/nowe ścieżki: wyłącznie `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` w commicie), `dyspozycje/rust-port/p5/P5-2-PORT-LEVEL0.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/**`. Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**` (kontrola: `git status --short` / `git diff --cached --name-only` w raporcie `01-operator-r1.md`).
- `git diff --cached --check`: pierwsze wywołanie zgłosiło wyłącznie artefakty `r1-logi/diffs/*.diff` (linie kontekstu `diff -u` dla pustych wierszy źródła); po `dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/.gitattributes` (`r1-logi/diffs/*.diff -whitespace`, precedens P5.1 `.gitattributes` dla `techIcons.ts`) → EXIT=0. Pliki `src/**` i `tools/**` bez zgłoszeń.
- `node_modules` i `dist` usunięte po bramach (`10-cleanup.log`). Commit w worktree jawnym `git add <ścieżki>` (bez `-A`; logi `git add -f`), bez push.

## 11. Surowe logi (`dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/r1-logi/`)

`01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log`, `05-dom-harness.log` (+ `05-dom-harness.json`), `06-harness-mutations.log`, `07-gate-calibration-pin-level0.log`, `08-gate-v2-level0.log`, `09-diff-stat.log`, `10-cleanup.log` — każdy kończy się `EXIT=<kod>`; `diffs/*.diff` — 15 diffów pin → v2.

Runda 2 (obrona): `dyspozycje/autobot/runs/R-RUSTPORT-P5-2-PORT-LEVEL0-Q1/r2-logi/` — `01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log`, `05-dom-harness.log`, `06-harness-mutations.log`, `07-cleanup.log` (każdy kończy się `EXIT=<kod>`), `diffs/diplomacyAcceptanceBalance.ts.diff` (jedyny moduł zmieniony w r2). Pozostałe 14 diffów z r1 bez zmian.

## 12. Rejestr zmian r2 (odpowiedzi na zarzuty Evaluatora r1, `02-evaluator-r1.md`)

| Zarzut | Odpowiedź | Zmiana | Dowód |
|---|---|---|---|
| 1. Reguły/pola niepowiązane z P5-0 §6; rozszerzenia bez ZAŁOŻENIA | **PRZYJMUJĘ** | kolumna „P5-0 §6” w §3 i „P5-0” w §4.1; nowy §3a (rejestr: 12 rozszerzeń + pola w kontrakcie); ZAŁOŻENIA Z9–Z17 w §8 (Z2, Z6 z r1 przypisane do odpowiednich pól). Wszystkie pola z listy Evaluatora mają wiersz w §3a i ZAŁOŻENIE | §3, §3a, §4.1, §8 |
| 2. Dyplomacja: dwa typy zamiast jednego `DiplomacyBasketPreviewDto` z `mode=treaty`; brak wymogu dla `canAccept` | **PRZYJMUJĘ** (kod + dokument) | `TreatyBalancePreviewDto` usunięty; traktat = `DiplomacyBasketPreviewDto` (`treatyPw.{my,their,base}`, `givePn/receivePn`, `accepted`, `balancePn`, `relation`) + rozszerzenie `treatyGate` (Z9); `PnBalancePanelDto` pozostaje jako osobny wynik stołu negocjacji, z uzasadnieniem (Z10) i wymogiem „`canAccept` = ta sama funkcja Rust co bramka przyjęcia” w komentarzu pola | `v2:viewmodel/types.ts` (`DiplomacyTreatyGateDto`, `DiplomacyBasketPreviewDto.treatyGate`, `DiplomacyTreatyBasketPreviewDto`, `PnBalancePanelDto.canAccept`); `v2:ui/diplomacyAcceptanceBalance.ts` (`renderPnBalancePanelForTreaty`/`ForPeace`); `tools/dom-harness/run.mjs` (`treatyDto`); `r2-logi/05-dom-harness.log` (`diplomacyAcceptanceBalance.ts przypadki=1245 różnice=0`; całość 3861/0), `r2-logi/06-harness-mutations.log` (14/14, M9 „akceptacja traktatu odwrócona” wykryta: 416 różnic) |
| 3a. `mapLoadingOverlay`: kod czyta stałą katalogu zamiast `MapGenProgressEvent.total` | **PRZYJMUJĘ częściowo** (dokument, `PORTING-QUEUE`), **ODRZUCAM** tezę, że kod pomija `MapGenProgressEvent.total` | kod bez zmian: `total = phaseTotal ?? fallback` (pin `:232` = v2 `:230`), wołający przekazuje `event.total` jako `phaseTotal` (pin `main.ts:37007,37114,37442,37459,37720,37945`); stała katalogu tylko jako fallback — ZAŁOŻENIE Z16, rozszerzenie Z11; `PORTING-QUEUE.md` wiersz 13 doprecyzowany | §3, §4.1, §8 Z16; harness `mapLoadingOverlay.ts 48/0`, M5 wykryta |
| 3b. `victoryScreen`: kod czyta `constants.progDominacjiPower` zamiast `VictoryDto.prog_dominacji_pct` | **PRZYJMUJĘ** brak ZAŁOŻENIA (dodane Z17, `PORTING-QUEUE.md` wiersz 15), **ODRZUCAM** tezę, że P5-0 wskazuje tylko `VictoryDto` | P5-0 §6.1 wymienia `constants.prog_dominacji_power` i `victoryScreen.ts` jako konsumenta `StaticCatalogDto`; §6.13 ma `VictoryDto.prog_dominacji_pct` — P5-0 podaje oba źródła. Wybór §6.1 uzasadniony w Z17 (stała modułu pina `game/victory.ts:35`, sygnatura `formatVictorySubtitle` bez wyniku); kod bez zmian | §8 Z17; harness `victoryScreen.ts 72/0`, M13 wykryta |

Uwagi Evaluatora bez wpływu na werdykt (nieadresowane w r2, bez zmiany kodu): wielokrotne `list()` w `saveLoadDialog` przy odświeżeniu, nieaktualny nagłówek `unitMiniPreview.ts:2`, zmiana zachowania Z2 dla nazw spoza katalogu — pozostają do rundy portu konsumentów (nie zmieniają DOM w harnessie).
