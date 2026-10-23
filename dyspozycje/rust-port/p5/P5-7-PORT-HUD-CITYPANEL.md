# P5.7 — Port `hud.ts`, panelu imperium (cykl C3), `cityPanel.ts` (cykl C1) i `newGameFlow.ts` do `src-tauri/frontend-v2/` — dokument tematu

**Temat:** `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 2/5 (r1 = C3 + `sceneTimingReport.ts`; r2 = `newGameFlow.ts` + poprawki zarzutów Evaluatora r1, §10)
**Baza kodu:** `origin/rust-port/parity-v2` @ `51a62a89` (detached, izolowany worktree; zawiera P5.1–P5.6). **Pin web:** `edb8fb56` (wyłącznie `git archive edb8fb56 gra/src gra/data` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`; gałąź `fix/web-recruitment-panel-A` NIE była czytana).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§2, §3.1, §6.5, §6.17, §7, §8, §9), `p5/P5-6-PORT-CYKLE.md` (wzorzec), `PORTING-QUEUE.md`.
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora. Nic nie było uruchamiane w Tauri ani w realnej przeglądarce (harness = jsdom).
**Logi:** `dyspozycje/autobot/runs/R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1/r1-logi/` (każdy kończy się `EXIT=<kod>`).

## 0. Wynik rundy 1 (kryterium binarne z dispatchu — stan po tej rundzie)

| Kryterium | Stan po r1 | Dowód (`r1-logi/`) |
|---|---|---|
| Wszystkie moduły z zakresu w `frontend-v2/src/ui/` (lub pominięte z powodem) | **CZĘŚCIOWO — wg jawnego podziału na rundy (§1.1)**: r1 = 4/4 (cykl C3 + `sceneTimingReport.ts`), `perfTestPanel.ts` pominięty z powodem (D-UI-7); `newGameFlow.ts` → r2, cykl C1 (`cityPanel.ts`, `cityUxFrame.ts`) → r3–r4 | §1, §2, `13-diff-stat.log` |
| Każdy z tabelą zmian vs pin | TAK (moduły r1) | §2, §3, `diffs/*.diff` |
| `npm ci` / `tsc --noEmit` / `npm run check` / `vite build` EXIT=0 | TAK / TAK / TAK / TAK (chunk `portHudEmpire-*.js` 176,42 kB) | `01-…`, `02-…`, `03-…`, `04-…` |
| Brama 0 trafień na całym `src/` | TAK: `plików=140 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=434 niezgodnych=0` | `03-check.log` |
| Harness DOM 0 różnic | TAK: **924 przypadki, 0 różnic**, 4/4 moduły porównane z pinem, asercje v2 6/6, `jsdomErrors=0` | `05-dom-harness-hud-empire.log` (+ `.json`) |
| Mutacje harnessu wykrywane | TAK: **29/29** wykrytych w jednym przebiegu (EXIT=0), pliki przywrócone bajtowo | `06-harness-mutations-hud-empire.log` |
| Regresja P5.2–P5.6 | 3861 / 0, 3618 / 0, 1649 / 0, 1784 / 0, 6401 / 0 różnic | `07-…`–`10-…`, `12-…` |
| Zero zmian poza allowlistą | TAK | §9, `15-allowlist-git-status.log` |

## 1. Zakres i decyzje

| Wiersze PQ | Moduły | Decyzja r1 | Powód |
|---|---|---|---|
| 78, 79, 80 | cykl **C3**: `empireDetailPanel.ts`, `empireDetailTypes.ts`, `hud.ts` | **PRZENIESIONY (r1)** | wszystkie zależności UI spoza cyklu w `frontend-v2` od P5.2–P5.6 (`tsc` po skopiowaniu `hud.ts`: 0 błędów — `hud.ts` nie ma własnych importów logiki) |
| 32 | `sceneTimingReport.ts` | **PRZENIESIONY (r1)** | niezależny od reszty (jedyna zależność UI = `perfReport.ts`, P5.2); D-UI-7: tylko typy/struktura — kod nie dotyka WebGL (`SceneBuildTimings` to liczby ms) |
| 30 | `perfTestPanel.ts` | **POMINIĘTY Z POWODEM** | D-UI-7 (bez sond WebGL): `perfTestPanel.ts:299-312` tworzy `THREE.WebGLRenderer` + scenę (benchmark GPU), `:270-282` uruchamia generator świata `generujSwiatAsync` (klasa M, P5-0 §7: „D-UI-7”), `:21-34` detekcja sprzętu `perf/hardwareProfile` — rdzeń modułu to sondy, nie panel |
| 29 | `newGameFlow.ts` | **PRZENIESIONY (r2)** | §10.2 |
| 81, 82 | cykl **C1**: `cityPanel.ts`, `cityUxFrame.ts` | **RUNDA 3 (+4)** | podział na rundy (§1.1); port z PINU `edb8fb56` |

### 1.1 Jawny podział pracy na rundy (dispatch: „nie osłabiaj kryteriów”)

| Runda | Grupa | Uzasadnienie kolejności |
|---|---|---|
| 1 (ta) | C3 (`hud.ts` + panel imperium) + `sceneTimingReport.ts`; decyzja `perfTestPanel.ts` | `hud.ts` blokuje C1 (`cityPanel.ts` importuje `hud.ts`) — musi być pierwszy; most `armyStackHudSuppression.ts` (P5.6-Z3) domknięty |
| 2 | `newGameFlow.ts` (2373 LOC, R15 F5 K5 — `NewGameOptionsDto` + zapytanie `new_game_preview`, P5-0 §6.10) | niezależny od C1; mniejszy |
| 3 (4) | C1: `cityPanel.ts` (11 986 LOC, R97 M7 F15 K19 S8 X2 T32 — P5-0 §4) + `cityUxFrame.ts` | największy moduł; reguły bez importu `:645-720`, `:3228-3229` (P5-0) |
| 5 | rezerwa (FAIL/poprawki) | limit 5 rund |

Kryteria binarne dotyczą każdej rundy w całości dla jej grupy (brama 0 trafień, harness 0 różnic, mutacje, regresja). Temat kończy się PASS dopiero po porcie wszystkich grup.

**ZAŁOŻENIE P5.7-Z0 (zakres r1):** dispatch każe podzielić pracę na rundy wg grup, gdy nie da się domknąć w jednej; r1 obejmuje grupę blokującą (C3) i moduły niezależne. Panel rekrutacji `cityPanel.ts` — wyłącznie wersja z pinu (zmiana układu z `fix/web-recruitment-panel-A` = osobny temat po wydaniu, dispatch).

## 2. Tabela modułów r1 (status, zmiany względem pinu)

Liczby z `13-diff-stat.log`; diffy: `r1-logi/diffs/*.diff`.

| PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) |
|---:|---|---|---|---|---|---|
| 32 | `sceneTimingReport.ts` | BEZP. | PRZENIESIONY (D-UI-7: typy → DTO, etykiety → katalog, przełącznik rzek → powłoka) | 212 → 222 | +14/−4 | importy `:5-8` → `MapGenPhaseTimingsDto`/`SceneBuildTimingsDto`, `MAP_GEN_PHASE_LABELS` = odczyt `StaticCatalogDto.constants.mapGenPhaseLabels` (Proxy; r2: brak klucza = `undefined` jak na pinie — bez wartości zastępczej, zarzut 5), `getRiverGenEnabled` = `perfDiagnostics().riverGenEnabled` — identycznie jak `perfReport.ts` (P5.2) |
| 78 | `empireDetailPanel.ts` | BEZP. | PRZENIESIONY (reguły → zapytania/pola DTO, stałe → katalog, formatery → kopia) | 4433 → 4451 | +69/−51 | importy `:13-16,32-46` → §3; `:21` (`computeMiastaSummaryRow`) usunięty; `cityMiastaMiniDetail` + 5. argument `summary` (`:1749-1754`), `:1791-1799` pole `wzrostEff` wiersza usunięte (czytał je tylko wiersz SUMA), `:1828-1836` → `summary`; `:2389` → `p.zuzycieObywateliPerTyp`; `:2576` → `c.zuzycieObywateliPerTurn`; `:3111` → `row.wzrostProcentEff`; `:3292` → `u.total`; `:3574-3581` → `t.tradeBaseIncome`; `:3434-3436` → `stored[0]?.magazynyCount ?? 0` (r2, zarzut 6); `:3999` wywołanie z `snap.miastaSummary` |
| 79 | `empireDetailTypes.ts` | BEZP. | PRZENIESIONY (typ → DTO, nowe pola reguł, agregacja usunięta) | 732 → 726 | +35/−41 | `:5` → `ResourceUsageBreakdownDto` (+ `total`), `EmpireMiastaSummaryDto`; nowe pola: `EmpirePowerSnap.zuzycieObywateliPerTyp`, `EmpireCityPoborRow.zuzycieObywateliPerTurn`, `EmpireFoodCityUiRow.wzrostProcentEff`, `EmpireTradeSnap.tradeBaseIncome`, `EmpireDetailSnap.miastaSummary`; `:415-448` `aggregateHappinessSources` usunięta (konsument `main.ts:16313` — snapshot liczy silnik; r2: JSDoc `EmpireTradeRouteRow` `:450-453` przywrócony — zarzut 2); r2: `EmpireResourceRow.magazynyCount?` (zarzut 6) |
| 80 | `hud.ts` | PRZECH. | PRZENIESIONY (pin + most) | 1861 → 1864 | +3/−0 | import `registerArmyStackHudSuppression` + rejestracja `setArmyStackHudSuppressed` po definicji (`:1778`) — domknięcie ZAŁOŻENIA P5.6-Z3 (`preBattle.ts` ukrywa roster przez most) |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty) — `diffs/*.diff`.

**Nowe pliki pomocnicze:** `v2:controller/empireQueries.ts` (zapytania suwaków + atrapa MOCK, eksport w `controller/index.ts`, instalacja w `main.ts`), `v2:ui/portHudEmpire.ts` (zbiór modułów r1 do `vite build`, import dynamiczny z `main.ts` po instalacji katalogu i zapytań — ZAŁOŻENIE P5.2-Z1). `viewmodel/types.ts`: `CityPodzialHandluDto`, `CityPodzialPracyDto`, `ResourceUsageBreakdownDto`, `EmpireMiastaSummaryDto`; `StaticCatalogLabelsDto.stockResourceLabels`, `.daninaGenitive` (+ atrapa w `mockCatalog.ts`).

## 3. Mapowanie import → DTO / kontroler

| Moduł | Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|---|
| `empireDetailPanel.ts` | `:13` `formatObywateleLabel`, `formatManpower` (`game/manpower`) | etykiety | kopie 1:1 (`manpower.ts:495-499`, `:858-872`; klasa F) — jak `unitRecruitCard.ts` (P5.3) | §2 F (Z1) |
| | `:14` `stockResourceLabel` | nazwy surowców magazynu | `staticCatalog().labels.stockResourceLabels[key] ?? key` (= `STOCK_RESOURCE_LABEL`, `building-stock-cost.ts:143-172`) | §6.1 |
| | `:15` `CITIZEN_UPKEEP_RATE_PER_CITIZEN` | `:2389,2576` reguła; `:2586` tekst stopki | reguła → pola DTO (§4); tekst → `constants.citizenUpkeepRatePerCitizen` | §6.5 `citizen_upkeep_per_citizen` |
| | `:16` `resourceUsageTotal` | `:3292` | `ResourceUsageBreakdownDto.total` | §6.5 `resource_usage + total` |
| | `:32` `daninaLabelGenitive` | `:3729,3732` | `staticCatalog().labels.daninaGenitive` | §6.1 labels |
| | `:33` `HANDEL_PCT_STEP`, `MAX_PROCENT_NAUKA` | suwaki | `constants.handelPctStep`, `.maxProcentNauka` | §6.1 K |
| | `:33` `adjustHandelSplit`, `normalizePodzialHandlu` | `:94,129,1171,1217,1539` | `empireQueries().adjustHandelSplit/normalizePodzialHandlu` (ZAŁOŻENIE P5.7-Z2) | §6.5 Z7 |
| | `:33` `snapHandelPct` | — (import martwy na pinie) | usunięty | — |
| | `:34` `CityPodzialHandlu`, `CityPodzialPracy` | typy | `CityPodzialHandluDto`, `CityPodzialPracyDto` | §6.5 |
| | `:36-38` `MAX_PROCENT_PULI_IMPERIUM`, `procentPuliImperiumZBudynkow`, `podzialPracyZProcentuPuli` | `:1453,1463-1515` | stała → `constants.maxProcentPuliImperium`; funkcje → `empireQueries()` | §6.5 Z7 |
| | `:39-41` `PODZIAL_PRACY_PULA_*` | etykiety | `labels.podzialPracyPula{Lbl,Pelna,Tip}` (P5.5) | §6.1 |
| | `:44-45` `WYZYWIENIE_*`, `formatWyzwienieLabel`, `PoziomRacji` | suwak racji, etykiety | stałe → `constants.wyzywienie*`; formater = kopia 1:1 z `clampPoziomRacji` (`population-growth-v85.ts:165-168,200-203`); typ = `number` | §2 F (Z1), K |
| | `:21` `computeMiastaSummaryRow` (`./empireMiastaTable`, GRANICZNY wg P5.1) | `:1828-1836` | `EmpireDetailSnap.miastaSummary` (`EmpireMiastaSummaryDto`) | P5.1: `citiesSummary` |
| `empireDetailTypes.ts` | `:5` `ResourceUsageBreakdown` | typ pola `usage` | `ResourceUsageBreakdownDto` | §6.5 |
| `sceneTimingReport.ts` | `:5-6` `MapGenPhaseTimings`, `MAP_GEN_PHASE_LABELS` | raport | `MapGenPhaseTimingsDto` (P5.2), `constants.mapGenPhaseLabels` (P5.2) | §6.17 |
| | `:7` `getRiverGenEnabled` | notka „Rzeki: WYŁĄCZONE” | `perfDiagnostics().riverGenEnabled` (P5.2, D-UI-7) | §6.17 |
| | `:8` `SceneBuildTimings` | typ | `SceneBuildTimingsDto` (P5.2) | §6.17 |
| `hud.ts` | — (0 importów logiki) | — | + `./armyStackHudSuppression` (most P5.6) | — |

