# P5.8 — Podział `cityPanel.ts` na kawałki portowalne (plan, bez portu)

**Temat:** `R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1` · **Runda:** 3/5 (Operator, poprawka po zarzutach Evaluatora r1 i Final Control r2: skrypt bez końcowych spacji, punkty wejścia i kryteria K04–K08) · **Pin web:** `edb8fb56` · **Plik:** `gra/src/ui/cityPanel.ts`
**Charakter:** wyłącznie dokument + pomiar. Zero zmian w `gra/**`, zero portu kodu do `frontend-v2`.
**Źródła (odczyt przez `git show`):** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` — `00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md`; `origin/rust-port/parity-v2` — `src-tauri/frontend-v2/PORTING-QUEUE.md`, `P5-7-PORT-HUD-CITYPANEL.md`, `cityPanelUxBridge.ts`.
**Pomiar (odtwarzalny):** `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1/r2-logi/p5-8-pomiar.py` (czyta pin przez `git show`, bez `/tmp`) z konfiguracją `konfig-r2.json`. Log: `r2-logi/01-pomiar-r2.log`; powtórka: `r2-logi/02-determinizm-powtorka.log` (identyczna, `cmp`); dane: `r2-logi/pomiar-r2.json`.

---

## 0. Metryki

| Pozycja | Wynik | Dowód |
|---|---|---|
| LOC pinu | **11 986** (587 707 B) | `01-pomiar-r2.log` (`PIN ... LINES 11986`) |
| Sekcje funkcjonalne | **32** (A1…AE), pokrycie 1:1 | `SECTIONS 32 coverage OK` (assert w skrypcie) |
| Jednostki (deklaracje najwyższego poziomu) | **378**, każda linia w dokładnie jednej | `UNITS 378 coverage OK` |
| Kawałki (r2) | **9** (K01–K09) + nagłówek/importy 284 LOC (nieportowane) | `LOC SUM 11986 ... EQUAL` |
| Graf kawałków | **acykliczny** (`ACYCLIC: YES`), 34 krawędzie, wszystkie w jedną stronę | `CHUNK-LEVEL nontrivial SCC: 0` |
| Powtarzalność pomiaru | identyczny wynik przy dwóch uruchomieniach | `cmp` (`02-determinizm-powtorka.log`) |
| Dryf vs `origin/main` | 332 linie (+259/−73), 67 hunków (pomiar r1, bez zmian) | `r1-logi/04-dryf-sekcje.log` |
| Canvas w pliku | **1 trafienie**: `:2629` — reguła CSS `.civ-cs .unit-mini-canvas` (bez rysowania) | `grep -n -i canvas` na pinie |
| THREE w pliku | tylko w komentarzach: `:27`, `:31` | `grep -n THREE` na pinie |
| Three.js (3D) wchodzi przez | import `:168` (`mountUnitMiniPreview`); użycia `:7871` (slot 3D w `buildUnitDetailCardViaEntityCard`), `:7988` (`attachUnitRowThumb`) | `grep -n unitMiniPreview` na pinie |

## 1. Sekcje funkcjonalne (32) — pokrycie 1:1

Granice = zakresy linii pinu (tabela w skrypcie `SECTIONS`). Klasa: **R** = reguły gry do przeniesienia do silnika (zastępowane polem DTO, nie kopiowane; P5-0 §4, P5.13); **P** = prezentacja; **3D/MAPA** = odłożone (§6).

| ID | Zakres | LOC | Zawartość | Klasa |
|---|---|---:|---|---|
| A1 | 1–284 | 284 | nagłówek, importy (66 instrukcji `import`) | — (nieportowane: importy → DTO/zapytania) |
| A2 | 285–608 | 324 | typy `PodzialHandluSplit`, `PodzialPracySplit`, `GarrisonUnit`, `CityPanelConfig` (`:314-606`) | P (typy → DTO; `CityPanelConfig` znika) |
| B | 609–859 | 251 | stan `cfg`/`cachedData`/`localProd`, `getProd`/`setProd`, reorder kolejek i drag | P + komendy |
| C | 860–1038 | 179 | `el`, `signed`, `tury`, ETA kolejki, skala, `readPodzial*`, `estimateHandelChips` | P + R (`:968-1038`) |
| D | 1039–1347 | 309 | `CityView`, `EmpireHudSnap`, `CityMoneySnap`, `computeView` (`:1137-1303`), `daninaLabelForCity` | **R** (→ `CityPanelDto`) |
| E | 1348–1636 | 289 | `cityPracaSplit`, `cityFoodSplit`, `clampedGrowthBreakdown`, `cityGrowthLive` (`:1527`) | **R** (→ `CityGrowthDto`) |
| F | 1637–1754 | 118 | `resolveEmpireSnap` (`:1637`), `resGlobalLocal`, `resPracaSplitBar` | **R** (→ `EmpireHudDto`) |
| G | 1755–1947 | 193 | `STYLE_ID`, stałe, `CITY_TABS`, ikony marki | P |
| H | 1948–3014 | 1 067 | `ensureStyles` — CSS jako string | P (kopia 1:1) |
| I | 3015–3550 | 536 | `PH`, `resolveOrderState` (`:3084`), `computeOrderStateLocal` (`:3114-3273`), `resolveCityHealth` | **R** (→ `OrderState` z silnika; lokalne przeliczenie usunięte) |
| J | 3551–3835 | 285 | `renderZdrowie`, `buildZdrowieDetailCard`, `renderSurowce`, `renderImperiumZywnosc` | P |
| K | 3836–4221 | 386 | `buildKulturaDetailCard`, `renderKultura`, `renderReligia` | P (dane z DTO) |
| L | 4222–4637 | 416 | wspólne bloki: `statChip`, `appendTabIndicators`, `appendBreakdownLines`, `appendSignedBreakdownSections` | P |
| M | 4638–5193 | 556 | `renderEkonomiaStrip`, `appendPodzialHandlu`, `appendCitySkarbiecBalance`, `renderWealth`, `buildPracaDetailCard`, `renderPodzialPracy` | P + R (sumy, `:4932-5124`) |
| N | 5194–5473 | 280 | `renderBilans`, `renderMagazyn` | P |
| O | 5474–6092 | 619 | `buildRacjeWzrostDetailCard`, karty górnego paska, `wireTopBarStatDetails` | P |
| P | 6093–6477 | 385 | `cancelQueueItem`, `stockCostForQueueItem`, `appendBuildActionButtons`, ikony budynków/jednostek, `YIELD_BRAND` | P + komendy (`enqueue_build`, B3) |
| Q | 6478–7135 | 658 | `buildingUiDisplayLevel`, formatery utrzymania, `buildingRequirementChips`, `buildBuildingInfocard` | **R** + P |
| R | 7136–7464 | 329 | `EPOCH_LABEL`, `techPrereqChain`, `appendDetail*`, `appendTechDetailBlock` | P |
| S | 7465–8049 | 585 | karty budynku/jednostki (`ensureEntityCardBuildingStyles`, `buildBuildingDetailCard*`, `_legacy*`) | P |
| T | 8050–8428 | 379 | `recruitManpowerCost`, `maxAffordableRecruitQuantity`, `recruitUnit`, `appendRecruitmentQueue` | **R** (ludność, maks. ilość) + komendy |
| U | 8429–9256 | 828 | `renderProd`, `missingTechSteps`, `renderBuildList`, `renderPurchasableUnits`, `renderBuildingsOwned` | **R** (`productionCtxForCity`, `missingTechSteps`) + P |
| V | 9257–9494 | 238 | `renderOwnedBuildingsBar`, `renderBuildSplitPanel`, `renderTopBarGarrison`, `buildGarnizonDetailCard` | P |
| W | 9495–10157 | 663 | `TEREN_*`, `okolicaPreviewRadius`, `improvementsInCityRange`, `okolicaHexPoints` (`:9729`), `renderWorkedPreview` (`:9821`) | R (zasięg) + **MAPA** (kafle) |
| X | 10158–10383 | 226 | stan modułu (`rootEl`, `activeCity`, `activeMap`, `activeOnClose`, `pinnedGarrisonCityId`), `switchCity`, `skeleton`, `refreshCityPanelIfOpen` | P (kontroler UI) |
| Y | 10384–10693 | 310 | `W3_STAT_RES_KEY`, `w3CityChip`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems` | R (przepływy) + P |
| Z | 10694–10844 | 151 | `closeCityView`, footer, `renderCivResourceTopBar`, szyny ikon | P |
| AA | 10845–11055 | 211 | `buildHandelDetailCard`, `renderHandelSlidersPanel`, `activeTradeRouteCountForCity` | R + P |
| AB | 11056–11474 | 419 | `renderCivMapChrome`, profile okolicy/budowy, `appendBudowaListaBar` | P (+ R sortowania listy budowy) |
| AC | 11475–11539 | 65 | `renderTopStatsBar`, `appendPanel`, `appendSectionTitleWithDetails` | P (helper) |
| AD | 11540–11947 | 408 | `CITY_PANEL_ICONS_*`, `renderOkolicaPanel`, `renderCityIconRail`, `paintCityPanelSections`, `rerender` | P (orkiestracja malowania) |
| AE | 11948–11986 | 39 | `showCityPanel`, `hideCityPanel`, `isCityPanelOpen`, `getOpenCityPanelCityId` | P (API wejścia) |

