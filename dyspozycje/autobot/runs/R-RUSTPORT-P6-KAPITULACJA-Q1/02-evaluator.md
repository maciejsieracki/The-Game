# R-RUSTPORT-P6-KAPITULACJA-Q1 — Evaluator (adwersarialny), runda 1

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-KAPITULACJA-Q1 (kapitulacja głodowa oblężenia, W3/W4/W5)
GOAL: kapitulacja głodowa w produkcyjnym ticku (`PlayableGame::advance_turn`, faza Economy) 1:1 z pinem `07d2fbd72`
(N3 `main.ts:38808-38878`, `handleSiegeCapitulationPhase` `:17646`, `resolveSiegeSurrender` `:17662-17878`, `endMapSiege`).
OCENIANY KOD: `rust-port-wip/kapitulacja-q1` = `4f34cb30d` (kod `003b295b0..9863a83c9` + raport), baza
`origin/rust-port/parity-v2` = `e1f61c503c7c48d9cb9183d462a2b698ee490ab4` (merge-base zgodny z dispatchem).
ZMIANY/COMMIT: tylko ten raport (gałąź Evaluatora `eval/kapitulacja-q1`, worktree `wf_619caad9-bd7-2`); kodu nie zmieniałem.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone (kody wyjścia)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`…/scratchpad/kapq1eval/target`, poza repo, usunięty po bramkach — 4,1 GB).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| Testy dotknięte: lib 149, `bridge_contract` 10, `p6_k5loop_wiring_b` 15, `_b_pin` 2, `p6_kapitulacja` 7, `p6_siege_capital_plunder` 3, `p6_siege_capture_events` 3, `p6_siege_surrender` 10, `p6_siege_transfer` 2, `_effects` 4, `_effects_q4` 12, `_prod` 5, `_q5` 6, `p6_zdobycie_miasta_a` 6, `_a_bridge` 7, `p6_zdobycie_miasta_b` 16, `_b_bridge` 6 | EXIT 0, 0 failed |
| Generator `node p6_kapitulacja_gen.mjs` (node22 + TS z `/opt/node22`) | SHA-256 pinu `376cbfc6…162c` = oczekiwany; MD5 `vectors.json` = `1b597a72b262661ae09128c93be55d6b` = commit (odtworzony bajt w bajt) |
| Pełny `cargo test --all-targets --no-fail-fast` | **NIE_ZMIERZONO w całości**: przerwany strażnikiem dysku (wolne < 0,7 GB przez równoległe workery; `DISK_ABORT 04:23:23`, EXIT 143). Do przerwania: 316 binarek, 2563 passed, 0 failed, 0 ignored. Operator raportuje pełne EXIT 0 (4222 passed) na `9863a83c9` — nie potwierdzam ani nie podważam. |

`#[ignore]`: brak nowych. Osłabionych/usuniętych asercji w diffie: brak (`git diff e1f61c503 4f34cb30d | grep '^-.*assert'` = pusto).

## 2. Allowlista

Zmienione: `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`, nowe `tests/p6_kapitulacja.rs`,
`p6_kapitulacja_gen.mjs`, `p6_kapitulacja_vectors/vectors.json`, `runs/.../01-operator-r1.md` — wszystko w allowliście.
Nie ruszono: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `bridge.rs`, `save_load.rs`, `client`,
`renderer`, `src-tauri`, `gra/`. Sekcja „Pliki spoza allowlisty”: brak takich plików (raport Operatora wymienia „Nie
ruszano”, zgodne z diffem). `playable.rs`: 2 pola stanu + hak w `advance_turn` + getter — w granicy „tylko konieczne”.
Drobiazg: doc-komentarz `siege_battle()` („K5LOOP-WIRING-B-Q1: trwajaca bitwa obleznicza”) został odcięty od swojej funkcji
i przykleja się teraz do `last_siege_tick()` (`playable.rs` ~1426).

## 3. Zgodność z pinem (czytane: `git show 07d2fbd72:gra/src/main.ts`, `cities.ts`, `siege-starvation.ts`, `turn-economy.ts`)

