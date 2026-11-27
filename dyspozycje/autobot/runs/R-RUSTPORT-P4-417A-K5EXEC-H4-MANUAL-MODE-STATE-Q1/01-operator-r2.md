STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb reczny gracza w ciele bitwy (czesc A), runda 2 = pierwsza polowa pozostalej pracy: wektory KROKU ciala z WYKONANIA tekstu pinu 07d2fbd72 dla rozkazow hold / none / move / attack / attackMove (dowod kryteriow 2 i 4 dispatchu; kryterium 3 i oblezenie reczne = r3)
ZMIANY/COMMIT: baza r2 = 707654e47 (obrona r1 + raport FC). Kod: 0568a7cb6 (generator, wektory, test, poprawki ciala) i 38a94c654 (test marszu atomowego); raport w kolejnym commicie tej galezi. Pliki (allowlista OK): rust-port/engine/src/domain/siege_tactics_loop.rs (+49/-7), rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs (+306, nowy tryb za flaga), rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/manual_body_step_vectors.json (nowy), rust-port/engine/tests/p4_417a_manual_body_vectors.rs (nowy, osobny plik testowy; dozwolone przez dispatch r2 pkt 2), raport. Brak zmian w gra/, istniejacych plikach wektorow, istniejacych testach, siege_prod_manual.rs (mutanty tylko tymczasowo, przywrocone; git status czysty). git diff --check czysty. Brak #[ignore], brak push, brak git add -A.
TESTY: (a) nowy test `tryb_reczny_ciala_zgodny_z_pinem_na_wektorach_kroku`: 1410 przypadkow z wykonania pinu, 0 rozbieznosci; (b) `tryb_reczny_ciala_marsz_atomowy_zgodny_z_pinem`: 284 przypadki (co 4. nie-`none` + wszystkie odmowy muru), 0 rozbieznosci; (c) cargo fmt --check EXIT 0; (d) cargo clippy --all-targets -- -D warnings EXIT 0; (e) pelny `cargo test --all-targets --no-fail-fast` EXIT 0: 4432 passed, 0 failed, 1 ignored (ignorowany istnial przed r2; r2 nie dodaje #[ignore]); istniejace 41 testow p4_417a_manual_mode_state i wszystkie istniejace wektory (45 vectors.json, speed, speed_change, tower_due_order, move_order, attack_order, siege_manual_order) bez zmian i zielone. Straznik SHA-256 pinu w generatorze BEZ ZMIAN: 3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d (wektory i test go asertuja). SHA-256 generatora po dopisaniu trybu: 19f76e74e3589a1088a3ebec950800ecfdba6564fc13e00815048ab4f6a82303 (zmiana oczekiwana: nowy tryb; istniejace tryby nietkniete). MD5 manual_body_step_vectors.json: 59e325fda1f0b3e5bbf20185e613f4ea.
BLOKADY: brak. (Wyniki r2 wymagaja potwierdzenia przez Evaluatora; r3 = oblezenie reczne + kolejka, patrz mapa nizej.)
RUNDY: 2/5 (Operator r2)
NASTEPNY KROK: Evaluator r2, Obrona, Final Control; po PASS r2 -> r3 tego samego ID (oblezenie reczne ciala + kolejka execute_units_immediate na wektorach)
DEPLOY/PUSH: NIE WYKONANO

## 1. Co zrobiono (kryteria r2 a-e)

### 1.1 Tryb generatora (kryterium a)
`WIRING_A_MANUAL_BODY_STEPS=1` w `p6_k5loop_wiring_a_gen.mjs` (nowy blok przed trybem H3; zadnej zmiany istniejacych trybow ani straznika SHA). Dla kazdego przypadku generator wykonuje z TEKSTU pinu `_activateUnit(ru, done)` (`battleScene.ts:6024-6112`) na scenie w trybie recznym (`_manualMode`, strona gracza = `_deployPlayerSideOpt`), z rozkazem gracza ustawionym na aktorze; wejscie do `_performPlayerOrder` (`:6067-6069`, cialo `:18280-18428`) wykonuje pin, nie generator. Stuby wykonawcze: `_doMove` (przestawia jednostke i `occByKey`, potem callback; przy `siegeWallCol >= 0` powiela odmowe `_siegeMoveRefused` z `:8689-8693`, bo stub omijalby bramke muru), `_doAttack`, `_doRangedAttack`, `_doMeleeAttack`, `_refreshQueuedOrderVisuals`. Przypadki z czynnoscia spoza {done, move, attack} albo z drugim wykonaniem sa odrzucane i liczone (`dropped`: 0 w finalnym zapisie). Blokada generala nieaktywna (czesc B). Zapis: stan jednostek (pozycje, `dead`/`fadingOut`/`routed`/`removed`, `ru.range` po `_applyTerrainRange`, amunicja, `rangedBase`, `formationRank`, doktryna jednostki i grupy, `lastAutoMoveFrom`), `_groupMeta`, `occByKey`, rozkaz, strona gracza, kolumna muru, `wallEverBreached`; oczekiwane: rodzaj akcji, pole kroku, indeks celu ciosu, `ru.playerOrder` po aktywacji, `lastAutoMoveFrom`, klucze `_groupMeta` po aktywacji, pozycja po aktywacji, `refused`.

Sceny: 3 bazy z `attack_order_step` (`st_mur`, `st_rzeka`, `st_las`; piechota, lucznicy, jazda, falanga), teren i jednostki z pinu. Przypadki: hold 60, none 240 (+60 z murem), move 270 (+120 z murem), attack 240 (+90 z murem), attackMove 240 (+90 z murem) = 1410; obie strony jako aktor (736 obroncy, 674 atakujacy); warianty z murem sceny (360) dla rozkazu `move` obu stron i wszystkich rozkazow obroncy (bramka H3 `:18436` odrzuca `move` i obroncow; oblezenie reczne atakujacego = r3). Rodzaje wyniku pina: done 486, move 636, attack 288 (rozklad per rozkaz w tescie).

### 1.2 Konsument Rust (kryterium a, 2)
`tests/p4_417a_manual_body_vectors.rs`. Dla kazdego przypadku test buduje TA SAMA scene produkcyjna sesja (`SiegeBattleSession::prepare_scene` z `inputs` w formacie `vectors.json`; pole bitwy, teren, rozstawienie, jednostki), a potem NADPISUJE stan z migawki (pozycje, flagi, `occByKey` przez nowe `ProdBody::set_occupancy`, amunicja, zasieg, szyk, doktryna jednostki i grupy, `lastAutoMoveFrom`, strona gracza, mur i wyłom) i wola produkcyjne `ProdBody::start` w trybie recznym (`enable_manual_exec`). Decyzje liczy produkcyjne `plan_manual_order`/`decide_manual` z predykatami ciala (przejezdnosc z `FieldMoveTerrain`, zajetosc, `_compactAttackAllowsStep`, `_priorityScore`, `_canStrikeTargetFrom`, `_shouldAvoidAutoBacktrack`); wartosci predykatow NIE sa kopiowane z pinu (inaczej niz w wektorach portow). Konfiguracja = produkcyjna sesja (`march_incremental = true`, `move_order_exec = true`); drugi test powtarza `move`/`attack`/`attackMove`/`hold` w marszu atomowym (`march_incremental = false`). Kazdy przypadek na swiezej sesji (`prepare_scene` ~0,2 s w profilu dev): przypadki rozdzielone na do 4 watkow (kazdy z wlasnymi sesjami). Czas testow: ok. 57-80 s (glowny) i ok. 15 s (atomowy) na 4 rdzeniach.

### 1.3 Dwie rozbieznosci ciala z pinem znalezione przez wektory i naprawione (produkcyjne, `siege_tactics_loop.rs`)
1. `_compactAttackAllowsStep` (`:8140`) woła `_effectiveMetaForUnit(ru)` -> `_ensureGroupMeta` (`:17633-17636`): wywolanie predykatu DOPISUJE wpis grupy jednostki. Rust nie dopisywal (82 rozbieznosci kluczy `_groupMeta` na `move`/`attack`/`attackMove` z `groupId` bez wpisu). Poprawka: `ProdAdvanceWorld::compact_probe` (slad wywolania predykatu) i `ensure_group_meta_of` po decyzji w `decide_manual`. Skutek w grze: wpis `{ steady, autoPlay: true }` istnieje po rozkazie (dotad brak; sama decyzja kroku nie zalezala od tego, wiec byl to dlug stanu, nie zmiana wyniku).
2. Odmowa bramki muru w rozkazie `move` (`_doMove` `:8689-8693`): `done()` odmowy to callback kroku (`:18350-18352`), czyli `lastAutoMoveFrom = previousPosition` ustawia sie TAKZE przy odmowie. Rust (marsz krokowy `march_move`) go pomijal; w marszu atomowym warunek byl odwrocony (`if !done`). Poprawka w obu sciezkach. Skutek w grze: `isImmediateBacktrack` w nastepnej aktywacji (`:18318`) uzywa tej wartosci, wiec to byla realna rozbieznosc decyzji (3 przypadki w 1410).

Obie poprawki przywracaja zachowanie pinu (wzorzec = kod pinu, D-417A-2), nie sa odstepstwem od webu; lista pozostalych rozbieznosci na wektorach: brak.

### 1.4 Podprzyczyny i pokrycie (kryterium a, 4 dispatchu)
Cel rozkazu `attack` (po stronie przeciwnej): zywy 206, `dead` 27, `routed` 25, `fadingOut` 17, `removed` 15, nie-wrog (id wlasnej strony albo `brak`) 40. Cel = pozycja aktora: `move`/`attackMove` 49 (`attack` = pozycja nie istnieje geometrycznie: dwie jednostki nie zajmuja jednego pola, wiec wariant jest pusty; pokrycie `attack` z celem w zasiegu bez ruchu: 63 przypadki rodzaju `attack`). Progi w tescie (`>= 10` na podprzyczyne `dead`/`routed`/`removed`/`nie-wrog`, `>= 5` `fadingOut`, `>= 10` `cel = pozycja` dla `move`/`attackMove`, `>= 20` na pare rozkaz x strona, `>= 10` na rozkaz x rodzaj wyniku). Uwaga: rozkaz `attack` pomija wg pinu tylko `dead`/`fadingOut` (`:18397`); `routed` odfiltrowuje juz `_enemiesOf` (`:8291`), `removed` nie jest filtrowane przez `attack` (wektory to potwierdzaja, 0 rozbieznosci).

### 1.5 Mutanty (kryterium b: >= 8 NOWYCH innych niz M1-M22, M4/M8/M11-M16)
17 mutantow na plikach produkcyjnych (siege_prod_manual.rs, siege_tactics_loop.rs), kazdy uruchomiony przeciw nowym testom (skrypt tymczasowy, pliki przywrocone, git status czysty):

| ID | zmiana | wynik |
|---|---|---|
| N1 | `move`: cel osiagniety nie zdejmuje rozkazu | ZABITY (30 rozbieznosci) |
| N2 | `attack`/`attackMove`: zdjecie rozkazu pominiete | ZABITY (123) |
| N3 | `attack`/`attackMove`: `previousPosition` gubiona (`prev: None`) | ZABITY (39) |
| N4 | `attack`: zasieg ciosu `dd < reach` zamiast `<=` | ZABITY (236) |
| N5 | klasa zajmujacego: strona gracza zawsze atakujaca | ZABITY (15) |
| N6 | brak wpisu grupy po `_compactAttackAllowsStep` | ZABITY (90) |
| N7 | bramka oblezenia recznego bez warunku strony atakujacej | ZABITY (170) |
| N8 | bramka oblezenia recznego obejmuje rozkaz `move` | PRZEZYL: ROWNOWAZNY (port `siege_manual_order_step` i tak zwraca `NotHandled` dla `move`, wiec dopisek `!matches!(order, Move)` jest nadmiarowy wzgledem portu `:18436`) |
| N9 | roster ataku: `removed` ignorowane | ZABITY (2) |
| N10 | roster ataku: `routed` ignorowane | ZABITY (30) |
| N11 | odmowa muru nie zapisuje `previousPosition` (marsz krokowy) | ZABITY (3) |
| N12 | `order_at`: `finish` skirmish odwrocony | ZABITY (25) |
| N13 | `begin_doctrine_move`: zamienione col/row | PRZEZYL: ROWNOWAZNY (surowa wartosc `orders` jest zawsze nadpisywana przez `settle`/`order_at` z `finish`; nieobserwowalna z zewnatrz ciala) |
| N14 | `start`: strona gracza zawsze atakujaca | ZABITY (736) |
| N15 | `attack`: `lastAutoMoveFrom` ignorowane | ZABITY (3) |
| N16 | marsz atomowy: `previousPosition` nie zapisana | PRZEZYL w glownym tescie (konfiguracja produkcyjna jest krokowa), ZABITY po dodaniu testu marszu atomowego (23 rozbieznosci z 284) |
| N17 | koniec kroku rozkazu: `previousPosition` nie zapisana | ZABITY (88) |

Wynik: 15 zabitych, 2 jawnie rownowazne z uzasadnieniem (N8, N13); wymagane >= 8: spelnione.

## 2. Decyzje techniczne (D-417A-r2; do wpisu w REJESTR-RUST.md przez orkiestratora)
- D-417A-r2-1: wektory ciala uzywaja produkcyjnej sesji jako budowniczego sceny + nadpisania stanu (nie wlasnego budowniczego ProdBody), bo sesja jest jedynym zrodlem terenu, rozstawienia i danych jednostek zgodnych z pinem; nadpisywanie stanu migawka nie zmienia kodu ciala.
- D-417A-r2-2: stuby `_doMove` w generatorze przestawiaja jednostke i `occByKey` oraz powielaja odmowe bramki muru; bez tego callback `finish` kroku doktryny (skirmish) i `lastAutoMoveFrom` nie maja stanu po ruchu.
- D-417A-r2-3: `none` z doktryna AUTO tylko dla piechoty wrecz (strzelcy, jazda, falanga to klocki K5DOC z wlasnymi wektorami); obserwowalne wyniki kroku doktryny: akcja `DoctrineAction`, pozycja po pierwszym kroku i trafienie z `complete` dla ataku sasiada.
- D-417A-r2-4: `ProdBody::set_occupancy` (nowe API ciala): nadpisanie `occByKey` zbiorem pol; domyslne zachowanie bez zmian.

## 3. NIE_ZMIERZONO / poza zakresem r2 (jawnie)
- Oblezenie reczne atakujacego (`wall_col >= 0`, rozkaz inny niz `move`): `_performSiegeManualOrder` na ciele (ram_tower `:8022`, tower_climb `:8056`, infantry_to_tower `:8087`, `_siegeSafeApproach` `:8107` z porownaniem `fx` na wektorach) = r3. W r2 aktor atakujacy przy murze wystepuje tylko z rozkazem `move` (bramka `:18436` go odrzuca).
- Kolejka `_executeUnitsImmediate` (`:18578-18614`: busy-gate, `acted`, `_refreshQueuedOrderVisuals` `:11520`) na wektorach = r3 (kryterium 3); istnieja testy reczne r1/obrony.
- Blokada generala (`blockadeActive`) w ciele = czesc B (#422); wektory r2 maja ja nieaktywna.
- `none` z doktryna AUTO dla strzelcow, jazdy i falangi: poza porownaniem (osobne klocki K5DOC); dalsze kroki marszu doktryny po pierwszym: nie porownywane (kolejne kroki pina to osobne `_schedule`).
- Aktor `routed`/`dead`/`fadingOut`: pin idzie `_fleeStep`/`done()` przed gałęzią recznego rozkazu (poza zakresem).
- Wyniki sa dla konfiguracji produkcyjnej sesji (marsz krokowy, `move_order_exec`); marsz atomowy sprawdzony na podzbiorze 284 przypadkow bez `none`.
- Rzeczywista kwantyzacja czasu klatki i wektory pełnych bitew z rozkazem gracza = czesc B (#422).
- Cel rozkazu `attack` rowny pozycji aktora: pusty wariant (geometrycznie niemozliwy), patrz 1.4.

## 4. Mapa r3 (numery linii pinu 07d2fbd72)
1. `_performSiegeManualOrder` `:18435-18475`: bramka `siegeWallCol >= 0 && side === 'atk' && type !== 'move'` (`:18436`), `_siegeRamTowerStep` `:8022`, `_trySiegeTowerClimb` `:8056-8084`, `_siegeInfantryToTowerStep` `:8087`, `_siegeSafeApproach` `:8107-8136` (fx wyniku porownywane z portem, nie z wartoscia z pinu; warunek wpiecia z Evaluatora #416 N1/N2: `_rangedTargetInRange` / `_targetInRange` / `_siegeSafeApproach` z portow Rust `siege_tactics_doctrine_target.rs:330/368`, `siege_tactics_approach.rs:231`).
2. Rozszerzenie generatora: ten sam blok (`WIRING_A_MANUAL_BODY_STEPS`) o wariant atakujacego przy murze z rozkazami `none`/`attack`/`attackMove`; konsument i `ManualRun::SiegeRamTower|SiegeClimb|SiegeInfantry|SiegeSafeApproach` na ciele.
3. Kolejka `_executeUnitsImmediate` `:18578-18614`: filtr `!u.dead && !u.removed && !u.routed && !u.acted && !queuedIds` (`:18581`), `busy` -> `_schedule(40)` (`:18599`), `_performPlayerOrder(u, () => { u.acted = true; ... })` (`:18608`), `_refreshQueuedOrderVisuals` (`:18586`).
4. Tryb `_activateUnit` w AUTO: reset `ru.playerOrder` `:6093` (poza zakresem; czesc B).