Sekcje mieszane (R wewnątrz P) nie mają pomiaru LOC części R: **NIE_ZMIERZONO** (pomiar działa na jednostkach, nie na liniach reguł). Lista jednostek-reguł per kawałek jest zmierzona (§5), jej zawartość względem P5-0 to przypisanie nazwowe.

## 2. Typy i stan

- **Typy** (`interface`/`type`, 3 w A2 + typy deklarowane w sekcjach D/E/I): w porcie idą do kawałka K01 (pierwsze). `CityPanelConfig` (58 hooków) nie jest portowany — zastępowany przez `CityPanelDto` + komendy (P5-0 §6.2).
- **Stan modułu** (`let` na poziomie pliku, `grep -c "^let "` = **13**): `cfg` (`:609`), `cachedData` (`:625`), `scalePx` (`:919`), `showEraBuildingPreview` (`:922`), `activeDrawerTab` (`:1791`), `techHintLinkDelegationBound` (`:7261`), `rootEl` (`:10158`), `activeCity` (`:10159`), `activeMap` (`:10160`), `activeOnClose` (`:10161`), `pinnedGarrisonCityId` (`:10163`), `uxSectionRefresh` (`:10365`), `activeCityPanelTab` (`:11593`).
  W pomiarze stan leży w blokach wg sekcji (K03, K06, K08 — patrz `let units by block` w logu). W porcie: **wszystkie `let` przenoszone do obiektu `ctx` w K01** (ZAŁOŻENIE P5.8-Z6), a funkcje odwołują się do `ctx.*`. Warunek: inicjalizatory `let` nie mogą zależeć od kawałków wyższych (dla `cfg` — od typu `CityPanelConfig`, który znika).

