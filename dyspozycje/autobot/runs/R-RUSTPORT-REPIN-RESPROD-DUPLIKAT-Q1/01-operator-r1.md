STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1
GOAL: Dług D-R5-1: usunąć starą migawkę produkcji surowców (`resolve_resource_production` / `stack_resource_production` / `ResourceKey` / `ResourceProductionTotals`, typy u32/u8, reguła tylko tartak+kamieniołom) i przepiąć jej wołających (tests/resource_production.rs, tests/parity_suite.rs, benches/engine_modules.rs) na jedną regułę z `improvements.rs` (web `terrain-improvements.ts`). Asercje zastąpione wartościami z weba.
ZMIANY/COMMIT: allowlista: rust-port/engine/src/domain/resource_production.rs (usunięta rodzina; zostają citizen_*), rust-port/engine/tests/resource_production.rs (przepisany), rust-port/engine/tests/parity_suite.rs (blok resource production), rust-port/engine/benches/engine_modules.rs (stack_territory_yield), dyspozycje/rust-port/p6/P6-REPIN-RESPROD.md (nowy: pomiar wołających, tabela wartości, ZAŁOŻENIA), dyspozycje/autobot/runs/R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1/01-operator-r1.md. Commit: SHA w sekcji poniżej (po commicie). Baza: 0fd287721 (z dispatchu); origin/rust-port/parity-v2 jest już na bf9298737, nie integrowano.
TESTY:
- Wartości z weba: Node 22.22.0 na `git archive origin/main gra/src gra/data`. Tartak/kamieniołom/glinianka/warzelnia_soli 50/75/113; kopalnie miedzi/żelaza/cyny 20/30/45; stadnina 25/38/56; złoto 1/2/2. Zgodne z asercjami.
- `cargo fmt --check`: PASS.
- `cargo clippy --all-targets -- -D warnings`: PASS (exit 0, także po edycji komentarzy).
- `cargo test --test resource_production`: 7 passed, 0 failed. `--test parity_suite`: 11 passed, 0 failed.
- Wszystkie binarki `tests/*.rs` (300 plików, w partiach): 0 FAILED; passed 1259 + 5 + 993. Jedyny `ignored` to `e2e::dump_tick1_econ_for_web_generator`, obecny już na bazie (0 nowych #[ignore]).
- `cargo test --lib --bins`: 22 passed, 0 failed.
- Brak zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri.
BLOKADY: brak blokad technicznych. ZAŁOŻENIA do akceptacji (szczegóły w P6-REPIN-RESPROD.md §3):
- Z1: aliasy angielskie (`lumber_mill`, `quarry`) istniały tylko w starej migawce. Asercja zmieniona z „akceptuje" na „zwraca None" (zgodnie z webem). Zmiana znaczenia testu, nie osłabienie.
- Z2: `ResourceKey::as_str()` zastąpione literałami kluczy danych.
- Z3: bench: checksum liczy drewno jako `f64 as u64`.
Uwaga procesowa: worktree zastał niezacommitowane zmiany z wcześniejszej próby tego samego tematu (wznowienie, resumeFromRunId). Zweryfikowałem je i zachowałem; dorobiłem tylko komentarze i dokumentację.
Poza allowlistą (nie ruszane): rust-port/engine/src/domain/start_position.rs:694 — komentarz wspomina `resource_production::normalize_improvement_key`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na commit operatora; potem Final Control. Osobny temat (poza tym): R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1 i inne zgłoszenia właściciela nie należą do tego Operatora.
DEPLOY/PUSH: NIE WYKONANO
