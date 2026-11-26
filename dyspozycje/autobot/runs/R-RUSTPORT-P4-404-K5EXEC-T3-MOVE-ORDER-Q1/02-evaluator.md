# R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (#404, krok T3)
GOAL: `_performPlayerOrder` `hold`/`none`/`move` (pin `07d2fbd72` `battleScene.ts:18280-18353`), `_firstStepTowardMoveDestination` (`:18478-18527`) i wykonanie rozkazu ruchu doktryny `skirmish` w pętli bitwy zamiast tagu `doktryna-rozkaz-ruchu`.
ZMIANY/COMMIT: oceniany kod = gałąź `rust-port-wip/404-move-order` @ `474d6f855` (commity `cd949c912`, `83246224a`, `474d6f855`); baza `origin/rust-port/parity-v2` = `6793a7da4` (`merge-base --is-ancestor` = TAK). Evaluator zmienia wyłącznie ten raport.
TESTY: §2 (odtworzone samodzielnie, kody wyjścia).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona (`02a-obrona.md`), potem Final Control. Uwagi N-E1..N-E5 do decyzji orkiestratora (żadna nie blokuje).
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres i allowlista

`git diff --stat 6793a7da4...474d6f855` — 10 plików, +2218/−4:
- w allowliście: `player_order_move.rs` (nowy), `mod.rs` (+1), `siege_tactics_loop.rs`, `tests/p4_404_move_order.rs` (nowy), `tests/p6_k5loop_wiring_a_pin.rs` (tylko dopisek, 0 linii usuniętych), `tests/p6_k5loop_wiring_a_gen.mjs` (tylko dopisek; strażnik SHA-256 `3eeeb760…` nietknięty), 2 NOWE pliki wektorów, raport operatora;
- **spoza allowlisty: `rust-port/engine/src/domain/siege_battle_session.rs` (+3 linie: `body.move_order_exec = true;` + komentarz)**. Uzasadnione w raporcie Operatora §2 (D-404-OP-1: bez tego tag nie znika w produkcji). Akceptuję; raport nie ma jednak osobnej sekcji „Pliki spoza allowlisty” (uwaga formalna N-E5).
- Istniejące pliki wektorów: bez zmian (`git diff --stat` w katalogu wektorów = tylko 2 nowe pliki).
- `#[ignore]`: brak nowych (jedyny w drzewie: `tests/p6_order_lane.rs:1530`, sprzed tematu). Osłabionych asercji brak (diff testów to wyłącznie dopiski). `git diff --check`: czysto. Brak nazw modeli w commitach.
- Brak zmian w `gra/`, kliencie, rendererze, kontrakcie mostu.

## 2. Bramki odtworzone (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, debug=0; target usunięty po bramkach)

| bramka | wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (engine, pełny, w tle) | EXIT 0 — **4377 passed, 0 failed, 1 ignored** (559 binarek/sekcji) — zgodne z raportem Operatora |
| w tym `p4_404_move_order` | 4/4 ok |
| w tym `p6_k5loop_wiring_a_pin::rozkaz_ruchu_doktryny_bitwy_wektory_pinu_bajt_w_bajt` | ok (32/32) |
| renderer / client | nie dotyczy (D-404-4, pliki nie zmieniane) |

## 3. Wektory = wykonanie tekstu pinu (regeneracja niezależna)