**ZAŁOŻENIE P5.7-Z1 (stałe przy ewaluacji modułu):** `empireDetailPanel.ts` czyta stałe katalogu na poziomie modułu (jak `buildModeHud.ts` P5.5) — `portHudEmpire.ts` jest importowany dynamicznie po `installStaticCatalog` (P5.2-Z1).
**ZAŁOŻENIE P5.7-Z2 (suwaki):** zapytania synchroniczne `controller/empireQueries.ts` zamiast wariantu „surowa wartość + normalizacja po zapisie” z P5-0 §6.5 Z7 — zachowanie pinu 1:1 (mierzalne harnessem), bez widocznego skoku; zapis wartości bez zmian przez hooki `onOwnerDefault*Change` (komendy `set_trade_split`/`set_labor_split`). Transport do Rust = `NIE_ZMIERZONO` (jak P5.6-Z5).
**ZAŁOŻENIE P5.7-Z3 (pola reguł w snapshocie):** wynik reguł bez importu trafia do istniejących pod-struktur snapshotu najbliższych danej sekcji (`power`, `cityPobor[]`, `food.perCityRows[]`, `trade`, korzeń) zamiast nowych parametrów funkcji; jedyna zmiana sygnatury: `cityMiastaMiniDetail` (eksport do testów) dostaje 5. argument.

## 4. Reguły bez importu (przegląd modułów r1)

Metoda: przegląd wszystkich operacji arytmetycznych (`Math.*`, akumulacje `+=`, `.reduce`) i komentarzy deklarujących zgodność z silnikiem (`grep -n -i "formuł\|reguł\|silnik"`) w 4 modułach; `hud.ts` dodatkowo przegląd `Math.`/porównań (`:471-528` zoom UI, `:768` klamra pierścienia, `:777-795` odmiana liczebników, `:1440-1590` minimapa zastępcza na canvas — prezentacja).

| Miejsce (pin) | Klasa | Decyzja |
|---|---|---|
| `empireDetailPanel.ts:2389` `floor(Σ ludki × stawka)` | REGUŁA (komentarz `:2383`: „TA SAMA formuła co silnik”) | → `power.zuzycieObywateliPerTyp` |
| `:2576` `floor(ludki × stawka)` per miasto | REGUŁA | → `cityPobor[].zuzycieObywateliPerTurn` |
| `:3111` / `:1799` wzrost efektywny (`nakarmione === false ? 0 : wzrost`) | REGUŁA (komentarz `:3107`: „jednolinijkowa reguła”) | → `food.perCityRows[].wzrostProcentEff`; wiersz SUMA Miasta → `miastaSummary` |
| `:1828-1836` `computeMiastaSummaryRow` | GRANICZNY (P5.1: nie wpinać bez pola DTO) | → `miastaSummary` |
| `:3574-3581` baza dochodu szlaków (odwrócenie premii cudów `round(income / (1 + bonus%))`) | REGUŁA | → `trade.tradeBaseIncome` |
| `:3434-3436` liczba Magazynów `round((cap − capBase) / capBonusPerMagazyn)` (odwrócenie formuły capu silnika, `game/economy-upkeep.ts:448-455` `ownerResourceCapacityPerType`) | REGUŁA (r2, zarzut 6 — ta sama klasa co `:3574-3581`) | → `resources[].magazynyCount` (r2) |
| `:1185`, `:1228` podgląd kwoty podziału `≈ round(baseAmount × pct / 100)` dla położenia suwaka | GRANICZNY (r2, zarzut 6): proporcja liczby wyświetlanej (`baseAmount` z DTO) dla wartości suwaka PRZED zapisem (stan UI, którego DTO nie zna — przeliczane przy każdym `input`); tekst jawnie przybliżony („≈”). Silnik liczy per miasto `floor(handelNetto × pct)` (`economy.ts:1060-1067`) — UI nie replikuje tej reguły, tylko skaluje sumę. Precedens: podgląd suwaka P5-0 §6.5 Z7 | pozostawione; propozycja: pole `EmpireTradeSplitPreviewDto` z zapytania przy przeciąganiu, jeśli P5.14 wykaże rozjazd |
| `:3292` `resourceUsageTotal` | REGUŁA (import) | → `usage.total` |
| `empireDetailTypes.ts:429-452` `aggregateHappinessSources` | GRANICZNY (agregacja + zaokrąglenie dla snapshotu, konsument `main.ts`) | usunięta (silnik dostarcza `happiness`) |
| `:977,1064-1068` rozkład bilansu skarbca (`wplywy − handel`, `utrzB + utrzJ`) | GRANICZNY (arytmetyka wyświetlanych pól) | pozostawione; proponowane `EmpireTreasuryDto.{danina, koszty}` |
| `:1131-1136,2027-2034,2062-2073,2120-2126,2289-2299,2650-2652,3113-3116,4200-4210` sumy kolumn tabel | GRANICZNY (sumy liczb widocznych w tej samej tabeli; część zależy od wyboru UI — zakres miasta `:2020-2023`, filtr surowców `:2124`) | pozostawione; proponowane pola sum per tabela tam, gdzie nie zależą od wyboru UI |
| `:2653` ekwiwalent jednostek per miasto `rekruci / kosztJednostki` | GRANICZNY | pozostawione; proponowane `cityPobor[].rekrutEkw` |
| `:2830-2843` walidacja formularza masowej rekrutacji (stać na paczkę × liczba) | GRANICZNY (walidacja pola formularza; komendę waliduje silnik atomowo — stopka `:2774`) | pozostawione (precedens `armySplitPanel.ts`, P5.5) |
| `:4159` brak do progu kultury `next − kultura` | GRANICZNY | pozostawione |
| `empireDetailTypes.ts:22-39` `buildUchwalaSolSpichlerzII` | GRANICZNY (tekst opisuje regułę; aktywność z DTO) | pozostawione |
| `sceneTimingReport.ts` | — | brak reguł (sumy podkroków `:145` = prezentacja raportu diagnostycznego) |

## 5. Harness DOM (`tools/dom-harness/run-hud-empire.mjs`)

Metoda = `run-cycles.mjs` (P5.6): esbuild + jsdom, zamrożony `Date`, kanoniczna serializacja `documentElement`, log callbacków w DOM, eksploracja generyczna (każdy element klikalny / każde pole × wartości: min, max, 37%, 81% zakresu; `select` — każda opcja; `number` — 3, 0, 9999, 2.5 / klawisze). Strona v2 dostaje DTO zbudowane z danych i funkcji pinu (harness = „Rust”): katalog (`game/cities.ts`, `population-growth-v85.ts`, `citizen-resource-upkeep.ts`, `building-stock-cost.ts`, `danina-nazwa.ts`, `map/mapGenProgress.ts`, `ui/power-labels.ts` + stałe dyplomacji jak P5.6), `EmpireQueriesProvider` = funkcje `game/cities.ts`, nowe pola snapshotu = funkcje/transkrypcja pinu (`computeMiastaSummaryRow`, `resourceUsageTotal`, wzory `:2389,2576,3111,3574-3581`), `badges` = funkcje pinu.

