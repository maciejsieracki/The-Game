# DISPATCH R-RUSTPORT-P6-K5-LOOP-WIEZE-R2-Q1 (runda 1)

TEMAT: K5-LOOP-WIEZE-R2 — fire_siege_towers wybiera cel przez pick_tower_target zamiast zabijać stałą wieżę (zadanie #146).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5-LOOP-WIEZE-R2-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — definicja _fireSiegeTowers (ok. :4208) i wołanie w _beginTurn (ok. :5643). NIE gra/src/main.ts.

KROK 0 (obowiązkowy): `git grep` pick_tower_target / fire_siege_towers w rust-port/engine/src. Potwierdź, że pick_tower_target nie ma produkcyjnego wołającego (tylko testy p6_tower_target*). Jeśli wołający już istnieje — zamknij PASS z dowodem.

GOAL: fire_siege_towers (siege_tactics_loop.rs ok. :159-168) wybiera cel przez pick_tower_target (siege_tactics_tower.rs:486) w kolejności i na warunkach zgodnych z pinem; nie implementuj strzału wieży (to #96).

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/src/domain/siege_tactics_tower.rs (tylko jeśli potrzebna zmiana sygnatury)
- rust-port/engine/tests/p6_tower_target*.rs (test wiązania)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-LOOP-WIEZE-R2-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający pick_tower_target z fire_siege_towers (numer linii Rust i pin).
2. Test z wektorami pinu (istniejący generator tower_target lub nowe przypadki; strażnik SHA-256); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test 'p6_tower_target*'`.
5. Jeśli wymagana zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, rebase/checkout na odłączonym HEAD w głównym repo. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
