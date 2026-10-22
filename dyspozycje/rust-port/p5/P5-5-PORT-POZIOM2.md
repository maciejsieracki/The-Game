# P5.5 — Port poziomu 2 do `src-tauri/frontend-v2/` (26 modułów: przechodnie poziomu 1, poziom 2, poziom 3 bez cyklu; DTO + harness DOM)

**Temat:** `R-RUSTPORT-P5-5-PORT-POZIOM2-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Baza kodu:** `origin/rust-port/parity-v2` @ `98e11c25` (detached, izolowany worktree; zawiera P5.1–P5.4). **Pin web:** `edb8fb56` (wyłącznie `git show` / `git archive` do katalogu scratch poza repo; zero `npm`/buildu w `gra/`).
**Dokumenty wejściowe** (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…`): `dyspozycje/autobot/runs/R-RUSTPORT-P5-5-PORT-POZIOM2-Q1/00-dispatch.md`, `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§3.1–§3.2, §6.1, §6.5, §6.6, §6.8, §6.9, §8, §9), `p5/P5-1-UI-SHELL-SKELETON.md`, `p5/P5-4-PORT-CYKL-C4.md` (wzorzec), `p4/P4-5B-MAP-UI-SEAM.md`, `LEDGER.md:134` (UI-Q1=A, UI-Q2=A, UI-Q3=B).
**Legenda:** `plik:linia` bez prefiksu = `gra/src/ui/<plik>` na pinie `edb8fb56`; `v2:` = `src-tauri/frontend-v2/src/…` po tej rundzie; `NIE_ZMIERZONO` = nie sprawdzone; **ZAŁOŻENIE** = luka rozstrzygnięta przez Operatora. Nic nie było uruchamiane w Tauri ani w realnej przeglądarce.
**Logi:** `dyspozycje/autobot/runs/R-RUSTPORT-P5-5-PORT-POZIOM2-Q1/r1-logi/` (każdy kończy się `EXIT=<kod>`).

## 0. Wynik w skrócie (kryterium binarne z dispatchu)

| Kryterium | Stan | Dowód (`r1-logi/`) |
|---|---|---|
| Wszystkie moduły z zakresu w `frontend-v2/src/ui/` (lub pominięte z powodem) | TAK: **26/26**, 0 pominiętych (lista i reguła doboru — §1) | §2, `12-diff-stat.log` |
| Każdy z tabelą zmian vs pin | TAK | §2, §3, `diffs/*.diff` (9 diffów; 17 plików identycznych bajtowo) |
| `npm ci` / `tsc --noEmit` / `npm run check` / `vite build` EXIT=0 | TAK / TAK / TAK / TAK | `01-npm-ci.log`, `02-tsc.log`, `03-check.log`, `04-vite-build.log` (chunk `portLevel2-*.js` 219,73 kB) |
| Brama 0 trafień na całym `src/` | TAK: `plików=122 plików_z_trafieniami=0 trafień=0`; `verify-pin-copies: plików=431 niezgodnych=0` | `03-check.log` |
| Harness DOM 0 różnic | TAK: **1784 przypadki, 0 różnic**, 26/26 modułów porównanych z pinem, asercje v2 7/7 | `05-dom-harness-level2.log` (+ `.json`) |
| Mutacje harnessu wykrywane | TAK: **34/34** (EXIT=1 każda), pliki przywrócone bajtowo | `06-harness-mutations-level2.log` |
| Regresja P5.2 / P5.3 / P5.4 | 3861 / 0, 3618 / 0, 1649 / 0 różnic | `07-…p52-regresja.log`, `08-…p53-regresja.log`, `09-…p54-regresja.log` |
| Kalibracja bramy na tych samych 26 plikach | pin: 13 trafień w 7 plikach (EXIT=1) → v2: 0 trafień w 27 plikach (EXIT=0) | `10-gate-calibration-pin-level2.log`, `11-gate-v2-level2.log` |
| Zero zmian poza allowlistą | TAK | §9, `14-allowlist-git-status.log` |

## 1. Zakres — reguła doboru i lista (ustalona z `PORTING-QUEUE.md`)

**Reguła (dispatch):** moduł z kolejki wchodzi, gdy KAŻDA jego zależność UI jest już w `frontend-v2` (z P5.1–P5.4 albo z tej samej paczki), nie należy do cyklu i nie jest na liście wyłączeń (`newGameFlow.ts`, `perfTestPanel.ts`/`sceneTimingReport.ts` — D-UI-7, `cityPanel.ts`, `hud.ts`, `hexContextTooltip.ts`, C5). Kolejność: najpierw moduły z największą liczbą dependentów (kolumna 10 PQ).

| Wiersze PQ | Moduły | Dlaczego w zakresie |
|---|---|---|
| 46–53 | `leaderBannersHud`, `cityCaptureNotice`, `cityForeignPick`, `cityUnitPick`, `gamePauseMenu`, `hotSeatHandoff`, `mainMenu`, `unitForeignPick` | PRZECHODNIE poziomu 1 (blokowały tylko `icons/brandAssets.ts`/`uiParams.ts`, P5.2) — poza listą P5.3 |
| 54–68 | `buildModeHud`, `diplomacyPanel`, `techTreeView`, `unitInfoCard`, `wikiHubHud`, `unitPanelHud`, `contextPanelHud`, `diplomacyProposalBanner`, `hudChip6c`, `mapToolbarHud`, `armyMergePickPanel`, `armySplitPanel`, `diplomacyPendingHud`, `interHumanDiplomacyHud`, `unitReplacePicker` | cały poziom 2 (bez cyklu); blokujące z P5.2–P5.4 |
| 71, 72, 74 | `armyStackHud`, `diploListHud`, `unitActionBarHtml` | poziom 3 bez cyklu; jedyne blokujące z kolejki (`unitPanelHud.ts`, `diplomacyPanel.ts`) są w tej paczce |

**Poza zakresem (z powodem):** 29 `newGameFlow.ts`, 30/32 `perfTestPanel.ts`/`sceneTimingReport.ts` (D-UI-7), 75 `hexContextTooltip.ts`, 76/77 C5, 80 `hud.ts`, 81 `cityPanel.ts` — wyłączenia dispatchu; 69, 70, 73 (cykl C2), 78, 79 (cykl C3 z `hud.ts`), 82 (cykl C1 z `cityPanel.ts`) — cykle („niecykliczne”); 83 `preBattle.ts` — zależy od `hud.ts` (niespełniony warunek „każda zależność UI w `frontend-v2`”). **Pominięte z zakresu: brak.**

**Kolejność portu (dependenci malejąco, PQ kol. 10):** `unitPanelHud` (4) → `buildModeHud`, `diplomacyPanel`, `contextPanelHud`, `diplomacyProposalBanner`, `hudChip6c`, `mapToolbarHud`, `leaderBannersHud`, `armyStackHud`, `diploListHud`, `unitActionBarHtml` (1) → pozostałe (0).

## 2. Tabela modułów (status, zmiany względem pinu)

Liczby z `12-diff-stat.log`. „Harness” = `05-dom-harness-level2.log`.

| PQ | Moduł | Typ | Status | LOC pin → v2 | +/− | Zakres zmian (wyłącznie) | Harness (przyp./różn.) |
|---:|---|---|---|---|---|---|---:|
| 46 | `leaderBannersHud.ts` | PRZECH. | KOPIA BAJTOWA | 68 | 0 | — | 2 / 0 |
| 47 | `cityCaptureNotice.ts` | PRZECH. | KOPIA BAJTOWA | 356 | 0 | — | 36 / 0 |
| 48 | `cityForeignPick.ts` | PRZECH. | KOPIA BAJTOWA | 244 | 0 | — | 27 / 0 |
| 49 | `cityUnitPick.ts` | PRZECH. | KOPIA BAJTOWA | 265 | 0 | — | 36 / 0 |
| 50 | `gamePauseMenu.ts` | PRZECH. | KOPIA BAJTOWA | 317 | 0 | — | 57 / 0 |
| 51 | `hotSeatHandoff.ts` | PRZECH. | KOPIA BAJTOWA | 135 | 0 | — | 15 / 0 |
| 52 | `mainMenu.ts` (+ `assets/hero/hero-menu.png`) | PRZECH. | KOPIA BAJTOWA | 514 | 0 | — (zasób `?url`, `:20`, identyczny bajtowo) | 66 / 0 (+1/1 asercja) |
| 53 | `unitForeignPick.ts` | PRZECH. | KOPIA BAJTOWA | 245 | 0 | — | 27 / 0 |
| 54 | `buildModeHud.ts` | BEZP. | PRZENIESIONY (stałe → katalog, reguła → DTO) | 963 → 975 | +19/−7 | import `:7` `ImprovementKey` → lokalny alias `string`; `:17` typy polityki → `Ulepszenia*Dto`; `:22-25` stałe zakresu → `staticCatalog().constants`; nowe wymagane `BuildTypeInfo.affordable`; `:689` `t.kosztPraca > pracaPool` → `!t.affordable` | 138 / 0 (+1/1) |
| 55 | `diplomacyPanel.ts` | BEZP. | PRZENIESIONY (format → literał atrapy) | 533 → 532 | +1/−2 | import `:10` usunięty; `:203` `formatEntityDisplayName({ baseName: 'Sparta', isCityState: true })` → literał `'Sparta · miasto-państwo'` (wiersz danych podglądu bez haka) | 35 / 0 |
| 56 | `techTreeView.ts` | BEZP. | PRZENIESIONY (dane → katalog, reguły → DTO) | 1130 → 1144 | +24/−12 | importy `:18,21-23` → `staticCatalog()`, `ResearchViewDto`; `TechTreeViewConfig`: `getTempoGry`/`getDifficulty` (`:49-50`) → `getResearchView`; `:156` lista technologii z katalogu; `:167` etykiety ulepszeń z katalogu; `TtvState.difficulty` → `view`; `:254-255` tempo z DTO; `:268` koszt z `techs[].effectiveCost`; `TEMPO_GRY` (`:699`) z `constants.tempoGry`, typ `TempoGry` = lokalny alias `string` | 210 / 0 (+3/3) |
| 57 | `unitInfoCard.ts` | BEZP. | PRZENIESIONY (typy/reguła → DTO/katalog) | 419 → 422 | +10/−8 | import `:27` → `UnitDefDto` + lokalny `GameData { counters }`; `:31` `categoryOf` → `unitCategoryFromCatalog(Jednostka, true)` (`:254-259`, ścieżka zapasowa `_legacyBuildUnitInfoCard`) | 159 / 0 (+2/2) |
| 58 | `wikiHubHud.ts` | BEZP. | PRZENIESIONY (dane → katalog) | 644 → 646 | +3/−1 | import `:5` `wikiBundle.json` → `staticCatalog().wiki` (`:74-75`) | 390 / 0 |
| 59 | `unitPanelHud.ts` | PRZECH. | PRZENIESIONY (zgodność z API P5.3) | 183 → 187 | +4/−0 | `UnitPanelState.badges: UnitCardBadgesDto` (wymóg `unitCardStatus.ts` od P5.3) przekazywane do `UnitCardStatusInput` (`:125`) | 27 / 0 |
| 60 | `contextPanelHud.ts` | PRZECH. | KOPIA BAJTOWA | 63 | 0 | — | 3 / 0 |
| 61 | `diplomacyProposalBanner.ts` | PRZECH. | KOPIA BAJTOWA | 55 | 0 | — | 4 / 0 |
| 62 | `hudChip6c.ts` | PRZECH. | KOPIA BAJTOWA | 76 | 0 | — | 46 / 0 |
| 63 | `mapToolbarHud.ts` | PRZECH. | KOPIA BAJTOWA | 172 | 0 | — | 27 / 0 |
| 64 | `armyMergePickPanel.ts` | PRZECH. | KOPIA BAJTOWA | 183 | 0 | — | 20 / 0 |
| 65 | `armySplitPanel.ts` | PRZECH. | KOPIA BAJTOWA | 185 | 0 | — | 23 / 0 |
| 66 | `diplomacyPendingHud.ts` | PRZECH. | KOPIA BAJTOWA | 87 | 0 | — | 21 / 0 |
| 67 | `interHumanDiplomacyHud.ts` | PRZECH. | KOPIA BAJTOWA | 263 | 0 | — | 67 / 0 |
| 68 | `unitReplacePicker.ts` | PRZECH. | PRZENIESIONY (reguła bez importu → DTO) | 207 → 212 | +6/−1 | nowe wymagane `UnitReplaceOption.affordable`; `:155` `opts.skarb >= o.surcharge` → `o.affordable` | 24 / 0 |
| 71 | `armyStackHud.ts` | BEZP. | PRZENIESIONY (typ → DTO, zgodność z API P5.3) | 380 → 383 | +4/−1 | import `:16` `UnitCardCombatDisplay` → `UnitCardCombatDisplayDto`; `ArmyStackHudState.badges: UnitCardBadgesDto` przekazywane do `UnitCardStatusInput` (`:288-302`) | 237 / 0 |
| 72 | `diploListHud.ts` | BEZP. | PRZENIESIONY (format → DTO) | 502 → 495 | +4/−11 | import `:5` → `DiploCivListLinesDto`; `diploListEntryFromRelation`: `formatDiploCivListLines({…})` (`:481-490`) → `rel.lines` (wymagane) | 80 / 0 |
| 74 | `unitActionBarHtml.ts` | PRZECH. | KOPIA BAJTOWA | 169 | 0 | — | 7 / 0 |

Poza wymienionymi zakresami pliki są bajtowo identyczne z pinem (markup, CSS, teksty, komentarze nagłówkowe) — `diffs/*.diff`. Kopie bajtowe: 17 plików `.ts` + `assets/hero/hero-menu.png` dopisane do `tools/pin-manifest.json` (431 wpisów); niezależnie SHA-1 blobów `git ls-tree edb8fb56` = `git hash-object` kopii: 18/18 (`13-blob-sha1-kopie.log`).

## 3. Mapowanie import → DTO / kontroler

| Moduł | Import na pinie | Użycie | Zastąpienie w v2 | P5-0 |
|---|---|---|---|---|
| `buildModeHud.ts` | `:7` `type ImprovementKey` (`render/improvements`) | typ klucza ulepszenia | alias `string` (klucz `terrain-improvements.json`) — jak P5.4 `techDiscoveryNotice.ts` | — (typ) |
| | `:17` `type UlepszeniaFocus/Tryb/PracaPercent/EmpirePolicy` (`game/cities`) | typy konfiguracji | `UlepszeniaFocusDto`, `UlepszeniaTrybDto`, `UlepszeniaPracaPercentDto`, `UlepszeniaEmpirePolicyDto`; `EmpireDetailDto.improvementPolicy` | §6.5 `improvement_policy` |
| | `:22-25` `MAX_PROCENT_PULI_IMPERIUM`, `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT` | `:589-593,659-662` (zakres suwaka, tooltip) | `staticCatalog().constants.{maxProcentPuliImperium, maxUlepszeniaPracaAutoPercent}` | §6.1 `max_procent_puli_imperium`, `max_ulepszenia_praca_auto_percent` |
| `diplomacyPanel.ts` | `:10` `formatEntityDisplayName` (`game/display-names`) | `:203` wiersz atrapy podglądu (`PLACEHOLDER_RELATIONS`) | literał `'Sparta · miasto-państwo'` (= wynik pinu); w danych z silnika `DiploRelation.civ` = `display_name` z Rust | §3.2 „`display_name` w DTO bytu” — ZAŁOŻENIE P5.5-Z2 |
| `techTreeView.ts` | `:18` `tech.json` | `:156` | `staticCatalog().tech` | §6.1 |
| | `:21` `terrainUnlockLabelsForTech` (`game/improvement-tech`) | `:167` | `StaticCatalogDto.techTerrainUnlockLabels[nazwa]` | ROZSZ. Z4-4 (P5.4) |
| | `:22` `TEMPO_GRY`, `type TempoGry` (`game/tech-tempo`) | `:699` (mnożnik w karcie), typ stanu | `staticCatalog().constants.tempoGry` (konkretny `Record<string, number>`), `TempoGry` = alias `string` | §6.1 `tempo_gry` |
| | `:23` `scaledResearchCost`, `type GameDifficulty` (`game/difficulty-cost`) | `:268` (← karta `:698`) | `ResearchViewDto.techs[].effectiveCost` (hak `getResearchView`), tempo `ResearchViewDto.tempo` | §6.9 `effective_cost`, `tempo` |
| `unitInfoCard.ts` | `:27` `type GameData, UnitDef` (`data/loader`) | typy API | `UnitDefDto`; lokalny `GameData { counters }` (jedyne pole czytane, `:217-228`) | §6.1 |
| | `:31` `categoryOf` (`units/setup`) | `:254-259` (ścieżka zapasowa) | `unitCategoryFromCatalog(Jednostka, true)` = `StaticCatalogDto.unitCategory` | §6.1 `unit_category` |
| `wikiHubHud.ts` | `:5` `src/data/wikiBundle.json` | `:74-75` | `staticCatalog().wiki` (`{ poradnik, encyklopedia }`) | §6.1 `wiki` (Z2) |
| `armyStackHud.ts` | `:16` `type UnitCardCombatDisplay` (`game/unit-card-stats`) | `ArmyStackHudState.combat` | `UnitCardCombatDisplayDto` (już w `types.ts`, P5.3) | §6.8 `combat` |
| `diploListHud.ts` | `:5` `formatDiploCivListLines` (`game/diplomacy-display`) | `:481-490` | `rel.lines: DiploCivListLinesDto` | §6.6 `DiploListDto` (gotowe linie) |

Moduły bez importów logiki, ale z wymuszoną zmianą: `unitPanelHud.ts`/`armyStackHud.ts` — `unitCardStatus.ts` od P5.3 wymaga `badges` (P5-0 §6.8 `badges`); `unitReplacePicker.ts` — reguła wpisana bez importu (§4.1).

### 3a. Rejestr rozszerzeń kontraktu P5-0 §6 (P5.5)

Metoda jak P5.2–P5.4 §3a: każde nowe pole sprawdzone tekstowo w `P5-0-VIEWMODEL-CATALOG.md` §6. P5.5 NIE zmienia P5-0; rozszerzenia do wchłonięcia przy rewizji P5-0.

| Pole / typ (v2) | Sekcja P5-0 | Co P5-0 ma | Status | ZAŁOŻENIE |
|---|---|---|---|---|
| `DiploCivListLinesDto { metaLine, detailLine, perspectiveLine }` | §6.6 `DiploListDto` | „gotowe linie tekstu (`formatDiploCivListLines`)”; szkielet P5.1 `DiploListDto { lines: string[] }` | ROZSZ. (dookreślenie kształtu = wynik web, trzy nazwane linie; `DiploListDto` z P5.1 zostawiony bez zmian) | Z5-1 |
| `BuildTypeInfo.affordable` | §6.5 / brak | brak (reguła wpisana bez importu, `buildModeHud.ts:689`) | ROZSZ. (analogicznie do `affordable` P5.3 w `unitRecruitCard.ts`) | Z5-4 |
| `UnitReplaceOption.affordable` | §6.8 / brak | brak (reguła wpisana bez importu, `unitReplacePicker.ts:155`) | ROZSZ. | Z5-4 |
| `UlepszeniaEmpirePolicyDto` (+ `Focus`, `Tryb`, `PracaPercent`) | §6.5 `improvement_policy` | `UlepszeniaEmpirePolicyDto` bez pól | W KONTRAKCIE (dookreślenie = web `UlepszeniaEmpirePolicy`, `game/cities.ts:303-310`) | — |
| `constants.tempoGry: Record<string, number>` | §6.1 `tempo_gry` | jest (bez typu; v2 do P5.4: `NieZmierzonoDto`) | W KONTRAKCIE (dookreślenie = web `TEMPO_GRY`) | — |
| `constants.maxProcentPuliImperium`, `maxUlepszeniaPracaAutoPercent` | §6.1 | są | W KONTRAKCIE | — |
| `ResearchViewDto.{techs[].effectiveCost, tempo}` (drzewko) | §6.9 | są | W KONTRAKCIE (konsument `techTreeView.ts` wymieniony w §6.9) | Z5-3 |
| `StaticCatalogDto.wiki` | §6.1 `wiki` | „zawartość JSON 1:1” | W KONTRAKCIE (atrapa MOCK: kształt `{ poradnik: [], encyklopedia: [] }`) | Z5-6 |
| `UnitPanelState.badges`, `ArmyStackHudState.badges` | §6.8 `badges` | jest | W KONTRAKCIE | — |

## 4. Reguły gry → pola DTO (przegląd ręczny 26 modułów, P5-0 §9 pkt 3)

Metoda: przegląd każdego pliku (porównania z liczbami/polami, `Math.*`, `filter`/`sort`, wartości domyślne) — m.in. `grep -nE "(>=|<=| > | < )"` po 23 plikach bez importów logiki + odczyt kontekstu.

### 4.1 Reguły usunięte z UI (liczy Rust)

| Moduł | Reguła na pinie | Pole DTO / katalogu w v2 | Uwagi |
|---|---|---|---|
| `buildModeHud.ts` | **wpisana bez importu:** „za mało Pracy” `t.kosztPraca > pracaPool` (`:689`, sort dostępne-nad-zablokowanymi `:692`, klik zablokowany) | `BuildTypeInfo.affordable` | Z5-4; tekst „masz N P” nadal z `getPracaPool` (prezentacja) |
| | stałe zakresu suwaka automatu ulepszeń (`:589-593,659-662`) | `constants.maxUlepszeniaPracaAutoPercent`, `maxProcentPuliImperium` | §6.1 |
| `unitReplacePicker.ts` | **wpisana bez importu:** stać na dopłatę `opts.skarb >= o.surcharge` (`:155`) | `UnitReplaceOption.affordable` | Z5-4; tytuł „Za mało Pieniądza (skarb/dopłata)” z pól DTO |
| `techTreeView.ts` | koszt badania `scaledResearchCost` (tempo, trudność, właściciel, epoka; `:268`) | `ResearchViewDto.techs[].effectiveCost` | §6.9 |
| | mnożnik tempa `TEMPO_GRY[tempo]` (`:699`) | `constants.tempoGry` | §6.1 |
| | etykiety ulepszeń odblokowanych przez tech (bramka tech ulepszeń, `:167-170`) | `techTerrainUnlockLabels` | Z4-4 (P5.4); na danych pinu 3 technologie różnią się od pola `tech.json` (Brązownictwo, Jeździectwo, Hutnictwo żelaza — `05-…log`, wiersz `techTreeView:`) |
| `unitInfoCard.ts` | kategoria jednostki `categoryOf` (`:254-259`) | `StaticCatalogDto.unitCategory` | jak P5.2-Z2/P5.4-Z7 |
| `diploListHud.ts` | linie karty (`formatDiploCivListLines`: `Math.floor` ludności, `Math.round` respektu/zaufania, kolejność sekcji; `:481-490`) | `DiploCivListLinesDto` | klasa F (tekst z silnika) |
| `diplomacyPanel.ts` | dopisek miasta-państwa `formatEntityDisplayName` (`:203`) | literał atrapy; dane: `display_name` z Rust | Z5-2 |
| `unitPanelHud.ts`, `armyStackHud.ts` | odznaki ścieżek/gwiazdki (pin: liczone w `unitCardStatus.ts:145-147`) | `UnitCardDto.badges` | P5.3 Z3 |

### 4.2 Pozostawione w UI — klasyfikacja GRANICZNY / prezentacja

| Moduł | Miejsce (v2 = pin) | Dlaczego zostało |
|---|---|---|
| `diplomacyPanel.ts` | `panelRelTotal` `round(clamp(zaufanie + respekt, 0, 200))` (`:214-215`) | GRANICZNY: suma dwóch pól DTO do zadeklarowanego zakresu (`types/diplomacy.ts:85` nazywa ją „polem pochodnym”); propozycja `DiploRelationDto.relacjaTotal` przy porcie C2 (`diplomacyAudience.ts:1485` czyta `st.relacjaTotal ?? suma`). Harness: mutacja L17 wykryta |
| | `tierLabel`/`tierBg`/`tierFg` (`:132-145`, clamp do 0–4) | mapa tier → etykieta/kolor (tier liczy silnik, komentarz `:44-51`) |
| `armySplitPanel.ts` | `units.length < 2` (`:96`), „co najmniej jedna zostaje” `stay < 1` (`:170`) | GRANICZNY: walidacja wyboru dokonanego w panelu (stan UI), komenda podziału waliduje silnik; harness L18 wykryta |
| `interHumanDiplomacyHud.ts` | domyślnie 15 tur paktu w formularzu (`:141`), `n > 0` (`:164`) | GRANICZNY: wartość wstępna pola formularza; propozycja: domyślna długość paktu w `StaticCatalogDto.constants` przy porcie dyplomacji. Harness L19 wykryta |
| `buildModeHud.ts` | ukrycie `pole_irygowane` z listy (`:488`), `costLabel` FREE (`:696`), sort stabilny (`:692`) | GRANICZNY/prezentacja: lista typów pochodzi z silnika (`listTypes`); filtr jednego klucza — propozycja: silnik nie zwraca tej pozycji |
| `gamePauseMenu.ts` | clamp suwaków głośności 0–100 i autozapisu 1–20 (`:144,216-248`) | ustawienia klienta (nie reguła gry) |
| `mainMenu.ts` | `volumeFromDesc`/`volumeToIndex` (`:80-97`) | mapowanie opisu wiersza ustawień (`ui-params.json`) na głośność — dane UI |
| `cityUnitPick.ts`, `unitForeignPick.ts`, `cityForeignPick.ts`, `unitPanelHud.ts`, `armyStackHud.ts` | `Math.round` HP/ruch/ludności, `hpPct` | formatowanie pól DTO |
| `mapToolbarHud.ts` | odznaki `wars > 0`, pierścień postępu | prezentacja liczników z silnika |
| `diploListHud.ts` | `compareDiploListEntries` (`:48-53`), `legibleCivTextColor` (`:72-88`), filtr „wojna” (`tier === 0`, `:213-214`) | porządek/kolor/filtr listy z polami DTO (klasa X); filtr wojny po tierze z silnika |
| `techTreeView.ts` | `statusOf` (`:260-265`), `lockReasons` (`:272-288`: brakujące prereq po zbiorze zbadanych z silnika, bramki z haków), układ siatki `MOCK_ROWS`/`COL_X`, `starLabel` | prezentacja zbiorów z silnika i danych katalogu (jak P5.4 §4.2 dla `sciencePicker.ts`) |
| `unitActionBarHtml.ts` | `COMPACT_ACTION_ORDER` (`:68`) | kolejność ikon (prezentacja) |

Bez reguł (po przeglądzie): `leaderBannersHud.ts`, `cityCaptureNotice.ts`, `hotSeatHandoff.ts`, `contextPanelHud.ts`, `diplomacyProposalBanner.ts`, `hudChip6c.ts`, `armyMergePickPanel.ts`, `diplomacyPendingHud.ts`, `wikiHubHud.ts` (wyszukiwanie haseł po slugach = klucz danych, `slug.ts` GRANICZNY z P5.1).

## 5. Zdarzenia wejścia (P4-5B)

Panele słuchają kliknięć/klawiszy na własnych węzłach; modale (`cityForeignPick`, `cityUnitPick`, `unitForeignPick`, `unitReplacePicker`, `hotSeatHandoff`, `armyMergePickPanel`, `armySplitPanel`, `interHumanDiplomacyHud`, `gamePauseMenu`, `techTreeView`, `unitInfoCard`) — Escape przez stos `escapeOverlayStack.ts` (P5.1), klawisze `1`/`2` przez słuchacz `document` dodawany przy otwarciu i zdejmowany przy zamknięciu — zgodne z P4-5B §3.2 Z3 (fokus klawiatury w webview). `buildModeHud.ts:396-410` i `bindHudPanelOutsideDismiss` (`wikiHubHud`, `diploListHud`) zamykają panel `pointerdown` poza panelem — przy UI-Q3=B (natywna powierzchnia Rust zbiera mysz mapy, `LEDGER.md:134`) klik w mapę nie dotrze do `document` webview: wiązanie z `UiState`/`MapClick` (P4-5B §4.3) poza tą rundą, `NIE_ZMIERZONO`.

## 6. Harness porównania DOM (`tools/dom-harness/run-level2.mjs`)

**Metoda** = P5.2–P5.4 (`build.mjs`, jedna zmiana: emulacja `?url` → `data:` URI, żeby `mainMenu.ts:20` porównywał BAJTY obrazu; regresja P5.2–P5.4 po tej zmianie zielona): oba drzewa pakowane `esbuild`, wspólny jsdom, zamrożony `Date`, kanoniczna serializacja `document.documentElement` albo JSON/HTML wartości, log akcji (callbacki) dopisany do DOM, `stash` per moduł (moduły trzymające węzły między wywołaniami: `mainMenu`, `diplomacyPanel`, `techTreeView`), `cleanup` per strona. **Nowe w P5.5:** (a) **eksploracja generyczna** — po otwarciu panelu osobny przypadek na KAŻDY element klikalny (`CLICK_SEL`; liczba = strona pinu), na KAŻDE pole formularza (`INPUT_SEL`: wartość + `input`/`change`) i na zadane klawisze; (b) `--only <moduły>` (dla mutacji); (c) atrapy jsdom wspólne dla obu stron: `HTMLMediaElement.play/pause/load`, `window.close` (= „przeglądarka odmówiła”, `mainMenu.ts:447-454`), `scrollTo`.

**„Rust” w harnessie** (z danych/funkcji pinu): `StaticCatalogDto` = `gra/data/*.json` + `src/data/wikiBundle.json` + `categoryOf` + `terrainUnlockLabelsForTech` + `RESEARCH_QUEUE_MAX`, `MAX_PROCENT_PULI_IMPERIUM`, `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`, `TEMPO_GRY`; `badges` = `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount`; `DiploCivListLinesDto` = `formatDiploCivListLines` z `tierLabel` pinu; `ResearchViewDto` (drzewko) = `scaledResearchCost` z tempem/trudnością, które pin dostaje hakami (przy braku haków `standardowa`/`normal`, jak pin `:254-255`); `affordable` = formuły pinu (`buildModeHud.ts:689`, `unitReplacePicker.ts:155`). Strona pinu dostaje te same fikstury (dodatkowe pola DTO pin ignoruje).

**Wyniki** (`05-dom-harness-level2.log`, EXIT=0): `modułów=26 przypadków=1784 różnic=0`.

| Moduł | Przyp. | Pokrycie |
|---|---:|---|
| `leaderBannersHud.ts` | 2 | utworzenie, `destroy` |
| `cityCaptureNotice.ts` | 36 | 5 wariantów `showCityCaptureNotice` (bez opcji, callbacki, eliminacja, raport z wierszami zwijanymi, pusty) + 3 `showCaptureReportNotice` × klik każdego elementu × Escape/Enter |
| `cityForeignPick.ts`, `cityUnitPick.ts`, `unitForeignPick.ts` | 27 / 36 / 27 | 3–4 warianty (ludność, HP, ruch, stos 1/2/3, dyplomacja niedostępna, bez `onCancel`) × klik × klawisze `1`, `2`, `3`, Escape, Enter |
| `gamePauseMenu.ts` | 57 | 3 konfiguracje (minimalna, pełna, skrajne wartości) × klik × każdy suwak/pole × Escape; `toggle` |
| `hotSeatHandoff.ts` | 15 | 3 warianty × klik × Enter/spacja/Escape |
| `mainMenu.ts` | 66 | `getMenuSettings`/`getMenuAudioVolumes`/`syncMenuAudioVolumes` (4 zestawy); 3 konfiguracje × klik każdego przycisku (w tym „Wyjdź” → ekran pożegnalny po 120 ms) × Escape/Enter. Asercja: obraz tła = bajty pinu |
| `buildModeHud.ts` | 138 | 7 scenariuszy (zamknięty, podstawowy, pula 40,7 z cudami i automatyzacją, override miasta, bez override, „Załóż miasto”, tylko miasto) × klik × każde pole × Escape + najechanie na każdą pozycję (dymek blokady). Asercja: stałe zakresu = pin |
| `diplomacyPanel.ts` | 35 | `tierLabel/Bg/Fg` (13 wartości); panel: placeholder (bez haka — zmieniony literał), pusty, 5 relacji (miasto-państwo, bez `ownerId`, wiarygodność ±, suma > 200), bez audiencji × klik × Escape; podsumowanie pary (null, pełne, puste listy) × klik |
| `techTreeView.ts` | 210 | 5 scenariuszy (bez haków, start, cel z planem i bramkami, brąz, wszystko zbadane) × właściciel 0/1: drzewko + karta węzła (w „cel” każdy z 32 węzłów) + eksploracja klików (węzły, ikona info, zoom, epoki; do 25/90 elementów) × Escape. Asercje: nakładka 10/10, karta wypełniona ≥ 32 razy, brak `scaledResearchCost(` w v2 |
| `unitInfoCard.ts` | 159 | 75 kart (ścieżka entityCards, 3 warianty opcji) + 75 kart ścieżki zapasowej (wymuszony wyjątek pola czytanego tylko przez adapter — jedyne użycie `categoryOf`) + 6 dialogów (tło, ✕, `dismiss`) + CSS. Asercje: entityCards 75/75, ścieżka zapasowa 75/75 |
| `wikiHubHud.ts` | 390 | `hasWikiEncyEntry` dla każdego slugu/tytułu/`gameIds` haseł + nieznane; hub ×3 (domyślny, encyklopedia overlay, rozdział poradnika) × klik (do 60) × Escape; `openEncyEntry` co 7. hasło; `toggle` |
| `unitPanelHud.ts` | 27 | brak jednostki + 5 wariantów statusów (ścieżki, weteran, garnizon, czuwanie, oblężenie, głód, deficyt Złota, `hpMax=0`) × klik |
| `contextPanelHud.ts` | 3 | bez konfiguracji, sekwencja komunikatów (null/spacje/HTML/pusty), `update` |
| `diplomacyProposalBanner.ts` | 4 | przyjęto/odrzucono/pusty powód, podmiana + `hide` |
| `hudChip6c.ts` | 46 | 15 ikon × 3 warianty opcji (stawka, ostrzeżenie, akcja, pierścień nauki, `medVariant`, `iconAssetId`) + separator |
| `mapToolbarHud.ts` | 27 | 4 konfiguracje (pusta, aktywna z odznakami, wyłączona, hot-seat bez odznaki) × klik; stałe `TOOLBAR_*` |
| `armyMergePickPanel.ts`, `armySplitPanel.ts` | 20 / 23 | 3–4 warianty (cele, puste, 1 jednostka = brak panelu) × klik × klawisze; split: sekwencja zaznacz-wszystko + „Rozdziel” (n = 2, 4) |
| `diplomacyPendingHud.ts` | 21 | 4 warianty `hasNext`/`onNext` × klik × Escape/Enter |
| `interHumanDiplomacyHud.ts` | 67 | 0/5/2 propozycje (4 rodzaje, pakt bez tur) × klik × pole × Escape + sekwencja formularza (każdy rodzaj w `select`, wypełnienie, wysłanie) |
| `unitReplacePicker.ts` | 24 | 3 warianty (skarb 50/500/0, bez opcji) × klik × klawisze |
| `armyStackHud.ts` | 237 | brak stosu + 5 stosów × 3 konfiguracje (minimalna, scal/rozdziel/cykl dostępne, zablokowane) × klik × Tab/strzałki |
| `diploListHud.ts` | 80 | `diploListEntryFromRelation` (6 relacji), `compareDiploListEntries` (5×5), lista × 3 podsumowania × filtr `all`/`war` × klik × Escape; `toggle/hide` |
| `unitActionBarHtml.ts` | 7 | CSS + 6 zestawów akcji (14 id, w tym spoza listy) |

**Czułość** (`06-harness-mutations-level2.log`): 34 mutacje — L1–L16 każdy nowy odczyt pola DTO/katalogu (placeholder, `lines`, `badges` ×2, `affordable` ×2, stałe ×2, `tech`, `techTerrainUnlockLabels`, `tempoGry`, `effectiveCost`, `tempo`, `unitCategory`, `wiki` ×2), L17–L19 reguły GRANICZNE pozostawione w UI, L20–L34 kopie bajtowe (tekst/markup/kolejność, po jednej na moduł) → **34/34 wykrytych**, pliki przywrócone bajtowo.

**Uwagi do liczników:** `DOM_puste` = przypadki, w których po akcji panel zamknął się (np. klik „Anuluj”, Escape) — oczekiwane. `consoleErrors=150` = komunikat pinu i v2 `[unitInfoCard] błąd ścieżki entityCards, fallback…` wywołany CELOWO (75 kart ścieżki zapasowej × 2 strony). `jsdomErrors=354` = „Could not parse CSS stylesheet” przy `mainMenu.ts` po obu stronach (`@mainMenu.ts/pin`, `@mainMenu.ts/v2`; arkusz bajtowo identyczny — kopia) — ograniczenie parsera CSS jsdom, nie wpływa na porównanie DOM.

**NIE_ZMIERZONO (harness):** (1) realny WebView/Tauri; (2) miniatura jednostki po rAF (D-UI-3); (3) zamknięcie kliknięciem poza panelem (`pointerdown`/`bindHudPanelOutsideDismiss`) — wspólny `document` obu stron; (4) układ (pozycje dymków/kart, `offsetWidth` = 0 w jsdom), zoom kółkiem i przeciąganie drzewka; (5) auto-ukrycie banera po 4500 ms; (6) eksploracja klików drzewka ograniczona (25 z 71–111 elementów; scenariusz „cel” 90 z 111) — limit czasu przypadków; (7) singletony `showDiploListHud`/`toggleWikiHubHud` itp. (moduł ustawia `api` tylko wewnętrznie — porównane `create*` wprost); (8) zbieżność wzorów „Rust” z przyszłym silnikiem — harness odtwarza funkcje pinu.

## 7. Uruchomienie bram (odtworzenie)

```bash
cd src-tauri/frontend-v2
npm ci && npx tsc --noEmit && npm run check && npx vite build
git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
node tools/dom-harness/run-level2.mjs --pin-dir <PIN_DIR>         # EXIT 0 ⇔ 0 różnic
node tools/dom-harness/mutate-level2.mjs --pin-dir <PIN_DIR>      # EXIT 0 ⇔ każda mutacja wykryta
node tools/dom-harness/run.mjs --pin-dir <PIN_DIR>                # regresja P5.2
node tools/dom-harness/run-level1a.mjs --pin-dir <PIN_DIR>        # regresja P5.3
node tools/dom-harness/run-c4.mjs --pin-dir <PIN_DIR>             # regresja P5.4
rm -rf node_modules dist
```

## 8. ZAŁOŻENIA

- **P5.5-Z0 (zakres):** §1 — „każda zależność UI w `frontend-v2`” liczona z domknięciem w obrębie paczki (dispatch wymienia `armyStackHud.ts` i `unitActionBarHtml.ts`, które zależą od `unitPanelHud.ts` z tej paczki); cykle C1–C3 i moduły zależne od wyłączonych (`preBattle.ts` ← `hud.ts`) — poza zakresem.
- **P5.5-Z1 (montaż):** `portLevel2.ts` tylko zbiera moduły dla `vite build`; żaden panel nie jest wpięty do ekranu (jak P5.3-Z1/P5.4-Z1). Import po `installStaticCatalog` (P5.2-Z1: `buildModeHud.ts`, `techTreeView.ts`, `wikiHubHud.ts` czytają katalog przy ewaluacji; `wikiHubHud.ts` rejestruje też otwieracz Civpedii, `:265`).
- **P5.5-Z2 (placeholder `diplomacyPanel.ts`):** wiersz `PLACEHOLDER_RELATIONS` (podgląd bez haka `getRelations`, `:202-208`, użycie `:268`) to atrapa danych; wynik `formatEntityDisplayName` wpisany literałem (= pin). Dla danych z silnika `DiploRelation.civ` przychodzi jako `display_name` z Rust (P5-0 §3.2); UI niczego nie formatuje.
- **P5.5-Z3 (brak `getResearchView` w drzewku):** koszt = `Koszt nauki` z katalogu, tempo `standardowa` (pin bez haków liczył koszt z domyślnym tempem/trudnością) — v2 nie odtwarza reguły w UI (P5.13), w grze hak zawsze podaje Rust (jak P5.4-Z3). Harness w scenariuszu „bez haków” podaje DTO po stronie v2 (różnica nie jest mierzona).
- **P5.5-Z4 (`affordable`):** „stać na ulepszenie” (`buildModeHud.ts:689`) i „stać na dopłatę” (`unitReplacePicker.ts:155`) to reguły wpisane bez importu — wynik z Rust jako wymagane pole wiersza (wzorzec P5.3 `unitRecruitCard.ts`). Kwoty w tekstach („masz N P”, „skarb/dopłata”) zostają z istniejących pól.
- **P5.5-Z5 (`badges` w panelach jednostek):** `unitPanelHud.ts`/`armyStackHud.ts` pinu nie podają `veteranProgress` do `UnitCardStatusInput`, więc pin liczy gwiazdki z `null` (0); w harnessie `badges` = funkcje pinu na tych samych polach. Rust wysyła `UnitCardDto.badges` aktywnej jednostki.
- **P5.5-Z6 (atrapa MOCK katalogu):** `wiki: { poradnik: [], encyklopedia: [] }` (kształt `wikiBundle.json`, czytany przy ewaluacji), `constants.tempoGry: { 'MOCK-tempo': 1 }` (typ konkretny zamiast `NieZmierzonoDto`).
- **P5.5-Z7 (`?url` w harnessie):** `build.mjs` rozwija `import x from './plik.png?url'` do `data:` URI po obu stronach (jak obrazy `import.meta.glob`); `vite build` obsługuje `?url` natywnie (`04-vite-build.log`).

## 9. Allowlista, Git, sprzątanie

- Zmienione/nowe ścieżki wyłącznie w `src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` bez zmian — brak nowych zależności), `dyspozycje/rust-port/p5/P5-5-PORT-POZIOM2.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-5-PORT-POZIOM2-Q1/**` (`14-allowlist-git-status.log`). Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
- Pliki w `frontend-v2` (poza 26 modułami): `src/ui/portLevel2.ts` (NOWY), `src/ui/assets/hero/hero-menu.png` (NOWY, kopia), `src/main.ts` (import `portLevel2`), `src/viewmodel/types.ts` (§3a), `src/controller/mockCatalog.ts` (Z6), `tools/pin-manifest.json` (+18), `tools/dom-harness/build.mjs` (`?url`), `tools/dom-harness/run-level2.mjs`, `mutate-level2.mjs` (NOWE), `package.json` (skrypty `harness:l2`, `harness:l2:mutate`), `PORTING-QUEUE.md` (status P5.5).
- `node_modules`, `dist` usunięte (`15-cleanup.log`). Commit w worktree jawnym `git add <ścieżki>` (logi `git add -f`), bez push. `.gitattributes` w katalogu runu: `r1-logi/diffs/*.diff -whitespace` (precedens P5.2–P5.4).
- **Obrona r1 (po FAIL Evaluatora):** przebieg mutacji Operatora r1 przerwano po L11/L12 i zostawiono `techTreeView.ts:261` zmutowany (`tempo: 'standardowa',`). Przywrócono `tempo: view?.tempo ?? 'standardowa',` (zgodnie z `r1-logi/diffs/techTreeView.ts.diff:76`). Na stanie przywróconym ponownie wykonano bramy i harness i nadpisano logi `01–09`. Logi `13–15` powstały w obronie. Raport: `03-operator-obrona-r1.md`.

## 10. NIE_ZMIERZONO (zbiorczo)

1. Realny WebView/okno Tauri (nic nie uruchamiano; `tauri.conf.json` bez zmian).
2. Komendy/zapytania Rust dostarczające nowe pola (`DiploCivListLinesDto`, `affordable` ×2, `ResearchViewDto` dla drzewka, `UlepszeniaEmpirePolicyDto`, `badges`) — dziś tylko harness i atrapa MOCK.
3. Zamknięcie paneli kliknięciem poza nimi przy UI-Q3=B (mysz mapy w natywnej powierzchni Rust) — §5.
4. Pozycje z §6 „NIE_ZMIERZONO (harness)”.
