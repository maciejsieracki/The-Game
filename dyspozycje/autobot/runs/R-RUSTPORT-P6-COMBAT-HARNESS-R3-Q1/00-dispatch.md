# DISPATCH R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1 (runda 1)

TEMAT: COMBAT-HARNESS-R3: testy negatywne roll==hitPct, -0 w zdarzeniach, mutacja counts_agree
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:<plik>` — znajdź właściwy plik grepem (NIE zakładaj gra/src/main.ts dla funkcji bitwy).

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine` potwierdź stan wyjściowy. Jeśli zmiana już jest w kodzie — zamknij PASS z dowodem bez zmian.

GOAL: W p6_combat_harness.rs: (a) test że perturbacja roll dokładnie na hitPct odwraca trafienie (ulp poniżej/powyżej); (b) sprawdzenie znaku zera w polach zdarzeń strzałów (nie tylko count==0); (c) mutacja counts_agree jako test, który failuje po zaburzeniu liczników (zamiast logu).

ALLOWLISTA (tylko te pliki):
- rust-port/engine/tests/p6_combat_harness.rs
- rust-port/engine/tests/p6_combat_harness_vectors/ (tylko odczyt, bez zmian wektorów)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Zmiana zgodna z pinem; dowód numerami linii Rust i pinu.
2. Test z wektorami pinu (istniejący generator .mjs lub nowy, ze strażnikiem SHA-256 wyciętych fragmentów); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy/zmieniony test.
5. Jeśli wymagana zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, rebase na odłączonym HEAD. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
