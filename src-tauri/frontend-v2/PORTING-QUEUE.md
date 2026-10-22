# PORTING-QUEUE — moduły `gra/src/ui/**` NIE skopiowane w P5.1

**Temat:** `R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1` (runda 1/5, akapit „Reguły wpisane bez importu” uzupełniony w rundzie 2/5) · **Pin web:** `edb8fb56` · **Źródło klasyfikacji:** `P5-0-VIEWMODEL-CATALOG.md` §3 (49 modułów) + graf importów tego tematu (`dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r1-pomiar/`).

Reguła nadrzędna **P5.13**: UI nie liczy reguł gry. Moduł trafia do `frontend-v2/src/ui/` dopiero, gdy każdy jego import logiki (`game|map|units|battle|render|data`, `three`, a także `types|audio|perf|util` i `buildInfo` spoza `ui/` — po rundzie 2 wszystkie te formy łapie `npm run check`) zostanie zastąpiony polem DTO (`src/viewmodel/types.ts`) albo komendą kontrolera (`src/controller/`), a `npm run check` daje 0 trafień.

## Status P5.2 (`R-RUSTPORT-P5-2-PORT-LEVEL0-Q1`, runda 1/5 + obrona r2)

Moduły **poziomu 0** (wiersze 1–15 tabeli niżej) są **przeniesione** do `src/ui/` — importy logiki/danych zastąpione `viewmodel/types.ts` (DTO), `controller/*` (atrapa MOCK) i `StaticCatalogDto` (`controller/staticCatalog.ts`). Szczegóły (diff vs pin, import → DTO, reguła → pole DTO, harness DOM): `dyspozycje/rust-port/p5/P5-2-PORT-LEVEL0.md`. Po P5.2 w kolejce zostaje **68** modułów (34 BEZPOŚREDNIE + 34 PRZECHODNIE); poziom 1 jest teraz odblokowany w części zależnej od modułów 1–15 (np. `icons/iconRegistry.ts`, `mapUnitHudSkin.ts`, `diploUiSkin.ts` — każdy nadal wymaga przeglądu reguł bez importu).

**Zmiana API względem pinu (dla konsumentów z kolejki):** `diplomacyAcceptanceBalance.ts` nie eksportuje już `pickPrimaryNegotiationRow`, `balancePanelDataFromRow`, `filterActionableNegotiationRows`, `balancePanelDataFromRows`, `NegotiationBalanceSource` (reguły → Rust: `PnBalancePanelDto`); `renderPnBalancePanelFromBasket`/`ForTreaty`/`ForPeace`/`renderRelationDealModRowHtml`/`renderAcceptanceCompactHtml` przyjmują DTO (r2: `ForTreaty`/`ForPeace` przyjmują `DiplomacyBasketPreviewDto` dla `mode: 'treaty'` z blokiem `treatyGate` — jeden typ wyniku `diplomacy_preview_basket` jak P5-0 §6.6; osobny `TreatyBalancePreviewDto` z r1 usunięty); `saveLoadDialog.ts` nie eksportuje `slotIdFromLabel`, a `saveContextLine` przyjmuje pola `SaveSlotMetaDto`; `improvementBuildConfirm.ts` przyjmuje `ImprovementBuildImpactDto`. Konsumenci (`diplomacyAudience.ts`, `diplomacyTradeBasket.ts`, `main.ts`) muszą to uwzględnić przy swoim porcie.

## Status P5.3 (`R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1`, runda 1/5)

Moduły **poziomu 1 bez cyklu** — wiersze 18, 21, 26, 27, 28, 31, 33 (BEZPOŚREDNIE) oraz 34, 36–44 (PRZECHODNIE) — są **przeniesione** do `src/ui/` (17/17; żaden moduł z zakresu nie został pominięty — każdy zależy wyłącznie od modułów już w `frontend-v2`). Poza zakresem tej rundy (dispatch): cykl C4 (wiersze 16, 17, 19, 20, 22–25, 35, 45), `newGameFlow.ts` (29), `perfTestPanel.ts`/`sceneTimingReport.ts` (30, 32 — D-UI-7) oraz wiersze 46–53 (PRZECHODNIE poziomu 1 spoza listy dispatchu). Szczegóły (diff vs pin, import → DTO, reguła → pole DTO, harness DOM `tools/dom-harness/run-level1a.mjs`): `dyspozycje/rust-port/p5/P5-3-PORT-LEVEL1A.md`. Po P5.3 w kolejce zostaje **51** modułów (27 BEZPOŚREDNICH + 24 PRZECHODNICH).