Pokrycie: `empireDetailPanel.ts` — 3 warianty snapshotu (pełny / głód + obcy fotel + portret + uchwały / pusty) × 17 sekcji (każdy blok `empirePanelBlockForSection`) × 3 konfiguracje hooków (pełna / fotel 2 / brak) dla sekcji z suwakami; sekwencja toggle/refresh; funkcje eksportowane (`cityMiastaMiniDetail`, `renderMiastoSection`, `renderObywateleSection`, `renderArmiaProdukcjaMini`, `renderMassRecruitmentSection`, `resUsageDetailsHtml`, `mountMassRecruitmentControls` × 5 liczb, `treasuryBalanceSignedTxt`, `empirePanelBlockForSection`, `empireSectionFromHudAct`); asercje v2: 4 zapytania suwaków trafiają do dostawcy. `hud.ts` — 4 konfiguracje (`showHud` + eksploracja + klawisze), `renderBarD1B` × 3 stany, ukrycie rosteru: funkcja `hud` vs most (`armyStackHudSuppression`) × 3 sekwencje, `setMapHudChromeSuppressed`; asercja v2: most zarejestrowany. `sceneTimingReport.ts` — 7 zestawów opcji × rzeki wł./wył. + retry po usunięciu panelu. `empireDetailTypes.ts` — stała + `buildUchwalaSolSpichlerzII` × 10; asercja: brak `aggregateHappinessSources`.

**NIE_ZMIERZONO (z logu harnessu):** przewijanie (`scrollTop`/`scrollIntoView` — jsdom bez układu), wygląd CSS w realnej przeglądarce, minimapa z danymi oraz `mapToolbar`/`buildMode` w `hud.ts` (moduły porównane z pinem w P5.2/P5.5, przekazywane bez zmian), pełny ekran / zoom UI, typy TS `empireDetailTypes.ts` (sprawdza `tsc`). Timer usuwania linku pobierania (`perfReport.downloadTextFile`, 200 ms): link usuwany przez harness od razu po kliku, nazwa pliku + URL w logu akcji (zależność od obciążenia pętli zdarzeń, nie od kodu).

## 6. Mutacje (`tools/dom-harness/mutate-hud-empire.mjs`)

29 mutacji: każdy odczyt nowego pola DTO (E1–E6), etykiety katalogu (E7, E8, E18), 4 zapytania suwaków (E9–E12), stałe katalogu (E13–E17), kopie formaterów F (E19–E21), GRANICZNY (E22), markup kopii (E23, T1, H2, S3), most `hud` (H1), `sceneTimingReport` (S1, S2). Wynik: patrz §7 / `06-harness-mutations-hud-empire.log`.

## 7. Bramki (surowe logi; `r1-logi/`, każdy log kończy się `EXIT=`)

| Log | Komenda (cwd `src-tauri/frontend-v2`) | Wynik |
|---|---|---|
| `01-npm-ci.log` | `npm ci` | EXIT=0 (`package-lock.json` bez zmian) |
| `02-tsc.log` | `npx tsc --noEmit` | EXIT=0 |
| `03-check.log` | `npm run check` (self-test bramy, brama na `src index.html vite.config.ts`, `verify-pin-copies`) | EXIT=0; `plików=140 plików_z_trafieniami=0 trafień=0`; `plików=434 niezgodnych=0` |
| `04-vite-build.log` | `npx vite build` | EXIT=0 |
| `05-dom-harness-hud-empire.log` (+ `.json`) | `node tools/dom-harness/run-hud-empire.mjs --pin-dir <PIN>` | EXIT=0; 924 przypadki / 0 różnic |
| `06-harness-mutations-hud-empire.log` | `node tools/dom-harness/mutate-hud-empire.mjs --pin-dir <PIN>` (jeden przebieg, 29 mutacji) | TAK: **29/29** wykrytych w jednym przebiegu (EXIT=0), pliki przywrócone bajtowo |
| `07-…p52`, `08-…p53`, `09-…p54`, `10-…p55`, `12-…p56-regresja.log` | `run.mjs`, `run-level1a.mjs`, `run-c4.mjs`, `run-level2.mjs`, `run-cycles.mjs` | EXIT=0 ×5; 3861/0, 3618/0, 1649/0, 1784/0, 6401/0 |
| `11-gate-calibration-pin-hud-empire.log` | brama na 4 plikach pinu | EXIT=1: 14 trafień w 3 plikach (`hud.ts` 0) |
| `12b-gate-v2-hud-empire.log` | brama na 4 modułach v2 + `portHudEmpire.ts` + `controller/empireQueries.ts` | EXIT=0: 0 trafień |
| `13-diff-stat.log`, `diffs/*.diff` | `difflib.unified_diff` pin vs v2 | 4 diffy |
| `15-allowlist-git-status.log` | `git status --porcelain`, `git diff --check` | tylko allowlista; `--check` czysty **wyłącznie dla drzewa roboczego przed dodaniem nowych plików — twierdzenie r1 BŁĘDNE dla commita** (zarzut 4 Evaluatora; poprawka i dowód: §10.1, `r2-logi/15-…`) |

**Historia mutacji w tej rundzie (jawnie):** pierwszy pełny przebieg (przerwany limitem czasu narzędzia po 19 mutacjach; pliki przywrócone z kopii i porównane `cmp`) i drugi pełny przebieg wykazały **H2 NIEWYKRYTA** — eksploracja `hud.ts` zawsze podawała `onExecutePending`, więc gałąź `renderBarLegacy` (`hud.ts:543,1437-1441`) nie była pokryta. Harness rozszerzony o 3 konfiguracje bez `onExecutePending` (układ legacy); log `06-…` to przebieg po tej poprawce. Pierwszy przebieg regresji P5.5 (równolegle z mutacjami) dał 2 różnice w `mainMenu.ts` (kopia bajtowa, klasa `show` tostu zależna od timera pod obciążeniem CPU); powtórzony bez równoległego obciążenia: 1784 / 0 (log `10-…` = powtórzenie).

## 8. Odblokowane / następny krok

Po r1: `cityPanel.ts` ma wszystkie zależności UI w `frontend-v2` (łącznie z `hud.ts`); `newGameFlow.ts` — także (od P5.2). Runda 2: `newGameFlow.ts`; runda 3: cykl C1.

## 9. Allowlista

