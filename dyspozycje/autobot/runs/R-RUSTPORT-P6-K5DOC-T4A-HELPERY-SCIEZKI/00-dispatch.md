# DISPATCH R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI (runda 1) — helpery ścieżki pieszego (#312, podział T4a z #258)

DOMENA: logika bitwy oblężniczej, port pieszy (engine). MODEL: Operator HAIKU 5.5; Evaluator i FC SONNET 5.5.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `0fccd8dbf`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/**`. Lokalizacje ustal przez `git grep -n "_firstStepAlongPathToAttack\|_firstStepTowardMelee\|_stepToward\|_makeCanAttackFromTest\|allowFirstStep" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek. Numery linii poniżej są z recon i mogą być przesunięte o kilka wierszy.
Źródło rozpoznania: `dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` (na `claude/rust-sivvrn`, commit `217e71e8a`).

## KOREKTY EWALUATORA (obowiązują; dokument rozpoznania ich jeszcze nie ma)
1. Reguła muru `wallCol-1` w `_firstStepAlongPathToAttack` to w pinie KOMENTARZ (ok. 8595–8604), nie kod. Realnie działają `occByKey` (ok. 8594) i `_passableForUnit` (ok. 8605). Mur obsługuje się przez nieprzechodnie ciało muru i `_canAttackFrom`. NIE portuj osobnej reguły muru.
2. Numery linii: `_firstStepTowardMelee` zaczyna się ok. 8634 (nie 8625); `_makeCanAttackFromTest` ok. 8454.
3. `_passableForUnit` ma w Rust odpowiednik: metodę traitu `AutoBatchEnv::passable_for_unit` (`rust-port/engine/src/domain/siege_tactics_autobatch.rs:268`). Użyj jej; nie dubluj.
4. Asymetria `allowFirstStep` (pin ok. 8593): filtr kompaktu i anty-cofania dotyczy TYLKO pierwszego kroku BFS i tylko dla `cur == start`. Port musi ją zachować.
5. NIE używaj `siege_tactics_tower.rs:47` `move_cost` (atrapa harnessu) ani `TowerWalk::passable_free` (opiera się na zbiorach zajętych/blokowanych, nie na terenie).

## ZAKRES
1. `_firstStepAlongPathToAttack` (pin ok. 8565–8622) jako funkcja Rust w NOWYM module `rust-port/engine/src/domain/siege_tactics_pathstep.rs`: BFS pierwszego kroku z `occByKey`, `_passableForUnit` (przez `AutoBatchEnv`) i asymetrią `allowFirstStep`.
2. `_stepToward` z pinu (jeśli występuje w tej formie) — w tym samym module.
3. Nie dotykaj `bfs_first_step` w `siege_tactics_walk.rs:116` (inna funkcja, inne założenia; ma `max_visited`, `pref_row`, `allow_tile`).

## NIE ROBIĆ
- NIE zmieniaj `rust-port/engine/src/domain/siege_tactics_loop.rs` ani `ProdBody` (zajęte przez K5LOOP-OUTCOME #109 w równoległym workflowie; konflikt).
- NIE portuj `_advanceStep` (to T4b, #313) ani `_doMove` (T4c, #314).
- NIE zmieniaj `gra/`.
- NIE zmieniaj `siege_tactics_walk.rs` ani `siege_tactics_tower.rs`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_pathstep.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_pathstep;`
- `rust-port/engine/tests/p6_k5doc_t4a*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t4a_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t4a_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI/**`

## WEKTORY / TESTY
- Generator `p6_k5doc_t4a_gen.mjs` wykonuje tekst pinu `_firstStepAlongPathToAttack` (z przechwyceniem wyniku) i zapisuje wektory JSON; testy Rust czytają wektory.
- Wektory: ścieżka prosta; ścieżka z zajętym heksem (`occByKey`); heks nieprzejezdny dla jednostki (`_passableForUnit`); asymetria `allowFirstStep` (`cur == start` vs dalej); brak ścieżki → brak kroku.
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) asymetria `allowFirstStep` usunięta (filtr dla wszystkich kroków); (b) `occByKey` pominięte; (c) `passable_for_unit` zastąpione `true`.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. UWAGA: pełny `p6_8i_pick` trwa ok. 5 min — nie przerywaj go. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI/`. Commit BEZ nazwy modelu w treści i trailerach.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