Zgodne (sprawdzone linia po linii): kolejność kroków `resolveSiegeSurrender` (brak miasta → `endMapSiege`; `besiegerOwnerForCity`;
`areEnemyOwners` tylko gdy `newOwner !== null && !== ownerId`; snapshoty; `applyCapturePopulationLoss` z `capturedFromOwnerId`
i warunkiem odbicia; prawo po przejęciu bez strażnika barbarzyńcy; zmiana właściciela; `settleWonderTransfer` → `noteCityCapture`;
`maybeResolveRegularWarOnCityCapture` (gracz = no-op); `recordWarCityLossForPair`; kolejka; `Math.max(1)`; usunięcie
WSZYSTKICH jednostek starego właściciela z heksu, także cywilów; `enterCityAfterSurrender`; `playerEverOwnedCityByOwner`;
`runCapitalCapturePlunder`; `recordCityCaptureEvent`; `endMapSiege`; racje po `endMapSiege`). N3: `siegeDefenderUnits`
(właściciel, heks, niecywil, `hp<=0` odrzucone), start głodu, atrycja z `glodWojskaHpFrac` per trudność, ponowna ocena po atrycji,
`setLegacyPending` → `handleSiegeCapitulationPhase`, inaczej `surrenderNow`. Generator wycina i wykonuje tekst pinu (N3,
`resolveSiegeSurrender`, `handleSiegeCapitulationPhase`, `endMapSiege`, `besiegerOwnerForCity`, `areEnemyOwners`,
`applyCapturePopulationLoss`) i ładuje moduły pinu w całości — to jest wykonanie tekstu, nie kopia logiki.

Sonda Evaluatora (plik tymczasowy, usunięty): scenariusz `legacy_gracz` i `ai_ai` z miastem-stolicą jako jedynym miastem
ofiary → `run_siege_turn` i 3× `advance_turn` bez błędu; `capital_event = Eliminacja`, `eliminated_owner_id = 101`. Ścieżka
łupu/eliminacji działa technicznie, ale **żaden test tematu jej nie sprawdza** (pkt 4).

## 4. Zarzuty

### Z1 (blokujący) — kryterium końca E2E niespełnione dla kolejki produkcji, łupu stolicy, statusu wojny i karty zdarzenia

Dispatch, KRYTERIA KOŃCA: „tura 2 przejęcie (miasto, jednostki, populacja −1, prawo, kronika, **kolejka produkcji**, religia,
**plądrowanie stolicy**, **status wojny**) zgodne z wektorami z generatora wykonującego tekst pinu”. W generatorze te kroki są
zaślepkami: `sanitizeBuildQueue` rzuca wyjątek (cityProd zawsze puste), `runCapitalCapturePlunder` zwraca `null` (żadne miasto
nie jest stolicą), `recordWarCityLossForPair` tylko loguje nazwę, `buildCityCaptureReportRows`/`capturePopLossReportRow` zwracają
`[]`/`null`. Wektor `events` (`recordCityCaptureEvent`) jest zapisywany przez generator, ale test go nie porównuje. Dowód
mutantami (pkt 5): usunięcie `capital_plunder`, `apply_capture_production`, `record_war_city_loss_for_pair`,
`apply_record_city_capture_event` albo wyczyszczenie wierszy karty — **wszystkie PRZEŻYWAJĄ** cały zestaw
(`p6_kapitulacja`, `p6_zdobycie_miasta_a`, `_b`, `bridge_contract`). Argument „pokryte wektorami Q6/B” nie wystarcza: tamte
wektory sprawdzają funkcje, a nie to, że kapitulacja je woła z właściwymi argumentami (owner old/new, `designated` przed zmianą
właściciela — mutant E09 „puste stolice” też przeżywa).
Wymagane: scenariusze generatora z (a) stolicą ofiary (przejęcie stolicy i eliminacja ostatniego miasta — wykonanie
`runCapitalCapturePlunder` z pinu albo co najmniej asercja stanu skarbca/techów/stolic/eliminacji wg wektorów Q6 dla tego
wejścia), (b) niepustą kolejką `cityProd` (wykonanie `sanitizeBuildQueue`/`sanitizeProductionQueue`/`filterQueue` z pinu,
w tym budynek `lokalizacja:'stolica'`), (c) wpisem `recordWarCityLossForPair` w stanie (para meta), (d) asercja `events`
z generatora wobec `state.capture_events`.