## 3. Cykle — pomiar r2

Metoda (`p5-8-pomiar.py`): graf wartościowych jednostek; krawędź = wystąpienie identyfikatora w ciele jednostki (regex, nie AST; komentarze liczone — pomiar konserwatywny, `strip_comments: false`). Iteracje posortowane, Tarjan z pełną listą SCC (bez obcinania).

1. **Cięcia (wywołania zwrotne do orkiestracji):** `rerender`, `switchCity`, `renderCityIconRightRail` — usunięte z grafu; w porcie wywołania idą przez `ctx.requestRerender()` / `ctx.switchCity()` / `ctx.renderCityIconRail()` (wzorzec P5.6-Z3, P5.7-Z7). Te trzy jednostki trafiają do osobnego kawałka **K09** (orkiestracja, 127 LOC).
2. **Nietrywialne SCC jednostek po cięciach: 5** (`01-pomiar-r2.log`, `UNIT-LEVEL nontrivial SCC after cuts: 5`):
   - SCC 6 jednostek, 75 LOC (`el`, `cpInlineIcons`, `CP_INLINE_EMOJI_BRAND`, `appendDetailSection`, `gridDetailRow`, `appendDetailAlgo`) — sekcje C/G/R;
   - SCC 18 jednostek, 1 017 LOC (`cfg`, `CityPanelConfig`, `computeView`, `cityGrowthLive`, `resolveOrderState`, `computeOrderStateLocal`, `buildHandelDetailCard`, …) — sekcje A2/AA/B/C/D/E/I;
   - SCC 3 (131 LOC, `renderEkonomiaStrip`/`appendPodzialHandlu`/`appendCitySkarbiecBalance`) i SCC 2 (164 LOC, `buildPracaDetailCard`/`renderPodzialPracy`) — sekcja M;
   - SCC 4 (108 LOC, `ENTITY_CARD_BUILDING_STYLE_ID`, `ensureEntityCardBuildingStyles`, `buildBuildingDetailCard*`) — sekcja S.
3. **Zasada:** cykl wewnątrz jednego kawałka jest dopuszczalny (jeden moduł TypeScript); zabroniony jest cykl **między** kawałkami. Każdy SCC jest więc zwijany do jednego węzła i przypisywany w całości do jednego kawałka.
4. **Wynik po zwinięciu SCC:** kawałki = ciągłe bloki porządku topologicznego (Kahn, priorytet = najniższa linia), każdy ≤ 1 500 LOC. Graf kawałków jest acykliczny z konstrukcji i pomiar to potwierdza (`ACYCLIC: YES`, `CHUNK-LEVEL nontrivial SCC: 0`). Wszystkie 34 krawędzie kawałków idą od wyższego numeru do niższego (K09 zależy od K01, K03, K05–K08; nic nie zależy od K09).

Uwaga: wariant z usuniętymi komentarzami (`strip_comments: true`) dawał 0 SCC, ale ta opcja może usuwać fragmenty kodu w stringach (np. `//` w CSS), więc **nie jest dowodem** i nie jest używana w wyniku (NIE_ZMIERZONO co do części krawędzi pochodzących z komentarzy).

## 4. Kawałki portu (kolejność: zależności pierwsze)

