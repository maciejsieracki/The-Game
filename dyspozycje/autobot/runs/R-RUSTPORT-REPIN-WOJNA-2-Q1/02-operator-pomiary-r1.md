STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: REPIN-WOJNA-2, runda 1 — niezależna weryfikacja delty weba 91dc998a → dc8a3adc dla formationRules (U1) i battle-mode (U2) na commicie 9a16b238 (Operator-impl r1).
ZMIANY/COMMIT: tylko dokumenty: `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (sekcja „Weryfikacja niezależna"), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/02-operator-pomiary-r1.md`, logi `fmt-verify.log`, `clippy-verify.log`, `verify-test.log`, `mut-v-X1..X6, B1, B2 *.log`. Kod Rust bez zmian (mutanty przywracane, `cmp` OK). Brak zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md. Cargo.lock lokalny, niecommitowany.
TESTY:
- `cargo fmt --all -- --check` EXIT=0 (`fmt-verify.log`)
- `cargo clippy --all-targets -- -D warnings` EXIT=0 (`clippy-verify.log`)
- `cargo test --no-fail-fast` EXIT=0: 1446 passed / 0 failed (`verify-test.log`, 197 binarek)
- `git diff --check` czysty
- Mutanty weryfikatora (EXIT=101 = zabity): X1 wing cap 3→4 FAIL; X2 playable ceil→floor FAIL; X3 rowStart floor→ceil FAIL; X4 parzystość skrzydeł FAIL; X5 compact bez min(previous) FAIL; X6 compact `<=`→`<` FAIL; B1 wersja is_some FAIL 2/3; B2 manual `!= Some(true)` FAIL 2/3.
- Delta web: wszystkie hunki formationRules w initialBattleSlots (46-118) i compactLineAllowsAdvance (148-160); classify i initialBattleFormation bez delty. Z-3 potwierdzone (army-leadership, ai-era-unit-promotion nie zmienione).
BLOKADY: brak technicznych. NIE_ZMIERZONO: NaN/nieskończony rankWidth (web propaguje NaN, Rust ignoruje; wektory tego nie obejmują). Cytowanie battle-mode `:9-14` w dossier i kodzie — funkcja na `:9-13` (kosmetyka).
ZAŁOŻENIA: Z-1 pin dc8a3adc (GOAL dispatchu, origin/main; BAZA dispatchu wskazywała 91dc998a, przodka); Z-2 battleAlwaysManual jako Option<bool>, nie-boolowskie → None (web `=== false`); Z-3 wektory army-leadership i ai-era-unit-promotion bez regeneracji (potwierdzone).
RUNDY: 1/5 (weryfikacja tej samej rundy, bez nowej rundy kodu)
NASTĘPNY KROK: runda 2 (ten sam ID): U3 `domain/generals.rs` (generals.ts, +50) z wektorami z weba dc8a3adc i mutantami; potem U4 `general_quick_follow.rs` (generalQuickFollow.ts, +161; zależny od U3 i planned-march); następnie integracja battle-mode z zapisem (main.ts:29056, :40818-40820). Przed integracją obieg Evaluator/Final Control.
DEPLOY/PUSH: NIE WYKONANO