- `WIRING_A_MOVE_ORDER_STEPS=1` (generator wykonuje cały tekst pinu przez `git show`, strażnik SHA-256): regeneracja do scratchpadu dała **MD5 `d90c1973fa5eba83f30d5963102ab8b2` = MD5 pliku w repo** (bajt w bajt; 900 `move`, 402 BFS, 120 `hold`/`none`; ~8 s).
- `WIRING_A_MOVE_ORDER_VECTORS=1`, próbka 3/32 bitew (`mo_mur_tylko_jeden`, `mo_palisada_slabi_obr` — czas rzeczywisty, `mo_mur_piech3_skip` — przewijanie): wszystkie 3 wpisy **identyczne** z `move_order_vectors.json` (porównanie JSON z sortowaniem kluczy). Reszty 29 bitew nie regenerowałem (koszt ~100 min) — NIE_ZMIERZONO dla nich niezależnie (zaufanie: ten sam generator, plik zgodny w próbce).
- Pin przeczytany przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`: `:18280-18353` (gałęzie), `:18478-18527` (BFS), `:18087-18124` i `:18063-18083` (wydawanie rozkazu ruchu przez doktrynę), `:18435-18475` (`_performSiegeManualOrder`), `:8139-8196` (bramka zwarcia, unik cofania), `:7434-7448` (`_passableForUnit`). Port `move_order_step` / `first_step_toward_move_destination` / `firing_tiles` odpowiada tekstowi linia w linię (kolejność testów pola BFS, `head < maxVisited`, `firstStepByKey ?? nextKey`, bramka zwarcia PRZED `nc === tc`, potem blokada, `previousPosition` tylko przy uniku cofania).

## 4. Pokrycie bitew — co faktycznie testują 24 wektory czasu rzeczywistego

Zmierzone na `move_order_vectors.json`: 12 974 kroków `move` = **12 808 zachłannych prostych + 166 przez BFS**; **0 skośnych, 0 obejść kolumną/rzędem, 0 `target`, 0 `attack`**; `done` po BFS bez drogi: 4 079. 14 z 24 bitew czasu rzeczywistego to `remis tura 150` bez żadnego zdarzenia C/R/K/D (np. `mo_mur_tylko_jeden`: jedna jednostka 149× krok w miejscu bez kontaktu).
Ocena: zgodne z ustaleniem Operatora N1 — w bitwie AUTO rozkaz ruchu wydaje wyłącznie `skirmish` (gałąź końcowa `:18063-18083` jest nieosiągalna, bo `_executeGroupDoctrineStep` obsługuje wszystkie 5 doktryn), `_pickAdjacentTargetByPriority` sprawdzono tuż przed, `skirmish ≠ steady` zeruje unik cofania i bramkę zwarcia, a `firingTiles` jest zawsze puste (strzelec z amunicją idzie w `_rangedAction`, bez amunicji/strzelania — puste). Pokrycie kryterium 1 dla gałęzi skośnej, obejść, celu=pozycji, sąsiedniego wroga, blokad i uniku cofania jest więc realizowane **wyłącznie przez wektory kroku** (pin wykonany, 900 przypadków), nie przez bitwy. Akceptuję jako PASS-WITH-NOTES (N-E3).

## 5. Mutanty Evaluatora (14 własnych, poza listą Operatora; skrypt poza repo, źródła przywrócone — `git status` czysty)

| # | mutant | wynik | ocena |
|---|---|---|---|
| E01 | `firingTiles` z polem wroga (bez `dc==0&&dr==0`) | ZABITY (p4_404) | — |
| E02 | **BFS bez testu granic planszy** | **PRZEŻYŁ (oba testy)** | **NIErównoważny** — patrz N-E1 |
| E03 | `DIRS4` w kolejności E,N,S,W | ZABITY (p4_404) | — |
| E04 | BFS zwraca pole celu zamiast pierwszego kroku | ZABITY (p4_404) | — |
| E05 | obejście kolumną bez `dc != 0` | PRZEŻYŁ | równoważny: przy `dc==0` pole `(q, r)` zajmuje sama jednostka (`occByKey`) |
| E06 | `none` ignoruje `siege_manual` | PRZEŻYŁ | luka testu: generator pomija `none`+`atk`+mur (H3 poza zakresem) — N-E2 |
| E07 | ciało: brak `lastAutoMoveFrom` po kroku | PRZEŻYŁ | równoważny w produkcji AUTO (`skirmish` ⇒ `prev = None`) |
| E08 | ciało: bramka `steady` BFS zawsze false | PRZEŻYŁ | równoważny w AUTO (`skirmish`) |
| E09 | ciało: jazda jak piechota w siatce rozkazu | PRZEŻYŁ | równoważny w testowanych terenach (zbiory nieprzejezdne `|0` i `|1` identyczne na 3 scenach kroku); nietestowany teren `niedostepne` dla jazdy — N-E4 |
| E10 | ciało: zajętość ignorowana | ZABITY (bitwy) | — |
| E11 | ciało: `_adjacentEnemy` pominięty | PRZEŻYŁ | równoważny w AUTO (skirmish sprawdza wcześniej) |
| E12 | ciało: bramka zwarcia zawsze true | PRZEŻYŁ | równoważny w AUTO (`skirmish`) |
| E13 | ciało: `Done` zwraca czas klatki zamiast 0 | ZABITY (bitwy, chwile) | — |
| E14 | ciało: `firingTiles` z martwymi wrogami | PRZEŻYŁ | równoważny (firing zawsze puste dla rozkazu `skirmish`) |

Mutanty Operatora (16/16 zabitych, §5 jego raportu) — nie powtarzałem wszystkich; moje E01/E03/E04 potwierdzają czułość testu BFS i `firingTiles`. Kryterium 3 (≥ 8 zabitych lub jawnie równoważnych) spełnione.

## 6. Uwagi (do Obrony / decyzji orkiestratora)

- **N-E1 (luka testu, nie błąd kodu):** test granic planszy w BFS (`player_order_move.rs`, `if !(0..BF_COLS).contains(&col) || !(0..BF_ROWS)…`) nie jest pokryty żadnym wektorem — mutant E02 przeżywa. Mutant jest NIErównoważny: pin ma `_passableForUnit` poza planszą = `true` (Operator to sam ustalił), więc bez testu granic BFS przy krawędzi wybiera pierwszy krok poza planszą (np. start `(0,5)`, cel `(0,9)`, zajęte `(0,6)` i kolumna 1 → z granicami pierwszy krok `(0,4)`, bez granic `(-1,5)`). Generator kroku rozmieszcza jednostki w oknie `col ≥ ~0`, `row 20..130`, więc praktycznie nie trafia krawędzi. Rekomendacja: w następnej rundzie / temacie dodać do `WIRING_A_MOVE_ORDER_STEPS` przypadki z kotwicą przy `col 0`, `row 0`, `BF_COLS-1`, `BF_ROWS-1` (nowy plik wektorów albo regeneracja `move_order_step_vectors.json` — plik jest nowy w tym temacie, więc regeneracja nie łamie zakazu). Kod portu jest zgodny z tekstem pinu.
- **N-E2:** `perform_player_order(…, siege_manual, …)` mapuje `none`+`atk`+mur bezwarunkowo na `SiegeManual`, a pin `_performSiegeManualOrder` (`:18435-18475`) może zwrócić `false` (machina inna niż taran/wieża; `none` bez doktryny AUTO i bez celu strzału; `none` z doktryną AUTO po nieudanych wspinaczkach) i wtedy przechodzi do gałęzi `none`. Docstring „gdy prawdziwa, rozkaz `none` przechodzi do oblężenia ręcznego” jest więc nadmiernym uproszczeniem. Poza zakresem T3 (H3), funkcja nie ma wołającego produkcyjnego — wpisać do mapy H3 jako wymaganie (wynik `false` ⇒ kontynuacja gałęzi `none`).
- **N-E3:** bitwy pokrywają tylko krok zachłanny prosty i BFS (§4); pozostałe klasy kryterium 1 wyłącznie wektorami kroku. Do świadomego przyjęcia przez orkiestratora (zgodne z N1 Operatora; gałęzie nieosiągalne w AUTO do czasu T5/H4, kiedy rozkazy gracza wejdą do ciała — wtedy wymagane wektory bitew z rozkazem gracza).
- **N-E4:** ciało: ścieżka atomowa `move_order_exec && !march_incremental` (`siege_tactics_loop.rs`, gałąź „Marsz atomowy”) nie ma żadnego wołającego ani testu (sesja ustawia oba na `true`); oraz siatka `mounted` nietestowana na terenie `niedostepne` dla jazdy. Kod martwy/niepokryty — do decyzji (usunąć albo pokryć) przy T5.
- **N-E5 (formalne):** brak w raporcie Operatora sekcji „Pliki spoza allowlisty”; `siege_battle_session.rs` opisany tylko w §2. Decyzja D-404-OP-1 (`move_order_exec` domyślnie `false`, sesja `true`; stare testy ciała z atrapą `_performPlayerOrder`) — techniczna, sensowna; orkiestrator powinien ją wpisać do `REJESTR-RUST.md`.

## 7. NIE_ZMIERZONO

- Niezależna regeneracja 29/32 wektorów bitew (próbka 3/32 zgodna).
- Client i renderer (nie zmieniane, D-404-4).
- Pełny zestaw 16 mutantów Operatora (nie powtórzony; moje 14 osobno).

## 8. Werdykt

PASS-WITH-NOTES: bramki zielone (fmt 0, clippy 0, pełny test 4377/0/1), wektory pochodzą z wykonania tekstu pinu (kroki bajt w bajt po regeneracji, bitwy 3/3 w próbce), port zgodny z tekstem pinu, tag `doktryna-rozkaz-ruchu` znika w sesji produkcyjnej, mutanty 16 (Operator) + 4 moje zabite, przeżywające jawnie sklasyfikowane; jeden nierównoważny ocalały mutant (E02, granice BFS) = luka pokrycia wektorów, nie błąd kodu — do domknięcia w Obronie lub kolejnym temacie.
