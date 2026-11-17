STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5B-MARSZ (runda 2, DODATEK r2 do dispatchu)
GOAL: podejście strzelca (APPROACH) i `_rangedForwardStep` / `_bestForwardStep` jako czyste funkcje Rust 1:1 z pinem `07d2fbd72` (`gra/src/battle/battleScene.ts`), z wektorami generowanymi przez TypeScript i mutacjami na module Rust.
BAZA: `6a2ded8bb` (detached, worktree `wf_3446ab83-759-1`). Kod modułu i wektory z r1 zostały w bazie bez zmian.

## ZMIANY/COMMIT
- `rust-port/engine/src/domain/mod.rs`: jedyna zmiana r2 — przeniesienie linii `pub mod siege_tactics_ranged_forward;` na pozycję alfabetyczną (po `siege_tactics_pathstep`, przed `siege_tactics_roundcap`). Powód: `cargo fmt --check` w r2 dał exit 1 (rustfmt wymaga porządku alfabetycznego deklaracji `mod`). Sama linia, bez innych zmian.
- Moduł `siege_tactics_ranged_forward.rs`, testy `p6_k5doc_t5b.rs`, generator `p6_k5doc_t5b_gen.mjs` i `p6_k5doc_t5b_vectors/vectors.json`: bez zmian względem bazy `6a2ded8bb` (przywracane `git checkout` po każdej mutacji).
- Brak `Cargo.lock` (plik nie istnieje w worktree, nie jest śledzony). Brak `gra/`, brak `rust-port/view-model/**`, `rust-port/renderer/**`, brak zmian poza allowlistą.
- Commit: patrz SHA w odpowiedzi orkiestratora (`git rev-parse HEAD` w worktree). Bez push.

## Lektura APPROACH i `_siegeMachineRange` (z 02a-obrona.md r1, bez ponownej dyskusji)
- Gałąź APPROACH w `_rangedAction` to wywołanie `_rangedForwardStep` (pin `:6738`). Portowane.
- `_rangedApproachStep` (`:7257-7283`) nie ma zewnętrznego wołającego (tylko rekurencja z `:7283`), martwa dla strzelca, poza zakresem.
- `_siegeMachineRange` (`:7530-7534`) wołana tylko z `:6200` (katapulta), czyta stan gry (`_attackRangeFor`, `_isCatapult`, bonusy cywilizacji). NIE PORTOWANA (zgodnie z dispatchem: stan gry niedostępny w module).

## TESTY / BRAMKI (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunięty po bramkach)
Przed bramkami `df -h /`: 14 GB wolne (>= 8 GB, bramki uruchomione).
- `cargo fmt --check`: pierwszy przebieg EXIT 1 (kolejność `mod`, patrz ZMIANY), po poprawce EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_k5doc_t5b`: EXIT 0, 17 passed, 0 failed.
- `cargo test --all-targets --no-fail-fast`: EXIT 0, łącznie 3817 passed, 0 failed, 1 ignored. Ignorowany test jest w innym pliku testowym niż T5b; ta runda nie dodała żadnego `#[ignore]` (grep na `p6_k5doc_t5b.rs` i module: brak trafień).
- Po bramkach: `rm -rf` katalogu CARGO_TARGET_DIR tej rundy; `df -h /` po sprzątaniu: 11 GB wolne.

## MUTACJE NA MODULE RUST (każda: podmiana w `siege_tactics_ranged_forward.rs`, `cargo test --test p6_k5doc_t5b`, przywrócenie `git checkout`)
- (a) warunek postępu: pin `if (forwardGain <= 0 && rowGap >= 0) continue;` -> Rust `forward_gain <= 0.0` zmienione na `forward_gain < 0.0`. WYNIK: EXIT 101, 4 FAILED (`best_zajety_w_osi_bez_objazdu_none`, `best_pionowy_bez_postepu_odrzucony`, `best_granica_nc_ge_bf_cols_odrzuca_e`, `wektory_zgodne_z_pinem`). FAIL = zabity.
- (b) granica kolumn: `in_bounds` `(0.0..BF_COLS).contains(&col)` -> `(0.0..=BF_COLS).contains(&col)` (odpowiednik `nc >= BF_COLS` -> `nc > BF_COLS`). WYNIK: EXIT 101, 2 FAILED (`best_granica_nc_ge_bf_cols_odrzuca_e`, `wektory_zgodne_z_pinem`). FAIL = zabity. Wektor off-board jest jedynym zabójcą tego mutanta (dla wroga na planszy jest równoważny, zob. blok MOC TESTU w obronie r1).
- (d) kolejność BFS: `for nr in [row - 1.0, row + 1.0]` -> `[row + 1.0, row - 1.0]`. WYNIK: EXIT 101, 2 FAILED (`best_bfs_kolejnosc_row_minus_1_pierwszy`, `wektory_zgodne_z_pinem`). FAIL = zabity.
- (c) kolejność DIRS4 odwrócona: NIE MIERZONA. Dowód równoważności z r1 (`01-operator-r1.md`, linia 22) podtrzymany: remis (colDist, lateral) wymaga dwóch przyjętych kandydatów, a pary N/S i E/W wzajemnie się wykluczają; DIRS4 wpływa tylko na remisy, które nie występują. BFS ma własną kolejność.

Po mutacjach: `git status` = tylko `mod.rs` (zmiana z sekcji ZMIANY). Moduł przywrócony do stanu z bazy.

## BLOKADY
- Brak. Zakres T5b (czyste funkcje) zrealizowany bez zmian poza allowlistą.
- Wpięcie w `_rangedAction`, `ActivateOps`, `siege_tactics_activate.rs` = T8 / #113 (poza zakresem, zgodnie z dispatchem).
- `_siegeMachineRange` nie portowana (NIE_ZMIERZONO w sensie zakresu: zależy od stanu gry, wołana tylko z katapulty).

## RUNDY
2/5 (runda 1: FAIL FC, BLOCK INFRA; runda 2: ten raport). Ostatni werdykt przed rundą 2: FAIL (FC r1).

## NASTĘPNY KROK
Ewaluator (SONNET) r2 -> Obrona (HAIKU) -> Final Control (SONNET). Integracja i push wyłącznie po READY_FOR_DEPLOY (orkiestrator).

## DEPLOY/PUSH
NIE WYKONANO (brak push do `rust-port/parity-v2` i `claude/rust-sivvrn`; dispatch: bez push).