10 plików przeniesiono jako **kopie bajtowe** pinu (0 importów logiki; wpisane do `tools/pin-manifest.json`, sprawdzane przez `npm run check`): `diploUiSkin.ts`, `icons/iconRegistry.ts`, `mapUnitHudSkin.ts`, `armyMergePanel.ts`, `icons/wikiBookIcon.ts`, `powerOverlayHud.ts`, `bottomBarHud.ts`, `cityListHud.ts`, `empireOverlayHud.ts` oraz `gra/src/battle/battleHudTheme.ts` → `src/ui/battleHudTheme.ts` (stałe wyglądu bitwy dla `postBattleSummary.ts`; P5-0 §6.13: „kopia w frontendzie, klasa X”).

**Zmiana API względem pinu (dla konsumentów z kolejki — P5.3):** `unitCardStatus.ts` — `UnitCardStatusInput` wymaga `badges: UnitCardBadgesDto` (poziomy ścieżek i gwiazdki weterana z Rust; konsumenci: `armyStackHud.ts`, `contextPanelHud.ts`, `hexContextTooltip.ts`, `unitPanelHud.ts`); `diplomacyDealDisplay.ts` — funkcje stołu przyjmują `NegotiationDealSidesDto | null` zamiast `(payload, incoming)` (konsumenci: `diplomacyAudience.ts`, `diplomacyTradeBasket.ts`); `orderPanel.ts` — `OrderState.tierUi` wymagane, `orderTierUi` czyta pole (konsument: `cityPanel.ts`); `unitRecruitCard.ts` — `item: ProductionItemDto` (`label` zamiast `nazwa`), nowe wymagane `affordable` (konsument: `cityPanel.ts`); `siegeMapPanel.ts` — `showSiegeMapPanel(panel: SiegePanelDto, …)`, `updateSiegeMapPanelTurn(turn, panel?: SiegePanelDto)`; `cityAttackChoice.ts` — `MapSiegeContextDto`; `postBattleSummary.ts` — `BattleSummaryDto`, hak `window.__postBattleSummaryTestDebug` bez `build`; `armyListHud.ts` — `ArmyListEntry.status: ArmyUnitStatusDto | null` wymagane (konsument: `hud.ts`).

## Skład (117 plików `.ts` w `gra/src/ui` na pinie)

| Zbiór | Liczba | Status |
|---|---:|---|
| **BEZPOŚREDNI** — sam importuje logikę/dane (zbiór 1:1 z P5-0 §3: 49 plików; kontrola: `r1-logi/05-gate-calibration-pin.log`, `plików_z_trafieniami=49`) | 49 | w kolejce (niżej) |
| **PRZECHODNI** — 0 własnych importów logiki, ale importuje moduł z kolejki (np. `icons/brandAssets.ts` → `categoryOf` z `units/**`). Skopiowanie go teraz złamałoby `tsc` (brak modułu) albo wymagałoby skopiowania modułu z logiką | 34 | w kolejce (niżej) |
| **CZYSTY** — 0 importów logiki w domknięciu przechodnim | 34 | **skopiowane** w P5.1 (tabela sha256 w `P5-1-UI-SHELL-SKELETON.md` §3) |

**ZAŁOŻENIE P5.1-Z1:** „plik niezależny od logiki” = brak importu logiki w **domknięciu przechodnim** importów, nie tylko w samym pliku. P5-0 §10 pkt 2 mówi o „68 plikach bez importów logiki” — to liczba bezpośrednia (117 − 49); przechodnio czystych jest 34.

## Kolejność

Kolumny: **Poziom** = długość najdłuższego łańcucha zależności UI z kolejki (po zwinięciu cykli; poziom 0 = zależy tylko od czystych modułów już w `frontend-v2`). Moduł z poziomu *n* można przenieść, gdy wszystkie z kolumny „Blokujące” są przeniesione. **Cykl** = grupa silnie spójna importów (Tarjan) — przenosić razem. Kolejność wewnątrz poziomu: najpierw BEZPOŚREDNIE, potem wg liczby zależnych modułów malejąco. „Importy logiki”: `data` = `gra/src/data/**`, `gra/data` = JSON z `gra/data/**`. Kolumny „Klasy” i „DTO” cytowane z P5-0 §3.1/§3.2.

**Wskazówka planistyczna (nie decyzja):** `icons/brandAssets.ts` (poz. 1) blokuje bezpośrednio 46 modułów kolejki; jego jedyna logika to `categoryOf` (`units/**`) i dane (`src/data/**`) → `StaticCatalogDto.unitCategory`. Przeniesienie go jako pierwszego odblokowuje większość modułów PRZECHODNICH (przy D-UI-4: dane statyczne tylko jako ten sam plik). Zasoby, które wnosi: `icons/brand/**` (JSON/CSS/SVG przez `import.meta.glob('./brand/**/*.svg')`, `brandAssets.ts:23`); `leaderPortraits.ts:172` wnosi `gra/src/assets/portrety/*.jpg`; `mainMenu.ts`/`newGameFlow.ts` — `ui/assets/hero/*.png`.

