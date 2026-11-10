STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1
GOAL: RR-T6 — rejestr zasobów renderera (CPU, std-only, bez unsafe) i test regresyjny „N tur nie zwiększa zasobów” odtwarzający M1/M2/M3 (+M6).
ROLA: Operator (Opus 5.5 medium), runda 1/5
BAZA: origin/rust-port/parity-v2 = 0a496f67
ZMIANY/COMMIT: kod d35a800c31c657dd74bde2022fe0c0c6f743f25a — `rust-port/renderer/src/assets.rs` → `src/assets/{mod,registry,shared,cache,listeners,budget,fake}.rs`, `tests/assets_registry.rs`, `tests/assets_nturns.rs`; dokument `dyspozycje/rust-port/p4/P4-9-ASSET-REGISTRY.md` + ten raport (osobny commit). Cargo.toml/Cargo.lock/lib.rs bez zmian.
TESTY (PEŁNE surowe logi: P4-9-ASSET-REGISTRY.md §6, na zacommitowanym drzewie po `cargo clean`):
- cargo fmt --all -- --check → EXIT=0
- cargo clippy --locked --all-targets -- -D warnings → EXIT=0
- cargo test --locked --all-targets → EXIT=0 (assets_nturns 6/6, assets_registry 14/14, cpu_sanity 1/1)
- dodatkowo: cargo clippy --locked --all-targets --features gpu -- -D warnings → EXIT=0; cargo +1.87.0 test --locked --all-targets → EXIT=0
- grep unsafe w nowym kodzie/testach → brak trafień (EXIT=1)
Wynik binarny: wariant Fixed w budżecie (≤ tura 10) po 50 i 200 turach, small 40x25 i large 96x60 (liczby żywych zasobów identyczne); LeakM1/M2/M3 przekraczają budżet w turach 50 i 200 na obu mapach (oczekiwana metryka); użycie po zwolnieniu → Err(Stale); kolejność „nowy przed starym” potwierdzona dziennikiem FakeGpu.
BLOKADY: brak. NIE_ZMIERZONO: realna pamięć GPU, porównanie z webem perfDebug, normalizacja na liczbę obiektów (D-RR-7 otwarte → parametr).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — weryfikacja na commicie.
DEPLOY/PUSH: NIE WYKONANO
