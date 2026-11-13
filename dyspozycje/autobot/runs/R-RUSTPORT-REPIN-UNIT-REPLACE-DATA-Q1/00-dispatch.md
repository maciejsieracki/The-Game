# DISPATCH R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (runda 1) — zadanie #153 (L-1)

TEMAT: uzupełnić pole JSON `"Zastąp specjalnie"` (tabela awansów INFANTRY; w strukturze Rust to `zastap_specjalnie` w `src/data/units_combat.rs:141`) w danych Rust dla 21 z 23 jednostek.
DOMENA: GAME (dane). Baza: `cfa1edd31` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1`.
Źródło prawdy (tylko odczyt): `git show 07d2fbd72:gra/data/units.json` (pole „Zastąp specjalnie”). Orakulum: `git show 07d2fbd72:gra/tools/unit-replace-promotion-table-test.cjs` (`EXPECTED_TABLE`). Opis luki: `dyspozycje/rust-port/p6/P6-REPIN-UNIT-REPLACE.md` §2 (L-1).

## KROK 0 (obowiązkowy)
Sprawdź: orakulum istnieje w `07d2fbd72`. Jeśli NIE — STATUS BLOCK z dowodem, bez zmian w kodzie.
Policz: w `rust-port/engine/data/units.json` jest 2 niepuste wpisy `zastap_specjalnie` (Wojownik mykeński, Wojownik tyrreński). Potwierdź liczbę 21 pustych do uzupełnienia.

## GOAL
Wpisać w `rust-port/engine/data/units.json` pole `"Zastąp specjalnie"` dla 21 jednostek, których web ma cel, a w Rust wartość `—`. Wartości **bajt-w-bajt z pinu** (EXPECTED_TABLE). Dwa istniejące wpisy NIE zmieniać.

## ZAKRES (twardy)
- Zmieniać WYŁĄCZNIE pole `"Zastąp specjalnie"` w `rust-port/engine/data/units.json`.
- Zakaz zmiany innych pól tego pliku. Rozbieżności pól są osobną decyzją właściciela (#27). Diff bez pola `zastap_specjalnie` ma być pusty.
- Zakaz zmian w `src/**`, `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować).

## ALLOWLISTA
- `rust-port/engine/data/units.json`
- `rust-port/engine/tests/p6_repin_unit_replace_data*.rs` (nowy test)
- `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1/01-operator-r1.md`

## KRYTERIA KOŃCA
1. Nowy test Rust czyta `units.json` i porównuje 23 wpisy z tabelą z orakulum (wartości z pinu, strażnik SHA-256 wyciętej tabeli). Wynik: 23/23 zgodne.
2. `git diff` na `units.json` po odfiltrowaniu pola `"Zastąp specjalnie"` jest pusty.
3. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; pełny `cargo test --no-fail-fast` z liczbami. `CARGO_TARGET_DIR` poza repo, usuń po bramkach.
4. Brak `#[ignore]`, brak osłabionych asercji.

## NIE ROBIĆ
- Wiring `execute_unit_replace` w turze (L-3) — osobny temat.
- Klucz `ai_zamiana_jednostek_limit_udzial` (L-2) — osobny temat.
- Integracja, push do parity, dotykanie `gra/` i `origin/main`.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md). Zostaw `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
RUNDY: 1/5.

## KOREKTA (przed startem)
Klucz JSON w obu plikach to `"Zastąp specjalnie"` (wszystkie 75 jednostek go mają). Nazwa `zastap_specjalnie` dotyczy tylko struktury Rust. Filtrować diff po kluczu `"Zastąp specjalnie"`.
