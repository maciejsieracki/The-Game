# DISPATCH R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1 (runda 1) — zadanie #110, wariant (b)

TEMAT: jedna wspólna implementacja js_max/js_min/js_max0/js_max_sign/js_min_sign, bez zmiany obserwowalnego zachowania.
DOMENA: GAME. Baza: `cfa1edd31` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1`.
Decyzje (podjęte przez orkiestratora, wariant b z rekomendacji FC `1fe55766b`): (1) nowy moduł `rust-port/engine/src/domain/js_math.rs`; (2) prywatne kopie w plikach domeny zastąpić wywołaniem js_math; (3) allowlista rozszerzona o pliki z kopiami i huby re-eksportu; (4) ZACHOWANIE KAŻDEGO CALLERA BEZ ZMIAN (±0/NaN jak dotąd): js_math eksportuje warianty per semantyka, nie jedną funkcję zmieniającą wyniki.

## KROK 0 (obowiązkowy)
Przeszukaj bazę: `git grep -n 'fn js_max\|fn js_min\|fn js_max0\|fn js_max_sign\|fn js_min_sign' cfa1edd31 -- rust-port/engine/src`. Zapisz liczbę definicji i pliki. Dla KAŻDEGO callera zapisz obecną semantykę zera i NaN (tabela w raporcie). Jeśli liczba definicji nie zgadza się z FC (38 w 27 plikach w `a0b302eb8`) — zapisz różnicę, nie zgaduj.

## GOAL
Zero prywatnych kopii poza `js_math.rs`. Każdy caller zachowuje wynik bit-w-bit (w tym znak zera i NaN). Istniejące wektory (`p6_8j_guards`, `p6_js_max0`, `p6_js_max0_rest`, `p6_js_max_sign`, `p6_siege_tactics_inputs_pos`) zielone bez zmian ich treści.

## ALLOWLISTA
- `rust-port/engine/src/domain/js_math.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (tylko `mod js_math;`)
- pliki domeny z prywatnymi kopiami (lista z KROKU 0) i huby re-eksportu (np. `siege_tactics_blow.rs`) — tylko linie definicji i importów
- `rust-port/engine/tests/p6_js_math*.rs` (NOWY test równoważności per caller)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1/01-operator-r1.md`
ZAKAZ: `gra/`, `Cargo.toml`, `Cargo.lock`, zmiana treści istniejących testów wektorowych.

## KRYTERIA KOŃCA
1. `git grep` po `cfa1edd31..HEAD`: definicje js_* tylko w `js_math.rs`.
2. Test równoważności: dla każdego callera sprawdza wynik na wektorach brzegowych (±0, NaN, Inf) = semantyka z tabeli KROKU 0.
3. Istniejące wektory zielone bez zmiany treści.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; pełny `cargo test --no-fail-fast` z liczbami. `CARGO_TARGET_DIR` poza repo.
5. Brak `#[ignore]`, brak osłabionych asercji.

## NIE ROBIĆ
Zmiany wyników callerów (np. ujednolicenia do JS +0). Integracja, push do parity, dotykanie `gra/`.

## UZASADNIENIE MODELU
Operator = SONNET: synteza diffu w ok. 27 plikach i tabela semantyki per caller (zadanie trudne, >1 partia Rust). Obrona HAIKU.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO). Tabela semantyki w raporcie.
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
