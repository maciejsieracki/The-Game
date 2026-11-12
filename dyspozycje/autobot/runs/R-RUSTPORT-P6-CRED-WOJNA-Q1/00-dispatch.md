# DISPATCH R-RUSTPORT-P6-CRED-WOJNA-Q1 (runda 1)

TEMAT: CRED-WOJNA — hak `note_war_entered` (P4) w pipeline wojny + test 3 tur S3 dla `umowa_handlowa` (zadanie #103).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-CRED-WOJNA-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — wywołanie hooka wejścia w wojnę i obsługa umowy handlowej po wypowiedzeniu.

KROK 0 (obowiązkowy, przed kodem): sprawdź, co już jest. W `rust-port/engine/src/domain/turn_war_dipl_steps.rs:895` hak `reg.note_war_entered(a, b, turn)` JEST wołany. Ustal `git grep` z numerami linii, czy wołanie jest w pipeline wojny produkcyjnie i czy pokrywa wszystkie ścieżki wejścia w wojnę, które pin wywołuje. Brakującą ścieżkę dodaj; jeśli wszystkie są pokryte — nie zmieniaj kodu, dołóż tylko test.

GOAL: (a) pełne pokrycie ścieżek wejścia w wojnę hakiem P4 zgodnie z pinem; (b) test 3 tur S3 dla `umowa_handlowa` porównany z wektorami pinu.

ALLOWLISTA:
- rust-port/engine/src/domain/turn_war_dipl_steps.rs
- rust-port/engine/src/domain/credibility.rs (tylko jeśli potrzebna zmiana)
- rust-port/engine/tests/p6_cred_wojna*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-WOJNA-Q1/01-operator-r1.md

NIE ROBIĆ: wiring zlozeGrants (osobny temat, poza zakresem), zmian formatu zapisu.

KRYTERIA KOŃCA:
1. Wykaz ścieżek wejścia w wojnę: pin vs Rust, z numerami linii, każda pokryta hakiem.
2. Test 3 tur S3 z wektorami z pinu (generator .mjs + strażnik SHA-256), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test.
5. Jeśli BLOCK — raport z dowodem, bez zmian kodu.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
