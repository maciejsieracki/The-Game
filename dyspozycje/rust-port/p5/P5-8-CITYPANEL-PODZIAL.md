# P5.8 — Podział `cityPanel.ts` na kawałki portowalne (plan, bez portu)

**Temat:** `R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1` (runda 1/5, Operator) · **Pin web:** `edb8fb56` · **Plik:** `gra/src/ui/cityPanel.ts`
**Charakter:** wyłącznie dokument. Zero zmian w `gra/**`, zero portu kodu do `frontend-v2`.
**Źródła (odczyt przez `git show`):** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` — `00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§4, §6.2–6.4, §7); `origin/rust-port/parity-v2` — `src-tauri/frontend-v2/PORTING-QUEUE.md` (wiersze 78–82, statusy P5.6/P5.7), `dyspozycje/rust-port/p5/P5-7-PORT-HUD-CITYPANEL.md` (§11), `src-tauri/frontend-v2/src/ui/cityPanelUxBridge.ts`. `cityUxFrame.ts` na pinie: `gra/src/ui/cityUxFrame.ts` (296 LOC, już przeniesiony w P5.7 r3).

Uwaga dot. `P5-0-VIEWMODEL-CATALOG.md`: na `parity-v2` go nie ma; plik leży w docs-branchu (`dyspozycje/rust-port/p5/`). Odczytano stamtąd.

---

## 0. Metryki

| Pozycja | Wynik | Dowód |
|---|---|---|
| LOC pinu | **11 986** (`wc -l`; 587 707 bajtów) | `git show edb8fb56:gra/src/ui/cityPanel.ts` → `r1-logi/01-inwentarz-pokrycie.log` |
| Suma LOC sekcji (§2) | **11 986** = 11 986 | `r1-logi/01-inwentarz-pokrycie.log` (`LOC sum 11986 lines 11986`, `EXIT=0`) |
| Pokrycie linii | każda linia w dokładnie jednej sekcji (skrypt `assert`, 0 błędów) | `r1-logi/p5-8-inwentarz.py` |
| Dryf vs `origin/main` | `332` linii (`+259/−73`), **67 hunków** (po stronie pinu) | `git diff --stat edb8fb56 origin/main -- gra/src/ui/cityPanel.ts`; `r1-logi/04-dryf-sekcje.log` |
| Grafika 3D w pliku | brak bezpośredniego `THREE`/`<canvas>`/WebGL; 3D wchodzi przez `unitMiniPreview.ts` (Three.js) | `grep -nE "THREE|WebGL|canvas"` — 0 trafień w kodzie; `mountUnitMiniPreview` = `:168, :7871, :7988` |

## 1. Sekcje funkcjonalne (31) — pokrycie 1:1

Granice = zakresy linii pinu. Klasa: **R** = zawiera reguły gry do przeniesienia do silnika (P5-0 §4, P5.13) — w porcie zastępowane polem DTO, nie kopiowane; **P** = prezentacja (portowana 1:1 lub z DTO); **3D/MAPA** = grafika odłożona (§6).