Zmienione/nowe pliki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`), `dyspozycje/rust-port/p5/P5-7-PORT-HUD-CITYPANEL.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1/**` — `15-allowlist-git-status.log`. `package-lock.json` bez zmian (brak nowych zależności).

---

## 10. Runda 2 (obrona r1 + `newGameFlow.ts`)

Baza: commit Operatora r1 `c3f84c3d` (rodzic `51a62a89`), odtworzony w izolowanym worktree (detached). Logi: `r2-logi/` (każdy kończy się `EXIT=`). Zarzuty: raport Evaluatora r1 (FAIL, 9 zarzutów).

### 10.1 Odpowiedzi na zarzuty Evaluatora r1

| # | Zarzut | Odpowiedź | Poprawka / dowód |
|---:|---|---|---|
| 1 | Temat niedomknięty (`newGameFlow.ts`, C1) | **PRZYJMUJĘ** (kryterium binarne tematu nie jest spełnione — tak też deklarował raport r1); w r2 wykonana grupa rundy 2 wg §1.1 | `newGameFlow.ts` przeniesiony (§10.2); C1 → r3–r4 bez zmian planu; kryteria rund nieosłabione |
| 2 | Usunięty JSDoc `EmpireTradeRouteRow` (`empireDetailTypes.ts:450-453`) | **PRZYJMUJĘ** | JSDoc przywrócony bajtowo; zakres usunięcia poprawiony na `:415-448` (§2, komentarz w kodzie); `r2-logi/diffs/empireDetailTypes.diff` — brak linii `-` z `TEMAT 14` |
| 3 | Brak rejestru rozszerzeń z numerami sekcji P5-0 i statusem | **PRZYJMUJĘ** | §10.4 (r1 + r2, każde pole: sekcja P5-0, co P5-0 ma, W KONTRAKCIE / ROZSZ., ZAŁOŻENIE) |
| 4 | Fałszywe „`git diff --check` czysto” | **PRZYJMUJĘ** | przyczyna: diffy unified mają z natury spację końcową (pusty wiersz kontekstu = `" "`) i pustą linię na końcu; `runs/<ID>/.gitattributes`: `*.diff -whitespace`, `*.log -whitespace` (tylko artefakty dowodowe tego tematu, w allowliście); `r2-logi/15-allowlist-git-status.log`: `git diff --check 51a62a89 ad5116d4` na COMMICIE r2 (r1+r2) — **EXIT=0**; ten sam check z wyłączeniem katalogu `runs/<ID>/` (kod + dokumenty) — EXIT=0, oraz `git diff --cached --check` przed commitem — EXIT=0 (uwaga w logu: atrybuty czytane z drzewa roboczego, więc dowód dotyczy wyłącznie commita zawierającego `.gitattributes`); twierdzenie r1 oznaczone jako błędne (§7, `01-operator-r1.md`) |
| 5 | Mutacja `?? ''` → `?? 'X'` w `sceneTimingReport.ts:17` niewykryta | **PRZYJMUJĘ** | wartość zastępcza była odstępstwem od pinu (pin: zwykły obiekt → `undefined` → tekst „undefined”); usunięta — Proxy zwraca dokładnie wartość katalogu; harness: 3 przypadki „katalog-niepełny” (1 klucz / 3 klucze / pusty), te same klucze usunięte po obu stronach; mutacje S4 (`?? 'X'`) i S5 (`?? ''`) WYKRYTE (`r2-logi/06-…`) |
| 6 | Przegląd reguł niepełny (`:1185,1228`; `:3435` niespójnie z `:3574-3581`) | **PRZYJMUJĘ** | `:3434-3436` → pole `EmpireResourceRow.magazynyCount` (REGUŁA, jak `:3574-3581`); fikstura harnessu z 2 wartościami capu (2 i 1 Magazyn); mutacje E24/E25 WYKRYTE. `:1185,1228` sklasyfikowane GRANICZNY z uzasadnieniem (podgląd „≈” stanu suwaka przed zapisem) — §4 |
| 7 | Ślepa plamka bramy: `` import(`../game/${x}`) `` (odziedziczona) | **PRZYJMUJĘ jako uwagę poza zakresem** (brama `tools/check-no-logic-imports.mjs` nie była zmieniana w P5.7; zmiana bramy poza zakresem tematu portu) | `grep -rnE "import\(\s*\`" src-tauri/frontend-v2/src` → 0 trafień (`r2-logi/16-gate-template-import-probe.log`), więc wynik 0 trafień obowiązuje; rekomendacja osobnego tematu dla orkiestratora |
| 8 | Niestabilny harness P5.5 (`mainMenu.ts` tost, odziedziczony) | **PRZYJMUJĘ jako uwagę poza zakresem** (harness P5.5 i `mainMenu.ts` nie są zmieniane w P5.7) | regresja P5.5 w r2: przebieg 1 (w pełnym zestawie bramek; maszyna współdzielona z innymi agentami, load avg ~15 na 4 rdzeniach) — 1784 / **1 różnica**: `mainMenu.ts` `menu(domyślny):klik#5`, klasa `cm-toast show` (ten sam tost zależny od timera; plik poza P5.7; zachowany jako `r2-logi/10a-…-przebieg1-flaky.log`); powtórzenie jako jedyny proces tematu — **1784 / 0** (`r2-logi/10-…`). Niestabilność odtworzona po raz trzeci; rekomendacja osobnego tematu (deterministyczny zegar tostu) |
| 9 | Brak SHA w raporcie r1 | **PRZYJMUJĘ** | `01-operator-r1.md`: SHA `c3f84c3d` dopisany; `02-operator-r2.md` podaje SHA r2 |

### 10.2 `newGameFlow.ts` (PQ 29) — tabela zmian vs pin

| PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) |
|---:|---|---|---|---|---|---|
| 29 | `newGameFlow.ts` | BEZP. | PRZENIESIONY (reguły → zapytania, stałe → katalog, jakość mapy → kopia 1:1 Z9, typy → DTO) | 2373 → 2414 | +105/−64 | importy `:20-24,27-49,56-59,63-70` → §10.3; `:509-521` (`START_EPOCH_ORDER`, `startEpochIndex`, `civMinStartEpochIndex`) usunięte, `:580-582` → zapytanie `civAvailableAtEpoch`; `:543` predykat filtra jako predykat typu (to samo zachowanie: `!!c.Cywilizacja`); `:1187,1194,1212,1216,1224-1226,1317,1343` → pola `CivMatrixCellDto`; `:2169` → `p.startPreview.summaryRows`. Markup, CSS i teksty poza tym bajtowo jak pin (`r2-logi/diffs/newGameFlow.diff`) |

Zasób: `ui/assets/hero/hero-intro.png` = kopia bajtowa pinu (`git cat-file blob edb8fb56:gra/src/ui/assets/hero/hero-intro.png | sha256sum` = `10f35cb1…25ece4`, 2 039 500 B) + wpis w `tools/pin-manifest.json` (`verify-pin-copies`: `plików=435 niezgodnych=0`, `r2-logi/03-check.log`). Nowe pliki: `controller/newGameQueries.ts` (dostawca + MOCK, eksport `controller/index.ts`, instalacja `main.ts`), `ui/portNewGame.ts` (import dynamiczny z `main.ts`, P5.2-Z1). `tools/dom-harness/build.mjs`: opcja `urlAsHash` (domyślnie wyłączona — inne harnessy bez zmian).

**ZAŁOŻENIE P5.7-Z4 (zapytania kreatora):** synchroniczne zapytania `controller/newGameQueries.ts` z sygnaturami pinu (wiersze rostera cywilizacji jako dane katalogu, jak na pinie, żeby `cfg.data` z wywołującego działało 1:1) zamiast pełnego `NewGameOptionsDto` z P5-0 §6.10 (którego pola P5.1 zostawił jako `NieZmierzonoDto`). Transport do Rust = `NIE_ZMIERZONO`.
**ZAŁOŻENIE P5.7-Z5 (`cfg.data`):** `NewGameFlowConfig.data` = `{ civs, cityNamesPools? }` (jedyne pola `GameData`, które kreator czyta); brak `cfg.data` → `staticCatalog()` (pin: `loadGameData()`; brak katalogu = `null`, jak `catch` pinu).
**ZAŁOŻENIE P5.7-Z6 (`summaryRows`):** `StartPreviewDto.summaryRows` (P5-0 §6.10) jedzie w `NewGameParams.startPreview` do `onStart` — dodatkowe pole względem pinu (harness porównuje je osobno z `startPreviewSummaryRows` pinu, resztę parametrów 1:1).

### 10.3 `newGameFlow.ts` — mapowanie import → DTO / kontroler

| Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|
| `:20` `loadGameData`, `GameData` (`data/loader`) | dane cywilizacji i pul nazw | `staticCatalog()` (`civs`, `cityNamesPools`); typ lokalny `{ civs; cityNamesPools? }` (Z5) | §6.1 |
| `:22` `isCivAvailableAtGameEpoch` | — (martwy import na pinie) | usunięty | — |
| `:23` `CivEntryEpochRow` | typ wiersza rostera | `CivDefDto` | §6.1 |
| `:28-30,35,43` `DEFAULT_PLAYER_CIV_ID`, `DEFAULT_START_EPOCH_ID`, `DEFAULT_RENDER_QUALITY`, `MAX_TYPY_CYWILIZACJI_MENU`, `LAND_FRACTION_PERCENT_OPTS` | stałe kreatora | `staticCatalog().constants.newGameDefaultPlayerCivId/…StartEpochId/…RenderQuality`, `.maxTypyCywilizacjiMenu`, `.landFractionPercentOpts` | §6.10 `defaults`, `land_fraction_opts` |
| `:32-34,36-38` `civTypesMenuForMapLabel`, `defaultCivTypesFromMapLabel`, `maxCivTypesForStartEpoch`, `defaultMiastaPanstwaFromMapLabel`, `clampMiastaPanstwaCount`, `miastaPanstwaMenuForMapLabel` | menu i limity skalowane do mapy/epoki | `newGameQueries().…` (te same nazwy i argumenty) | §6.10 `menus_by_map_label` (Z4) |
| `:41-42,44` `typSwiataFromMenuLabel`, `worldGenerationPresetFromLabels`, `defaultLandFractionPercentForTyp` | etykiety menu → parametry generatora | `newGameQueries().…` | §6.10 (Z4) |
| `:31,39-40` `bundledMapQualityFromLabel`, `qualityTierFromLabel`, `qualityTierToLabel` | jakość mapy (renderer) | kopia 1:1 `map/newGameMapDefaults.ts:144-185` | Z9 (powłoka, nie reguła) |
| `:45-47` `LandFractionPercent`, `QualityTier`, `WorldGenerationPreset` | typy | `number`, `QualityTierDto`, `WorldGenerationPresetDto` | §6.10 |
| `:49` `buildStartPreview`, `startPreviewSummaryRows`, `StartPreview` | podgląd startu | `newGameQueries().buildStartPreview` → `StartPreviewDto` (+ `summaryRows`) | §6.10 `new_game_preview` |
| `:56-59` typy temp (`BuildingCostPace`, …) | typy opcji zaawansowanych | `BuildingCostPaceDto`, `KosztJednostekPaceDto`, `WzrostLudnosciPaceDto`, `RuchSwiataPaceDto` (literały 1:1) | §6.10 |
| `:64-69` `buildCivMatrixSemanticProfile`, `civMatrixFormattedValue`, `civMatrixIntensityLabel`, `civMatrixParameterLabelPl`, `statusAllowsDefaultVisibility`, `CivMatrixSemanticCell` | profil macierzy kroku 3 | `newGameQueries().civMatrixProfile` → `CivMatrixProfileDto`; komórki `CivMatrixCellDto` (`paramLabel`, `formatted`, `baselineFormatted`, `intensityLabel`, `visibleByDefault` + pola komórki) | §6.10 `civs[].matrix` |
| `:25,26,50-55,60-62` `brandTokenVars`, `uiParams`, `aiCivPicker`, `brandAssets`, `hero-intro.png?url`, `hudTitleTooltip` | UI | bez zmian (moduły w v2 od P5.2/P5.5; obraz = kopia pinu) | — |

### 10.4 Rejestr rozszerzeń kontraktu P5-0 §6 (P5.7 r1 + r2; zarzut 3)

Metoda jak P5.6 §3a: każde nowe pole sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md`). P5.7 NIE zmienia P5-0.

| Pole / typ (v2) | Runda | Sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|---|
| `EmpirePowerSnap.zuzycieObywateliPerTyp` | r1 | §6.5 | `citizen_upkeep_per_citizen` (stawka) | ROZSZ. (wynik reguły `floor(Σ ludki × stawka)` zamiast stawki; stawka nadal w §6.1 `citizen_upkeep_rate_per_citizen` — tekst stopki) | Z3 |
| `EmpireCityPoborRow.zuzycieObywateliPerTurn` | r1 | §6.5 | jw. | ROZSZ. (per miasto) | Z3 |
| `EmpireFoodCityUiRow.wzrostProcentEff` | r1 | §6.5 (§5 `growth.pct_per_turn` dotyczy panelu miasta) | brak | ROZSZ. (wzrost efektywny głodującego miasta = 0) | Z3 |
| `EmpireTradeSnap.tradeBaseIncome` | r1 | §6.5 | brak | ROZSZ. (baza dochodu szlaków bez premii cudów) | Z3 |
| `EmpireDetailSnap.miastaSummary` (`EmpireMiastaSummaryDto`) | r1 | §6.5 | brak (P5.1 nazwał to pole `citiesSummary` jako warunek wpięcia GRANICZNEGO `computeMiastaSummaryRow`) | ROZSZ. (nazwa v2 = `miastaSummary`, zgodnie z nazwą modułu `empireMiastaTable.ts`; semantyka = P5.1 `citiesSummary`) | Z3 |
| `EmpireResourceRow.magazynyCount` | r2 | §6.5 | brak | ROZSZ. (liczba Magazynów, z której silnik policzył `cap`) | Z3 |
| `ResourceUsageBreakdownDto` (+ `total`) | r1 | §6.5 | `resource_usage: ResourceUsageBreakdownDto + total` | W KONTRAKCIE | — |
| `CityPodzialHandluDto`, `CityPodzialPracyDto` | r1 | §6.5 | `default_handel: SplitDto`, `default_praca_procent_puli` | W KONTRAKCIE | — |
| zapytania `empireQueries()` (`adjustHandelSplit`, `normalizePodzialHandlu`, `procentPuliImperiumZBudynkow`, `podzialPracyZProcentuPuli`) | r1 | §6.5 Z7 | komenda `set_trade_split`/`set_labor_split` z surową wartością + normalizacja po zapisie | ROZSZ. (forma: zapytanie synchroniczne przy przeciąganiu; komendy zapisu bez zmian) | Z2 |
| `constants.handelPctStep`, `.maxProcentNauka`, `.maxProcentPuliImperium`, `.wyzywienieMin/Max/Step`, `.citizenUpkeepRatePerCitizen` | r1 | §6.1 | są (`handel_pct_step`, `max_procent_nauka`, `max_procent_puli_imperium`, `wyzywienie_min/max/step`, `citizen_upkeep_rate_per_citizen`) | W KONTRAKCIE | — |
| `labels.stockResourceLabels` | r1 | §6.1 `labels` | brak tej nazwy | ROZSZ. (etykiety surowców magazynu = `STOCK_RESOURCE_LABEL`) | Z1 |
| `labels.daninaGenitive` | r1 | §6.1 `labels` (§6.2 ma `labels.danina: DaninaLabelForms` per miasto) | dopełniacz per miasto | ROZSZ. (ta sama forma na poziomie imperium) | Z1 |
| `MapGenPhaseTimingsDto`, `SceneBuildTimingsDto`, `constants.mapGenPhaseLabels`, `PerfDiagnosticsDto.riverGenEnabled` | r1 | §6.17 | `PerfReportDto` (warunkowo, D-UI-7) | ROZSZ. P5.2 (pola z rejestru P5.2; P5.7 ich nie zmienia) | P5.2 |
| `constants.newGameDefaultPlayerCivId`, `.newGameDefaultStartEpochId`, `.newGameDefaultRenderQuality` | r2 | §6.10 `defaults` | `{player_civ, start_epoch, render_quality, ...}` | W KONTRAKCIE (dookreślenie `NieZmierzonoDto`; w `StaticCatalogDto` zamiast `NewGameOptionsDto`) | Z4 |
| `constants.landFractionPercentOpts` | r2 | §6.10 `menus_by_map_label.land_fraction_opts` | jest (per etykieta mapy) | W KONTRAKCIE (na pinie stała, niezależna od mapy) | Z4 |
| `constants.maxTypyCywilizacjiMenu` | r2 | §6.10 | brak | ROZSZ. (sufit, gdy roster pusty) | Z4 |
| zapytania `miastaPanstwaMenuForMapLabel`, `civTypesMenuForMapLabel` (`NewGameMenuBundleDto`) | r2 | §6.10 `menus_by_map_label {civ_types, miasta_panstwa}` | są | W KONTRAKCIE (forma zapytania) | Z4 |
| zapytania `defaultMiastaPanstwaFromMapLabel`, `defaultCivTypesFromMapLabel`, `maxCivTypesForStartEpoch`, `clampMiastaPanstwaCount` | r2 | §6.10 | brak (tylko menu) | ROZSZ. (wartości domyślne/limity parametrów `create_session`) | Z4 |
| zapytania `typSwiataFromMenuLabel`, `defaultLandFractionPercentForTyp`, `worldGenerationPresetFromLabels` | r2 | §6.10 | brak | ROZSZ. (etykiety menu → klucze generatora) | Z4 |
| zapytanie `buildStartPreview` → `StartPreviewDto` (pola `StartPreview` + `summaryRows`), `StartPreviewInputDto` | r2 | §6.10 `new_game_preview(settings) -> StartPreviewDto { summary_rows, ... }` | jest | W KONTRAKCIE (dookreślenie „...” polami web) | Z4, Z6 |
| zapytanie `civMatrixProfile` → `CivMatrixProfileDto`; `CivMatrixCellDto` + `baselineFormatted`, `intensityLabel`, pola komórki web | r2 | §6.10 `civs[].matrix: CivMatrixCellDto{param_label, formatted, intensity, visible_by_default}` | 4 pola | ROZSZ. (mediana sformatowana, etykieta siły, pola statusu/filtra/wyszukiwania) | Z4 |
| zapytanie `civAvailableAtEpoch(epokiStartowe, epochId)` | r2 | §6.10 `civs[].available_at_epoch` | jest (numer epoki) | W KONTRAKCIE (forma: predykat zamiast numeru — sygnatura pinu przy `cfg.getCivs`) | Z4 |
| `QualityTierDto` + kopia `qualityTier*`/`bundledMapQuality*` | r2 | Z9 | `render_quality` po stronie powłoki | W KONTRAKCIE | Z9 |
| `TypSwiataDto`, `DensityTierDto`, `WorldGenerationPresetDto`, `*PaceDto` | r2 | §6.10 | — | typy web 1:1 (bez pól nowych) | — |

### 10.5 Reguły bez importu — `newGameFlow.ts` (przegląd r2)

Metoda jak §4 (wszystkie `Math.*`, porównania liczb, tablice mapowań, komentarze „silnik/reguł”).

| Miejsce (pin) | Klasa | Decyzja |
|---|---|---|
| `:509-521,580-582` dostępność cywilizacji w epoce (najwcześniejsza z `epokiStartowe` ≤ wybrana; kaskada D-CYW-EPOKA-WEJSCIA) | REGUŁA | → zapytanie `civAvailableAtEpoch` (§6.10 `available_at_epoch`) |
| `:523-571` `parseEpokiStartowe`, `parseEpokaWejscia`, `civsFromData` (mapowanie pól `civs.json` → `CivOption`, wartości zastępcze) | GRANICZNY (adapter danych katalogu, bez reguły gry; D-UI-4) | pozostawione; propozycja: `NewGameOptionsDto.civs[]` z Rust (P5.13) |
| `:330-394` `migrateAdvanced` (migracja preferencji kreatora w `localStorage`, w tym mapowanie starej skali barbarzyńców — duplikat `migrateBarbariansLevel`) | GRANICZNY (preferencje UI, nie stan gry) | pozostawione |
| `:2004-2006,2049-2052` `min(civTypes, epochCivMax)`, wartość zastępcza `MAX_TYPY_CYWILIZACJI_MENU` | GRANICZNY (klamra parametru formularza do limitu z zapytania; walidacja `create_session` w silniku — `NIE_ZMIERZONO`) | pozostawione |
| `:758-777` klamra indeksu menu typów cywilizacji do zakresu opcji | GRANICZNY (indeks menu z zapytania) | pozostawione |
| `:2018` ziarno `Math.random` | GRANICZNY (ziarno nadaje kreator; Rust może je nadpisać) | pozostawione |
| `:1636-1769` mapowanie indeksów opcji zaawansowanych ↔ wartości, `:2062` `villageRewardsEnabled` z etykiety, `:2104` `100 − ląd` | prezentacja / mapowanie formularza | pozostawione |
| `:685-689` `bonusRowClass`, `:716-736` treść podpowiedzi trudności, `:2109-2155` etykiety podsumowania | prezentacja / tekst | pozostawione |

### 10.6 Harness `tools/dom-harness/run-newgame.mjs` i mutacje `mutate-newgame.mjs`

Pokrycie: 8 konfiguracji (`data` pełne / bez danych → katalog / `getCivs` / roster zredukowany: tylko-żelazo, bez `epokiStartowe`, legacy bonusy, bez `ikonaId`, pusta nazwa / tylko późne epoki / pusty roster + `getCivs` / roster bez epoki Kamienia + `getCivs`) × 5 zestawów preferencji (`brak`, v4, legacy v2 z migracjami, legacy bez pól, uszkodzone) × kroki 1–5 (+ modal zaawansowanych, ekran fotela 2); eksploracja: każdy element klikalny (karty epok/cywilizacji/AI, pasek kroków, strzałki, przyciski, `summary`, ikony ⓘ), pole wyszukiwania profilu × 6 zapytań, filtr × 7 opcji; na kroku 4 po każdym kliknięciu dodatkowo start gry (pełny JSON `onStart`); 16 sekwencji wielokrokowych (epoka żelaza, wstecz, pasek kroków, fotel 2 wybór/wyłączenie, limit AI, cykl strzałek mapy, wszystkie opcje zaawansowane, typ świata → ląd, menu główne, ukrycie, pusty roster × 2, roster późny × 2); parametry UI bez ustawień (A: 5 kluczy, B: miasta-państwa, typy cywilizacji, rozmiar mapy — wartości zastępcze `buildParams` z zapytań); ponowne otwarcie z zapisanymi preferencjami; stan `localStorage` po każdym przypadku. Asercje v2: 12/12 zapytań kreatora użytych przez moduł. Wynik: **1194 przypadki, 0 różnic, asercje v2 12/12, `DOM_puste=0/1194`, `jsdomErrors=0`** (`r2-logi/17-dom-harness-newgame.log`).

Mutacje (`r2-logi/18-harness-mutations-newgame.log`): 33 — stałe katalogu (N1–N5), 12 zapytań (N6–N17), pola DTO (N18–N25), dane z katalogu (N26–N27), kopia jakości mapy Z9 (N28–N31), markup kopii (N32–N33). Wynik: **33/33 WYKRYTYCH, 0 niewykrytych, EXIT=0** — 4 grupy (`--only`) równolegle na kopiach drzewa `frontend-v2` (przebieg sekwencyjny przerywany limitem czasu narzędzia na obciążonej maszynie; po przerwaniu `newGameFlow.ts` przywrócony i porównany `cmp` z wersją odtworzoną z `r2-logi/diffs/newGameFlow.diff`); przebieg bazowy bez mutacji pod tym samym obciążeniem: 1194 / 0.

**NIE_ZMIERZONO:** `syncSettLayoutHeight` (jsdom bez układu: `offsetHeight` = 0); wygląd CSS (tło hero, rozmycie, animacje) i podpowiedzi `title` w realnej przeglądarce; transport zapytań do Rust (Z4).

### 10.7 Bramki r2 (`r2-logi/`, cwd `src-tauri/frontend-v2`, czysty `npm ci`)

| Log | Komenda | Wynik |
|---|---|---|
| `01-npm-ci.log` | `npm ci` (po `rm -rf node_modules dist`) | EXIT=0 (`package-lock.json` bez zmian) |
| `02-tsc.log` | `npx tsc --noEmit` | EXIT=0 |
| `03-check.log` | `npm run check` | EXIT=0; self-test 33+/15−/1, błędów 0; `plików=143 plików_z_trafieniami=0 trafień=0` (cały `src/` + `index.html` + `vite.config.ts`); `verify-pin-copies` `plików=435 niezgodnych=0` |
| `04-vite-build.log` | `npx vite build` | EXIT=0 |
| `05-dom-harness-hud-empire.log` (+ `.json`) | `node tools/dom-harness/run-hud-empire.mjs --pin-dir <PIN>` | EXIT=0; **927 / 0** (r1: 924 + 3 przypadki `katalog-niepełny`, zarzut 5) |
| `06-harness-mutations-hud-empire.log` | `node tools/dom-harness/mutate-hud-empire.mjs --pin-dir <PIN>` | EXIT=0; **33/33** wykrytych (r1: 29 + E24, E25 `magazynyCount`, S4 `?? 'X'`, S5 `?? ''`) |
| `07-…p52`, `08-…p53`, `09-…p54`, `12-…p56-regresja.log` | `run.mjs`, `run-level1a.mjs`, `run-c4.mjs`, `run-cycles.mjs` | EXIT=0 ×4; 3861/0, 3618/0, 1649/0, 6401/0 |
| `10-…p55-regresja.log` (+ `10a-…-flaky.log`) | `run-level2.mjs` | EXIT=0; 1784/0 (powtórzenie; przebieg 1: 1 różnica tostu `mainMenu.ts`, zarzut 8) |
| `11b-gate-calibration-pin-newgame.log` | brama na `newGameFlow.ts` pinu | EXIT=1: 9 trafień (`CORE:data` 1, `CORE:game` 7, `CORE:map` 1) — kalibracja |
| `12c-gate-v2-r2.log` | brama na `newGameFlow.ts`, `portNewGame.ts`, `newGameQueries.ts` + 3 moduły r1 poprawione w r2 | EXIT=0: 0 trafień |
| `13-diff-stat.log`, `diffs/*.diff` | `difflib.unified_diff` pin vs v2 (5 modułów) | `newGameFlow.ts` 2373→2414 +105/−64; `empireDetailPanel.ts` 4433→4449 +72/−56; `empireDetailTypes.ts` 732→736 +40/−36; `sceneTimingReport.ts` 212→225 +17/−4; `hud.ts` 1861→1864 +3/−0 |
| `15-allowlist-git-status.log` | `git status`, `git diff --name-only`, `git diff --check` na commicie r2 | §10.1 zarzut 4 |
| `16-gate-template-import-probe.log` | grep importów z szablonem (`` import(` ``/`` require(` ``) w `src index.html vite.config.ts` | EXIT=1 = brak trafień (zarzut 7) |
| `17-dom-harness-newgame.log` (+ `.json`) | `node tools/dom-harness/run-newgame.mjs --pin-dir <PIN>` | EXIT=0; **1194 / 0**, asercje v2 12/12, `jsdomErrors=0` |
| `18-harness-mutations-newgame.log` | `mutate-newgame.mjs` (4 grupy `--only`) | EXIT=0; **33/33** |

### 10.8 Stan kryterium binarnego po r2

Moduły z zakresu: C3 (3) + `sceneTimingReport.ts` + `newGameFlow.ts` przeniesione, `perfTestPanel.ts` pominięty z powodem; **C1 (`cityPanel.ts`, `cityUxFrame.ts`) — runda 3 (i 4)**. Temat nie jest domknięty do czasu portu C1 (podział §1.1 bez zmian).
