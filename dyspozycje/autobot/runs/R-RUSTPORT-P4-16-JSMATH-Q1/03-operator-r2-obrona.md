STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-16-JSMATH-Q1
GOAL: Jeden moduł `jsmath` w `rust-port/renderer`, bitowo zgodny z V8 `Math.sin/cos/tan/atan2/pow/hypot/exp/log`, używany przez `geom`, `terrain` i `models/wonders` zamiast funkcji systemowych; wektory z V8 (≥20 000/funkcję); dotychczasowe testy zgodności zielone bez zmiany fixtur.
ZMIANY-COMMIT: runda 2 na bazie `fc106495`: `rust-port/renderer/src/terrain/mod.rs` (nowe `quat_from_euler_xyz` na jsmath, 3 wywołania przepięte), `rust-port/renderer/tests/jsmath_wiring.rs` (skaner rekurencyjny + `f64::fn(` + pośrednie helpery `pick`; 2 nowe testy), `dyspozycje/rust-port/p4/P4-16-JSMATH.md` (§9, §11), ten plik. `pick/**`, fixtury, `Cargo.*` bez zmian.
TESTY: fmt/clippy/clippy-gpu/test EXIT=0 w świeżym targecie; 81 testów ok; mutacje r2 4/4 wykryte (P4-16 §11).
ZARZUTY:
1. terrain → `pick::three::Quat::from_euler_xyz` (libm) — PRZYJMUJĘ, poprawione (P4-16 §11).
2. nieszczelny skaner wiring — PRZYJMUJĘ, poprawione (P4-16 §11).
BLOKADY: brak. `pick/**` nadal na libm (poza allowlistą, osobny temat).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
