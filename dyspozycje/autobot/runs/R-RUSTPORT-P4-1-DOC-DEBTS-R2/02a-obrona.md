# R-RUSTPORT-P4-1-DOC-DEBTS-R2 — 02a Obrona Operatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R2
GOAL: poprawne numery linii pinu `07d2fbd72` w komentarzach (refreshBuildHighlight, applyFogVisibility), zero zmian zachowania
ZMIANY/COMMIT: commit obrony na `85c87edf8` (Operator r1; rodzic = baza `acf238f59` = `origin/rust-port/parity-v2`); SHA commitu obrony w raporcie końcowym Workflow i w `git log` gałęzi `rust-port-wip/p4-1-doc-debts-r2-obrona`. Pliki: `rust-port/engine/src/domain/overlays_view.rs`, `rust-port/engine/tests/p4_1q6_2_build_highlight.rs` (tylko `///`), ten raport.
TESTY: patrz §Bramki
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Pozycje 1–4 (opis bramek, numerów pinu, allowlisty)
Ustalenia faktyczne Evaluatora, nie zarzuty. Bez uwag.

### U1 — opis `:16360` jako `setHighlight(new Set())` — PRZYJMUJĘ
Dowód (pin): `git show 07d2fbd72:gra/src/main.ts | sed -n 16360p` → `unitRenderer.setHighlight(qual);`;
`:16366` → `unitRenderer.setHighlight(new Set(hexes.map(h => keyOf(h.q, h.r))));`;
`:16392-16395` → `unitRenderer.setHighlight(new Set(hexes.map(...)), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,)`.
Poprawka (tylko `///`, numery bez zmian):
- `engine/src/domain/overlays_view.rs` (doc `build_highlight_mode_active`): „(`setHighlight(qual)` `:16360`, `setHighlight(new Set(...))` `:16366`, `:16392-16395`; `clearHighlight()` przy kopalni `:16387`)”.
- `engine/tests/p4_1q6_2_build_highlight.rs` (doc testu `q6_2_pusty_zbior_budowy_wygasza_zasieg`): „(pusty zbior w `setHighlight(qual)` `main.ts:16360`, `setHighlight(new Set(...))` `:16366`, `:16392-16395`; `clearHighlight()` `:16387`)”.
Sens (pusty zbiór w trybie budowy nadal jest warstwą trybu) bez zmian.

### U2 — `syncPlayerUnitSelectionOnMap` cytowane jako `main.ts:7115-7134` (koniec funkcji = 7135) — ODRZUCAM w tym temacie
Fakt potwierdzam (`sed -n 7135p` = `    }`), ale:
1. Dispatch R2 ogranicza GOAL do tabeli (refreshBuildHighlight, applyFogVisibility) i wzorca
   `16359|16391|16351-16395|657-680`; `7115-7134` nie należy do żadnego z nich.
2. Jedno z 4 miejsc (`engine/tests/view_overlays_reach_path.rs:263`) jest POZA allowlistą; częściowa
   poprawka 3/4 zostawiłaby niespójne cytaty tej samej funkcji.
Rekomendacja dla orkiestratora: mikrotemat komentarzowy „7115-7134 → 7115-7135” dla 4 miejsc:
`engine/src/domain/overlays_view.rs:19`, `:424` (po tej obronie), `engine/tests/view_overlays_reach_path.rs:263`,
`renderer/tests/overlays_units_q6.rs:19` (`git grep -n '7115-7134' -- rust-port` = 4 trafienia).

### U3 — brak SHA w raporcie Operatora — PRZYJMUJĘ
Commit Operatora r1: `85c87edf8` (pełny: `git rev-parse 85c87edf8`), rodzic `acf238f59`.
Commit obrony: bezpośredni potomek `85c87edf8`, SHA podany w odpowiedzi Workflow.

## Bramki (po poprawce)
- Skrypt „tylko komentarze” (`git diff -U0 | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*(//|\*)'`) = `0`.
- `git diff --check` = EXIT 0.
- `git grep -nE '16359|16391|16351-16395|657-680' -- rust-port ':!*.json' ':!*.txt' | wc -l` = `0`.
- engine (CARGO_INCREMENTAL=0, DEBUG=0, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramce):
  `cargo fmt --check` = EXIT 0; `cargo clippy --all-targets -- -D warnings` = EXIT 0;
  `cargo test --all-targets` = EXIT 0, 530 binarek, 3982 passed / 0 failed / 1 ignored (jak u Evaluatora; ignored pochodzi z bazy).
- renderer, view-model: obrona ich nie dotyka (diff obejmuje wyłącznie crate engine); wyniki Evaluatora
  na `85c87edf8` (renderer 687/0/0, view-model 109/0/0) pozostają ważne.