**Reguły wpisane bez importu** (brama ich nie wykrywa; P5-0 §9 pkt 3).

- W kolejce (z P5-0, przegląd ręczny przy porcie każdego modułu): `cityPanel.ts:3228-3229`, `cityPanel.ts:645-720`. Pozostałe moduły kolejki: `NIE_ZMIERZONO`.
- **P5.3** (przegląd linia po linii 17 modułów, tabela w `P5-3-PORT-LEVEL1A.md` §4): `siegeMapPanel.ts:219-223` → `SiegePanelDto.{zuzycie, atrycjaNext, milicjaEst, playerCanStorm}` (także klawisz `2`, `:203`); `orderPanel.ts:118-130` (`orderTierUi`) → `OrderState.tierUi`; `unitRecruitCard.ts:157` (stać na zakup) → `affordable`; użycie `sideListHud.css.ts:115-126` (`armyStatusBadge`) w `armyListHud.ts:190` → `ArmyListEntry.status`. Pozostałe miejsca sklasyfikowane jako GRANICZNY (prezentacja) w tej samej tabeli.
- W zbiorze CZYSTYM skopiowanym w P5.1 (runda 2: pełny przegląd 34 plików linia po linii, `P5-1-UI-SHELL-SKELETON.md` §6 pkt 5). Skopiowane 1:1 i nieużywane w `frontend-v2`. Nie wolno ich wpiąć do kodu P5.x bez zastąpienia polem DTO:

| Moduł | Wynik | Plik:linia | Docelowe DTO |
|---|---|---|---|
| `aiCivPicker.ts` | REGUŁA | `:22-25` limit = `civ_types_count − 1`; `:31-36` kandydaci; `:49-65` sanityzacja wyboru; `:74-76` blokada karty | `NewGameOptionsDto` (proponowane `aiCivCap`, `aiCivCandidateIds`); sanityzacja w silniku przy `create_session` |
| `scienceHubSnapshotLogic.ts` | REGUŁA | `:56-70` epoka gracza → etykieta; `:89-134` lista „Możesz wybrać” i podgląd 4 zablokowanych | `ResearchViewDto.techs[].state`/`effectiveCost` (+ proponowane `hubEpoch`) |
| `mapUnitCursor.ts` | REGUŁA | `:75-116` legalność ataku/wejścia/scalenia/ruchu pod kursorem | proponowane `HexContextDto.cursorAction` (lub `HoverChanged`, P4-5B) |
| `empireMiastaTable.ts` | GRANICZNY | `:74-87` suma surowców; `:119-143` sumy i średnia wzrostu % (`:138`) | proponowane `EmpireDetailDto.citiesSummary` |
| `sideListHud.css.ts` | GRANICZNY | `:115-126` priorytet stanów armii | proponowane `ArmyStackDto.cards[].status` |
| `empirePanelSectionMap.ts` | GRANICZNY | `:121-126` widoczność suwaków wg modelu ekonomii | routing UI (bez nowego pola) |
| `entityCards/slug.ts` | GRANICZNY | `:30-49` slugify id encji | `EntityCardDto.id` z silnika |
| `techIcons.ts` | GRANICZNY (dane) | `:14-47` klucz = nazwa PL z `tech.json` | klucz `TechId` ze `StaticCatalogDto.tech` |
| `triumphCityStateNotice.ts` | GRANICZNY (tekst) | `:81-92` tekst odtwarza sens komunikatu z `game/triumph-city-state.ts` | tekst/klucz komunikatu z silnika |

## Tabela (83 moduły)

