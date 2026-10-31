# REPIN-DELTA-3 — pomiar delty `dc8a3adc` → `4bbef081d`

**Temat:** R-RUSTPORT-REPIN-DELTA-3-Q1 · **Typ:** dokumentacja/pomiar, ZERO zmian kodu · **Data:** 2026-10-31
**Pin stary:** `dc8a3adc` (`docs(autobot): close manual battle validation`) · **Pin nowy:** `4bbef081d` (`docs(wersje): ROBOCZA d205f607`, `origin/main`)
**Komendy pomiaru (z worktree `wf_8c6276dd-898-1`):**
- `git diff --name-only dc8a3adc 4bbef081d -- gra/src gra/data` → 47 plików (`+4859 / -839`)
- `git diff -U0 dc8a3adc 4bbef081d -- gra/src gra/data` → 541 hunków (surowy diff: 6432 linii)
- klasyfikacja i właściciel hunków: skrypty pomocnicze w scratchpad (heurystyka, patrz §5)

## 1. Przypisanie plików: moduł Rust / frontend / temat

Legenda kolumny „Rust": moduł z `rust-port/engine/src/domain/*` (jeśli istnieje odpowiednik), inaczej `brak` (kod frontendu `gra/`, poza zakresem portu w tym pomiarze).

| Plik | Hunków | Klasyfikacja (heur.) | Rust (`domain/*`) | Tematy (tag w hunkach) |
|---|---|---|---|---|
| gra/src/main.ts | 169 | 143 behawioralnych, 18 import/typ, 7 komentarz, 1 pusty | brak (frontend) | wojna/pokój/rozejm, era-war, forty, auto-fort, zapis/hot-seat, karmienie epoki, testowe haki |
| gra/src/game/auto-improvements.ts | 50 | 41 behawioralnych, 3 import/typ, 6 komentarz | brak (automat frontendu); kandydat `improvements.rs` tylko dla katalogu | R-WEB-AUTOIMPROVE-STAGES/-STAGES2/-STAGES3/-PRIORITY, R-WEB-CITY-CLEARS-FOREST |
| gra/src/ui/newGameFlow.ts | 46 | UI (kolejność kroków, pozycje siatki) | brak | brak tagu R- w większości hunków (patrz §5) |
| gra/src/game/ai.ts | 33 | behawioralna (AI pokój/wojna, niedobory, progi) | brak | R-WEB-PEACE-RULES-Q1, R-WEB-PEACE-CITY-CESSION-Q1, R-WEB-WAR-AGGRESSOR-FLAG-Q1, R-WEB-AUTOIMPROVE-STAGES |
| gra/src/game/citizen-resource-upkeep.ts | 26 | behawioralna (stawka per epoka) | `resource_production.rs` (kandydat: zużycie surowców) | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 |
| gra/src/ui/diplomacyTradeBasket.ts | 25 | UI koszyka dyplomacji | brak | R-WEB-TRUCE-Q1, R-WEB-PEACE-CITY-CESSION-Q1 (częściowo) |
| gra/src/game/diplomacy-proposals.ts | 22 | behawioralna (propozycje) | brak | R-WEB-PEACE-RULES-Q1, R-WEB-PEACE-CITY-CESSION-Q1 |
| gra/src/game/turn-economy.ts | 15 | behawioralna (Spichlerz drain) | `resource_production.rs` / `building_costs.rs` (kandydat) | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 |
| gra/data/terrain-improvements.json | 15 | dane (zasięg fortu/posterunku, surowce, opisy) | `improvements.rs` (katalog; kandydat) | R-WEB-AUTOIMPROVE-STAGES-Q1, R-WEB-OUTPOST-FORT-TERRITORY-Q1, R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 |
| gra/src/render/unitOwnerEmblem.ts | 14 | render (emblemat właściciela) | brak | brak tagu R- (NIEPRZYPISANY, patrz §5) |
| gra/src/game/forced-war-common.ts | 11 | behawioralna (wojna wymuszona) | brak | R-WOJNA-WYMUSZONA-REGULY-Q1, R-WEB-ERA-WAR-COUNTER-Q1 |
| gra/src/game/building-resource-gate.ts | 10 | behawioralna (bramka Spichlerza) | `building_costs.rs` (kandydat) | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1, R-WEB-SPICHLERZ-HUD-PARAMS-Q1 |
| gra/src/map/territory.ts | 9 | behawioralna (promień fortu 10→5, węzły) | brak (brak `territory` w `domain/`) | R-WEB-OUTPOST-FORT-TERRITORY-Q1 |
| gra/src/game/diplomacy.ts | 8 | behawioralna | brak | R-WEB-TRUCE-Q1, R-WEB-PEACE-RULES-Q1 |
| gra/src/game/victory.ts | 6 | behawioralna (przegrana po utracie ostatniego miasta) | brak (kandydat `state.rs`/`session.rs`) | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 |
| gra/src/game/diplomacy-value-catalog.ts | 6 | dane/katalog wartości | brak | R-WEB-PEACE-RULES-Q1 |
| gra/src/game/diplomacy-pn-engine.ts | 6 | behawioralna | brak | R-WEB-PEACE-RULES-Q1 |
| gra/src/ui/hexContextTooltip.ts | 5 | UI (tooltip) | brak | brak tagu R- (NIEPRZYPISANY) |
| gra/src/game/fort-territory.ts | 5 | behawioralna (zdobycie fortu, rejestr) | brak | R-WEB-OUTPOST-FORT-TERRITORY-Q1, R3 Q-A=A |
| gra/src/ui/empireDetailPanel.ts | 4 | UI | brak | brak tagu R- |
| gra/src/game/war-rules-multiwar.ts | 4 | behawioralna | brak | R-WEB-WAR-RULES-MULTIWAR-Q1 |
| gra/src/game/forced-war-bronze.ts / -iron.ts / -stone.ts | 4 / 3 / 3 | behawioralna | brak | R-WEB-ERA-WAR-COUNTER-Q1, R-EPOKA-*-WYMUSZONA-WOJNA |
| gra/src/ui/diplomacyPanel.ts / diplomacyNegotiationModal.ts | 3 / 3 | UI | brak | R-WEB-TRUCE-Q1 |
| gra/src/ui/cityPanel.ts | 3 | UI (parametry Spichlerza HUD) | brak | R-WEB-SPICHLERZ-HUD-PARAMS-Q1 |
| gra/src/map/improvement-build.ts | 3 | behawioralna (blokady budowy) | `improvements.rs` (kandydat) | ABC-2 (2026-10-31), R-WEB-AUTOIMPROVE-* |
| gra/src/game/city-hex-clear.ts | 3 | behawioralna (wycinka przy mieście) | brak | R-WEB-CITY-CLEARS-FOREST-Q1 |
| gra/data/econ-params.json | 3 | dane (Spichlerz I/II: Ceramika/Sól) | `building_costs.rs`/`resource_production.rs` (kandydat) | PYTANIE-84-B6/B7/B8 |
| gra/data/ai-params.json | 3 | dane (progi AI) | brak | R-WEB-PEACE-RULES-Q1 (R10) |
| gra/src/map/newGameMapDefaults.ts | 2 | dane (domyślne) | brak | R-WEB-NEWGAME-DEFAULTS-Q1 |
| gra/src/game/terrain-improvements.ts | 2 | behawioralna (produkcja tartaku/kamieniołomu 50) | `improvements.rs`/`resource_production.rs` (kandydat) | R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1 |
| gra/src/game/diplomacy-war-gates.ts | 2 | behawioralna (bramki) | brak | R-WEB-PEACE-RULES-R8R9-Q1 |
| gra/data/war-rules-params.json | 2 | dane | brak | R-WOJNA-WYMUSZONA-REGULY-Q1 |
| gra/data/citizen-resource-upkeep.json | 2 | dane (stawka per epoka 1/2/3) | `resource_production.rs` (kandydat) | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 |
| 1-hunkowe: empireDetailTypes.ts, diplomacy-war-peace-profile.ts, diplomacy-tick-war-brake.ts, diplomacy-peace-lock.ts, wikiBundle.json, battleScene.ts, ui-params.json, tech.json, diplomacy-war-peace-params.json, diplomacy-aggressor-params.json, diplomacy-acceptance-points.json | po 1 | mieszane (patrz appendix) | brak | R-WEB-PEACE-RULES-Q1, R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1, R-WEB-AGGRESSOR-*, R-WEB-WAR-AGGRESSOR-FLAG-Q1 |

Uwagi do tabeli: moduły Rust w `rust-port/engine/src/domain/` to: barbarians, building_costs, combat, error, hex, ids, improvements, map_generator, mod, player, recruitment, resource_production, rng, session, state, terrain, types, unit_epoch. Brak modułów dla dyplomacji, terytorium/fortów, wojny wymuszonej, AI i zapisu hot-seat — zmiany w tych obszarach nie mają odpowiednika w porcie i nie wymagają aktualizacji `domain/` do czasu decyzji o zakresie.

## 2. Behawioralne zmiany do przeniesienia (najważniejsze, z plik:linia)

Pełna lista 541 hunków (plik:linia, klasa, właściciel) — §6. Najważniejsze zmiany wartości i reguł:

- Promień fortu (terytorium): `gra/src/map/territory.ts:85,90` — FORT 10 → **5** (stały); posterunek r=3 (`territory.ts:5`). Dane: `gra/data/terrain-improvements.json:277` (fort `zasieg_pol` 5) i `:401` (Brąz `zasieg_pol` 3, było 5).
- Fort: `gra/src/game/fort-territory.ts:8,58,103,296` — ZASTĄPIONA reguła „fort = twarde terytorium” decyzją 2026-10-31; wejście wojska zdobywa fort; wywołania `sweepFortCaptures()` w `main.ts:13506,31278,34336,39274,39500,39964` (+ `:38933` wejście AI).
- Spichlerz: `gra/data/econ-params.json:388,395,402` — Spichlerz I zużywa Ceramikę, Spichlerz II Sól × liczba działających Spichlerzy, Spichlerz II Ceramikę; logika `building-resource-gate.ts:330-438`, `turn-economy.ts:1356-1583,2477-2499`.
- Stawka utrzymania obywateli per epoka: `gra/src/game/citizen-resource-upkeep.ts:24,41,81,83,156-173,240-409`; Kamień 1,0 / Brąz 2,0 / Żelazo 3,0 szt. na obywatela (dane `citizen-resource-upkeep.json:2,10`). Stawka 1,0 była stała do 2026-10-31.
- Wojna i pokój: `main.ts:10307-10491` (profil wojny, N dni do wypowiedzenia), `main.ts:10637-10881` (rozejm: `truceUntilTurn`, złamanie rozejmu), `main.ts:32278` (**usunięto** automatyczny koniec wojen wymuszonych — R-WEB-PEACE-RULES-R8R9-Q1 R9, −187 linii), `main.ts:36451` (brak limitu czasu wojny wymuszonej), `main.ts:36720` (blokada wojny epoki przy Relacji ≥ progu).
- Flaga agresora: `main.ts:1396-1411`, `:7350`, `:10461`, `:11721-11763`, `:18499-18652`, `:21535`, `:36526`, `:37886`; `ai.ts:5186,5846,6146`.
- Licznik wojen epoki per (cywilizacja, epoka): `main.ts:2159,2257,2274,24885,24902,25068,33610,36594,36652,36682,36761,37821,37900,40929,42520`.
- Auto-ulepszenia: `auto-improvements.ts:75-171` (lista ulepszeń, dzielnik 1 na 10 obywateli), `:483-537` (rzeka zagospodarowana, D3, +195 linii), `:765-867` (budżet pracy, etapy), `:1147` (dostęp do wody dla tartaku/obozu), `:1473-1585` (KROK 0 rzeka+las, minimum leśne K2/K3), `:1643-1805`.
- AI niedobory: `ai.ts:2601-2772` (100% puli dla AI i państw-miast, bez limitu %), `:2644-2689` (K3=K2, niedobór tylko otwiera ulepszenia brakującego surowca, −46 linii).
- Hot-seat: `main.ts:33494` (pula Pracy każdego fotela), `:42727-42775` (wczytanie zachowuje pulę; cache HUD).
- Przegrana: `main.ts:30749`, `victory.ts:95-225` (przegrana = brak miast po utracie ostatniego, bez względu na osadników).
- Wycinka przy mieście: `city-hex-clear.ts:41-74`, `main.ts:34365` (pod miastem nigdy las).
- Bitwa: `battleScene.ts:3465` (standoff dwóch wojowników: ZAWSZE true).
- Produkcja: `terrain-improvements.ts:204-209` (tartak i kamieniołom baza 50, ×1,5 za epokę).

## 3. Wpływ na tematy w toku

Uwaga o identyfikatorach: tematy `8I/8I2`, `8H2`, `8A`, `8G` podane w dispatchu **nie występują** w tym checkoucie w rejestrze o takim znaczeniu (`ORKIESTRACJA-ZADANIA.md:106` używa `8I/14B` dla ruchu wrogów; `8A` w `docs/decyzje` i `dyspozycje/UI-DO-MASTERA.md` oznacza kolejność UI). Plik GOAL-RUST-PORT i `REPIN-DELTA-2.md` nie są w tym checkoucie. Poniżej dopasowanie PO TREŚCI (tag R-), oznaczone `(ID z dispatchu niepotwierdzony)`.

| Temat (ID z dispatchu, niepotwierdzony) | Dotknięte hunki | Wpływ | Rekomendacja |
|---|---|---|---|
| 8I / 8I2 — auto-ulepszenia (R-WEB-AUTOIMPROVE-STAGES/-STAGES2/-STAGES3/-PRIORITY) | ~50 w auto-improvements.ts + ai.ts + improvement-build.ts + terrain-improvements.json | WYSOKI: zmienione etapy, budżet, K2/K3, rzeka, dane | Aktualizować jako pierwsze, po zamrożeniu K2/K3 i etapów E1–E6 |
| 8H2 — (treść niezweryfikowana) | nie zmierzono (brak mapy ID→zakres) | NIE_ZMIERZONO | Właściciel/Operator potwierdza ID |
| 8A — (treść niezweryfikowana) | nie zmierzono | NIE_ZMIERZONO | j.w. |
| 8G — (treść niezweryfikowana) | nie zmierzono | NIE_ZMIERZONO | j.w. |
| Forty/terytorium (R-WEB-OUTPOST-FORT-TERRITORY-Q1, R-WEB-AUTO-FORT-CLAIM-Q1) | territory.ts, fort-territory.ts, main.ts (~17+9 hunków), terrain-improvements.json | ŚREDNI–WYSOKI: promień 10→5, zdobycie wejściem, zapis starych fortów | Osobny temat aktualizacji; stare zapisy (`main.ts:42964`) wymagają testu |
| Wojna/pokój/rozejm (R-WEB-PEACE-*, R-WEB-TRUCE-Q1, R-WEB-WAR-AGGRESSOR-FLAG-Q1, R-WEB-ERA-WAR-COUNTER-Q1, R-WOJNA-WYMUSZONA-REGULY-Q1) | ok. 150–200 hunków (main.ts, ai.ts, diplomacy*, forced-war*; liczba przybliżona) | WYSOKI objętościowo; brak modułu w `domain/` | Najpierw decyzja o zakresie portu dyplomacji |