### Z2 (blokujący) — usuwanie obrońców: warunek heksu nietestowany

Mutant F05 (usuń warunek `position == hex` → kapitulacja kasuje WSZYSTKIE jednostki starego właściciela na całej mapie)
**przeżywa**. W żadnym scenariuszu z przejęciem stary właściciel nie ma jednostek poza heksem miasta. To błąd o skutku
gameplay (zniknięcie całej armii) bez żadnego strażnika. Wymagany scenariusz: jednostka starego właściciela poza miastem
(sąsiedni heks i daleko) przeżywa kapitulację.

### Z3 (blokujący) — `siegeDefenderUnits`: filtr właściciela nietestowany

Mutant E17 (obrońcy bez warunku `owner_id == city.owner_id`) **przeżywa**: w scenariuszach na heksie miasta stoją wyłącznie
jednostki właściciela albo cywil obcy (odfiltrowany jako cywil). Wymagany scenariusz: wojskowa jednostka obcego (np. sojusznika
lub trzeciej strony) na heksie miasta nie liczy się do garnizonu (pin `siege-starvation.ts:72-79`).

### Z4 (ważny) — miejsce wpięcia w turę i ścieżka błędu bez testu

- Mutant E10 (tick na fazie `Diplomacy` zamiast `Economy`) **przeżywa** — kolejność faz (decyzja właściciela W8 r7 Q2, pin:
  N3 po ticku ekonomii) nie jest przypięta testem. Wymagany test, który rozróżnia fazę (np. wojna kończona pokojem w fazie
  Diplomacy tej samej tury vs kapitulacja, albo asercja kolejności w `last_advanced_phases` z raportem ticka).
- Mutant F07 (błąd ticku nie cofa `economy`) i E08 (brak odrzucenia zdobywcy-barbarzyńcy, D-KAP-6) **przeżywają** — ścieżka
  `Err` z `run_siege_turn` w `advance_turn` nie ma żadnego testu. Wymagany test: stan, w którym kapitulacja zwraca błąd
  (właściciel 0 albo zdobywca-barbarzyńca), → `advance_turn` = `Err(WarTurn("oblezenie: …"))`, stan i kolejka bez zmian.
- Semantyka błędu różni się od pinu: pin łapie wyjątek N3 (`try { … } catch { console.error }`) i tura TRWA; Rust odrzuca całą
  turę. Przy trwałym błędzie (stan się nie zmienia) gra nie może przejść tury — miękka blokada. Ta sama funkcja dla fazy
  Victory przyjęła semantykę pinu (log i dalej). D-KAP-3 musi to jawnie uzasadnić w rejestrze albo przyjąć semantykę pinu;
  obecnie błędy są osiągalne tylko przy danych zdegenerowanych (właściciel 0, barbarzyńca, brak danych mocy przy eliminacji),
  więc to nie jest samodzielna przyczyna FAIL, ale wymaga decyzji orkiestratora (techniczna, REJESTR-RUST).

### Z5 (uwaga, nieblokująca) — D-KAP-2: zegar głodu bez ticka ekonomii