Każdy kawałek: LOC z pomiaru (włącznie z jednostkami odłożonymi, których netto jest mniej). Dominujące sekcje wg liczby jednostek; pełna lista jednostek w `pomiar-r2.json` (`block_info`, `blocks`).

| Kawałek | LOC | Jedn. | Linie pinu | Dominujące sekcje | Zawartość (najdłuższe jednostki) | Zależy od |
|---|---:|---:|---|---|---|---|
| **K01 Fundament** | 1 360 | 139 | 285–7390 | G, Q, C, P, E, R, B, F, J, L, D, A2, I | typy, stan `ctx`, formatery, ikony, `el`, prymitywy kart | — |
| **K02 CSS i wspólne bloki** | 1 499 | 23 | 1948–7294 | L, P, R, H | `ensureStyles` (CSS, 1 067 LOC), `appendBreakdownLines`, `appendSignedBreakdownSections` | K01 |
| **K03 Model miasta** | 1 466 | 36 | 314–11055 | B, R, D, E, I, J, AA, C, L | `CityPanelConfig` (→ usuwany), `computeView`, `buildHandelDetailCard`, `computeOrderStateLocal` (→ usuwany), `cfg` | K01, K02 |
| **K04 Karty szczegółów (porządek, bogactwo, wzrost, pasek górny)** | 1 388 | 32 | 794–6756 | P, O, Q, I | `buildKulturaDetailCard`, `buildPorzadekDetailCard`, `buildWealthDetailCard`, `buildRacjeWzrostDetailCard` | K01–K03 |
| **K05 Budynki i karty** | 1 500 | 45 | 4638–9616 | W, Q, S, T, U, M | `_legacyBuildBuildingDetailCard`, `buildBuildingInfocard`, `buildingRequirementChips`, `recruitManpowerCost`, `productionCtxForCity` | K01–K04 |
| **K06 Kolejki i lista produkcji (3D/MAPA odłożone)** | 1 439 | 37 | 5028–10246 | X, W, S, T, U, V | `renderWorkedPreview` (MAPA), `buildUnitDetailCardViaEntityCard` (slot 3D), `appendBuildQueueSection`, `renderBuildList`, `appendOwnedBuildingRow` | K01–K05 |
| **K07 Pasek W3 i okolica** | 1 493 | 23 | 3295–11539 | AC, X, Y, AB, Z | `appendBudowaListaBar`, `buildCityOnlyW3FlankChips`, `renderOkolica`, `renderSpoleczenstwo`, `renderKultura` | K01–K06 |
| **K08 Handel, magazyn, panel prawy** | 1 430 | 39 | 4112–11986 | AD, AE, Z, M, O, U, V, X | `renderMagazyn`, `renderReligia`, `paintCityPanelSections`, `renderPurchasableUnits`, `renderPodzialPracy` | K01–K07 |
| **K09 Orkiestracja (cięte)** | 127 | 3 | 10209–11947 | AD, X, Z | `rerender`, `switchCity`, `renderCityIconRightRail` | K01, K03, K05–K08 (wejścia z ctx) |
| — **NIE PORTOWANE: nagłówek/importy** | 284 | — | 1–284 | A1 | importy (znikają), komentarz nagłówkowy | — |

Suma: 1360 + 1499 + 1466 + 1388 + 1500 + 1439 + 1493 + 1430 + 127 = **11 702** + 284 (nagłówek) = **11 986** (`LOC SUM ... EQUAL`).

**Kolejność portu (nie zmienia się przez zwijanie):** K01 → K02 (CSS może iść równolegle z K01) → K03 → K04 → K05 → K06 → K07 → K08 → K09. Przed startem każdego kawałka: `npm run check` (brak importów spoza dozwolonych modułów), harness DOM porównany z pinem, mutacje.

**Kryteria wyjścia per kawałek** (wspólne): (a) kawałek importuje tylko z kawałków niższych i z DTO; (b) harness DOM dla wymienionych punktów wejścia identyczny z pinem; (c) mutacja pola DTO zmienia wynik tam, gdzie powinna; (d) brak `npm run build`/`dev` w `gra/`. Specyficzne:
- **K01:** typy skompilowane osobno; `ctx` ma wszystkie 13 pól `let`; zero importów z K02–K09.
- **K02:** harness CSS: `ensureStyles` wstrzyknięte raz, identyczny `<style>` jak w pinie.
- **K03:** DTO `CityPanelDto`/`CityGrowthDto` zastępują `computeView`, `cityGrowthLive`, `resolveOrderState`; test: wartości `order` z silnika, nie z lokalnego przeliczenia.
- **K04–K08:** harness DOM dla punktów wejścia wymienionych per kawałek w tabeli §4a (kryterium wspólne (b)), plus kryterium specyficzne z §4a.
- **K06:** 3D/MAPA odłożone: slot 3D zostaje jako placeholder bez `mountUnitMiniPreview`; `renderWorkedPreview` nie portowane do czasu tematu mapy.
- **K09:** `rerender`/`switchCity` wywoływane wyłącznie przez `ctx`; test rejestracji w `cityPanelUxBridge.ts` (ZAŁOŻENIE P5.8-Z7).

