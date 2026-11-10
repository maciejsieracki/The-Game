# REPIN-DELTA-3 — pomiar delty `dc8a3adc` → `4bbef081d`

**Temat:** R-RUSTPORT-REPIN-DELTA-3-Q1 · **Typ:** dokumentacja/pomiar, ZERO zmian kodu · **Data:** 2026-10-31 · **Wersja dokumentu:** runda 3/5 (Operator r3)
**Pin stary:** `dc8a3adc` (`docs(autobot): close manual battle validation`) · **Pin nowy:** `4bbef081d` (`docs(wersje): ROBOCZA d205f607`, `origin/main`)

**Źródło danych:** `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-3-Q1/hunki-r2.tsv` (541 wierszy: plik, linia w `4bbef081d`, liczba linii, klasa, właściciel z `git blame`, linie kodu, pierwsza zmieniona linia). Narzędzia pomiarowe: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-3-Q1/tools/` (`classify3.mjs`, `final.mjs`, `impact.mjs`, `copies.mjs`, `manifest.mjs`).

**Komendy pomiaru:**
- `git diff --name-only dc8a3adc 4bbef081d -- gra/src gra/data` → 47 plików (`+4859 / -839`)
- `git diff -U0 dc8a3adc 4bbef081d -- gra/src gra/data | grep -c '^@@'` → 541 hunków
- właściciel: `git blame` linii wprowadzonych w `4bbef081d` względem `dc8a3adc` (commit wprowadzający → tag tematu w temacie commita; gdy brak tagu R-, dopasowanie słów kluczowych; gdy commit sprzed `dc8a3adc`, temat tego commita)

## 1. Przypisanie plików: klasa, moduł Rust, temat docelowy

Liczby z TSV. Kolumna „Moduł Rust” jest ZAŁOŻENIEM (propozycją), nie rozstrzygnięciem: moduły w `rust-port/engine/src/domain/*` to barbarians, building_costs, combat, error, hex, ids, improvements, map_generator, mod, player, recruitment, resource_production, rng, session, state, terrain, types, unit_epoch. Brak modułów dla dyplomacji, terytorium/fortów, wojny wymuszonej, AI i zapisu hot-seat. „brak (frontend)” oznacza kod `gra/` bez odpowiednika w porcie.

Temat docelowy: 384 hunki mają tag R- w temacie commita, 53 dopasowano po słowach kluczowych tematu (oznaczone „wg słów kluczowych”), 4 pochodzą z commitów sprzed `dc8a3adc` scalonych po nim (bez tagu R-, bez ustalenia), a **100 hunków należy do commitów bez tagu R- i bez dopasowania** — zgodnie z decyzją orkiestratora są oznaczone „wg pliku, bez ustalenia” i nie mają zgadniętego tematu. Nowy temat `R-WEB-UI-EMBLEM-TOOLTIP-Q1` (zatwierdzony przez orkiestratora jako PROPOZYCJA, bez startu) obejmuje wg zakresu pliki `render/unitOwnerEmblem.ts` (14 hunków) i `ui/hexContextTooltip.ts` (5 hunków) — tam, gdzie w tabeli stoi „wg pliku, bez ustalenia”, właściwym kandydatem na temat docelowy jest ten zatwierdzony temat propozycyjny; jego przypisanie wymaga decyzji orkiestratora.

Wynik kryterium „zero symboli bez właściciela”: **NIEPRZYPISANY = 0** (każdy hunk ma właściciela z blame lub oznaczenie wg pliku). Kryterium „każdy zmieniony plik ma temat docelowy” jest spełnione w tym sensie, że każdy plik ma co najmniej jednego właściciela; pliki z samymi wierszami „wg pliku, bez ustalenia” są w tabeli wprost oznaczone.

| Plik | Hunków | Klasy: kod / kod+kom. / nazwa-tekst / komentarz / import+typ / bez-kodu / pusty | Moduł Rust (ZAŁOŻENIE) | Temat docelowy wg blame (liczba hunków) |
|---|---:|---|---|---|
| `gra/src/main.ts` | 169 | 77 / 80 / 0 / 7 / 4 / 0 / 1 | brak (frontend) | R-WEB-ERA-WAR-COUNTER (27); R-WEB-TRUCE (21); R-WEB-PEACE-RULES (20); R-WEB-OUTPOST-FORT-TERRITORY (15); R-WEB-WAR-AGGRESSOR-FLAG (13); R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) (12); R-WEB-PEACE-CITY-CESSION (12); R-WEB-PEACE-RULES-R8R9 (8); wg pliku, bez ustalenia (8); R-WEB-TRUCE-E2E-SAVELOAD-MEASURE (6); R-WEB-CITY-CLEARS-FOREST (5); R-WEB-DEFEAT-LAST-CITY-BARBARIANS (4); R-WEB-PEACE/WAR (wg słów kluczowych) (2); R-EPOKA-ZELAZO-WYMUSZONA-WOJNA (2); R-WEB-AUTO-FORT-CLAIM (2); R-WEB-DIPLO-TICK-WAR-BRAKE (2); R-WEB-SAVELOAD-PRACA-POOL (2); R-WEB-SAVELOAD-HOTSEAT-PRACA (2); R-WEB-AUTOIMPROVE-STAGES (2); R-WEB-AGGRESSOR-MARKER (1); R-WEB-WAR-RULES-RELEASE-ROBOCZA (1); R-LISTA-NAZWANA (1); R-WEB-HOTSEAT-HUD-CACHE (1) |
| `gra/src/game/auto-improvements.ts` | 50 | 18 / 24 / 0 / 6 / 2 / 0 / 0 | brak (automat frontendu); kandydat `improvements.rs` tylko dla katalogu | R-WEB-AUTOIMPROVE (wg słów kluczowych) (19); R-WEB-AUTOIMPROVE-STAGES (12); wg pliku, bez ustalenia (11); R-WEB-AUTO-FORT-CLAIM (4); R-WEB-AUTOIMPROVE-PRIORITY (2); scalony sprzed dc8, bez tagu R- (bez ustalenia) (1); R-AI-WYRAB-PRZY-RZECE-FARMY (1) |
| `gra/src/ui/newGameFlow.ts` | 46 | 30 / 5 / 7 / 4 / 0 / 0 / 0 | brak (frontend) | R-WEB-NEWGAME-MENU-REORDER (25); wg pliku, bez ustalenia (10); R-WEB-NEWGAME-DEFAULTS (7); R-WEB-NEWGAME-ADV-APPLY-BTN (2); scalony sprzed dc8, bez tagu R- (bez ustalenia) (2) |
| `gra/src/game/ai.ts` | 33 | 9 / 15 / 0 / 3 / 3 / 3 / 0 | brak (frontend) | R-WEB-AUTOIMPROVE (wg słów kluczowych) (6); R-WEB-PEACE-RULES (6); R-WEB-WAR-AGGRESSOR-FLAG (6); R-WEB-AUTOIMPROVE-STAGES (5); R-WEB-PEACE-CITY-CESSION (5); R-WEB-AUTO-FORT-CLAIM (2); R-WEB-TRUCE (2); scalony sprzed dc8, bez tagu R- (bez ustalenia) (1) |
| `gra/src/game/citizen-resource-upkeep.ts` | 26 | 10 / 4 / 0 / 10 / 0 / 2 / 0 | kandydat `resource_production.rs` | wg pliku, bez ustalenia (23); R-WEB-CITIZEN-UPKEEP-ERA-MULT (3) |
| `gra/src/ui/diplomacyTradeBasket.ts` | 25 | 9 / 14 / 0 / 0 / 0 / 2 / 0 | brak (frontend) | R-WEB-PEACE-CITY-CESSION (16); R-WEB-TRUCE (9) |
| `gra/src/game/diplomacy-proposals.ts` | 22 | 9 / 10 / 0 / 1 / 2 / 0 / 0 | brak (frontend) | R-WEB-TRUCE (11); R-WEB-WAR-AGGRESSOR-FLAG (5); R-WEB-PEACE-RULES (3); R-WEB-PEACE-CITY-CESSION (3) |
| `gra/data/terrain-improvements.json` | 15 | 4 / 0 / 11 / 0 / 0 / 0 / 0 | kandydat `improvements.rs` (katalog) | R-WEB-OUTPOST-FORT-TERRITORY (7); R-WEB-AUTOIMPROVE-STAGES (6); R-WEB-AUTOIMPROVE (wg słów kluczowych) (2) |
| `gra/src/game/turn-economy.ts` | 15 | 12 / 2 / 0 / 0 / 1 / 0 / 0 | kandydat `resource_production.rs` / `building_costs.rs` | wg pliku, bez ustalenia (14); R-WEB-SPICHLERZ-DRAIN-KEYS (1) |
| `gra/src/render/unitOwnerEmblem.ts` | 14 | 10 / 2 / 0 / 1 / 0 / 1 / 0 | brak (frontend) | wg pliku, bez ustalenia (14) |
| `gra/src/game/forced-war-common.ts` | 11 | 5 / 5 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE-RULES-R8R9 (7); R-WEB-ERA-WAR-COUNTER (4) |
| `gra/src/game/building-resource-gate.ts` | 10 | 8 / 1 / 0 / 0 / 0 / 1 / 0 | kandydat `building_costs.rs` | wg pliku, bez ustalenia (8); R-WEB-SPICHLERZ-HUD-PARAMS (2) |
| `gra/src/map/territory.ts` | 9 | 2 / 4 / 0 / 3 / 0 / 0 / 0 | brak (frontend) | R-WEB-OUTPOST-FORT-TERRITORY (7); R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) (2) |
| `gra/src/game/diplomacy.ts` | 8 | 1 / 4 / 0 / 0 / 1 / 2 / 0 | brak (frontend) | R-WEB-WAR-AGGRESSOR-FLAG (6); R-WEB-PEACE-RULES (2) |
| `gra/src/game/diplomacy-pn-engine.ts` | 6 | 2 / 0 / 0 / 0 / 1 / 3 / 0 | brak (frontend) | R-WEB-PEACE-CITY-CESSION (5); R-WEB-TRUCE (1) |
| `gra/src/game/diplomacy-value-catalog.ts` | 6 | 2 / 3 / 0 / 0 / 0 / 1 / 0 | brak (frontend) | R-WEB-PEACE-CITY-CESSION (6) |
| `gra/src/game/victory.ts` | 6 | 1 / 1 / 0 / 3 / 0 / 1 / 0 | brak (kandydat `state.rs` / `session.rs`) | R-WEB-DEFEAT-LAST-CITY-BARBARIANS (6) |
| `gra/src/game/fort-territory.ts` | 5 | 0 / 3 / 0 / 1 / 1 / 0 / 0 | brak (frontend) | R-WEB-OUTPOST-FORT-TERRITORY (3); R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) (2) |
| `gra/src/ui/hexContextTooltip.ts` | 5 | 4 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | wg pliku, bez ustalenia (5) |
| `gra/src/game/forced-war-bronze.ts` | 4 | 1 / 2 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) (2); R-WEB-PEACE/WAR (wg słów kluczowych) (1); R-WEB-PEACE-RULES-R8R9 (1) |
| `gra/src/game/war-rules-multiwar.ts` | 4 | 1 / 1 / 0 / 1 / 0 / 1 / 0 | brak (frontend) | R-WEB-ERA-WAR-COUNTER (4) |
| `gra/src/ui/empireDetailPanel.ts` | 4 | 1 / 1 / 1 / 1 / 0 / 0 / 0 | brak (frontend) | wg pliku, bez ustalenia (4) |
| `gra/data/ai-params.json` | 3 | 0 / 0 / 3 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE-RULES (3) |
| `gra/data/econ-params.json` | 3 | 0 / 0 / 3 / 0 / 0 / 0 / 0 | kandydat `building_costs.rs` / `resource_production.rs` | R-WEB-SPICHLERZ-DRAIN-KEYS (3) |
| `gra/src/game/city-hex-clear.ts` | 3 | 2 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-CITY-CLEARS-FOREST (3) |
| `gra/src/game/forced-war-iron.ts` | 3 | 1 / 1 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-EPOKA-ZELAZO-WYMUSZONA-WOJNA (2); R-WEB-PEACE-RULES-R8R9 (1) |
| `gra/src/game/forced-war-stone.ts` | 3 | 1 / 1 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE/WAR (wg słów kluczowych) (2); R-WEB-PEACE-RULES-R8R9 (1) |
| `gra/src/map/improvement-build.ts` | 3 | 0 / 0 / 0 / 3 / 0 / 0 / 0 | kandydat `improvements.rs` | R-WEB-AUTOIMPROVE-STAGES (3) |
| `gra/src/ui/cityPanel.ts` | 3 | 1 / 2 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-SPICHLERZ-HUD-PARAMS (3) |
| `gra/src/ui/diplomacyNegotiationModal.ts` | 3 | 1 / 1 / 0 / 0 / 0 / 1 / 0 | brak (frontend) | R-WEB-TRUCE (2); R-WEB-PEACE-CITY-CESSION (1) |
| `gra/src/ui/diplomacyPanel.ts` | 3 | 1 / 1 / 0 / 0 / 0 / 1 / 0 | brak (frontend) | R-WEB-AGGRESSOR-MARKER (3) |
| `gra/data/citizen-resource-upkeep.json` | 2 | 1 / 0 / 1 / 0 / 0 / 0 / 0 | kandydat `resource_production.rs` | wg pliku, bez ustalenia (2) |
| `gra/data/war-rules-params.json` | 2 | 1 / 0 / 1 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-ERA-WAR-COUNTER (2) |
| `gra/src/game/diplomacy-war-gates.ts` | 2 | 0 / 1 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-WEB-TRUCE (2) |
| `gra/src/game/terrain-improvements.ts` | 2 | 0 / 0 / 0 / 2 / 0 / 0 / 0 | kandydat `improvements.rs` / `resource_production.rs` | R-WEB-AUTOIMPROVE (wg słów kluczowych) (2) |
| `gra/src/map/newGameMapDefaults.ts` | 2 | 1 / 0 / 0 / 1 / 0 / 0 / 0 | brak (frontend) | R-WEB-NEWGAME-DEFAULTS (2) |
| `gra/data/diplomacy-acceptance-points.json` | 1 | 1 / 0 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-TRUCE (1) |
| `gra/data/diplomacy-aggressor-params.json` | 1 | 1 / 0 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-WAR-AGGRESSOR-FLAG (1) |
| `gra/data/diplomacy-war-peace-params.json` | 1 | 1 / 0 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE-RULES (1) |
| `gra/data/tech.json` | 1 | 0 / 0 / 1 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-OUTPOST-FORT-TERRITORY (1) |
| `gra/data/ui-params.json` | 1 | 0 / 0 / 1 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-NEWGAME-MENU-REORDER (1) |
| `gra/src/battle/battleScene.ts` | 1 | 0 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-BATTLE-STANDOFF-TWO-WARRIORS (1) |
| `gra/src/data/wikiBundle.json` | 1 | 0 / 0 / 1 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) (1) |
| `gra/src/game/diplomacy-peace-lock.ts` | 1 | 0 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-TRUCE (1) |
| `gra/src/game/diplomacy-tick-war-brake.ts` | 1 | 0 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE-RULES (1) |
| `gra/src/game/diplomacy-war-peace-profile.ts` | 1 | 0 / 1 / 0 / 0 / 0 / 0 / 0 | brak (frontend) | R-WEB-PEACE-RULES (1) |
| `gra/src/ui/empireDetailTypes.ts` | 1 | 0 / 0 / 0 / 0 / 0 / 1 / 0 | brak (frontend) | wg pliku, bez ustalenia (1) |

## 2. Behawioralne zmiany do przeniesienia (lista r1, wskazania orientacyjne)

Lista z pomiaru r1 (heurystyka, `4bbef081d`). Autorytatywne dane per hunk: TSV i §6. Liczby w tej sekcji są przeniesione z r1 bez ponownej weryfikacji hunk po hunku w r3.

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

## 3. Wpływ na tematy w toku (pomiar r2, ID ustalone)

Identyfikatory 8I/8I2/8H2/8A/8G pochodzą z GOAL dispatchy na gałęziach (`e73e88b3a` 8G, `eecf85585` 8A+8J, `edb9bdd24` 8H2+8I, `a068167c9` 8H2 r3, `ce0d40717` 8I2). Liczenie hunków delty na zakres symboli (`impact.mjs`, wartości w `4bbef081d`, pomiar r2 `a89edaa80`; r3 nie powtarzało pomiaru).

| Temat | Zakres (symbole / pliki) | Hunki delty `dc8→4bbef` | Wpływ | Rekomendacja |
|---|---|---:|---|---|
| 8G | `okolica.ts` (cały plik) | **0** (plik poza deltą) | brak | bez zmian w kolejności |
| 8A | `production.ts` (`epochNumber`, `itemCost`, `buildingProductionItem`, `unitProductionItem`, `buildingLocationAllowed`), `building-upgrades.ts`, `pending-improvements.ts` | **0** | brak | bez zmian w kolejności |
| 8H2 | `resource-access.ts` (cały plik), `society-inputs.ts` (`isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`), `placedImprovementsWithZlotoTradeGrant` w `main.ts` | **0** | brak | bez zmian w kolejności |
| 8I (P1: typy, stałe, helpery, 14 symboli) | `auto-improvements.ts` | **4** (linie 75, 130, 171, 407) | wysoki | aktualizować po punktach 1–2 z §3a (zob. niżej) |
| 8I2 (P2 `pickAutoImprovements`) | `auto-improvements.ts`, linie 765–988 | **11** | wysoki | razem z 8I; ten sam temat |

Razem wpływ na tematy w toku: **15 hunków** (8I + 8I2); pozostałe wymienione tematy 0 hunków. Pozostałe tematy w toku (poza listą dispatchu, wg tagu w TSV) — patrz §1.

**Wojna, pokój, rozejm i era-war (bez tematu z dispatchu):** **236 hunków** wg tagów: R-WEB-TRUCE 50, R-WEB-PEACE-CITY-CESSION 48, R-WEB-PEACE-RULES 37, R-WEB-ERA-WAR-COUNTER 37, R-WEB-WAR-AGGRESSOR-FLAG 31, R-WEB-PEACE-RULES-R8R9 18, R-WEB-PEACE/WAR (wg słów kluczowych) 5, R-EPOKA-ZELAZO-WYMUSZONA-WOJNA 4, R-WEB-AGGRESSOR-MARKER 4, R-WEB-DIPLO-TICK-WAR-BRAKE 2. Z nich **204 hunki mają linie kodu**. Wyłączone z liczenia: tagi `E2E`/`SAVELOAD` (6), `NEWGAME`, `BATTLE`/`RELEASE-ROBOCZA`. Zastępuje przybliżenie „ok. 150–200” z r1. Brak modułu dyplomacji w `domain/` — decyzja o zakresie portu przed aktualizacją.

**Forty/terytorium:** R-WEB-OUTPOST-FORT-TERRITORY 33 hunki + 19 wg słów kluczowych (= 52), R-WEB-AUTO-FORT-CLAIM 8 hunków; w tym `main.ts` 15 + 12 (wg słów kluczowych) + 2 (AUTO-FORT-CLAIM). Brak modułu terytorium w `domain/`.

**Pozostałe tagi (wg TSV):** R-WEB-SPICHLERZ-* (DRAIN-KEYS 4, HUD-PARAMS 5) plus 22 hunki bez tagu R- w `building-resource-gate.ts`/`turn-economy.ts` (wg pliku, bez ustalenia); R-WEB-CITIZEN-UPKEEP-ERA-MULT 3 plus 25 hunków bez tagu w `citizen-resource-upkeep.ts`/`.json` (wg pliku, bez ustalenia); R-WEB-BATTLE-STANDOFF-TWO-WARRIORS 1 (`battleScene.ts`); R-WEB-SAVELOAD-PRACA-POOL 2, R-WEB-SAVELOAD-HOTSEAT-PRACA 2, R-WEB-HOTSEAT-HUD-CACHE 1 (zapis/hot-seat).

### 3a. Rekomendowana kolejność aktualizacji (jedna wersja, bez sprzeczności)

1. Dane i parametry (`econ-params.json`, `citizen-resource-upkeep.json`, `terrain-improvements.json`, `ai-params.json`, `war-rules-params.json`) — ta sama źródłowa prawda, łatwa weryfikacja wartości.
2. Ekonomia: Spichlerz (`building-resource-gate.ts`, `turn-economy.ts`) i stawka per epoka (`citizen-resource-upkeep.ts`) → `resource_production.rs` / `building_costs.rs` (ZAŁOŻENIE).
3. Forty/terytorium (`territory.ts`, `fort-territory.ts`) — decyzja portu o module terytorium.
4. Auto-ulepszenia 8I/8I2 (15 hunków w `auto-improvements.ts`) — po punktach 1–2.
5. Wojna/pokój/rozejm/era-war (236 hunków) — po decyzji o zakresie dyplomacji w porcie.
6. Zapis hot-seat, HUD, bitwa — UI/zapis, poza `domain/`.

## 4. Dryf bloków cityPanel K01–K09 i kopii frontend-v2 (pomiar r2 `a89edaa80`)

Narzędzia pochodzą z gałęzi `parity-v2` (`db102531`, `origin/rust-port/parity-v2`), uruchomienia w r2. Brak zakresów linii dla pinu `dc8a3adc` w narzędziach K08E i K09A — wyniki z tym pinem są **nieważne** i nie są podawane jako pomiar; zastąpiono je pomiarem po nazwie funkcji.

| Blok | Metoda / pin | Wynik |
|---|---|---|
| K08D | `measure-k08d-drift`, pin `dc8a3adc` → `4bbef081d` | **11/11 IDENTYCZNE** |
| K08D | pin `edb8fb56` → `4bbef081d` | 2/11 zmienione: `buildHandelDetailCard`, `buildWealthDetailCard` (jak w REPIN-DELTA-2) |
| K08E | `measure-k08e-drift`, pin `edb8fb56` → main | 11 SAME, 1 DRIFT(1): `buildTopBarRekruciDetailCard`; pin `dc8a3adc`: **nieważny** |
| K09A | `measure-k09a-drift`, pin `edb8fb56` → main | **9/9 SAME**; pin `dc8a3adc`: **nieważny** |
| cityPanel, po nazwie funkcji | `copies.mjs`, `dc8a3adc` → `4bbef081d` | 2 zmienione z 306 funkcji: `computeView` (K03), `appendOwnedBuildingRow` (K06B); żadna z 9 jednostek K09A, 11 K08D, 12 K08E nie dryfuje w tym kroku |
| K01–K07, K08A–C | brak narzędzia blokowego na pinie `dc8a3adc` | **NIE_ZMIERZONO (blokowo)**; wyłącznie stwierdzenie „funkcja zmieniona” z pozycji powyżej |
| kopie frontend-v2 | `manifest.mjs`, 435 wpisów, sha256 względem `gra/` w `4bbef081d` i `dc8a3adc` | **431 identycznych, 2 rozjechane** (`src/ui/armyMergePanel.ts`, `src/ui/unitActionBarHtml.ts`) — identyczny wynik dla obu pinów; dryf powstał wcześniej (`edb→dc8`); 2 wpisy poza `src/`/`data/` nieporównane |

Wpływ delty `dc8→4bbef` na kopie frontend-v2: **0** hunków (wynik identyczny dla obu pinów).

## 5. Wiarygodność i ograniczenia pomiaru

- Klasyfikacja hunków jest heurystyczna (regex na liniach): `kod` 229, `kod+komentarz` 194, `nazwa/tekst` 30, `komentarz` 52, `import` 13, `typ` 2, `bez-kodu` (docblock + pole typu, np. `ai.ts:410`) 20, `pusty` 1 (suma 541). Hunki z przynajmniej jedną linią kodu: **453** (= kod + kod+komentarz + nazwa/tekst). Klasyfikacja jest odtwarzalna z TSV.
- Właściciel hunka = commit z `git blame`, który wprowadził jego nowe linie. Dla 100 hunków commit nie ma tagu R- i nie ma dopasowania słów kluczowych: oznaczenie „wg pliku, bez ustalenia” zgodnie z decyzją orkiestratora (bez zgadywania tematu). To jest jawna luka, nie zamknięta przypisaniem.
- Owner-tagi wojna/pokój (236) zliczono regexem po temacie commita; wyniki są z `final.mjs` z r2.
- Testy i bramki: nie uruchamiano `npm run build`/`dev` (zakaz dispatchu), nie uruchamiano testów gry — pomiar dokumentacyjny, zero zmian kodu.
- Bramka dyscypliny (`git diff --check`): patrz §7.

## 6. Appendix — wszystkie 541 hunków (plik:linia, klasa, n/linie kodu, właściciel)

Źródło: `hunki-r2.tsv` (kolumna „pierwsza zmieniona linia” skrócona do 80 znaków). Właściciel wg §1 (bez „wg pliku” jako dowodu właściciela).

| plik:linia (4bbef081d) | klasa | n / linie kodu | właściciel (blame / wg pliku) | pierwsza zmieniona linia (skrót) |
|---|---|---|---|---|
| `gra/data/ai-params.json:285` | nazwa/tekst | 1 / 2 | R-WEB-PEACE-RULES | `opis: "NIEAKTYWNY (R-WEB-PEACE-RULES-Q1 R10): nieczytany w kodzie; zastapiony pr` |
| `gra/data/ai-params.json:290` | nazwa/tekst | 1 / 2 | R-WEB-PEACE-RULES | `opis: "NIEPODLACZONY (R-WEB-PEACE-RULES-Q1 R10): brak limitu propozycji AI na tu` |
| `gra/data/ai-params.json:295` | nazwa/tekst | 1 / 2 | R-WEB-PEACE-RULES | `opis: "Próg zdrowia armii AI (Σ hp / Σ hpMax jednostek bojowych) poniżej którego` |
| `gra/data/citizen-resource-upkeep.json:2` | nazwa/tekst | 1 / 2 | wg pliku, bez ustalenia | `_opis: "R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (Maciej 2026-10-31, decyzja „co do wyma` |
| `gra/data/citizen-resource-upkeep.json:10` | kod | 3 / 6 | wg pliku, bez ustalenia | `{ "epoka": 1, "nazwa": "Kamień", "stawkaNaObywatela": 1, "surowce": ["drewno", "` |
| `gra/data/diplomacy-acceptance-points.json:5` | kod | 1 / 1 | R-WEB-TRUCE | `rozejm: { "punkty": 200, "jednostka": "umowa", "uwaga": "R-WEB-TRUCE-Q1 ZAŁOŻENI` |
| `gra/data/diplomacy-aggressor-params.json:1` | kod | 16 / 16 | R-WEB-WAR-AGGRESSOR-FLAG | `{` |
| `gra/data/diplomacy-war-peace-params.json:1` | kod | 97 / 97 | R-WEB-PEACE-RULES | `{` |
| `gra/data/econ-params.json:388` | nazwa/tekst | 1 / 2 | R-WEB-SPICHLERZ-DRAIN-KEYS | `opis: "PYTANIE-84-B6 (Maciej 2026-07-27): Spichlerz I zużywa Ceramikę ze skarbca` |
| `gra/data/econ-params.json:395` | nazwa/tekst | 1 / 2 | R-WEB-SPICHLERZ-DRAIN-KEYS | `opis: "PYTANIE-84-B7/U-2 (Maciej 2026-07-27): Spichlerz II zużywa Sól ze skarbca` |
| `gra/data/econ-params.json:402` | nazwa/tekst | 1 / 2 | R-WEB-SPICHLERZ-DRAIN-KEYS | `opis: "PYTANIE-84-B8 (Maciej 2026-07-27): Spichlerz II zużywa Ceramikę ze skarbc` |
| `gra/data/tech.json:360` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `Uwagi: "Fort = NOWY budynek (obrona terenu, zasięg 5, +100% obrona przy obozowan` |
| `gra/data/terrain-improvements.json:8` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg model` |
| `gra/data/terrain-improvements.json:54` | nazwa/tekst | 3 / 6 | R-WEB-AUTOIMPROVE-STAGES | `surowiecOdblokowany_uwaga: "R-WEB-AUTOIMPROVE-STAGES-Q1 (Q1 właściciela 2026-10-` |
| `gra/data/terrain-improvements.json:60` | nazwa/tekst | 1 / 2 | R-WEB-AUTOIMPROVE-STAGES | `uwagi: "R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (2026-09-03): tekst gracza w `` |
| `gra/data/terrain-improvements.json:72` | nazwa/tekst | 3 / 6 | R-WEB-AUTOIMPROVE-STAGES | `surowiecOdblokowany_uwaga: "solo na wzgórzu; bez farmy/bydła; NIE wymaga złoża o` |
| `gra/data/terrain-improvements.json:78` | nazwa/tekst | 1 / 2 | R-WEB-AUTOIMPROVE-STAGES | `uwagi: "R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (2026-09-03): tekst gracza w `` |
| `gra/data/terrain-improvements.json:91` | nazwa/tekst | 1 / 2 | R-WEB-AUTOIMPROVE-STAGES | `surowiecOdblokowany_uwaga: "TYLKO Inkowie; solo — bez innych ulepszen na heksie;` |
| `gra/data/terrain-improvements.json:93` | nazwa/tekst | 1 / 2 | R-WEB-AUTOIMPROVE-STAGES | `warunek: "tylko cywilizacja Inków; wzgórza i góry, także z nakładką Lasu; bez zł` |
| `gra/data/terrain-improvements.json:145` | kod | 2 / 4 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamień' w resources.json` |
| `gra/data/terrain-improvements.json:203` | kod | 2 / 4 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ul` |
| `gra/data/terrain-improvements.json:277` | kod | 3 / 6 | R-WEB-OUTPOST-FORT-TERRITORY | `zasieg_pol: 5,` |
| `gra/data/terrain-improvements.json:281` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `warunek: "+100% Obrony jednostkom obozującym na polu fortu (bez plonów); tworzy ` |
| `gra/data/terrain-improvements.json:285` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `uwagi: "ABC-10 Maciej 2026-07-04: Fort (mapa) ≠ Cytadela (miasto). Żelazo ep.3; ` |
| `gra/data/terrain-improvements.json:401` | kod | 2 / 4 | R-WEB-OUTPOST-FORT-TERRITORY | `zasieg_pol: 3,` |
| `gra/data/terrain-improvements.json:404` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `warunek: "NIE miasto, BEZ plonów; tworzy teren zabezpieczony pod Twoją cywilizac` |
| `gra/data/terrain-improvements.json:409` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `uwagi: "Brąz (epoka 2); zasieg_terytorium=3 (od 2026-10-31, było 5); +50% Obrona` |
| `gra/data/ui-params.json:178` | nazwa/tekst | 1 / 2 | R-WEB-NEWGAME-MENU-REORDER | `label: "Wojna epoki",` |
| `gra/data/war-rules-params.json:2` | nazwa/tekst | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `_opis: "R-WEB-WAR-RULES-MULTIWAR-Q1 r3 (regula TYMCZASOWA, flaga WAR_RULES_MULTI` |
| `gra/data/war-rules-params.json:6` | kod | 3 / 4 | R-WEB-ERA-WAR-COUNTER | `maxEraForcedWarsPerEra: null,` |
| `gra/src/battle/battleScene.ts:3465` | kod+komentarz | 7 / 2 | R-WEB-BATTLE-STANDOFF-TWO-WARRIORS | `// R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 (R3): ZAWSZE true. `_kickoffBattleTurn`` |
| `gra/src/data/wikiBundle.json:1` | nazwa/tekst | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `{"version":"rev-civpedia-2026-08-05","generated":"2026-09-05","poradnik":[{"id":` |
| `gra/src/game/ai.ts:41` | import | 1 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `import { canFoundCity, MAX_PROCENT_NAUKA, AI_FIXED_PROCENT_BUDYNKI, AI_FIXED_PRO` |
| `gra/src/game/ai.ts:69` | import | 1 / 0 | R-WEB-PEACE-RULES | `import { resolveWarPeaceProfile, aiPeaceSignals, isFeelingStronger, type WarPeac` |
| `gra/src/game/ai.ts:72` | kod | 3 / 3 | R-WEB-AUTOIMPROVE-STAGES | `IMPROVEMENT_FOR_DEFICIT,` |
| `gra/src/game/ai.ts:410` | bez-kodu(komentarz/typ/import) | 6 / 0 | R-WEB-AUTO-FORT-CLAIM | `/**` |
| `gra/src/game/ai.ts:2419` | kod | 1 / 9 | R-WEB-AUTOIMPROVE-STAGES | `export const AI_IMPROVEMENT_FOR_DEFICIT: Readonly<Record<string, readonly Improv` |
| `gra/src/game/ai.ts:2601` | komentarz | 1 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// dozwolony udzial puli: 100% (R-WEB-AUTOIMPROVE-STAGES2-Q1, wlasciciel 2026-10` |
| `gra/src/game/ai.ts:2604` | kod | 1 / 2 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `: Math.floor(Math.max(0, pracaAvailable)); // AI/państwa-miasta: 100% puli, BEZ ` |
| `gra/src/game/ai.ts:2632` | kod | 0 / 3 | scalony sprzed dc8, bez tagu R- (bez ustalenia) | `const resourcePriority = fullPriority.filter(` |
| `gra/src/game/ai.ts:2644` | kod+komentarz | 2 / 2 | R-WEB-AUTOIMPROVE-STAGES | `// K3 = K2: tylko niedobory, na ktore istnieje ulepszenie terenu (zloto/stal nie` |
| `gra/src/game/ai.ts:2655` | kod+komentarz | 4 / 1 | R-WEB-AUTOIMPROVE-STAGES | `// R-WEB-AUTOIMPROVE-STAGES-Q1 R3, ABC-D=B (właściciel 2026-10-31): AI BEZ limit` |
| `gra/src/game/ai.ts:2662` | kod+komentarz | 4 / 2 | R-WEB-AUTO-FORT-CLAIM | `// R-WEB-AUTO-FORT-CLAIM-Q1 (K3 = K2): fort na cennym terenie dopiero przy WYCZE` |
| `gra/src/game/ai.ts:2686` | kod+komentarz | 2 / 1 | R-WEB-AUTOIMPROVE-STAGES | `// K3 = K2 (jedna logika w pickerze): brakujący surowiec idzie na przód, surowce` |
| `gra/src/game/ai.ts:2689` | kod+komentarz | 7 / 25 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R-WEB-AUTOIMPROVE-STAGES-Q1 R4 (właściciel 2026-10-31: „Niedobór ma tylko otw` |
| `gra/src/game/ai.ts:2769` | komentarz | 1 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// dozwolony udzial puli: 100% (R-WEB-AUTOIMPROVE-STAGES2-Q1, wlasciciel 2026-10` |
| `gra/src/game/ai.ts:2772` | kod | 1 / 2 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `: Math.floor(Math.max(0, pracaAvailable)); // AI/państwa-miasta: 100% puli, BEZ ` |
| `gra/src/game/ai.ts:5079` | import | 2 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `import { deltaRelacjiSojusz } from './diplomacy';` |
| `gra/src/game/ai.ts:5135` | kod+komentarz | 12 / 4 | R-WEB-TRUCE | `/**` |
| `gra/src/game/ai.ts:5186` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `/** R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner ma aktywną flagę agresora (main.ts: czy` |
| `gra/src/game/ai.ts:5267` | kod+komentarz | 29 / 1 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/game/ai.ts:5337` | bez-kodu(komentarz/typ/import) | 7 / 0 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/game/ai.ts:5394` | kod+komentarz | 62 / 38 | R-WEB-PEACE-CITY-CESSION | `/** R-WEB-PEACE-CITY-CESSION-Q1 r3: bazowy próg słabości AI do oddania miasta (r` |
| `gra/src/game/ai.ts:5458` | kod+komentarz | 11 / 4 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/game/ai.ts:5817` | kod+komentarz | 7 / 4 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R6: profil wojny/pokoju właściciela decyzji (brak danych` |
| `gra/src/game/ai.ts:5838` | kod+komentarz | 2 / 1 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R1: realny czas wojny z pary (dawniej stała 5 = martwa h` |
| `gra/src/game/ai.ts:5844` | kod | 1 / 2 | R-WEB-PEACE-RULES | `turnsAtWar:   turnsAtWarRel,` |
| `gra/src/game/ai.ts:5846` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner (druga strona stance) z aktywną flagą ag` |
| `gra/src/game/ai.ts:5859` | kod+komentarz | 2 / 2 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R6: próg wojny per cywilizacja z macierzy (zastępuje glo` |
| `gra/src/game/ai.ts:5874` | kod+komentarz | 62 / 47 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r4 (zarzut 4 Evaluatora): bramki czasu wojny i „c` |
| `gra/src/game/ai.ts:5951` | kod+komentarz | 22 / 14 | R-WEB-PEACE-RULES | `// ---- Priorytet 2: zaproponuj_pokoj (słaby w trakcie wojny; R-WEB-PEACE-RULES-` |
| `gra/src/game/ai.ts:5976` | kod | 2 / 3 | R-WEB-TRUCE | `rodzaj:   aiPeaceProposalKind(turnsAtWarRel),` |
| `gra/src/game/ai.ts:6089` | kod | 1 / 2 | R-WEB-WAR-AGGRESSOR-FLAG | `&& score >= dipP.progNapRelacja - bias.napScoreEase + deltaRelacjiSojusz(rel.cel` |
| `gra/src/game/ai.ts:6146` | komentarz | 1 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner z aktywną flagą agresora — wyższy próg R` |
| `gra/src/game/ai.ts:6148` | kod | 2 / 3 | R-WEB-WAR-AGGRESSOR-FLAG | `dipP.progSojuszRelacja - sojuszAdj.ease.scoreThresholdDelta + sojuszAdj.penaltyS` |
| `gra/src/game/auto-improvements.ts:9` | import | 1 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `import { Nakladka, TerenBazowy } from '../types/hex';` |
| `gra/src/game/auto-improvements.ts:12` | import | 1 / 0 | R-WEB-AUTO-FORT-CLAIM | `import { axialDistance, cityTerritoryRadius, territoryOwnerAt } from '../map/ter` |
| `gra/src/game/auto-improvements.ts:17` | kod | 1 / 1 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `isFarmBaseTerrain,` |
| `gra/src/game/auto-improvements.ts:75` | kod+komentarz | 18 / 6 | R-WEB-AUTOIMPROVE-STAGES | `'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'lodzie_rybackie', 'irygacja',` |
| `gra/src/game/auto-improvements.ts:130` | kod | 1 / 2 | R-WEB-AUTOIMPROVE-STAGES | `new Set<ImprovementKey>(ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE);` |
| `gra/src/game/auto-improvements.ts:171` | komentarz | 10 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `* Dzielnik „1 na 10 obywateli" (dawne ECHO właściciela 2026-08-27: „jeden tartak` |
| `gra/src/game/auto-improvements.ts:407` | kod+komentarz | 41 / 2 | wg pliku, bez ustalenia | `/**` |
| `gra/src/game/auto-improvements.ts:483` | kod+komentarz | 52 / 11 | wg pliku, bez ustalenia | `/**` |
| `gra/src/game/auto-improvements.ts:537` | kod+komentarz | 195 / 135 | R-WEB-AUTO-FORT-CLAIM | `/** D3: ulepszenia, których wykonanie na heksie rzeki oznacza „zagospodarowaną r` |
| `gra/src/game/auto-improvements.ts:738` | kod+komentarz | 11 / 3 | R-WEB-AUTOIMPROVE-STAGES | `* Niedobory, na które istnieje ulepszenie terenu (K2/K3). Niedobór surowca bez u` |
| `gra/src/game/auto-improvements.ts:751` | komentarz | 7 / 0 | R-WEB-AUTOIMPROVE-STAGES | `*` |
| `gra/src/game/auto-improvements.ts:765` | kod+komentarz | 59 / 57 | R-WEB-AUTOIMPROVE-STAGES | `const clearingSeed = new Set<string>(opts.clearingHexKeys ?? []);` |
| `gra/src/game/auto-improvements.ts:826` | kod | 10 / 19 | R-WEB-AUTOIMPROVE-STAGES | `for (const stage of foodCities.length === 0 ? [] : FOOD_STAGES) {` |
| `gra/src/game/auto-improvements.ts:842` | kod+komentarz | 5 / 5 | wg pliku, bez ustalenia | `// Do not skip a stage just because its valid targets are currently blocked by t` |
| `gra/src/game/auto-improvements.ts:848` | kod | 0 / 1 | scalony sprzed dc8, bez tagu R- (bez ustalenia) | `unlockedTechs: probeTechs,` |
| `gra/src/game/auto-improvements.ts:851` | kod | 2 / 2 | wg pliku, bez ustalenia | `pracaBudgetPercent: 100,` |
| `gra/src/game/auto-improvements.ts:862` | kod | 2 / 2 | R-WEB-AUTOIMPROVE-STAGES | `record(stagedPicks);` |
| `gra/src/game/auto-improvements.ts:867` | kod+komentarz | 79 / 66 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// farm/livestock/irrigation phase is waiting on the Work budget.` |
| `gra/src/game/auto-improvements.ts:947` | kod | 13 / 13 | R-WEB-AUTO-FORT-CLAIM | `fortPicks = pickAutoImprovementsSinglePass(fortOpts);` |
| `gra/src/game/auto-improvements.ts:961` | kod | 1 / 1 | R-WEB-AUTO-FORT-CLAIM | `const fortSpent = fallbackSpent + sum(fortPicks);` |
| `gra/src/game/auto-improvements.ts:963` | kod | 23 / 23 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `if (` |
| `gra/src/game/auto-improvements.ts:988` | kod+komentarz | 2 / 13 | R-WEB-AUTOIMPROVE-STAGES | `const normalPicks = pickAutoImprovementsSinglePass(after(sideSpent, { cities: ot` |
| `gra/src/game/auto-improvements.ts:1017` | kod | 6 / 6 | wg pliku, bez ustalenia | `riverHexesOnly = false,` |
| `gra/src/game/auto-improvements.ts:1031` | kod+komentarz | 4 / 3 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R4: ulepszenia BRAKUJĄCYCH surowców (tylko z nich niedobór może coś „otworzyć` |
| `gra/src/game/auto-improvements.ts:1147` | kod+komentarz | 28 / 21 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R-WEB-AUTOIMPROVE-STAGES3-Q1, S3-1 (właściciel 2026-10-31): „DOSTĘP DO WODY” ` |
| `gra/src/game/auto-improvements.ts:1177` | kod+komentarz | 2 / 2 | wg pliku, bez ustalenia | `// R5: wycinka w toku / zaplanowana wcześniej w tym wywołaniu liczy się jak już ` |
| `gra/src/game/auto-improvements.ts:1189` | kod+komentarz | 19 / 13 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R-WEB-AUTOIMPROVE-STAGES2-Q1 (właściciel 2026-10-31, przycisk „Wolno wycinać ` |
| `gra/src/game/auto-improvements.ts:1209` | kod+komentarz | 9 / 6 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R4 KOREKTA F (właściciel 2026-10-31): heks centrum miasta jest ZWYKŁYM heksem` |
| `gra/src/game/auto-improvements.ts:1229` | kod | 0 / 2 | R-AI-WYRAB-PRZY-RZECE-FARMY | `const demandActive = demandDriven && focus === 'zrownowazone';` |
| `gra/src/game/auto-improvements.ts:1307` | komentarz | 3 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R4 KOREKTA F (właściciel 2026-10-31): zniesiony filtr R3 „centrum miasta wyłą` |
| `gra/src/game/auto-improvements.ts:1338` | kod+komentarz | 4 / 4 | wg pliku, bez ustalenia | `const orderedHexes = [...candidateHexes]` |
| `gra/src/game/auto-improvements.ts:1358` | kod | 1 / 3 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `&& !ZERO_YIELD_IMPROVEMENTS.has(k),` |
| `gra/src/game/auto-improvements.ts:1360` | kod | 1 / 2 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `const defensePriority = demandActive` |
| `gra/src/game/auto-improvements.ts:1473` | kod+komentarz | 32 / 19 | wg pliku, bez ustalenia | `// R-WEB-AUTOIMPROVE-PRIORITY-Q1 (runda 2, zarzut 1 i 3 Obrony): KROK 0 NA HEKSI` |
| `gra/src/game/auto-improvements.ts:1513` | kod+komentarz | 8 / 2 | wg pliku, bez ustalenia | `// R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5, D3 właściciela 2026-10-31): „rzeka zagospo` |
| `gra/src/game/auto-improvements.ts:1524` | kod+komentarz | 2 / 3 | wg pliku, bez ustalenia | `if (map.hexes[hk]?.nakladka === Nakladka.Las && riverKrok0Ok(q, r)) return true;` |
| `gra/src/game/auto-improvements.ts:1528` | kod | 8 / 9 | wg pliku, bez ustalenia | `const placedHere = workingPlaced.get(hk) ?? [];` |
| `gra/src/game/auto-improvements.ts:1538` | komentarz | 4 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// MINIMUM LEŚNE MIASTA — [NIEAKTUALNE w K2/K3 (`demandActive`): właściciel 2026` |
| `gra/src/game/auto-improvements.ts:1556` | kod+komentarz | 5 / 1 | R-WEB-AUTOIMPROVE-STAGES | `// R3, ABC-B=B (K2/K3): tartak powstaje WYŁĄCZNIE przy niedoborze drewna. Bez ni` |
| `gra/src/game/auto-improvements.ts:1562` | kod | 1 / 2 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `.filter(k => !demandActive && tartakDozwolony && hexPhasePriority.includes(k))` |
| `gra/src/game/auto-improvements.ts:1581` | komentarz | 3 / 0 | R-WEB-AUTOIMPROVE-STAGES | `// ABC-3=B (właściciel 2026-10-31): w etapie E5 (`offRiverClearing`) wycinka poz` |
| `gra/src/game/auto-improvements.ts:1585` | kod+komentarz | 49 / 31 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `&& !rzekiDoZagospodarowania && (offRiverClearing \|\| lesneMinSpelnione);` |
| `gra/src/game/auto-improvements.ts:1643` | komentarz | 2 / 0 | R-WEB-AUTOIMPROVE-PRIORITY | `// KROK 0 heksa: wyrąb, gdy heks ma rzekę I las (bez lesneMin i progu lasu — pat` |
| `gra/src/game/auto-improvements.ts:1646` | kod+komentarz | 14 / 21 | R-WEB-AUTOIMPROVE-PRIORITY | `riverKrok0Ok(q, r)` |
| `gra/src/game/auto-improvements.ts:1688` | kod+komentarz | 7 / 6 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R-WEB-AUTOIMPROVE-STAGES2-Q1 (właściciel 2026-10-31, budżet sztywno): koszt p` |
| `gra/src/game/auto-improvements.ts:1707` | kod+komentarz | 8 / 1 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// R-WEB-AUTOIMPROVE-PRIORITY-Q1 (Objaw A, zmierzone: gra/tools/wyrab-rzeka-krok` |
| `gra/src/game/auto-improvements.ts:1718` | kod+komentarz | 2 / 1 | R-WEB-AUTOIMPROVE-STAGES | `// Wspólne bramki rodzaju ulepszenia na heksie (te same w SONDZIE nadwyżki, ZASA` |
| `gra/src/game/auto-improvements.ts:1745` | kod | 1 / 2 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `&& !cityBudgetExhausted && !demandActive && !citySkipWyrab && basePriority.inclu` |
| `gra/src/game/auto-improvements.ts:1764` | kod | 1 / 1 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `if (!wyrabMaSens(q, r)) continue;` |
| `gra/src/game/auto-improvements.ts:1805` | kod | 1 / 1 | R-WEB-AUTOIMPROVE-STAGES | `if (keyBlockedOnHex(key, hexKey)) continue;` |
| `gra/src/game/building-resource-gate.ts:38` | kod | 5 / 2 | wg pliku, bez ustalenia | `import {` |
| `gra/src/game/building-resource-gate.ts:330` | kod+komentarz | 44 / 28 | wg pliku, bez ustalenia | `/** Klucze JSON (gra/data/econ-params.json → budynki) czytane przez loadSpichler` |
| `gra/src/game/building-resource-gate.ts:415` | kod | 2 / 3 | R-WEB-SPICHLERZ-HUD-PARAMS | `dryRun: boolean,` |
| `gra/src/game/building-resource-gate.ts:424` | kod | 1 / 1 | wg pliku, bez ustalenia | `const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, params);` |
| `gra/src/game/building-resource-gate.ts:426` | kod | 1 / 2 | wg pliku, bez ustalenia | `if (ownerResourceStock(cities, ownerId, 'ceramika') >= ceramikaAmount) {` |
| `gra/src/game/building-resource-gate.ts:429` | kod | 1 / 2 | wg pliku, bez ustalenia | `ceramika: ceramikaAmount,` |
| `gra/src/game/building-resource-gate.ts:435` | kod | 1 / 2 | wg pliku, bez ustalenia | `if (hasII && ownerResourceStock(cities, ownerId, 'sol') >= params.solII) {` |
| `gra/src/game/building-resource-gate.ts:438` | kod | 1 / 2 | wg pliku, bez ustalenia | `sol: params.solII,` |
| `gra/src/game/building-resource-gate.ts:614` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-SPICHLERZ-HUD-PARAMS | `/** Parametry drain Spichlerza z econ-params (wg trudności) — WYMAGANE (R-WEB-SP` |
| `gra/src/game/building-resource-gate.ts:627` | kod | 1 / 1 | wg pliku, bez ustalenia | `opts.drainParams,` |
| `gra/src/game/citizen-resource-upkeep.ts:24` | komentarz | 3 / 0 | wg pliku, bez ustalenia | `*     0,2 2026-08-12, PRZYWRÓCONA 1,0 2026-08-13, patrz niżej): stawka BIEŻĄCA p` |
| `gra/src/game/citizen-resource-upkeep.ts:41` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* nie luka; STAWKA 2026-08-13 = 1,0 (od 2026-10-31 zależna od epoki, patrz `citi` |
| `gra/src/game/citizen-resource-upkeep.ts:81` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* REAL drain (current rate: per era via `citizenUpkeepRateForEra` — Kamień 1.0 /` |
| `gra/src/game/citizen-resource-upkeep.ts:83` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* `citizenUpkeepRateForEra(era)` (Kamień 1.0 / Brąz 2.0 / Żelazo 3.0), `required` |
| `gra/src/game/citizen-resource-upkeep.ts:107` | bez-kodu(komentarz/typ/import) | 6 / 0 | wg pliku, bez ustalenia | `/**` |
| `gra/src/game/citizen-resource-upkeep.ts:136` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* FALLBACK (realna stawka per epoka: `citizenUpkeepRateForEra`). Stawka zużycia:` |
| `gra/src/game/citizen-resource-upkeep.ts:156` | komentarz | 3 / 0 | wg pliku, bez ustalenia | `// R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (Maciej 2026-10-31): powyższa stała to już T` |
| `gra/src/game/citizen-resource-upkeep.ts:161` | komentarz | 4 / 0 | wg pliku, bez ustalenia | `* Wiersz tabeli dla danej epoki — ta sama reguła wyboru co lista surowców: `era`` |
| `gra/src/game/citizen-resource-upkeep.ts:166` | kod | 1 / 2 | wg pliku, bez ustalenia | `function citizenUpkeepRowForEra(era: number): CitizenUpkeepEraRow \| undefined {` |
| `gra/src/game/citizen-resource-upkeep.ts:168` | kod | 1 / 2 | wg pliku, bez ustalenia | `if (!first) return undefined;` |
| `gra/src/game/citizen-resource-upkeep.ts:171` | kod | 1 / 2 | wg pliku, bez ustalenia | `if (exact) return exact;` |
| `gra/src/game/citizen-resource-upkeep.ts:173` | kod+komentarz | 24 / 9 | wg pliku, bez ustalenia | `return below ?? first;` |
| `gra/src/game/citizen-resource-upkeep.ts:202` | bez-kodu(komentarz/typ/import) | 6 / 0 | wg pliku, bez ustalenia | `/**` |
| `gra/src/game/citizen-resource-upkeep.ts:234` | kod | 1 / 1 | R-WEB-CITIZEN-UPKEEP-ERA-MULT | `population?: number,` |
| `gra/src/game/citizen-resource-upkeep.ts:240` | kod+komentarz | 10 / 4 | R-WEB-CITIZEN-UPKEEP-ERA-MULT | `// R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: gdy podano populację (opcjonalny 3. argumen` |
| `gra/src/game/citizen-resource-upkeep.ts:252` | kod | 3 / 4 | R-WEB-CITIZEN-UPKEEP-ERA-MULT | `const haveOk = typeof have === 'number' && Number.isFinite(have) && have > 0 ? h` |
| `gra/src/game/citizen-resource-upkeep.ts:264` | kod | 4 / 5 | wg pliku, bez ustalenia | `return {` |
| `gra/src/game/citizen-resource-upkeep.ts:285` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* **`citizenUpkeepRateForEra(era)` (per epoka: Kamień 1,0 / Brąz 2,0 / Żelazo 3,` |
| `gra/src/game/citizen-resource-upkeep.ts:290` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* Math.floor(population × citizenUpkeepRateForEra(era))` — zaokrąglone W DÓŁ do ` |
| `gra/src/game/citizen-resource-upkeep.ts:309` | kod | 1 / 1 | wg pliku, bez ustalenia | `const ratePerCitizen = citizenUpkeepRateForEra(era);` |
| `gra/src/game/citizen-resource-upkeep.ts:321` | kod+komentarz | 2 / 2 | wg pliku, bez ustalenia | `// Stawka ZALEŻY OD EPOKI (R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1) — ta sama dla podgl` |
| `gra/src/game/citizen-resource-upkeep.ts:337` | kod | 3 / 4 | wg pliku, bez ustalenia | `return {` |
| `gra/src/game/citizen-resource-upkeep.ts:348` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* (`Math.floor(cityPopulation × stawka_epoki)`, stawka = `coverage.ratePerCitize` |
| `gra/src/game/citizen-resource-upkeep.ts:401` | kod | 1 / 2 | wg pliku, bez ustalenia | `coverage: Pick<CitizenUpkeepCoverage, 'available' \| 'missing' \| 'ratePerCitize` |
| `gra/src/game/citizen-resource-upkeep.ts:405` | kod+komentarz | 2 / 1 | wg pliku, bez ustalenia | `// Stawka epoki niesiona przez werdykt silnika (`coverage.ratePerCitizen`); brak` |
| `gra/src/game/citizen-resource-upkeep.ts:409` | kod | 1 / 2 | wg pliku, bez ustalenia | `const qty = Math.floor(pop * rate);` |
| `gra/src/game/city-hex-clear.ts:41` | kod+komentarz | 19 / 8 | R-WEB-CITY-CLEARS-FOREST | `/**` |
| `gra/src/game/city-hex-clear.ts:65` | kod | 1 / 1 | R-WEB-CITY-CLEARS-FOREST | `clearForestFromHex(hex);` |
| `gra/src/game/city-hex-clear.ts:74` | kod | 1 / 4 | R-WEB-CITY-CLEARS-FOREST | `if (hex.nakladka !== Nakladka.Brak && !isKeptDeposit(hex.nakladka)) {` |
| `gra/src/game/diplomacy-peace-lock.ts:58` | kod+komentarz | 50 / 25 | R-WEB-TRUCE | `// ---------------------------------------------------------------------------` |
| `gra/src/game/diplomacy-pn-engine.ts:35` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-PEACE-CITY-CESSION | `/** R-WEB-PEACE-CITY-CESSION-Q1 r2: akcja propozycji (bramka pozycji 'miasto'). ` |
| `gra/src/game/diplomacy-pn-engine.ts:41` | kod | 1 / 1 | R-WEB-PEACE-CITY-CESSION | `actionId: opts?.actionId,` |
| `gra/src/game/diplomacy-pn-engine.ts:90` | bez-kodu(komentarz/typ/import) | 6 / 0 | R-WEB-TRUCE | `/**` |
| `gra/src/game/diplomacy-pn-engine.ts:121` | bez-kodu(komentarz/typ/import) | 6 / 0 | R-WEB-PEACE-CITY-CESSION | `/** R-WEB-PEACE-CITY-CESSION-Q1 r2: wycena miasta (PW, `diplomacyPnMiasto`) — ty` |
| `gra/src/game/diplomacy-pn-engine.ts:233` | typ | 1 / 0 | R-WEB-PEACE-CITY-CESSION | `actionId?: string;` |
| `gra/src/game/diplomacy-pn-engine.ts:239` | kod | 1 / 2 | R-WEB-PEACE-CITY-CESSION | `const sumBase = buildProposalPnSumOpts({ ...opts, actionId: payload.actionId ?? ` |
| `gra/src/game/diplomacy-proposals.ts:28` | import | 2 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `import { czyAgresorAktywny, deltaRelacjiSojusz } from './diplomacy';` |
| `gra/src/game/diplomacy-proposals.ts:63` | import | 1 / 0 | R-WEB-TRUCE | `import { normalizeTruceDuration, TRUCE_DEFAULT_TURNS } from './diplomacy-peace-l` |
| `gra/src/game/diplomacy-proposals.ts:93` | kod+komentarz | 3 / 3 | R-WEB-TRUCE | `\| 'pokoj'` |
| `gra/src/game/diplomacy-proposals.ts:189` | kod+komentarz | 11 / 2 | R-WEB-PEACE-RULES | `/**` |
| `gra/src/game/diplomacy-proposals.ts:379` | kod | 4 / 5 | R-WEB-WAR-AGGRESSOR-FLAG | `function stanceForEval(` |
| `gra/src/game/diplomacy-proposals.ts:392` | kod+komentarz | 4 / 3 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R1: realny czas wojny (dawna stała 5 usunięta).` |
| `gra/src/game/diplomacy-proposals.ts:733` | kod+komentarz | 2 / 2 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 (runda 2): rozejm dzieli bramkę PW pokoju (ta sama formuła i k` |
| `gra/src/game/diplomacy-proposals.ts:1059` | kod+komentarz | 3 / 1 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2 defekt r2): bez actionId pozycja 'miasto' ` |
| `gra/src/game/diplomacy-proposals.ts:1065` | kod+komentarz | 3 / 3 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: proponent z aktywną flagą agresora → gorszy próg` |
| `gra/src/game/diplomacy-proposals.ts:1072` | kod | 4 / 5 | R-WEB-TRUCE | `if (actionId === 'rozejm' && !stanWojny) {` |
| `gra/src/game/diplomacy-proposals.ts:1116` | kod | 4 / 5 | R-WEB-WAR-AGGRESSOR-FLAG | `const napThreshold = Math.max(` |
| `gra/src/game/diplomacy-proposals.ts:1165` | kod | 2 / 3 | R-WEB-WAR-AGGRESSOR-FLAG | `p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore - sojuszEa` |
| `gra/src/game/diplomacy-proposals.ts:1246` | kod+komentarz | 7 / 6 | R-WEB-TRUCE | `case 'pokoj':` |
| `gra/src/game/diplomacy-proposals.ts:1262` | kod+komentarz | 24 / 23 | R-WEB-PEACE-RULES | `const basePnCfg = treatyBasePnFromConfig(actionId, payload);` |
| `gra/src/game/diplomacy-proposals.ts:1892` | kod | 3 / 4 | R-WEB-TRUCE | `return cmd.rodzaj === 'rozejm'` |
| `gra/src/game/diplomacy-proposals.ts:1899` | kod | 4 / 4 | R-WEB-PEACE-CITY-CESSION | `case 'oferuj_miasto_za_pokoj':` |
| `gra/src/game/diplomacy-proposals.ts:1954` | kod+komentarz | 10 / 8 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r4 (N4): rozejm proponowany przez AI idzie tą samą ścieżką co ` |
| `gra/src/game/diplomacy-proposals.ts:1970` | kod+komentarz | 20 / 18 | R-WEB-PEACE-CITY-CESSION | `case 'oferuj_miasto_za_pokoj':` |
| `gra/src/game/diplomacy-proposals.ts:2099` | kod | 1 / 2 | R-WEB-TRUCE | `'pokoj', 'rozejm', 'trybut_oferta', 'ultimatum',` |
| `gra/src/game/diplomacy-proposals.ts:2159` | kod | 2 / 2 | R-WEB-TRUCE | `case 'rozejm':` |
| `gra/src/game/diplomacy-proposals.ts:2612` | komentarz | 1 / 0 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r3 (N3): rozejm ma ten sam słodzik kontrprzeciwny co pokój (ta` |
| `gra/src/game/diplomacy-proposals.ts:2614` | kod | 1 / 2 | R-WEB-TRUCE | `'nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal', 'pokoj', 'rozejm` |
| `gra/src/game/diplomacy-tick-war-brake.ts:172` | kod+komentarz | 23 / 10 | R-WEB-PEACE-RULES | `/**` |
| `gra/src/game/diplomacy-value-catalog.ts:26` | kod | 2 / 3 | R-WEB-PEACE-CITY-CESSION | `\| 'zywnosc'` |
| `gra/src/game/diplomacy-value-catalog.ts:448` | bez-kodu(komentarz/typ/import) | 6 / 0 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/game/diplomacy-value-catalog.ts:479` | kod+komentarz | 15 / 3 | R-WEB-PEACE-CITY-CESSION | `items: Array<{` |
| `gra/src/game/diplomacy-value-catalog.ts:527` | kod+komentarz | 13 / 10 | R-WEB-PEACE-CITY-CESSION | `case 'miasto': {` |
| `gra/src/game/diplomacy-value-catalog.ts:546` | kod | 1 / 1 | R-WEB-PEACE-CITY-CESSION | `\|\| item.typ === 'miasto'` |
| `gra/src/game/diplomacy-value-catalog.ts:767` | kod+komentarz | 231 / 126 | R-WEB-PEACE-CITY-CESSION | `// ---------------------------------------------------------------------------` |
| `gra/src/game/diplomacy-war-gates.ts:10` | kod+komentarz | 2 / 2 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r3 (N2): rozejm ma te same bramki walutowe w wojnie co pokój.` |
| `gra/src/game/diplomacy-war-gates.ts:13` | komentarz | 1 / 0 | R-WEB-TRUCE | `/** Waluta w wojnie dozwolona dla pokoju i rozejmu (wspólna bramka, R-WEB-TRUCE-` |
| `gra/src/game/diplomacy-war-peace-profile.ts:1` | kod+komentarz | 364 / 225 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 (runda 1) — czyste reguły wojny i pokoju per cywilizacja` |
| `gra/src/game/diplomacy.ts:24` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: parametry flagi agresora (sekcja na końcu pliku)` |
| `gra/src/game/diplomacy.ts:35` | import | 1 / 0 | R-WEB-PEACE-RULES | `import { resolveWarPeaceProfile, warWearinessShare } from './diplomacy-war-peace` |
| `gra/src/game/diplomacy.ts:1108` | bez-kodu(komentarz/typ/import) | 5 / 0 | R-WEB-WAR-AGGRESSOR-FLAG | `/**` |
| `gra/src/game/diplomacy.ts:1300` | kod+komentarz | 6 / 5 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R4: zmęczenie = min(0.5, turnsAtWar / T(civ)), T ≤ 20 (D` |
| `gra/src/game/diplomacy.ts:1337` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: wobec agresora (flaga aktywna) próg sojuszu wyże` |
| `gra/src/game/diplomacy.ts:1340` | kod | 1 / 2 | R-WEB-WAR-AGGRESSOR-FLAG | `p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore + agresorD` |
| `gra/src/game/diplomacy.ts:1368` | kod+komentarz | 3 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: gorsza chęć sojuszu wobec agresora (mnożnik z JS` |
| `gra/src/game/diplomacy.ts:1785` | kod+komentarz | 172 / 100 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1 — flaga agresora i casus belli.` |
| `gra/src/game/forced-war-bronze.ts:5` | kod | 0 / 1 | R-WEB-PEACE/WAR (wg słów kluczowych) | `shouldEndForcedWarByCityCount,` |
| `gra/src/game/forced-war-bronze.ts:92` | komentarz | 4 / 0 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po ` |
| `gra/src/game/forced-war-bronze.ts:171` | kod+komentarz | 0 / 11 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `/**` |
| `gra/src/game/forced-war-bronze.ts:183` | kod+komentarz | 0 / 7 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `/**` |
| `gra/src/game/forced-war-common.ts:12` | komentarz | 5 / 0 | R-WEB-PEACE-RULES-R8R9 | `/**` |
| `gra/src/game/forced-war-common.ts:201` | kod+komentarz | 11 / 4 | R-WEB-PEACE-RULES-R8R9 | `/**` |
| `gra/src/game/forced-war-common.ts:213` | kod+komentarz | 6 / 1 | R-WEB-PEACE-RULES-R8R9 | `/**` |
| `gra/src/game/forced-war-common.ts:221` | kod+komentarz | 7 / 1 | R-WEB-ERA-WAR-COUNTER | `/**` |
| `gra/src/game/forced-war-common.ts:307` | kod+komentarz | 7 / 4 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R8: jedyny predykat blokady pary w tej funkcji = NA` |
| `gra/src/game/forced-war-common.ts:317` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `.filter(s => opts.totalActiveForcedWarsByOwner(s.ownerId) === 0 && !exhausted(s.` |
| `gra/src/game/forced-war-common.ts:339` | kod | 2 / 3 | R-WEB-ERA-WAR-COUNTER | `if (exhausted(cand.ownerId)) continue;` |
| `gra/src/game/forced-war-common.ts:401` | kod | 1 / 2 | R-WEB-PEACE-RULES-R8R9 | `const blockedIdx: boolean[][] = ids.map(a => ids.map(b => a !== b && pairBlocked` |
| `gra/src/game/forced-war-common.ts:468` | kod | 1 / 2 | R-WEB-PEACE-RULES-R8R9 | `const blocked = new Set(remaining.filter(id => pairBlocked(seekerId, id)));` |
| `gra/src/game/forced-war-common.ts:498` | kod | 2 / 4 | R-WEB-PEACE-RULES-R8R9 | `const attackerBlocked = pairBlocked(leftoverId, pair.attackerId);` |
| `gra/src/game/forced-war-common.ts:501` | kod+komentarz | 3 / 1 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: obie strony pary muszą mieć wolny licznik wojen epo` |
| `gra/src/game/forced-war-iron.ts:5` | kod | 0 / 1 | R-EPOKA-ZELAZO-WYMUSZONA-WOJNA | `shouldEndForcedWarByCityCount,` |
| `gra/src/game/forced-war-iron.ts:89` | komentarz | 3 / 0 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po ` |
| `gra/src/game/forced-war-iron.ts:214` | kod+komentarz | 0 / 18 | R-EPOKA-ZELAZO-WYMUSZONA-WOJNA | `/**` |
| `gra/src/game/forced-war-stone.ts:5` | kod | 0 / 1 | R-WEB-PEACE/WAR (wg słów kluczowych) | `shouldEndForcedWarByCityCount,` |
| `gra/src/game/forced-war-stone.ts:28` | komentarz | 3 / 0 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: NIEUŻYWANA w runtime -- automatyczny koniec po ` |
| `gra/src/game/forced-war-stone.ts:74` | kod+komentarz | 0 / 18 | R-WEB-PEACE/WAR (wg słów kluczowych) | `export function shouldEndStoneForcedWarByCityCount(` |
| `gra/src/game/fort-territory.ts:8` | komentarz | 10 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `* ZASTAPIONE decyzja wlasciciela 2026-10-31 (R-WEB-OUTPOST-FORT-TERRITORY-Q1):` |
| `gra/src/game/fort-territory.ts:36` | import | 1 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `import { axialDistance, cityTerritoryRadius, territoryOwnerAt, type CityNode, ty` |
| `gra/src/game/fort-territory.ts:58` | kod+komentarz | 31 / 16 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `/**` |
| `gra/src/game/fort-territory.ts:103` | kod+komentarz | 40 / 26 | R-WEB-OUTPOST-FORT-TERRITORY | `/**` |
| `gra/src/game/fort-territory.ts:296` | kod+komentarz | 54 / 24 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `/** Minimalny opis jednostki do rozstrzygania zdobycia fortu przez wejscie wojsk` |
| `gra/src/game/terrain-improvements.ts:204` | komentarz | 3 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// Tartak i Kamieniolom: baza 50/ture (epoka 1), skalowana x1,5 za epoke (50/75/` |
| `gra/src/game/terrain-improvements.ts:209` | komentarz | 1 / 0 | R-WEB-AUTOIMPROVE (wg słów kluczowych) | `// tartak/kamieniolom restored to 50 on 2026-10-31 (see above);` |
| `gra/src/game/turn-economy.ts:127` | kod | 2 / 4 | wg pliku, bez ustalenia | `loadSpichlerzDrainParams,` |
| `gra/src/game/turn-economy.ts:131` | typ | 1 / 0 | wg pliku, bez ustalenia | `type SpichlerzDrainParams,` |
| `gra/src/game/turn-economy.ts:1356` | kod | 1 / 1 | wg pliku, bez ustalenia | `drainParams: SpichlerzDrainParams,` |
| `gra/src/game/turn-economy.ts:1358` | kod | 1 / 2 | wg pliku, bez ustalenia | `const drain = paySpichlerzDrainForCity(cities, ownerId, builtIds, dryRun, drainP` |
| `gra/src/game/turn-economy.ts:1367` | kod | 1 / 1 | wg pliku, bez ustalenia | `drainParams: SpichlerzDrainParams,` |
| `gra/src/game/turn-economy.ts:1374` | kod | 3 / 5 | wg pliku, bez ustalenia | `const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, drainParams);` |
| `gra/src/game/turn-economy.ts:1406` | kod | 1 / 1 | wg pliku, bez ustalenia | `const spichlerzDrainParams = loadSpichlerzDrainParams(raw, difficulty);` |
| `gra/src/game/turn-economy.ts:1547` | kod | 5 / 9 | wg pliku, bez ustalenia | `const ceramikaAmount = spichlerzCeramikaDrainAmount(builtIds, spichlerzDrainPara` |
| `gra/src/game/turn-economy.ts:1567` | kod | 2 / 3 | wg pliku, bez ustalenia | `stockAlreadyDrained: boolean,` |
| `gra/src/game/turn-economy.ts:1583` | kod | 1 / 2 | wg pliku, bez ustalenia | `: simulateCeramikaAfterSpichlerzDrains(cities, ownerId, builtByCity, drainParams` |
| `gra/src/game/turn-economy.ts:1708` | kod+komentarz | 4 / 5 | R-WEB-SPICHLERZ-DRAIN-KEYS | `resolveOwnerActiveLabels: OwnerActiveLabelsResolver \| undefined,` |
| `gra/src/game/turn-economy.ts:1797` | kod | 1 / 2 | wg pliku, bez ustalenia | `const drain = paySpichlerzDrainForCity(cities, city.ownerId, builtIds, false, sp` |
| `gra/src/game/turn-economy.ts:2477` | kod+komentarz | 5 / 4 | wg pliku, bez ustalenia | `// R-WEB-SPICHLERZ-DRAIN-KEYS-Q1: zużycie Spichlerza z econ-params wg trudności ` |
| `gra/src/game/turn-economy.ts:2495` | kod | 1 / 1 | wg pliku, bez ustalenia | `spichlerzDrainParams,` |
| `gra/src/game/turn-economy.ts:2499` | kod | 1 / 2 | wg pliku, bez ustalenia | `cities, builtByCity, true, spichlerzDrainParams,` |
| `gra/src/game/victory.ts:14` | komentarz | 5 / 0 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `*   3. 'przegrana' — brak miast gracza po tym, jak kiedykolwiek miał miasto.` |
| `gra/src/game/victory.ts:95` | komentarz | 3 / 0 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `/** @deprecated Bez wpływu na przegraną (R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1):` |
| `gra/src/game/victory.ts:102` | bez-kodu(komentarz/typ/import) | 3 / 0 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `/** Wejście dla samej reguły przegranej (patrz `checkDefeat`). */` |
| `gra/src/game/victory.ts:208` | kod+komentarz | 14 / 7 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `/**` |
| `gra/src/game/victory.ts:225` | komentarz | 1 / 0 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `*   2. Przegrana (brak miast gracza, bez względu na osadników)` |
| `gra/src/game/victory.ts:247` | kod | 2 / 7 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `const defeat = checkDefeat(input);` |
| `gra/src/game/war-rules-multiwar.ts:22` | komentarz | 1 / 0 | R-WEB-ERA-WAR-COUNTER | `/** R3 (r3, właściciel 2026-10-25): najwyżej N wojen epoki na epokę w skali świa` |
| `gra/src/game/war-rules-multiwar.ts:24` | bez-kodu(komentarz/typ/import) | 4 / 0 | R-WEB-ERA-WAR-COUNTER | `/** R-WEB-ERA-WAR-COUNTER-Q1: najwyżej N wojen epoki na JEDNĄ cywilizację (także` |
| `gra/src/game/war-rules-multiwar.ts:37` | kod | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `maxEraForcedWarsPerCivPerEra: warRulesParamsRaw.maxEraForcedWarsPerCivPerEra,` |
| `gra/src/game/war-rules-multiwar.ts:163` | kod+komentarz | 138 / 84 | R-WEB-ERA-WAR-COUNTER | `/**` |
| `gra/src/main.ts:227` | kod | 3 / 3 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `nextFortSeq,` |
| `gra/src/main.ts:233` | kod | 2 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `fortTerritoryNodes,` |
| `gra/src/main.ts:266` | import | 1 / 0 | R-WEB-CITY-CLEARS-FOREST | `import { applyCityFoundingToHex, cityKeepsImprovement, clearForestUnderCity } fr` |
| `gra/src/main.ts:866` | kod | 1 / 2 | R-WEB-PEACE-RULES | `parseCrisisCounters, brakeWarOutcome, sortCrisisQueue, tradeTrustBonusPerTura,` |
| `gra/src/main.ts:1194` | import | 1 / 0 | R-WEB-PEACE-CITY-CESSION | `import type { AITurnOpts, RelacjaWejscie, DiplomacjaInputs, AIDiplomacyCommand, ` |
| `gra/src/main.ts:1205` | kod | 0 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,` |
| `gra/src/main.ts:1207` | kod | 0 / 2 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `shouldEndBronzeForcedWarByCityCount,` |
| `gra/src/main.ts:1216` | kod | 0 / 1 | R-WEB-PEACE/WAR (wg słów kluczowych) | `WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,` |
| `gra/src/main.ts:1217` | kod | 0 / 2 | R-WEB-PEACE/WAR (wg słów kluczowych) | `shouldEndStoneForcedWarByCityCount,` |
| `gra/src/main.ts:1226` | kod | 0 / 2 | R-EPOKA-ZELAZO-WYMUSZONA-WOJNA | `shouldEndIronForcedWarByDuration,` |
| `gra/src/main.ts:1228` | kod | 0 / 1 | R-EPOKA-ZELAZO-WYMUSZONA-WOJNA | `shouldEndIronForcedWarByCityCount,` |
| `gra/src/main.ts:1242` | kod | 1 / 1 | R-WEB-PEACE-RULES-R8R9 | `isForcedWarRelationBlocked,` |
| `gra/src/main.ts:1254` | import | 1 / 0 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `import { checkVictory, checkDefeat, techIdsInGameScope, allTechInScopeResearched` |
| `gra/src/main.ts:1280` | kod | 2 / 3 | R-WEB-ERA-WAR-COUNTER | `canCivJoinEraForcedWar,` |
| `gra/src/main.ts:1284` | kod | 1 / 1 | R-WEB-ERA-WAR-COUNTER | `isForcedEraWarEnabled,` |
| `gra/src/main.ts:1288` | kod | 3 / 3 | R-WEB-ERA-WAR-COUNTER | `pickPlayerReferenceCity,` |
| `gra/src/main.ts:1318` | kod | 1 / 1 | R-WEB-AUTO-FORT-CLAIM | `isCityLimitExhausted,` |
| `gra/src/main.ts:1396` | kod+komentarz | 16 / 13 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: flaga agresora + casus belli (stan modułu, zapis` |
| `gra/src/main.ts:1441` | import | 1 / 0 | R-WEB-PEACE-RULES | `import { resolveWarPeaceProfile, brakeRelationThreshold, recordWarCityLoss, warS` |
| `gra/src/main.ts:1446` | kod | 5 / 5 | R-WEB-TRUCE | `truceUntilTurn as truceUntilTurnFor,` |
| `gra/src/main.ts:1510` | kod | 4 / 4 | R-WEB-PEACE-CITY-CESSION | `planCityCession,` |
| `gra/src/main.ts:1515` | pusty | 1 / 0 | R-WEB-PEACE-CITY-CESSION | `` |
| `gra/src/main.ts:2159` | kod+komentarz | 4 / 1 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: licznik wojen epoki PER (cywilizacja, epoka) — kluc` |
| `gra/src/main.ts:2257` | kod+komentarz | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 3): Brąz wyłączony flagą → brak pen` |
| `gra/src/main.ts:2274` | kod+komentarz | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 3): Żelazo wyłączone flagą → brak p` |
| `gra/src/main.ts:2424` | kod | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `const nodes = statsTerritoryNodesForOwner(ownerId);` |
| `gra/src/main.ts:2539` | kod | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `heksyTerytorium: countTerritoryHexes(statsTerritoryNodesForOwner(ownerId)),` |
| `gra/src/main.ts:2594` | kod | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `heksyTerytorium: countTerritoryHexes(statsTerritoryNodesForOwner(ownerId)),` |
| `gra/src/main.ts:3699` | kod | 5 / 6 | wg pliku, bez ustalenia | `? {` |
| `gra/src/main.ts:3785` | kod+komentarz | 10 / 3 | wg pliku, bez ustalenia | `/**` |
| `gra/src/main.ts:4973` | kod+komentarz | 4 / 1 | R-WEB-OUTPOST-FORT-TERRITORY | `/** Rejestr fortow/posterunkow (R-FORT-STRAZNICA krok 2). Od 2026-10-31 tworzy T` |
| `gra/src/main.ts:4981` | kod+komentarz | 5 / 3 | R-WEB-OUTPOST-FORT-TERRITORY | `/** Wezly terytorium wlasciciela do STATYSTYK (miasta + wlasne forty/posterunki,` |
| `gra/src/main.ts:4993` | kod | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `const cityNodes: TerritoryNode[] = cities.map(c => ({` |
| `gra/src/main.ts:5000` | kod+komentarz | 3 / 1 | R-WEB-OUTPOST-FORT-TERRITORY | `// R-WEB-OUTPOST-FORT-TERRITORY-Q1 (decyzja wlasciciela 2026-10-31, zastepuje Q2` |
| `gra/src/main.ts:5472` | kod | 1 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `const nodes = statsTerritoryNodesForOwner(oid);` |
| `gra/src/main.ts:7350` | kod+komentarz | 2 / 1 | R-WEB-AGGRESSOR-MARKER | `// R-WEB-AGGRESSOR-MARKER-Q1: znacznik „Agresor (N)" — N = pozostałe tury aktywn` |
| `gra/src/main.ts:9162` | kod | 3 / 3 | wg pliku, bez ustalenia | `ringHex: isBarbarian(ownerId) \|\| portraitForceCultureIcon(ownerId)` |
| `gra/src/main.ts:9516` | kod+komentarz | 12 / 7 | R-WEB-ERA-WAR-COUNTER | `/** R-WEB-ERA-WAR-COUNTER-Q1 (6): etykieta epoki wojny wymuszonej w komunikatach` |
| `gra/src/main.ts:9536` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `const baseTitle = isMe(declarerId)` |
| `gra/src/main.ts:9539` | kod | 1 / 1 | R-WEB-ERA-WAR-COUNTER | `const title = reasonLabel ? reasonLabel + ' — ' + baseTitle : baseTitle;` |
| `gra/src/main.ts:10207` | kod+komentarz | 94 / 60 | R-WEB-PEACE-RULES | `/**` |
| `gra/src/main.ts:10307` | kod+komentarz | 21 / 11 | R-WEB-PEACE-RULES | `/** R-WEB-PEACE-RULES-Q1 R6: profil wojny/pokoju strony (gracz = brak wiersza ma` |
| `gra/src/main.ts:10330` | kod | 3 / 4 | R-WEB-PEACE-RULES | `const relacja = relationScore(getDiploRelation(a, b));` |
| `gra/src/main.ts:10399` | kod | 0 / 2 | R-WEB-DIPLO-TICK-WAR-BRAKE | `const n = diploTickP6.kryzysTurDoWojny;` |
| `gra/src/main.ts:10401` | kod | 1 / 1 | R-WEB-PEACE-RULES | `if (diplomacyCrisisCounters.size > 0) refreshObjectivePowerCache();` |
| `gra/src/main.ts:10410` | kod+komentarz | 11 / 9 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R7: N per para (wyższy progWojnyRelacji), ostrzeżenie 2 ` |
| `gra/src/main.ts:10423` | kod | 1 / 2 | R-WEB-PEACE-RULES | `'Ryzyko wojny z ' + ownerDiploLabel(other) + ': ' + (nPair - counter) + ' tur do` |
| `gra/src/main.ts:10427` | kod | 1 / 2 | R-WEB-PEACE-RULES | `if (counter >= nPair) ready.push({ ownerA: sa, ownerB: sb, counter });` |
| `gra/src/main.ts:10429` | kod | 0 / 1 | R-WEB-DIPLO-TICK-WAR-BRAKE | `refreshObjectivePowerCache();` |
| `gra/src/main.ts:10437` | kod | 1 / 2 | R-WEB-PEACE-RULES | `const outcome = brakeWarOutcome(` |
| `gra/src/main.ts:10440` | kod | 1 / 1 | R-WEB-PEACE-RULES | `(o) => isMe(o),` |
| `gra/src/main.ts:10442` | kod+komentarz | 5 / 4 | R-WEB-PEACE-RULES | `// D7 (właściciel 2026-10-30): gracz NIGDY nie wypowiada wojny automatycznie z h` |
| `gra/src/main.ts:10461` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: wojna z progu (hamulec) NIE nadaje flagi agresor` |
| `gra/src/main.ts:10464` | kod+komentarz | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (6): wojna z progu (hamulec) — powód widoczny w karc` |
| `gra/src/main.ts:10491` | kod | 1 / 2 | R-WEB-PEACE-RULES | `diploBrakeCrisisStep(a, b);` |
| `gra/src/main.ts:10637` | kod | 1 / 1 | R-WEB-TRUCE | `truceTurns?: number,` |
| `gra/src/main.ts:10655` | kod+komentarz | 23 / 29 | R-WEB-TRUCE | `if (truceTurns != null) {` |
| `gra/src/main.ts:10778` | kod+komentarz | 25 / 17 | R-WEB-TRUCE | `/**` |
| `gra/src/main.ts:10841` | kod | 2 / 4 | R-WEB-TRUCE | `): boolean {` |
| `gra/src/main.ts:10846` | kod+komentarz | 3 / 1 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r3 (N1): wypowiedzenie wojny w oknie aktywnego rozejmu = złama` |
| `gra/src/main.ts:10859` | kod | 3 / 3 | R-WEB-TRUCE | `if (truceBreach) {` |
| `gra/src/main.ts:10867` | kod | 1 / 1 | R-WEB-TRUCE | `truceUntilTurn: undefined,` |
| `gra/src/main.ts:10881` | kod | 1 / 1 | R-WEB-TRUCE | `return truceBreach;` |
| `gra/src/main.ts:11297` | kod+komentarz | 11 / 6 | R-WEB-PEACE-CITY-CESSION | `case 'miasto': {` |
| `gra/src/main.ts:11377` | kod+komentarz | 2 / 1 | R-WEB-TRUCE | `/** R-WEB-TRUCE-Q1 (r5): wyłącznie hak live `__truceTestDebug.suppressVictoryFor` |
| `gra/src/main.ts:11506` | komentarz | 3 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `* forty/posterunki (foundingNodesForOwner, game/fort-territory.ts). Q2=B ("grani` |
| `gra/src/main.ts:11520` | kod+komentarz | 3 / 3 | R-WEB-OUTPOST-FORT-TERRITORY | `// R-WEB-OUTPOST-FORT-TERRITORY-Q1: obcy fort/posterunek = terytorium zabezpiecz` |
| `gra/src/main.ts:11713` | kod | 1 / 2 | R-WEB-TRUCE | `const truceBreachPlayer = chargeWarDeclarationCredibility(ME(), ownerId);` |
| `gra/src/main.ts:11721` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: wypowiedzenie gracza — flaga tylko bez casus bel` |
| `gra/src/main.ts:11742` | kod | 1 / 2 | R-WEB-WAR-AGGRESSOR-FLAG | `function ownerDeclareWarOn(attackerId: number, defenderId: number, force = false` |
| `gra/src/main.ts:11749` | kod+komentarz | 2 / 2 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r3 (N1): złamanie rozejmu — czytane PRZED chargeWarDeclaration` |
| `gra/src/main.ts:11763` | kod+komentarz | 11 / 8 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: flaga agresora tylko dla przyczyny 'bez_powodu' ` |
| `gra/src/main.ts:11807` | kod | 1 / 2 | R-WEB-WAR-AGGRESSOR-FLAG | `ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna');` |
| `gra/src/main.ts:12697` | kod+komentarz | 22 / 11 | R-WEB-SAVELOAD-PRACA-POOL | `/**` |
| `gra/src/main.ts:13506` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: rozdzielenie armii na heks fortu = wejscie woj` |
| `gra/src/main.ts:14268` | kod+komentarz | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY | `// (deklaracja `fortNodes` przeniesiona przed buildAllTerritoryNodes — R-WEB-OUT` |
| `gra/src/main.ts:14325` | kod+komentarz | 4 / 3 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `// R3 Q-B=B: znacznik kolejnosci budowy (wczesniejszy fort wygrywa sporny heks).` |
| `gra/src/main.ts:14337` | kod | 4 / 5 | R-WEB-OUTPOST-FORT-TERRITORY | `if (idx !== -1) {` |
| `gra/src/main.ts:14409` | kod+komentarz | 27 / 19 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `/**` |
| `gra/src/main.ts:14473` | kod+komentarz | 26 / 15 | R-WEB-CITY-CLEARS-FOREST | `/**` |
| `gra/src/main.ts:14500` | kod | 1 / 1 | R-WEB-CITY-CLEARS-FOREST | `enforceNoForestUnderCities('wczytanie/preset');` |
| `gra/src/main.ts:15936` | kod+komentarz | 3 / 3 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: wojny wymuszone Kamienia/Brązu/Żelaza NIE kończ` |
| `gra/src/main.ts:15940` | kod | 1 / 1 | R-WEB-PEACE-RULES | `recordWarCityLossForPair(oldOwner, newOwner); // R-WEB-PEACE-RULES-Q1 R2` |
| `gra/src/main.ts:18068` | kod | 2 / 2 | R-WEB-PEACE-CITY-CESSION | `case 'oferuj_miasto_za_pokoj': return 'Miasto za pokój';` |
| `gra/src/main.ts:18119` | kod | 2 / 2 | R-WEB-PEACE-CITY-CESSION | `&& cmd.type !== 'oferuj_miasto_za_pokoj'` |
| `gra/src/main.ts:18194` | kod+komentarz | 7 / 1 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `// R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 (część A, pomiar → naprawa): gdy bilans A` |
| `gra/src/main.ts:18204` | kod+komentarz | 4 / 4 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r4 (N4): rozejm AI ma własną bazę PW (200), nie bazę pokoju (5` |
| `gra/src/main.ts:18220` | kod+komentarz | 7 / 5 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `// Zakres: WYŁĄCZNIE rozejm (pokój zostaje bit w bit — ten sam ubytek zmierzony ` |
| `gra/src/main.ts:18229` | kod | 3 / 4 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `const clampedPayload = peaceBareAllowed` |
| `gra/src/main.ts:18239` | kod+komentarz | 2 / 1 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3: akcja propozycji — bramka pozycji 'miasto' (p` |
| `gra/src/main.ts:18263` | kod | 2 / 3 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `!peaceBareAllowed` |
| `gra/src/main.ts:18361` | komentarz | 2 / 0 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r5 (N3): 'rozejm' ma WŁASNĄ bramkę PW (ta sama co pokój, baza ` |
| `gra/src/main.ts:18364` | kod | 1 / 2 | R-WEB-TRUCE | `'pokoj', 'rozejm', 'umowa_szlakow', 'umowa_handlowa',` |
| `gra/src/main.ts:18499` | kod+komentarz | 9 / 7 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: odmowa trybutu/ultimatum przez ADRESATA (awaitin` |
| `gra/src/main.ts:18652` | kod+komentarz | 7 / 6 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: odmowa gracza (adresata) trybutu/ultimatum daje ` |
| `gra/src/main.ts:18857` | kod+komentarz | 5 / 1 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `// R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 (r3, pomiar Chromium): rozejm AI na stole` |
| `gra/src/main.ts:18905` | kod | 1 / 1 | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE | `case 'rozejm': return basketDetail \|\| `Rozejm na ${p.turns ?? 10} tur`;` |
| `gra/src/main.ts:19325` | komentarz | 3 / 0 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 r5 (N4 fix): gałąź bez warunku `rodzaj` — interHumanCmdFromFie` |
| `gra/src/main.ts:21535` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: obowiązek sojuszniczy — wejście w wojnę NIE nada` |
| `gra/src/main.ts:21984` | kod | 1 / 1 | R-WEB-TRUCE | `tickTruceExpiries();` |
| `gra/src/main.ts:22037` | kod | 1 / 2 | R-WEB-PEACE-RULES | `diploBrakeCrisisStep(ME(), oid);` |
| `gra/src/main.ts:22165` | kod+komentarz | 6 / 5 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-Q1 R5: bramka pokoju AI (gracz proponuje, AI respondent).` |
| `gra/src/main.ts:22341` | kod+komentarz | 9 / 6 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r4 (zarzut 3 Evaluatora): cesja miasta sprawdzana` |
| `gra/src/main.ts:22389` | kod+komentarz | 5 / 4 | R-WEB-TRUCE | `} else if (cywAction === 'rozejm') {` |
| `gra/src/main.ts:23187` | kod+komentarz | 9 / 7 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): miasta GRACZA do oddania w pokoju z wyce` |
| `gra/src/main.ts:24885` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `if (isForcedEraWarEnabled('bronze')) bronzeForceWarPendingOwners.add(attackerId)` |
| `gra/src/main.ts:24902` | kod+komentarz | 52 / 38 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 1): lustro `forceBronzeForcedWarOnP` |
| `gra/src/main.ts:24986` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `if (isForcedEraWarEnabled('bronze')) bronzeForceWarPendingOwners.add(attackerId)` |
| `gra/src/main.ts:25068` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `if (isForcedEraWarEnabled('iron')) ironForceWarPendingOwners.add(attackerId); //` |
| `gra/src/main.ts:25320` | kod+komentarz | 114 / 104 | R-WEB-OUTPOST-FORT-TERRITORY | `// R-WEB-OUTPOST-FORT-TERRITORY-Q1: hak testowy WYLACZNIE dla Playwright` |
| `gra/src/main.ts:25939` | kod+komentarz | 69 / 55 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `// R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1: hak testowy WYŁĄCZNIE do` |
| `gra/src/main.ts:26083` | kod+komentarz | 309 / 247 | R-WEB-PEACE-RULES | `// R-WEB-PEACE-RULES-R8R9-Q1 R9 (kryteria 2 i 4: żywy test wojny wymuszonej). Po` |
| `gra/src/main.ts:26500` | kod+komentarz | 98 / 77 | R-WEB-CITY-CLEARS-FOREST | `// R-WEB-CITY-CLEARS-FOREST-Q1 — hak testowy WYŁĄCZNIE dla `tools/city-clears-fo` |
| `gra/src/main.ts:30749` | kod+komentarz | 37 / 20 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `/* R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1: przegrana po utracie OSTATNIEGO miasta` |
| `gra/src/main.ts:31278` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: po bitwie obroncy zgineli, atakujacy stoi na f` |
| `gra/src/main.ts:32278` | kod+komentarz | 6 / 132 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: USUNIĘTO automatyczny koniec wojen wymuszonych ` |
| `gra/src/main.ts:32391` | kod+komentarz | 1 / 3 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: brak auto-końca wojen wymuszonych po zdobyciu m` |
| `gra/src/main.ts:32393` | kod | 1 / 1 | R-WEB-PEACE-RULES | `recordWarCityLossForPair(oldOwner, atkOwner); // R-WEB-PEACE-RULES-Q1 R2` |
| `gra/src/main.ts:32670` | kod+komentarz | 137 / 104 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/main.ts:33494` | kod+komentarz | 4 / 1 | R-WEB-SAVELOAD-HOTSEAT-PRACA | `// R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1 (decyzja wlasciciela A, 2026-10-31): pula Pra` |
| `gra/src/main.ts:33610` | kod+komentarz | 7 / 5 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (7): licznik wojen epoki per (cywilizacja, epoka).` |
| `gra/src/main.ts:34336` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: jednostki stojace na wrogim forcie (koniec tur` |
| `gra/src/main.ts:34365` | kod+komentarz | 2 / 1 | R-WEB-CITY-CLEARS-FOREST | `// R-WEB-CITY-CLEARS-FOREST-Q1: pod miastem nigdy las (siatka na każdej granicy ` |
| `gra/src/main.ts:35372` | komentarz | 2 / 0 | wg pliku, bez ustalenia | `// stawka epoki szt. surowca na 1 obywatela na turę (R-WEB-CITIZEN-UPKEEP-ERA-MU` |
| `gra/src/main.ts:35600` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `// N2 (2026-08-11): realny drenaż (stawka per epoka citizenUpkeepRateForEra` |
| `gra/src/main.ts:36017` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `// stawka per epoka (citizenUpkeepRateForEra) szt. surowca/obywatela/turę — patr` |
| `gra/src/main.ts:36248` | kod+komentarz | 6 / 2 | R-WEB-AUTOIMPROVE-STAGES | `// R-WEB-AUTOIMPROVE-STAGES-Q1 (audyt P25/E5, zmierzone A8 vs A9): bez `playerEr` |
| `gra/src/main.ts:36273` | komentarz | 5 / 0 | R-WEB-AUTOIMPROVE-STAGES | `// R-WEB-AUTOIMPROVE-STAGES-Q1 (ABC-1, K1/K2): etapy E1-E6 dla profili „Zywnosc”` |
| `gra/src/main.ts:36280` | kod | 1 / 4 | wg pliku, bez ustalenia | `return policy.focus === 'zywnosc' \|\| policy.focus === 'zrownowazone';` |
| `gra/src/main.ts:36282` | kod+komentarz | 2 / 1 | wg pliku, bez ustalenia | `// Wycinka w toku (wieloturowa) - picker nie moze jej emitowac drugi raz (exec-w` |
| `gra/src/main.ts:36451` | kod+komentarz | 1 / 1 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R9: brak limitu czasu wojny wymuszonej (dawny limit` |
| `gra/src/main.ts:36519` | kod | 1 / 2 | R-WEB-TRUCE | `const truceBreachCluster = chargeWarDeclarationCredibility(csOwnerId, ME());` |
| `gra/src/main.ts:36526` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: klaster państw-miast wypowiada wojnę bez powodu ` |
| `gra/src/main.ts:36594` | kod+komentarz | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: Brąz wyłączony flagą — nie wchodzi do puli parowani` |
| `gra/src/main.ts:36652` | kod+komentarz | 2 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: Żelazo wyłączone flagą — nie wchodzi do puli parowa` |
| `gra/src/main.ts:36682` | kod+komentarz | 3 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (5): odległość partnera gracza liczona od STOLICY gr` |
| `gra/src/main.ts:36720` | kod+komentarz | 2 / 1 | R-WEB-PEACE-RULES-R8R9 | `// R-WEB-PEACE-RULES-R8R9-Q1 R8 (D1): Relacja (relationScore) >= próg blokuje wo` |
| `gra/src/main.ts:36725` | kod | 2 / 3 | R-WEB-PEACE-RULES-R8R9 | `\|\| allianceFormalKindBetween(activeDeals, a, b) !== null` |
| `gra/src/main.ts:36761` | kod+komentarz | 4 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (3): podmiot z zużytym licznikiem wojen epoki (w tej` |
| `gra/src/main.ts:36770` | kod | 1 / 1 | R-WEB-PEACE-RULES-R8R9 | `pairRelationScore: pairRelationOfR8,` |
| `gra/src/main.ts:36773` | kod | 1 / 1 | R-WEB-ERA-WAR-COUNTER | `isEraWarExhausted: isWarRulesMultiwarEnabled() ? isEraWarExhausted : undefined,` |
| `gra/src/main.ts:37071` | kod | 1 / 1 | R-WEB-AUTO-FORT-CLAIM | `cityLimitBase: _menuCityLimitBase, // R-WEB-AUTO-FORT-CLAIM-Q1` |
| `gra/src/main.ts:37301` | kod | 1 / 2 | R-WEB-PEACE-RULES | `turnsAtWar: diploWarStateFor(ownerId, ME()).turnsAtWar, // R-WEB-PEACE-RULES-Q1 ` |
| `gra/src/main.ts:37386` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: gracz jako partner — flaga agresora (u innych AI` |
| `gra/src/main.ts:37395` | kod+komentarz | 4 / 3 | R-WEB-PEACE-CITY-CESSION | `...diploRelWarFields(ownerId, ME()), // R-WEB-PEACE-RULES-Q1 R1/R3(d)` |
| `gra/src/main.ts:37428` | kod+komentarz | 2 / 1 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: partner AI — flaga agresora wpływa na sojusz/pak` |
| `gra/src/main.ts:37453` | kod | 1 / 1 | R-WEB-PEACE-RULES | `...diploRelWarFields(ownerId, otherId), // R-WEB-PEACE-RULES-Q1 R1/R3(d)` |
| `gra/src/main.ts:37738` | kod+komentarz | 3 / 2 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N1a): miasta TEGO AI do oddania w pokoju.` |
| `gra/src/main.ts:37821` | kod+komentarz | 20 / 14 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: wojna epoki wyłączonej epoki (Brąz/Żelazo, flaga` |
| `gra/src/main.ts:37841` | kod+komentarz | 0 / 7 | R-WEB-WAR-RULES-RELEASE-ROBOCZA | `const gateForcedTag = forcedEraTagFromPowod(cmd.powod);` |
| `gra/src/main.ts:37879` | kod | 1 / 2 | R-WEB-TRUCE | `const truceBreachAi = chargeWarDeclarationCredibility(ownerId, targetId);` |
| `gra/src/main.ts:37886` | kod+komentarz | 7 / 5 | R-WEB-WAR-AGGRESSOR-FLAG | `// R-WEB-WAR-AGGRESSOR-FLAG-Q1: wojna wymuszona epoki NIE nadaje flagi agresora;` |
| `gra/src/main.ts:37900` | kod+komentarz | 8 / 6 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (1, 2): zużycie licznika per cywilizacja i epoka —` |
| `gra/src/main.ts:37990` | kod+komentarz | 5 / 4 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (6): powód wojny epoki widoczny dla gracza (hint + k` |
| `gra/src/main.ts:37997` | kod | 1 / 2 | R-WEB-ERA-WAR-COUNTER | `recordWarDeclarationEvent(ownerId, targetId, eraWarReasonLabel);` |
| `gra/src/main.ts:38001` | kod | 6 / 7 | R-WEB-ERA-WAR-COUNTER | `showHintMessage(` |
| `gra/src/main.ts:38933` | kod+komentarz | 4 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `// R3 Q-A=A (obrona zarzut 4): wejscie wojska AI-cywilizacji na heks fortu = zdo` |
| `gra/src/main.ts:39252` | kod | 1 / 2 | R-WEB-DEFEAT-LAST-CITY-BARBARIANS | `onBarbarianCityBattleResolved,` |
| `gra/src/main.ts:39274` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: po ruchach AI/barbarzyncow w tej turze` |
| `gra/src/main.ts:39327` | kod | 1 / 2 | R-WEB-TRUCE | `const vResult = truceTestSuppressVictory ? null : checkVictory(vInput);` |
| `gra/src/main.ts:39500` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: koniec ruchu na heksie fortu (animacja ucieta)` |
| `gra/src/main.ts:39964` | kod | 1 / 1 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `sweepFortCaptures(); // R3 Q-A=A: koniec ruchu (gracz i AI) na heksie fortu` |
| `gra/src/main.ts:40929` | kod+komentarz | 4 / 2 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1: nowa gra zaczyna z zerowym licznikiem wojen epoki.` |
| `gra/src/main.ts:42520` | kod+komentarz | 17 / 13 | R-WEB-ERA-WAR-COUNTER | `// R-WEB-ERA-WAR-COUNTER-Q1 (7): licznik wojen epoki per (cywilizacja, epoka). Z` |
| `gra/src/main.ts:42727` | kod+komentarz | 3 / 3 | R-WEB-SAVELOAD-PRACA-POOL | `// R-WEB-SAVELOAD-PRACA-POOL-Q1 (decyzja wlasciciela A, 2026-10-31): wczytanie Z` |
| `gra/src/main.ts:42734` | kod | 0 / 8 | R-LISTA-NAZWANA | `const playerCityCountOnLoad = cities.filter(c => c.ownerId === 0).length;` |
| `gra/src/main.ts:42736` | kod+komentarz | 18 / 15 | R-WEB-SAVELOAD-HOTSEAT-PRACA | `// R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1: pule foteli 2+ (fotel 0 = `playerPracaPool` ` |
| `gra/src/main.ts:42775` | kod+komentarz | 14 / 8 | R-WEB-HOTSEAT-HUD-CACHE | `// R-WEB-HOTSEAT-HUD-CACHE-Q1 (decyzja wlasciciela A, 2026-10-31): wartosci pomo` |
| `gra/src/main.ts:42964` | kod+komentarz | 20 / 15 | R-WEB-OUTPOST-FORT-TERRITORY | `// R-WEB-OUTPOST-FORT-TERRITORY-Q1 (2026-10-31): stare zapisy ze starymi fortami` |
| `gra/src/map/improvement-build.ts:428` | komentarz | 7 / 0 | R-WEB-AUTOIMPROVE-STAGES | `* właściciela „Tak, odwracamy — wszystkie trzy", uchyla zakaz z 2026-07-29).` |
| `gra/src/map/improvement-build.ts:462` | komentarz | 2 / 0 | R-WEB-AUTOIMPROVE-STAGES | `// dla rzeczywistej ścieżki applyBuildRequest poza panelem. ABC-2 (właściciel 20` |
| `gra/src/map/improvement-build.ts:465` | komentarz | 1 / 0 | R-WEB-AUTOIMPROVE-STAGES | `// Owce zachowują istniejącą blokadę budowy na lesie (ABC-2: blokada zostaje).` |
| `gra/src/map/newGameMapDefaults.ts:464` | komentarz | 6 / 0 | R-WEB-NEWGAME-DEFAULTS | `/**` |
| `gra/src/map/newGameMapDefaults.ts:471` | kod | 1 / 1 | R-WEB-NEWGAME-DEFAULTS | `if (typ !== 'ziemia') return 30;` |
| `gra/src/map/territory.ts:5` | komentarz | 2 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `* Posterunek r=3, fort r=5 (stałe; decyzja właściciela 2026-10-31, R-WEB-OUTPOST` |
| `gra/src/map/territory.ts:38` | kod+komentarz | 10 / 2 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `export type TerritoryNode = CityNode & {` |
| `gra/src/map/territory.ts:74` | kod+komentarz | 5 / 2 | R-WEB-OUTPOST-FORT-TERRITORY | `/** Promień terytorium fortu (decyzja właściciela 2026-10-31). / EN: fort territ` |
| `gra/src/map/territory.ts:85` | komentarz | 2 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `*   - FORT:      r = 5  (stały; R-WEB-OUTPOST-FORT-TERRITORY-Q1, było 10)` |
| `gra/src/map/territory.ts:90` | kod | 2 / 4 | R-WEB-OUTPOST-FORT-TERRITORY | `if (node.isFort)    return FORT_TERRITORY_RADIUS;` |
| `gra/src/map/territory.ts:119` | komentarz | 2 / 0 | R-WEB-OUTPOST-FORT-TERRITORY | `* węzeł w tablicy `nodes`. Węzły miast mają pierwszeństwo przed fortami/posterun` |
| `gra/src/map/territory.ts:127` | kod | 5 / 7 | R-WEB-OUTPOST-FORT-TERRITORY | `let bestCityOwner: number \| null = null;` |
| `gra/src/map/territory.ts:137` | kod+komentarz | 13 / 15 | R-WEB-OUTPOST-FORT-TERRITORY (wg słów kluczowych) | `if (node.isFort \|\| node.isOutpost) {` |
| `gra/src/map/territory.ts:153` | kod+komentarz | 7 / 3 | R-WEB-OUTPOST-FORT-TERRITORY | `// ZALOZENIE (R-WEB-OUTPOST-FORT-TERRITORY-Q1 R2, zarzut 1): heks w promieniu` |
| `gra/src/render/unitOwnerEmblem.ts:100` | bez-kodu(komentarz/typ/import) | 7 / 0 | wg pliku, bez ustalenia | `/**` |
| `gra/src/render/unitOwnerEmblem.ts:248` | kod+komentarz | 17 / 9 | wg pliku, bez ustalenia | `/** `#rrggbb` (bez skrótu i bez przezroczystości) → ten sam zapis lowercase; ina` |
| `gra/src/render/unitOwnerEmblem.ts:266` | kod | 1 / 2 | wg pliku, bez ustalenia | `function drawDisc(ctx: CanvasRenderingContext2D, ringColor: string): void {` |
| `gra/src/render/unitOwnerEmblem.ts:273` | kod | 1 / 2 | wg pliku, bez ustalenia | `ctx.strokeStyle = ringColor;` |
| `gra/src/render/unitOwnerEmblem.ts:281` | kod | 1 / 2 | wg pliku, bez ustalenia | `function drawFallbackGlyph(ctx: CanvasRenderingContext2D, variant: EmblemVariant` |
| `gra/src/render/unitOwnerEmblem.ts:283` | kod | 1 / 2 | wg pliku, bez ustalenia | `ctx.fillStyle = ringColor;` |
| `gra/src/render/unitOwnerEmblem.ts:335` | kod+komentarz | 4 / 3 | wg pliku, bez ustalenia | `// Barwa obwódki wchodzi do klucza: dwie pełne cywilizacje o różnych kolorach` |
| `gra/src/render/unitOwnerEmblem.ts:373` | kod | 3 / 5 | wg pliku, bez ustalenia | `const ringColor = ringColorFor(variant, octx.ringHex);` |
| `gra/src/render/unitOwnerEmblem.ts:397` | kod | 1 / 2 | wg pliku, bez ustalenia | `drawDisc(ctx, ringColor);` |
| `gra/src/render/unitOwnerEmblem.ts:407` | kod | 1 / 2 | wg pliku, bez ustalenia | `drawDisc(ctx, ringColor);` |
| `gra/src/render/unitOwnerEmblem.ts:417` | kod | 1 / 2 | wg pliku, bez ustalenia | `drawDisc(ctx, ringColor);` |
| `gra/src/render/unitOwnerEmblem.ts:420` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `// Barwa = barwa obwódki tej cywilizacji (ten sam pierścień co na tarczy).` |
| `gra/src/render/unitOwnerEmblem.ts:422` | kod | 1 / 2 | wg pliku, bez ustalenia | `ctx.strokeStyle = ringColor;` |
| `gra/src/render/unitOwnerEmblem.ts:437` | kod | 1 / 2 | wg pliku, bez ustalenia | `drawDisc(ctx, ringColor);` |
| `gra/src/ui/cityPanel.ts:164` | kod | 1 / 1 | R-WEB-SPICHLERZ-HUD-PARAMS | `loadSpichlerzDrainParams,` |
| `gra/src/ui/cityPanel.ts:1282` | kod+komentarz | 8 / 8 | R-WEB-SPICHLERZ-HUD-PARAMS | `// R-WEB-SPICHLERZ-HUD-PARAMS-Q1: te same parametry zużycia co silnik (econ-para` |
| `gra/src/ui/cityPanel.ts:9294` | kod+komentarz | 5 / 4 | R-WEB-SPICHLERZ-HUD-PARAMS | `// R-WEB-SPICHLERZ-HUD-PARAMS-Q1: parametry zużycia Spichlerza jak w silniku.` |
| `gra/src/ui/diplomacyNegotiationModal.ts:14` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-TRUCE | `/** R-WEB-TRUCE-Q1 (N5): 'rozejm' dla akcji '10' wybranej jako rozejm (dlugosc w` |
| `gra/src/ui/diplomacyNegotiationModal.ts:103` | kod+komentarz | 10 / 1 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/ui/diplomacyNegotiationModal.ts:565` | kod | 1 / 1 | R-WEB-TRUCE | `if (payload.actionId === '10') return payload.rodzaj === 'rozejm' ? 'rozejm' : '` |
| `gra/src/ui/diplomacyPanel.ts:34` | bez-kodu(komentarz/typ/import) | 2 / 0 | R-WEB-AGGRESSOR-MARKER | `/** R-WEB-AGGRESSOR-MARKER-Q1: pozostałe tury aktywnej flagi agresora (doTury - ` |
| `gra/src/ui/diplomacyPanel.ts:220` | kod+komentarz | 16 / 10 | R-WEB-AGGRESSOR-MARKER | `/**` |
| `gra/src/ui/diplomacyPanel.ts:266` | kod | 1 / 1 | R-WEB-AGGRESSOR-MARKER | `agresorBadgeHtml(rel.agresorPozostaleTury) +` |
| `gra/src/ui/diplomacyTradeBasket.ts:19` | kod | 1 / 1 | R-WEB-PEACE-CITY-CESSION | `diplomacyMiastoAkcjaDozwolona,` |
| `gra/src/ui/diplomacyTradeBasket.ts:42` | kod | 1 / 2 | R-WEB-PEACE-CITY-CESSION | `renderBasketItemValueHtml as renderBasketItemValueBaseHtml,` |
| `gra/src/ui/diplomacyTradeBasket.ts:70` | kod | 1 / 1 | R-WEB-PEACE-CITY-CESSION | `miasto: 'Miasto (tylko pokój)',` |
| `gra/src/ui/diplomacyTradeBasket.ts:215` | kod+komentarz | 2 / 1 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): bez actionId pozycja 'miasto' = null (fa` |
| `gra/src/ui/diplomacyTradeBasket.ts:234` | kod+komentarz | 18 / 11 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2 defekt r2): cityPn/cityWeight muszą dojść ` |
| `gra/src/ui/diplomacyTradeBasket.ts:540` | bez-kodu(komentarz/typ/import) | 4 / 0 | R-WEB-TRUCE | `/** R-WEB-TRUCE-Q1 (N5): akcja '10' - 'pokoj' (domyslnie) albo 'rozejm' na `truc` |
| `gra/src/ui/diplomacyTradeBasket.ts:641` | kod | 2 / 2 | R-WEB-TRUCE | `peaceKind: initial?.peaceKind === 'rozejm' ? 'rozejm' : 'pokoj',` |
| `gra/src/ui/diplomacyTradeBasket.ts:848` | kod+komentarz | 21 / 21 | R-WEB-TRUCE | `{` |
| `gra/src/ui/diplomacyTradeBasket.ts:883` | kod+komentarz | 6 / 5 | R-WEB-TRUCE | `} else if (actionId === '10') {` |
| `gra/src/ui/diplomacyTradeBasket.ts:1204` | kod+komentarz | 8 / 6 | R-WEB-TRUCE | `case '10':` |
| `gra/src/ui/diplomacyTradeBasket.ts:1329` | kod | 3 / 4 | R-WEB-TRUCE | `const propActionId = actionId === '10' && treatyState?.peaceKind === 'rozejm'` |
| `gra/src/ui/diplomacyTradeBasket.ts:1546` | kod+komentarz | 8 / 6 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): miasto tylko po stronie „Daję", tylko w ` |
| `gra/src/ui/diplomacyTradeBasket.ts:1651` | kod+komentarz | 25 / 22 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): wybór miasta do oddania (lista PW). Mias` |
| `gra/src/ui/diplomacyTradeBasket.ts:1752` | kod | 5 / 5 | R-WEB-PEACE-CITY-CESSION | `+ '<div class="cdb-fields-extra" data-extra="' + prefix + '-miasto">'` |
| `gra/src/ui/diplomacyTradeBasket.ts:1773` | kod+komentarz | 34 / 26 | R-WEB-PEACE-CITY-CESSION | `/**` |
| `gra/src/ui/diplomacyTradeBasket.ts:2200` | kod+komentarz | 8 / 7 | R-WEB-PEACE-CITY-CESSION | `case 'miasto': {` |
| `gra/src/ui/diplomacyTradeBasket.ts:2243` | kod | 1 / 2 | R-WEB-PEACE-CITY-CESSION | `const extras = ['qty', 'city', 'tech', 'resqty', 'miasto'];` |
| `gra/src/ui/diplomacyTradeBasket.ts:2249` | kod | 1 / 2 | R-WEB-PEACE-CITY-CESSION | `zloto: 'qty', praca: 'qty', zywnosc: 'city', tech: 'tech', surowiec_ilosc: 'resq` |
| `gra/src/ui/diplomacyTradeBasket.ts:2363` | kod+komentarz | 2 / 1 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): blok wyboru miasta (tylko pokój/wasal, n` |
| `gra/src/ui/diplomacyTradeBasket.ts:2368` | kod | 1 / 2 | R-WEB-PEACE-CITY-CESSION | `+ '<div class="cdb-land-main">' + treatyHtml + cityPickHtml + '</div>'` |
| `gra/src/ui/diplomacyTradeBasket.ts:2506` | bez-kodu(komentarz/typ/import) | 3 / 0 | R-WEB-TRUCE | `/** R-WEB-TRUCE-Q1 (N5): prefill rodzaju akcji '10' (pokoj/rozejm) i dlugosci ro` |
| `gra/src/ui/diplomacyTradeBasket.ts:2555` | kod+komentarz | 3 / 1 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): akcja koszyka trafia do ctx → basketPnOp` |
| `gra/src/ui/diplomacyTradeBasket.ts:2594` | kod+komentarz | 2 / 1 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 (N5): podglad PW dla rozejmu liczony jak akcja 'rozejm' (baza ` |
| `gra/src/ui/diplomacyTradeBasket.ts:2642` | kod+komentarz | 22 / 19 | R-WEB-PEACE-CITY-CESSION | `// R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2): wybór miasta do oddania w pokoju.` |
| `gra/src/ui/diplomacyTradeBasket.ts:2863` | kod+komentarz | 18 / 15 | R-WEB-TRUCE | `// R-WEB-TRUCE-Q1 (N5): przelacznik pokoj/rozejm i wybor dlugosci rozejmu (klasy` |
| `gra/src/ui/empireDetailPanel.ts:2433` | kod+komentarz | 8 / 5 | wg pliku, bez ustalenia | `// R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: stawka BIEŻĄCEJ epoki — ta sama, którą siln` |
| `gra/src/ui/empireDetailPanel.ts:2627` | kod | 1 / 2 | wg pliku, bez ustalenia | `const z = Math.floor(c.ludki * citizenRate);` |
| `gra/src/ui/empireDetailPanel.ts:2637` | nazwa/tekst | 1 / 2 | wg pliku, bez ustalenia | `h += `<div class="civ-emp-foot">${formatLiczbaPl(citizenRate, 1)} szt. surowca `` |
| `gra/src/ui/empireDetailPanel.ts:3155` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `// ZASPOKAJA CAŁĄ populację imperium tego ownera (stawka per epoka citizenUpkeep` |
| `gra/src/ui/empireDetailTypes.ts:111` | bez-kodu(komentarz/typ/import) | 6 / 0 | wg pliku, bez ustalenia | `* R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1: stawka zużycia tej epoki (sztuk surowca / ob` |
| `gra/src/ui/hexContextTooltip.ts:699` | kod+komentarz | 2 / 1 | wg pliku, bez ustalenia | `/** Rola jednostki dowodzącej, odróżniana od zwykłej jednostki tego samego typu.` |
| `gra/src/ui/hexContextTooltip.ts:772` | kod | 5 / 6 | wg pliku, bez ustalenia | `const isCommander = c.commanderTitle === 'Wódz' \|\| c.commanderTitle === 'Gener` |
| `gra/src/ui/hexContextTooltip.ts:778` | kod | 3 / 4 | wg pliku, bez ustalenia | `+ (isCommander` |
| `gra/src/ui/hexContextTooltip.ts:889` | kod | 3 / 3 | wg pliku, bez ustalenia | `.sp-unit-stack-card.commander{border-color:rgba(232,216,138,.78);background:line` |
| `gra/src/ui/hexContextTooltip.ts:924` | kod | 4 / 5 | wg pliku, bez ustalenia | `const activeName = active.commanderTitle` |
| `gra/src/ui/newGameFlow.ts:243` | komentarz | 5 / 0 | R-WEB-NEWGAME-DEFAULTS | `/**` |
| `gra/src/ui/newGameFlow.ts:250` | kod | 1 / 2 | R-WEB-NEWGAME-DEFAULTS | `battleAlwaysManual: true,` |
| `gra/src/ui/newGameFlow.ts:252` | nazwa/tekst | 4 / 8 | R-WEB-NEWGAME-DEFAULTS | `buildingCostPace: 'normalny',` |
| `gra/src/ui/newGameFlow.ts:258` | kod | 1 / 2 | R-WEB-NEWGAME-DEFAULTS | `cityStateDifficultyOverride: 'normal',` |
| `gra/src/ui/newGameFlow.ts:670` | kod | 1 / 1 | R-WEB-NEWGAME-MENU-REORDER | `cityStateDifficulty: 'TM',` |
| `gra/src/ui/newGameFlow.ts:673` | kod | 4 / 4 | R-WEB-NEWGAME-MENU-REORDER | `barbariansLevel: 'Ba',` |
| `gra/src/ui/newGameFlow.ts:687` | kod+komentarz | 5 / 3 | R-WEB-NEWGAME-MENU-REORDER | `/** Klucze mające dedykowaną ikonę SVG (setting-icon-map.json); pozostałe → glif` |
| `gra/src/ui/newGameFlow.ts:693` | kod | 4 / 6 | R-WEB-NEWGAME-MENU-REORDER | `if (SETTING_SVG_KEYS.has(key)) {` |
| `gra/src/ui/newGameFlow.ts:982` | kod | 4 / 4 | wg pliku, bez ustalenia | `.civ-newgame .civ-matrix-cell>summary{cursor:pointer;list-style:none;}` |
| `gra/src/ui/newGameFlow.ts:1128` | kod | 3 / 4 | R-WEB-NEWGAME-ADV-APPLY-BTN | `.civ-newgame .adv-close{background:rgba(201,168,76,.1);border:1.5px solid var(--` |
| `gra/src/ui/newGameFlow.ts:1234` | kod | 2 / 3 | wg pliku, bez ustalenia | `const row = document.createElement('details');` |
| `gra/src/ui/newGameFlow.ts:1246` | kod | 3 / 4 | wg pliku, bez ustalenia | `const summary = document.createElement('summary');` |
| `gra/src/ui/newGameFlow.ts:1254` | kod | 6 / 6 | wg pliku, bez ustalenia | `const chevron = el('span', 'civ-matrix-cell-chevron', '⌄');` |
| `gra/src/ui/newGameFlow.ts:1266` | kod | 1 / 2 | wg pliku, bez ustalenia | `body.appendChild(meta);` |
| `gra/src/ui/newGameFlow.ts:1271` | kod | 1 / 2 | wg pliku, bez ustalenia | `body.appendChild(status);` |
| `gra/src/ui/newGameFlow.ts:1275` | kod | 2 / 3 | wg pliku, bez ustalenia | `body.appendChild(explanation);` |
| `gra/src/ui/newGameFlow.ts:1282` | komentarz | 1 / 0 | wg pliku, bez ustalenia | `* Pełny profil parametrów w kroku wyboru cywilizacji; liczba pól pochodzi z dany` |
| `gra/src/ui/newGameFlow.ts:1284` | komentarz | 4 / 0 | wg pliku, bez ustalenia | `* Każdy parametr ma własny natywny `<details>` i jest domyślnie zwinięty;` |
| `gra/src/ui/newGameFlow.ts:1300` | nazwa/tekst | 1 / 2 | wg pliku, bez ustalenia | ``${profile.parameterCount} wskaźników · mediana wszystkich 15 cywilizacji · akty` |
| `gra/src/ui/newGameFlow.ts:1633` | kod+komentarz | 2 / 1 | R-WEB-NEWGAME-DEFAULTS | `// R-WEB-NEWGAME-DEFAULTS-Q1: typ Ziemia = szablon bez suwaka udziału lądu (decy` |
| `gra/src/ui/newGameFlow.ts:1637` | kod | 2 / 4 | R-WEB-NEWGAME-MENU-REORDER | `{` |
| `gra/src/ui/newGameFlow.ts:1641` | kod | 1 / 2 | R-WEB-NEWGAME-MENU-REORDER | `row.innerHTML = '<div class="srow-hdr"><div class="srow-ic">' + settingIcon(key)` |
| `gra/src/ui/newGameFlow.ts:1710` | kod+komentarz | 3 / 2 | R-WEB-NEWGAME-MENU-REORDER | `/** Pozycje głównej siatki kroku 4 spoza SETT (ui-params). Kolejność bez znaczen` |
| `gra/src/ui/newGameFlow.ts:1713` | kod | 0 / 16 | scalony sprzed dc8, bez tagu R- (bez ustalenia) | `advRowFromSett('map_quality', 'Jakość renderu mapy 3D — niska / średnia / wysoka` |
| `gra/src/ui/newGameFlow.ts:1717` | nazwa/tekst | 1 / 2 | R-WEB-NEWGAME-DEFAULTS | `hint: 'Reszta to morze. Domyślnie: 30% lądu we wszystkich typach świata z suwaki` |
| `gra/src/ui/newGameFlow.ts:1745` | nazwa/tekst | 1 / 2 | R-WEB-NEWGAME-DEFAULTS | `hint: 'Zaufanie startowe, próg sojuszu sióstr i posiłki obronne miast-państw — n` |
| `gra/src/ui/newGameFlow.ts:1759` | kod | 0 / 8 | scalony sprzed dc8, bez tagu R- (bez ustalenia) | `advRowFromSett(` |
| `gra/src/ui/newGameFlow.ts:1775` | kod | 5 / 4 | R-WEB-NEWGAME-MENU-REORDER | `];` |
| `gra/src/ui/newGameFlow.ts:1781` | kod | 4 / 16 | R-WEB-NEWGAME-MENU-REORDER | `key: 'ruchSwiataPace',` |
| `gra/src/ui/newGameFlow.ts:1786` | kod | 2 / 4 | R-WEB-NEWGAME-MENU-REORDER | `if (advOpts.ruchSwiataPace === 'normalny') return 1;` |
| `gra/src/ui/newGameFlow.ts:1791` | kod | 1 / 2 | R-WEB-NEWGAME-MENU-REORDER | `advOpts.ruchSwiataPace = i === 1 ? 'normalny' : i === 2 ? 'dlugi' : 'krotki';` |
| `gra/src/ui/newGameFlow.ts:1795` | nazwa/tekst | 4 / 8 | R-WEB-NEWGAME-MENU-REORDER | `key: 'cityLimitBase',` |
| `gra/src/ui/newGameFlow.ts:1800` | kod | 3 / 6 | R-WEB-NEWGAME-MENU-REORDER | `const limits = [10, 15, 20];` |
| `gra/src/ui/newGameFlow.ts:1805` | kod | 2 / 3 | R-WEB-NEWGAME-MENU-REORDER | `const limits = [10, 15, 20];` |
| `gra/src/ui/newGameFlow.ts:1809` | kod | 12 / 12 | R-WEB-NEWGAME-MENU-REORDER | `{` |
| `gra/src/ui/newGameFlow.ts:1836` | nazwa/tekst | 4 / 8 | R-WEB-NEWGAME-MENU-REORDER | `key: 'buildingCostPace',` |
| `gra/src/ui/newGameFlow.ts:1841` | kod | 2 / 4 | R-WEB-NEWGAME-MENU-REORDER | `if (advOpts.buildingCostPace === 'normalny') return 1;` |
| `gra/src/ui/newGameFlow.ts:1846` | kod | 1 / 2 | R-WEB-NEWGAME-MENU-REORDER | `advOpts.buildingCostPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski';` |
| `gra/src/ui/newGameFlow.ts:1850` | nazwa/tekst | 4 / 8 | R-WEB-NEWGAME-MENU-REORDER | `key: 'kosztJednostekPace',` |
| `gra/src/ui/newGameFlow.ts:1855` | kod | 3 / 6 | R-WEB-NEWGAME-MENU-REORDER | `if (advOpts.kosztJednostekPace === 'normalny') return 1;` |
| `gra/src/ui/newGameFlow.ts:1860` | kod | 1 / 3 | R-WEB-NEWGAME-MENU-REORDER | `advOpts.kosztJednostekPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski'` |
| `gra/src/ui/newGameFlow.ts:1863` | kod | 15 / 15 | R-WEB-NEWGAME-MENU-REORDER | `advRowFromSett('map_quality', 'Jakość renderu mapy 3D — niska / średnia / wysoka` |
| `gra/src/ui/newGameFlow.ts:1907` | kod+komentarz | 3 / 2 | R-WEB-NEWGAME-MENU-REORDER | `// Pozycje przeniesione do głównej siatki kroku 4 nie są już w tej liście` |
| `gra/src/ui/newGameFlow.ts:1942` | kod+komentarz | 3 / 3 | R-WEB-NEWGAME-ADV-APPLY-BTN | `// „Zastosuj” = zapis wartości (saveNewGamePrefs w hideAdvancedModal) + zamknięc` |
| `gra/src/ui/newGameFlow.ts:2030` | komentarz | 3 / 0 | R-WEB-NEWGAME-MENU-REORDER | `// Siatka 2 kolumny, wypełniana rzędami: [lewa1, prawa1, lewa2, prawa2, …].` |
| `gra/src/ui/newGameFlow.ts:2034` | kod | 6 / 8 | R-WEB-NEWGAME-MENU-REORDER | `'map_size', 'civ_types_count',` |

## 7. Rundy, zarzuty FC i stan dokumentu

- **Runda 1 (`2decddaf5`, `01-operator-r1.md`):** 47 plików, 541 hunków, pomiar heurystyczny. Wycofany w całości przez r2 (superseded).
- **Runda 2 (`a89edaa80`, `02-operator-r2.md`):** właściciele z blame, 0 NIEPRZYPISANY, pomiary K08D/K08E/K09A/kopii, wpływ na 8I/8I2/8H2/8A/8G, 236 hunków wojna/pokój. FC r2 (`720ae9522`, `03-final-control.md`): FAIL; zarzut 1 dotyczy `git diff --check`, zarzuty 2–3 spójności dokumentu (sprzeczne §3–§6, błędne uzasadnienie NIE_ZMIERZONO); zarzuty merytoryczne 1–6 z r1 uznane przez FC za zamknięte w r2.
- **Runda 3 (ta):** (1) usunięto trailing whitespace z dokumentu (16 linii appendixu z kodu); (2) §3–§6 przepisane na wartości z r2 jako jedna spójna wersja, §7 nie zawiera sprzecznych wersji; (3) ograniczenia powtórzone w §3 i §4 (K01–K07 i K08A–C NIE_ZMIERZONO blokowo; K08E/K09A z pinem `dc8` nieważne; 100 hunków „wg pliku, bez ustalenia”; kryterium zero-bez-właściciela spełnione tylko w sensie NIEPRZYPISANY=0).
- **Decyzje orkiestratora (2026-10-31), uwzględnione:** `R-WEB-UI-EMBLEM-TOOLTIP-Q1` zatwierdzony jako PROPOZYCJA, bez startu; 100 hunków bez tagu R- oznaczone „wg pliku, bez ustalenia”.
- **Odniesienia do poprzedniego zapisu:** r1 §5 i §6 (klasyfikacja i właściciel „wg pliku”) są zastąpione przez §1, §5 i §6 tego dokumentu oraz TSV.
