# 02a — OBRONA Operatora, R-RUSTPORT-P6-SIEGE-TAKTYKA-K1B-Q1 (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K1B-Q1
GOAL: obrona pięciu zarzutów recenzenta względem kodu K1b (r1 = e0cc8051a).
ZMIANY/COMMIT: commit r2 na gałęzi rust-port-wip/SIEGE-TAKTYKA-K1b-Q1 (SHA w raporcie orkiestratora, pole sha).
TESTY: patrz sekcja „Bramki r2".
BLOKADY: zarzut 1 (dryf kopii generatora) — tylko udokumentowane ryzyko; zarzut 4 (baza) — decyzja orkiestratora.
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Evaluator r2 na commicie r2.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1 — ręczna kopia logiki w generatorze, straznik SHA-256 nie wykrywa dryfu kopii
PRZYJMUJĘ (ryzyko), NIE naprawiam w tym temacie.
- Zarzut trafny: `FRAGMENT_SHA256_WALK` haszuje tekst pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`, linie 7951-7960, 7962-7970, 7972-8019, 8685-8693), nie kopię w `p6_siege_tactics_walk_gen.mjs`.
- Ponowne porównanie linia po linii (r2): `_bfsFirstStep` (pin 7973-8003) i kopia `bfsFirstStep` (gen 73-99) są zgodne; driver `_siegeWalkTo` (pin 8006-8019) i bramka `_doMove` (pin 8689-8693) zgodne z `walkDecide`/`walkRun`/`siegeMoveRefused`, poza jawnymi wejściami: `isGoal` → `goalSet`, koszt wejścia → tabela `COST` (efekty sceny nie są portowane).
- Brak automatycznego wykrycia dryfu to ten sam wzorzec, który FC przyjęło w K0b/K1. Realna naprawa (wykonywanie wyciętego tekstu pinu po usunięciu typów TS) to osobny temat.
- Dodano w nagłówku generatora sekcję OGRANICZENIE z opisem tego ryzyka i wynikiem porównania.

### Z2 — cienkie pokrycie odmowy bramki (4 z 710); brak NaN/Inf w wektorach marszu
PRZYJMUJĘ — poprawka + dowód + commit.
- Zmierzone przed poprawką: `refused` = 3 losowe + 1 jawny przypadek. Zarzut prawdziwy.
- Poprawka: 200 nowych przypadków ukierunkowanych (zamknięty mur, atakujący piechota, `approachRestricted = true`, cel za murem, zagrożenie na linii marszu). Generator: `rust-port/engine/tests/p6_siege_tactics_walk_gen.mjs`, wektory: `rust-port/engine/tests/p6_siege_tactics_walk_vectors/vectors.json`.
- Wynik po regeneracji: `walk 910 {"passed":404,"no-wall":101,"restricted-no-refuse":230,"refused":165}`; zdarzenia `refused` 165 (było 4). 700 przypadków ogólnych bez zmian kolejności (losowanie dopisane po nich).
- NaN/Inf: JSON nie niesie NaN; pokrycie NaN pozostaje testem jednostkowym `decide_warunki_zakonczenia_i_nan` (bez zmian, nic nie osłabiono).
- `wektory_siege_walk_to_zgodne_z_webem` przechodzi na 910 przypadkach.

### Z3 — synchroniczna kontynuacja po `Schedule`; redundancja `wall_col_ge0`
ODRZUCAM (dowód) — zgodne z dokumentacją modułu.
- Synchroniczna kontynuacja jest opisana w nagłówku `rust-port/engine/src/domain/siege_tactics_walk.rs` (linie 18-19): „tu driver kontynuuje synchronicznie, co jest rownowazne tylko przy jednej jednostce bez przeplatajacych sie timerow". Ograniczenie jest jawne.
- `do_move_gate` przyjmuje `wall_col_ge0` osobno, bo web czyta `siegeWallCol >= 0` w `_doMove` niezależnie od `ApproachWallState`. Ta sama wartość, brak różnicy zachowania.

### Z4 — rozbieżność bazy: parity-v2 vs 759621568
ODRZUCAM jako defekt kodu — PRZEKAZUJĘ decyzję orkiestratorowi.
- Dowód: `git merge-base --is-ancestor 759621568 origin/rust-port/parity-v2` → NIE jest przodkiem. Fakt zgłoszony poprawnie.
- Baza 759621568 została wskazana wprost w dispatchu (`Baza: 759621568 (FC K1)`), więc r1 użył jej zgodnie ze zleceniem. Kolejność integracji (K1b razem z K1, konflikt w `mod.rs`, INTEG-B11) to decyzja orkiestratora.

### Z5 — wiersz 30 pozostaje PARTIAL
ODRZUCAM (dowód) — zgodne z dispatchem i stanem faktycznym.
- Dispatch dopuszcza PARTIAL z listą braków („lub zostaw PARTIAL z listą tego, co BRAK").
- `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` wiersz 30 wymienia BRAK: `_siegeRamTowerStep`, `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep` (K2/K4) oraz efekty sceny `_doMove`/`_schedule` (kontrakt WalkWorld). Wiersze 32.18 i 33.22 zaktualizowane do stanu faktycznego.
- Wizualnie NIE_ZMIERZONO.

## Pliki zmienione w r2
- `rust-port/engine/tests/p6_siege_tactics_walk_gen.mjs` (200 przypadków odmowy; nagłówek OGRANICZENIE)
- `rust-port/engine/tests/p6_siege_tactics_walk_vectors/vectors.json` (regeneracja: 910 przypadków marszu)
- `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (wiersz 33.22: 910 przypadków)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K1B-Q1/02a-obrona.md` (ten plik)

Nie zmieniano: `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock`, `mod.rs`, moduły K2.

## Bramki r2 (CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR poza repo)
- `cargo fmt --check`: PASS
- `cargo clippy --all-targets -- -D warnings`: PASS
- `cargo test --lib`: PASS 48/48
- `cargo test --test p6_siege_tactics_approach`: PASS 5/5
- `cargo test --test p6_siege_tactics_approach_k1`: PASS 8/8
- `cargo test --test p6_siege_tactics_end`: PASS 8/8
- `cargo test --test p6_siege_tactics_walk`: PASS 7/7 (910 przypadków marszu, 500 BFS)
- Generator deterministyczny: ponowne uruchomienie daje identyczny wynik.