| # | Moduł (`src/ui/…`) | Typ | Poziom | Cykl | LOC | Importy logiki (cel × linie) | Klasy P5-0 §3 | Blokujące zależności UI (z kolejki) | Bezpośrednich dependentów w kolejce | DTO / komenda (P5-0) |
|---:|---|---|---:|---|---:|---|---|---|---|---|
| 1 | `icons/brandAssets.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 267 | data 1, units 1 | S1 T2 | — | 46 (armyListHud.ts, armyMergePanel.ts, armyMergePickPanel.ts, armySplitPanel.ts, …) | `StaticCatalogDto.units[].category` |
| 2 | `leaderPortraits.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 225 | data 1, gra/data 1 | S1 T1 | — | 5 (diploUiSkin.ts, diplomacyAudience.ts, hud.ts, postBattleSummary.ts, …) | `StaticCatalogDto.civs` |
| 3 | `uiParams.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 98 | gra/data 1 | S1 | — | 4 (cityPanel.ts, mainMenu.ts, newGameFlow.ts, perfTestPanel.ts) | `StaticCatalogDto.ui_params` (lub plik frontendu — Z2) |
| 4 | `unitInfographic.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 171 | data 1, units 1 | S1 T1 | — | 4 (cityPanel.ts, entityCards/unitAdapter.ts, unitInfoCard.ts, unitRecruitCard.ts) | `UnitCardDto` |
| 5 | `power-labels.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 36 | game 1, gra/data 1 | S2 (`powerParams`° martwy) | — | 3 (empireDetailPanel.ts, hud.ts, powerOverlayHud.ts) | `StaticCatalogDto` |
| 6 | `unitMiniPreview.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 155 | data 1, render 1, three 1, units 1 | S1 X1 T1 | — | 3 (cityPanel.ts, entityCards/renderer.ts, unitInfoCard.ts) | miniatura z Rust (D-UI-3, P4-5C) |
| 7 | `civBrandDisplay.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 68 | gra/data 1 | S1 | — | 2 (diplomacyAudience.ts, empireDetailPanel.ts) | `StaticCatalogDto.civs` |
| 8 | `diplomacyAcceptanceBalance.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 911 | game 4 | R7 F1 T1 | — | 2 (diplomacyAudience.ts, diplomacyTradeBasket.ts) | `DiplomacyBasketPreviewDto.accepted/balance_pn/...` (§6.6; traktat: `mode: treaty` + `treatyGate` P5.2-Z9); stół negocjacji: `PnBalancePanelDto` (rozszerzenie P5.2-Z10, `canAccept` = ta sama funkcja Rust co bramka przyjęcia) |
| 9 | `techUnlockParse.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 52 | gra/data 1 | S1 | — | 2 (sciencePicker.ts, techTreeView.ts) | `StaticCatalogDto` |
| 10 | `minimapHud.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 448 | game 1 | X1 | — | 1 (hud.ts) | `StaticCatalogDto.constants` + `MinimapDto` (§6.14) |
| 11 | `perfReport.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 315 | buildInfo 1, map 3, render 1 | X3 T2 | — | 1 (sceneTimingReport.ts) | D-UI-7 |
| 12 | `improvementBuildConfirm.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 93 | game 1, map 2 | F2 T1 | — | 0 | `ImprovementBuildImpactDto` (§6.7; + `newLabel` — rozszerzenie P5.2-Z13) |
| 13 | `mapLoadingOverlay.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 260 | map 1 | X1 | — | 0 | `MapGenProgressEvent {phase, total, label}` (§6.16) — P5.2: `total` przekazywany jako `setProgress(…, phaseTotal)` (jak pin); fallback bez `phaseTotal` = `StaticCatalogDto.constants.mapGenPhaseTotal` (rozszerzenie P5.2-Z11/Z16) |
| 14 | `saveLoadDialog.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 623 | game 2 | M3 IO6 F2 K1 T2 | — | 0 | `SaveSlotsDto` (§6.15); komendy sesji P2-5 §2.10; P5.2: + `diskSlotPrefix`, pola `SaveSlotMetaDto`, `allocate_save_slot` (rozszerzenia P5.2-Z6/Z14) |
| 15 | `victoryScreen.ts` **— PRZENIESIONY P5.2** | BEZPOŚREDNI | 0 | — | 346 | game 2 | K1 T1 | — | 0 | `VictoryDto` (§6.13); próg dominacji P5.2: `StaticCatalogDto.constants.progDominacjiPower` (§6.1 — P5-0 podaje oba źródła; wybór i warunek jednego parametru Rust: P5.2-Z17) |
| 16 | `entityCards/registry.ts` | BEZPOŚREDNI | 1 | C4 | 194 | data 1, gra/data 5 | S5 T2 | `sciencePicker.ts` | 8 (cityPanel.ts, entityCards/buildingAdapter.ts, entityCards/improvementAdapter.ts, entityCards/renderer.ts, …) | `StaticCatalogDto` |
| 17 | `techDiscoveryNotice.ts` | BEZPOŚREDNI | 1 | C4 | 946 | gra/data 4, render 1 | S4 T1 | `entityCards/registry.ts`, `entityCards/renderer.ts`, `icons/brandAssets.ts` | 4 (cityPanel.ts, scienceHubHud.ts, sciencePicker.ts, techTreeView.ts) | `StaticCatalogDto` |
| 18 | `unitCardStatus.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 394 | game 3 | R3 T3 | `icons/brandAssets.ts` | 4 (armyStackHud.ts, contextPanelHud.ts, hexContextTooltip.ts, unitPanelHud.ts) | `UnitCardDto.badges` (§6.8) |
| 19 | `entityCards/unitAdapter.ts` | BEZPOŚREDNI | 1 | C4 | 291 | data 1, gra/data 1, units 1 | S2 T2 | `entityCards/registry.ts`, `unitInfographic.ts` | 3 (cityPanel.ts, entityCards/renderer.ts, unitInfoCard.ts) | `StaticCatalogDto` (+ `unit_category`) |
| 20 | `sciencePicker.ts` | BEZPOŚREDNI | 1 | C4 | 1666 | game 3, gra/data 3 | R1 F1 S2 T2 | `scienceHubHud.ts`, `techDiscoveryNotice.ts`, `techUnlockParse.ts` | 3 (entityCards/registry.ts, scienceHubHud.ts, techTreeView.ts) | `ResearchViewDto.techs[].effective_cost` (§6.9) |
| 21 | `diplomacyDealDisplay.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 312 | game 3 | F2 T3 | `icons/brandAssets.ts` | 2 (diplomacyAudience.ts, diplomacyTradeBasket.ts) | `DealDisplayDto` (część §6.6) |
| 22 | `entityCards/buildingAdapter.ts` | BEZPOŚREDNI | 1 | C4 | 340 | data 1, game 8, gra/data 1 | R8 F2 S1 T4 | `entityCards/registry.ts`, `icons/brandAssets.ts` | 2 (cityPanel.ts, entityCards/renderer.ts) | `EntityCardDto::Building` (§6.11) |
| 23 | `scienceHubHud.ts` | BEZPOŚREDNI | 1 | C4 | 792 | data 1, game 2 | K1 T2 | `icons/brandAssets.ts`, `sciencePicker.ts`, `techDiscoveryNotice.ts` | 2 (hud.ts, sciencePicker.ts) | §6.9 |
| 24 | `entityCards/improvementAdapter.ts` | BEZPOŚREDNI | 1 | C4 | 249 | gra/data 1 | S1 | `entityCards/registry.ts`, `icons/brandAssets.ts` | 1 (entityCards/renderer.ts) | `StaticCatalogDto` |
| 25 | `entityCards/technologyAdapter.ts` | BEZPOŚREDNI | 1 | C4 | 386 | gra/data 4 | S4 | `entityCards/registry.ts`, `icons/brandAssets.ts` | 1 (entityCards/renderer.ts) | `StaticCatalogDto` |
| 26 | `orderPanel.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 231 | game 2 | T2 | `icons/brandAssets.ts` | 1 (cityPanel.ts) | `CityPanelDto.order` |
| 27 | `unitRecruitCard.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 286 | data 1, game 2, units 1 | F1 S1 T3 | `icons/brandAssets.ts`, `unitInfographic.ts` | 1 (cityPanel.ts) | `RecruitOptionDto` (§6.3) |
| 28 | `cityAttackChoice.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 239 | game 1 | T1 | `icons/brandAssets.ts` | 0 | `SiegePanelDto.ctx` |
| 29 | `newGameFlow.ts` | BEZPOŚREDNI | 1 | — | 2373 | data 1, game 7, map 1 | R15 F5 K5 S1 T11 | `icons/brandAssets.ts`, `uiParams.ts` | 0 | `NewGameOptionsDto` + zapytanie `new_game_preview` (§6.10) — przed `create_session` |
| 30 | `perfTestPanel.ts` | BEZPOŚREDNI | 1 | — | 677 | map 1, perf 1, three 1 | M1 | `icons/brandAssets.ts`, `uiParams.ts` | 0 | D-UI-7 (poza P5 albo komenda diagnostyczna) |
| 31 | `postBattleSummary.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 603 | battle 1, game 2 | R1 X11 T3 | `icons/brandAssets.ts`, `leaderPortraits.ts` | 0 | `BattleSummaryDto` (§6.13) |
| 32 | `sceneTimingReport.ts` | BEZPOŚREDNI | 1 | — | 212 | map 3, render 1 | X2 T2 | `perfReport.ts` | 0 | D-UI-7 |
| 33 | `siegeMapPanel.ts` **— PRZENIESIONY P5.3** | BEZPOŚREDNI | 1 | — | 371 | game 4 | R1 T4 (+ 4 reguły bez importu) | `icons/brandAssets.ts` | 0 | `SiegePanelDto` (§6.12) |
| 34 | `diploUiSkin.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 231 | — (0 bezpośrednich) | — | `icons/brandAssets.ts`, `leaderPortraits.ts` | 8 (diploListHud.ts, diplomacyAudience.ts, diplomacyNegotiationModal.ts, diplomacyPanel.ts, …) | przez zależności (kolumna 9) |
| 35 | `entityCards/renderer.ts` | PRZECHODNI | 1 | C4 | 1212 | — (0 bezpośrednich) | — | `entityCards/buildingAdapter.ts`, `entityCards/improvementAdapter.ts`, `entityCards/registry.ts`, `entityCards/technologyAdapter.ts`, `entityCards/unitAdapter.ts`, `entityCards/wonderAdapter.ts`, `unitMiniPreview.ts` | 4 (buildModeHud.ts, cityPanel.ts, techDiscoveryNotice.ts, unitInfoCard.ts) | przez zależności (kolumna 9) |
| 36 | `icons/iconRegistry.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 49 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 3 (hud.ts, hudChip6c.ts, mapToolbarHud.ts) | przez zależności (kolumna 9) |
| 37 | `mapUnitHudSkin.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 78 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 3 (armyStackHud.ts, unitPanelHud.ts, unitReplacePicker.ts) | przez zależności (kolumna 9) |
| 38 | `armyMergePanel.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 221 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 2 (armyMergePickPanel.ts, armySplitPanel.ts) | przez zależności (kolumna 9) |
| 39 | `icons/wikiBookIcon.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 19 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 2 (hud.ts, wikiHubHud.ts) | przez zależności (kolumna 9) |
| 40 | `powerOverlayHud.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 238 | — (0 bezpośrednich) | — | `power-labels.ts` | 2 (empireDetailPanel.ts, hud.ts) | przez zależności (kolumna 9) |
| 41 | `armyListHud.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 368 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 42 | `bottomBarHud.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 335 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 43 | `cityListHud.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 332 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 44 | `empireOverlayHud.ts` **— PRZENIESIONY P5.3** | PRZECHODNI | 1 | — | 138 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 45 | `entityCards/wonderAdapter.ts` | PRZECHODNI | 1 | C4 | 156 | — (0 bezpośrednich) | — | `entityCards/registry.ts` | 1 (entityCards/renderer.ts) | przez zależności (kolumna 9) |
| 46 | `leaderBannersHud.ts` | PRZECHODNI | 1 | — | 68 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 47 | `cityCaptureNotice.ts` | PRZECHODNI | 1 | — | 356 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 48 | `cityForeignPick.ts` | PRZECHODNI | 1 | — | 244 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 49 | `cityUnitPick.ts` | PRZECHODNI | 1 | — | 265 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 50 | `gamePauseMenu.ts` | PRZECHODNI | 1 | — | 317 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 51 | `hotSeatHandoff.ts` | PRZECHODNI | 1 | — | 135 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 52 | `mainMenu.ts` | PRZECHODNI | 1 | — | 514 | — (0 bezpośrednich) | — | `icons/brandAssets.ts`, `uiParams.ts` | 0 | przez zależności (kolumna 9) |
| 53 | `unitForeignPick.ts` | PRZECHODNI | 1 | — | 245 | — (0 bezpośrednich) | — | `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 54 | `buildModeHud.ts` | BEZPOŚREDNI | 2 | — | 963 | game 2, render 1 | K2 T5 | `entityCards/renderer.ts`, `icons/brandAssets.ts` | 1 (hud.ts) | `StaticCatalogDto.constants`; stan polityki → `EmpireDetailDto.improvement_policy` |
| 55 | `diplomacyPanel.ts` | BEZPOŚREDNI | 2 | — | 533 | game 1 | F1 | `diploUiSkin.ts` | 1 (diploListHud.ts) | `display_name` w DTO bytu |
| 56 | `techTreeView.ts` | BEZPOŚREDNI | 2 | — | 1130 | game 3, gra/data 1 | R1 F1 K1 S1 T2 | `icons/brandAssets.ts`, `sciencePicker.ts`, `techDiscoveryNotice.ts`, `techUnlockParse.ts` | 0 | jw. |
| 57 | `unitInfoCard.ts` | BEZPOŚREDNI | 2 | — | 419 | data 1, units 1 | S1 T2 | `entityCards/renderer.ts`, `entityCards/unitAdapter.ts`, `unitInfographic.ts`, `unitMiniPreview.ts` | 0 | `UnitCardDto` |
| 58 | `wikiHubHud.ts` | BEZPOŚREDNI | 2 | — | 644 | data 1 | S1 | `icons/wikiBookIcon.ts` | 0 | `StaticCatalogDto.wiki` (Z2) |
| 59 | `unitPanelHud.ts` | PRZECHODNI | 2 | — | 183 | — (0 bezpośrednich) | — | `icons/brandAssets.ts`, `mapUnitHudSkin.ts`, `unitCardStatus.ts` | 4 (armyStackHud.ts, hexContextTooltip.ts, hud.ts, unitActionBarHtml.ts) | przez zależności (kolumna 9) |
| 60 | `contextPanelHud.ts` | PRZECHODNI | 2 | — | 63 | — (0 bezpośrednich) | — | `unitCardStatus.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 61 | `diplomacyProposalBanner.ts` | PRZECHODNI | 2 | — | 55 | — (0 bezpośrednich) | — | `diploUiSkin.ts` | 1 (diplomacyAudience.ts) | przez zależności (kolumna 9) |
| 62 | `hudChip6c.ts` | PRZECHODNI | 2 | — | 76 | — (0 bezpośrednich) | — | `icons/brandAssets.ts`, `icons/iconRegistry.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 63 | `mapToolbarHud.ts` | PRZECHODNI | 2 | — | 172 | — (0 bezpośrednich) | — | `icons/iconRegistry.ts` | 1 (hud.ts) | przez zależności (kolumna 9) |
| 64 | `armyMergePickPanel.ts` | PRZECHODNI | 2 | — | 183 | — (0 bezpośrednich) | — | `armyMergePanel.ts`, `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 65 | `armySplitPanel.ts` | PRZECHODNI | 2 | — | 185 | — (0 bezpośrednich) | — | `armyMergePanel.ts`, `icons/brandAssets.ts` | 0 | przez zależności (kolumna 9) |
| 66 | `diplomacyPendingHud.ts` | PRZECHODNI | 2 | — | 87 | — (0 bezpośrednich) | — | `diploUiSkin.ts` | 0 | przez zależności (kolumna 9) |
| 67 | `interHumanDiplomacyHud.ts` | PRZECHODNI | 2 | — | 263 | — (0 bezpośrednich) | — | `diploUiSkin.ts` | 0 | przez zależności (kolumna 9) |
| 68 | `unitReplacePicker.ts` | PRZECHODNI | 2 | — | 207 | — (0 bezpośrednich) | — | `icons/brandAssets.ts`, `mapUnitHudSkin.ts` | 0 | przez zależności (kolumna 9) |
| 69 | `diplomacyAudience.ts` | BEZPOŚREDNI | 3 | C2 | 2443 | audio 1, game 10 | R6 F9 K2 T6 | `civBrandDisplay.ts`, `diploUiSkin.ts`, `diplomacyAcceptanceBalance.ts`, `diplomacyDealDisplay.ts`, `diplomacyNegotiationModal.ts`, `diplomacyProposalBanner.ts`, `diplomacyTradeBasket.ts`, `leaderPortraits.ts` | 3 (diplomacyNegotiationModal.ts, diplomacyTradeBasket.ts, hud.ts) | `DiplomacyAudienceDto` (§6.6) |
| 70 | `diplomacyNegotiationModal.ts` | BEZPOŚREDNI | 3 | C2 | 562 | game 4 | K1 T3 | `diploUiSkin.ts`, `diplomacyAudience.ts` | 2 (diplomacyAudience.ts, diplomacyTradeBasket.ts) | §6.6 |
| 71 | `armyStackHud.ts` | BEZPOŚREDNI | 3 | — | 380 | game 1 | T1 | `icons/brandAssets.ts`, `mapUnitHudSkin.ts`, `unitCardStatus.ts`, `unitPanelHud.ts` | 1 (hud.ts) | `UnitCardDto.combat` |
| 72 | `diploListHud.ts` | BEZPOŚREDNI | 3 | — | 502 | game 1 | F1 | `diploUiSkin.ts`, `diplomacyPanel.ts` | 1 (hud.ts) | `DiploListDto.lines` (gotowe linie) |
| 73 | `diplomacyTradeBasket.ts` | BEZPOŚREDNI | 3 | C2 | 2851 | game 15, gra/data 2 | R24 F2 K2 S2 T7 (R24 = 23 + re-eksport `:2833`) | `diploUiSkin.ts`, `diplomacyAcceptanceBalance.ts`, `diplomacyAudience.ts`, `diplomacyDealDisplay.ts`, `diplomacyNegotiationModal.ts`, `icons/brandAssets.ts` | 1 (diplomacyAudience.ts) | `DiplomacyBasketPreviewDto` + zapytania `diplomacy_preview_basket`, `diplomacy_quick_deal`, `diplomacy_balance_to_fair` (§6.6); `TradeableItemsDto` |
| 74 | `unitActionBarHtml.ts` | PRZECHODNI | 3 | — | 169 | — (0 bezpośrednich) | — | `unitPanelHud.ts` | 1 (hexContextTooltip.ts) | przez zależności (kolumna 9) |
| 75 | `hexContextTooltip.ts` | BEZPOŚREDNI | 4 | — | 992 | game 9, map 1, render 2, types 3 | R12 F5 K1 X4 T7 | `icons/brandAssets.ts`, `unitActionBarHtml.ts`, `unitCardStatus.ts`, `unitPanelHud.ts` | 1 (sidePanelHud.ts) | `HexContextDto` (§6.7), `UnitCardDto` (§6.8) |
| 76 | `sidePanelHud.ts` | PRZECHODNI | 5 | C5 | 969 | — (0 bezpośrednich) | — | `hexContextTooltip.ts`, `icons/brandAssets.ts`, `sidePanelEventFilter.ts` | 2 (hud.ts, sidePanelEventFilter.ts) | przez zależności (kolumna 9) |
| 77 | `sidePanelEventFilter.ts` | PRZECHODNI | 5 | C5 | 25 | — (0 bezpośrednich) | — | `sidePanelHud.ts` | 1 (sidePanelHud.ts) | przez zależności (kolumna 9) |
| 78 | `empireDetailPanel.ts` | BEZPOŚREDNI | 6 | C3 | 4433 | game 9 | R6 F5 K10 T3 | `civBrandDisplay.ts`, `empireDetailTypes.ts`, `icons/brandAssets.ts`, `power-labels.ts`, `powerOverlayHud.ts` | 1 (hud.ts) | `EmpireDetailDto` (§6.5); komendy `set_trade_split`/`set_labor_split` |
| 79 | `empireDetailTypes.ts` | BEZPOŚREDNI | 6 | C3 | 732 | game 1 | T1 | `hud.ts` | 1 (empireDetailPanel.ts) | `EmpireDetailDto.resource_usage` |
| 80 | `hud.ts` | PRZECHODNI | 6 | C3 | 1861 | — (0 bezpośrednich) | — | `armyListHud.ts`, `armyStackHud.ts`, `bottomBarHud.ts`, `buildModeHud.ts`, `cityListHud.ts`, `contextPanelHud.ts`, `diploListHud.ts`, `diplomacyAudience.ts`, `empireDetailPanel.ts`, `empireOverlayHud.ts`, `hudChip6c.ts`, `icons/brandAssets.ts`, `icons/iconRegistry.ts`, `icons/wikiBookIcon.ts`, `leaderBannersHud.ts`, `leaderPortraits.ts`, `mapToolbarHud.ts`, `minimapHud.ts`, `power-labels.ts`, `powerOverlayHud.ts`, `scienceHubHud.ts`, `sidePanelHud.ts`, `unitPanelHud.ts` | 3 (cityPanel.ts, empireDetailTypes.ts, preBattle.ts) | przez zależności (kolumna 9) |
| 81 | `cityPanel.ts` | BEZPOŚREDNI | 7 | C1 | 11986 | data 1, game 41, gra/data 1, map 1, render 1, types 3 | R97 M7 F15 K19 S8 X2 T32 | `cityUxFrame.ts`, `entityCards/buildingAdapter.ts`, `entityCards/registry.ts`, `entityCards/renderer.ts`, `entityCards/unitAdapter.ts`, `hud.ts`, `icons/brandAssets.ts`, `orderPanel.ts`, `techDiscoveryNotice.ts`, `uiParams.ts`, `unitInfographic.ts`, `unitMiniPreview.ts`, `unitRecruitCard.ts` | 1 (cityUxFrame.ts) | `CityPanelDto` (§6.2), `CityGrowthDto` (§5), `BuildOptionDto`/`RecruitOptionDto` (§6.3), `EmpireHudDto` (§6.4); komendy §7 |
| 82 | `cityUxFrame.ts` | BEZPOŚREDNI | 7 | C1 | 296 | game 1, types 1 | T1 | `cityPanel.ts` | 1 (cityPanel.ts) | `CityRefDto {id, owner, q, r, name}` |
| 83 | `preBattle.ts` | BEZPOŚREDNI | 7 | — | 918 | audio 1, battle 1, game 2 | F1 X1 T1 | `hud.ts`, `icons/brandAssets.ts`, `leaderPortraits.ts` | 0 | `PreBattleDto.sides[].bonus_chips` (§6.13) |

Grupy cykliczne (port razem, jedna paczka):

- **C1** (2): `cityPanel.ts`, `cityUxFrame.ts`
- **C2** (3): `diplomacyAudience.ts`, `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts`
- **C3** (3): `empireDetailPanel.ts`, `empireDetailTypes.ts`, `hud.ts`
- **C4** (10): `entityCards/buildingAdapter.ts`, `entityCards/improvementAdapter.ts`, `entityCards/registry.ts`, `entityCards/renderer.ts`, `entityCards/technologyAdapter.ts`, `entityCards/unitAdapter.ts`, `entityCards/wonderAdapter.ts`, `scienceHubHud.ts`, `sciencePicker.ts`, `techDiscoveryNotice.ts`
- **C5** (2): `sidePanelEventFilter.ts`, `sidePanelHud.ts`