Pozostałe tematy w toku (poza listą dispatchu) z dotkniętych tagów: R-WEB-SPICHLERZ-* (ekonomia), R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1, R-WEB-SAVELOAD-*-PRACA-*, R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 (`battleScene.ts`, 1 hunk).

Rekomendowana kolejność aktualizacji (od najmniejszego ryzyka i najbardziej deterministycznego):
1. Dane i parametry (econ-params, citizen-resource-upkeep, terrain-improvements, ai-params, war-rules-params) — ta sama źródłowa prawda, łatwa weryfikacja wartości.
2. Ekonomia: Spichlerz drain (`building-resource-gate.ts`, `turn-economy.ts`) i stawka per epoka (`citizen-resource-upkeep.ts`) → `resource_production.rs` / `building_costs.rs`.
3. Forty/terytorium (`territory.ts`, `fort-territory.ts`) — decyzja porta o module terytorium.
4. Auto-ulepszenia (8I/8I2) — największy zakres logiki, po punktach 1–2.
5. Wojna/pokój/rozejm/era-war — po decyzji o zakresie dyplomacji w porcie.
6. Zapis hot-seat, HUD, bitwa — UI/zapis, poza `domain/`.

## 4. Dryf bloków cityPanel K01–K09 i kopii bajtowych frontend-v2

**NIE_ZMIERZONO.** Powód: plik `REPIN-DELTA-2.md` (źródło komend `git archive 4bbef081d gra/src gra/data`) nie jest w tym checkoucie (`git ls-files | grep -i REPIN` puste), a definicja bloków K01–K09 w `cityPanel.ts` nie jest dostępna w dispatchu. Zaobserwowane wyłącznie hunki `gra/src/ui/cityPanel.ts:164,1282,9294` (R-WEB-SPICHLERZ-HUD-PARAMS-Q1, 3 hunki) — nie stanowi pomiaru dryfu bloków K.

## 5. Wiarygodność i ograniczenia pomiaru

- Klasyfikacja hunków jest heurystyczna (skrypt): `komentarz` = wszystkie linie komentarzowe; `opis-dane` = tylko klucze opisowe JSON; `import/typ` = tylko importy/typy; `behawioralna` = reszta (w tym zmiany wartości parametrów w kodzie). Wynik: 418 behawioralnych, 52 komentarz, 19 opis-dane, 39 import/typ, 12 dane-JSON, 1 pusty (suma 541).
- Właściciel (tag R-/ABC/PYTANIE/K/R3) występuje bezpośrednio w 257 hunkach; w 284 hunkach nie ma tagu w samej treści. Dla nich w appendix podano dominujący tag pliku oznaczony `(wg pliku)` (przybliżenie, nie dowód właściciela hunka). Hunki bez żadnego tagu w swoim pliku (21 hunków: `render/unitOwnerEmblem.ts` 14, `ui/hexContextTooltip.ts` 5, `data/tech.json` 1, `data/ui-params.json` 1) mają właściciela **NIEPRZYPISANY** — wymaga decyzji orkiestratora. Kryterium „zero symboli bez właściciela” NIE jest spełnione dla tych 21 hunków.
- Testy/bramki: nie uruchamiano (pomiar dokumentacyjny, zgodnie z dispatchem; brak zmian kodu). `git diff --check` — patrz raport operatora.

## 7. Runda 2 — odpowiedzi na zarzuty (R-RUSTPORT-REPIN-DELTA-3-Q1, 2/5)

**Baza:** commit Operatora r1 `2decddaf5`. **Dane per hunk (nadpisują §5–6 tam, gdzie się różnią):** `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-3-Q1/hunki-r2.tsv` (541 wierszy: plik, linia w `4bbef081d`, n, klasa, właściciel z blame, linie kodu, pierwsza zmieniona linia). **Narzędzia:** `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-3-Q1/tools/` (`git archive` z `dc8a3adc`, `4bbef081d`, `edb8fb56` do katalogów poza repo; `final.mjs` liczy poniższe liczby).

**Zarzut 1 — 21 hunków bez właściciela: PRZYJMUJĘ.** Właściciel z `git blame` (commit wprowadzający linię) zamiast braku tagu:
- `render/unitOwnerEmblem.ts` (14) i `ui/hexContextTooltip.ts` (5): commity `883afa6da` i `4f0e92ec6`, bez tagu R-. **Proponowany NOWY temat `R-WEB-UI-EMBLEM-TOOLTIP-Q1`** (UI, brak modułu Rust, poza zakresem portu; decyzja orkiestratora).
- `data/tech.json` (1): `f10d80b0d` → `R-WEB-OUTPOST-FORT-TERRITORY-Q1`.
- `data/ui-params.json` (1): `877f6d5fa` → `R-WEB-NEWGAME-MENU-REORDER-Q1`.
- Wynik: **NIEPRZYPISANY = 0.**

**Zarzut 2 — właściciel „wg pliku” jako przybliżenie: PRZYJMUJĘ.** Właściciel hunka = commit, który wprowadził większość jego nowych linii (`classify3.mjs`). Stary dominujący tag pliku wycofany. Przykład: `ai.ts:2689` (komentarz cytuje `R-WEB-AUTOIMPROVE-STAGES-Q1 R4`) dostaje `R-WEB-AUTOIMPROVE`, a nie `PEACE-RULES`. Hunki, których linie pochodzą z commitów sprzed `dc8a3adc` scalonych po nim (4 hunki, np. `ai.ts:2632`), mają właściciela wg tego commita (temat w `hunki-r2.tsv`). Stan: 384 hunki mają tag R- w temacie commita, 53 są dopasowane po słowach kluczowych tematu (oznaczone `(bez-R-tagu)` w TSV), 4 hunki należą do commitów sprzed dc8 scalonych po nim (tematy w TSV), a **100 hunków należy do commitów bez tagu R- i bez dopasowania słów kluczowych**. Ich proponowany temat wg pliku: `citizen-resource-upkeep.ts` + `.json` (25) → `R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1`; `auto-improvements.ts` (11) → `R-WEB-AUTOIMPROVE-STAGES-Q1`; `building-resource-gate.ts` (8) + `turn-economy.ts` (14) → `R-WEB-SPICHLERZ-DRAIN-KEYS-Q1`; `newGameFlow.ts` (10) i `empireDetailPanel.ts`/`empireDetailTypes.ts` (5) → UI; `main.ts` (8) → do decyzji orkiestratora; emblemat/tooltip (19) → NOWY temat z zarzutu 1. Te propozycje są zaleceniem, nie ustaleniem.

**Zarzut 3 — klasyfikacja i lista behawioralna: PRZYJMUJĘ.** Komentarze i docblocki są rozdzielone od kodu. Klasy (suma 541): `kod` czysty 229; `kod+komentarz` 194 (linie kodu wypisane w TSV); `nazwa/tekst` 30; `komentarz` 52; `import` 13; `typ` 2; `bez-kodu` (docblock + pole typu, np. `ai.ts:410`) 20; `pusty` 1. Hunki z przynajmniej jedną linią kodu: **453** (wcześniej 418 — liczba ze starej heurystyki, która traktowała mieszane hunki jako czysty komentarz lub kod). Lista plik:linia dla każdego hunka: TSV.

**Zarzut 4 — K01–K09 i kopie frontend-v2: PRZYJMUJĘ (pomiar wykonany, nie NIE_ZMIERZONO).** Narzędzia z `parity-v2` (`db102531`, pobrane z `origin/rust-port/parity-v2`):
- `measure-k08d-drift` pin `dc8a3adc` → `4bbef081d`: **11/11 IDENTYCZNA**. Pin `edb8fb56` → `4bbef081d`: 2/11 ZMIENIONA (`buildHandelDetailCard`, `buildWealthDetailCard`), wynik jak w REPIN-DELTA-2.
- `measure-k08e-drift` edb → main: 11 SAME, 1 DRIFT(1) `buildTopBarRekruciDetailCard` (jak w DELTA-2); kopie 0/12 rozjechane. Uruchomienie z pinem dc8 **nieważne**: narzędzie ma zakresy linii zakodowane z `edb8fb56`; zastąpione pomiarem po nazwie (poniżej).
- `measure-k09a-drift` edb → main: **9/9 SAME**. Pin dc8 — **nieważny** z tego samego powodu.
- Pomiar po nazwie funkcji `cityPanel.ts` (`copies.mjs`): **dc8 → main: 2 zmienione funkcje z 306**: `computeView` (K03) i `appendOwnedBuildingRow` (K06B). Żadna z 9 jednostek K09A ani 11 jednostek K08D i 12 jednostek K08E nie dryfuje w tym kroku. Bloki K01–K07 i K08A–C: brak narzędzia blokowego, więc tylko stwierdzenie „funkcja zmieniona” dla dwóch wyżej.
- Kopie frontend-v2 (`manifest.mjs`, 435 wpisów, sha256 vs `gra/` w `4bbef081d` i `dc8a3adc`): **431 identycznych, 2 rozjechane** (`src/ui/armyMergePanel.ts`, `src/ui/unitActionBarHtml.ts`) — **identyczny wynik dla obu pinów**, więc żaden hunk delty `dc8→main` nie dotyczy tych kopii; ich dryf powstał wcześniej (`edb→dc8`). 2 wpisy poza `src/`/`data/` nieporównane.

**Zarzut 5 — wpływ na 8H2, 8A, 8G: PRZYJMUJĘ (ID ustalone).** Zakresy z `GOAL` dispatchy na gałęzi (`e73e88b3a` 8G, `eecf85585` 8A+8J, `edb9bdd24` 8H2+8I, `a068167c9` 8H2 r3, `ce0d40717` 8I2). Liczenie hunków delty na zakres symboli (`impact.mjs`, wartości w `main`):
- **8G** `okolica.ts`: plik poza deltą → **0 hunków**.
- **8A** `production.ts` (`epochNumber`, `itemCost`, `buildingProductionItem`, `unitProductionItem`, `buildingLocationAllowed`), `building-upgrades.ts`, `pending-improvements.ts`: **0 hunków**.
- **8H2** `resource-access.ts` (cały plik) i `society-inputs.ts` (`isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`): **0 hunków**; `placedImprovementsWithZlotoTradeGrant` w `main.ts` (odwołania: 620, 5152, 5166): **0 hunków**.
- **8I** (P1: typy, stałe, helpery, 14 symboli) `auto-improvements.ts`: **4 hunki** (75, 130, 171, 407). **8I2** (P2 `pickAutoImprovements`): **11 hunków** (765–988). Razem **15 hunków** — to jedyny wpływ na tematy w toku; rekomendacja §3 (8I/8I2 najwcześniej) pozostaje.

**Zarzut 6 — liczba hunków wojna/pokój: PRZYJMUJĘ (dokładna).** Owner-tagi `PEACE`, `TRUCE`, `WAR-AGGRESSOR`, `ERA-WAR`, `AGGRESSOR-MARKER`, `WYMUSZONA-WOJNA`, `DIPLO-TICK-WAR-BRAKE`: **236 hunków**, z tego **204 z linią kodu** (`final.mjs`). Wyłączone: `SAVELOAD`/`E2E` (6), `NEWGAME` i `BATTLE`/`RELEASE-ROBOCZA` (2). Liczba z §3 „ok. 150–200” była przybliżeniem i zostaje zastąpiona tą wartością.

**Pozostałe ograniczenia:** bloki K01–K07 i K08A–C nie mają narzędzia pomiarowego na pinie dc8 (wiersz NIE_ZMIERZONO blokowo). Klasyfikacja jest nadal heurystyczna (regex na pierwszych liniach), ale wypisana w TSV i odtwarzalna. Symbole 8A/8H2/8G mierzone wg nazw w `main`, nie wg zakresów z gałęzi dispatchu sprzed zmian.

## 6. Appendix — wszystkie 541 hunków (klasyfikacja i właściciel z §5 r1: superseded przez §7 i `hunki-r2.tsv`) (plik:linia | klasa | -usunięte/+dodane | właściciel | pierwsza dodana linia)

