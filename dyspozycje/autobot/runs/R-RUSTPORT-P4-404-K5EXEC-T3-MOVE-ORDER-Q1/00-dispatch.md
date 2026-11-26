# R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 — rozkaz ruchu gracza/doktryny w pętli bitwy: `_performPlayerOrder` gałęzie `hold`, `none`, `move` (zadanie #404, krok T3)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/silnik bitwy). Kolejka właściciela (decyzja 2026-11-26): realizacja po jednym, po integracji #405.
BAZA: `origin/rust-port/parity-v2` po integracji #405 (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-26; zasada „najpierw sprawdź, czy dług istnieje")
#404 w rejestrze to szeroki zakres „K5EXEC-T3..T7". Sprawdzone na bazie `2c8583731`: dług ISTNIEJE i jest dokładnie tu:
- `rust-port/engine/src/domain/siege_tactics_loop.rs:1612-1614`: `impl ActivateOps for ProdOps { fn perform_player_order(&mut self) -> bool { false } }` — atrapa.
- `:5963-5975`: `DoctrineAction::MoveOrder { .. }` (rozkaz ruchu doktryny `skirmish`) nie rusza jednostki: `self.unported.push((unit, "doktryna-rozkaz-ruchu"))` + `return 0.0` (komentarz „to K5EXEC-T3 (#268)").
- Gotowe klocki (zportowane i zintegrowane): bramki ruchu `rust-port/engine/src/domain/player_order_move_gate.rs` (`dest_allowed_by_blockade`, `compact_attack_allows_step`, `should_avoid_auto_backtrack`), kolejka rozkazów `player_order_queue.rs` (T1), krok doktryny `siege_tactics_doctrine_step.rs` (T8), krok pieszego `ProdBody::advance_step`/`_doMove` (K5DOC-T4, MARCH-INCREMENTAL).
- NIE znaleziono w Rust odpowiednika `_firstStepTowardMoveDestination` (pin) ani `_adjacentEnemy` jako osobnych funkcji dla tej gałęzi — do ustalenia i ewentualnego portu w tym temacie.
Zakres jest więc realny, ale T3..T7 naraz to za dużo: ten dispatch obejmuje WYŁĄCZNIE T3. Pozostałe (atak z ruchem `attackMove` T4, ręczne oblężenie `_performSiegeManualOrder` H3, wiring H4 itd.) zostają osobnymi tematami w kolejce.

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`): `_performPlayerOrder` (`:18280-18353`, gałęzie przed `attackMove`):
- `hold` (`:18282-18285`): `done()` bez akcji.
- `_performSiegeManualOrder` (`:18286`, ręczne oblężenie) — POZA zakresem (H3); zachowaj dzisiejsze „nieportowane".
- `none` (`:18287-18296`): jeśli doktryna jednostki AUTO i `meta.doctrine !== 'manual'` → `_executeGroupDoctrineStep` (zrobione w T8), inaczej `done()`.
- `move` (`:18297-18353`): cel (`ord.col/row`) = pozycja → rozkaz `none`; sąsiedni wróg → `_doAttack`; krok zachłanny `dc=sign(tc-q)`, `dr=sign(tr-r)` z obejściem (`_passableForUnit`, `occByKey`, unik cofania `_shouldAvoidAutoBacktrack`, `lastAutoMoveFrom`), a przy zablokowaniu trasa przez `_firstStepTowardMoveDestination` (`:18478-…`, BFS z limitem 1024 odwiedzonych, `firingTiles` strzelca); bramki `_compactAttackAllowsStep` i `_destAllowedByBlockade`; ruch `_doMove(ru, nc, nr, done)` z zapamiętaniem `lastAutoMoveFrom`; `_refreshQueuedOrderVisuals` (UI, bez wpływu na logikę silnika).
Zadanie: wykonaj w Rust (a) `ProdOps::perform_player_order` dla `hold`/`none`/`move` zgodnie z pinem, (b) wykonanie `DoctrineAction::MoveOrder` (rozkaz ruchu doktryny `skirmish`, pin `:18063-18083`, `:18110-18122`), tak by jednostka faktycznie się ruszała zamiast trafiać do `unported` z tagiem `doktryna-rozkaz-ruchu`; (c) port `_firstStepTowardMoveDestination` (BFS, `allowFirstStep`, `firingTiles`) jako czysta funkcja z własnymi testami wektorowymi.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-404-1..4)
- D-404-1: zakres wyłącznie T3 (hold/none/move + MoveOrder doktryny + `_firstStepTowardMoveDestination`); `attackMove`, `_performSiegeManualOrder`, kolejka rozkazów UI i wiring mostu — poza zakresem (jawne `unported` jak dziś).
- D-404-2: wzorzec = kod pinu; każda rozbieżność z pinem = jawny raport, nie „poprawka".
- D-404-3: wektory z pinu generowane wykonaniem tekstu pinu (jak istniejące, `p6_k5loop_wiring_a_gen.mjs`); **budżet czasu**: wektory w pinie liczą się w czasie rzeczywistym (~30–80 s na bitwę) — ogranicz zestaw do ≥ 24 scenariuszy z rozkazem `move`/doktryną `skirmish` (rozbij na 4 shardy `…_SHARD=k/4`), nie więcej niż potrzeba do kryteriów; temat #406 pokazał, że 74 wektory to ≈ 3 h. Uzasadnij zestaw w raporcie.
- D-404-4: bramki: engine fmt/clippy/pełny test; client i renderer tylko jeśli ich pliki zmieniasz (nie powinieneś).

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs` (wiring `ProdOps::perform_player_order`, `MoveOrder`), nowy moduł pomocniczy w `rust-port/engine/src/domain/` (np. `player_order_move.rs` z `_firstStepTowardMoveDestination` i krokiem `move`) + wpis w `mod.rs`, testy silnika (nowy plik `rust-port/engine/tests/p4_404_move_order.rs` lub rozszerzenie `p6_k5loop_wiring_a_pin.rs`), `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (tryb rozkazu ruchu), nowy plik wektorów w `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/`, raporty w katalogu runu. Istniejące pliki wektorów bez zmian treści. Inny plik: uzasadnij.

## KRYTERIA KOŃCA
1. Jednostka z rozkazem `move` (gracza lub doktryny `skirmish`) wykonuje ruch jak w pinie; tag `doktryna-rozkaz-ruchu` znika z `unported` dla zbioru wektorów; strumień zdarzeń i wynik bitwy zgodne z pinem bajt w bajt na ≥ 24 wektorach (pokrycie: cel = pozycja, sąsiedni wróg, krok zachłanny prosty/skośny, obejście przez `_firstStepTowardMoveDestination`, blokada `_destAllowedByBlockade`/`_compactAttackAllowsStep`, unik cofania).
2. `_firstStepTowardMoveDestination` przetestowany osobno (BFS, limit 1024, `allowFirstStep`, `firingTiles` dla strzelca) wektorami z pinu.
3. Mutanty: ≥ 8 (np. brak unikania cofania, zły limit BFS, odwrócona kolejność bramek, brak `firingTiles`, pominięty `_adjacentEnemy`, zły znak `dc/dr`) zabite lub jawnie równoważne.
4. Istniejące wektory (45/45 `vectors.json`, 288 `speed_vectors`, 40 `speed_change`, 74 `tower_due_order`) i pełny `cargo test` engine bez regresji.
5. Raport z liczbami i jawną listą NIE_ZMIERZONO oraz mapą pozostałych kroków (T4..T7, H3, H4) z numerami linii pinu.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo/node w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
