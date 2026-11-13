# DISPATCH R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1 (runda 1)

TEMAT: JS-MAX-CONSOLIDATE (#110): jedna współdzielona funkcja js_max/js_min zamiast 37 kopii
DOMENA: GAME. Baza: a0b302eb8 (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:<plik>` — znajdź właściwy plik grepem.

KROK 0 (obowiązkowy): `git grep` potwierdź stan wyjściowy. Jeśli zmiana już jest w kodzie — zamknij PASS z dowodem bez zmian.

GOAL: Zastąpić prywatne kopie js_max/js_min/js_max0/js_max_sign jedną funkcją ze znakiem zera i NaN jak w siege_tactics_inputs_pos.rs:27,42. PRZED startem sprawdź, czy gałąź 621e7338f (JS0) nie koliduje; jeśli koliduje — BLOCK z listą konfliktów.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/mod.rs
- nowy moduł wspólnej funkcji w rust-port/engine/src/domain/ (np. js_math.rs)
- pliki z kopiami wymienione w raporcie: auto_improvements.rs, turn_economy.rs, mapgen/masks.rs, siege_tactics_unit.rs, siege_capital_plunder.rs, siege_tactics_activate.rs, siege_tactics_breach.rs, siege_tactics_end.rs, siege_tactics_endcheck.rs, siege_tactics_inputs_wall.rs, turn_economy_post.rs, diplomacy_multiwar.rs, diplomacy_tick_war_brake.rs, civ_matrix.rs (tylko podmiana wywołań na wspólną funkcję; semantyka NaN i -0 bez zmian)
- rust-port/engine/tests/ (tylko istniejące testy js_max0*, bez osłabiania)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Zmiana zgodna z pinem; dowód numerami linii.
2. Test z wektorami pinu (istniejące wektory lub generator .mjs z tego repo; strażnik SHA-256 gdzie generator go ma); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy/zmieniony test.
5. Jeśli wymagane wektory lub zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, checkout/rebase na odłączonym HEAD w głównym repo. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (z liczbami)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