### 4a. Punkty wejścia, DTO/komendy i kryteria wyjścia dla K04–K08 (r3)

Punkty wejścia: lista `WEJSCIA` z `01-pomiar-r2.log` (linie 70, 73, 76, 79, 82; heurystyka po prefiksie nazwy, podzbiór, nie pełna lista eksportów — NIE_ZMIERZONO co do kompletności). Każda nazwa należy do wskazanego kawałka wg pomiaru. DTO/komendy: przypisanie z §5 (dla K06 — ZAŁOŻENIE P5.8-Z9, bo §5 nie wylicza jednostek K06). Kryterium specyficzne dopełnia kryteria wspólne (a)–(d) z §4.

| Kawałek | Punkty wejścia (pomiar) | DTO / komendy (§5) | Kryterium wyjścia specyficzne |
|---|---|---|---|
| **K04** | `renderSurowce`, `buildKulturaDetailCard`, `buildPorzadekDetailCard`, `buildWealthDetailCard`, `buildRacjeWzrostDetailCard`, `buildTopBarZywnoscDetailCard`, `buildTopBarLudnoscDetailCard`, `buildTopBarNaukaDetailCard`, `buildTopBarKulturaDetailCard`, `buildTopBarReligiaDetailCard`, `bindBuildQueueDragReorder`, `cancelQueueItem` | `EmpireHudDto` (`ownerHasSpichlerz`, `cityPracaSplit`, `resolveEmpireSnap`, `resolveCityHealth`); `BuildOptionDto.stock_cost` (`buildingStockCostForItem`, `stockCostForQueueItem`, `buildingUiDisplayLevel`); komenda `cancel` (B3) | karty szczegółów i pasek górny renderują się z pól DTO; `cancelQueueItem` wysyła komendę `cancel`, a nie przelicza stanu kolejki lokalnie; harness DOM kart wymienionych obok identyczny z pinem |
| **K05** | `renderEkonomiaStrip`, `appendPodzialHandlu`, `appendCitySkarbiecBalance`, `renderPodzialHandlu`, `buildBuildingInfocard`, `buildBuildingDetailCardViaEntityCard`, `appendBuildingRequirementsBlock`, `appendTechDetailBlock`, `buildTopBarZlotoDetailCard` | `BuildOptionDto` / `RecruitOptionDto` (`affordable`, `missing`, `eta`); zasięg z silnika (`okolicaPreviewRadius`, `improvementsInCityRange`); `buildingRequirementChips`, `recruitManpowerCost`, `maxAffordableRecruitQuantity`, `missingTechSteps`, `productionCtxForCity` (reguły → pola DTO) | `buildingRequirementChips` i `missingTechSteps` nie liczą reguł w UI: wartości z `BuildOptionDto.missing`; `maxAffordableRecruitQuantity` z `RecruitOptionDto`; harness DOM kart budynku identyczny z pinem |
| **K06** (3D/MAPA odłożone) | `renderBuildList`, `appendBuildQueueSection`, `appendRecruitmentQueue`, `appendOwnedBuildingRow`, `appendCatalogBuildingRow`, `appendBuildableItemRow`, `appendUnitRecruitCompactRow`, `appendPodzialPracyInfo`, `buildOwnedBuildingsDetailCard`, `buildUnitDetailCardViaEntityCard`, `renderTopBarGarrison`, `buildGarnizonDetailCard` | ZAŁOŻENIE P5.8-Z9: kolejki i listy z `CityPanelDto` (produkcja, rekrutacja, garnizon); komendy `enqueue_build`, `cancel`/`reorder`/`promote` (B3), `recruit_cancel`; brak nowych reguł (§5) | lista kolejek: kolejność i stan wyłącznie z DTO; slot 3D w `buildUnitDetailCardViaEntityCard` pusty (placeholder), `renderWorkedPreview` i `okolicaHexPoints` nieportowane (§6); harness DOM listy identyczny z pinem poza slotem 3D |
| **K07** | `renderSpoleczenstwo`, `renderZdrowie`, `renderKultura`, `renderOkolica`, `renderBuildSplitPanel`, `renderTopStatsBar`, `appendBudowaListaBar`, `appendBudowaToolbarProfiles`, `appendOkolicaToolbarProfiles`, `appendPanel`, `appendSectionTitleWithDetails`, `renderCityHeaderCompact` | `EmpireHudDto` (przepływy W3, P5-0 §6.4) dla `renderProd`, `w3CityChip`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems`; `CityGrowthDto` i `CityPanelDto` dla pozostałych punktów | przepływy W3 (`buildCityOnlyW3FlankChips`) pochodzą z DTO, nie z lokalnej sumy; `renderOkolica` nie liczy zasięgu lokalnie (zasięg z silnika); harness DOM trzech sekcji `renderSpoleczenstwo`, `renderKultura`, `renderOkolica` identyczny z pinem |
| **K08** | `renderReligia`, `renderMagazyn`, `renderWealth`, `renderPodzialPracy`, `buildPracaDetailCard`, `renderOwnedBuildingsBar`, `renderBuildingsOwnedRightPanel`, `renderCityExitFooter`, `closeCityView`, `wireTopBarStatDetails`, `refreshCityPanelIfOpen`, `paintCityPanelSections` | `RecruitOptionDto` (`renderPurchasableUnits`); `CityPanelDto.budowa` (`renderBuildingsOwned`); komendy `set_trade_split`, `set_labor_split` (`renderHandelSlidersPanel`); `paintCityPanelSections` dostaje wynik `ctx.render*` z K09 | `renderPurchasableUnits` nie liczy maksymalnej ilości rekrutacji (z `RecruitOptionDto`); suwaki handlu wysyłają `set_trade_split`/`set_labor_split` i odświeżają się z DTO; harness DOM `renderReligia`, `renderMagazyn`, `paintCityPanelSections` identyczny z pinem |

Uwaga do §5 (zachowana bez zmian, do decyzji przy portowaniu): `renderProd` (K07, R wg konfiguracji) ma w §5 przypisane `EmpireHudDto`; docelowo może to być `CityPanelDto.produkcja`. Przypisanie nie jest zmierzone (NIE_ZMIERZONO).

## 5. Eksporty i importy między kawałkami (zmierzone) i DTO

Pomiar (`01-pomiar-r2.log`, `EXPORTS`/`IMPORTS`; pełna lista w `pomiar-r2.json`, `exports`):

| Kawałek | Eksportuje (jedn. używanych przez inne kawałki) | Importuje (jedn. z niższych kawałków) |
|---|---:|---:|
| K01 | 118 | 0 |
| K02 | 17 | 24 |
| K03 | 29 | 30 |
| K04 | 26 | 50 |
| K05 | 35 | 58 |
| K06 | 20 | 94 |
| K07 | 14 | 77 |
| K08 | 0 | 105 |
| K09 | 0 | (wejścia z ctx) |

Najczęściej eksportowane (przykłady z logu): K01 — `CityView`, `el`, `daninaLabelForCity`, `tury`; K03 — `cfg`, `gameData`, `getProd`, `readPodzialHandlu`; K04 — `cityPracaSplit`, `resolveEmpireSnap`, `cancelQueueItem`; K05 — `productionCtxForCity`, `buildBuildingBuildTabDetailCard`; K06 — `activeCity`, `activeMap`, `ownerCities` (stan modułu w porcie idzie do `ctx`, §2).

**Jednostki-reguły (R) per kawałek → DTO/zapytanie** (przypisanie zmierzone przez listę `rule_units` w `konfig-r2.json`, mapowanie na nazwy DTO wg P5-0 — zgodność pól z `viewmodel/types.ts` **NIE_ZMIERZONO**):

| Kawałek | Jednostki-reguły | Docelowe DTO / zapytanie |
|---|---|---|
| K01 | `daninaLabelForCity`, `clampedGrowthBreakdown`, `resGlobalLocal` | etykiety z DTO; `EmpireHudDto` |
| K03 | `readPodzialHandlu`, `readOwnerDefaultPodzialHandlu`, `isCapital`, `territoryNodesForPanel`, `computeView`, `ownerHasMennica`, `cityFoodSplit`, `cityGrowthLive`, `buildingHappinessSum`, `resolveOrderState`, `computeOrderStateLocal` (usuwana), `buildHandelDetailCard`, `activeTradeRouteCountForCity` | `CityPanelDto` (miasto, `order`, `sliders`, `trade`); `CityGrowthDto`; `OrderState` z silnika |
| K04 | `ownerHasSpichlerz`, `cityPracaSplit`, `resolveEmpireSnap`, `resolveCityHealth`, `buildingStockCostForItem`, `stockCostForQueueItem`, `buildingUiDisplayLevel` | `EmpireHudDto`; `BuildOptionDto.stock_cost`; komenda `cancel` (B3) |
| K05 | `buildingRequirementChips`, `recruitManpowerCost`, `maxAffordableRecruitQuantity`, `missingTechSteps`, `productionCtxForCity`, `okolicaPreviewRadius`, `improvementsInCityRange` | `BuildOptionDto` / `RecruitOptionDto` (`affordable`, `missing`, `eta`); zasięg z silnika |
| K07 | `renderProd`, `w3CityChip`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems` | `EmpireHudDto` (przepływy W3, P5-0 §6.4) |
| K08 | `renderPurchasableUnits`, `renderBuildingsOwned`, `renderHandelSlidersPanel` | `RecruitOptionDto`; `CityPanelDto.budowa`; komendy `set_trade_split`, `set_labor_split` |

