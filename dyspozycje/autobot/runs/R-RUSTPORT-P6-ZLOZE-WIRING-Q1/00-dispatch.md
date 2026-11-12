# DISPATCH R-RUSTPORT-P6-ZLOZE-WIRING-Q1 (runda 1)

TEMAT: ZLOZE-WIRING — wpięcie `deactivate_zloze_grants_for_deal` i `sync_relation_status_from_deals` w produkcyjną ścieżkę stanu (zadanie #104).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: 23e33793e (czubek origin/rust-port/parity-v2). Utwórz worktree na gałęzi `wip/R-RUSTPORT-P6-ZLOZE-WIRING-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — znajdź w pinie `deactivateZlozeGrantsForDeal` / `syncRelationStatusFromDeals` i miejsca ich wołania.

GOAL: W produkcyjnej ścieżce (tam, gdzie pin wywołuje te funkcje przy zakończeniu/zmianie umowy) wołaj `deactivate_zloze_grants_for_deal` i `sync_relation_status_from_deals`. Dziś w Rust nie ma żadnego wołającego w `src/` poza ich definicjami w `rust-port/engine/src/domain/diplomacy.rs`.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/diplomacy.rs (ewentualnie minimalne wołanie)
- rust-port/engine/src/domain/<moduł stanu/tury, gdzie pin wywołuje funkcje>
- rust-port/engine/tests/p6_zloze_wiring*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRING-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający obu funkcji istnieje (`git grep` w `src/`, nie tylko w testach).
2. Test behawioralny porównuje wynik z wektorami wygenerowanymi z pinu (nie ręcznymi wartościami); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test.

NIE WOLNO: pushować do `rust-port/parity-v2`, integrować, dotykać `gra/` i `origin/main`, commitować `Cargo.lock`, używać `git add -A`. Commit bez nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Jeśli wołający już istnieje w produkcji: nie zmieniaj kodu, zamknij temat STATUS: PASS z dowodem (`git grep` z numerami linii).
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (DEPLOY/PUSH: NIE WYKONANO).
