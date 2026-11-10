# P5.3 — Port paneli UI poziomu 1 bez cyklu do `src-tauri/frontend-v2/` (17 modułów, DTO + harness DOM)

**Temat:** `R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Baza kodu:** `origin/rust-port/parity-v2` @ `0a1569c0` (detached, izolowany worktree; zawiera P5.1 i P5.2). **Pin web:** `edb8fb56` (wyłącznie `git show` / `git ls-tree` / `git archive` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§3, §6.2, §6.3, §6.6, §6.8, §6.12, §6.13, §9), `p5/P5-1-UI-SHELL-SKELETON.md`, `p5/P5-2-PORT-LEVEL0.md` (wzorzec), `p4/P4-5B-MAP-UI-SEAM.md` (§3 zdarzenia wejścia, §4.3 `UiState`), `LEDGER.md:134` (UI-Q1..3).
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora. Nic nie było uruchamiane w Tauri ani w realnej przeglądarce.
**Logi:** `dyspozycje/autobot/runs/R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1/r1-logi/` (każdy kończy się `EXIT=<kod>`).

## 0. Wynik w skrócie (kryterium binarne z dispatchu)

| Kryterium | Stan | Dowód (`r1-logi/`) |
|---|---|---|
| Wszystkie moduły z zakresu w `frontend-v2/src/ui/` (lub pominięte z powodem) | TAK: **17/17**, 0 pominiętych (każdy zależy tylko od modułów już w `frontend-v2`) | §2, `10-diff-stat.log` |
| Każdy z tabelą zmian vs pin | TAK | §2, §3, `diffs/*.diff` (7 diffów; 10 plików identycznych bajtowo) |
| `npm ci` / `tsc --noEmit` / `npm run check` / `vite build` EXIT=0 | TAK / TAK / TAK / TAK | `01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log` (chunk `portLevel1a-*.js` 117,18 kB) |
| Brama 0 trafień na całym `src/` | TAK: `plików=83 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=411 niezgodnych=0` | `03-check.log` |
| Harness DOM 0 różnic | TAK: **3594 przypadki, 0 różnic**, 17/17 modułów porównanych z pinem, asercje v2 8/8 | `05-dom-harness-level1a.log` (+ `.json`) |
| Mutacje harnessu wykrywane | TAK: **16/16** (EXIT=1 każda), pliki przywrócone bajtowo | `06-harness-mutations-level1a.log` |
| Regresja P5.2 | harness poziomu 0: 3861 / 0 różnic | `07-dom-harness-p52-regresja.log` |
| Kalibracja bramy na tych samych 17 plikach | pin: 20 trafień w 7 plikach (EXIT=1) → v2: 0 trafień w 19 plikach (EXIT=0) | `08-gate-calibration-pin-level1a.log`, `09-gate-v2-level1a.log` |
| Zero zmian poza allowlistą | TAK | §9 |

## 1. Architektura portu (co dochodzi w tej rundzie)

| Plik (`v2:`) | Rola |
|---|---|
| `ui/*.ts` (7 zmienionych + 10 kopii bajtowych) | 17 modułów z zakresu (§2) |
| `ui/battleHudTheme.ts` | kopia bajtowa `gra/src/battle/battleHudTheme.ts` — stałe wyglądu bitwy (`PB_SVG`, kolory, fonty, `applyBtnStartBattle`) dla `postBattleSummary.ts`. P5-0 §6.13: „Stałe wyglądu bitwy → kopia w frontendzie (klasa X, nie reguła)”. Plik nie ma żadnych importów (`grep '^import'` pusty). Umieszczony w `ui/`, bo katalog `battle/` jest zabroniony bramą (ZAŁOŻENIE P5.3-Z2) |
| `ui/portLevel1a.ts` | dynamicznie importowany z `main.ts` (jak `portLevel0.ts`), aby `vite build` kompilował 17 modułów; niczego nie montuje (ZAŁOŻENIE P5.3-Z1) |
| `viewmodel/types.ts` (zmiana) | konkretne typy zamiast `NieZmierzonoDto`: `SocietyLineDto`, `CitizenUpkeepCoverageDto`, `BasketItemDto` (+`BasketItemTyp`), `UnitCardCombatDisplayDto`, `VeteranProgressDto`, `MapSiegeContextDto`, `SiegeMachinesStateDto`, `BattleSummaryDto`; nowe: `PathBadgeLevelDto`, `UnitCardBadgesDto` (= `UnitCardDto.badges`), `DealBasketItemViewDto`, `NegotiationDealSidesDto`, `DealDisplayDto.sides`, `SiegeMachineKindDto`, `SiegeCityDto`, `SiegeUnitRefDto`, `BattleSummaryUnitCardDto`, `BattleSummarySideDto`, `ArmyUnitStatusDto`, `UnitDefDto.Epoka`. Każdy z komentarzem `plik:linia` źródła web |
| `main.ts` (zmiana) | po `portLevel0` → `await import('./ui/portLevel1a')` |
| `tools/pin-manifest.json` | +10 wpisów (kopie bajtowe); niezależnie SHA-1 blobów `git ls-tree edb8fb56` = `git hash-object` kopii: 10/10 (`11-blob-sha1-kopie.log`) |
| `tools/dom-harness/run-level1a.mjs`, `mutate-level1a.mjs` | harness i kontrola czułości P5.3 (§6); `package.json`: skrypty `harness:l1a`, `harness:l1a:mutate` (bez nowych zależności, `package-lock.json` bez zmian) |

Dane gry nie są kopiowane (D-UI-4): `src/` nie zawiera plików z `gra/data/**`.

## 2. Tabela modułów (status, zmiany względem pinu)

Liczby z `10-diff-stat.log`. „Harness” = `05-dom-harness-level1a.log`.

| Wiersz PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) | Harness (przyp./różn.) |
|---:|---|---|---|---|---|---|---:|
| 18 | `unitCardStatus.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 394 → 393 | +15/−16 | importy `:5-11` → typy DTO (aliasy nazw web); pole `badges` w `UnitCardStatusInput`; `:145-147`, `:182`, `:191`, `:211-214` czytają `input.badges` | 2271 / 0 |
| 21 | `diplomacyDealDisplay.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 312 → 303 | +24/−33 | importy `:5-11`; lokalny typ `BasketItemFormatCtx`; `resourceDisplayLabel` `:58,73` → `item.label`; `splitNegotiationDealPlayerSides` (`:100,148,198,211,251`) → parametr `NegotiationDealSidesDto \| null`; kontekst `perTurn/turns` z DTO; usunięty parametr `incoming` | 552 / 0 |
| 26 | `orderPanel.ts` | BEZP. | PRZENIESIONY (reguła → DTO) | 231 → 230 | +12/−13 | importy typów `:11-12`; pole `tierUi`; ciało `orderTierUi` `:118-130` → `return s.tierUi`; `PLACEHOLDER.tierUi = 1` | 73 / 0 (+3/3 asercje) |
| 27 | `unitRecruitCard.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 286 → 309 | +31/−8 | importy `:6-9`; `categoryOf` `:47-50` → `unitCategoryFromCatalog`; lokalny formater `formatManpower` (Z6); pole `affordable`; `:157`; `item.nazwa` → `item.label` `:172` | 79 / 0 |
| 28 | `cityAttackChoice.ts` | BEZP. | PRZENIESIONY | 239 → 239 | +1/−1 | import typu `:15` → `MapSiegeContextDto` | 16 / 0 |
| 31 | `postBattleSummary.ts` | BEZP. | PRZENIESIONY | 603 → 606 | +7/−4 | importy `:5-6` → typy DTO; `:19` `../battle/battleHudTheme` → `./battleHudTheme`; z haka `:594-602` usunięte `build` | 24 / 0 (+2/2 asercje) |
| 33 | `siegeMapPanel.ts` | BEZP. | PRZENIESIONY (reguły → DTO) | 371 → 374 | +22/−19 | importy `:6-9`; stan `activePanel: SiegePanelDto`; `:203` (klawisz 2) i `:217-224` → pola DTO; `showSiegeMapPanel`/`updateSiegeMapPanelTurn` przyjmują `SiegePanelDto`; `hide` zeruje `activePanel` | 114 / 0 (+1/1 asercja) |
| 34 | `diploUiSkin.ts` | PRZECH. | KOPIA BAJTOWA | 231 | 0 | — | 352 / 0 |
| 36 | `icons/iconRegistry.ts` | PRZECH. | KOPIA BAJTOWA | 49 | 0 | — | 48 / 0 |
| 37 | `mapUnitHudSkin.ts` | PRZECH. | KOPIA BAJTOWA | 78 | 0 | — | 10 / 0 |
| 38 | `armyMergePanel.ts` | PRZECH. | KOPIA BAJTOWA | 221 | 0 | — | 12 / 0 |
| 39 | `icons/wikiBookIcon.ts` | PRZECH. | KOPIA BAJTOWA | 19 | 0 | — | 5 / 0 |
| 40 | `powerOverlayHud.ts` | PRZECH. | KOPIA BAJTOWA | 238 | 0 | — | 19 / 0 |
| 41 | `armyListHud.ts` | PRZECH. | PRZENIESIONY (wpięcie reguły P5.1 → DTO) | 368 → 384 | +18/−2 | import `armyStatusBadge` `:18` usunięty; słownik `ARMY_STATUS_BADGE`; pole `status`; `:190` | 4 / 0 (+1/1 asercja) |
| 42 | `bottomBarHud.ts` | PRZECH. | KOPIA BAJTOWA | 335 | 0 | — | 8 / 0 |
| 43 | `cityListHud.ts` | PRZECH. | KOPIA BAJTOWA | 332 | 0 | — | 2 / 0 |
| 44 | `empireOverlayHud.ts` | PRZECH. | KOPIA BAJTOWA | 138 | 0 | — | 5 / 0 |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty) — `diffs/*.diff`.

**Pominięte z zakresu dispatchu: brak.** Poza zakresem tej rundy (dispatch): C4, `newGameFlow.ts`, `perfTestPanel.ts`, `sceneTimingReport.ts`; wiersze 46–53 PQ nie są na liście dispatchu (zostają w kolejce).

## 3. Mapowanie import → DTO / kontroler

| Moduł | Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|---|
| `unitCardStatus.ts` | `:5-9` `armorPathBadgeLevel, softPathBadgeLevel, type PathBadgeLevel` (`game/unit-building-bonuses`) | `:145-146,182,191,213-214` | `input.badges.{softPath, armorPath}`; typ `PathBadgeLevelDto` | §6.8 `badges.{soft_path, armor_path}` |
| | `:10` `veteranStarCount, type VeteranProgress` (`game/veteran`) | `:147` | `input.badges.veteranStars`; `VeteranProgressDto` | §6.8 `badges.veteran_stars`, `status.veteran_progress` |
| | `:11` `type UnitCardCombatDisplay` | `:110-114` | `UnitCardCombatDisplayDto` | §6.8 `combat` |
| `diplomacyDealDisplay.ts` | `:5` `type BasketItem`, `:6` `type ProposalPayload` | sygnatury | `DealBasketItemViewDto` (= `BasketItemDto` + `label`), `NegotiationDealSidesDto` | §6.6 `DealDisplayDto`; `sides`/`label` = **ROZSZ. Z3-1** |
| | `:8` `resourceDisplayLabel` | `:58,73` | `item.label` (Rust) | **ROZSZ. Z3-1** |
| | `:9` `splitNegotiationDealPlayerSides`, `:10` `type BasketItemFormatCtx` | `:100,148,198,211,251`; ctx `:103-106,214-217,254-257` | parametr `NegotiationDealSidesDto \| null`; ctx z `perTurn`/`turns` DTO; lokalny typ ctx | §6.6 (P5-0: „`DealDisplayDto`: gotowe linie tekstu (`splitNegotiationDealPlayerSides`…)”) — linie nie wystarczą do ikon, więc strony jako pozycje: **ROZSZ. Z3-1** |
| `orderPanel.ts` | `:11` `type SocietyLine`, `:12` `type CitizenUpkeepCoverage` | typy pól | `SocietyLineDto`, `CitizenUpkeepCoverageDto` (z `NieZmierzono` → konkretne) | §6.2 `order.lines`, `order.citizen_upkeep` |
| `unitRecruitCard.ts` | `:6` `type GameData, UnitDef` | sygnatury | `StaticCatalogDto`, `UnitDefDto` (+`Epoka`) | §6.1 |
| | `:7` `type ProductionItem` | `item.id/koszt/nazwa` | `ProductionItemDto` (`label` = web `nazwa`) | §6.2 `ProductionItemDto` |
| | `:8` `formatManpower` (`game/manpower`) | `:138,142` | lokalna kopia formatera (Z6) | — (klasa F, formatowanie) |
| | `:9` `categoryOf` (`units/setup`) | `:49` | `unitCategoryFromCatalog(Jednostka, true)` (jak P5.2) | §6.1 `unit_category` |
| `cityAttackChoice.ts` | `:15` `type MapSiegeContext` | sygnatura | `MapSiegeContextDto` | §6.12 `ctx`; pola `SiegeCityDto`/`SiegeUnitRefDto` = **ROZSZ. Z3-4** |
| `postBattleSummary.ts` | `:5` typy `game/battle-summary` | sygnatury | `BattleSummaryDto`, `BattleSummarySideDto`, `BattleSummaryUnitCardDto` | §6.13 `BattleSummaryDto = PostBattleSummaryData` |
| | `:6` `buildPostBattleSummary` | tylko hak testowy `:595` | usunięte z haka (budowanie wyniku = Rust) | §6.13 |
| | `:7-19` `battle/battleHudTheme` | style | `./battleHudTheme` (kopia bajtowa) | §6.13 (klasa X) |
| `siegeMapPanel.ts` | `:6` `type City`, `:7` `type MapSiegeContext` | `ctx.city`, `updateSiegeMapPanelTurn(…, city)` | `SiegePanelDto` (`ctx: MapSiegeContextDto`) | §6.12 |
| | `:8` `getCityFood` | `:217` | `SiegePanelDto.food` | §6.12 `food` |
| | `:9` `type SiegeMachineKind, SiegeMachinesState` | `:18,224,307` | `SiegeMachineKindDto`, `SiegePanelDto.machines` | §6.12 `machines` |

Moduły PRZECHODNIE importują wyłącznie moduły już w `frontend-v2` (`brandAssets`, `leaderPortraits`, `power-labels`, `brandTokenVars`, `escapeOverlayStack`, `formatPl`, `hudLayout`, `hudPanelDismiss`, `sideListHud.css`, `icons/scienceOwlIcon`, `icons/brand/civ-icon-map.json`).

### 3a. Rejestr rozszerzeń kontraktu P5-0 §6 (P5.3)

Metoda jak P5.2 §3a: każde nowe pole sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6. P5.3 NIE zmienia P5-0; rozszerzenia do wchłonięcia przy rewizji P5-0.

| Pole / typ (v2) | Sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|
| `DealDisplayDto.sides: NegotiationDealSidesDto` (`weOffer`, `theyOffer`, `schedule`, `perTurn`, `turns`), `DealBasketItemViewDto.label` | §6.6 | `DealDisplayDto`/`DiploListDto`: „gotowe linie tekstu” | ROZSZ. (pozycje zamiast samych linii) | Z3-1 |
| `OrderState.tierUi` (= `CityPanelDto.order` + `tierUi`) | §6.2 `order` | `band: u8, band_label` | ROZSZ. (`band` ≠ wynik `orderTierUi`, który łączy bunt/rebelię/ostrzeżenie z `porPct`) | Z3-3 |
| `UnitRecruitCardOpts.affordable` | §6.3 `RecruitOptionDto.affordable` | jest | W KONTRAKCIE (dookreślenie: tylko skarbiec, Z3-2) | Z3-2 |
| `SiegeCityDto`, `SiegeUnitRefDto` (pola `MapSiegeContextDto`) | §6.12 `ctx: MapSiegeContextDto` | sama nazwa | ROZSZ. (dookreślenie pól) | Z3-4 |
| `ArmyListEntry.status: ArmyUnitStatusDto` | §6.8 `ArmyStackDto` (P5.1/PQ: proponowane `cards[].status`) | brak | ROZSZ. | Z3-5 |
| `UnitCardBadgesDto`, `UnitCardCombatDisplayDto` (16 pól), `VeteranProgressDto` | §6.8 | `badges`, `combat`, `veteran_progress` | W KONTRAKCIE (typy) | — |
| `SiegePanelDto.{food, garnizon, zuzycie, atrycjaNext, milicjaEst, playerCanStorm, machines}`, `SiegeMachinesStateDto` | §6.12 | są | W KONTRAKCIE | — |
| `BattleSummaryDto` (+ `Side`, `UnitCard`) | §6.13 | `= PostBattleSummaryData` | W KONTRAKCIE (typy) | — |
| `SocietyLineDto`, `CitizenUpkeepCoverageDto`, `ProductionItemDto` | §6.2 | są | W KONTRAKCIE (typy) | — |
| `BasketItemDto` (`typ`, `id`, `ilosc`, `hexKey`) | §6.6 | `BasketItemDto` bez pól | W KONTRAKCIE (dookreślenie = web `BasketItem`) | — |

## 4. Reguły gry → pola DTO (przegląd ręczny 17 modułów linia po linii, P5-0 §9 pkt 3)

### 4.1 Reguły usunięte z UI (liczy Rust)

| Moduł | Reguła na pinie | Pole DTO w v2 | Uwagi |
|---|---|---|---|
| `unitCardStatus.ts` | poziom odznaki koszar/kuźni z pp (`:145-146,182,191,213-214`; tercje `game/unit-building-bonuses.ts:299-317`) | `badges.softPath/armorPath` | §6.8 |
| | gwiazdki weterana `veteranStarCount` (`:147`) | `badges.veteranStars` | §6.8 |
| `diplomacyDealDisplay.ts` | podział propozycji na strony gracza, fallback `goldOnce`, tekst harmonogramu (`splitNegotiationDealPlayerSides`, `game/diplomacy-display.ts:562-592`) | `NegotiationDealSidesDto` | Z3-1 |
| | nazwa surowca `resourceDisplayLabel` (`:58,73`) | `DealBasketItemViewDto.label` | Z3-1 |
| `orderPanel.ts` | **wpisana bez importu:** poziom statusu porządku `orderTierUi` (`:118-130`: progi `porPct` 10/30/70, bunt/rebelia/ostrzeżenie, tryb legacy `szczescie+porzadek` vs `progT1/progT2`) | `OrderState.tierUi` | Z3-3 |
| `unitRecruitCard.ts` | kategoria jednostki `categoryOf` (`:47-50`) | `StaticCatalogDto.unitCategory` | jak P5.2 Z2 |
| | **wpisana bez importu:** stać na zakup `skarb === undefined \|\| skarb >= item.koszt` (`:157`) | `affordable` | Z3-2 |
| `siegeMapPanel.ts` | żywność miasta `getCityFood` (`:217`) | `food` | §6.12 |
| | **wpisane bez importu** (P5-0 §3.1): zużycie `:219`, atrycja garnizonu `:220`, milicja przy szturmie `:221-222`, uprawnienie do szturmu/kolejki machin `:223` (użycia `:279,291,321`) **oraz klawisz `2` `:203`** (`oblegajacyOwnerId === 0` — ta sama reguła, P5-0 jej nie wymienia) | `zuzycie`, `atrycjaNext`, `milicjaEst`, `playerCanStorm` | §6.12; `:203` znalezione w tym przeglądzie |
| | `garnizon = city.garnizon ?? 0` (`:218`) | `garnizon` | §6.12 |
| `postBattleSummary.ts` | `buildPostBattleSummary` (eksport w haku `:595`) | `BattleSummaryDto` | §6.13 |
| `armyListHud.ts` | wybór stanu do plakietki — priorytet flag `armyStatusBadge` (`sideListHud.css.ts:115-126`, użycie `:190`; P5.1/PQ: „nie wpinać bez pola DTO”) | `ArmyListEntry.status` | Z3-5 |

### 4.2 Pozostawione w UI — klasyfikacja GRANICZNY (prezentacja nad polami DTO)

| Moduł | Miejsce (v2 = pin) | Dlaczego zostało |
|---|---|---|
| `unitCardStatus.ts` | `unitCardStatValueHtml` porównanie zaokrągleń `:99-108`; `turyPl` `:220-226`; tekst `+50% Obrony` `:296`; `(1 − mult)·100` `:253` | formatowanie liczb z DTO; `+50%` = stały tekst (GRANICZNY tekst — docelowo tekst z silnika, jak `triumphCityStateNotice` w P5.1) |
| `diplomacyDealDisplay.ts` | łącznie `amt * turns` `:48,65` | formatowanie sumy z pól DTO |
| `orderPanel.ts` | skala słupków `max(...)` `:179`, `%` paska `:133`, `linesHtml` znak/kolor `:141-142` | geometria/kolor |
| `unitRecruitCard.ts` | `missing = max(0, required − available)` `:131`; ograniczenia ilości `:114-121,255-257`; `quantity × koszt` w tytule `:251` | arytmetyka kontrolek nad liczbami DTO; nie decyduje o zakupie (bramka: `canPurchase`/`affordable` + `onRecruit` → komenda) |
| `cityAttackChoice.ts` | `hasGarrison = garnizonUnit !== null \|\| garnizon > 0` `:178` | wybór etykiety z dwóch pól DTO |
| `postBattleSummary.ts` | `unitKind` po podciągu kategorii `:60-66`; `formatHpLine` `:76-81`; kolory progów `lossPct ≥ 50` `:300`; `winnerColor` `:363-367`; suma strat `:434`; tekst podtytułu `:181-189` | dobór ikony/koloru i formatowanie z pól DTO |
| `siegeMapPanel.ts` | `ownerLabel` (`isMe` z wołającego, domyślnie `ownerId === 0`) `:176-179`; etykiety machin `:225-230`; `round(prog·10)/10` `:278` | etykiety; `isMe` wstrzykuje wołający (P5.x: tożsamość fotela z Rust) |
| `powerOverlayHud.ts` | `sortPowerRankingForMode` `:60-66` (przenumerowanie rankingu wg trybu widoku), `Math.round` `:169-209`; `isMe` domyślnie `ownerId === 0` `:153` (tylko klasa CSS) | widok (sortowanie gotowych wartości DTO) |
| `diploUiSkin.ts` | `tierDipIconId`/`pennantTone`/`tierBadgeHtml` `:19-33,114-123`; `resolveCivIconIdFromName` `:35-48`; `treatyChipIconId` `:125-134` | mapowanie stanu → ikona/kolor; dopasowanie nazwy → zasób graficzny |
| `armyListHud.ts` | `totalUnits` `:134`; `hue`, `pctClamped`, `hpValueColor` `:229-235`; tytuł wiersza wg flag `:167-177` | prezentacja flag (flagi = `UnitCardStatusDto`, W KONTRAKCIE §6.8) |
| `cityListHud.ts` | sumy `totalPop`, `activeQueues`, `totalGarrison` `:249-251` | sumy do pasma podsumowania (jak `empireMiastaTable.ts` GRANICZNY w P5.1) |
| `bottomBarHud.ts` | `wykOn = blocking > 0`, `showBlockSignal` `:198-219`; odmiana „karta/karty/kart” `:151-155` | `canEndTurn`/`getBlockingCount` podaje wołający; klik „Zakończ turę” bez bramki w UI (pin `:278-285`) |
| `armyMergePanel.ts` | `total = existing.length + arrivingCount` `:150-152`; dismiss = `onMerge` `:156-171` | etykieta; zachowanie dismiss bez zmian |

Bez reguł (po przeglądzie): `icons/iconRegistry.ts`, `icons/wikiBookIcon.ts`, `mapUnitHudSkin.ts`, `empireOverlayHud.ts`, `battleHudTheme.ts` w części użytej przez `postBattleSummary.ts` (stałe kolorów/fontów, `PB_SVG`, `applyBtnStartBattle`). Pozostała część `battleHudTheme.ts` (1758 linii, nieużywana w v2) — przegląd linia po linii: `NIE_ZMIERZONO` (do portu `preBattle.ts`/bitwy).

## 5. Zdarzenia wejścia (P4-5B)

Panele P5.3 słuchają `keydown` na `document` (`cityAttackChoice.ts:155-166`, `siegeMapPanel.ts:193-212`, `armyMergePanel.ts:214-220`, `postBattleSummary.ts:535-545`) — zgodne z P4-5B §3.2 Z3 (fokus klawiatury w webview). Otwarcie oblężenia/podsumowania bitwy wpływa na `UiState.world_map_unit_mode`/`post_battle_open` (P4-5B §4.3) — wiązanie z ekranem gry poza tą rundą (Z1), `NIE_ZMIERZONO`.

## 6. Harness porównania DOM (`tools/dom-harness/run-level1a.mjs`)

**Metoda** = P5.2 (`run.mjs`, `build.mjs` bez zmian): oba drzewa pakowane `esbuild` z tą samą emulacją Vite, wspólny jsdom, zamrożony `Date`, kanoniczna serializacja całego `document.documentElement` (wszystkie atrybuty posortowane) albo JSON/HTML wartości. Nowe w P5.3: (a) **log akcji** — wywołania callbacków (`onStorm`, `onRecruit`, `onMerge`…) dopisywane do DOM i porównywane; (b) **`persist`** — moduły, które tworzą korzeń raz i potem tylko go ukrywają (`siegeMapPanel`, `orderPanel`), dostają swój korzeń z powrotem w `body` po resecie (inaczej renderowałyby do odłączonego węzła); (c) przed pokazem panelu z klawiaturą druga strona jest zamykana (jeden słuchacz `keydown` naraz); (d) licznik `DOM_puste` (przypadki, w których `body` v2 zawiera tylko log akcji — oczekiwane po zamknięciu panelu klawiszem/klikiem).

**„Rust” w harnessie** (z funkcji/danych pinu): `badges` = `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount`; `NegotiationDealSidesDto` = `splitNegotiationDealPlayerSides` + `resourceDisplayLabel`; `tierUi` = pinowe `orderTierUi`; `affordable` = wzór pina `:157`; `SiegePanelDto.food` = `getCityFood`, pozostałe pola = wzory pina `:218-224` (pin nie ma dla nich funkcji); `BattleSummaryDto` = `buildPostBattleSummary`; `status` = pinowe `armyStatusBadge`; `StaticCatalogDto` jak P5.2.

**Wyniki** (`05-dom-harness-level1a.log`, EXIT=0): `modułów=17 przypadków=3594 różnic=0 jsdomErrors=0`.

| Moduł | Przyp. | Różn. | Pokrycie |
|---|---:|---:|---|
| `unitCardStatus.ts` | 2271 | 0 | 10 wartości pp × 7 pp pancerza × 8 stanów weterana (w tym NaN/ujemne/niecałkowite) × 4 funkcje, statusy/cierpienie 6 wariantów, CSS |
| `diplomacyDealDisplay.ts` | 552 | 0 | 8 payloadów (pusty, `goldOnce`, wszystkie typy pozycji, `per_turn`/`once`, turns 0/5/10) × kierunek × wszystkie funkcje stołu |
| `orderPanel.ts` | 73 | 0 | 14 stanów × 4 zestawy opcji; DOM placeholder/live/hide (asercje 3/3, DOM_puste 0/3) |
| `unitRecruitCard.ts` | 79 | 0 | 75 jednostek × 7 wariantów zakupu/rekrutów; interakcja +/−/wpis/Rekrutuj ×3 (DOM_puste 0/78) |
| `cityAttackChoice.ts` | 16 | 0 | 4 konteksty × (bez klawisza, `1`, `2`, „Wycofaj”) |
| `postBattleSummary.ts` | 24 | 0 | 4 wyniki bitwy × 2 opcje × (bez, Enter, klik); hak okna (asercje 2/2) |
| `siegeMapPanel.ts` | 114 | 0 | 4 konteksty × kolejka machin × `isMe` × 7 akcji; aktualizacja tury/miasta/oblegających; martwe klawisze po `hide` (panel w DOM 112/112) |
| `diploUiSkin.ts` | 352 | 0 | tiery, wszystkie cywilizacje × epoki, traktaty, CSS |
| `icons/iconRegistry.ts` | 48 | 0 | 16 `IconId` × 3 rozmiary |
| `mapUnitHudSkin.ts` | 10 | 0 | |
| `armyMergePanel.ts` | 12 | 0 | 2 układy × 6 akcji |
| `icons/wikiBookIcon.ts` | 5 | 0 | |
| `powerOverlayHud.ts` | 19 | 0 | sortowanie 3 trybów; DOM ×4 |
| `armyListHud.ts` | 4 | 0 | 16 kombinacji flag (asercja: 15 plakietek w DOM) |
| `bottomBarHud.ts` | 8 | 0 | 0/1/2/3+ blokad, z tytułami i bez, `canEndTurn=false`, `hideEndTurn` |
| `cityListHud.ts` | 2 | 0 | |
| `empireOverlayHud.ts` | 5 | 0 | |

**Czułość** (`06-harness-mutations-level1a.log`): 16 mutacji (L1–L13 w modułach zmienionych, w tym odczyt pól DTO: `badges`, `label`, `tierUi`, `affordable`, `playerCanStorm` klawiszem, `milicjaEst`, `status`; L14–L16 w kopiach bajtowych `bottomBarHud.ts`, `battleHudTheme.ts`, `diploUiSkin.ts`) → **16/16 wykrytych**, pliki przywrócone bajtowo.

**Obrona r1 (po zarzutach Evaluatora r1, noty 1–2; logi `runs/R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1/r2-obrona-logi/`):**
- Nota 1 (PRZYJĘTA): fikstury `unitRecruitCard` mają teraz `nazwa`/`label` ≠ `id` (`"<Jednostka> «etykieta k»"`, w interakcji `"Rekrut <i>"`); nowa mutacja **L17** `name.textContent = item.label → item.id` → WYKRYTA (78 różnic).
- Nota 2 (PRZYJĘTA): `cityAttackChoice` — log akcji zawiera teraz serializację `body` w stanie otwartym (przed klawiszem/klikiem), więc 12 przypadków z pustym DOM końcowym porównuje też panel otwarty; asercja v2 „stan otwarty niepusty 16/16”; mutacja **L18** (legenda klawiszy) → WYKRYTA (16 różnic). `armyListHud` 4 → **23** przypadki (lista 1-elementowa, odwrócona, bez wybranej `a5`, każda z 16 kombinacji flag osobno). `cityListHud` 2 → **7** (odwrócona, każde miasto osobno); mutacja **L19** w kopii bajtowej (kolor plakietki stolicy) → WYKRYTA (3 różnice). `DOM_puste` liczy nadal stan końcowy (bez zmian metryki).
- Wynik: `modułów=17 przypadków=3618 różnic=0` (EXIT=0); mutacje **19/19** wykrytych (EXIT=0); regresja P5.2 3861/0; `tsc`, `npm run check` (0 trafień / 0 niezgodnych w 411), `vite build` EXIT=0. Kod modułów `src/ui/**` bez zmian względem `663ac6dd` — zmieniono wyłącznie `tools/dom-harness/run-level1a.mjs` i `mutate-level1a.mjs`.

**NIE_ZMIERZONO (harness):** (1) zachowanie w realnym WebView/Tauri; (2) klawisz `Escape` (stos `escapeOverlayStack.ts` — moduł P5.1, nie porównywany tu); (3) `pointerdown/pointerup` w `bottomBarHud.ts` (zachowanie fokusu przycisku przy przerenderowaniu); (4) zbieżność wzorów oblężenia „Rust” z przyszłym silnikiem Rust — harness odtwarza wzory pina.

## 7. Uruchomienie bram (odtworzenie)

```bash
cd src-tauri/frontend-v2
npm ci && npx tsc --noEmit && npm run check && npx vite build
git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
node tools/dom-harness/run-level1a.mjs --pin-dir <PIN_DIR>      # EXIT 0 ⇔ 0 różnic
node tools/dom-harness/mutate-level1a.mjs --pin-dir <PIN_DIR>   # EXIT 0 ⇔ każda mutacja wykryta
node tools/dom-harness/run.mjs --pin-dir <PIN_DIR>              # regresja P5.2
rm -rf node_modules dist
```

## 8. ZAŁOŻENIA

- **P5.3-Z1 (montaż):** `portLevel1a.ts` tylko zbiera moduły dla `vite build`; żaden panel nie jest wpięty do ekranu (jak P5.2-Z8).
- **P5.3-Z2 (`battleHudTheme.ts` w `ui/`):** kopia bajtowa pliku z `gra/src/battle/` leży w `src/ui/`, bo brama zabrania katalogu `battle/` w specyfikatorze. Zawartość = stałe wyglądu (P5-0 §6.13, klasa X). Weryfikacja: manifest sha256 + SHA-1 blobu.
- **P5.3-Z3-1 (dyplomacja: strony stołu jako pozycje):** P5-0 §6.6 przewiduje dla `DealDisplayDto` „gotowe linie tekstu”, ale renderer pina rysuje ikony surowców per pozycja, więc Rust podaje `sides: NegotiationDealSidesDto` (pozycje + `label`, `schedule`, `perTurn`, `turns`) — wynik `splitNegotiationDealPlayerSides(payload, incoming)` dla jednej propozycji i kierunku. `null` = pusta oferta (web `split === null`). Funkcje UI nie przyjmują już `incoming` (kierunek jest w DTO).
- **P5.3-Z3-2 (`affordable`):** = `RecruitOptionDto.affordable` (P5-0 §6.3) w znaczeniu pina `:157`: skarbiec pokrywa koszt (`skarb` nieznany → `true`). Pozostałe bramki (rekruci, surowce) nadal przez `canPurchase` od wołającego, jak w pinie.
- **P5.3-Z3-3 (`tierUi`):** `CityPanelDto.order.band` z P5-0 to pasmo porządku; pin wyprowadza w UI osobny poziom 0/1/2 łączący bunt/rebelię/ostrzeżenie z `porPct` — przenoszę go jako osobne pole liczone w Rust tą samą funkcją. Atrapa `PLACEHOLDER` ma `tierUi: 1` = wynik pina dla jej stałych (`porPct 50`) — harness: DOM placeholdera identyczny.
- **P5.3-Z4 (`SiegePanelDto.city`):** panel czyta dane miasta z `ctx.city` (jak pin `:216`); `city: CityRefDto` z P5-0 zostaje w typie, nieczytane. `machines` zawsze obecne (brak machin = puste listy, `buildProgress: 0` — DOM identyczny z pinem dla `siegeMachines === undefined`). `updateSiegeMapPanelTurn(turn, panel?)` przyjmuje cały nowy `SiegePanelDto` (pin podmieniał samo `city` i przeliczał wartości w UI).
- **P5.3-Z3-4 (pola `MapSiegeContextDto`):** tylko pola czytane przez dwa panele (`SiegeCityDto`, `SiegeUnitRefDto`); id miasta/jednostki = `string` jak w akcjach paneli pina (P2-3 newtype `CityId: number` — mapowanie przy wiązaniu, `NIE_ZMIERZONO`).
- **P5.3-Z3-5 / Z5 (`armyListHud` status):** Rust wybiera jeden stan plakietki (`garrison|fieldFortified|sentry|autoExplore|null`) z flag jednostki; flagi zostają w `ArmyListEntry` (są w kontrakcie `UnitCardStatusDto`, §6.8) i nadal sterują tytułem wiersza (pin `:167-177` używa innej kolejności niż plakietka — zachowane 1:1, harness 16/16 kombinacji). Słownik tekst/kolor w `armyListHud.ts` = gałęzie `armyStatusBadge`; `sideListHud.css.ts` (kopia P5.1) bez zmian.
- **P5.3-Z6 (formater rekrutów):** `formatManpower`/`formatPopulationAbs` (`game/manpower.ts:858-872`) to czysty formater liczb (klasa F, bez reguły) — skopiowany lokalnie do `unitRecruitCard.ts` zamiast importu `game/**`; zgodność z pinem: harness (wartości 0–12 345 678, NaN), mutacja L7 wykryta. Alternatywa: gotowe etykiety w DTO.
- **P5.3-Z7 (hak testowy `postBattleSummary`):** `window.__postBattleSummaryTestDebug` bez `build` — budowa wyniku bitwy należy do Rust; reszta haka bez zmian.

## 9. Allowlista, Git, sprzątanie

- Zmienione/nowe ścieżki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` bez zmian — brak nowych zależności), `dyspozycje/rust-port/p5/P5-3-PORT-LEVEL1A.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1/**`. Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**` (lista: `01-operator-r1.md`).
- `node_modules`, `dist` usunięte (`12-cleanup.log`). Commit w worktree jawnym `git add <ścieżki>` (logi `git add -f`), bez push.
- `.gitattributes` w katalogu runu: `r1-logi/diffs/*.diff -whitespace` (precedens P5.2: linie kontekstu `diff -u`).

## 10. NIE_ZMIERZONO (zbiorczo)

1. Realny WebView/okno Tauri (nic nie uruchamiano; `tauri.conf.json` bez zmian).
2. Komendy/zapytania Rust dostarczające nowe DTO (`UnitCardDto.badges`, `DealDisplayDto.sides`, `tierUi`, `SiegePanelDto`, `BattleSummaryDto`, `status`) — dziś tylko harness.
3. Przegląd reguł w nieużywanej części `battleHudTheme.ts`.
4. Pozycje z §6 „NIE_ZMIERZONO (harness)”.