K02, K06 i K09 nie mają jednostek-reguł (K06 ma wyłącznie zasięg/kafle odłożone i karty).

Zapytania/komendy (P5-0 §7, P5.6/P5.7): `enqueue_build`, B3 (`cancel`/`reorder`/`promote`), `city_set_paused`, `recruit_cancel`, `set_trade_split`, `set_labor_split`.

## 6. Grafika: odłożona na koniec

Zgodnie z decyzją właściciela (3D i mapa na koniec, po wolnym miejscu w limicie). Wszystkie jednostki odłożone leżą w **K06** (pomiar: `ODLOZONE` dla K06):

| Jednostka (pin) | LOC | Co | Status |
|---|---:|---|---|
| `renderWorkedPreview` (`:9821`) | 197 | rysowanie kafli okolicy (MAPA) | **ODŁOŻONE — MAPA** |
| `attachUnitRowThumb` (`:7976`, miniatura `:7988`) | 21 | miniatura 3D jednostki na liście | **ODŁOŻONE — 3D** |
| `okolicaHexPoints` (`:9729`) | 9 | geometria heksów (MAPA) | **ODŁOŻONE — MAPA** |
| `buildUnitDetailCard` (`:7885`) | 12 | wrapper karty jednostki (wywołuje ViaEntityCard) | **ODŁOŻONE — 3D (konserwatywnie)** |
| `buildUnitDetailCardViaEntityCard` (`:7861`, slot 3D `:7871`) | 24 | karta jednostki; slot 3D | **Port bez slotu 3D** (placeholder; sama karta portowana w K06) |

