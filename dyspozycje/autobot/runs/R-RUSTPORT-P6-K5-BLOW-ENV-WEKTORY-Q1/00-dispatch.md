# DISPATCH R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1 (runda 1) — wektory pinu dla kopii B `terrain_river_attack_multiplier` (`blow_env_for`)

DOMENA: GAME (silnik, testy). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, FC).
BAZA: `origin/rust-port/parity-v2` = `7d8993c42` (zapisz SHA). Worktree detached. Pin: `07d2fbd72`.
ŹRÓDŁO: `dyspozycje/autobot/runs/R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1/01-rozpoznanie.md` i `03-final-control.md` (zalecenie ewaluatora: osobny temat z wektorami dla `blow_env_for`; kopia B nie ma wektora pinu, równoważność z kopią A dowiedziona tylko testem ręcznym `rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie`).
Kod: `rust-port/engine/src/domain/siege_tactics_blow_inputs.rs:21` (kopia B), `siege_tactics_blow_env.rs` (`blow_env_for`, ok. 347–374 test ręczny), używana w `siege_tactics_blow_full.rs:245`. Pin: `gra/src/battle/battleScene.ts:8861` (`_singleBlow`, kafel atakującego), `gra/src/game/combat.ts:677` (teren obrońcy).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ.

## ZAKRES
1. Wygeneruj wektory z pinu (generator w katalogu testów, `*_gen.mjs`, z wyciętymi fragmentami pinu i sumą SHA-256 — wzorzec jak `p6_r7k7c_owner_pools_vectors`): dla zestawu wejść (rzeka/brod/teren atakującego i obrońcy, flagi `riverRow`) wynik `terrain_river_attack_multiplier` kopii B i flagi z `blow_env_for`.
2. Test Rust porównuje wynik `blow_env_for` i kopii B z wektorami 1:1 (każda wartość: plik:linia pinu w komentarzu).
3. Co najmniej 8 przypadków, w tym: atakujący na rzece, obrońca na rzece, obaj na rzece, brak rzeki, teren nazwany vs flaga.
4. Mutacja: zamiana `atk_tile_is_river` na `def_tile_is_river` w `blow_env_for` MUSI dać FAIL.

## OGRANICZENIA
- NIE zmieniaj kodu w `src/`. Jeśli wektor pokaże rozbieżność z pinem — zapisz BLOCK z dowodem (plik:linia pinu, wartość pinu, wartość Rust, wejście). To jest wynik oczekiwany, nie błąd procesu.
- Allowlista: `rust-port/engine/tests/p6_k5_blow_env*.rs` (NOWE), `rust-port/engine/tests/p6_k5_blow_env_vectors/**` (NOWE), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1/**`.

## KRYTERIA KOŃCA
1. Wektory zielone (lub BLOCK z dowodem); mutacja FAIL.
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny, wymaga ≥8 GB wolnego; inaczej NIE_ZMIERZONO z zatrzymaniem).
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian w `src/`.
4. Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity.
