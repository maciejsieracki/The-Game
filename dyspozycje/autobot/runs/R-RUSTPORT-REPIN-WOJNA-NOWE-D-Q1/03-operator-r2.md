STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1
GOAL: Odpowiedz na zarzuty weryfikatora rundy 1 (FAIL): poprawka luk mutacyjnych, progow N-1/N/N+1, wektorow z uruchomionego weba dc8a3adc, przeniesienia JSON do data/ z loaderem; bramki z surowymi logami.
ZMIANY/COMMIT: kod partii 1: `e4b387a2e` (zarzut 5: JSON -> `rust-port/engine/data/derived/` + stala `data::derived::WAR_ALLIN_PARAMS_JSON`), `3bca9774e` (zarzuty 1-3: testy NaN, N, N+1, progi merge/no-merge). Ten raport i dokument: commit rundy 2 (SHA w odpowiedzi orkiestratorowi). Wektory weba: `rust-port/engine/tests/p6_repin_wojna_d_vectors.rs` + `tests/p6_repin_wojna_d_vectors/web-dc8a3adc.json` + `evidence/gen-vectors.js`. Allowlista: `domain/war_all_in_capital*.rs`, `domain/mod.rs`, `data/derived/*.json`, `src/data/derived.rs` (addytywny loader), `tests/p6_repin_wojna_d_*`, `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-D.md`, `runs/R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/**`. Zero zmian w `gra/**`, `renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Push: NIE.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE. Galaz NaN: `3bca9774e` (test `extend_walk_nan_budget_stops_at_first_hex`). Mutant M1 ZABITY (`evidence/r4-mut1-nan-guard.log`, 22 pass / 1 fail).
2. PRZYJMUJE. Granica N: `3bca9774e` (`extend_walk_budget_exactly_1_stops_at_first_hex`, `..._just_above_1_extends`). Mutant M2 ZABITY (`r4-mut2-budget-boundary.log`).
3. PRZYJMUJE. Progi: `3bca9774e` + istniejace testy link N-1/N/N+1, merge N/N+1, no-merge N/N+1. Mutanty M3, M4, M5 ZABITE (`r4-mut3-link-radius.log`, `r4-mut4-merge-radius.log`, `r4-mut5-no-merge-near-capital.log`).
4. PRZYJMUJE. Wektory: regeneracja z `git archive dc8a3adc` w mktemp (tsc, zywe `planWarAllInCapital`) daje plik BYTE-IDENTYCZNY z wektorem w repo (`evidence/r4-web-regen.log`, sha256 c3527f45...). Test `web_vectors_match_rust_plan` PASS (300 ziaren). Zastrzezenie: tryb `engage` nie wystepuje w wektorach (engageOrders=0), bo W1/W2 nie sa portowane.
5. PRZYJMUJE. `e4b387a2e`: JSON w `data/derived/` (rename 100%, identyczny z dc8a3adc), loader `WAR_ALLIN_PARAMS_JSON` wzorcem `RUCH_JEDNOSTEK_PARAMS_JSON` w `src/data/derived.rs`; `src/data/mod.rs` bez zmian. Testy `data_loader`/`data_compliance` PASS.
6. ODRZUCAM jako blokade tej rundy. Dispatch wymaga portu tylu symboli, ile sie miesci w partiach, a zaleznosci od niezportowanych modulow (`war-rules-multiwar.ts`, ai.ts, dyplomacja) maja byc ZALOZENIEM + NASTEPNA-PARTIA. Tabela symboli w P6 doc (status NASTEPNA-PARTIA) jest zgodna z tym. Liczby: 10+11+8 = 29 `fn` w 3 plikach (grep `^\s*(pub )?fn`), nie 19. Fakt niepelnosci pozostaje otwarty w NASTEPNA-PARTIA.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`evidence/r4-fmt.log`; po `rustfmt` jednego nowego pliku testowego)
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`evidence/r4-clippy.log`)
- `cargo test --no-fail-fast`: EXIT=0, 1690 passed / 0 failed (`evidence/r4-cargo-test.log`)
- `p6_repin_wojna_d_nav`: 23/23; `p6_repin_wojna_d_vectors`: 1/1
- mutacje M1-M5: wszystkie ZABITE (logi `evidence/r4-mut*.log`), kod przywrocony do HEAD
- `git diff --check`: EXIT=0
BLOKADY: (1) W1/W2 i tryb `engage` nieportowane (zaleznosc od `war-rules-multiwar.ts`), zalozenie + NASTEPNA-PARTIA. (2) Podpiecie WarAllInContext (ai.ts/barbarians.ts/main.ts): poza zakresem. (3) Brak mutantow dla galezi W1/W2 (galezi nie ma w Rust).
KOREKTA: guard web `!(budget > 1)` jest w `warAllInCapital.ts:459` (nie 458, jak w rundzie 1).
RUNDY: 2/5 (po FAIL weryfikatora runda 1 -> poprawka runda 2). Kolejny etap: Evaluator i Final Control z tym samym ID.
NASTEPNA-PARTIA: port `war-rules-multiwar.ts` i galezi W1/W2; podpiecie WarAllInContext.
NASTEPNY KROK: Evaluator (Sonnet 5.5) -> Final Control (Sonnet 5.5) na SHA commitu rundy 2.
DEPLOY/PUSH: NIE WYKONANO
