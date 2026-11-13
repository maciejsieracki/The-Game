# DISPATCH R-RUSTPORT-P6-INTEG-JS-MAX-Q1 (runda integracyjna) — zadanie #110

TEMAT: przenieść konsolidację js_max (`R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1`, FC PASS-WITH-NOTES `f946ee378`, baza `cfa1edd31`) na aktualne parity i zintegrować, po pełnym teście.
DOMENA: GAME (integracja). BAZA: `fc2ed160f` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-INTEG-JS-MAX-Q1`.

## KROK 0 (obowiązkowy)
Potwierdź `fc2ed160f` jako czubek parity i że `cfa1edd31` jest jego przodkiem. Wypisz liczbę commitów `cfa1edd31..f946ee378` (oczekiwane: kilka) i listę plików.

## GOAL
(a) Cherry-pick commitów `cfa1edd31..f946ee378` na `fc2ed160f`. Konflikty: rozwiązuj TYLKO w plikach `domain/**` i `tests/p6_js_math*`; nie zmieniaj semantyki callerów (zachowanie bit-w-bit jak w FC).
(b) Pełny `cargo test --no-fail-fast` na wyniku; liczby w raporcie. Istniejące wektory (p6_8j_guards, p6_js_max0, p6_js_max0_rest, p6_js_max_sign, p6_siege_tactics_inputs_pos, p6_js_math_equiv) zielone.
(c) Bramki: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, pełny test.

## ZASADY
- Nie zmieniaj treści wektorów ani asercji. Konflikt w wektorach = BLOCK z opisem.
- Jeśli pełny test nie przejdzie na kodzie js_max (poza konfliktem wektorów z innymi tematami): STATUS BLOCK, bez FF.
- Po zielonym wyniku NIE rób push do parity — orkiestrator zrobi FF po weryfikacji. Commit integracyjny na wip.

## ALLOWLISTA
- pliki z commitów js_max (domain/**, tests/p6_js_math*)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-JS-MAX-Q1/01-operator-r1.md`
ZAKAZ: `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować), push do parity.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA integracji)/TESTY (liczby)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