Canvas: jedno trafienie `:2629` to reguła CSS `.unit-mini-canvas` bez kodu rysującego — nie wymaga osobnego odłożenia. 3D wchodzi tylko przez `unitMiniPreview.ts` (`:168`).

## 7. Dryf po pinie (`origin/main`)

`git diff --stat edb8fb56 origin/main -- gra/src/ui/cityPanel.ts`: `1 file changed, 259 insertions(+), 73 deletions(-)` (332 linie, 67 hunków; pomiar r1 `r1-logi/04-dryf-sekcje.log`, nieprzemierzony w r2). Najwięcej hunków w sekcjach U (18), T (12), AA (7), S (6), C (5) — czyli K05/K06/K08/K03/K01. Port od pinu `edb8fb56` (PQ) wymaga decyzji orkiestratora; w tym dokumencie przyjęto pin (ZAŁOŻENIE P5.8-Z2).

## 8. Plan rund

- **r2:** zwinięcie SCC, kawałki K01–K09 z pomiarem acykliczności, eksporty/importy, DTO per kawałek, kryteria wyjścia. → Evaluator/Final Control (FAIL: 2 x NAPRAW).
- **r3 (ten dokument):** skrypt pomiaru bez końcowych spacji (logi r2 przeliczone, `cmp` identyczne), punkty wejścia i kryteria wyjścia K04–K08 w §4a. → Evaluator/Final Control.
- **r3+:** port kawałków wg §4 (osobne tematy, każdy z harnessem); K09 ostatni.
- **Na koniec (po limicie, wg decyzji właściciela):** 3D `unitMiniPreview` (§6) i mapa kafli `renderWorkedPreview`/`okolicaHexPoints`.

## 9. Założenia (rozstrzygnięte w dokumencie, bez pytań)

