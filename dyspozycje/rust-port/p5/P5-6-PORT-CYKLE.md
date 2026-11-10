# P5.6 — Port cykli C2/C5 + `hexContextTooltip.ts` + `preBattle.ts` do `src-tauri/frontend-v2/` (7 modułów; DTO, zapytania kontrolera, harness DOM)

**Temat:** `R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Baza kodu:** `origin/rust-port/parity-v2` @ `95b91471` (detached, izolowany worktree; zawiera P5.1–P5.5). **Pin web:** `edb8fb56` (wyłącznie `git archive` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§3.1, §6.6, §6.7, §6.8, §6.13, §7, §8, §9), `p5/P5-1-UI-SHELL-SKELETON.md`, `p5/P5-5-PORT-POZIOM2.md` (wzorzec), `p4/P4-5B-MAP-UI-SEAM.md`, `LEDGER.md` (UI-Q1=A, UI-Q2=A, UI-Q3=B).
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora. Nic nie było uruchamiane w Tauri ani w realnej przeglądarce.
**Logi:** `dyspozycje/autobot/runs/R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1/r1-logi/` (każdy kończy się `EXIT=<kod>`).

## 0. Wynik w skrócie (kryterium binarne z dispatchu)

| Kryterium | Stan | Dowód (`r1-logi/`) |
|---|---|---|
| Wszystkie moduły z zakresu w `frontend-v2/src/ui/` (lub pominięte z powodem) | TAK: **7/7** przeniesionych; pominięte z powodem: cykle C1 i C3 (§1) | §2, `13-diff-stat.log` |
| Każdy z tabelą zmian vs pin | TAK | §2, §3, `diffs/*.diff` (5 diffów; 3 pliki identyczne bajtowo) |
| `npm ci` / `tsc --noEmit` / `npm run check` / `vite build` EXIT=0 | TAK / TAK / TAK / TAK | `01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log` (chunk `portCycles-*.js` 209,44 kB) |
| Brama 0 trafień na całym `src/` | TAK: `plików=134 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=434 niezgodnych=0` | `03-check.log` |
| Harness DOM 0 różnic | TAK: **6401 przypadków, 0 różnic**, 7/7 modułów porównanych z pinem, asercje v2 3/3 | `05-dom-harness-cycles.log` (+ `.json`) |
| Mutacje harnessu wykrywane | TAK: **66/66** wykrytych — pełny przebieg 65/66 + T8 (EXIT=2, awaria esbuild przy pakowaniu) powtórzona osobno: EXIT=1 WYKRYTA; pliki przywrócone bajtowo (§6) | `06-harness-mutations-cycles.log` |
| Regresja P5.2 / P5.3 / P5.4 / P5.5 | 3861 / 0, 3618 / 0, 1649 / 0, 1784 / 0 różnic | `07-…`, `08-…`, `09-…`, `10-…-regresja.log` |
| Kalibracja bramy na tych samych 7 plikach | pin: 51 trafień w 5 plikach (EXIT=1) → v2: 0 trafień w 12 plikach (EXIT=0) | `11-gate-calibration-pin-cycles.log`, `12-gate-v2-cycles.log` |
| Zero zmian poza allowlistą | TAK | §9, `15-allowlist-git-status.log` |

## 1. Zakres — reguła doboru i lista (ustalona z `PORTING-QUEUE.md`)

**Reguła (dispatch):** wszystkie moduły kolejki, których zależności UI są w `frontend-v2` albo wchodzą w tę samą paczkę — w tym cykle C1, C2, C3, C5, `hexContextTooltip.ts`, `preBattle.ts` — bez `hud.ts`, `cityPanel.ts`, `newGameFlow.ts`, `perfTestPanel.ts`, `sceneTimingReport.ts` (P5.7+). Cykl zależny od modułu spoza zakresu — pominięty z powodem.

| Wiersze PQ | Moduły | Decyzja | Powód |
|---|---|---|---|
| 69, 70, 73 | cykl **C2**: `diplomacyAudience.ts`, `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts` | **PRZENIESIONY** | zależności UI spoza cyklu (`civBrandDisplay`, `diploUiSkin`, `diplomacyAcceptanceBalance`, `diplomacyDealDisplay`, `diplomacyProposalBanner`, `leaderPortraits`, `brandAssets`) są w `frontend-v2` od P5.2–P5.5 |
| 75 | `hexContextTooltip.ts` | **PRZENIESIONY** | blokujące (`brandAssets`, `unitActionBarHtml`, `unitCardStatus`, `unitPanelHud`) w `frontend-v2` |
| 76, 77 | cykl **C5**: `sidePanelHud.ts`, `sidePanelEventFilter.ts` | **PRZENIESIONY** (kopie bajtowe) | jedyna blokująca spoza cyklu = `hexContextTooltip.ts` (ta paczka) |
| 83 | `preBattle.ts` | **PRZENIESIONY** | dispatch wymienia go w zakresie; jedyny import `hud.ts` (`setArmyStackHudSuppressed`, `preBattle.ts:19`) zastąpiony mostem `ui/armyStackHudSuppression.ts` (ZAŁOŻENIE P5.6-Z3) — `hud.ts` nie jest wymagany |
| 81, 82 | cykl **C1**: `cityPanel.ts`, `cityUxFrame.ts` | **POMINIĘTY** | `cityUxFrame.ts` jest w cyklu z `cityPanel.ts` (wyłączenie dispatchu, P5.7+) — portu cyklu nie da się rozdzielić |
| 78, 79, 80 | cykl **C3**: `empireDetailPanel.ts`, `empireDetailTypes.ts`, `hud.ts` | **POMINIĘTY** | cykl zawiera `hud.ts` (wyłączenie dispatchu); `empireDetailTypes.ts` importuje `hud.ts`, `empireDetailPanel.ts` — `empireDetailTypes.ts` |
| 29, 30, 32 | `newGameFlow.ts`, `perfTestPanel.ts`, `sceneTimingReport.ts` | POZA ZAKRESEM | wyłączenia dispatchu (D-UI-7 dla 30/32) |

**ZAŁOŻENIE P5.6-Z0 (zakres):** nazwa tematu wymienia C1, C2, C3, C5; dispatch jednocześnie wyłącza `hud.ts` i `cityPanel.ts` i każe pominąć cykl zależny od modułu spoza zakresu → C1 i C3 pominięte z powodem (tabela). Po P5.6 w kolejce zostaje **8** modułów.

## 2. Tabela modułów (status, zmiany względem pinu)

Liczby z `13-diff-stat.log`. „Harness” = `05-dom-harness-cycles.log`.

| PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) | Harness (przyp./różn.) |
|---:|---|---|---|---|---|---|---:|
| 69 | `diplomacyAudience.ts` | BEZP. | PRZENIESIONY (reguły → pola DTO stanu, stałe → katalog, formatery → kopia/markup lokalny) | 2443 → 2516 | +135/−62 | importy `:5-58` → typy `viewmodel/types.ts`, `controller/audio.ts`, `staticCatalog()`; lokalnie: `TRAKTAT_HANDLOWY_LABEL`, `RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON` (katalog), `uiActionAllowsMultipleOwnOnTable` (katalog), kopie 1:1 formaterów `audienceActionStatusNote`/`audienceActionBarLockNote`, markup `wiarygodnoscBadgeHtml` (pasmo/tooltip z DTO); nowe pola stanu `nastawienie`, `player/otherWiarygodnoscView`, `negotiationTablePanel`, `actionableNegotiationCount`; wiersz stołu + `dealSides`, `treatyPwWe/They`, `resourceAccessWithdrawn`; `:1243-1247,1410,2162-2163` nastawienie → `st.nastawienie`; `:1527-1534` pasek W → widok DTO; `:1931,1951-1958` → `NegotiationDealSidesDto` (API P5.3); `:1945-1949` → pola PW; `:1964,2099,2108` → panel/licznik z DTO; `:2030` → `resourceAccessWithdrawn` | 224 / 0 |
| 70 | `diplomacyNegotiationModal.ts` | BEZP. | PRZENIESIONY (typy, etykieta → katalog) | 562 → 561 | +12/−13 | importy `:6-8,10` → `BasketItemDto`, aliasy `TempoGry`/`GameDifficulty` = `string`, `staticCatalog().labels.traktatHandlowyLabel`; usunięty hak `tradeFairnessPreview` z `NegotiationModalContext` (`:118-126`) | 165 / 0 |
| 73 | `diplomacyTradeBasket.ts` | BEZP. | PRZENIESIONY (reguły → zapytania kontrolera, dane → katalog) | 2851 → 2838 | +137/−150 | importy `:7-52` → `controller/diplomacyQueries.ts` (lokalne adaptery o nazwach z pinu), `staticCatalog()`, `BasketItemFormatCtx` z `diplomacyDealDisplay.ts`; `:190-227` wycena → `basketSumPn`; `:429-454` martwe funkcje usunięte, `:435-439` lista technologii z katalogu, `:465-472` klucze surowców z katalogu; `:1038,1831` pozycja → `DealBasketItemViewDto`; `:1071-1096` traktat → `treatyBasketSummary`; `:1297-1300` → `validateTradeBasketSides` (zapytanie); `:1891-1999` podsumowanie → `basketSummary`; `:2539-2559` → `balanceGiveItemsToFairMin`; `:2800-2807` → `quickDealBasket`; `:2833` re-eksport → funkcja-zapytanie | 4747 / 0 |
| 75 | `hexContextTooltip.ts` | BEZP. | PRZENIESIONY (reguły heksa i Mocy → DTO) | 992 → 759 | +97/−330 | importy `:4-47` → typy DTO + `./unitVitalsPalette` (kopia); `TerenBazowy` = lokalna stała wartości enumu (klucze etykiet); `:115-116` stałe bonusów lasu/rzeki usunięte; `:136-195,247-295,298-300` magazyn/plony → `HexTooltipViewDto`; `:327-513` zasoby, rzeka u sąsiada, filtr „Możliwe ulepszenia” → `view.resourceLabels`/`view.possible` (+ formater wiersza `formatPossibleImprovementLine`); `HexContextTooltipInput`: `view`, `cityDisplayLabel` zamiast `hex`/`map`/`playerCivType`/`currentEra`/`cityIsCityState`; `:620` → `cityDisplayLabel`; `UnitContextTooltipInput` + `fieldPower`, `badges`; `:818-827` → `u.fieldPower` | 931 / 0 |
| 76 | `sidePanelHud.ts` | PRZECH. | KOPIA BAJTOWA | 969 | 0 | — | 56 / 0 |
| 77 | `sidePanelEventFilter.ts` | PRZECH. | KOPIA BAJTOWA | 25 | 0 | — | 8 / 0 |
| 83 | `preBattle.ts` | BEZP. | PRZENIESIONY (reguła → DTO, kopia stałych, muzyka → kontroler, most do `hud.ts`) | 918 → 904 | +20/−34 | importy `:13-19` → `./battleHudTheme` (kopia P5.3), `../controller/audio`, `./armyStackHudSuppression`; `PreBattleSide.bonusChips` (wymagane) zamiast `PreBattleInfo.bonusy*` i haka `getCivBonusy` (`:55,114-116,121,156`); `:598-606` `resolveSideBonusy` + `:712-713` `bonusChipTexts` → `side.bonusChips`; `:879,897-898` | 270 / 0 |
| — | `unitVitalsPalette.ts` (z `gra/src/render/`) | — | KOPIA BAJTOWA | 89 | 0 | stałe kolorów pasków (klasa X, jak `battleHudTheme.ts`) | (przez `hexContextTooltip.ts`) |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty) — `diffs/*.diff`. Kopie bajtowe (3) dopisane do `tools/pin-manifest.json` (434 wpisy); niezależnie SHA-1 blobów `git ls-tree edb8fb56` = `git hash-object` kopii: 3/3 (`14-blob-sha1-kopie.log`).

**Nowe pliki pomocnicze:** `v2:controller/diplomacyQueries.ts` (dostawca zapytań koszyka PW + atrapa MOCK), `v2:controller/audio.ts` (usługa muzyki nakładek), `v2:ui/armyStackHudSuppression.ts` (most `preBattle` → `hud`), `v2:ui/portCycles.ts` (zbiór modułów do `vite build`).

## 3. Mapowanie import → DTO / kontroler

| Moduł | Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|---|
| `hexContextTooltip.ts` | `:4-6` `Hex`, `Nakladka`, `TerenBazowy`, `Ulepszenie`, `GameMap` (`types/**`) | stan heksa i mapy | `HexTooltipViewDto` (`view.terrainBase` = `hex.terenBazowy`); `TerenBazowy` = wartości enumu jako klucze etykiet | §6.7 `terrain` |
| | `:7` `tileYield`, `TileYield` (`game/economy`) | `:251-264` plon bazowy/pełny | `view.yieldParts[0]`, `view.yieldFull`; `TileYieldDto` = kształt `TileYield` | §6.7 `yield_base`, `yield_full` |
| | `:8-18` `terrain-improvements` (klucze, nazwa, bonus, normalizacja, cywilizacja, magazyn) | opisy ulepszeń, magazyn, filtr | `HexImprovementLineDto` (`name`, `bonus`, `magazyn`, `unlockLabels`) w `view.built/implicit/possible` | §6.7 `improvements_active/available`, `magazyn_parts` |
| | `:19-24` `map/improvement-build` (bramki terenu, gliny, farmy, lasu) | `:440-513` | `view.possible` (≤ 10, Rust) | §6.7 `improvements_available` |
| | `:25` `ImprovementKey` (`render/`) | rzutowanie klucza | zbędne (klucze w DTO) | — |
| | `:31-36` `VITALS_*` (`render/unitVitalsPalette`) | CSS pasków | `./unitVitalsPalette` (kopia bajtowa) | §2 klasa X |
| | `:37-41` `resource-access`, `:42` `livestock-unlock` | `:327-358` zasoby, złoża ukryte, lama | `view.resourceLabels` | §6.7 `deposit` |
| | `:43` `formatEntityDisplayName` | `:620` | `cityDisplayLabel` (`display_name` z Rust) | §3.2 |
| | `:44` `DaninaLabel` | typ pola | lokalny alias `'Podatek'` | — |
| | `:45,47` `UnitCardCombatDisplay`, `VeteranProgress` | typy | `UnitCardCombatDisplayDto`, `VeteranProgressDto` (P5.3) | §6.8 |
| | `:46` `fieldPower` | `:818-827` | `UnitContextTooltipInput.fieldPower: FieldPowerDto` | §6.8 `power` |
| `preBattle.ts` | `:13` `CivBonusLite`, `:14` `bonusChipTexts` | `:598-606,712-713` | `PreBattleSide.bonusChips` | §6.13 `bonus_chips` |
| | `:16` `PB_SVG` (`battle/battleHudTheme`) | ikony | `./battleHudTheme` (kopia P5.3) | §6.13 (kopia X) |
| | `:18` muzyka (`audio/muzyka-antyczna`) | `:258,277` | `controller/audio.ts` (te same nazwy) | — (ZAŁOŻENIE P5.6-Z4) |
| | `:19` `setArmyStackHudSuppressed` (`./hud`) | `:263,278` | `./armyStackHudSuppression` (most) | — (ZAŁOŻENIE P5.6-Z3) |
| `diplomacyNegotiationModal.ts` | `:6` `BasketItem`; `:7-8` `TempoGry`, `GameDifficulty` | typy | `BasketItemDto`; aliasy `string` (jak P5.5) | §6.6 |
| | `:10` `TRAKTAT_HANDLOWY_LABEL` | `:309,487` | `staticCatalog().labels.traktatHandlowyLabel` | §6.1 labels |
| `diplomacyTradeBasket.ts` | `:7` `isCurrencyProposalForbiddenDuringWar` | `:1269` | zapytanie `currencyForbiddenDuringWar` | §6.6 `currency_forbidden_war` |
| | `:8` `computeQuickDealBasket`, `proposalPnTurnsMultiplier`, `BasketItem` | `:2544,2800` | zapytania `quickDealBasket`, `balanceGiveItemsToFairMin`; `BasketItemDto` | §6.6 `diplomacy_quick_deal`, `diplomacy_balance_to_fair` |
| | `:9` `validateTradeBasketSides`, `:2833` re-eksport | `:1297-1300` | zapytanie `validateTradeBasketSides` | §6.6 `validation` |
| | `:10` `balanceGiveItemsToFairMin` | `:2545-2557` | zapytanie `balanceGiveItemsToFairMin` | §6.6 |
| | `:11-14` `proposalHasResourceAccess`, `stripWithdrawnResourceAccessItems` | `:2371-2372,2731-2733` | zapytania o tych nazwach | §6.6 |
| | `:17-31` `diplomacy-value-catalog` (wycena, fair min, zaufanie, dobra wola, progi, parametry, krok/normalizacja surowca) | wycena `:219`, podsumowanie `:1899-1993`, formularz `:1581-1588,1680,1790,2057,2466-2473` | `basketSumPn`, `basketSummary` (`DiplomacyBasketPreviewDto`), `handelSurowiecKrok`, `normalizeSurowiecIlosc`; stałe `progDarRelacja`, `zywnoscNaPn`, `handelZaufaniePerTura`, `handelSurowceKeys` | §6.6, §6.1 |
| | `:33` `HANDEL_ZLOZE_CENA_BAZA`, `:35` `units.json` | martwe funkcje `:429-433,441-446` | usunięte (brak wywołań na pinie) | — |
| | `:34` `BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS` | `:2609` | `constants.barbarianCooperationDefaultDurationTurns` | §6.1 (P5.2) |
| | `:36` `tech.json` | `:435-439` | `staticCatalog().tech` | §6.1 |
| | `:43-44` `BasketItemFormatCtx`, `formatBasketListBrief`, `resourceDisplayLabel` | `:95,1557,1953-1957` | `BasketItemFormatCtx` z `diplomacyDealDisplay.ts` (P5.3); `basketSummary.brief`; `resourceDisplayLabel` = mapa `labels.resourceKeyLabels` + formatowanie zapasowe | §6.6 `brief`; §6.1 labels |
| | `:46-50` `computePlayerAcceptanceSides`, `bilateralTreatyDisplayPw`, `sideDisplayOfferPw` | `:1077-1081` | zapytanie `treatyBasketSummary` | §6.6 `treaty_pw` |
| | `:52` `ProposalPayload`, `ProposalActionId` | typy | zbędne (rekord pól, `string`) | — |
| `diplomacyAudience.ts` | `:5` `CivBonusLite`; `:41` `TradeGoodsCategories` | typy | `CivBonusLiteDto`, `TradeGoodsCategoriesDto` | §6.6 |
| | `:6` muzyka | `:2422,2433` | `controller/audio.ts` | — |
| | `:7-16` `diplomacy-display` (nastawienie, W badge/tooltipy, etykieta traktatu, `FormalDiplomaticKind`) | `:1218,1243-1247,1366,1410,1421,1533-1534,1655,2162-2163` | `st.nastawienie`, `*WiarygodnoscView`, katalog, `FormalDiplomaticKindDto` | §6.6 `nastawienie`, `wiarygodnosc` |
| | `:17-22` `diplomacy-credibility` | `:1531-1533` | `WiarygodnoscViewDto.band/tooltip`; typy rozbicia → DTO | §6.6 `wiarygodnosc.rozbicie` |
| | `:43` PW traktatu na stole | `:1945-1949` | `PendingNegotiationRow.treatyPwWe/They` | §6.6 `treaty_pw` |
| | `:44-48` `balancePanelDataFromRows`, `filterActionableNegotiationRows` (usunięte z v2 w P5.2) | `:1964,2099,2108` | `st.negotiationTablePanel` (`PnBalancePanelDto`), `st.actionableNegotiationCount` | P5.2-Z10 |
| | `:49-53` `proposalHasResourceAccess`, `RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON`, `ProposalPayload` | `:2030,2036` | `row.resourceAccessWithdrawn`, katalog, `ProposalPayloadDto` | §6.6 `resource_access_withdrawn` |
| | `:54-58` `audience-actions` | `:492,1678,1697,1777,1806` | `constants.audienceMultiOwnActionIds`; kopie 1:1 formaterów notatek | §6.6 `actions[].allows_multiple_own`, `lock_note`, `status_note` |
| | `:282-283` inline `import('../game/diplomacy-acceptance-points')` | typy wiersza | `AcceptanceSideBalanceDto` (P5.2) | §6.6 |

### 3a. Rejestr rozszerzeń kontraktu P5-0 §6 (P5.6)

Metoda jak P5.2–P5.5 §3a: każde nowe pole sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6. P5.6 NIE zmienia P5-0.

| Pole / typ (v2) | Sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|
| `HexTooltipViewDto` (+ `HexImprovementLineDto`, `HexYieldPartDto`, `TerritoryResourceYieldDto`, `ImprovementBonusDto`) | §6.7 `HexContextDto` | `terrain`, `yield_base/full`, `improvements_active/available`, `magazyn_parts`, `deposit` | ROZSZ. (dookreślenie do kształtu, który renderuje pin: składowe rozbicia plonów z etykietą, magazyn per ulepszenie, gotowe etykiety zasobów; `HexContextDto` z P5.1 zostawiony) | Z6-1 |
| `TileYieldDto` = `TileYield` | §6.7 `TileYieldDto` | typ bez pól (`NieZmierzonoDto`) | W KONTRAKCIE (dookreślenie) | — |
| `FieldPowerDto` (`attack`, `defense`, `total`) | §6.8 `power` | jedna liczba | ROZSZ. (karta pokazuje atak/obronę/razem, pin `:829-837`) | Z6-1 |
| `cityDisplayLabel` | §3.2 `display_name` | jest | W KONTRAKCIE | — |
| `PreBattleSide.bonusChips` | §6.13 `bonus_chips` | jest | W KONTRAKCIE | — |
| `DiplomacyBasketPreviewDto.giftTrust: {delta, deltaRaw}` | §6.6 `gift_trust: Option<u32>` | jedna liczba | ROZSZ. (pin pokazuje limit, gdy `raw > delta`) | Z6-2 |
| `DiplomacyBasketPreviewDto.summaryFairMinPn` | §6.6 `fair_min_pn` | jedna liczba | ROZSZ. (podsumowanie liczy fair min bez limitu 100 — inna liczba niż panel P5.2) | Z6-2 |
| `TreatyBasketSummaryDto` | §6.6 `treaty_pw` | `{my, their, bilateral, base}` | ROZSZ. (PW wyświetlane stron + gotowy podgląd panelu traktatu/koszyka) | Z6-2 |
| zapytania `basketSumPn`, `basketSummary`, `treatyBasketSummary`, `quickDealBasket`, `balanceGiveItemsToFairMin` | §6.6 `diplomacy_preview_basket`, `diplomacy_quick_deal`, `diplomacy_balance_to_fair` | są (forma zapytania) | W KONTRAKCIE (`basketSumPn`/`treatyBasketSummary` = wycinki `diplomacy_preview_basket`) | Z5 |
| zapytania `validateTradeBasketSides`, `currencyForbiddenDuringWar`, `handelSurowiecKrok`, `normalizeSurowiecIlosc`, `stripWithdrawnResourceAccessItems`, `proposalHasResourceAccess` | §6.6 `validation`, `currency_forbidden_war`; reszta brak | częściowo | ROZSZ. (zapytania pomocnicze formularza; P5-0 §8 wiersz dyplomacji: „36 symboli R”) | Z5 |
| `DiplomacyNastawienieDto`, `WiarygodnoscViewDto`, `TradeGoodsCategoriesDto`, `Wiarygodnosc*Dto`, `CivBonusLiteDto`, `FormalDiplomaticKindDto`, `ProposalPayloadDto` | §6.6 `DiplomacyAudienceDto` | `nastawienie`, `wiarygodnosc` | W KONTRAKCIE (`nastawienie`, `wiarygodnosc`) + typy danych 1:1 web | — |
| `negotiationTablePanel`, `actionableNegotiationCount` | §6.6 / P5.2-Z10 | `PnBalancePanelDto` (P5.2) | ROZSZ. P5.2 (pole stanu audiencji) | Z6-3 |
| `PendingNegotiationRow.dealSides`, `treatyPwWe/They`, `resourceAccessWithdrawn` | §6.6 `DealDisplayDto`, `treaty_pw`, `resource_access_withdrawn` | są | W KONTRAKCIE (per wiersz stołu) | Z6-3 |
| `constants.zywnoscNaPn`, `progDarRelacja`, `handelZaufaniePerTura`, `handelSurowceKeys`, `audienceMultiOwnActionIds`; `labels.resourceKeyLabels` | §6.1 (K/S) | brak tych nazw | ROZSZ. (stałe K dyplomacji) | Z6-4 |

## 4. Reguły gry → pola DTO (przegląd ręczny 7 modułów, P5-0 §9 pkt 3)

Metoda: odczyt pełnego kodu każdego modułu + `grep -nE "(>=|<=| > | < |Math\.|\.filter\(|\.sort\()"`; sklasyfikowane miejsca niżej.

### 4.1 Reguły usunięte z UI (liczy Rust)

| Moduł | Reguła na pinie | Pole / zapytanie w v2 |
|---|---|---|
| `hexContextTooltip.ts` | plony bazowe/pełne, bonus lasu/rzeki (`:115-116,251-295`) | `view.yieldParts`, `view.yieldFull` |
| | magazyn z ulepszenia (`:136-142,189-198`) | `HexImprovementLineDto.magazyn` |
| | zasoby: lama wg cywilizacji, złoże/ukryte złoże wg epoki (`:327-358`) | `view.resourceLabels` |
| | filtr „Możliwe ulepszenia” — bramki terenu, lasu, złóż, cywilizacji, tartak przed obozem, droga przed brukowaną, rzeka u sąsiada (`hexHasRiverAccess` `:428-438`), limit 10 (`:440-513`) | `view.possible` (eksport `hexHasRiverAccess` usunięty) |
| | Moc pola (`fieldPower`, `:818-827`) | `fieldPower` |
| | dopisek miasta-państwa (`:620`) | `cityDisplayLabel` |
| `preBattle.ts` | wybór źródła bonusów (jawne vs hak, `:598-606`) + filtr bonusów walki (`bonusChipTexts`, `:712-713`) | `PreBattleSide.bonusChips` |
| `diplomacyTradeBasket.ts` | wycena PW z tempem/trudnością/rolą strony/mnożnikiem tur (`:190-227`) | `basketSumPn` |
| | fair min, zaufanie z nadwyżki/daru, limit na turę, dobra wola, skrót pozycji (`:1899-1993`) | `basketSummary` |
| | PW traktatu (strony, dwustronne, panel; `:1075-1096`) | `treatyBasketSummary` |
| | walidacja stron, zakaz waluty w wojnie (`:1269,1297-1300`) | zapytania |
| | krok/normalizacja surowca, wycofany dostęp (`:1581-1588,1680,1790,2057,2371,2466-2473,2731-2733`) | zapytania |
| | szybka umowa, wyrównanie do fair (`:2539-2559,2800-2807`) | zapytania |
| `diplomacyAudience.ts` | podłoga nastawienia w wojnie, etykieta, podpowiedź (`:1243-1247,1410,2162-2163`) | `st.nastawienie` |
| | pasmo i tooltip Wiarygodności (`:1531-1534`; pin `wiarygodnoscBadgeHtml`) | `*WiarygodnoscView` |
| | PW traktatu na kartach stołu (`:1945-1949`), panel PW stołu (`:1964,2108`), wiersze do decyzji (`:2099`), wycofany dostęp (`:2030`) | pola stanu / wiersza |
| | akcje z wieloma własnymi wpisami (`:492,1777`) | `constants.audienceMultiOwnActionIds` |

### 4.2 Pozostawione w UI — GRANICZNY / prezentacja (do decyzji przy integracji z silnikiem)

| Moduł | Miejsce (pin = v2) | Dlaczego zostało / propozycja |
|---|---|---|
| `diplomacyTradeBasket.ts` | `uiActionAllowsWarCurrency` (`:1383-1393`), `proposalActionIdFromUi` (`:1395-1415`) | mapowanie id akcji UI → id propozycji silnika i akcji „pokojowych” (zbiór stały); bramkę waluty liczy zapytanie `currencyForbiddenDuringWar`. Propozycja: `AudienceAction.warCurrencyAllowed` z Rust |
| | blokada handlu/daru `rel < progHandel/progDar` (`:2149-2155`), technologie po stronie „dostaję” `rel >= progHandelRelacja` (`:1455`), `PROG_HANDEL_REL = 100` (`:188`) | porównanie Relacji z progiem podanym w kontekście modala (`ctx.progHandelRelacja`/`progDarRelacja` — z silnika); domyślne progi = dane. Propozycja: `TradeableItemsDto`/`DiplomacyAudienceDto.actions[].allowed` |
| | widełki formularza traktatu (`defaultTreatyState` `:568-611`, `readTreatyStateFromDom` `:825-949`, `validateTreatyForm` `:951-1011`, czas umowy 1–20 `:1291,1318`) | walidacja wartości formularza zgodna z `clampDealTurns` silnika (komentarze pinu); silnik waliduje propozycję ponownie |
| | `computeAvailableTypes` (`:1438-1459`: typy wycofane, jednostka, waluta w wojnie, tech po progu) | lista typów formularza; częściowo pokrywa P5-0 Z8 (`TradeableItemsDto`) |
| | `formatCompactQty` (`:135-148`), krok `+N/+10N/+100N` | formatowanie liczb |
| | duplikaty/edycja koszyka (`addOrMergeBasketItem` `:1713-1728`, `applyBasketItemEdit` `:1761-1779`, `clampQtyForItem` `:1672-1683`) | stan koszyka w UI; limity = zapas z kontekstu + normalizacja z zapytania |
| `diplomacyAudience.ts` | suma Relacji zastępcza `relacjaTotal ?? (zaufanie + respekt)` (`:1485,2228`) | jak P5.5 `diplomacyPanel.ts:214-215`: Rust zawsze podaje `relacjaTotal` |
| | `HARD_RELATION_TREATY_UI_IDS` (`:1720`) | zbiór akcji, dla których UI pyta hak silnika `previewNegotiation` (próg liczy silnik) |
| | sortowanie kafelków zablokowane/dostępne (`:1838-1842`), paski Mocy (`:1352,1406`) | prezentacja |
| `diplomacyNegotiationModal.ts` | domyślne opłaty przemarszu `?? 20 / ?? 40` (`:300,380`), przycięcie ilości słodzika do `maxQty` (`:243`) | dane zapasowe / limit pola formularza |
| `preBattle.ts` | werdykt domyślny `>= 65 / <= 35` (`:608-612`), `unitKind` po słowach kategorii (`:559-565`), „Zasięg 2” (`:577`) | prezentacja szansy z silnika (`werdykt` gdy podany); ikona wg kategorii |
| `sidePanelEventFilter.ts` | filtr `origin !== 'other-civs'` (`:20-25`) | filtr widoku wg chipa UI |
| `sidePanelHud.ts` | liczniki zdarzeń blokujących/informacyjnych (`:697-748`) | prezentacja listy z silnika |

## 5. Zdarzenia wejścia (P4-5B)

Modale (`diplomacyTradeBasket`, `diplomacyNegotiationModal`, `preBattle`, modale potwierdzeń audiencji) zamykają się kliknięciem w tło (`e.target === overlay`) i Escape przez stos `escapeOverlayStack.ts` (P5.1); `preBattle.ts` słucha Enter na `document` (dodaje przy otwarciu, zdejmuje przy zamknięciu) — zgodne z P4-5B §3.2 Z3. Karta jednostki/heksa w `sidePanelHud.ts` jest zasilana z `HoverChanged`/`HexContextDto` (UI-Q3=B) — wiązanie z silnikiem poza tą rundą, `NIE_ZMIERZONO`.

## 6. Harness porównania DOM (`tools/dom-harness/run-cycles.mjs`)

**Metoda** = P5.5 (`build.mjs` bez zmian): oba drzewa pakowane `esbuild`, wspólny jsdom, zamrożony `Date`, kanoniczna serializacja `document.documentElement` albo JSON/HTML wartości, log akcji (callbacki) w DOM, eksploracja generyczna (klik każdego elementu, każde pole, klawisze). **Nowe w P5.6:** `sequence()` — scenariusze wielokrokowe na jednym panelu (dodanie pozycji, edycja, zmiana ilości, wyrównanie, wysłanie); `stash` jako selektor (trwały korzeń `.civ-diplo-aud`); `--stop-on-diff` (dla mutacji).

**„Rust” w harnessie** (dane i funkcje pinu; lista w nagłówku pliku): `HexTooltipViewDto` z eksportowanych funkcji pinu + transkrypcja filtra ulepszeń i rozbicia plonów (pin nie eksportuje `collectResourceLabels`/`listTerrainPossibleImprovements`/`yieldParts` — poprawność transkrypcji sprawdza samo porównanie z HTML pinu); dostawca `DiplomacyQueriesProvider` = funkcje `game/diplomacy-*` pinu (panel PW = formuła `run.mjs` P5.2); stan audiencji = funkcje pinu (`effectiveNastawienieScores`, `wiarygodnoscLabelPl`, `balancePanelDataFromRows`, `splitNegotiationDealPlayerSides`, …); `labels.resourceKeyLabels` = literał `RESOURCE_KEY_LABEL` odczytany z pliku pinu (nieeksportowany). Strona pinu dostaje te same fikstury (pola DTO pin ignoruje).

**Wyniki** (`05-dom-harness-cycles.log`, EXIT=0): `modułów=7 przypadków=6401 różnic=0 jsdomErrors=0 consoleErrors=0`.

| Moduł | Przyp. | Pokrycie |
|---|---:|---|
| `diplomacyAudience.ts` | 224 | 4 warianty konfiguracji (stan pełny z 7 wierszami stołu: własne/przychodzące/dar/traktat/stary dostęp/bez payloadu; wojna z miastem-państwem; pusty; bez kontekstu negocjacji) × klik każdego elementu (do 90; otwiera koszyki/modale) × Escape; auto-kontroferta; brak stanu; `actionBarHtml`, `dealsColumnHtml`, `treatiesColumnHtml` (z/bez haka), `otherCardHtml`, `withOwnTableTechFilter` (3 stany × 3 akcje × 3 wyjątki); 7 modali potwierdzeń × klik |
| `diplomacyNegotiationModal.ts` | 165 | `actionNeedsNegotiation`, `proposalActionIdFromPayload` (17 payloadów); 13 akcji × 1–3 konteksty × klik × Escape + „wypełnij pola i Zaproponuj” |
| `diplomacyTradeBasket.ts` | 4747 | funkcje eksportowane (tryb, akcje, typy, edycja, formularz „Dodaj”, scalanie/edycja pozycji, walidacja koszyka 5 kontekstów × 6 akcji × 12 koszyków × 4 czasy, `readItemFromForm` 112); 32 scenariusze modalu (handel/dar/11 traktatów × 6 kontekstów × koszyki startowe, w tym wycofany dostęp, wojna i prawie wyczerpany limit Zaufania/turę) × klik (do 70) × pola × Escape; 10 sekwencji wielokrokowych; szybka umowa × 5 kontekstów. Asercja v2: zapytania `basketSummary`/`treatyBasketSummary`/`basketSumPn` wywołane |
| `hexContextTooltip.ts` | 931 | CSS; 9 terenów × 9 nakładek × rzeka; każde ulepszenie katalogu × 3 tereny; 10 złóż × 4 tereny × 4 epoki; lama/konie/bydło × 4 cywilizacje; rzeka u sąsiada (mapa); wiele ulepszeń; × warianty miasta (miasto-państwo, właściciel, ludność) i magazyn przy 👤; karta jednostki 6 wariantów × kompakt/rozszerzona. Asercja v2: brak eksportu `hexHasRiverAccess` |
| `sidePanelHud.ts` | 56 | 6 konfiguracji (wydarzenia z linkami, kontekst heksa/jednostki własnej/obcej, legacy) × klik × Escape/Enter |
| `sidePanelEventFilter.ts` | 8 | 4 listy × chip wł./wył. |
| `preBattle.ts` | 270 | 7 sytuacji (atak gracza, obrona przed barbarzyńcami, miasto-państwo z jawnymi bonusami, bez właścicieli, skrajne, progi werdyktu 65 / 35,4) × hak bonusów × opcje × klik × Enter/Escape/x; kolejka automatyczna (2); zapis z toastem (2). Asercja v2: most ukrycia rosteru `[false, true, false]` |

**Czułość** (`06-harness-mutations-cycles.log`, `tools/dom-harness/mutate-cycles.mjs`): 66 mutacji — H1–H12 (każdy nowy odczyt pola DTO heksa/jednostki + reguła GRANICZNA Podatku), H13 kopia palety, S1–S2 kopie C5, B1–B5 (`preBattle`: DTO, kopia `PB_SVG`, most, GRANICZNY werdykt, kopia tekstu), N1–N3 (modal), T1–T26 bez T21 (koszyk: każdy odczyt wyniku zapytania/katalogu + GRANICZNY + kopia), A1–A18 (audiencja: pola DTO, katalog, kopie formaterów, markup, GRANICZNY, kopia). Pliki przywracane bajtowo (asercja w skrypcie). Wynik pełnego przebiegu: `mutacji=66 niewykrytych=1` — jedyna „niewykryta” to T8 z EXIT=2 (błąd pakowania esbuild, nie porównanie); powtórzona osobno w tym samym logu: `EXIT=1 WYKRYTA` (`mutacji=1 niewykrytych=0`). Między przebiegami w `mutate-cycles.mjs` zmieniono wyłącznie format linii dla EXIT=2. **Historia (jawnie):** pierwszy przebieg mutacji (67) dał 7 niewykrytych (B4, T4, T7, T8, T13, T21, A13) — dodano fikstury: progi werdyktu 65/35,4, kontekst `limit` (dopisek limitu Zaufania), koszyk handlu z pozycjami wycofanego dostępu, `tooltip` przy zablokowanej akcji paska; T21 usunięta, bo jej gałąź jest nieosiągalna (niżej, pkt 9); logi `05`/`06` pochodzą z przebiegu po tej zmianie.

**NIE_ZMIERZONO (harness):** (1) realny WebView/Tauri; (2) muzyka nakładek (pin: odtwarzacz nie gra, bo muzyka gry nie została uruchomiona; v2: usługa niezainstalowana — DOM bez zmian); (3) efekt `setArmyStackHudSuppressed` na panelu rosteru (`hud.ts` poza paczką) — v2 sprawdza tylko wywołania mostu; (4) eksploracja wewnątrz koszyka otwartego z audiencji — jeden poziom (koszyk eksplorowany osobno); (5) limity kliknięć (pełna lista w `05-dom-harness-cycles.log`, wiersze `NIE_ZMIERZONO`: kliknięto N z M); (6) pola `validation`/`currencyForbiddenWar`/`treatyPw` wyniku `basketSummary` nieczytane przez UI; (7) układ (pozycje, `offsetWidth` = 0 w jsdom); (8) zbieżność wzorów „Rust” z przyszłym silnikiem — harness odtwarza funkcje pinu (w tym transkrypcję filtra ulepszeń heksa); (9) wiersz „+N Zaufania/turę (trwa umowa handlowa)” (`diplomacyTradeBasket.ts:1961-1963`, stała `handelZaufaniePerTura`) — gałąź nieosiągalna na pinie i w v2: pozycje dostępu są usuwane przy otwarciu koszyka (`:2371-2372`), a formularz ich nie oferuje (`:1449`).

## 7. Uruchomienie bram (odtworzenie)

```bash
cd src-tauri/frontend-v2
npm ci && npx tsc --noEmit && npm run check && npx vite build
git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
node tools/dom-harness/run-cycles.mjs --pin-dir <PIN_DIR>        # EXIT 0 ⇔ 0 różnic
node tools/dom-harness/mutate-cycles.mjs --pin-dir <PIN_DIR>     # EXIT 0 ⇔ każda mutacja wykryta
node tools/dom-harness/run.mjs --pin-dir <PIN_DIR>               # regresja P5.2
node tools/dom-harness/run-level1a.mjs --pin-dir <PIN_DIR>       # regresja P5.3
node tools/dom-harness/run-c4.mjs --pin-dir <PIN_DIR>            # regresja P5.4
node tools/dom-harness/run-level2.mjs --pin-dir <PIN_DIR>        # regresja P5.5
rm -rf node_modules dist
```

## 8. ZAŁOŻENIA

- **P5.6-Z0 (zakres):** §1 — C1 i C3 pominięte (zależą od wyłączonych `cityPanel.ts`/`hud.ts`); `preBattle.ts` w zakresie dzięki mostowi Z3.
- **P5.6-Z1 (montaż):** `portCycles.ts` tylko zbiera moduły dla `vite build` (import dynamiczny po `installStaticCatalog`, P5.2-Z1 — moduły C2 czytają katalog przy ewaluacji); żaden panel nie jest wpięty do ekranu.
- **P5.6-Z2 (TerenBazowy):** wartości enumu `types/hex.ts:12-24` jako lokalna stała — tylko klucze mapy etykiet (dane prezentacji, nie stan gry); nieznany teren → surowy klucz jak na pinie.
- **P5.6-Z3 (most do `hud.ts`):** `ui/armyStackHudSuppression.ts` — `preBattle.ts` woła `setArmyStackHudSuppressed`, `hud.ts` (P5.7+) rejestruje implementację; do tego czasu brak efektu (jak pin bez zamontowanego panelu, `hud.ts:1771`).
- **P5.6-Z4 (muzyka):** `controller/audio.ts` — usługa wstrzykiwana (webview albo Rust — nierozstrzygnięte); brak usługi = cisza; MOCK zapisuje wywołania.
- **P5.6-Z5 (zapytania koszyka):** synchroniczny dostawca `DiplomacyQueriesProvider` (jak `buildingCardRules`, P5.4); transport asynchroniczny Tauri + pamięć podręczna = `NIE_ZMIERZONO`. Lokalne adaptery w `diplomacyTradeBasket.ts` zachowują nazwy funkcji pinu (minimalny diff); każdy liczy wyłącznie Rust.
- **P5.6-Z6 (kontekst zapytań):** `BasketRulesCtxDto` = surowe pola modala, które pin podawał regułom (Relacja, Zaufanie zdobyte w turze, tempo, trudność, skarbiec); wartości domyślne stosuje Rust. Rust może pominąć te pola i czytać stan sesji — wynik musi być ten sam.
- **P5.6-Z7 (formatery audiencji):** `audienceActionStatusNote`/`audienceActionBarLockNote` skopiowane 1:1 (wybór gotowego tekstu z pól akcji z Rust — P5-0 Z1 „czyste formatowanie”); markup badge'a W przeniesiony do UI, pasmo i tooltip z Rust.
- **P5.6-Z8 (hak `tradeFairnessPreview`):** usunięty z `NegotiationModalContext` — bramkę PW zwykłej wymiany zwraca `basketSummary.accepted`/`balancePn` (P5.2, P5-0 §6.6 wymóg tej samej funkcji co bramka przyjęcia).
- **P5.6-Z9 (martwy kod):** `defaultUnitOptions`, `defaultZlozeOptions`, `defaultResourceOptions` (`diplomacyTradeBasket.ts:429-433,441-454`) bez wywołań na pinie (`grep` w pliku) — usunięte razem z ich importami.
- **P5.6-Z10 (atrapa MOCK):** `createMockDiplomacyQueries()` (wycena `null`, walidacja przepuszcza), stałe dyplomacji w `MOCK_STATIC_CATALOG` oznaczone MOCK (bez kopii `gra/data`).

## 9. Allowlista, Git, sprzątanie

- Zmienione/nowe ścieżki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` bez zmian — brak nowych zależności), `dyspozycje/rust-port/p5/P5-6-PORT-CYKLE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1/**` (`15-allowlist-git-status.log`). Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
- Pliki w `frontend-v2` poza 7 modułami: `src/ui/{unitVitalsPalette,armyStackHudSuppression,portCycles}.ts` (NOWE), `src/controller/{diplomacyQueries,audio}.ts` (NOWE), `src/controller/index.ts` (eksporty), `src/controller/mockCatalog.ts` (Z10), `src/main.ts` (instalacja atrap, import `portCycles`), `src/viewmodel/types.ts` (§3a), `tools/pin-manifest.json` (+3), `tools/dom-harness/run-cycles.mjs`, `mutate-cycles.mjs` (NOWE), `package.json` (skrypty `harness:cycles`, `harness:cycles:mutate`), `PORTING-QUEUE.md` (status P5.6).
- `node_modules`, `dist` usunięte (`16-cleanup.log`). Commit w worktree jawnym `git add <ścieżki>` (logi `git add -f`), bez push. `.gitattributes` w katalogu runu: `r1-logi/diffs/*.diff -whitespace` (precedens P5.2–P5.5).

## 10. NIE_ZMIERZONO (zbiorczo)

1. Realny WebView/okno Tauri (nic nie uruchamiano; `tauri.conf.json` bez zmian).
2. Zapytania/komendy Rust dostarczające nowe pola i odpowiedzi (`HexTooltipViewDto`, `FieldPowerDto`, `bonusChips`, `DiplomacyQueriesProvider`, pola stanu audiencji) — dziś tylko harness i atrapa MOCK.
3. Transport asynchroniczny zapytań koszyka (Z5) i miejsce odtwarzania muzyki (Z4).
4. Pozycje z §6 „NIE_ZMIERZONO (harness)”.
