# DISPATCH R-RUSTPORT-P6-K5LOOP-COMPOSE-Q1 (runda 1)

TEMAT: K5LOOP-COMPOSE (#91): test składania pętli taktycznej end-to-end na sekwencjach z pinu
DOMENA: GAME. Baza: a0b302eb8 (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5LOOP-COMPOSE-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:<plik>` — znajdź właściwy plik grepem.

KROK 0 (obowiązkowy): `git grep` potwierdź stan wyjściowy. Jeśli zmiana już jest w kodzie — zamknij PASS z dowodem bez zmian.

GOAL: Jeden test łączący begin_turn, activate_next, pojedynczy cios i fast_forward na sekwencjach z pinu, z asercją końcowego stanu wg pinu. Jeśli wektory obu zestawów nie dzielą sekwencji — BLOCK (wymaga nowych wektorów pinu).

ALLOWLISTA (tylko te pliki):
- rust-port/engine/tests/p6_siege_tactics_loop_compose.rs (nowy)
- rust-port/engine/tests/p6_siege_tactics_loop_vectors/ i p6_siege_tactics_fastforward_vectors/ (tylko odczyt)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-COMPOSE-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Zmiana zgodna z pinem; dowód numerami linii.
2. Test z wektorami pinu (istniejące wektory lub generator .mjs z tego repo; strażnik SHA-256 gdzie generator go ma); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy/zmieniony test.
5. Jeśli wymagane wektory lub zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, checkout/rebase na odłączonym HEAD w głównym repo. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (z liczbami)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
