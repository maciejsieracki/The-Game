# DISPATCH R-RUSTPORT-P6-ZLOZA-B-REST-Q1 (runda 1)

TEMAT: ZLOZA-B-REST: pozostałe gałęzie transferBasketItems (zloto, praca, zywnosc, tech, surowiec, miasto)
DOMENA: GAME (implementacja). BAZA: `94feb5e37` (czubek `origin/rust-port/parity-v2`, pełny test 3284/0/1). Worktree na `wip/R-RUSTPORT-P6-ZLOZA-B-REST-Q1`. Przed startem: `git checkout --detach 94feb5e37`.
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Dokończyć port `transferBasketItems` (pin `gra/src/main.ts:12566`): gałęzie zloto, praca, zywnosc, tech, surowiec_boolean, surowiec_ilosc, miasto — każda do odpowiednika stanu Rust, jeśli stan istnieje. Jednostka jest no-op w pinie (`main.ts:12664-12672`, TODO A1) — zostaje jak w zloze (raport). Jeśli dla danej gałęzi Rust nie ma stanu (brak pola/komendy) — NIE wymyślać: zapisać NIE_ZMIERZONO z listą brakujących pól i zakończyć tę gałąź jako 'do osobnego tematu'. Aktualny stan: `rust-port/engine/src/domain/diplomacy_basket.rs` (zloze + `skipped_kinds`). Parytet z wersją webową: wdrażamy 1:1 wg pina `07d2fbd72` (`gra/src`). Nie zmieniać zachowania poza pinem. Odstępstwo od pina = FAIL. Źródło: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1-ROZPOZNANIE.md` sekcja 2a.

## ALLOWLISTA
- `rust-port/engine/src/domain/diplomacy_basket.rs (gałęzie kinds)`
- `rust-port/engine/src/domain/diplomacy.rs (wyłącznie helpery koszyka)`
- `rust-port/engine/src/domain/mod.rs (tylko jeśli nowy moduł)`
- `rust-port/engine/tests/p6_zloza_basket*.rs (rozszerzenie)`
- `rust-port/engine/tests/p6_zloza_basket_gen.mjs (rozszerzenie generatora o nowe typy)`
- `rust-port/engine/tests/p6_zloza_basket_vectors/** (regeneracja)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: gra/**, Cargo.toml, Cargo.lock, push do parity, wpinanie w produkcję (poza zakresem), zmiana gałęzi zloze, osłabianie asercji, #[ignore]. Nie wymyślać brakującego stanu.

## KRYTERIA KOŃCA
1) Wektory z pina dla każdej zrealizowanej gałęzi (generator wykonuje pin, SHA fragmentu w teście). 2) Gałęzie bez odpowiednika w Rust: jawnie NIE_ZMIERZONO z listą pól w raporcie, nie cicho pominięte. 3) fmt, clippy --all-targets -D warnings, cargo test --lib, testy basket zielone. 4) Pełny cargo test --no-fail-fast przed FC: 0 failed.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md), z `Claude-Session`. Pełna bramka przed commitem. RUNDY: 1/5.
