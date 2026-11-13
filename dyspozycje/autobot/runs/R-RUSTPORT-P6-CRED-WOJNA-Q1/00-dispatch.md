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

---

## DODATEK r2 (po FC r1 = FAIL; runda 2/5, ten sam ID)

Baza r2: `15d85c2ee` (czubek wip z obroną r1; zawiera kod `beefdec4e` i raport `0223d1a2c`). Zweryfikowane: `15d85c2ee` jest przodkiem `origin/claude/rust-sivvrn`. Nie zaczynaj od `23e33793e` z r1.

NAPRAW (zarzuty FC r1, do wykonania w tej rundzie):
1. Brak ≥150 wektorów z pinu dla hooka P4 i testu S3. Dodaj generator `.mjs` wykonujący tekst pinu w node (jak w pozostałych `p6_*_gen.mjs`) i strażnik SHA-256 wyciętych fragmentów. Liczniki niepustości > 0.
2. Kolejność D4/D8 względem P4: dodaj wektory z pinu dla tej kolejności (zarzut 6 FC r1).

ALLOWLISTA r2: bez zmian względem r1, plus nowe pliki `rust-port/engine/tests/p6_cred_wojna*_gen.mjs` i ich wektory JSON (dozwolone przez FC r1).

DO DECYZJI CZŁOWIEKA — NIE ROBIĆ w r2:
- alias `umowa_handlowa` → `LegacyTradeAgreement` (credibility.rs:597-598): pominąć w tej rundzie. Test S3 wykonaj bezpośrednio na `StreamDealKind`, bez aliasu.
- wpięcie wypowiedzenia gracza (web 13168/13205), sojuszu (23806), klastra (40441): poza tematem, to #120.
- wiring `zlozeGrants`: poza zakresem, jak w r1.

BRAMKI r2 (EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_cred_wojna`; `p6_credibility`; `p6_wire_war_pipeline`; pełny `cargo test --no-fail-fast` (dowód liczników). `CARGO_TARGET_DIR` poza repo, usuń po bramkach.

RUNDY: 2/5. Raport: zapisz `01-operator-r2.md` (nie nadpisuj r1). Commit bez nazwy modelu, `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. NIE pushować do parity, nie integrować, nie dotykać `gra/`.