- **P5.8-Z1:** cykle przez `rerender`/`switchCity`/`renderCityIconRightRail` rozstrzygane przez `ctx` (callbacki), kawałek K09 na końcu.
- **P5.8-Z2:** źródłem portu jest pin `edb8fb56`; drift §7 nie jest włączany.
- **P5.8-Z3:** sekcje R nie są portowane jako kod — zastępowane DTO/zapytaniami z Rust (P5.13); `computeOrderStateLocal` usuwane.
- **P5.8-Z4:** nagłówek/importy (A1, 284 LOC) nie są kawałkiem portu.
- **P5.8-Z5:** granica jednostki = deklaracja najwyższego poziomu (kolumna 0); komentarze międzyfunkcyjne należą do jednostki, przed którą stoją; suma LOC = 11 986 bez luk.
- **P5.8-Z6:** wszystkie 13 `let` na poziomie pliku → `ctx` w K01; typy → K01; `CityPanelConfig` nie jest portowany.
- **P5.8-Z7:** rejestracja implementacji w `cityPanelUxBridge.ts` dopiero po K01–K08 (K09).
- **P5.8-Z8:** regex-owe krawędzie są nadmiarowe (komentarze, nazwy właściwości) — błąd kierunkowo bezpieczny: może tylko zwiększyć zwijane SCC, nie ukryć cyklu.
- **P5.8-Z9 (r3):** przypisanie DTO/komend dla K06 (kolejki, listy, garnizon) nie jest w §5; przyjęto nazwowo z P5-0 §7 (`enqueue_build`, B3, `recruit_cancel`). Nieweryfikowane względem `viewmodel/types.ts` (NIE_ZMIERZONO).
- **P5.8-Z10 (r3):** nazwa K04 w §4 poprawiona na zgodną z zawartością pomiaru (K04 nie zawiera `renderZdrowie`/`renderKultura`, te są w K07); treść kawałków bez zmian.

## 10. Zakres i ograniczenia

- Zmierzono: LOC, pokrycie linii i jednostek, SCC po cięciach, graf i acykliczność kawałków, eksporty/importy, rozkład jednostek 3D/MAPA, canvas/THREE (grep), powtarzalność (`cmp`).
- **NIE_ZMIERZONO:** LOC części R w sekcjach mieszanych; dokładność krawędzi regex (nie AST); zgodność pól DTO z `viewmodel/types.ts` na `parity-v2`; zachowanie w przeglądarce; LOC kawałków po przyszłych zmianach dryfu.
- Skrypty r1 w `r1-logi/` (`p5-8-chunki.py`, `p5-8-scc-funkcji.py`, `p5-8-drift.py`) czytają pliki z `/tmp/...` i są **nieodtwarzalne** — zastąpione przez `r2-logi/p5-8-pomiar.py`. Zostają jako historia; tabele z r1 (`02-chunki-cykle.log`) nie są podstawą tego planu.

## 11. Odpowiedzi na zarzuty Evaluatora r1

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Kryterium „kolejność bez cykli” niespełnione; status r1 powinien być FAIL | **PRZYJĘTE.** Status r1 korygowany na **FAIL** (powrót do Operatora z tym samym ID). r2 spełnia kryterium pomiarowo. | `ACYCLIC: YES`, `CHUNK-LEVEL nontrivial SCC: 0` |
| 2 | Lista przecięć w §3 niekompletna (K1→K8, K3→K4, K4→K5, K5→K6, K5→K7, K7→K9 …) | **PRZYJĘTE.** Lista ręczna zastąpiona pełnym grafem kawałków z pomiaru (34 krawędzie, wszystkie w logu). Krawędzie wymienione w zarzucie są teraz w grafie i nie tworzą cyklu. | `01-pomiar-r2.log`, sekcja `CHUNK EDGES` |
| 3 | Pomiar cykli niereprodukowalny; „5 cykli” to ucięcie `cycles[:5]` | **PRZYJĘTE.** Liczba 5 dotyczy SCC jednostek po cięciach (pełna lista), nie ucięcia. Pomiar deterministyczny (sortowane iteracje, pełna lista SCC), powtórzony z identycznym wynikiem. | `02-determinizm-powtorka.log` = `01-pomiar-r2.log` |
| 4 | Skrypty zależne od `/tmp` i niezacommitowanego `inv.py` | **PRZYJĘTE.** Nowy skrypt czyta pin przez `git show`, konfiguracja w repo. Stare skrypty r1 oznaczone jako nieodtwarzalne (§10). | `r2-logi/p5-8-pomiar.py`, `r2-logi/konfig-r2.json` |
| 5 | 31 sekcji zamiast 32 | **PRZYJĘTE.** Poprawione na **32** (A1…AE). | `SECTIONS 32 coverage OK` |
| 6 | Brak tabeli eksportów/importów i mapowania na DTO | **PRZYJĘTE.** Eksporty i importy per kawałek (§5, log, JSON); jednostki-reguły per kawałek z przypisaniem do DTO. | `EXPORTS`/`IMPORTS` w logu; `pomiar-r2.json` |
| 7 | Brak kryteriów wyjścia per kawałek | **PRZYJĘTE.** Kryteria wspólne i specyficzne per kawałek (§4). | §4 |
| 8 | „Canvas/WebGL: 0 trafień” zbyt kategoryczne | **PRZYJĘTE.** Poprawione: 1 trafienie `:2629` (CSS), THREE tylko w komentarzach `:27`, `:31`. | §0, §6 |

Drobne zmiany względem r1 (z przyczyn merytorycznych, nie formalnych): `computeOrderStateLocal` usuwane; `CityPanelConfig` nie portowany; LOC kawałków z pomiaru zamiast szacunku „≈1 420”.