Pin (`turn-economy.ts:2808-2830`, WIRE 4) zmniejsza `magazynZywnosci` co turę oblężenia o `population + garnizon` i podaje
`obleganyGlod`/`magazynPoTurze` do N3. Rust nie ma ticka ekonomii, więc: zapas > 0 nigdy nie maleje (oblężenie bez końca),
brak pola = 0 (kapitulacja po 2 turach od razu). Żaden producent nie ustawia dziś `magazyn_zywnosci` ani `oblegane`
(KAP-DL-5; `save_load` odtwarza `oblegane`, ale nie `magazynZywnosci` i nie jest wpięty w most), więc rozjazd jest dziś
nieosiągalny w grze. Musi być wpisany w rejestr jako warunek: **nie wolno wpiąć rozpoczęcia oblężenia ani Load z `oblegane`
przed EKONOMIA-TURA (#352) albo przed przeniesieniem zegara WIRE 4**, inaczej każde oblężone miasto kapituluje po 2 turach.

### Z6 (uwaga) — `maybeResolveRegularWarOnCityCapture` AI↔AI (KAP-DL-1)

Szturm (D-ZMA-7) odrzuca parę AI↔AI błędem; kapitulacja przejmuje miasto i tylko wpisuje `not_applied`. Pin podkreśla
(`main.ts:17723-17735`), że dla AI↔AI to „jedyna droga zakończenia wojny poza tym licznikiem”. Rozbieżność jest jawna i
osiągalna dopiero przy oblężeniach AI↔AI w produkcji — akceptowalna jako dług, ale niespójność z D-ZMA-7 wymaga wpisu w rejestrze.

### Z7 (drobne)

- `glod_wojska_hp_frac` mapuje nieznaną etykietę trudności po cichu na `Normal`, podczas gdy `replace_difficulty_of`
  (`playable.rs:575`) zwraca błąd — ten sam wzorzec ma `for_new_game`, więc nie blokuję; warto ujednolicić.
- E14 (limit stosu `None` zamiast 500) przeżywa — w scenariuszach nigdy > 500 jednostek; Operator zabił M17 (limit 0), więc
  stała jest częściowo przypięta (`vectors_guard` porównuje 500 z pinem). Akceptuję jako równoważny w zakresie wektorów.
- E19 (odwrotna kolejność miast) przeżywa — scenariusz `dwa_miasta` nie ma interakcji między miastami. Brak scenariusza, w którym
  kolejność ma znaczenie (np. ta sama jednostka sąsiaduje z dwoma miastami / `besiegerOwnerForCity` przez sąsiada). Nieblokujące.
- Doc-komentarz `siege_battle()` przeniesiony (pkt 2).

## 5. Mutanty Evaluatora (bramka: `p6_kapitulacja` + `p6_zdobycie_miasta_a` + `_b` + `bridge_contract`; źródła przywracane, `git status` czysty po serii)

| ID | Mutacja | Wynik |
|---|---|---|
| E01 | brak `capital_plunder` w kapitulacji | **PRZEŻYŁ** |
| E02 | brak `apply_capture_production` w kapitulacji | **PRZEŻYŁ** |
| E03 | brak `record_war_city_loss_for_pair` w kapitulacji | **PRZEŻYŁ** |
| F04 | karta zdarzenia z pustymi wierszami | **PRZEŻYŁ** |
| F05 | usunięcie jednostek starego właściciela bez warunku heksu | **PRZEŻYŁ** |
| F06 | brak `apply_record_city_capture_event` | **PRZEŻYŁ** |
| F07 | błąd ticku nie cofa `economy` | **PRZEŻYŁ** |
| E08 | brak odrzucenia zdobywcy-barbarzyńcy | **PRZEŻYŁ** |
| E09 | `designated` (stolice przed przejęciem) puste | **PRZEŻYŁ** |
| E10 | tick na fazie `Diplomacy` | **PRZEŻYŁ** |
| E11 | brak gaszenia `oblegaCityId` w `end_map_siege_state` | zabity |
| E12 | `areEnemyOwners` zawsze false | zabity |
| E13 | `max(1)` liczone z ludności sprzed straty | zabity |
| E14 | brak limitu stosu przy wejściu | przeżył (równoważny w zakresie wektorów, Z7) |
| E15 | `playerEverOwned` dla starego właściciela | zabity |
| F16 | `capturedFromOwnerId` = nowy właściciel | zabity |
| E17 | obrońcy bez filtra właściciela | **PRZEŻYŁ** |
| E18 | zapis startu głodu bez `record_start` | zabity |
| E19 | odwrotna kolejność miast | przeżył (nieblokujące, Z7) |
| E20 | `SetPending` nie zapisuje flagi | zabity |

20 mutantów: 7 zabitych, 2 nieblokujące (E14, E19), **11 przeżywa bez równoważności** (E01, E02, E03, F04, F05, F06, F07, E08,
E09, E10, E17 — E08/F07 dotyczą ścieżki błędu). (Wariant E07 „kontynuacja tury po błędzie” nie kompilował się — zastąpiony F07.)
Skrypt: `scratchpad/kapq1eval/mut.py` (logi `mut.log`, `mut2.log`). Kryterium dispatchu „Mutanty ≥ 20 (każdy zabity lub jawnie równoważny)” nie
jest spełnione. Równoważności Operatora M19/M26/M28 przyjmuję (uzasadnienia zgodne z pinem: obrońcy nie mają `oblegaCityId`
do własnego miasta; `removed_unit_ids` to pole raportu; zapas nie zmienia się między decyzją a fazą kapitulacji bez ticka
ekonomii).

## 6. Decyzje D-KAP — ocena

D-KAP-1 (typ `PlayableCitySiege`), D-KAP-4 (trudność gry), D-KAP-5 (gaszenie nieaktualnych pól), D-KAP-7 (`stored = None`),
D-KAP-9 (id gracza): akceptuję. D-KAP-2: akceptuję z warunkiem z Z5. D-KAP-3: wymaga decyzji (Z4). D-KAP-6: akceptuję, ale
bez testu (E08). D-KAP-8: akceptuję jako dług z wpisem (Z6). Gameplay poza webem: nie stwierdziłem.

## 7. Tabela W3–W5 (Evaluator)

| # | Element | Ocena |
|---|---|---|
| W3 | flaga → przejęcie w następnym ticku, start głodu, atrycja, kapitulacja < 50%, flaga z zapisu | ZASTOSOWANO, przypięte wektorami (poza filtrem właściciela obrońców — Z3) |
| W4 | `besiegerOwnerForCity`, pokój, brak oblegającego, brak miasta | ZASTOSOWANO, przypięte |
| W4 | strata ludności, prawo, właściciel, cuda/kronika, `Math.max(1)`, wejście armii | ZASTOSOWANO, przypięte |
| W4 | usunięcie obrońców | ZASTOSOWANO, warunek heksu NIEPRZYPIĘTY (Z2) |
| W4 | kolejka produkcji, `recordWarCityLossForPair`, łup stolicy/eliminacja, karta zdarzenia | WYWOŁANE w kodzie, **NIEPRZYPIĘTE** testem tematu (Z1) |
| W4 | `endMapSiege`, racje po `endMapSiege` (poza stanem) | ZASTOSOWANO / jawnie `not_applied` |
| W5 | `capturedFromOwnerId`, `playerEverOwnedCityByOwner`, kronika | ZASTOSOWANO, przypięte |
| W5 | zdobycze mocy przy eliminacji | wywołane przez `capital_plunder`, NIEPRZYPIĘTE (Z1) |

## 8. Długi (do rejestru przez orkiestratora)

KAP-DL-1…7 Operatora — zasadne. Dodatkowo: **KAP-EV-1** warunek Z5 (blokada wpięcia startu oblężenia/Load przed zegarem
WIRE 4), **KAP-EV-2** semantyka błędu N3 (Z4), **KAP-EV-3** niespójność AI↔AI szturm (błąd) vs kapitulacja (przejęcie bez
licznika) (Z6).

## 9. Następny krok

Runda 2 Operatora (to samo ID): scenariusze generatora dla Z1 (stolica + eliminacja, kolejka produkcji z budynkiem stołecznym,
para meta `recordWarCityLossForPair`, asercja `events`), Z2 (jednostki starego właściciela poza heksem), Z3 (obca jednostka
wojskowa na heksie), Z4 (test fazy i ścieżki `Err` w `advance_turn`); ponownie mutanty E01–E10, E17, F04–F07 muszą zostać
zabite. Pełny `cargo test --all-targets` do potwierdzenia przy ≥ 5 GB wolnego dysku.
