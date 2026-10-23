# P5.7 — Port `hud.ts`, panelu imperium (cykl C3), `cityPanel.ts` (cykl C1) i `newGameFlow.ts` do `src-tauri/frontend-v2/` — dokument tematu

**Temat:** `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
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
| 29 | `newGameFlow.ts` | **RUNDA 2** | podział na rundy (§1.1) |
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
| 32 | `sceneTimingReport.ts` | BEZP. | PRZENIESIONY (D-UI-7: typy → DTO, etykiety → katalog, przełącznik rzek → powłoka) | 212 → 222 | +14/−4 | importy `:5-8` → `MapGenPhaseTimingsDto`/`SceneBuildTimingsDto`, `MAP_GEN_PHASE_LABELS` = odczyt `StaticCatalogDto.constants.mapGenPhaseLabels` (Proxy, brak klucza = `''`), `getRiverGenEnabled` = `perfDiagnostics().riverGenEnabled` — identycznie jak `perfReport.ts` (P5.2) |
| 78 | `empireDetailPanel.ts` | BEZP. | PRZENIESIONY (reguły → zapytania/pola DTO, stałe → katalog, formatery → kopia) | 4433 → 4451 | +69/−51 | importy `:13-16,32-46` → §3; `:21` (`computeMiastaSummaryRow`) usunięty; `cityMiastaMiniDetail` + 5. argument `summary` (`:1749-1754`), `:1791-1799` pole `wzrostEff` wiersza usunięte (czytał je tylko wiersz SUMA), `:1828-1836` → `summary`; `:2389` → `p.zuzycieObywateliPerTyp`; `:2576` → `c.zuzycieObywateliPerTurn`; `:3111` → `row.wzrostProcentEff`; `:3292` → `u.total`; `:3574-3581` → `t.tradeBaseIncome`; `:3999` wywołanie z `snap.miastaSummary` |
| 79 | `empireDetailTypes.ts` | BEZP. | PRZENIESIONY (typ → DTO, nowe pola reguł, agregacja usunięta) | 732 → 726 | +35/−41 | `:5` → `ResourceUsageBreakdownDto` (+ `total`), `EmpireMiastaSummaryDto`; nowe pola: `EmpirePowerSnap.zuzycieObywateliPerTyp`, `EmpireCityPoborRow.zuzycieObywateliPerTurn`, `EmpireFoodCityUiRow.wzrostProcentEff`, `EmpireTradeSnap.tradeBaseIncome`, `EmpireDetailSnap.miastaSummary`; `:415-452` `aggregateHappinessSources` usunięta (konsument `main.ts:16313` — snapshot liczy silnik) |
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
| `15-allowlist-git-status.log` | `git status --porcelain`, `git diff --check` | tylko allowlista; `--check` czysty |

**Historia mutacji w tej rundzie (jawnie):** pierwszy pełny przebieg (przerwany limitem czasu narzędzia po 19 mutacjach; pliki przywrócone z kopii i porównane `cmp`) i drugi pełny przebieg wykazały **H2 NIEWYKRYTA** — eksploracja `hud.ts` zawsze podawała `onExecutePending`, więc gałąź `renderBarLegacy` (`hud.ts:543,1437-1441`) nie była pokryta. Harness rozszerzony o 3 konfiguracje bez `onExecutePending` (układ legacy); log `06-…` to przebieg po tej poprawce. Pierwszy przebieg regresji P5.5 (równolegle z mutacjami) dał 2 różnice w `mainMenu.ts` (kopia bajtowa, klasa `show` tostu zależna od timera pod obciążeniem CPU); powtórzony bez równoległego obciążenia: 1784 / 0 (log `10-…` = powtórzenie).

## 8. Odblokowane / następny krok

Po r1: `cityPanel.ts` ma wszystkie zależności UI w `frontend-v2` (łącznie z `hud.ts`); `newGameFlow.ts` — także (od P5.2). Runda 2: `newGameFlow.ts`; runda 3: cykl C1.

## 9. Allowlista

Zmienione/nowe pliki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`), `dyspozycje/rust-port/p5/P5-7-PORT-HUD-CITYPANEL.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1/**` — `15-allowlist-git-status.log`. `package-lock.json` bez zmian (brak nowych zależności).