```text
gra/data/ai-params.json:285 | opis-dane | -1/+1 | R-WEB-PEACE-RULES-Q1 | "opis": "NIEAKTYWNY (R-WEB-PEACE-RULES-Q1 R10): nieczytany w kodzie; zastapiony progiem wo
gra/data/ai-params.json:290 | opis-dane | -1/+1 | R-WEB-PEACE-RULES-Q1 | "opis": "NIEPODLACZONY (R-WEB-PEACE-RULES-Q1 R10): brak limitu propozycji AI na ture w gra
gra/data/ai-params.json:295 | opis-dane | -1/+1 | R-WEB-PEACE-RULES-Q1 | "opis": "Próg zdrowia armii AI (Σ hp / Σ hpMax jednostek bojowych) poniżej którego AI szuk
gra/data/citizen-resource-upkeep.json:2 | opis-dane | -1/+1 | R-ZUZYCIE-SUROWCOW-OBYWATELE | "_opis": "R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (Maciej 2026-10-31, decyzja „co do wymagań suro
gra/data/citizen-resource-upkeep.json:10 | dane-JSON | -3/+3 | R-ZUZYCIE-SUROWCOW-OBYWATELE (wg pliku) | { "epoka": 1, "nazwa": "Kamień", "stawkaNaObywatela": 1, "surowce": ["drewno", "glina"] },
gra/data/diplomacy-acceptance-points.json:5 | dane-JSON | -0/+1 | R-WEB-TRUCE-Q1 | "rozejm": { "punkty": 200, "jednostka": "umowa", "uwaga": "R-WEB-TRUCE-Q1 ZAŁOŻENIE: rozej
gra/data/diplomacy-aggressor-params.json:1 | dane-JSON | -0/+16 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | {
gra/data/diplomacy-war-peace-params.json:1 | dane-JSON | -0/+97 | R-WEB-PEACE-RULES-Q1 | {
gra/data/econ-params.json:388 | opis-dane | -1/+1 | PYTANIE-84-B6 | "opis": "PYTANIE-84-B6 (Maciej 2026-07-27): Spichlerz I zużywa Ceramikę ze skarbca państwa
gra/data/econ-params.json:395 | opis-dane | -1/+1 | PYTANIE-84-B7 | "opis": "PYTANIE-84-B7/U-2 (Maciej 2026-07-27): Spichlerz II zużywa Sól ze skarbca × każdy
gra/data/econ-params.json:402 | opis-dane | -1/+1 | PYTANIE-84-B8 | "opis": "PYTANIE-84-B8 (Maciej 2026-07-27): Spichlerz II zużywa Ceramikę ze skarbca co tur
gra/data/tech.json:360 | opis-dane | -1/+1 | NIEPRZYPISANY | "Uwagi": "Fort = NOWY budynek (obrona terenu, zasięg 5, +100% obrona przy obozowaniu — zob
gra/data/terrain-improvements.json:8 | opis-dane | -1/+1 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | "decyzje_EKONOMIA": "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostep
gra/data/terrain-improvements.json:54 | dane-JSON | -3/+3 | ABC-18 | "surowiecOdblokowany_uwaga": "R-WEB-AUTOIMPROVE-STAGES-Q1 (Q1 właściciela 2026-10-31): trz
gra/data/terrain-improvements.json:60 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 | "uwagi": "R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (2026-09-03): tekst gracza w `warunek`
gra/data/terrain-improvements.json:72 | dane-JSON | -3/+3 | R-WEB-AUTOIMPROVE-STAGES-Q1 | "surowiecOdblokowany_uwaga": "solo na wzgórzu; bez farmy/bydła; NIE wymaga złoża owiec (Q1
gra/data/terrain-improvements.json:78 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 | "uwagi": "R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (2026-09-03): tekst gracza w `warunek`
gra/data/terrain-improvements.json:91 | opis-dane | -1/+1 | R-WEB-AUTOIMPROVE-STAGES-Q1 | "surowiecOdblokowany_uwaga": "TYLKO Inkowie; solo — bez innych ulepszen na heksie; NIE wym
gra/data/terrain-improvements.json:93 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "warunek": "tylko cywilizacja Inków; wzgórza i góry, także z nakładką Lasu; bez złoża i be
gra/data/terrain-improvements.json:145 | dane-JSON | -2/+2 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 | "surowiecOdblokowany_uwaga": "klucz 'kamien' wg Surowiec='Kamień' w resources.json; produk
gra/data/terrain-improvements.json:203 | dane-JSON | -2/+2 | PYTANIE-84-B9 | "surowiecOdblokowany_uwaga": "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie
gra/data/terrain-improvements.json:277 | dane-JSON | -3/+3 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "zasieg_pol": 5,
gra/data/terrain-improvements.json:281 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "warunek": "+100% Obrony jednostkom obozującym na polu fortu (bez plonów); tworzy teren za
gra/data/terrain-improvements.json:285 | opis-dane | -1/+1 | ABC-10 | "uwagi": "ABC-10 Maciej 2026-07-04: Fort (mapa) ≠ Cytadela (miasto). Żelazo ep.3; zasięg 5
gra/data/terrain-improvements.json:401 | dane-JSON | -2/+2 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "zasieg_pol": 3,
gra/data/terrain-improvements.json:404 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "warunek": "NIE miasto, BEZ plonów; tworzy teren zabezpieczony pod Twoją cywilizację w pro
gra/data/terrain-improvements.json:409 | opis-dane | -1/+1 | R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (wg pliku) | "uwagi": "Brąz (epoka 2); zasieg_terytorium=3 (od 2026-10-31, było 5); +50% Obrona w trybi
gra/data/ui-params.json:178 | opis-dane | -1/+1 | NIEPRZYPISANY | "label": "Wojna epoki",
gra/data/war-rules-params.json:2 | opis-dane | -1/+1 | R-WEB-WAR-RULES-MULTIWAR-Q1 | "_opis": "R-WEB-WAR-RULES-MULTIWAR-Q1 r3 (regula TYMCZASOWA, flaga WAR_RULES_MULTIWAR_ENAB
gra/data/war-rules-params.json:6 | dane-JSON | -1/+3 | R-WEB-WAR-RULES-MULTIWAR-Q1 (wg pliku) | "maxEraForcedWarsPerEra": null,
gra/src/battle/battleScene.ts:3465 | behawioralna | -1/+7 | R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 | // R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 (R3): ZAWSZE true. `_kickoffBattleTurn` (niżej, d
gra/src/data/wikiBundle.json:1 | dane-JSON | -1/+1 | R-MANPOWER-EPOKA1-500-VS-1000 | {"version":"rev-civpedia-2026-08-05","generated":"2026-09-05","poradnik":[{"id":"00-jak-cz
gra/src/game/ai.ts:41 | import/typ | -1/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | import { canFoundCity, MAX_PROCENT_NAUKA, AI_FIXED_PROCENT_BUDYNKI, AI_FIXED_PROCENT_NAUKA
gra/src/game/ai.ts:69 | import/typ | -0/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | import { resolveWarPeaceProfile, aiPeaceSignals, isFeelingStronger, type WarPeaceProfile }
gra/src/game/ai.ts:72 | import/typ | -0/+3 | R-WEB-PEACE-RULES-Q1 (wg pliku) | IMPROVEMENT_FOR_DEFICIT,
gra/src/game/ai.ts:410 | behawioralna | -0/+6 | R-WEB-AUTO-FORT-CLAIM-Q1 | /**
gra/src/game/ai.ts:2419 | behawioralna | -8/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | export const AI_IMPROVEMENT_FOR_DEFICIT: Readonly<Record<string, readonly ImprovementKey[]
gra/src/game/ai.ts:2601 | komentarz | -1/+1 | R-WEB-AUTOIMPROVE-STAGES2-Q1 | // dozwolony udzial puli: 100% (R-WEB-AUTOIMPROVE-STAGES2-Q1, wlasciciel 2026-10-31: AI i 
gra/src/game/ai.ts:2604 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | : Math.floor(Math.max(0, pracaAvailable)); // AI/państwa-miasta: 100% puli, BEZ limitu % (
gra/src/game/ai.ts:2632 | behawioralna | -3/+0 | R-WEB-PEACE-RULES-Q1 (wg pliku) | (usuniecie)
gra/src/game/ai.ts:2644 | behawioralna | -1/+2 | K3 | // K3 = K2: tylko niedobory, na ktore istnieje ulepszenie terenu (zloto/stal nie otwieraja
gra/src/game/ai.ts:2655 | behawioralna | -1/+4 | R-WEB-AUTOIMPROVE-STAGES-Q1 | // R-WEB-AUTOIMPROVE-STAGES-Q1 R3, ABC-D=B (właściciel 2026-10-31): AI BEZ limitu jednej s
gra/src/game/ai.ts:2662 | behawioralna | -0/+4 | R-WEB-AUTO-FORT-CLAIM-Q1 | // R-WEB-AUTO-FORT-CLAIM-Q1 (K3 = K2): fort na cennym terenie dopiero przy WYCZERPANYM lim
gra/src/game/ai.ts:2686 | behawioralna | -0/+2 | K3 | // K3 = K2 (jedna logika w pickerze): brakujący surowiec idzie na przód, surowce wszędzie 
gra/src/game/ai.ts:2689 | behawioralna | -46/+7 | R-WEB-AUTOIMPROVE-STAGES-Q1 | // R-WEB-AUTOIMPROVE-STAGES-Q1 R4 (właściciel 2026-10-31: „Niedobór ma tylko otwierać ulep
gra/src/game/ai.ts:2769 | komentarz | -1/+1 | R-WEB-AUTOIMPROVE-STAGES2-Q1 | // dozwolony udzial puli: 100% (R-WEB-AUTOIMPROVE-STAGES2-Q1, wlasciciel 2026-10-31: AI i 
gra/src/game/ai.ts:2772 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | : Math.floor(Math.max(0, pracaAvailable)); // AI/państwa-miasta: 100% puli, BEZ limitu % (
gra/src/game/ai.ts:5079 | import/typ | -0/+2 | R-WEB-PEACE-RULES-Q1 (wg pliku) | import { deltaRelacjiSojusz } from './diplomacy';
gra/src/game/ai.ts:5135 | behawioralna | -0/+12 | R-WEB-TRUCE-Q1 | /**
gra/src/game/ai.ts:5186 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | /** R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner ma aktywną flagę agresora (main.ts: czyAgresorAkt
gra/src/game/ai.ts:5267 | behawioralna | -0/+29 | R-WEB-PEACE-RULES-Q1 | /**
gra/src/game/ai.ts:5337 | behawioralna | -0/+7 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/game/ai.ts:5394 | behawioralna | -0/+62 | R-WEB-PEACE-CITY-CESSION-Q1 | /** R-WEB-PEACE-CITY-CESSION-Q1 r3: bazowy próg słabości AI do oddania miasta (rw). */
gra/src/game/ai.ts:5458 | behawioralna | -1/+11 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/game/ai.ts:5817 | behawioralna | -0/+7 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R6: profil wojny/pokoju właściciela decyzji (brak danych = wartośc
gra/src/game/ai.ts:5838 | behawioralna | -0/+2 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R1: realny czas wojny z pary (dawniej stała 5 = martwa heurystyka)
gra/src/game/ai.ts:5844 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | turnsAtWar:   turnsAtWarRel,
gra/src/game/ai.ts:5846 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner (druga strona stance) z aktywną flagą agresora.
gra/src/game/ai.ts:5859 | behawioralna | -1/+2 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R6: próg wojny per cywilizacja z macierzy (zastępuje globalne 30).
gra/src/game/ai.ts:5874 | behawioralna | -0/+62 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r4 (zarzut 4 Evaluatora): bramki czasu wojny i „czuje się
gra/src/game/ai.ts:5951 | behawioralna | -2/+22 | R-WEB-PEACE-RULES-Q1 | // ---- Priorytet 2: zaproponuj_pokoj (słaby w trakcie wojny; R-WEB-PEACE-RULES-Q1 R3) ---
gra/src/game/ai.ts:5976 | behawioralna | -1/+2 | R-WEB-PEACE-RULES-Q1 (wg pliku) | rodzaj:   aiPeaceProposalKind(turnsAtWarRel),
gra/src/game/ai.ts:6089 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-Q1 (wg pliku) | && score >= dipP.progNapRelacja - bias.napScoreEase + deltaRelacjiSojusz(rel.celAgresorAkt
gra/src/game/ai.ts:6146 | komentarz | -0/+1 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner z aktywną flagą agresora — wyższy próg Relacji na 
gra/src/game/ai.ts:6148 | behawioralna | -1/+2 | R-WEB-PEACE-RULES-Q1 (wg pliku) | dipP.progSojuszRelacja - sojuszAdj.ease.scoreThresholdDelta + sojuszAdj.penaltyScore
gra/src/game/auto-improvements.ts:9 | import/typ | -1/+1 | K2 (wg pliku) | import { Nakladka, TerenBazowy } from '../types/hex';
gra/src/game/auto-improvements.ts:12 | import/typ | -1/+1 | K2 (wg pliku) | import { axialDistance, cityTerritoryRadius, territoryOwnerAt } from '../map/territory';
gra/src/game/auto-improvements.ts:17 | import/typ | -0/+1 | K2 (wg pliku) | isFarmBaseTerrain,
gra/src/game/auto-improvements.ts:75 | behawioralna | -1/+18 | R-WEB-AUTOIMPROVE-STAGES-Q1 | 'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'lodzie_rybackie', 'irygacja',
gra/src/game/auto-improvements.ts:130 | behawioralna | -1/+1 | K2 (wg pliku) | new Set<ImprovementKey>(ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE);
gra/src/game/auto-improvements.ts:171 | komentarz | -12/+10 | K2 | * Dzielnik „1 na 10 obywateli" (dawne ECHO właściciela 2026-08-27: „jeden tartak i obóz; a
gra/src/game/auto-improvements.ts:407 | behawioralna | -0/+41 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | /**
gra/src/game/auto-improvements.ts:483 | behawioralna | -2/+52 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | /**
gra/src/game/auto-improvements.ts:537 | behawioralna | -0/+195 | R-WEB-AUTOIMPROVE-STAGES-Q1 | /** D3: ulepszenia, których wykonanie na heksie rzeki oznacza „zagospodarowaną rzekę” (wyc
gra/src/game/auto-improvements.ts:738 | behawioralna | -4/+11 | K2 | * Niedobory, na które istnieje ulepszenie terenu (K2/K3). Niedobór surowca bez ulepszenia 
gra/src/game/auto-improvements.ts:751 | komentarz | -0/+7 | K1 | *
gra/src/game/auto-improvements.ts:765 | behawioralna | -7/+59 | K2 | const clearingSeed = new Set<string>(opts.clearingHexKeys ?? []);
gra/src/game/auto-improvements.ts:826 | behawioralna | -9/+10 | K2 (wg pliku) | for (const stage of foodCities.length === 0 ? [] : FOOD_STAGES) {
gra/src/game/auto-improvements.ts:842 | behawioralna | -9/+5 | ABC-5 | // Do not skip a stage just because its valid targets are currently blocked by the Work
gra/src/game/auto-improvements.ts:848 | behawioralna | -1/+0 | K2 (wg pliku) | (usuniecie)
gra/src/game/auto-improvements.ts:851 | behawioralna | -0/+2 | K2 (wg pliku) | pracaBudgetPercent: 100,
gra/src/game/auto-improvements.ts:862 | behawioralna | -0/+2 | K2 (wg pliku) | record(stagedPicks);
gra/src/game/auto-improvements.ts:867 | behawioralna | -6/+79 | K2 | // farm/livestock/irrigation phase is waiting on the Work budget.
gra/src/game/auto-improvements.ts:947 | behawioralna | -0/+13 | K2 (wg pliku) | fortPicks = pickAutoImprovementsSinglePass(fortOpts);
gra/src/game/auto-improvements.ts:961 | behawioralna | -0/+1 | K2 (wg pliku) | const fortSpent = fallbackSpent + sum(fortPicks);
gra/src/game/auto-improvements.ts:963 | behawioralna | -1/+23 | K2 (wg pliku) | if (
gra/src/game/auto-improvements.ts:988 | behawioralna | -12/+2 | K2 (wg pliku) | const normalPicks = pickAutoImprovementsSinglePass(after(sideSpent, { cities: otherCities 
gra/src/game/auto-improvements.ts:1017 | behawioralna | -0/+6 | K2 (wg pliku) | riverHexesOnly = false,
gra/src/game/auto-improvements.ts:1031 | behawioralna | -0/+4 | K2 | // R4: ulepszenia BRAKUJĄCYCH surowców (tylko z nich niedobór może coś „otworzyć” w K2/K3)
gra/src/game/auto-improvements.ts:1147 | behawioralna | -0/+28 | R-WEB-AUTOIMPROVE-STAGES3-Q1 | // R-WEB-AUTOIMPROVE-STAGES3-Q1, S3-1 (właściciel 2026-10-31): „DOSTĘP DO WODY” dla tartak
gra/src/game/auto-improvements.ts:1177 | behawioralna | -1/+2 | K2 (wg pliku) | // R5: wycinka w toku / zaplanowana wcześniej w tym wywołaniu liczy się jak już zaplanowan
gra/src/game/auto-improvements.ts:1189 | behawioralna | -4/+19 | R-WEB-AUTOIMPROVE-STAGES2-Q1 | // R-WEB-AUTOIMPROVE-STAGES2-Q1 (właściciel 2026-10-31, przycisk „Wolno wycinać las"): GRA
gra/src/game/auto-improvements.ts:1209 | behawioralna | -1/+9 | R4 KOREKTA F | // R4 KOREKTA F (właściciel 2026-10-31): heks centrum miasta jest ZWYKŁYM heksem dla autom
gra/src/game/auto-improvements.ts:1229 | behawioralna | -2/+0 | K2 (wg pliku) | (usuniecie)
gra/src/game/auto-improvements.ts:1307 | komentarz | -0/+3 | R4 KOREKTA F | // R4 KOREKTA F (właściciel 2026-10-31): zniesiony filtr R3 „centrum miasta wyłączone” — h
gra/src/game/auto-improvements.ts:1338 | behawioralna | -1/+4 | K2 (wg pliku) | const orderedHexes = [...candidateHexes]
gra/src/game/auto-improvements.ts:1358 | behawioralna | -2/+1 | K2 (wg pliku) | && !ZERO_YIELD_IMPROVEMENTS.has(k),
gra/src/game/auto-improvements.ts:1360 | behawioralna | -1/+1 | K2 (wg pliku) | const defensePriority = demandActive
gra/src/game/auto-improvements.ts:1473 | behawioralna | -0/+32 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (runda 2, zarzut 1 i 3 Obrony): KROK 0 NA HEKSIE RZEKA+LA
gra/src/game/auto-improvements.ts:1513 | behawioralna | -1/+8 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5, D3 właściciela 2026-10-31): „rzeka zagospodarowana” 
gra/src/game/auto-improvements.ts:1524 | behawioralna | -3/+2 | K2 (wg pliku) | if (map.hexes[hk]?.nakladka === Nakladka.Las && riverKrok0Ok(q, r)) return true;
gra/src/game/auto-improvements.ts:1528 | behawioralna | -1/+8 | K2 (wg pliku) | const placedHere = workingPlaced.get(hk) ?? [];
gra/src/game/auto-improvements.ts:1538 | komentarz | -2/+4 | K2 | // MINIMUM LEŚNE MIASTA — [NIEAKTUALNE w K2/K3 (`demandActive`): właściciel 2026-10-31 „Te
gra/src/game/auto-improvements.ts:1556 | behawioralna | -0/+5 | ABC-B | // R3, ABC-B=B (K2/K3): tartak powstaje WYŁĄCZNIE przy niedoborze drewna. Bez niego minimu
gra/src/game/auto-improvements.ts:1562 | behawioralna | -1/+1 | K2 (wg pliku) | .filter(k => !demandActive && tartakDozwolony && hexPhasePriority.includes(k))
gra/src/game/auto-improvements.ts:1581 | komentarz | -0/+3 | ABC-3 | // ABC-3=B (właściciel 2026-10-31): w etapie E5 (`offRiverClearing`) wycinka poza rzeką NI
gra/src/game/auto-improvements.ts:1585 | behawioralna | -1/+49 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | && !rzekiDoZagospodarowania && (offRiverClearing || lesneMinSpelnione);
gra/src/game/auto-improvements.ts:1643 | komentarz | -1/+2 | K2 (wg pliku) | // KROK 0 heksa: wyrąb, gdy heks ma rzekę I las (bez lesneMin i progu lasu — patrz wyżej),
gra/src/game/auto-improvements.ts:1646 | behawioralna | -9/+14 | K2 (wg pliku) | riverKrok0Ok(q, r)
gra/src/game/auto-improvements.ts:1688 | behawioralna | -3/+7 | R-WEB-AUTOIMPROVE-STAGES2-Q1 | // R-WEB-AUTOIMPROVE-STAGES2-Q1 (właściciel 2026-10-31, budżet sztywno): koszt ponad dostę
gra/src/game/auto-improvements.ts:1707 | behawioralna | -0/+8 | R-WEB-AUTOIMPROVE-PRIORITY-Q1 | // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (Objaw A, zmierzone: gra/tools/wyrab-rzeka-krok0-test.cjs
gra/src/game/auto-improvements.ts:1718 | behawioralna | -0/+2 | K2 (wg pliku) | // Wspólne bramki rodzaju ulepszenia na heksie (te same w SONDZIE nadwyżki, ZASADA 3).
gra/src/game/auto-improvements.ts:1745 | behawioralna | -1/+1 | K2 (wg pliku) | && !cityBudgetExhausted && !demandActive && !citySkipWyrab && basePriority.includes('wyrab
gra/src/game/auto-improvements.ts:1764 | behawioralna | -0/+1 | K2 (wg pliku) | if (!wyrabMaSens(q, r)) continue;
gra/src/game/auto-improvements.ts:1805 | behawioralna | -0/+1 | K2 (wg pliku) | if (keyBlockedOnHex(key, hexKey)) continue;
gra/src/game/building-resource-gate.ts:38 | behawioralna | -0/+5 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | import {
gra/src/game/building-resource-gate.ts:330 | behawioralna | -8/+44 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 | /** Klucze JSON (gra/data/econ-params.json → budynki) czytane przez loadSpichlerzDrainPara
gra/src/game/building-resource-gate.ts:415 | behawioralna | -1/+2 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | dryRun: boolean,
gra/src/game/building-resource-gate.ts:424 | behawioralna | -0/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, params);
gra/src/game/building-resource-gate.ts:426 | behawioralna | -1/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | if (ownerResourceStock(cities, ownerId, 'ceramika') >= ceramikaAmount) {
gra/src/game/building-resource-gate.ts:429 | behawioralna | -1/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | ceramika: ceramikaAmount,
gra/src/game/building-resource-gate.ts:435 | behawioralna | -1/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | if (hasII && ownerResourceStock(cities, ownerId, 'sol') >= params.solII) {
gra/src/game/building-resource-gate.ts:438 | behawioralna | -1/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | sol: params.solII,
gra/src/game/building-resource-gate.ts:614 | behawioralna | -0/+2 | R-WEB-SPICHLERZ-HUD-PARAMS-Q1 | /** Parametry drain Spichlerza z econ-params (wg trudności) — WYMAGANE (R-WEB-SPICHLERZ-HU
gra/src/game/building-resource-gate.ts:627 | behawioralna | -0/+1 | R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (wg pliku) | opts.drainParams,
gra/src/game/citizen-resource-upkeep.ts:24 | komentarz | -3/+3 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | *     0,2 2026-08-12, PRZYWRÓCONA 1,0 2026-08-13, patrz niżej): stawka BIEŻĄCA per epoka *
gra/src/game/citizen-resource-upkeep.ts:41 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * nie luka; STAWKA 2026-08-13 = 1,0 (od 2026-10-31 zależna od epoki, patrz `citizenUpkeepR
gra/src/game/citizen-resource-upkeep.ts:81 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * REAL drain (current rate: per era via `citizenUpkeepRateForEra` — Kamień 1.0 / Brąz 2.0 
gra/src/game/citizen-resource-upkeep.ts:83 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * `citizenUpkeepRateForEra(era)` (Kamień 1.0 / Brąz 2.0 / Żelazo 3.0), `required = Math.fl
gra/src/game/citizen-resource-upkeep.ts:107 | behawioralna | -0/+6 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | /**
gra/src/game/citizen-resource-upkeep.ts:136 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * FALLBACK (realna stawka per epoka: `citizenUpkeepRateForEra`). Stawka zużycia: sztuk sur
gra/src/game/citizen-resource-upkeep.ts:156 | komentarz | -0/+3 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | // R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (Maciej 2026-10-31): powyższa stała to już TYLKO FALLB
gra/src/game/citizen-resource-upkeep.ts:161 | komentarz | -3/+4 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * Wiersz tabeli dla danej epoki — ta sama reguła wyboru co lista surowców: `era` < 1 / NaN
gra/src/game/citizen-resource-upkeep.ts:166 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | function citizenUpkeepRowForEra(era: number): CitizenUpkeepEraRow | undefined {
gra/src/game/citizen-resource-upkeep.ts:168 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | if (!first) return undefined;
gra/src/game/citizen-resource-upkeep.ts:171 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | if (exact) return exact;
gra/src/game/citizen-resource-upkeep.ts:173 | behawioralna | -1/+24 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | return below ?? first;
gra/src/game/citizen-resource-upkeep.ts:202 | behawioralna | -0/+6 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | /**
gra/src/game/citizen-resource-upkeep.ts:234 | behawioralna | -0/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | population?: number,
gra/src/game/citizen-resource-upkeep.ts:240 | behawioralna | -0/+10 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | // R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: gdy podano populację (opcjonalny 3. argument), bramka
gra/src/game/citizen-resource-upkeep.ts:252 | behawioralna | -1/+3 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | const haveOk = typeof have === 'number' && Number.isFinite(have) && have > 0 ? have : 0;
gra/src/game/citizen-resource-upkeep.ts:264 | behawioralna | -1/+4 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | return {
gra/src/game/citizen-resource-upkeep.ts:285 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * **`citizenUpkeepRateForEra(era)` (per epoka: Kamień 1,0 / Brąz 2,0 / Żelazo 3,0 sztuki s
gra/src/game/citizen-resource-upkeep.ts:290 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * Math.floor(population × citizenUpkeepRateForEra(era))` — zaokrąglone W DÓŁ do sztuk
gra/src/game/citizen-resource-upkeep.ts:309 | behawioralna | -0/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | const ratePerCitizen = citizenUpkeepRateForEra(era);
gra/src/game/citizen-resource-upkeep.ts:321 | behawioralna | -1/+2 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | // Stawka ZALEŻY OD EPOKI (R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1) — ta sama dla podglądu i dren
gra/src/game/citizen-resource-upkeep.ts:337 | behawioralna | -1/+3 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | return {
gra/src/game/citizen-resource-upkeep.ts:348 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | * (`Math.floor(cityPopulation × stawka_epoki)`, stawka = `coverage.ratePerCitizen`), NIE s
gra/src/game/citizen-resource-upkeep.ts:401 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | coverage: Pick<CitizenUpkeepCoverage, 'available' | 'missing' | 'ratePerCitizen'>,
gra/src/game/citizen-resource-upkeep.ts:405 | behawioralna | -0/+2 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | // Stawka epoki niesiona przez werdykt silnika (`coverage.ratePerCitizen`); brak → fallbac
gra/src/game/citizen-resource-upkeep.ts:409 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | const qty = Math.floor(pop * rate);
gra/src/game/city-hex-clear.ts:41 | behawioralna | -0/+19 | R-WEB-CITY-CLEARS-FOREST-Q1 | /**
gra/src/game/city-hex-clear.ts:65 | behawioralna | -0/+1 | R-WEB-CITY-CLEARS-FOREST-Q1 (wg pliku) | clearForestFromHex(hex);
gra/src/game/city-hex-clear.ts:74 | behawioralna | -3/+1 | R-WEB-CITY-CLEARS-FOREST-Q1 (wg pliku) | if (hex.nakladka !== Nakladka.Brak && !isKeptDeposit(hex.nakladka)) {
gra/src/game/diplomacy-peace-lock.ts:58 | behawioralna | -0/+50 | R-WEB-TRUCE-Q1 | // ---------------------------------------------------------------------------
gra/src/game/diplomacy-pn-engine.ts:35 | behawioralna | -0/+2 | R-WEB-PEACE-CITY-CESSION-Q1 | /** R-WEB-PEACE-CITY-CESSION-Q1 r2: akcja propozycji (bramka pozycji 'miasto'). */
gra/src/game/diplomacy-pn-engine.ts:41 | behawioralna | -0/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | actionId: opts?.actionId,
gra/src/game/diplomacy-pn-engine.ts:90 | behawioralna | -0/+6 | R-WEB-TRUCE-Q1 | /**
gra/src/game/diplomacy-pn-engine.ts:121 | behawioralna | -0/+6 | R-WEB-PEACE-CITY-CESSION-Q1 | /** R-WEB-PEACE-CITY-CESSION-Q1 r2: wycena miasta (PW, `diplomacyPnMiasto`) — tylko typ 'm
gra/src/game/diplomacy-pn-engine.ts:233 | behawioralna | -0/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | actionId?: string;
gra/src/game/diplomacy-pn-engine.ts:239 | behawioralna | -1/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | const sumBase = buildProposalPnSumOpts({ ...opts, actionId: payload.actionId ?? opts?.acti
gra/src/game/diplomacy-proposals.ts:28 | import/typ | -0/+2 | R-WEB-TRUCE-Q1 (wg pliku) | import { czyAgresorAktywny, deltaRelacjiSojusz } from './diplomacy';
gra/src/game/diplomacy-proposals.ts:63 | import/typ | -0/+1 | R-WEB-TRUCE-Q1 (wg pliku) | import { normalizeTruceDuration, TRUCE_DEFAULT_TURNS } from './diplomacy-peace-lock';
gra/src/game/diplomacy-proposals.ts:93 | behawioralna | -1/+3 | R-WEB-TRUCE-Q1 | | 'pokoj'
gra/src/game/diplomacy-proposals.ts:189 | behawioralna | -0/+11 | R-WEB-PEACE-RULES-Q1 | /**
gra/src/game/diplomacy-proposals.ts:379 | behawioralna | -1/+4 | R-WEB-TRUCE-Q1 (wg pliku) | function stanceForEval(
gra/src/game/diplomacy-proposals.ts:392 | behawioralna | -1/+4 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R1: realny czas wojny (dawna stała 5 usunięta).
gra/src/game/diplomacy-proposals.ts:733 | behawioralna | -1/+2 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 (runda 2): rozejm dzieli bramkę PW pokoju (ta sama formuła i komunikat).
gra/src/game/diplomacy-proposals.ts:1059 | import/typ | -0/+3 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2 defekt r2): bez actionId pozycja 'miasto' wyceniana
gra/src/game/diplomacy-proposals.ts:1065 | behawioralna | -1/+3 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: proponent z aktywną flagą agresora → gorszy próg/chęć (JSO
gra/src/game/diplomacy-proposals.ts:1072 | behawioralna | -1/+4 | R-WEB-TRUCE-Q1 (wg pliku) | if (actionId === 'rozejm' && !stanWojny) {
gra/src/game/diplomacy-proposals.ts:1116 | behawioralna | -1/+4 | R-WEB-TRUCE-Q1 (wg pliku) | const napThreshold = Math.max(
gra/src/game/diplomacy-proposals.ts:1165 | behawioralna | -1/+2 | R-WEB-TRUCE-Q1 (wg pliku) | p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore - sojuszEase
gra/src/game/diplomacy-proposals.ts:1246 | behawioralna | -1/+7 | R-WEB-TRUCE-Q1 | case 'pokoj':
gra/src/game/diplomacy-proposals.ts:1262 | behawioralna | -1/+24 | R-WEB-PEACE-RULES-Q1 | const basePnCfg = treatyBasePnFromConfig(actionId, payload);
gra/src/game/diplomacy-proposals.ts:1892 | behawioralna | -1/+3 | R-WEB-TRUCE-Q1 (wg pliku) | return cmd.rodzaj === 'rozejm'
gra/src/game/diplomacy-proposals.ts:1899 | behawioralna | -0/+4 | R-WEB-TRUCE-Q1 (wg pliku) | case 'oferuj_miasto_za_pokoj':
gra/src/game/diplomacy-proposals.ts:1954 | behawioralna | -0/+10 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r4 (N4): rozejm proponowany przez AI idzie tą samą ścieżką co pokój
gra/src/game/diplomacy-proposals.ts:1970 | behawioralna | -0/+20 | R-WEB-PEACE-CITY-CESSION-Q1 | case 'oferuj_miasto_za_pokoj':
gra/src/game/diplomacy-proposals.ts:2099 | behawioralna | -1/+1 | R-WEB-TRUCE-Q1 (wg pliku) | 'pokoj', 'rozejm', 'trybut_oferta', 'ultimatum',
gra/src/game/diplomacy-proposals.ts:2159 | behawioralna | -0/+2 | R-WEB-TRUCE-Q1 (wg pliku) | case 'rozejm':
gra/src/game/diplomacy-proposals.ts:2612 | komentarz | -0/+1 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r3 (N3): rozejm ma ten sam słodzik kontrprzeciwny co pokój (ta sama bram
gra/src/game/diplomacy-proposals.ts:2614 | behawioralna | -1/+1 | R-WEB-TRUCE-Q1 (wg pliku) | 'nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal', 'pokoj', 'rozejm',
gra/src/game/diplomacy-tick-war-brake.ts:172 | behawioralna | -0/+23 | R-WEB-PEACE-RULES-Q1 | /**
gra/src/game/diplomacy-value-catalog.ts:26 | behawioralna | -1/+2 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | | 'zywnosc'
gra/src/game/diplomacy-value-catalog.ts:448 | behawioralna | -0/+6 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/game/diplomacy-value-catalog.ts:479 | behawioralna | -1/+15 | R-WEB-PEACE-CITY-CESSION-Q1 | items: Array<{
gra/src/game/diplomacy-value-catalog.ts:527 | behawioralna | -0/+13 | R-WEB-PEACE-CITY-CESSION-Q1 | case 'miasto': {
gra/src/game/diplomacy-value-catalog.ts:546 | behawioralna | -0/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | || item.typ === 'miasto'
gra/src/game/diplomacy-value-catalog.ts:767 | behawioralna | -0/+231 | R-WEB-PEACE-CITY-CESSION-Q1 | // ---------------------------------------------------------------------------
gra/src/game/diplomacy-war-gates.ts:10 | behawioralna | -1/+2 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r3 (N2): rozejm ma te same bramki walutowe w wojnie co pokój.
gra/src/game/diplomacy-war-gates.ts:13 | komentarz | -0/+1 | R-WEB-TRUCE-Q1 | /** Waluta w wojnie dozwolona dla pokoju i rozejmu (wspólna bramka, R-WEB-TRUCE-Q1 r3 N2).
gra/src/game/diplomacy-war-peace-profile.ts:1 | behawioralna | -0/+364 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 (runda 1) — czyste reguły wojny i pokoju per cywilizacja.
gra/src/game/diplomacy.ts:24 | import/typ | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: parametry flagi agresora (sekcja na końcu pliku).
gra/src/game/diplomacy.ts:35 | import/typ | -0/+1 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 (wg pliku) | import { resolveWarPeaceProfile, warWearinessShare } from './diplomacy-war-peace-profile';
gra/src/game/diplomacy.ts:1108 | behawioralna | -0/+5 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | /**
gra/src/game/diplomacy.ts:1300 | behawioralna | -1/+6 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R4: zmęczenie = min(0.5, turnsAtWar / T(civ)), T ≤ 20 (D4).
gra/src/game/diplomacy.ts:1337 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: wobec agresora (flaga aktywna) próg sojuszu wyżej o deltę 
gra/src/game/diplomacy.ts:1340 | behawioralna | -1/+1 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 (wg pliku) | p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore + agresorDeltaSojusz
gra/src/game/diplomacy.ts:1368 | behawioralna | -0/+3 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: gorsza chęć sojuszu wobec agresora (mnożnik z JSON; 1 bez 
gra/src/game/diplomacy.ts:1785 | behawioralna | -0/+172 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1 — flaga agresora i casus belli.
gra/src/game/forced-war-bronze.ts:5 | import/typ | -1/+0 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | (usuniecie)
gra/src/game/forced-war-bronze.ts:92 | komentarz | -0/+4 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po czasie usu
gra/src/game/forced-war-bronze.ts:171 | behawioralna | -18/+0 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | (usuniecie)
gra/src/game/forced-war-bronze.ts:183 | behawioralna | -16/+0 | R-WOJNA-WYMUSZONA-REGULY-Q1 | (usuniecie)
gra/src/game/forced-war-common.ts:12 | komentarz | -0/+5 | R-WEB-PEACE-RULES-R8R9-Q1 | /**
gra/src/game/forced-war-common.ts:201 | behawioralna | -0/+11 | R-WEB-PEACE-RULES-R8R9-Q1 | /**
gra/src/game/forced-war-common.ts:213 | behawioralna | -0/+6 | R-WEB-PEACE-RULES-R8R9-Q1 | /**
gra/src/game/forced-war-common.ts:221 | behawioralna | -0/+7 | R-WEB-ERA-WAR-COUNTER-Q1 | /**
gra/src/game/forced-war-common.ts:307 | behawioralna | -0/+7 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R8: jedyny predykat blokady pary w tej funkcji = NAP/peaceLoc
gra/src/game/forced-war-common.ts:317 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | .filter(s => opts.totalActiveForcedWarsByOwner(s.ownerId) === 0 && !exhausted(s.ownerId))
gra/src/game/forced-war-common.ts:339 | behawioralna | -1/+2 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | if (exhausted(cand.ownerId)) continue;
gra/src/game/forced-war-common.ts:401 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | const blockedIdx: boolean[][] = ids.map(a => ids.map(b => a !== b && pairBlocked(a, b)));
gra/src/game/forced-war-common.ts:468 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | const blocked = new Set(remaining.filter(id => pairBlocked(seekerId, id)));
gra/src/game/forced-war-common.ts:498 | behawioralna | -2/+2 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | const attackerBlocked = pairBlocked(leftoverId, pair.attackerId);
gra/src/game/forced-war-common.ts:501 | behawioralna | -0/+3 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: obie strony pary muszą mieć wolny licznik wojen epoki —
gra/src/game/forced-war-iron.ts:5 | import/typ | -1/+0 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | (usuniecie)
gra/src/game/forced-war-iron.ts:89 | komentarz | -0/+3 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po czasie usu
gra/src/game/forced-war-iron.ts:214 | behawioralna | -26/+0 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | (usuniecie)
gra/src/game/forced-war-stone.ts:5 | import/typ | -1/+0 | R-WEB-PEACE-RULES-R8R9-Q1 (wg pliku) | (usuniecie)
gra/src/game/forced-war-stone.ts:28 | komentarz | -0/+3 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po czasie usu
gra/src/game/forced-war-stone.ts:74 | behawioralna | -31/+0 | R-WOJNA-WYMUSZONA-REGULY-Q1 | (usuniecie)
gra/src/game/fort-territory.ts:8 | komentarz | -0/+10 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | * ZASTAPIONE decyzja wlasciciela 2026-10-31 (R-WEB-OUTPOST-FORT-TERRITORY-Q1):
gra/src/game/fort-territory.ts:36 | import/typ | -1/+1 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | import { axialDistance, cityTerritoryRadius, territoryOwnerAt, type CityNode, type Territo
gra/src/game/fort-territory.ts:58 | behawioralna | -0/+31 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | /**
gra/src/game/fort-territory.ts:103 | behawioralna | -0/+40 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | /**
gra/src/game/fort-territory.ts:296 | behawioralna | -0/+54 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | /** Minimalny opis jednostki do rozstrzygania zdobycia fortu przez wejscie wojska. */
gra/src/game/terrain-improvements.ts:204 | komentarz | -0/+3 | R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1 | // Tartak i Kamieniolom: baza 50/ture (epoka 1), skalowana x1,5 za epoke (50/75/113).
gra/src/game/terrain-improvements.ts:209 | komentarz | -0/+1 | R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1 (wg pliku) | // tartak/kamieniolom restored to 50 on 2026-10-31 (see above);
gra/src/game/turn-economy.ts:127 | import/typ | -2/+2 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | loadSpichlerzDrainParams,
gra/src/game/turn-economy.ts:131 | import/typ | -0/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | type SpichlerzDrainParams,
gra/src/game/turn-economy.ts:1356 | behawioralna | -0/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | drainParams: SpichlerzDrainParams,
gra/src/game/turn-economy.ts:1358 | behawioralna | -1/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | const drain = paySpichlerzDrainForCity(cities, ownerId, builtIds, dryRun, drainParams);
gra/src/game/turn-economy.ts:1367 | behawioralna | -0/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | drainParams: SpichlerzDrainParams,
gra/src/game/turn-economy.ts:1374 | behawioralna | -2/+3 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, drainParams);
gra/src/game/turn-economy.ts:1406 | behawioralna | -0/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | const spichlerzDrainParams = loadSpichlerzDrainParams(raw, difficulty);
gra/src/game/turn-economy.ts:1547 | behawioralna | -4/+5 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, spichlerzDrainParams);
gra/src/game/turn-economy.ts:1567 | behawioralna | -1/+2 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | stockAlreadyDrained: boolean,
gra/src/game/turn-economy.ts:1583 | behawioralna | -1/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | : simulateCeramikaAfterSpichlerzDrains(cities, ownerId, builtByCity, drainParams);
gra/src/game/turn-economy.ts:1708 | behawioralna | -2/+4 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 | resolveOwnerActiveLabels: OwnerActiveLabelsResolver | undefined,
gra/src/game/turn-economy.ts:1797 | behawioralna | -1/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | const drain = paySpichlerzDrainForCity(cities, city.ownerId, builtIds, false, spichlerzDra
gra/src/game/turn-economy.ts:2477 | behawioralna | -0/+5 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 | // R-WEB-SPICHLERZ-DRAIN-KEYS-Q1: zużycie Spichlerza z econ-params wg trudności (jedno źró
gra/src/game/turn-economy.ts:2495 | import/typ | -0/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | spichlerzDrainParams,
gra/src/game/turn-economy.ts:2499 | behawioralna | -1/+1 | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (wg pliku) | cities, builtByCity, true, spichlerzDrainParams,
gra/src/game/victory.ts:14 | komentarz | -1/+5 | R-WEB-DEFEAT-LAST-CITY | *   3. 'przegrana' — brak miast gracza po tym, jak kiedykolwiek miał miasto.
gra/src/game/victory.ts:95 | komentarz | -0/+3 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 | /** @deprecated Bez wpływu na przegraną (R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1):
gra/src/game/victory.ts:102 | behawioralna | -0/+3 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 (wg pliku) | /** Wejście dla samej reguły przegranej (patrz `checkDefeat`). */
gra/src/game/victory.ts:208 | behawioralna | -0/+14 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 | /**
gra/src/game/victory.ts:225 | komentarz | -1/+1 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 (wg pliku) | *   2. Przegrana (brak miast gracza, bez względu na osadników)
gra/src/game/victory.ts:247 | behawioralna | -5/+2 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 (wg pliku) | const defeat = checkDefeat(input);
gra/src/game/war-rules-multiwar.ts:22 | komentarz | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 | /** R3 (r3, właściciel 2026-10-25): najwyżej N wojen epoki na epokę w skali świata (`null`
gra/src/game/war-rules-multiwar.ts:24 | behawioralna | -0/+4 | R-WEB-ERA-WAR-COUNTER-Q1 | /** R-WEB-ERA-WAR-COUNTER-Q1: najwyżej N wojen epoki na JEDNĄ cywilizację (także gracza, n
gra/src/game/war-rules-multiwar.ts:37 | behawioralna | -0/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | maxEraForcedWarsPerCivPerEra: warRulesParamsRaw.maxEraForcedWarsPerCivPerEra,
gra/src/game/war-rules-multiwar.ts:163 | behawioralna | -0/+138 | R-WEB-ERA-WAR-COUNTER-Q1 | /**
gra/src/main.ts:227 | import/typ | -0/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | nextFortSeq,
gra/src/main.ts:233 | import/typ | -0/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | fortTerritoryNodes,
gra/src/main.ts:266 | import/typ | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | import { applyCityFoundingToHex, cityKeepsImprovement, clearForestUnderCity } from './game
gra/src/main.ts:866 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | parseCrisisCounters, brakeWarOutcome, sortCrisisQueue, tradeTrustBonusPerTura,
gra/src/main.ts:1194 | import/typ | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | import type { AITurnOpts, RelacjaWejscie, DiplomacjaInputs, AIDiplomacyCommand, MiastoWyce
gra/src/main.ts:1205 | import/typ | -1/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1207 | import/typ | -2/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1216 | import/typ | -1/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1217 | import/typ | -2/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1226 | import/typ | -2/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1228 | import/typ | -1/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:1242 | import/typ | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | isForcedWarRelationBlocked,
gra/src/main.ts:1254 | import/typ | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | import { checkVictory, checkDefeat, techIdsInGameScope, allTechInScopeResearched, OSTATNIA
gra/src/main.ts:1280 | import/typ | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | canCivJoinEraForcedWar,
gra/src/main.ts:1284 | import/typ | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | isForcedEraWarEnabled,
gra/src/main.ts:1288 | import/typ | -0/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | pickPlayerReferenceCity,
gra/src/main.ts:1318 | import/typ | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | isCityLimitExhausted,
gra/src/main.ts:1396 | behawioralna | -0/+16 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: flaga agresora + casus belli (stan modułu, zapis w meta).
gra/src/main.ts:1441 | import/typ | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | import { resolveWarPeaceProfile, brakeRelationThreshold, recordWarCityLoss, warStateFromRe
gra/src/main.ts:1446 | behawioralna | -0/+5 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | truceUntilTurn as truceUntilTurnFor,
gra/src/main.ts:1510 | import/typ | -0/+4 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | planCityCession,
gra/src/main.ts:1515 | pusty | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:2159 | behawioralna | -0/+4 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: licznik wojen epoki PER (cywilizacja, epoka) — klucz `eraWarC
gra/src/main.ts:2257 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 3): Brąz wyłączony flagą → brak pending.
gra/src/main.ts:2274 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 3): Żelazo wyłączone flagą → brak pending.
gra/src/main.ts:2424 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const nodes = statsTerritoryNodesForOwner(ownerId);
gra/src/main.ts:2539 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | heksyTerytorium: countTerritoryHexes(statsTerritoryNodesForOwner(ownerId)),
gra/src/main.ts:2594 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | heksyTerytorium: countTerritoryHexes(statsTerritoryNodesForOwner(ownerId)),
gra/src/main.ts:3699 | behawioralna | -1/+5 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | ? {
gra/src/main.ts:3785 | behawioralna | -0/+10 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | /**
gra/src/main.ts:4973 | behawioralna | -0/+4 | R-FORT-STRAZNICA | /** Rejestr fortow/posterunkow (R-FORT-STRAZNICA krok 2). Od 2026-10-31 tworzy TWARDE tery
gra/src/main.ts:4981 | behawioralna | -0/+5 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | /** Wezly terytorium wlasciciela do STATYSTYK (miasta + wlasne forty/posterunki, R-WEB-OUT
gra/src/main.ts:4993 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const cityNodes: TerritoryNode[] = cities.map(c => ({
gra/src/main.ts:5000 | behawioralna | -0/+3 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // R-WEB-OUTPOST-FORT-TERRITORY-Q1 (decyzja wlasciciela 2026-10-31, zastepuje Q2=B
gra/src/main.ts:5472 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const nodes = statsTerritoryNodesForOwner(oid);
gra/src/main.ts:7350 | behawioralna | -0/+2 | R-WEB-AGGRESSOR-MARKER-Q1 | // R-WEB-AGGRESSOR-MARKER-Q1: znacznik „Agresor (N)" — N = pozostałe tury aktywnej flagi.
gra/src/main.ts:9162 | behawioralna | -0/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | ringHex: isBarbarian(ownerId) || portraitForceCultureIcon(ownerId)
gra/src/main.ts:9516 | behawioralna | -1/+12 | R-WEB-ERA-WAR-COUNTER-Q1 | /** R-WEB-ERA-WAR-COUNTER-Q1 (6): etykieta epoki wojny wymuszonej w komunikatach dla gracz
gra/src/main.ts:9536 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const baseTitle = isMe(declarerId)
gra/src/main.ts:9539 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const title = reasonLabel ? reasonLabel + ' — ' + baseTitle : baseTitle;
gra/src/main.ts:10207 | behawioralna | -0/+94 | R-WEB-PEACE-RULES-Q1 | /**
gra/src/main.ts:10307 | behawioralna | -2/+21 | R-WEB-PEACE-RULES-Q1 | /** R-WEB-PEACE-RULES-Q1 R6: profil wojny/pokoju strony (gracz = brak wiersza macierzy = w
gra/src/main.ts:10330 | behawioralna | -1/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const relacja = relationScore(getDiploRelation(a, b));
gra/src/main.ts:10399 | behawioralna | -2/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:10401 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | if (diplomacyCrisisCounters.size > 0) refreshObjectivePowerCache();
gra/src/main.ts:10410 | behawioralna | -1/+11 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R7: N per para (wyższy progWojnyRelacji), ostrzeżenie 2 tury przed
gra/src/main.ts:10423 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | 'Ryzyko wojny z ' + ownerDiploLabel(other) + ': ' + (nPair - counter) + ' tur do wypowiedz
gra/src/main.ts:10427 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | if (counter >= nPair) ready.push({ ownerA: sa, ownerB: sb, counter });
gra/src/main.ts:10429 | behawioralna | -1/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:10437 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const outcome = brakeWarOutcome(
gra/src/main.ts:10440 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (o) => isMe(o),
gra/src/main.ts:10442 | behawioralna | -1/+5 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | // D7 (właściciel 2026-10-30): gracz NIGDY nie wypowiada wojny automatycznie z hamulca.
gra/src/main.ts:10461 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: wojna z progu (hamulec) NIE nadaje flagi agresora.
gra/src/main.ts:10464 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (6): wojna z progu (hamulec) — powód widoczny w karcie zdarzeń
gra/src/main.ts:10491 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | diploBrakeCrisisStep(a, b);
gra/src/main.ts:10637 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | truceTurns?: number,
gra/src/main.ts:10655 | behawioralna | -9/+23 | R-WEB-TRUCE-Q1 | if (truceTurns != null) {
gra/src/main.ts:10778 | behawioralna | -0/+25 | R-WEB-TRUCE-Q1 | /**
gra/src/main.ts:10841 | behawioralna | -2/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | ): boolean {
gra/src/main.ts:10846 | behawioralna | -0/+3 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r3 (N1): wypowiedzenie wojny w oknie aktywnego rozejmu = złamanie,
gra/src/main.ts:10859 | behawioralna | -0/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | if (truceBreach) {
gra/src/main.ts:10867 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | truceUntilTurn: undefined,
gra/src/main.ts:10881 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | return truceBreach;
gra/src/main.ts:11297 | behawioralna | -0/+11 | R-WEB-PEACE-CITY-CESSION-Q1 | case 'miasto': {
gra/src/main.ts:11377 | behawioralna | -0/+2 | R-WEB-TRUCE-Q1 | /** R-WEB-TRUCE-Q1 (r5): wyłącznie hak live `__truceTestDebug.suppressVictoryForTest` — ma
gra/src/main.ts:11506 | komentarz | -2/+3 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | * forty/posterunki (foundingNodesForOwner, game/fort-territory.ts). Q2=B ("granice sie nie
gra/src/main.ts:11520 | behawioralna | -1/+3 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // R-WEB-OUTPOST-FORT-TERRITORY-Q1: obcy fort/posterunek = terytorium zabezpieczone.
gra/src/main.ts:11713 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const truceBreachPlayer = chargeWarDeclarationCredibility(ME(), ownerId);
gra/src/main.ts:11721 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: wypowiedzenie gracza — flaga tylko bez casus belli.
gra/src/main.ts:11742 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | function ownerDeclareWarOn(attackerId: number, defenderId: number, force = false, cause?: 
gra/src/main.ts:11749 | behawioralna | -1/+2 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r3 (N1): złamanie rozejmu — czytane PRZED chargeWarDeclarationCredibilit
gra/src/main.ts:11763 | behawioralna | -0/+11 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: flaga agresora tylko dla przyczyny 'bez_powodu' (domyślnie
gra/src/main.ts:11807 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna');
gra/src/main.ts:12697 | behawioralna | -0/+22 | R-WEB-SAVELOAD-PRACA-POOL-Q1 | /**
gra/src/main.ts:13506 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: rozdzielenie armii na heks fortu = wejscie wojska
gra/src/main.ts:14268 | behawioralna | -1/+1 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // (deklaracja `fortNodes` przeniesiona przed buildAllTerritoryNodes — R-WEB-OUTPOST-FORT-
gra/src/main.ts:14325 | behawioralna | -1/+4 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // R3 Q-B=B: znacznik kolejnosci budowy (wczesniejszy fort wygrywa sporny heks).
gra/src/main.ts:14337 | behawioralna | -1/+4 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | if (idx !== -1) {
gra/src/main.ts:14409 | behawioralna | -0/+27 | R3 Q-A=A | /**
gra/src/main.ts:14473 | behawioralna | -0/+26 | R-WEB-CITY-CLEARS-FOREST-Q1 | /**
gra/src/main.ts:14500 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | enforceNoForestUnderCities('wczytanie/preset');
gra/src/main.ts:15936 | behawioralna | -3/+3 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: wojny wymuszone Kamienia/Brązu/Żelaza NIE kończą się
gra/src/main.ts:15940 | behawioralna | -0/+1 | R-WEB-PEACE-RULES-Q1 | recordWarCityLossForPair(oldOwner, newOwner); // R-WEB-PEACE-RULES-Q1 R2
gra/src/main.ts:18068 | behawioralna | -0/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | case 'oferuj_miasto_za_pokoj': return 'Miasto za pokój';
gra/src/main.ts:18119 | behawioralna | -0/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | && cmd.type !== 'oferuj_miasto_za_pokoj'
gra/src/main.ts:18194 | behawioralna | -0/+7 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 | // R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 (część A, pomiar → naprawa): gdy bilans AI jest w
gra/src/main.ts:18204 | behawioralna | -1/+4 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r4 (N4): rozejm AI ma własną bazę PW (200), nie bazę pokoju (500).
gra/src/main.ts:18220 | behawioralna | -0/+7 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 | // Zakres: WYŁĄCZNIE rozejm (pokój zostaje bit w bit — ten sam ubytek zmierzony w kontroli
gra/src/main.ts:18229 | behawioralna | -1/+3 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const clampedPayload = peaceBareAllowed
gra/src/main.ts:18239 | behawioralna | -0/+2 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3: akcja propozycji — bramka pozycji 'miasto' (pokój/wasal
gra/src/main.ts:18263 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | !peaceBareAllowed
gra/src/main.ts:18361 | komentarz | -0/+2 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r5 (N3): 'rozejm' ma WŁASNĄ bramkę PW (ta sama co pokój, baza 200) — jak
gra/src/main.ts:18364 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | 'pokoj', 'rozejm', 'umowa_szlakow', 'umowa_handlowa',
gra/src/main.ts:18499 | behawioralna | -0/+9 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: odmowa trybutu/ultimatum przez ADRESATA (awaitingId) daje
gra/src/main.ts:18652 | behawioralna | -0/+7 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: odmowa gracza (adresata) trybutu/ultimatum daje żądającemu
gra/src/main.ts:18857 | behawioralna | -0/+5 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 | // R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 (r3, pomiar Chromium): rozejm AI na stole wpadal w 
gra/src/main.ts:18905 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | case 'rozejm': return basketDetail || `Rozejm na ${p.turns ?? 10} tur`;
gra/src/main.ts:19325 | komentarz | -0/+3 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 r5 (N4 fix): gałąź bez warunku `rodzaj` — interHumanCmdFromFields nigdy 
gra/src/main.ts:21535 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: obowiązek sojuszniczy — wejście w wojnę NIE nadaje flagi a
gra/src/main.ts:21984 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | tickTruceExpiries();
gra/src/main.ts:22037 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | diploBrakeCrisisStep(ME(), oid);
gra/src/main.ts:22165 | behawioralna | -0/+6 | R-WEB-PEACE-RULES-Q1 | // R-WEB-PEACE-RULES-Q1 R5: bramka pokoju AI (gracz proponuje, AI respondent).
gra/src/main.ts:22341 | behawioralna | -0/+9 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r4 (zarzut 3 Evaluatora): cesja miasta sprawdzana PRZED
gra/src/main.ts:22389 | behawioralna | -0/+5 | R-WEB-TRUCE-Q1 | } else if (cywAction === 'rozejm') {
gra/src/main.ts:23187 | behawioralna | -0/+9 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): miasta GRACZA do oddania w pokoju z wyceną PW;
gra/src/main.ts:24885 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 | if (isForcedEraWarEnabled('bronze')) bronzeForceWarPendingOwners.add(attackerId); // R-WEB
gra/src/main.ts:24902 | behawioralna | -0/+52 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 1): lustro `forceBronzeForcedWarOnPlayer` dla
gra/src/main.ts:24986 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 | if (isForcedEraWarEnabled('bronze')) bronzeForceWarPendingOwners.add(attackerId); // R-WEB
gra/src/main.ts:25068 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 | if (isForcedEraWarEnabled('iron')) ironForceWarPendingOwners.add(attackerId); // R-WEB-ERA
gra/src/main.ts:25320 | behawioralna | -0/+114 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // R-WEB-OUTPOST-FORT-TERRITORY-Q1: hak testowy WYLACZNIE dla Playwright
gra/src/main.ts:25939 | behawioralna | -0/+69 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 | // R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1: hak testowy WYŁĄCZNIE do
gra/src/main.ts:26083 | behawioralna | -0/+309 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9 (kryteria 2 i 4: żywy test wojny wymuszonej). Pomocnicze
gra/src/main.ts:26500 | behawioralna | -0/+98 | R-WEB-CITY-CLEARS-FOREST-Q1 | // R-WEB-CITY-CLEARS-FOREST-Q1 — hak testowy WYŁĄCZNIE dla `tools/city-clears-forest-live-
gra/src/main.ts:30749 | behawioralna | -0/+37 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 | /* R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1: przegrana po utracie OSTATNIEGO miasta
gra/src/main.ts:31278 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: po bitwie obroncy zgineli, atakujacy stoi na forcie
gra/src/main.ts:32278 | behawioralna | -187/+6 | R-EPOKA-BRAZU-WYMUSZONA-WOJNA | // R-WEB-PEACE-RULES-R8R9-Q1 R9: USUNIĘTO automatyczny koniec wojen wymuszonych Kamienia,
gra/src/main.ts:32391 | behawioralna | -3/+1 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: brak auto-końca wojen wymuszonych po zdobyciu miast.
gra/src/main.ts:32393 | behawioralna | -0/+1 | R-WEB-PEACE-RULES-Q1 | recordWarCityLossForPair(oldOwner, atkOwner); // R-WEB-PEACE-RULES-Q1 R2
gra/src/main.ts:32670 | behawioralna | -0/+137 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/main.ts:33494 | behawioralna | -0/+4 | R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1 | // R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1 (decyzja wlasciciela A, 2026-10-31): pula Pracy KAZDEGO
gra/src/main.ts:33610 | behawioralna | -0/+7 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (7): licznik wojen epoki per (cywilizacja, epoka).
gra/src/main.ts:34336 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: jednostki stojace na wrogim forcie (koniec tury)
gra/src/main.ts:34365 | behawioralna | -0/+2 | R-WEB-CITY-CLEARS-FOREST-Q1 | // R-WEB-CITY-CLEARS-FOREST-Q1: pod miastem nigdy las (siatka na każdej granicy tury).
gra/src/main.ts:35372 | komentarz | -2/+2 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | // stawka epoki szt. surowca na 1 obywatela na turę (R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1:
gra/src/main.ts:35600 | komentarz | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | // N2 (2026-08-11): realny drenaż (stawka per epoka citizenUpkeepRateForEra
gra/src/main.ts:36017 | komentarz | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | // stawka per epoka (citizenUpkeepRateForEra) szt. surowca/obywatela/turę — patrz kanon w
gra/src/main.ts:36248 | behawioralna | -0/+6 | R-WEB-AUTOIMPROVE-STAGES-Q1 | // R-WEB-AUTOIMPROVE-STAGES-Q1 (audyt P25/E5, zmierzone A8 vs A9): bez `playerEra`
gra/src/main.ts:36273 | komentarz | -0/+5 | R-WEB-AUTOIMPROVE-STAGES-Q1 | // R-WEB-AUTOIMPROVE-STAGES-Q1 (ABC-1, K1/K2): etapy E1-E6 dla profili „Zywnosc” (K1)
gra/src/main.ts:36280 | behawioralna | -3/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | return policy.focus === 'zywnosc' || policy.focus === 'zrownowazone';
gra/src/main.ts:36282 | behawioralna | -0/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | // Wycinka w toku (wieloturowa) - picker nie moze jej emitowac drugi raz (exec-wycinka-in-
gra/src/main.ts:36451 | behawioralna | -3/+1 | R-WOJNA-WYMUSZONA-REGULY-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R9: brak limitu czasu wojny wymuszonej (dawny limit usunięty)
gra/src/main.ts:36519 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const truceBreachCluster = chargeWarDeclarationCredibility(csOwnerId, ME());
gra/src/main.ts:36526 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: klaster państw-miast wypowiada wojnę bez powodu (lub z cas
gra/src/main.ts:36594 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: Brąz wyłączony flagą — nie wchodzi do puli parowania.
gra/src/main.ts:36652 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: Żelazo wyłączone flagą — nie wchodzi do puli parowania.
gra/src/main.ts:36682 | behawioralna | -1/+3 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (5): odległość partnera gracza liczona od STOLICY gracza
gra/src/main.ts:36720 | behawioralna | -0/+2 | R-WEB-PEACE-RULES-R8R9-Q1 | // R-WEB-PEACE-RULES-R8R9-Q1 R8 (D1): Relacja (relationScore) >= próg blokuje wojnę epoki.
gra/src/main.ts:36725 | behawioralna | -1/+2 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | || allianceFormalKindBetween(activeDeals, a, b) !== null
gra/src/main.ts:36761 | behawioralna | -0/+4 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (3): podmiot z zużytym licznikiem wojen epoki (w tej epoce,
gra/src/main.ts:36770 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | pairRelationScore: pairRelationOfR8,
gra/src/main.ts:36773 | behawioralna | -0/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | isEraWarExhausted: isWarRulesMultiwarEnabled() ? isEraWarExhausted : undefined,
gra/src/main.ts:37071 | behawioralna | -0/+1 | R-WEB-AUTO-FORT-CLAIM-Q1 | cityLimitBase: _menuCityLimitBase, // R-WEB-AUTO-FORT-CLAIM-Q1
gra/src/main.ts:37301 | behawioralna | -1/+1 | R-WEB-PEACE-RULES-Q1 | turnsAtWar: diploWarStateFor(ownerId, ME()).turnsAtWar, // R-WEB-PEACE-RULES-Q1 R1
gra/src/main.ts:37386 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: gracz jako partner — flaga agresora (u innych AI).
gra/src/main.ts:37395 | behawioralna | -0/+4 | R-WEB-PEACE-RULES-Q1 | ...diploRelWarFields(ownerId, ME()), // R-WEB-PEACE-RULES-Q1 R1/R3(d)
gra/src/main.ts:37428 | behawioralna | -0/+2 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner AI — flaga agresora wpływa na sojusz/pakt.
gra/src/main.ts:37453 | behawioralna | -0/+1 | R-WEB-PEACE-RULES-Q1 | ...diploRelWarFields(ownerId, otherId), // R-WEB-PEACE-RULES-Q1 R1/R3(d)
gra/src/main.ts:37738 | behawioralna | -0/+3 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N1a): miasta TEGO AI do oddania w pokoju.
gra/src/main.ts:37821 | behawioralna | -0/+20 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: wojna epoki wyłączonej epoki (Brąz/Żelazo, flaga
gra/src/main.ts:37841 | behawioralna | -11/+0 | R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1 | (usuniecie)
gra/src/main.ts:37879 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const truceBreachAi = chargeWarDeclarationCredibility(ownerId, targetId);
gra/src/main.ts:37886 | behawioralna | -0/+7 | R-WEB-WAR-AGGRESSOR-FLAG-Q1 | // R-WEB-WAR-AGGRESSOR-FLAG-Q1: wojna wymuszona epoki NIE nadaje flagi agresora;
gra/src/main.ts:37900 | behawioralna | -0/+8 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (1, 2): zużycie licznika per cywilizacja i epoka —
gra/src/main.ts:37990 | behawioralna | -0/+5 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (6): powód wojny epoki widoczny dla gracza (hint + karta zdarz
gra/src/main.ts:37997 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | recordWarDeclarationEvent(ownerId, targetId, eraWarReasonLabel);
gra/src/main.ts:38001 | behawioralna | -1/+6 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | showHintMessage(
gra/src/main.ts:38933 | behawioralna | -0/+4 | R3 Q-A=A | // R3 Q-A=A (obrona zarzut 4): wejscie wojska AI-cywilizacji na heks fortu = zdobycie od r
gra/src/main.ts:39252 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | onBarbarianCityBattleResolved,
gra/src/main.ts:39274 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: po ruchach AI/barbarzyncow w tej turze
gra/src/main.ts:39327 | behawioralna | -1/+1 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | const vResult = truceTestSuppressVictory ? null : checkVictory(vInput);
gra/src/main.ts:39500 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: koniec ruchu na heksie fortu (animacja ucieta)
gra/src/main.ts:39964 | behawioralna | -0/+1 | R3 Q-A=A | sweepFortCaptures(); // R3 Q-A=A: koniec ruchu (gracz i AI) na heksie fortu
gra/src/main.ts:40929 | behawioralna | -0/+4 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1: nowa gra zaczyna z zerowym licznikiem wojen epoki.
gra/src/main.ts:42520 | behawioralna | -0/+17 | R-WEB-ERA-WAR-COUNTER-Q1 | // R-WEB-ERA-WAR-COUNTER-Q1 (7): licznik wojen epoki per (cywilizacja, epoka). Zapis bez p
gra/src/main.ts:42727 | behawioralna | -2/+3 | R-WEB-SAVELOAD-PRACA-POOL-Q1 | // R-WEB-SAVELOAD-PRACA-POOL-Q1 (decyzja wlasciciela A, 2026-10-31): wczytanie ZACHOWUJE p
gra/src/main.ts:42734 | behawioralna | -8/+0 | R-WEB-ERA-WAR-COUNTER-Q1 (wg pliku) | (usuniecie)
gra/src/main.ts:42736 | behawioralna | -0/+18 | R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1 | // R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1: pule foteli 2+ (fotel 0 = `playerPracaPool` wyzej, ali
gra/src/main.ts:42775 | behawioralna | -0/+14 | R-WEB-HOTSEAT-HUD-CACHE-Q1 | // R-WEB-HOTSEAT-HUD-CACHE-Q1 (decyzja wlasciciela A, 2026-10-31): wartosci pomocnicze HUD
gra/src/main.ts:42964 | behawioralna | -0/+20 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // R-WEB-OUTPOST-FORT-TERRITORY-Q1 (2026-10-31): stare zapisy ze starymi fortami/posterunk
gra/src/map/improvement-build.ts:428 | komentarz | -5/+7 | R-WEB-AUTOIMPROVE-STAGES-Q1 | * właściciela „Tak, odwracamy — wszystkie trzy", uchyla zakaz z 2026-07-29).
gra/src/map/improvement-build.ts:462 | komentarz | -1/+2 | ABC-2 | // dla rzeczywistej ścieżki applyBuildRequest poza panelem. ABC-2 (właściciel 2026-10-31):
gra/src/map/improvement-build.ts:465 | komentarz | -1/+1 | ABC-2 | // Owce zachowują istniejącą blokadę budowy na lesie (ABC-2: blokada zostaje).
gra/src/map/newGameMapDefaults.ts:464 | komentarz | -0/+6 | R-WEB-NEWGAME-DEFAULTS-Q1 | /**
gra/src/map/newGameMapDefaults.ts:471 | behawioralna | -0/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | if (typ !== 'ziemia') return 30;
gra/src/map/territory.ts:5 | komentarz | -1/+2 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | * Posterunek r=3, fort r=5 (stałe; decyzja właściciela 2026-10-31, R-WEB-OUTPOST-FORT-TERR
gra/src/map/territory.ts:38 | behawioralna | -1/+10 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | export type TerritoryNode = CityNode & {
gra/src/map/territory.ts:74 | behawioralna | -0/+5 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | /** Promień terytorium fortu (decyzja właściciela 2026-10-31). / EN: fort territory radius
gra/src/map/territory.ts:85 | komentarz | -2/+2 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | *   - FORT:      r = 5  (stały; R-WEB-OUTPOST-FORT-TERRITORY-Q1, było 10)
gra/src/map/territory.ts:90 | behawioralna | -2/+2 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | if (node.isFort)    return FORT_TERRITORY_RADIUS;
gra/src/map/territory.ts:119 | komentarz | -1/+2 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | * węzeł w tablicy `nodes`. Węzły miast mają pierwszeństwo przed fortami/posterunkami.
gra/src/map/territory.ts:127 | behawioralna | -2/+5 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | let bestCityOwner: number | null = null;
gra/src/map/territory.ts:137 | behawioralna | -3/+13 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 (wg pliku) | if (node.isFort || node.isOutpost) {
gra/src/map/territory.ts:153 | behawioralna | -1/+7 | R-WEB-OUTPOST-FORT-TERRITORY-Q1 | // ZALOZENIE (R-WEB-OUTPOST-FORT-TERRITORY-Q1 R2, zarzut 1): heks w promieniu
gra/src/render/unitOwnerEmblem.ts:100 | behawioralna | -0/+7 | NIEPRZYPISANY | /**
gra/src/render/unitOwnerEmblem.ts:248 | behawioralna | -0/+17 | NIEPRZYPISANY | /** `#rrggbb` (bez skrótu i bez przezroczystości) → ten sam zapis lowercase; inaczej `null
gra/src/render/unitOwnerEmblem.ts:266 | behawioralna | -1/+1 | NIEPRZYPISANY | function drawDisc(ctx: CanvasRenderingContext2D, ringColor: string): void {
gra/src/render/unitOwnerEmblem.ts:273 | behawioralna | -1/+1 | NIEPRZYPISANY | ctx.strokeStyle = ringColor;
gra/src/render/unitOwnerEmblem.ts:281 | behawioralna | -1/+1 | NIEPRZYPISANY | function drawFallbackGlyph(ctx: CanvasRenderingContext2D, variant: EmblemVariant, ringColo
gra/src/render/unitOwnerEmblem.ts:283 | behawioralna | -1/+1 | NIEPRZYPISANY | ctx.fillStyle = ringColor;
gra/src/render/unitOwnerEmblem.ts:335 | behawioralna | -1/+4 | NIEPRZYPISANY | // Barwa obwódki wchodzi do klucza: dwie pełne cywilizacje o różnych kolorach
gra/src/render/unitOwnerEmblem.ts:373 | behawioralna | -2/+3 | NIEPRZYPISANY | const ringColor = ringColorFor(variant, octx.ringHex);
gra/src/render/unitOwnerEmblem.ts:397 | behawioralna | -1/+1 | NIEPRZYPISANY | drawDisc(ctx, ringColor);
gra/src/render/unitOwnerEmblem.ts:407 | behawioralna | -1/+1 | NIEPRZYPISANY | drawDisc(ctx, ringColor);
gra/src/render/unitOwnerEmblem.ts:417 | behawioralna | -1/+1 | NIEPRZYPISANY | drawDisc(ctx, ringColor);
gra/src/render/unitOwnerEmblem.ts:420 | komentarz | -0/+1 | NIEPRZYPISANY | // Barwa = barwa obwódki tej cywilizacji (ten sam pierścień co na tarczy).
gra/src/render/unitOwnerEmblem.ts:422 | behawioralna | -1/+1 | NIEPRZYPISANY | ctx.strokeStyle = ringColor;
gra/src/render/unitOwnerEmblem.ts:437 | behawioralna | -1/+1 | NIEPRZYPISANY | drawDisc(ctx, ringColor);
gra/src/ui/cityPanel.ts:164 | import/typ | -0/+1 | R-WEB-SPICHLERZ-HUD-PARAMS-Q1 (wg pliku) | loadSpichlerzDrainParams,
gra/src/ui/cityPanel.ts:1282 | behawioralna | -1/+8 | R-WEB-SPICHLERZ-HUD-PARAMS-Q1 | // R-WEB-SPICHLERZ-HUD-PARAMS-Q1: te same parametry zużycia co silnik (econ-params wg trud
gra/src/ui/cityPanel.ts:9294 | behawioralna | -0/+5 | R-WEB-SPICHLERZ-HUD-PARAMS-Q1 | // R-WEB-SPICHLERZ-HUD-PARAMS-Q1: parametry zużycia Spichlerza jak w silniku.
gra/src/ui/diplomacyNegotiationModal.ts:14 | behawioralna | -0/+2 | R-WEB-TRUCE-Q1 | /** R-WEB-TRUCE-Q1 (N5): 'rozejm' dla akcji '10' wybranej jako rozejm (dlugosc w `turns`).
gra/src/ui/diplomacyNegotiationModal.ts:103 | behawioralna | -0/+10 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/ui/diplomacyNegotiationModal.ts:565 | behawioralna | -0/+1 | R-WEB-TRUCE-Q1 (wg pliku) | if (payload.actionId === '10') return payload.rodzaj === 'rozejm' ? 'rozejm' : 'pokoj';
gra/src/ui/diplomacyPanel.ts:34 | behawioralna | -0/+2 | R-WEB-AGGRESSOR-MARKER-Q1 | /** R-WEB-AGGRESSOR-MARKER-Q1: pozostałe tury aktywnej flagi agresora (doTury - turn, >= 1
gra/src/ui/diplomacyPanel.ts:220 | behawioralna | -0/+16 | R-WEB-AGGRESSOR-MARKER-Q1 | /**
gra/src/ui/diplomacyPanel.ts:266 | behawioralna | -0/+1 | R-WEB-AGGRESSOR-MARKER-Q1 (wg pliku) | agresorBadgeHtml(rel.agresorPozostaleTury) +
gra/src/ui/diplomacyTradeBasket.ts:19 | import/typ | -0/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | diplomacyMiastoAkcjaDozwolona,
gra/src/ui/diplomacyTradeBasket.ts:42 | behawioralna | -1/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | renderBasketItemValueHtml as renderBasketItemValueBaseHtml,
gra/src/ui/diplomacyTradeBasket.ts:70 | behawioralna | -0/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | miasto: 'Miasto (tylko pokój)',
gra/src/ui/diplomacyTradeBasket.ts:215 | behawioralna | -0/+2 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): bez actionId pozycja 'miasto' = null (fail-safe).
gra/src/ui/diplomacyTradeBasket.ts:234 | behawioralna | -1/+18 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2 defekt r2): cityPn/cityWeight muszą dojść do sumy PN
gra/src/ui/diplomacyTradeBasket.ts:540 | behawioralna | -0/+4 | R-WEB-TRUCE-Q1 | /** R-WEB-TRUCE-Q1 (N5): akcja '10' - 'pokoj' (domyslnie) albo 'rozejm' na `truceTurns` tu
gra/src/ui/diplomacyTradeBasket.ts:641 | behawioralna | -0/+2 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | peaceKind: initial?.peaceKind === 'rozejm' ? 'rozejm' : 'pokoj',
gra/src/ui/diplomacyTradeBasket.ts:848 | behawioralna | -1/+21 | R-WEB-TRUCE-Q1 | {
gra/src/ui/diplomacyTradeBasket.ts:883 | behawioralna | -0/+6 | R-WEB-TRUCE-Q1 | } else if (actionId === '10') {
gra/src/ui/diplomacyTradeBasket.ts:1204 | behawioralna | -0/+8 | R-WEB-TRUCE-Q1 | case '10':
gra/src/ui/diplomacyTradeBasket.ts:1329 | behawioralna | -1/+3 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | const propActionId = actionId === '10' && treatyState?.peaceKind === 'rozejm'
gra/src/ui/diplomacyTradeBasket.ts:1546 | behawioralna | -0/+8 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): miasto tylko po stronie „Daję", tylko w akcji
gra/src/ui/diplomacyTradeBasket.ts:1651 | behawioralna | -0/+25 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): wybór miasta do oddania (lista PW). Miasto już dod
gra/src/ui/diplomacyTradeBasket.ts:1752 | behawioralna | -0/+5 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | + '<div class="cdb-fields-extra" data-extra="' + prefix + '-miasto">'
gra/src/ui/diplomacyTradeBasket.ts:1773 | behawioralna | -0/+34 | R-WEB-PEACE-CITY-CESSION-Q1 | /**
gra/src/ui/diplomacyTradeBasket.ts:2200 | behawioralna | -0/+8 | R-WEB-PEACE-CITY-CESSION-Q1 | case 'miasto': {
gra/src/ui/diplomacyTradeBasket.ts:2243 | behawioralna | -1/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | const extras = ['qty', 'city', 'tech', 'resqty', 'miasto'];
gra/src/ui/diplomacyTradeBasket.ts:2249 | behawioralna | -1/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | zloto: 'qty', praca: 'qty', zywnosc: 'city', tech: 'tech', surowiec_ilosc: 'resqty', miast
gra/src/ui/diplomacyTradeBasket.ts:2363 | behawioralna | -0/+2 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): blok wyboru miasta (tylko pokój/wasal, nie gdy blo
gra/src/ui/diplomacyTradeBasket.ts:2368 | behawioralna | -1/+1 | R-WEB-PEACE-CITY-CESSION-Q1 (wg pliku) | + '<div class="cdb-land-main">' + treatyHtml + cityPickHtml + '</div>'
gra/src/ui/diplomacyTradeBasket.ts:2506 | behawioralna | -0/+3 | R-WEB-TRUCE-Q1 | /** R-WEB-TRUCE-Q1 (N5): prefill rodzaju akcji '10' (pokoj/rozejm) i dlugosci rozejmu. */
gra/src/ui/diplomacyTradeBasket.ts:2555 | behawioralna | -0/+3 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): akcja koszyka trafia do ctx → basketPnOpts (bramka
gra/src/ui/diplomacyTradeBasket.ts:2594 | behawioralna | -0/+2 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 (N5): podglad PW dla rozejmu liczony jak akcja 'rozejm' (baza 200).
gra/src/ui/diplomacyTradeBasket.ts:2642 | behawioralna | -0/+22 | R-WEB-PEACE-CITY-CESSION-Q1 | // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): wybór miasta do oddania w pokoju.
gra/src/ui/diplomacyTradeBasket.ts:2863 | behawioralna | -0/+18 | R-WEB-TRUCE-Q1 | // R-WEB-TRUCE-Q1 (N5): przelacznik pokoj/rozejm i wybor dlugosci rozejmu (klasy dedykowan
gra/src/ui/empireDetailPanel.ts:2433 | behawioralna | -1/+8 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | // R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: stawka BIEŻĄCEJ epoki — ta sama, którą silnik użył do
gra/src/ui/empireDetailPanel.ts:2627 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | const z = Math.floor(c.ludki * citizenRate);
gra/src/ui/empireDetailPanel.ts:2637 | behawioralna | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | h += `<div class="civ-emp-foot">${formatLiczbaPl(citizenRate, 1)} szt. surowca `
gra/src/ui/empireDetailPanel.ts:3155 | komentarz | -1/+1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (wg pliku) | // ZASPOKAJA CAŁĄ populację imperium tego ownera (stawka per epoka citizenUpkeepRateForEra
gra/src/ui/empireDetailTypes.ts:111 | behawioralna | -0/+6 | R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 | * R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: stawka zużycia tej epoki (sztuk surowca / obywatela / 
gra/src/ui/hexContextTooltip.ts:699 | behawioralna | -0/+2 | NIEPRZYPISANY | /** Rola jednostki dowodzącej, odróżniana od zwykłej jednostki tego samego typu. */
gra/src/ui/hexContextTooltip.ts:772 | behawioralna | -1/+5 | NIEPRZYPISANY | const isCommander = c.commanderTitle === 'Wódz' || c.commanderTitle === 'Generał';
gra/src/ui/hexContextTooltip.ts:778 | behawioralna | -1/+3 | NIEPRZYPISANY | + (isCommander
gra/src/ui/hexContextTooltip.ts:889 | behawioralna | -0/+3 | NIEPRZYPISANY | .sp-unit-stack-card.commander{border-color:rgba(232,216,138,.78);background:linear-gradien
gra/src/ui/hexContextTooltip.ts:924 | behawioralna | -1/+4 | NIEPRZYPISANY | const activeName = active.commanderTitle
gra/src/ui/newGameFlow.ts:243 | komentarz | -0/+5 | R-WEB-NEWGAME-DEFAULTS-Q1 | /**
gra/src/ui/newGameFlow.ts:250 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | battleAlwaysManual: true,
gra/src/ui/newGameFlow.ts:252 | behawioralna | -4/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | buildingCostPace: 'normalny',
gra/src/ui/newGameFlow.ts:258 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | cityStateDifficultyOverride: 'normal',
gra/src/ui/newGameFlow.ts:670 | behawioralna | -0/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | cityStateDifficulty: 'TM',
gra/src/ui/newGameFlow.ts:673 | behawioralna | -0/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | barbariansLevel: 'Ba',
gra/src/ui/newGameFlow.ts:687 | behawioralna | -0/+5 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | /** Klucze mające dedykowaną ikonę SVG (setting-icon-map.json); pozostałe → glif tekstowy.
gra/src/ui/newGameFlow.ts:693 | behawioralna | -2/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | if (SETTING_SVG_KEYS.has(key)) {
gra/src/ui/newGameFlow.ts:982 | behawioralna | -0/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | .civ-newgame .civ-matrix-cell>summary{cursor:pointer;list-style:none;}
gra/src/ui/newGameFlow.ts:1128 | behawioralna | -1/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | .civ-newgame .adv-close{background:rgba(201,168,76,.1);border:1.5px solid var(--bd-strong)
gra/src/ui/newGameFlow.ts:1234 | behawioralna | -1/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | const row = document.createElement('details');
gra/src/ui/newGameFlow.ts:1246 | behawioralna | -1/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | const summary = document.createElement('summary');
gra/src/ui/newGameFlow.ts:1254 | behawioralna | -1/+6 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | const chevron = el('span', 'civ-matrix-cell-chevron', '⌄');
gra/src/ui/newGameFlow.ts:1266 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | body.appendChild(meta);
gra/src/ui/newGameFlow.ts:1271 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | body.appendChild(status);
gra/src/ui/newGameFlow.ts:1275 | behawioralna | -1/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | body.appendChild(explanation);
gra/src/ui/newGameFlow.ts:1282 | komentarz | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | * Pełny profil parametrów w kroku wyboru cywilizacji; liczba pól pochodzi z danych macierz
gra/src/ui/newGameFlow.ts:1284 | komentarz | -3/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | * Każdy parametr ma własny natywny `<details>` i jest domyślnie zwinięty;
gra/src/ui/newGameFlow.ts:1300 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | `${profile.parameterCount} wskaźników · mediana wszystkich 15 cywilizacji · aktywne domyśl
gra/src/ui/newGameFlow.ts:1633 | behawioralna | -0/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 | // R-WEB-NEWGAME-DEFAULTS-Q1: typ Ziemia = szablon bez suwaka udziału lądu (decyzja właści
gra/src/ui/newGameFlow.ts:1637 | behawioralna | -2/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | {
gra/src/ui/newGameFlow.ts:1641 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | row.innerHTML = '<div class="srow-hdr"><div class="srow-ic">' + settingIcon(key) + '</div>
gra/src/ui/newGameFlow.ts:1710 | behawioralna | -1/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | /** Pozycje głównej siatki kroku 4 spoza SETT (ui-params). Kolejność bez znaczenia —
gra/src/ui/newGameFlow.ts:1713 | behawioralna | -16/+0 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | (usuniecie)
gra/src/ui/newGameFlow.ts:1717 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | hint: 'Reszta to morze. Domyślnie: 30% lądu we wszystkich typach świata z suwakiem (Kontyn
gra/src/ui/newGameFlow.ts:1745 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | hint: 'Zaufanie startowe, próg sojuszu sióstr i posiłki obronne miast-państw — niezależnie
gra/src/ui/newGameFlow.ts:1759 | behawioralna | -8/+0 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | (usuniecie)
gra/src/ui/newGameFlow.ts:1775 | behawioralna | -0/+5 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | ];
gra/src/ui/newGameFlow.ts:1781 | behawioralna | -12/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | key: 'ruchSwiataPace',
gra/src/ui/newGameFlow.ts:1786 | behawioralna | -2/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | if (advOpts.ruchSwiataPace === 'normalny') return 1;
gra/src/ui/newGameFlow.ts:1791 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | advOpts.ruchSwiataPace = i === 1 ? 'normalny' : i === 2 ? 'dlugi' : 'krotki';
gra/src/ui/newGameFlow.ts:1795 | behawioralna | -4/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | key: 'cityLimitBase',
gra/src/ui/newGameFlow.ts:1800 | behawioralna | -3/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | const limits = [10, 15, 20];
gra/src/ui/newGameFlow.ts:1805 | behawioralna | -1/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | const limits = [10, 15, 20];
gra/src/ui/newGameFlow.ts:1809 | behawioralna | -0/+12 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | {
gra/src/ui/newGameFlow.ts:1836 | behawioralna | -4/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | key: 'buildingCostPace',
gra/src/ui/newGameFlow.ts:1841 | behawioralna | -2/+2 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | if (advOpts.buildingCostPace === 'normalny') return 1;
gra/src/ui/newGameFlow.ts:1846 | behawioralna | -1/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | advOpts.buildingCostPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski';
gra/src/ui/newGameFlow.ts:1850 | behawioralna | -4/+4 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | key: 'kosztJednostekPace',
gra/src/ui/newGameFlow.ts:1855 | behawioralna | -3/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | if (advOpts.kosztJednostekPace === 'normalny') return 1;
gra/src/ui/newGameFlow.ts:1860 | behawioralna | -2/+1 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | advOpts.kosztJednostekPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski';
gra/src/ui/newGameFlow.ts:1863 | behawioralna | -0/+15 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | advRowFromSett('map_quality', 'Jakość renderu mapy 3D — niska / średnia / wysoka (GPU).'),
gra/src/ui/newGameFlow.ts:1907 | behawioralna | -3/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | // Pozycje przeniesione do głównej siatki kroku 4 nie są już w tej liście
gra/src/ui/newGameFlow.ts:1942 | behawioralna | -1/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | // „Zastosuj” = zapis wartości (saveNewGamePrefs w hideAdvancedModal) + zamknięcie okna.
gra/src/ui/newGameFlow.ts:2030 | komentarz | -0/+3 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | // Siatka 2 kolumny, wypełniana rzędami: [lewa1, prawa1, lewa2, prawa2, …].
gra/src/ui/newGameFlow.ts:2034 | behawioralna | -2/+6 | R-WEB-NEWGAME-DEFAULTS-Q1 (wg pliku) | 'map_size', 'civ_types_count',
```

*Koniec dokumentu. Nic w tym pliku nie jest zmianą kodu.*
