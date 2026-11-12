STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1
GOAL: (1) tabela pokrycia pętli taktycznej oblężenia #217 (L2–L5, SIEGE-NEARBY L9–L10) względem Rust `domain/siege_*.rs` z numerami linii pinu; (2) port 1:1 najmniejszego czystego brakującego klocka z wektorami z pinu i testem zgodności; (3) plan kolejnych klocków.
ZMIANY/COMMIT: baza `258afaf8f` (= origin/rust-port/parity-v2, zweryfikowane). Gałąź robocza `p6-siege-taktyka-audyt-q1` (commit: patrz sekcja SHA poniżej). Allowlista:
  - NOWE `rust-port/engine/src/domain/siege_tactics_end.rs` (`siege_no_breach_repels_attack`, `battle_winner`, `BattleSide`)
  - ZMIENIONE `rust-port/engine/src/domain/mod.rs` (tylko `pub mod siege_tactics_end;`)
  - NOWE `rust-port/engine/tests/p6_siege_tactics_end.rs` (7 testów)
  - NOWE `rust-port/engine/tests/p6_siege_tactics_gen.mjs` (generator wektorów, Node 22)
  - NOWE `rust-port/engine/tests/p6_siege_tactics_vectors/vectors.json` (4 + 432 przypadków, seed 217)
  - NOWE `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (tabela pokrycia + plan)
  - NOWE `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/01-operator-r1.md`
  Nie dotknięto: `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock` (lokalny lock wygenerowany przez cargo został usunięty przed commitem, untracked), push, integracja.
TESTY:
  - `cargo fmt --check` (crate rust-port/engine): EXIT 0 (po `rustfmt --edition 2021` na dwóch nowych plikach Rust).
  - `cargo clippy --all-targets -- -D warnings`: EXIT 0.
  - `cargo test --lib`: 48 passed, 0 failed.
  - `cargo test --test p6_siege_tactics_end`: 7 passed, 0 failed (w tym `wektory_repels_zgodne_z_webem` 4/4, `wektory_winner_zgodne_z_webem` 432/432).
  - Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (w scratchpad). Target do usunięcia po zamknięciu rundy.
  - Wektory: `node rust-port/engine/tests/p6_siege_tactics_gen.mjs` -> `repels 4 winner 432`.
  - Pin: `git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/src/battle/battleScene.ts` (plik nie leży pod `gra/src/game/`, tylko `gra/src/battle/`).
BLOKADY:
  - Z-ST-1: wycięta funkcja JS jest kopią logiki pinu (linie 10184-10186, 10208-10220), NIE wynikiem uruchomienia całego bundla `battleScene.ts` (DOM/Three.js). Wektory dowodzą równoważności wycinka.
  - Z-ST-2: `battle_winner` przyjmuje już policzone flagi `alive`; ich wyliczenie (`!dead && !fadingOut && !routed`, morale) jest BRAK.
  - D-OBL-4 (z poprzedniej rundy): brak pętli tur taktycznych w Rust; `_runFastForward`, `_checkEnd` jako całość i wpięcie `round_cap_verdict` wymagają osobnej decyzji (K5).
  - NIE_ZMIERZONO: pin 07d2fbd72 vs baza 258afaf8f nie porównywano diffem funkcji oblężenia.
RUNDY: 1/5 (Operator, Haiku 5.5)
NASTĘPNY KROK: Evaluator (Sonnet) na commicie operatora: sprawdzić tabelę (wiersze 1–21) względem linii pinu, wektory i bramki. Potem Final Control. Kolejny klocek wg planu: K1 `stall_pat_loser` (pin 10178-10182).
DEPLOY/PUSH: NIE WYKONANO

PLAN KOLEJNYCH KLOCKÓW (skrót z `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` §4):
  K1 `stall_pat_loser` (pin 10178-10182) — zależy od wejść morale (Z-NB-3).
  K2 `siege_approach_restricted` (pin 7951-7959) — czysty bool, zależy od stanu wyłomu jako bool.
  K3 złożenie kroków `_checkEnd` 10172-10220 — zależy od K1, K2, `round_cap_verdict`, `battle_winner`.
  K4 automat `wallEverBreached` (pin 7638, 7757, 8056, 3718) — zależy od modelu muru/bramy (L3).
  K5 pętla tur (`_runFastForward` 9415 + K3) — wymaga decyzji właściciela (D-OBL-4).
  K6 bitwa ręczna / Pomiń (L5) — po K5.
  L9–L10 (SIEGE-NEARBY, UI i dołączanie) — poza listą, D-OBL-5.

SHA: zob. ostatnia linia commita w gałęzi `p6-siege-taktyka-audyt-q1` (uzupełnione przez `git log -1`).