| ID | Zakres | LOC | Zawartość | Klasa |
|---|---|---:|---|---|
| A1 | 1–284 | 284 | nagłówek, importy (≈60 modułów) | — (znika: importy → DTO/zapytania) |
| A2 | 285–608 | 324 | typy `PodzialHandluSplit`, `PodzialPracySplit`, `GarrisonUnit`, **`CityPanelConfig`** (58 hooków, `:314-606`) | P (typy → DTO) |
| B | 609–859 | 251 | stan `cfg`/`cachedData`/`localProd`, `getProd`/`setProd`, reorder kolejek i drag (`:645-860`) | P + komendy (§7 P5-0) |
| C | 860–1038 | 179 | `el`, `signed`, `tury`, ETA kolejki, skala, `readPodzial*`, `estimateHandelChips` | P + R (ETA, podział: `:968-1038`) |
| D | 1039–1347 | 309 | `CityView`, `EmpireHudSnap`, `CityMoneySnap`, **`computeView` (`:1137-1303`)**, `ownerHasSpichlerz/Mennica`, `daninaLabelForCity` | **R** (cały model → `CityPanelDto`) |
| E | 1348–1636 | 289 | `cityPracaSplit`, `cityFoodSplit`, `clampedGrowthBreakdown`, `cityGrowthLive` (`:1527`), pasek wzrostu | **R** (→ `CityGrowthDto`, §5 P5-0) |
| F | 1637–1754 | 118 | `resolveEmpireSnap` (`:1637`), `resGlobalLocal`, `resPracaSplitBar`, `resLocalOnly` | **R** (→ `EmpireHudDto`, §6.4) |
| G | 1755–1947 | 193 | `STYLE_ID`, stałe, `CITY_TABS`, ikony marki, `cityPanelChipIcon`, fokusy okolicy/budowy | P |
| H | 1948–3014 | 1 067 | `ensureStyles` — **sam CSS (string)** | P (kopia 1:1) |
| I | 3015–3550 | 536 | `PH`, `religiaSzPunkty`, `resolveOrderState` (`:3084`), **`computeOrderStateLocal` (`:3114-3273`, lokalne przeliczenie porządku)**, `resolveCityHealth` (`:3281`), `renderSpoleczenstwo`, karta porządku | **R** (→ `OrderState` z silnika, `CityPanelDto.order`) |
| J | 3551–3835 | 285 | `renderZdrowie`, `buildZdrowieDetailCard`, `renderSurowce`, `renderImperiumZywnosc`, `appendCompositionBlock` | P (+ resztki R w karcie zdrowia) |
| K | 3836–4221 | 386 | `buildKulturaDetailCard`, `renderKultura`, `renderReligia` | P (dane z DTO) |
| L | 4222–4637 | 416 | wspólne bloki: `statChip`, `appendTabIndicators`, `appendWealthCompactStrip`, `appendBreakdownLines`, `appendSignedBreakdownSections`, `appendIndywidualneToggle` | P |
| M | 4638–5193 | 556 | `renderEkonomiaStrip`, `appendPodzialHandlu`, `appendCitySkarbiecBalance`, `renderWealth`, `buildWealthDetailCard`, `buildPracaDetailCard`, `appendPodzialPracyInfo`, `renderPodzialPracy` | P + R (sumy, `:4932-5124`) |
| N | 5194–5473 | 280 | `renderBilans`, `renderMagazyn` | P |
| O | 5474–6092 | 619 | `buildRacjeWzrostDetailCard`, karty górnego paska (`buildTopBarXDetailCard`), `wireTopBarStatDetails` | P (+ R w karcie racji) |
| P | 6093–6477 | 385 | `cancelQueueItem`, `stockCostForQueueItem`, pasek zasobów budowy, `addItem`, `appendBuildActionButtons`, ikony budynków/jednostek, `createScrollList`, `YIELD_BRAND` | P + komendy (`enqueue_build`, B3) |
| Q | 6478–7135 | 658 | `buildingUiDisplayLevel`, formatery wydajności/utrzymania/konwertery, `buildingRequirementChips`, `buildBuildingInfocard` | **R** (utrzymanie, wymagania, poziomy) + P |
| R | 7136–7464 | 329 | `EPOCH_LABEL`, `playerFacingNote`, `techPrereqChain`, `appendDetail*`, `appendTechDetailBlock` (prymitywy kart) | P |
| S | 7465–8049 | 585 | karty budynku/jednostki: `ensureEntityCardBuildingStyles`, `buildBuildingDetailCard(ViaEntityCard)`, `_legacy*`, `buildUnitDetailCard*`, `attachUnitRowThumb` | P + **3D** (`:7865-7872`, `:7976-7996`) |
| T | 8050–8428 | 379 | `recruitManpowerCost`, `maxAffordableRecruitQuantity`, `recruitUnit`, `appendRecruitmentQueue`, `appendBuildQueueSection` | R (ludność, maks. ilość) + komendy |
| U | 8429–9256 | 828 | `renderProd`, `missingTechSteps`, `renderBuildList`, `renderPurchasableUnits`, `appendOwnedBuildingRow`, `renderBuildingsOwned`, `renderSplitPane` | R (`purchasableUnits`, `productionCtxForCity`) + P |
| V | 9257–9494 | 238 | `renderOwnedBuildingsBar`, `renderBuildSplitPanel`, `appendGarrisonUnitChip`, `renderTopBarGarrison`, `buildGarnizonDetailCard` | P |
| W | 9495–10157 | 663 | `TEREN_*`, `okolicaPreviewRadius`, `improvementsInCityRange`, `buildOkolicaDetailCard`, `okolicaHexPoints` (`:9729`), `renderWorkedPreview` (`:9821-10017`, podgląd kafli), `renderOkolica` | R (zasięg, kafle) + **MAPA** (rysowanie SVG kafli) |
| X | 10158–10383 | 226 | stan modułu (`rootEl`, `activeCity`, `activeMap`, `activeOnClose`, `pinnedGarrisonCityId`), `switchCity`, `navigateCityPanel`, `skeleton`, `refreshCityPanelIfOpen`, `CityPanelUxMounts`, `clearCityPanelUxMode` | P (kontroler UI) |
| Y | 10384–10693 | 310 | `W3_STAT_RES_KEY`, `w3CityChip`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems` | R (przepływy) + P |
| Z | 10694–10844 | 151 | `closeCityView`, footer, `capitalBadgeOrButtonHtml`, `renderCivResourceTopBar`, szyny ikon, `renderCityHeaderCompact` | P |
| AA | 10845–11055 | 211 | `buildHandelDetailCard`, `renderHandelSlidersPanel`, `activeTradeRouteCountForCity` | R (`:10875-10987`, suwaki) + P |
| AB | 11056–11474 | 419 | `renderCivMapChrome`, `appendOkolicaToolbarProfiles`, `appendBudowaToolbarProfiles`, `appendBudowaListaBar` | P (+ lista budowy: R sortowania/deduplikacji) |
| AC | 11475–11539 | 65 | `renderTopStatsBar`, `appendPanel`, `resolveDetailSideHint`, `appendSectionTitleWithDetails` | P (helper, używany przez wiele sekcji) |
| AD | 11540–11947 | 408 | `CITY_PANEL_ICONS_*`, `renderOkolicaPanel`, `renderCityIconRail`, `withW4TabCard`, `renderLeftPanelTab`, `renderRightPanelTab`, `paintCityPanelSections`, `rerender` | P (orkiestracja malowania) |
| AE | 11948–11986 | 39 | `showCityPanel`, `hideCityPanel`, `closeCityPanelIfOpen`, `isCityPanelOpen`, `getOpenCityPanelCityId` | P (API wejścia) |

Sumy klas: sekcje czysto regułowe to D, E, F, I (łącznie 1 252 LOC); pozostałe klasy R są mieszane z prezentacją w obrębie sekcji. Sumy LOC części R w sekcjach mieszanych: **NIE_ZMIERZONO** (wymagałoby ręcznego przypisania linii; dokładne linie reguł: P5-0 §4 i P5.7 r1).

## 2. Wspólne typy i stan — najpierw

**Typy (do `viewmodel/types.ts` lub `ui/cityPanel/types.ts`, przed kawałkami):** `CityView`, `EmpireHudSnap`, `CityMoneySnap`, `CityGrowthLive`, `BreakdownLine`, `TabIndicatorChip`, `PodzialHandluSplit`, `PodzialPracySplit`, `GarrisonUnit`, `CityPanelConfig` (zastąpiony przez `CityPanelDto` + komendy; 58 hooków `get*/is*` znika zgodnie z P5-0 §6.2).

**Stan modułu (do obiektu `ctx`, nie zmienne globalne):** `cfg`, `cachedData`, `localProd`, `activeCity`, `activeMap`, `activeOnClose`, `rootEl`, `pinnedGarrisonCityId`, `activeDrawerTab`, `activeCityPanelTab`, `scalePx`, `showEraBuildingPreview`, `techHintLinkDelegationBound`, `uxSectionRefresh` (14 zmiennych `let`, `r1-logi/02-chunki-cykle.log`, linia `STATE vars`).

## 3. Cykle w grafie zależności (pomiar)

Metoda: graf wywołań między 358 deklaracjami wartościowymi (`function`/`const`/`let`/`class`), krawędź = wystąpienie identyfikatora w ciele deklaracji (regex, bez AST). Typy (`interface`/`type`) liczone osobno — idą najpierw (§2).

- **Pomiar surowy po sekcjach:** jedna SCC obejmująca 30 z 31 sekcji (`r1-logi/01-inwentarz-pokrycie.log`, `SCC>1`). Przyczyna (krawędzie zwrotne do orkiestracji): sekcje B, L, M, N, P, T, U, V, Z, AB wołają `rerender()` (AD); `switchCity()` (X) i `renderCityIconRightRail` (AD↔Z) też tworzą cykl.
- **Po przecięciu 3 krawędzi zwrotnych** (`rerender`, `switchCity`, `renderCityIconRightRail` → w porcie: wstrzyknięty `ctx.requestRerender()` / `ctx.switchCity()`, wzorzec mostu z P5.6-Z3 i P5.7-Z7): nietrywialne SCC na poziomie funkcji = **6** (`r1-logi/03-scc-funkcji.log`):
  1. `el`, `cpInlineIcons`, `CP_INLINE_EMOJI_BRAND`, `appendDetailSection`, `appendDetailAlgo`, `gridDetailRow` (C/G/R) → przenieść do wspólnego modułu DOM-helperów (jeden kawałek).
  2. `resolveOrderState` ↔ `computeOrderStateLocal` (I) → jeden blok, do usunięcia (reguła; zastąpione `OrderState` z silnika).
  3. `buildBuildingDetailCard` ↔ `buildBuildingDetailCardViaEntityCard` ↔ `ensureEntityCardBuildingStyles` (S) → jeden blok.
  4. `cityFoodSplit` ↔ `cityGrowthLive` (E) → jeden blok (do usunięcia: reguła → `CityGrowthDto`).
  5. `renderEkonomiaStrip` ↔ `appendPodzialHandlu` ↔ `appendCitySkarbiecBalance` (M) → jeden blok.
  6. `renderPodzialPracy` ↔ `buildPracaDetailCard` (M) → jeden blok.
- **Kawałki (§4) — cykle międzykawałkowe po pomiarze:** `r1-logi/02-chunki-cykle.log` (`chunk cycles`): 5 cykli, np. K2↔K9, K4↔K9, K5→K6→K7→K5, K6↔K2. Każda krawędź ma świadka (funkcja→funkcja). **Stan: NIE_ZMIERZONO po przeróbkach** — poniższa lista przecięć jest planem, nie wynikiem pomiaru; kryterium „kolejność bez cykli” **nie jest spełnione** dla obecnego podziału, zostaje do r2 (§8).

Planowane przecięcia (każde = przeniesienie helpera w dół albo zastąpienie DTO):

| Krawędź (świadek) | Przecięcie |
|---|---|
| K1→K2: `cpInlineIcons`→`loafIconHtml` (F) | `loafIconHtml` przenieść do K1 (helper ikon, 6 LOC) |
| K4→K2: `renderEkonomiaStrip`→`daninaLabelForCity` (D) | `daninaLabelForCity` do K1 (czysta funkcja nazwy; wartość z DTO) |
| K4→K9: `renderWealth`→`appendSectionTitleWithDetails` (AC) | `AC` (65 LOC) do K1 (helper sekcji) |
| K5→K6: `buildingBonusChipsHtml`→`yieldBrandIconHtml` (P) | `YIELD_BRAND`+`yieldBrandIconHtml` do K1 |
| K5→K7: `buildingRequirementChips`→`missingTechSteps` (U) | `missingTechSteps` do K1 |
| K6→K7: `appendBuildQueueSection`→`productionCtxForCity` (U) | `productionCtxForCity` do K1 (kontekst dostępności z DTO) |
| K6→K5: `maxAffordableRecruitQuantity`→`buildingStockCostChipsHtml` (Q) | znika: koszty z `BuildOptionDto.stock_cost` (P5-0 §6.3) |
| K2→K9: `computeView`→`buildHandelDetailCard` (AA); K9→K2: `w3CityChip`→`resolveEmpireSnap` (F) | znika: K2 (model) zastąpiony DTO (`CityPanelDto`, `EmpireHudDto`) |
| K9→K7: `renderCivResourceTopBar`→`renderTopBarGarrison` (V) | `V` przenieść do K9 albo wycofać garnizon z paska (DTO `garrison`) |

Po przecięciach K1 rośnie do ≈1 420 LOC (szacunek: 1 276 + ≈145), nadal ≤1 500.

## 4. Kawałki portu (proponowana kolejność; leaf → root)

Każdy kawałek ≤ 1 500 LOC. Kryterium wyjścia (per kawałek): `npm run check` 0 trafień importów `game|map|units|battle|render|data`, harness DOM 0 różnic vs pin (wzorzec `run-cityux.mjs`), mutacje wykryte.

| # | Kawałek | Sekcje | LOC pinu | Zawartość / warunek wejścia |
|---|---|---|---:|---|
| 1 | **K1-Fundament** | A2, B, C, G, R, + przeniesione helpery z §3 | 1 276 (≈1 420 po) | typy, stan `ctx`, formatery, ikony, prymitywy kart. Pierwszy. |
| 2 | **K0-CSS** | H | 1 067 | `ensureStyles` — kopia 1:1, bez logiki. Może równolegle z 1. |
| 3 | **K2-Model-DTO** | D, E, F, I | 1 252 | **tylko adaptery DTO** (czytają `CityPanelDto`, `CityGrowthDto`, `EmpireHudDto`, `OrderState`); reguły usunięte — wymaga r2 w Rust |
| 4 | **K3-Zdrowie-kultura** | J, K, L, N | 1 367 | prezentacja zdrowia, kultury, religii, wspólnych bloków i magazynu |
| 5 | **K4-Ekonomia-topbar** | M, O | 1 175 | ekonomia, skarbiec, praca, górny pasek i karty szczegółów |
| 6 | **K5-Budynki-karty** | Q, S | 1 243 | katalog budynków i infokarty; **3D jednostek (`:7865-7872`, `:7976-7996`) odłożone** |
| 7 | **K6-Kolejki** | P, T | 764 | akcje kolejki i rekrutacji → komendy `enqueue_build`, B3, `recruit_*` |
| 8 | **K7-Lista-produkcji** | U, V, AB | 1 485 | lista produkcji, posiadane budowle, chrome okolicy/budowy |
| 9 | **K8-Okolica** | W | 663 | dane okolicy z DTO; **rysowanie kafli (`okolicaHexPoints`, `renderWorkedPreview`) = MAPA, odłożone** |
| 10 | **K9-Pasek-W3-handel** | Y, Z, AA, AC | 737 (+V, jeśli przeniesione) | pasek zasobów, szyny, handel, suwaki |
| 11 | **K10-Stan-nawigacja-API** | X, AD, AE | 673 | kontroler UI: `ctx`, nawigacja, malowanie, rejestracja w `cityPanelUxBridge` (ZAŁOŻENIE P5.7-Z7), `showCityPanel` |
| — | **NIE PORTOWANE: A1** | A1 | 284 | importy — znikają z kodu, zależności zastąpione DTO i zapytaniami |

Kolejność: 1 → 2 → 3 → 4/5/6 (po 3) → 7 → 8 → 9 → 9b (V/Y) → 10 → 11. Kawałek 11 jest ostatni: rejestruje implementację w `cityPanelUxBridge.ts` dopiero, gdy 1–10 przechodzą harness.

## 5. Nowe DTO i zapytania kontrolera (wg P5-0; nazwy z katalogu, nie nowe)

- `CityPanelDto` (P5-0 §6.2) — miasto, plony, `order` (zastępuje `computeOrderStateLocal`), `sliders` (wartość efektywna, domyślna imperium, override), `wealth`, `money`, `trade`, `budowa`, `recruit_options[]`.
- `CityGrowthDto` (§5) — wzrost, racje, głód (zastępuje `cityGrowthLive`, `cityFoodSplit`).
- `BuildOptionDto` / `RecruitOptionDto` (§6.3) — pozycje katalogu i rekrutacji z kosztem zasobów (`stock_cost`), `affordable`, `missing`, `eta`.
- `EmpireHudDto` (§6.4) — pasek imperium, `civ_wide` (zastępuje `resolveEmpireSnap`, `civWideSixStatsFromEmpireSnap`).
- `OrderState` (w `CityPanelDto.order`) — z silnika; `orderPanel.ts` już tego wymaga (PQ wiersz 26).
- `BuildingCardRulesDto` (P5.4, PQ wiersz 22) — karty budynków.
- `UnitCardBadgesDto` (P5.3) — odznaki jednostek w rekrutacji.
- Zapytania/komendy (P5-0 §7 i P5.6/P5.7): `enqueue_build`, B3 (`cancel`/`reorder`/`promote`), `city_set_paused`, `recruit_cancel`, `set_trade_split`, `set_labor_split`.

Nazwy pól są z P5-0; **NIE_ZMIERZONO:** pełna zgodność z aktualnym `viewmodel/types.ts` na `parity-v2` (nie czytano tego pliku w tej rundzie).

## 6. Grafika: odłożone (zgodnie z decyzją właściciela — mapa, jednostki, 3D na koniec)

| Miejsce (pin) | Co | Status |
|---|---|---|
| `cityPanel.ts:168` → `unitMiniPreview.ts` (Three.js) | import `mountUnitMiniPreview` / `defaultOwnerColor` | **ODŁOŻONE — 3D** |
| `:7865-7872` (`buildUnitDetailCard`, slot 3D) | podgląd 3D jednostki w karcie | **ODŁOŻONE — 3D** (wstawka placeholder, bez renderu) |
| `:7976-7996` (`attachUnitRowThumb`) | miniatura jednostki na liście | **ODŁOŻONE — 3D** |
| `:9729` (`okolicaHexPoints`), `:9821-10017` (`renderWorkedPreview`) | rysowanie kafli okolicy (SVG) | **ODŁOŻONE — MAPA** (logika zasięgu/kafli zostaje w K8 jako dane DTO) |

Canvas/WebGL w pliku: 0 trafień. Nic nie wymaga dodatkowego wyłączenia poza powyższym.

## 7. Dryf po pinie (`origin/main`)

`git diff --stat edb8fb56 origin/main -- gra/src/ui/cityPanel.ts`: `1 file changed, 259 insertions(+), 73 deletions(-)` (332 linie). Hunki po sekcjach (stary numer linii, `r1-logi/04-dryf-sekcje.log`):

| Sekcja | Hunki | Zmienione linie (pin) | Uwaga dla portu |
|---|---:|---:|---|
| U | 18 | 19 | `renderProd`, `renderBuildList`, `renderPurchasableUnits` (`:8435-8964`) — K7 |
| T | 12 | 10 | rekrutacja, kolejki (`:8052-8354`) — K6 |
| AA | 7 | 12 | `buildHandelDetailCard` (`:10875-10987`) — K9 |
| S | 6 | 5 | karty jednostek/budynków (`:7539-7795`) — K5 |
| D | 4 | 14 | `computeView` (`:1162-1283`) — K2 (zastępowany DTO) |
| C | 5 | 5 | ETA kolejki (`:885-908`) — K1 |
| M | 3 | 4 | `buildWealthDetailCard`, `buildPracaDetailCard` (`:4932-5063`) — K4 |
| I | 2 | 1 | `computeOrderStateLocal` (`:3186`, `:3223`) — K2 |
| A1/A2 | 4+3 | 1 | importy i typy `CityPanelConfig` — K1 |
| B, O, Q | 1+1+1 | 0+1+1 | K1, K4, K5 |

Znaczenie: drift dotyka głównie K7/K6/K9. **Port od pinu `edb8fb56` (zgodnie z PQ) wymaga decyzji**: albo port z pinu, a diff z `origin/main` przenieść jako osobny temat, albo rebase planu na `origin/main` (ZAŁOŻENIE P5.8-Z2, §9). Ten dokument liczy wyłącznie pin.

## 8. Plan rund (do rozstrzygnięcia przez orkiestratora)

- **r2 (Operator):** wykonać przecięcia §3 jako przeniesienia helperów (bez zmian reguł), ponownie zmierzyć `chunk cycles` skryptem z `r1-logi/`; wynik zapisać jako pomiar, nie prognozę.
- **r3–r4:** kawałki 1–11 wg §4, każdy z harnessem i mutacjami.
- **Odłożone na koniec (po limicie tokenów, wg decyzji właściciela):** 3D `unitMiniPreview` (§6 pozycje 1–3), mapa kafli (§6 pozycja 4).

## 9. Założenia (ZAŁOŻENIE — luki rozstrzygnięte w dokumencie, bez pytań)

- **P5.8-Z1:** cykle przez `rerender`/`switchCity`/`renderCityIconRightRail` rozstrzygane wstrzyknięciem `ctx` (nie zmianą kolejności). Podstawa: wzorzec P5.6-Z3 i P5.7-Z7.
- **P5.8-Z2:** pin `edb8fb56` jako źródło portu (PQ wiersz 81); drift §7 nie jest włączany.
- **P5.8-Z3:** sekcje R (D, E, F, I, Q-część, W-część) nie są portowane jako kod — zastępowane DTO z Rust (P5.13). Sekcja I (`computeOrderStateLocal`) zostaje usunięta, nie przeniesiona.
- **P5.8-Z4:** A1 (importy) nie jest kawałkiem portu.
- **P5.8-Z5:** podział linii po sekcjach jest granicą funkcji najwyższego poziomu (`function`/`const`/`let`/`interface`); komentarze międzyfunkcyjne przypisane do sekcji następnej. Skutek: suma LOC = 11 986 bez luk.

## 10. Zakres i ograniczenia

- Zmierzono: LOC, pokrycie, SCC funkcji i kawałków (regex, nie AST — **NIE_ZMIERZONO** dokładnie: identyfikatory w komentarzach i stringach też liczone jako krawędzie; może zawyżać cykle).
- Nie zmierzono: dokładnych LOC kawałków po przecięciach (szacunek ≈1 420), zgodności DTO z aktualnym kodem `parity-v2`, zachowania w przeglądarce.
- Skrypty i wyniki: `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1/r1-logi/`.
