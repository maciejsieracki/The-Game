# P5.0 — Katalog modelu widoku (view-model / DTO) dla UI weba przy rdzeniu w Rust

**Temat:** `R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Pin web:** `edb8fb56` — wyłącznie `git show` / `git grep` / `git archive` do katalogu scratch poza repo (odczyt; zero buildu, zero `npm`, zero zmian w `gra/**`).
**Baza dokumentacyjna:** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` @ `88df6493`.
**Zakres:** dokument projektowo-odczytowy. Zero kodu, zero buildu, zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`.
**Źródło tematu:** kandydat `R-RUSTPORT-P5-0-UI-VIEWMODEL-CATALOG-Q1` z `P4-5-UI-SHELL-AUDIT.md` §6 (wiersz 232).
**Legenda:** `plik:linia` = `gra/src/<plik>` na pinie `edb8fb56` (ścieżki `ui/…` skracane do nazwy pliku tam, gdzie jednoznaczne); `NIE_ZMIERZONO` = nie sprawdzone, nie wnioskuję; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora rozsądną wartością domyślną (do rewizji Evaluatora/właściciela, niewiążąca).

### Decyzje wiążące (z dispatchu i `LEDGER.md:134`)

| ID | Treść | Skutek dla katalogu |
|---|---|---|
| **UI-Q1 = A** | Kopia paneli weba (`gra/src/ui/**`) + bundler Vite w webview | DTO musi dać panelom **te same liczby i teksty**, które dziś liczą lokalnie — bez zmiany DOM/CSS |
| **UI-Q2 = A** | Wszystkie etykiety zakotwiczone na mapie rysuje Rust | Dane plakietek miast są konsumowane w Rust (renderer), nie w webview → pola dzielone z panelem (§5) |
| **UI-Q3 = B** | Natywna powierzchnia Rust zbiera zdarzenia mapy; panele/hit-test prostokątów do Rust | Hover/picking (odznaka weterana, pigułka miasta, heks) przychodzi do UI jako **zdarzenie z Rust** z identyfikatorem → UI dociąga DTO (§6.9) |
| **D-UI-9** | Jedno pole DTO dla liczb dzielonych przez renderer i UI | §5: lista pól dzielonych, jedno źródło w Rust |
| **P5.13** | „zero lokalnej symulacji w JS/frontend” (`PLAN-PORT-RUST-TAURI-20261020.md:192`) | Każda funkcja klasy **R** i **M** (§2) wychodzi z frontendu |

---

## 0. Streszczenie

1. **Pomiar potwierdza P4-5 §2.4:** 49 plików `ui/**` importuje logikę/dane; **212 linii importu**: `game/**` 142, dane 41 (13 × `src/data/**` + 28 × JSON z `gra/data/**`), `map/**` 13, `render/**` 8, `units/**` 6, `battle/**` 2. Z tych linii rozwiązano **496 zaimportowanych symboli** (skrypt §11).
2. **Klasyfikacja symboli (§2):** R (reguła gry liczona w UI) **181**, M (mutacja stanu gry z UI) **11**, IO (zapis/odczyt) **6**, F (formatowanie tekstu zależne od reguł) **56**, K (stała/parametr) **46**, S (dane statyczne/katalog) **42**, X (renderer/bitwa/mapgen/diagnostyka) **26**, T (typ = kształt DTO) **128**. Klasyfikacja jest heurystyczna (słownik + reguły nazw, §11) i przejrzana ręcznie dla plików z R/M.
3. **Koncentracja:** `cityPanel.ts` ma **97 z 181** symboli R i **7 z 11** M. Razem z `diplomacyTradeBasket.ts` (R23), `newGameFlow.ts` (R15), `hexContextTooltip.ts` (R12), `buildingAdapter.ts` (R8), `diplomacyAcceptanceBalance.ts` (R7), `diplomacyAudience.ts` (R6), `empireDetailPanel.ts` (R6) → **8 plików = 174/181 R**. R lub M ma 15 z 49 plików; pozostałe 34 nie mają ani R, ani M (same typy, stałe, dane statyczne, formatery, X).
4. **Najważniejsze ustalenia nowe względem P4-5:**
   - **UI mutuje stan gry bezpośrednio** (nie tylko liczy): `cityPanel.ts` pobiera i zwraca surowce z miast (`deductBuildingStockCostAcrossCities` `:6277`, `refundBuildingStockCostAcrossCities` `:6131`) i składa nową kolejkę produkcji (`enqueue` `:6284`, `dequeue` `:6133`, `promoteToFront` `:8383-8408`, `setPaused` `:8522`, `dequeueRecruitment` `:8284`), zapisując ją przez `cfg.setProduction` albo — bez hooka — do **lokalnej mapy w module UI** (`localProd`, `cityPanel.ts:633-643`). W Rust to wyłącznie komendy P2-5 (§7).
   - **Podwójna ścieżka „hook silnika albo liczenie lokalne”** w `cityPanel.ts`: zdrowie (`resolveCityHealth` `:3281-3290`: `cfg.getCityHealth` albo `computeCityHealthBreakdown`), porządek (`getOrderState` „Brak → szacunek z budynków” `:555`), dane gry (`gameData()` → `loadGameData()` `:626-631`). Kontrakt `CityPanelConfig` (`:314-606`) ma **58 hooków odczytu** (`get*`/`is*`) i **35 hooków akcji** (`on*`/`set*`) — to jest de facto dzisiejszy model widoku panelu miasta i punkt wyjścia DTO (§6.2).
   - **Podgląd akceptacji AI w dyplomacji liczony w UI** tą samą matematyką co bramka silnika, z udokumentowaną resztkową rozbieżnością: `diplomacyAcceptanceBalance.ts:773-788` (komentarz: podgląd nie ma „mnożnika chęci AI per-akcja”). W Rust: jedno zapytanie `diplomacy_preview_basket` liczone tą samą funkcją co bramka (§6.6).
   - **Reguła gry wpisana w UI bez importu** (nie wykrywana bramą „zero importów”): `siegeMapPanel.ts:219-220` (`zuzycie = population + garnizon`, `atrycjaNext = max(1, floor(garnizon*0.08))`). Pełny spis takich reguł: `NIE_ZMIERZONO` (§10).
   - **Liczby dzielone renderer↔UI (D-UI-9):** poza WZROST% (R14 z P4-5) są jeszcze: etykieta miasta `formatCityMapLabel` (`render/cities.ts:784` i `cityPanel.ts:10206`), front kolejki produkcji (`render/cities.ts:802` `frontItem` i `cityPanel.ts:896,5040,8432`), ostrzeżenie o brakujących surowcach (`render/cities.ts:809-811` i `cityPanel.ts:6309`), stolica (`render/cities.ts:774` i `CityPanelConfig.getCapitalCityId` `cityPanel.ts:594`) (§5).
5. **Propozycja:** 20 rodzin DTO (§6), lista reguł do przeniesienia do silnika z mapowaniem na pola (§8), 11 mutacji → komendy P2-5 (§7), mierzalna brama dla P5.1 (§9).

---

## 1. Pomiar i rekonsyliacja z P4-5

| Cel importu | Linie | Pliki UI | Zgodność z P4-5 §2.4 (`P4-5-UI-SHELL-AUDIT.md:121-128`) |
|---|---:|---:|---|
| `game/**` | 142 | 31 | ✓ 142 / 31 |
| dane: `src/data/**` (`loader.ts`, `wikiBundle.json`) | 13 | — | P4-5 liczy łącznie 41 |
| dane: `gra/data/*.json` (ścieżka `../../data/…` z `ui/`) | 28 | — | (13 + 28 = **41** ✓) |
| `map/**` | 13 | 8 | ✓ |
| `render/**` | 8 | 7 | ✓ |
| `units/**` | 6 | 6 | ✓ |
| `battle/**` | 2 | 2 | ✓ |
| **Razem** | **212** | **49** | ✓ 49 plików |

Uwagi metody (doprecyzowanie P4-5):
- **Wieloliniowe importy** rozwiązane parserem (`import … from` z nawiasami przez wiele linii) — numer linii = linia słowa `import`. Dla `cityPanel.ts:84` (`game/production`) import obejmuje 30 symboli.
- **Re-eksport** `diplomacyTradeBasket.ts:2833` (`export { validateTradeBasketSides } from '../game/diplomacy-trade-validation'`) liczony jako 1 z 142 linii `game/**`.
- **Importy typów inline poza 142 liniami** (`import('../game/…').T`): `cityPanel.ts:571,573,575,577` (`BuildingCostPace`, `KosztJednostekPace`, `WzrostLudnosciPace`, `GameDifficulty`), `diplomacyAudience.ts:282-283` (`AcceptanceSideBalance`). Brama P5.1 musi łapać także tę formę (§9).
- **Importy martwe** (symbol zaimportowany, nieużyty w pliku; `Grep` nazwy → tylko linia importu): `snapHandelPct` (`cityPanel.ts:65`, `empireDetailPanel.ts:33`), `getEmpireFoodMaxCap` (`cityPanel.ts:141`), `isCivAvailableAtGameEpoch` (`newGameFlow.ts:22`), `normalizeImprovementKey` (`hexContextTooltip.ts:13`), typ `GameDifficulty` (`diplomacyTradeBasket.ts:16`), typ `MapGenPhaseTimings` (`sceneTimingReport.ts:5`). Nie wymagają DTO; w katalogu oznaczone `°`.

## 2. Taksonomia symboli

| Klasa | Znaczenie | Docelowo (P5.13) | Liczba |
|---|---|---|---:|
| **R** | Reguła gry liczona lokalnie w UI (wydajność, koszt, bramka, podgląd decyzji AI, sortowanie wg mocy…) | **Wychodzi z frontendu**; wynik jako pole DTO albo zapytanie do Rust | 181 |
| **M** | Mutacja stanu gry albo sesji wykonywana z UI | **Komenda** P2-5 (`engine_command`) | 11 |
| **IO** | Odczyt slotów zapisu / metadanych / autosave | Komendy powłoki Tauri (P2-5 §2.10, pkt 17 rozstrzygnięć `P2-5-COMMANDS.md:654+`) | 6 |
| **F** | Formatowanie tekstu, którego treść zależy od reguł gry (etykiety odmian „daniny”, nastawienie, wiarygodność, linie efektów) | **ZAŁOŻENIE Z1:** tekst zależny od reguł → gotowy string w DTO; czyste formatowanie liczb (`formatManpower`, `formatWyzwienieLabel`) → kopia 1:1 do `frontend/ui/format/**` (bez importu `game/`) | 56 |
| **K** | Stała/parametr (krok suwaka, min/max, próg, etykieta stała) | `StaticCatalogDto.constants` (§6.1), jedno źródło w Rust | 46 |
| **S** | Dane statyczne (JSON `gra/data/**`, `loadGameData`, `categoryOf`) | D-UI-4 — **ZAŁOŻENIE Z2** (§6.1) | 42 |
| **X** | Renderer/bitwa/mapgen/diagnostyka (`render/**`, `battle/battleHudTheme`, `map/mapGen*`, `riverGenSwitch`) | Paleta/style → kopia w frontendzie; WebGL/mapgen → D-UI-7 (P4-5 §5) | 26 |
| **T** | Typ TS (kształt danych) | Odpowiednik `struct` DTO z serde (§6) | 128 |
| | | **Razem** | **496** |

## 3. Katalog per plik (49 plików)

Kolumny: LOC (`wc -l` na pinie), linie importu logiki/danych (numery), liczba symboli wg klas, **co UI czyta/liczy lokalnie**, **docelowe DTO** (§6). Pliki uporządkowane wg ciężaru (R+M).

### 3.1 Pliki z regułami lub mutacjami (15) + 2 pliki parametrów sterujących

`buildModeHud.ts` i `power-labels.ts` (ostatnie 2 wiersze) nie mają R/M — dołączone tu, bo ich stałe/parametry sterują suwakiem i etykietami Mocy.

| Plik | LOC | Linie importu | Klasy | Co czyta / liczy lokalnie (dowód) | DTO / komenda |
|---|---:|---|---|---|---|
| `cityPanel.ts` | 11 986 | 41 (`:52-274`) | R97 M7 F15 K19 S8 X2 T32 | Pełny rachunek miasta `computeView` (`:1137-1300`): obrabiane pola (`cityWorkedTilesForEconomy` `:1148`), zdrowie (`computeCityHealthBreakdown` `:1149`), plony (`cityYieldPerTurn` `:1217`, mnożniki cyw./Mennica/Waluta `:1177-1205`, Porządek `:1222-1228`), racje i spichlerz (`computeCityRationCost` `:1245`, `paySpichlerzDrainForCity` `:1243`), WZROST% (`computeGrowthPercentV85` `:1263`), limity ludności (`cityPopulationCap` `:1278-1281`); `cityGrowthLive` dla plakietki (`:1527-1560`); szczęście/porządek (`evaluateOrderFromBreakdown` `:3083,3186`, prawo pozdobyczne `:3224-3229`); zamożność (`wealth*` `:4794-4837`); katalog budowy i bramki (`buildableProduction` `:6946`, `cityBuildingPrereqMet` `:6870`, `isBuildingSupersededByUpgrade` `:6862`); koszty (`itemCost`/`buildingWorkCost` `:7645-7646`, `buildingGoldPurchaseCost` `:6305`, `rushCost` `:8507`, `etaTurns` ×10); rekrutacja (`purchasableUnits` `:8911`, sortowanie `sortByUnitPowerDescending` `:8910`, manpower `:8053,8865`); utrzymanie (`buildingUpkeep` `:6573`, `unitResourceUpkeep` `:6198`); szlaki (`computeTradeRouteBuildingBonusByCity` `:10898`); kolejność nawigacji miast wg X/Z świata (`axialToWorld` `:10196-10197`); **mutacje**: `enqueue` `:6284`, `dequeue` `:6133`, `promoteToFront` `:8383`, `setPaused` `:8522`, `dequeueRecruitment` `:8284`, pobór/zwrot surowców `:6277`/`:6131` | `CityPanelDto` (§6.2), `CityGrowthDto` (§5), `BuildOptionDto`/`RecruitOptionDto` (§6.3), `EmpireHudDto` (§6.4); komendy §7 |
| `diplomacyTradeBasket.ts` | 2 851 | 17 (`:7-52`, `:2833`) | R23 F2 K2 S2 T7 | Wycena koszyka w PW (`diplomacySumPn` `:219`), próg uczciwości (`diplomacyFairGivePn` `:1923`), zaufanie/dobra wola z nadwyżki (`:1925,1934`), zaufanie z daru (`:1988`), walidacja stron (`validateTradeBasketSides` `:1297-1300`), zakaz waluty w wojnie (`:1269`), „szybka umowa” (`computeQuickDealBasket` `:2370,2800`), auto-wyrównanie (`balanceGiveItemsToFairMin` `:2545`), saldo traktatu (`computePlayerAcceptanceSides` `:1077`); opcje pozycji z surowego `units.json`/`tech.json` (`:430,436`) i stałej cen złóż (`:442`) | `DiplomacyBasketPreviewDto` + zapytania `diplomacy_preview_basket`, `diplomacy_quick_deal`, `diplomacy_balance_to_fair` (§6.6); `TradeableItemsDto` |
| `newGameFlow.ts` | 2 373 | 9 (`:19-63`) | R15 F5 K5 S1 T11 | Menu i domyślne kreatora z etykiety mapy (`civTypesMenuForMapLabel` `:763`, `miastaPanstwaMenuForMapLabel` `:745`, `defaultCivTypesFromMapLabel` `:1999`, `clampMiastaPanstwaCount` `:2053`, `worldGenerationPresetFromLabels` `:1994`), podgląd startu (`buildStartPreview` `:1150,2009`), profil macierzy cywilizacji (`buildCivMatrixSemanticProfile` `:1250`) | `NewGameOptionsDto` + zapytanie `new_game_preview` (§6.10) — przed `create_session` |
| `hexContextTooltip.ts` | 992 | 12 (`:7-47`) | R12 F5 K1 X4 T7 | Plon heksu bazowy/pełny (`tileYield` `:252,260`), ulepszenia aktywne (`improvementKeysForHex` `:248…557`), lista dopuszczalnych ulepszeń z bramkami terenu/lasu/cywilizacji (`:445-462`), magazyn z ulepszenia (`territoryResourceYieldForImprovement` `:137`), widoczność złoża lamy (`:338`), Moc jednostki (`fieldPower` `:818`) | `HexContextDto` (§6.7), `UnitCardDto` (§6.8) |
| `entityCards/buildingAdapter.ts` | 340 | 10 (`:35-49`) | R8 F2 S1 T4 | Koszt budynku z tempem i trudnością (`itemCost`/`buildingWorkCost` `:278-279`), efekt na poziomie (`:137,152`), utrzymanie (`:296-297`), koszt surowcowy (`:280`), mnożnik roli jednostek (`:257-259`) | `EntityCardDto::Building` (§6.11) |
| `diplomacyAcceptanceBalance.ts` | 911 | 4 (`:5-14`) | R7 F1 T1 | **Przewidywanie decyzji AI** `pnDealAcceptedByAi` (`:704,793`), modyfikator relacji (`:767`), PW traktatu wg roli (`:765-766`), próg uczciwości (`:790`) | `DiplomacyBasketPreviewDto.accepted/balance_pn/...` (§6.6) |
| `diplomacyAudience.ts` | 2 443 | 8 (`:5-54`) | R6 F9 K2 T6 | Efektywne nastawienie (`effectiveNastawienieScores` `:1410,2162`), PW traktatów obu stron (`:1947-1948`), wycofany dostęp do surowca (`:2030`), czy akcja dopuszcza wiele własnych pozycji (`uiActionAllowsMultipleOwnOnTable` ×7) | `DiplomacyAudienceDto` (§6.6) |
| `empireDetailPanel.ts` | 4 433 | 9 (`:13-43`) | R6 F5 K10 T3 | Normalizacja i krok suwaków podatku (`adjustHandelSplit` `:129,1158,1217`, `normalizePodzialHandlu` `:94,1171,1539`), przeliczenie suwaka puli Pracy (`podzialPracyZProcentuPuli` `:1496`, `procentPuliImperiumZBudynkow` `:1453`), suma zużycia surowców (`resourceUsageTotal` `:3292`) | `EmpireDetailDto` (§6.5); komendy `set_trade_split`/`set_labor_split` |
| `unitCardStatus.ts` | 394 | 3 (`:5-11`) | R3 T3 | Poziomy odznak ścieżek (`softPathBadgeLevel`/`armorPathBadgeLevel` `:145-146`), liczba gwiazdek weterana (`veteranStarCount` `:147`) | `UnitCardDto.badges` (§6.8) |
| `saveLoadDialog.ts` | 623 | 2 (`:5,15`) | M3 IO6 F2 K1 T2 | Lista slotów, metadane, ostatni slot, odczyt/usuwanie zapisu (`loadFromLocal` ×6, `deleteLocal` `:493,508`, FSA `:237,240`) | `SaveSlotsDto` (§6.15); komendy sesji P2-5 §2.10 |
| `sciencePicker.ts` | 1 666 | 6 (`:12-19`) | R1 F1 S2 T2 | Koszt badania z tempem/trudnością/epoką (`scaledResearchCost` `:1179`) | `ResearchViewDto.techs[].effective_cost` (§6.9) |
| `techTreeView.ts` | 1 130 | 4 (`:17-23`) | R1 F1 K1 S1 T2 | jw. (`:268`) | jw. |
| `siegeMapPanel.ts` | 371 | 4 (`:5-9`) | R1 T4 (+ reguła bez importu) | Żywność miasta (`getCityFood` `:217`), zużycie i atrycja garnizonu **wpisane w UI** (`:219-220`) | `SiegePanelDto` (§6.12) |
| `postBattleSummary.ts` | 603 | 3 (`:4-7`) | R1 X11 T3 | `buildPostBattleSummary` (eksport do sondy testowej `:595`; budowanie danych podsumowania z wyniku bitwy) | `BattleSummaryDto` (§6.13) |
| `perfTestPanel.ts` | 677 | 1 (`:21`) | M1 | Uruchamia generator świata (`generujSwiatAsync` `:270-282`) | D-UI-7 (poza P5 albo komenda diagnostyczna) |
| `buildModeHud.ts` | 963 | 3 (`:6-22`) | K2 T5 | (brak R) — stałe zakresu suwaka automatu ulepszeń (`:589-593`) | `StaticCatalogDto.constants`; stan polityki → `EmpireDetailDto.improvement_policy` |
| `power-labels.ts` | 36 | 2 (`:9,15`) | S1 | Opcje „Mocy” z `power-params.json` (`loadPowerOpcje` `:19`) | `StaticCatalogDto` |

### 3.2 Pozostałe pliki bez R/M (32): typy, stałe, dane, formatery, X

| Plik | LOC | Linie | Klasy | Co bierze | DTO |
|---|---:|---|---|---|---|
| `armyStackHud.ts` | 380 | `:16` | T1 | typ `UnitCardCombatDisplay` | `UnitCardDto.combat` |
| `cityAttackChoice.ts` | 239 | `:14` | T1 | typ `MapSiegeContext` | `SiegePanelDto.ctx` |
| `cityUxFrame.ts` | 296 | `:4` | T1 | typ `City` (`:220,276`) | `CityRefDto {id, owner, q, r, name}` |
| `civBrandDisplay.ts` | 68 | `:5` | S1 | `civs.json` | `StaticCatalogDto.civs` |
| `diploListHud.ts` | 502 | `:4` | F1 | `formatDiploCivListLines` (`:481`) | `DiploListDto.lines` (gotowe linie) |
| `diplomacyDealDisplay.ts` | 312 | `:5-7` | F2 T3 | podział stron umowy, etykiety zasobów | `DealDisplayDto` (część §6.6) |
| `diplomacyNegotiationModal.ts` | 562 | `:6-10` | K1 T3 | etykieta traktatu, typy koszyka/tempa/trudności | §6.6 |
| `diplomacyPanel.ts` | 533 | `:10` | F1 | `formatEntityDisplayName` (`:203`) | `display_name` w DTO bytu |
| `empireDetailTypes.ts` | 732 | `:5` | T1 | typ `ResourceUsageBreakdown` | `EmpireDetailDto.resource_usage` |
| `entityCards/improvementAdapter.ts` | 249 | `:26` | S1 | `terrain-improvements.json` | `StaticCatalogDto` |
| `entityCards/registry.ts` | 194 | `:20-25` | S5 T2 | 5 plików JSON | `StaticCatalogDto` |
| `entityCards/technologyAdapter.ts` | 386 | `:33-36` | S4 | 4 pliki JSON | `StaticCatalogDto` |
| `entityCards/unitAdapter.ts` | 291 | `:39-41` | S2 T2 | `counters.json`, `categoryOf` | `StaticCatalogDto` (+ `unit_category`) |
| `icons/brandAssets.ts` | 267 | `:7,9` | S1 T2 | `categoryOf` (`:177`) | `StaticCatalogDto.units[].category` |
| `improvementBuildConfirm.ts` | 93 | `:4-7` | F2 T1 | lista skutków budowy ulepszenia (`:48-49`) | `ImprovementBuildImpactDto` (§6.7) |
| `leaderPortraits.ts` | 225 | `:16,18` | S1 T1 | `civs.json` | `StaticCatalogDto.civs` |
| `mapLoadingOverlay.ts` | 260 | `:5` | X1 | `MAP_GEN_PHASE_TOTAL` (`:7`) | `MapGenProgressEvent {phase, total, label}` (§6.16) |
| `minimapHud.ts` | 448 | `:10` | X1 | `FOG_EXPLORED_BRIGHTNESS` (`:246`) | `StaticCatalogDto.constants` + `MinimapDto` (§6.14) |
| `orderPanel.ts` | 231 | `:10,12` | T2 | `SocietyLine`, `CitizenUpkeepCoverage` | `CityPanelDto.order` |
| `perfReport.ts` | 315 | `:5-8` | X3 T2 | mapgen/rzeki/sceny | D-UI-7 |
| `preBattle.ts` | 918 | `:12-16` | F1 X1 T1 | `bonusChipTexts` (`:713`) | `PreBattleDto.sides[].bonus_chips` (§6.13) |
| `sceneTimingReport.ts` | 212 | `:5-8` | X2 T2 | mapgen/sceny | D-UI-7 |
| `scienceHubHud.ts` | 792 | `:10-16` | K1 T2 | `RESEARCH_QUEUE_MAX` (`:93-94`), `EraGateInfo` | §6.9 |
| `techDiscoveryNotice.ts` | 946 | `:45-53` | S4 T1 | 4 pliki JSON | `StaticCatalogDto` |
| `techUnlockParse.ts` | 52 | `:20` | S1 | `units.json` | `StaticCatalogDto` |
| `uiParams.ts` | 98 | `:14` | S1 | `ui-params.json` | `StaticCatalogDto.ui_params` (lub plik frontendu — Z2) |
| `unitInfoCard.ts` | 419 | `:27,31` | S1 T2 | `categoryOf` (`:254`) | `UnitCardDto` |
| `unitInfographic.ts` | 171 | `:5,6` | S1 T1 | `categoryOf` (`:99`) | `UnitCardDto` |
| `unitMiniPreview.ts` | 155 | `:5-7` | S1 X1 T1 | `buildUnitModel` (WebGL, `:90`) | miniatura z Rust (D-UI-3, P4-5C) |
| `unitRecruitCard.ts` | 286 | `:5-9` | F1 S1 T3 | `formatManpower` (`:138,142`) | `RecruitOptionDto` (§6.3) |
| `victoryScreen.ts` | 346 | `:7,9` | K1 T1 | `PROG_DOMINACJI_POWER` (`:48`) | `VictoryDto` (§6.13) |
| `wikiHubHud.ts` | 644 | `:4` | S1 | `src/data/wikiBundle.json` | `StaticCatalogDto.wiki` (Z2) |

Pełna lista symboli per plik z klasą i liniami użycia: wynik skryptów §11 (scratchpad Operatora; do odtworzenia komendami §11).

---

## 4. `cityPanel.ts` — rozbiór (97 R + 7 M)

Grupy reguł (symbol → linie użycia; wszystkie importy `cityPanel.ts:52-274`):

| Grupa | Symbole R (linie użycia) | Pole docelowe |
|---|---|---|
| Plony i ekonomia miasta | `buildEconParams` (`:1012,1029,1139,10851`), `cityWorkedTilesForEconomy` (`:511,1148,3287,9878`), `toEconomyCity` (`:1159`), `cityYieldPerTurn` (`:1177…10969`), `cityBuildingEntriesFromBuiltIds` (`:1216`), `mnoznikHandelPieniadzForCivByDifficulty` (`:1190,10879`), `civEconomyYieldMultipliers` (`:1193`), `splitPraca` (`:1218,1358,1369,4999`), `cityPracaInteger` (`:1228`), `tileYield` (`:9774,9793`), `buildTerritoryNodesFromCities` (`:1134`), `improvementKeysForHex` (`:9560…9792`) | `CityPanelDto.yields`, `.okolica.tiles[]` |
| Żywność, racje, wzrost | `buildRationParams` (×5), `getCityRationLevel` (`:1241`), `computeCityRationCost` (`:1245,1387,1395`), `computeGrowthPercentV85` (`:1263,1502`), `growthGainPerTurnSlots` (×5), `turnsUntilNextCitizen` (×4), `rationFoodCostPerPop` (`:1445`), `rationGrowthPercent` (×6), `cityHasSpichlerzBuilding` (`:1144`), `paySpichlerzDrainForCity` (`:1243`), `resolveSpichlerzCityBonusState` (`:1244`), `cityPopulationCap` (`:1278,1281`) | `CityPanelDto.food`, `.growth` (= `CityGrowthDto`, §5), `.ration_levels[]` (podgląd suwaka per poziom) |
| Zdrowie, porządek, szczęście, kultura | `computeCityHealthBreakdown` (`:1149,3288`), `evaluateOrderFromBreakdown` (`:3083,3186`), `porPctBand` (×3), `orderContributionPct` (`:3233`), `kultReligScaleForEra` (×3), `proporcjonalneSzczescie` (`:3026,3054`), `ownShareFromSignal` (`:3056`), `sumBuildingHappinessFromBuiltIds` (`:3064`), `computeCitizenResourceDrain` (`:1255,3168`), `applyPostCaptureLawOverride`/`isPostCaptureLawActive` (`:3224-3229`), `stolicaEasyBonusActive` (`:3139`), `resolveOwnCultureShare` (`:3121`) | `CityPanelDto.health`, `.order`, `.culture` |
| Zamożność i pieniądz | `freshWealthState` (×4), `wealthCap`/`wealthProg`/`wealthMnoznik`/`wealthZadowolenie`/`wealthRownowaga` (`:4794-4837`) | `CityPanelDto.wealth`, `.money` (= dzisiejszy `CityMoneySnap` `:1108`) |
| Suwaki | `normalizePodzialHandlu` (`:1003-1013`), `resolveCityPodzialHandlu` (`:1005`), `adjustHandelSplit` (`:4699,10990`), `clampPodzialPracyBudynkiPercent` (×6), `procentPuliImperiumZBudynkow` (`:1375,4962,5124`) | `CityPanelDto.sliders` (wartość efektywna + domyślna imperium + flaga override) |
| Produkcja i katalog | `buildableProduction` (`:6946,8772,11356`), `eraBuildingCatalog` (`:8657,8672`), `buildingLevelForEpoch` (`:3067,6559,8790`), `buildingEffectAtLevel` (×5), `buildingProductionItem` (`:8792`), `isBuildingSupersededByUpgrade` (`:6862,6871`), `cityBuildingPrereqMet` (`:6870`), `empireResourceLabelSatisfied` (`:6913`), `frontItem` (`:896,5040,8432`), `etaTurns` (×10), `itemCost`/`buildingWorkCost` (`:7645-7646`), `buildingGoldPurchaseCost` (`:6305`), `rushCost` (`:8507`), `buildingTypeQueued` (`:6268,8789`), `upgradeChainSteps` (`:8986,9058`), `groupBuiltBuildingIds` (`:7826,9232`), `cityPalacTier` (`:3211`), `buildingStructuralDefenseBonusPercent` (`:6547`), `filterRuntimeActiveBuiltIds` (`:9080`), `resolveOwnedBuildingInactiveStatus` (`:9065,9086`), `parsePrerequisites` (`:7309-7331`) | `CityPanelDto.production`, `.build_options[]`, `.built[]` |
| Surowce i utrzymanie | `buildingStockCost` (×4), `unitStockCost` (×9), `canAffordBuildingStock` (`:6275`), `missingStockFor` (`:6309,8153,8200`), `ownerResourceStockAll` (`:3168,6146`), `buildingUpkeep`/`buildingResourceUpkeep`/`addResourceCosts` (`:6573-6668`), `unitResourceUpkeep` (×5), `canAffordUnitRecruitStock` (`:8195`), `isUnitRecruitStockChipMissing` (`:8110,8119`) | `BuildOptionDto.stock_cost/missing`, `RecruitOptionDto.*` |
| Rekrutacja i Moc | `purchasableUnits` (`:6198,6204,8911,8930`), `sortByUnitPowerDescending` (`:8910,8929`), `unitNacjaForCivKey` (`:8624`), `civManpowerMaxMult` (`:8052,8864`), `unitManpowerCost` (`:8865`), `unitManpowerCostForType` (`:8053`), `cityLudnoscAbsolutna` (×7), `mnoznikRoleForBuildingId`/`cumulativeMnoznikForBuildingId` (×4) | `CityPanelDto.recruit_options[]` (już posortowane) |
| Szlaki, lista budowy, HUD | `computeTradeRouteBuildingBonusByCity` (`:10898`), `civWideSixStatsFromEmpireSnap` (`:10427,10456`), `dedupeBudowaLista` (`:11377`), `defaultBudowaListaNazwa` (`:11401`), `sanitizeBudowaPriorytetTypow` (×4) | `.trade`, `.budowa`, `EmpireHudDto.civ_wide` |

Mutacje (M) — §7. Fallbacki „bez hooka” (`localProd` `:633-643`, `loadGameData` `:629`, `resolveCityHealth` `:3281-3290`) **znikają** w Rust: jedyną ścieżką jest DTO (ZAŁOŻENIE Z3: brak trybu „panel bez silnika” w frontendzie Tauri; testy panelu dostają DTO-fikstury).

## 5. Pola dzielone renderer ↔ UI (D-UI-9, UI-Q2=A)

Przy UI-Q2=A plakietki/etykiety miast rysuje renderer Rust. Każda wartość widoczna jednocześnie na plakietce i w panelu pochodzi z **jednej** funkcji w Rust, a do UI trafia jako to samo pole:

| Wartość | Dziś renderer (web) | Dziś UI (web) | Jedno pole w Rust (propozycja) |
|---|---|---|---|
| WZROST% na turę + „nakarmione” | `render/cities.ts:392,821` (`getCityGrowth`) ← `cityGrowthLive` (`cityPanel.ts:1527`) | `computeView(...).wzrostProcent` (`cityPanel.ts:1263`), przycięcie do `maxSafe` (`clampedGrowthBreakdown` def. `:1434`, użycia `:1554,5228,10450,10829`) | `CityGrowthDto { pct_per_turn: f64, fed: bool, breakdown: GrowthBreakdownDto, turns_to_next_citizen: Option<u32>, max_safe_ration: u8 }` — liczony raz na rewizję stanu; `CityMapBadge.growth` i `CityPanelDto.growth` to ta sama wartość |
| Etykieta miasta (z dopiskiem miasto-państwo) | `render/cities.ts:784` `formatCityMapLabel` | `cityPanel.ts:10206` `formatCityMapLabel` | `CityRefDto.map_label: String` |
| Bieżąca pozycja produkcji (front kolejki) | `render/cities.ts:802` `frontItem(prod)` | `cityPanel.ts:896,5040,8432` `frontItem` | `CityProductionDto.front: Option<ProductionItemDto { kind, id, label, eta_turns }>` |
| Ostrzeżenie „brak surowców” dla frontu | `render/cities.ts:809-811` (pula ownera − koszt surowcowy) | `missingStockFor` (`cityPanel.ts:6309`) | `ProductionItemDto.stock_missing: BTreeMap<ResourceKey, u32>` (pusty = OK) |
| Stolica | `render/cities.ts:774` `getCapitalCityId` | `CityPanelConfig.getCapitalCityId` (`cityPanel.ts:594`) | `CityRefDto.is_capital: bool` |
| Populacja, nazwa | dane `City` | dane `City` | `CityRefDto.population: u32`, `.name` |

`CityMapBadge` (Rust, wewnętrzny dla renderera; serializowalny dla testów P5.14) = `{ city: CityRefDto, front: Option<ProductionItemDto>, growth: Option<CityGrowthDto> /* tylko miasta gracza, render/cities.ts:821 */, era, walls, wall_kind, level, revolt, owner_color, civ_icon_id }` (pola odczytane z `CityRenderOptions`, `render/cities.ts:282-356`). Klucz cache tekstury plakietki (P4-3 §7 M2) powinien być budowany z tych pól — `NIE_ZMIERZONO` dla Rust (RR-T8).

**ZAŁOŻENIE Z4:** WZROST% jest liczbą zmiennoprzecinkową w DTO (formatowanie do całości/1 miejsca robi UI tą samą funkcją co dziś). Sposób zaokrąglenia weba: `NIE_ZMIERZONO` w tym temacie — do testu P5.14.

---

## 6. Katalog docelowych DTO (propozycja)

Konwencja (**ZAŁOŻENIE Z5**): `serde(rename_all = "camelCase")`, identyfikatory wg P2-3 (`CityId`, `PlayerId`, `UnitId` = newtype), heks = `HexCoord { q: i32, r: i32 }` (mapowanie na `PositionDto(x,y)` — P4-3 §4.3, `NIE_ZMIERZONO`). Transport (**ZAŁOŻENIE Z6**): `engine_state_changed` niesie nagłówek `ViewRevision { rev: u64, turn: u32, active_owner: PlayerId, dirty: Vec<ViewKey> }`; panele dociągają DTO zapytaniem `get_view { key: ViewKey }` (`ViewKey::City(CityId)`, `::Empire(PlayerId)`, `::Hex(HexCoord)`, …). Rozmiar/opóźnienie IPC: `NIE_ZMIERZONO`.

### 6.1 `StaticCatalogDto` (K + S; 88 symboli)
- **Pola:** `buildings, units, tech, terrain_improvements, wonders, counters, civs, city_names_pools, power_params, ui_params, wiki` (zawartość JSON 1:1) + `constants: { handel_pct_step, max_procent_nauka, min/max_podzial_pracy_budynki_percent, max_procent_puli_imperium, max_ulepszenia_praca_auto_percent, wyzywienie_min/max/step, research_queue_max, prog_dominacji_power, citizen_upkeep_rate_per_citizen, handel_zloze_cena_baza, barbarian_cooperation_default_duration_turns, fog_explored_brightness, epoch_number_to_name, improvement_keys, city_building_prereq, water_access_building_ids, city_panel_range_deposit_labels, tempo_gry }` + `labels: { podzial_pracy_pula_lbl/_pelna/_tip, por_band_labels, traktat_handlowy_label, resource_access_trade_withdrawn_reason }` + `unit_category: map UnitTypeKey→Category` (zastępuje `categoryOf` ×6).
- **Konsumenci:** `registry.ts`, `*Adapter.ts`, `techDiscoveryNotice.ts`, `techUnlockParse.ts`, `sciencePicker.ts`, `techTreeView.ts`, `civBrandDisplay.ts`, `leaderPortraits.ts`, `wikiHubHud.ts`, `uiParams.ts`, `power-labels.ts`, `buildModeHud.ts`, `empireDetailPanel.ts`, `cityPanel.ts`, `scienceHubHud.ts`, `victoryScreen.ts`, `minimapHud.ts`, ikony.
- **ZAŁOŻENIE Z2 (D-UI-4 otwarte):** katalog wysyła Rust raz na sesję z hashem treści; frontend **nie** importuje `gra/data/**`. Jeśli właściciel wybierze „JSON w frontendzie”, warunkiem jest test hash(frontend) == hash(Rust) w CI.

### 6.2 `CityPanelDto` (konsument: `cityPanel.ts`, `orderPanel.ts`, `cityUxFrame.ts`; zastępuje 58 hooków `get*`/`is*` z `CityPanelConfig`)
```
CityPanelDto {
  city: CityRefDto,                         // id, owner, q, r, name, map_label, population, is_capital, is_mine
  nav_order: Vec<CityId>,                   // zastępuje axialToWorld w ownerCitiesForNav (cityPanel.ts:10192-10200)
  yields: { praca: i32, pieniadz: f64, nauka: f64, kultura: f64, zywnosc_brutto: f64 },
  food: { koszt_racji: f64, bilans_lokalny: f64, poziom_racji: u8, max_safe_poziom: u8, auto_wyzywienie: bool,
          override_local: bool, ration_levels: Vec<RationPreviewDto>, empire_food: EmpireFoodDto },
  growth: CityGrowthDto,                    // §5 — to samo pole co plakietka
  pop_caps: { bez_akweduktu: u32, spichlerz: u32, z_akweduktem: u32, aktualny: u32, at_cap: bool, ma_spichlerz: bool, ma_akwedukt: bool },
  health: { total: i32, lines: Vec<CityHealthLineDto> },
  order: { szczescie: f64, porzadek_pct: f64, band: u8, band_label: String, lines: Vec<SocietyLineDto>,
           citizen_upkeep: CitizenUpkeepCoverageDto, post_capture_law: Option<String /*banner*/> },
  culture: Option<CultureStateDto>, religion: Option<ReligionStateDto>,   // = dzisiejsze getCultureState/getReligionState (cityPanel.ts:365-390)
  wealth: { poziom: u32, cap: u32, prog: u32, mnoznik: f64, zadowolenie: f64, rownowaga: f64 },
  money: CityMoneySnapDto,                  // = CityMoneySnap (cityPanel.ts:1108-1125)
  manpower: CityManpowerSnapshotDto,
  sliders: { handel: SplitDto, handel_default: SplitDto, handel_override: bool,
             praca_budynki_pct: u8, praca_procent_puli: u8, praca_override: bool },
  production: CityProductionDto,            // kolejka: Vec<ProductionItemDto{kind,id,label,koszt,postep,eta_turns,stock_cost,stock_missing}>, paused, rekrutacja
  build_options: Vec<BuildOptionDto>,       // §6.3, posortowane jak sortProductionItemsByBuildability (cityPanel.ts:6948)
  recruit_options: Vec<RecruitOptionDto>,   // §6.3, posortowane wg Mocy (cityPanel.ts:8910)
  built: Vec<BuiltBuildingGroupDto>,        // grupy, poziom, status nieaktywności, łańcuch ulepszeń, linie efektów
  okolica: { focus, tryb, override_local: bool, range: u32, worked: Vec<HexCoord>, excluded: Vec<HexCoord>,
             illegal_manual: Vec<HexCoord>, tiles: Vec<OkolicaTileDto{hex, yield: TileYieldDto, improvements}> },
  budowa: { tryb, priorytet_typow: Vec<BudowaFocus>, lista: Vec<String>, biblioteka: Vec<BudowaListaTemplateDto>, override_local: bool },
  garrison: Vec<GarrisonUnitDto>,
  trade: { active_routes: u32, building_bonus: f64, missing_treaty_partners: Vec<String> },
  labels: { danina: DaninaLabelForms /*mianownik, dopełniacz, biernik*/ },
  auto_manage: bool,
}
```
Reguły przeniesione (P5.13): cała §4.

### 6.3 `BuildOptionDto` / `RecruitOptionDto`
- `BuildOptionDto { item: ProductionItemDto, level: u8, available: bool, block_reasons: Vec<String>, prereq_chips: Vec<{label, met}>, work_cost: u32, gold_cost: u32, stock_cost, stock_missing, upkeep_gold: f64, upkeep_resources, effect_lines: Vec<String>, structural_defense_pct: Option<f64>, unit_role_mult: Option<{role, cumulative}>, superseded: bool, queued: bool }` — źródła: `cityPanel.ts:6835-7026` (`AvailabilityContext`), `:6862-6913`, `:7623-7667`, `:6573-6668`.
- `RecruitOptionDto { unit_type, label, category, power: f64, gold_cost, manpower_cost, stock_cost, stock_missing, upkeep_resources, affordable: bool, chip_missing: bool }` — źródła: `cityPanel.ts:6198-6220`, `:8052-8053`, `:8106-8200`, `:8864-8865`; konsument też `unitRecruitCard.ts`.

### 6.4 `EmpireHudDto` (konsument: pasek miasta `cityPanel.ts:10414-10456`; poza 49 plikami także `hud.ts` — `NIE_ZMIERZONO` w tym temacie)
= dzisiejszy `EmpireHudSnap` (`cityPanel.ts:1075-1106`: praca pool/rate/upkeep, złoto/rate, nauka/rate, żywność, kultura, religia, rozbicie skarbca) + `civ_wide: SixStatsDto` (`civWideSixStatsFromEmpireSnap` `:10427`).

### 6.5 `EmpireDetailDto` (konsument: `empireDetailPanel.ts`, `empireDetailTypes.ts`, `buildModeHud.ts`)
`{ default_handel: SplitDto, default_praca_procent_puli: u8, default_ration: u8, resource_usage: ResourceUsageBreakdownDto + total, citizen_upkeep_per_citizen, manpower: {obywatele_label, rekruci_total}, improvement_policy: UlepszeniaEmpirePolicyDto, ... }`.
**Suwaki** (`adjustHandelSplit`, `podzialPracyZProcentuPuli`): **ZAŁOŻENIE Z7** — UI wysyła surowe położenie suwaka komendą `set_trade_split`/`set_labor_split` (P2-5 §9 pkt 14), Rust normalizuje i zwraca wartość efektywną w DTO; w trakcie przeciągania UI pokazuje surową wartość (bez przewidywania normalizacji). Czy to widocznie odbiega od weba (skok po puszczeniu): `NIE_ZMIERZONO` → P5.14.

### 6.6 Dyplomacja
- `DiplomacyBasketPreviewDto` (konsument: `diplomacyTradeBasket.ts`, `diplomacyAcceptanceBalance.ts`) — wynik zapytania `diplomacy_preview_basket { partner, mode: trade|gift|treaty, action_id, give: Vec<BasketItemDto>, receive, turns, resource_trade_mode }`:
  `{ give_pn: Option<u32>, receive_pn: Option<u32>, fair_min_pn: u32, balance_pn: i32, accepted: bool, relation: {total, signed, mod_pct, mod_label}, treaty_pw: {my, their, bilateral, base}, trust: {surplus_pn, delta, delta_raw, cap, gained}, dobra_wola: Option<{per_turn, turns}>, gift_trust: Option<u32>, validation: {valid, reason}, currency_forbidden_war: bool, turns_multiplier: f64, brief: {give: String, receive: String} }`.
  **Wymóg:** `accepted` liczy **ta sama** funkcja Rust co bramka przyjęcia propozycji (usuwa udokumentowaną lukę `diplomacyAcceptanceBalance.ts:773-788`).
- Zapytania pomocnicze: `diplomacy_quick_deal` (`computeQuickDealBasket` `diplomacyTradeBasket.ts:2370,2800`), `diplomacy_balance_to_fair` (`balanceGiveItemsToFairMin` `:2545`).
- `TradeableItemsDto { units, techs, zloza: Vec<{id,label,base_price}>, resource_access: Vec<{id,pn}>, surowce: Vec<{id,pn,step}> }` — **ZAŁOŻENIE Z8:** Rust zwraca tylko pozycje dopuszczalne dla pary graczy (dziś UI bierze cały `units.json`/`tech.json`, `:430,436`). To zmiana zawartości listy względem weba → do weryfikacji P5.14; alternatywa 1:1: pełne listy z `StaticCatalogDto`.
- `DiplomacyAudienceDto` (konsument `diplomacyAudience.ts`): `{ nastawienie: {scores, label, hint}, wiarygodnosc: {label, badge_tier, tooltip, tooltip_def, rozbicie: Vec<...>}, treaty_pw: {player, partner, bilateral}, actions: Vec<{id, allowed, allows_multiple_own, lock_note, status_note}>, resource_access_withdrawn: bool }`.
- `DealDisplayDto`/`DiploListDto`: gotowe linie tekstu (`splitNegotiationDealPlayerSides`, `formatDiploCivListLines`).

### 6.7 `HexContextDto` (konsument: `hexContextTooltip.ts`; zdarzenie hover z Rust wg UI-Q3=B)
`{ hex, terrain: {base, overlay, river}, yield_base: TileYieldDto, yield_full: TileYieldDto, city_yield_rows, improvements_active: Vec<{key, name, bonus}>, improvements_available: Vec<{key, name, unlock_labels}>, magazyn_parts: Vec<{resource, amount}>, deposit: Option<{label, hidden_hint}>, owner_city: Option<CityRefDto>, worked: bool, units: Vec<UnitCardDto> }` — źródła `hexContextTooltip.ts:137,248-262,338-349,445-462,503-584`.
`ImprovementBuildImpactDto { lines: Vec<String> }` (konsument `improvementBuildConfirm.ts:42-49`).

### 6.8 `UnitCardDto` (konsumenci: `armyStackHud.ts`, `unitCardStatus.ts`, `hexContextTooltip.ts`, `unitInfoCard.ts`, `unitInfographic.ts`, `unitRecruitCard.ts`)
`{ unit_id, unit_type, label, category, owner, combat: UnitCardCombatDisplayDto, power: f64 /* fieldPower, hexContextTooltip.ts:818 */, hp: {cur,max}, moves: {cur,max}, veteran: {progress, stars: u8, tooltip}, badges: {soft_path: u8, armor_path: u8}, thumbnail: Option<ThumbRef> /* D-UI-3 */ }`.

### 6.9 `ResearchViewDto` (konsumenci: `sciencePicker.ts`, `techTreeView.ts`, `scienceHubHud.ts`)
`{ techs: Vec<{id, base_cost, effective_cost /* scaledResearchCost */, epoka, state, terrain_unlock_labels}>, queue: Vec<TechId>, queue_max, era_gate: Option<EraGateInfoDto>, tempo, difficulty }`.

### 6.10 `NewGameOptionsDto` (konsument: `newGameFlow.ts`; przed `create_session`)
`{ map_sizes, menus_by_map_label: {civ_types, miasta_panstwa, land_fraction_opts}, defaults: {player_civ, start_epoch, render_quality, ...}, civs: Vec<{id, available_at_epoch, matrix: Vec<CivMatrixCellDto{param_label, formatted, intensity, visible_by_default}>}> }` + zapytanie `new_game_preview(settings) -> StartPreviewDto { summary_rows: Vec<(String,String)>, ... }` (`buildStartPreview` `:1150,2009`, `startPreviewSummaryRows` `:2169`).
Uwaga: `render_quality`/`QualityTier` (`newGameFlow.ts:140-146,1984-1986`) to ustawienie renderera, nie reguła gry — zostaje po stronie powłoki (**ZAŁOŻENIE Z9**).

### 6.11 `EntityCardDto` (konsument: `entityCards/*`)
- `Building`: koszt z tempem i trudnością, efekt na poziomach, utrzymanie, koszt surowcowy, mnożnik roli, linia obrony (`buildingAdapter.ts:137-297`) — zapytanie `entity_card(kind, id)` (zależy od trudności/tempa sesji).
- `Unit`/`Tech`/`Improvement`/`Wonder`: z `StaticCatalogDto` (bez reguł).

### 6.12 `SiegePanelDto` (konsumenci: `siegeMapPanel.ts`, `cityAttackChoice.ts`)
`{ ctx: MapSiegeContextDto, city: CityRefDto, food: f64, garnizon: u32, zuzycie: u32, atrycja_next: u32, machines: SiegeMachinesStateDto }` — `atrycja_next`/`zuzycie` dziś wpisane w UI (`siegeMapPanel.ts:219-220`).

### 6.13 Bitwa i koniec gry
`PreBattleDto { sides: Vec<{nazwa, cywilizacja, wodz, bonus_chips: Vec<String>, ...}> }` (`preBattle.ts:708-716`); `BattleSummaryDto` = `PostBattleSummaryData` (`postBattleSummary.ts:4`); `VictoryDto` = `VictoryResult` + `prog_dominacji_pct` (`victoryScreen.ts:48`). Stałe wyglądu bitwy (`battle/battleHudTheme`: `PB_SVG`, kolory, fonty) → kopia w frontendzie (klasa X, nie reguła).

### 6.14 `MinimapDto` (konsument: `minimapHud.ts`; R7 w P4-5)
`{ width, height, tiles: Vec<{teren, fog: hidden|explored|visible, owner}>, viewport: {x,y,w,h} /* z kamery Rust, UI-Q3=B */ }`; klik → komenda widoku `camera_focus(q,r)` (P2-5 §2.11, bez statusu domeny).

### 6.15 `SaveSlotsDto` (konsument: `saveLoadDialog.ts`)
`{ slots: Vec<SaveSlotMetaDto>, last_played: Option<SlotId>, autosaves: Vec<...>, storage_available: bool }`; komendy `save_game`, `load_game`, `delete_save` (P2-5 §2.10). `slotSlugFromLabel`/`uniqueSlotIdFromLabel` → po stronie Rust (identyfikator slotu nadaje powłoka).

### 6.16 Zdarzenia (nie DTO stanu)
`MapGenProgressEvent { phase, total, label }` (`mapLoadingOverlay.ts:7`), `HoverEvent { target: Hex | VeteranBadge(UnitId) | StatChip(CityId) | None }` (UI-Q3=B, P4-5 R12/R13) → UI dociąga `HexContextDto`/`UnitCardDto` albo pokazuje tooltip weterana z `UnitCardDto.veteran.tooltip`.

### 6.17 Diagnostyka (D-UI-7 otwarte)
`perfReport.ts`, `sceneTimingReport.ts`, `perfTestPanel.ts` — `SceneBuildTimings`/`MapGenPhaseTimings` → ewentualny `PerfReportDto` z renderera Rust; poza ścieżką krytyczną (**ZAŁOŻENIE Z10**: nie blokują bramy P5.1, wyłączone z frontendu do decyzji D-UI-7).

---

## 7. Mutacje z UI → komendy (klasa M + IO)

| Dziś (web) | Dowód | Komenda (P2-5) | Uwaga |
|---|---|---|---|
| `enqueue` + pobór surowców `deductBuildingStockCostAcrossCities` | `cityPanel.ts:6265-6285` (`addItem`) | `enqueue_build` (B1) | Pobór surowców **w silniku**, atomowo z dodaniem pozycji |
| `dequeue` + zwrot `refundBuildingStockCostAcrossCities` | `cityPanel.ts:6125-6135` (`cancelQueueItem`) | B3 (usuń/przesuń) | Zwrot i bankowanie postępu (`postepBudynkowUsuniete`) w silniku |
| `promoteToFront` | `cityPanel.ts:8383-8408` | B3 | — |
| `setPaused` | `cityPanel.ts:8522` | `city_set_paused` | — |
| `dequeueRecruitment` | `cityPanel.ts:8284` | `recruit_cancel` (R5) | — |
| reorder kolejki budowy/rekrutacji w UI (`moveQueueItem`, `reorderQueueItem`, `moveRecruitQueueItem`, `reorderRecruitQueueItem`) | `cityPanel.ts:645-720` | B3 | Funkcje lokalne UI (nie import), ale tworzą nowy stan kolejki → komenda |
| `loadFromLocal`, `deleteLocal`, `loadFsaAutosaveFile` (+ IO: `listSaves`, `loadSaveSlotMeta`, `getLastPlayedSlotId`, `extractSaveContextFields`, `isIdbAvailable`, `listFsaAutosaveFiles`) | `saveLoadDialog.ts:185-508`, `:237-240` | P2-5 §2.10 (`load_game`, `delete_save`, `list_saves`) | Import zapisów web wg D7 (`P2-2-GAMESTATE-CONTRACT.md:159-165`) |
| `generujSwiatAsync` | `perfTestPanel.ts:270-282` | — | D-UI-7 |

Zapisy przez hooki (`cfg.setProduction`, `cfg.onRushBuy`, `onPurchaseUnit`, …; 35 hooków `on*`/`set*`, `cityPanel.ts:314-606`) już dziś są granicą akcji — mapowanie 1:1 na komendy w P2-5 §2.13.

## 8. Reguły do przeniesienia do silnika (P5.13) — wg modułu `game/**`

| Moduł web (`game/…`) | Funkcje R używane w UI | Pliki UI | Pole/zapytanie Rust |
|---|---|---|---|
| `turn-economy`, `economy`, `order`, `wealth`, `converters` | `buildEconParams`, `cityWorkedTilesForEconomy`, `toEconomyCity`, `computeCityHealthBreakdown`, `cityYieldPerTurn`, `cityPopulationCap`, `cityBuildingEntriesFromBuiltIds`, `mnoznikHandelPieniadzForCivByDifficulty`, `civEconomyYieldMultipliers`, `sumBuildingHappinessFromBuiltIds`, `tileYield`, `getCityFood`, `wealth*` | `cityPanel`, `hexContextTooltip`, `siegeMapPanel` | `CityPanelDto.yields/health/wealth/pop_caps`, `HexContextDto.yield_*`, `SiegePanelDto.food` |
| `population-growth-v85`, `building-resource-gate` (spichlerz) | `buildRationParams`, `computeCityRationCost`, `computeGrowthPercentV85`, `getCityRationLevel`, `growthGainPerTurnSlots`, `turnsUntilNextCitizen`, `rationFoodCostPerPop`, `rationGrowthPercent`, `paySpichlerzDrainForCity`, `resolveSpichlerzCityBonusState`, `cityHasSpichlerzBuilding` | `cityPanel` | `CityGrowthDto` (§5), `CityPanelDto.food` |
| `society-breakdown`, `society-inputs`, `culture-religion`, `post-capture-law`, `citizen-resource-upkeep` | `evaluateOrderFromBreakdown`, `porPctBand`, `orderContributionPct`, `kultReligScaleForEra`, `proporcjonalneSzczescie`, `ownShareFromSignal`, `stolicaEasyBonusActive`, `resolveOwnCultureShare`, `applyPostCaptureLawOverride`, `isPostCaptureLawActive`, `computeCitizenResourceDrain` | `cityPanel` | `CityPanelDto.order/culture` |
| `production`, `research`, `building-upgrades`, `building-resource-gate`, `building-stock-cost`, `economy-upkeep`, `unit-building-bonuses`, `difficulty-cost` | `buildableProduction`, `eraBuildingCatalog`, `purchasableUnits`, `frontItem`, `etaTurns`, `itemCost`, `buildingWorkCost`, `buildingGoldPurchaseCost`, `rushCost`, `buildingLevelForEpoch`, `buildingEffectAtLevel`, `isBuildingSupersededByUpgrade`, `cityBuildingPrereqMet`, `empireResourceLabelSatisfied`, `upgradeChainSteps`, `groupBuiltBuildingIds`, `cityPalacTier`, `filterRuntimeActiveBuiltIds`, `resolveOwnedBuildingInactiveStatus`, `buildingStockCost`, `unitStockCost`, `missingStockFor`, `canAffordBuildingStock`, `ownerResourceStockAll`, `buildingUpkeep`, `buildingResourceUpkeep`, `unitResourceUpkeep`, `canAffordUnitRecruitStock`, `mnoznikRoleForBuildingId`, `cumulativeMnoznikForBuildingId`, `parsePrerequisites`, `scaledResearchCost` | `cityPanel`, `buildingAdapter`, `sciencePicker`, `techTreeView` | `BuildOptionDto`, `RecruitOptionDto`, `CityProductionDto`, `EntityCardDto::Building`, `ResearchViewDto` |
| `manpower`, `unit-power`, `veteran`, `unit-building-bonuses` (odznaki) | `civManpowerMaxMult`, `cityLudnoscAbsolutna`, `unitManpowerCost(ForType)`, `sortByUnitPowerDescending`, `fieldPower`, `veteranStarCount`, `softPathBadgeLevel`, `armorPathBadgeLevel` | `cityPanel`, `hexContextTooltip`, `unitCardStatus` | `RecruitOptionDto.power/manpower_cost`, `UnitCardDto` |
| `cities` (suwaki, lista budowy), `empire-handel-split`, `empire-hud-totals`, `resource-usage-breakdown` | `normalizePodzialHandlu`, `resolveCityPodzialHandlu`, `adjustHandelSplit`, `clampPodzialPracyBudynkiPercent`, `procentPuliImperiumZBudynkow`, `podzialPracyZProcentuPuli`, `dedupeBudowaLista`, `defaultBudowaListaNazwa`, `sanitizeBudowaPriorytetTypow`, `civWideSixStatsFromEmpireSnap`, `resourceUsageTotal` | `cityPanel`, `empireDetailPanel` | `sliders` (Z7), `budowa`, `EmpireHudDto`, `EmpireDetailDto` |
| `terrain-improvements`, `map/improvement-build`, `resource-access`, `livestock-unlock`, `trade-routes`, `map/territory-work` | `improvementKeysForHex`, `improvementBonusForKey`, `isImprovementAllowedForCiv`, `territoryResourceYieldForImprovement`, `galleryTerrainEligible`, `hexHasClayDeposit`, `isFarmBaseTerrain`, `isImprovementBlockedOnForest`, `isLamaDepositVisibleForCiv`, `computeTradeRouteBuildingBonusByCity`, `buildTerritoryNodesFromCities` | `hexContextTooltip`, `cityPanel` | `HexContextDto`, `CityPanelDto.okolica/trade` |
| `diplomacy-*` (pn-engine, acceptance-points, value-catalog, trade-validation, ai-offer-balance, proposals, war-gates, display, audience-actions) | 36 symboli R (§3.1 wiersze dyplomacji) | `diplomacyTradeBasket`, `diplomacyAcceptanceBalance`, `diplomacyAudience` | `DiplomacyBasketPreviewDto`, `DiplomacyAudienceDto` + zapytania §6.6 |
| `start-preview`, `civ-matrix-semantic`, `civ-entry-epoch`, `map/newGameMapDefaults` | 15 symboli R (`newGameFlow`) | `newGameFlow` | `NewGameOptionsDto`, `new_game_preview` |
| `battle-summary` | `buildPostBattleSummary` | `postBattleSummary` | `BattleSummaryDto` |

## 9. Brama mierzalna dla P5.1 (propozycja)

Na drzewie frontendu Tauri (ścieżka po P5.1):
1. `git grep -n -E "from ['\"](\.\./)+(game|map|units|battle|render)/|import\(['\"](\.\./)+(game|map|units|battle|render)/|from ['\"]three['\"]" -- <frontend>/ui` → **0** (obejmuje formę inline z §1).
2. `git grep -n -E "(\.\./)+data/.*\.json" -- <frontend>/ui` → 0 albo wyłącznie pliki objęte testem hash (Z2).
3. Lista reguł wpisanych bez importu (np. `siegeMapPanel.ts:219-220`) — przegląd ręczny w P5.1, bo brama 1 ich nie wykrywa.
4. Test kontraktu: każde pole §5 ma jedną funkcję źródłową w Rust (test jednostkowy porównujący `CityMapBadge.growth` z `CityPanelDto.growth` dla fikstury).

## 10. ZAŁOŻENIA i `NIE_ZMIERZONO`

**ZAŁOŻENIA Operatora** (niewiążące, do rewizji): Z1 formatery (§2), Z2 katalog statyczny z Rust + hash (§6.1), Z3 brak trybu „panel bez silnika” (§4), Z4 WZROST% jako `f64` (§5), Z5 konwencja serde/ID (§6), Z6 nagłówek rewizji + `get_view` (§6), Z7 suwaki bez lokalnej normalizacji (§6.5), Z8 lista pozycji handlu filtrowana w Rust (§6.6), Z9 jakość renderu poza silnikiem (§6.10), Z10 diagnostyka poza bramą (§6.17).

**NIE_ZMIERZONO:**
1. Reguły gry wpisane w UI bez importu `game/**` (poza znalezionym `siegeMapPanel.ts:219-220`) — wymaga przeglądu 117 plików, nie tylko 49.
2. Dane, które 68 plików UI bez importów logiki dostaje przez callbacki `main.ts` (np. `hud.ts`, `minimapHud.getMinimapData`) — kształt `HudState` i pozostałych konfiguracji nie skatalogowany (`configure*` w `ui/`: `cityPanel.ts:612`, `sciencePicker.ts:1579`, `preBattle.ts:196`, `gamePauseMenu.ts:120`, `empireDetailPanel.ts:79,83,170`, `techTreeView.ts:65`).
3. Sposób zaokrągleń/formatowania liczb w panelach (Z4) i czy normalizacja suwaków po stronie Rust (Z7) jest widoczna dla gracza.
4. Rozmiar DTO i koszt IPC `get_view` dla panelu miasta (P4-5 §7 pkt 2).
5. Mapowanie `HexCoord(q,r)` ↔ `PositionDto(x,y)` (P4-3 §4.3).
6. Klasyfikacja §2 jest heurystyczna (słownik + reguły nazw); granica F/R dla funkcji „…Label” zależnych od reguł (`buildingRequiredActiveLabels`, `labelsForImprovementUnlock`, `terrainUnlockLabelsForTech`) przyjęta jako F z tekstem w DTO.
7. Pełny kształt typów web (`UnitCardCombatDisplay`, `PostBattleSummaryData`, `MapSiegeContext`, `EraGateInfo`, `StartPreview`, …) — pola DTO w §6 dla tych typów odwołują się do typu web 1:1, bez wypisania pól.
8. Czy `buildPostBattleSummary` jest wołany w UI poza sondą testową (`postBattleSummary.ts:595`) — wywołanie produkcyjne w `main.ts`/`battle/**` nie sprawdzone.

## 11. Metoda (komendy)

- `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` → `88df6493`.
- `git archive edb8fb56 gra/src | tar -x -C <scratch>/src` (odczyt poza repo, bez buildu).
- `imp.py` (`python3 -I`): parser `^\s*(import|export)\s+(type\s+)?(…)\s+from\s+['"](…)['"]` (wieloliniowo), rozwiązanie ścieżek względem katalogu pliku, filtr `game|map|units|data|battle|render` w `gra/src` + `../data` (= `gra/data`) → 49 plików / 212 linii (§1).
- `use.py`: rozbiór symboli z ciała importu, wyszukanie użyć `(?<![\w$.])SYM(?![\w$])` w pliku poza linią importu → liczba i pierwsze linie użyć; `uses=0` zweryfikowane `Grep` (§1, importy martwe).
- `cls.py`: klasyfikacja R/M/IO/F/K/S/X/T (słowniki M, X, F, S + reguła `^[A-Z][A-Z0-9_]+$` → K, `import type` → T) → 496 symboli (§2).
- Odczyty kontekstu (`ctx.py`, wycinki linii): `cityPanel.ts:300-720,990-1300,1490-1560,3280-3290,6080-6315,6940-6950,8905-8915,10192-10208,10414-10430,10894-10900`; `diplomacyAcceptanceBalance.ts:700-706,762-795`; `diplomacyTradeBasket.ts:428-450,1074-1082,1295-1301,1918-1936,2366-2373,2540-2547`; `hexContextTooltip.ts:100-146,248-262,445-462,805-820`; `empireDetailPanel.ts:1150-1160,1490-1500`; `siegeMapPanel.ts:210-220`; `postBattleSummary.ts:590-600`; `unitCardStatus.ts:140-150`; `victoryScreen.ts:44-50`; `minimapHud.ts:242-248`; `preBattle.ts:708-716`; `newGameFlow.ts:1146-1152,2007-2011`; `sciencePicker.ts:1176-1181`; `techTreeView.ts:265-270`; `scienceHubHud.ts:90-95`; `buildModeHud.ts:586-594`; `render/cities.ts:282-392,774-821`.
- `Grep` `import\(['"](\.\./)+(game|…)/` w `ui/` → 6 trafień (§1); `Grep` `^export function configure[A-Z]` w `ui/` → 8 (§10 pkt 2).
- Przeczytane dokumenty: `P4-5-UI-SHELL-AUDIT.md` (całość), `P4-3-RUST-RENDERER-ARCH.md` (§2-§4, §7-§8), `P4-10-PICKING-CPU.md` (§0-§1), `P4-11-CAMERA-TERRAIN-CPU.md` (§0), `LEDGER.md:120,134,138`, `P2-2-GAMESTATE-CONTRACT.md` §1-§3, §8, `P2-5-COMMANDS.md` §2.1-§2.2, §9.
- Zero `npm`, `cargo`, buildu; zero zapisu w `gra/**`, `rust-port/**`, `src-tauri/**`.
