# R-RUSTPORT-P4-1-DOC-DEBTS-R2 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (komentarze w kodzie Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R2
GOAL: poprawione cytaty numerów linii pinu `07d2fbd72` (`refreshBuildHighlight`, `applyFogVisibility`) w komentarzach `rust-port/**`.
OCENIANY COMMIT: `85c87edf8340afd34fa2cb969af6865f5a77b4f7` (gałąź `rust-port-wip/p4-1-doc-debts-r2`), rodzic = BAZA `acf238f599059e71b3394ca1a164759491463889` (= `origin/rust-port/parity-v2` w chwili oceny; `merge-base --is-ancestor` OK, 1 commit nad bazą).

## 1. Numery linii pinu — sprawdzone przez `git show 07d2fbd72:...` (nie z tabeli)
`gra/src/main.ts`:
- 16351 `function refreshBuildHighlight(): void {`, 16396 `}` → `16351-16396` OK.
- 16360 `unitRenderer.setHighlight(qual);` → `:16360` OK (16359 = `}` pętli for).
- 16391 `clearMineEligibleOverlay();`, 16392-16395 `unitRenderer.setHighlight(new Set(...), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,);` → `:16392-16395` OK.
- Pozostałe cytaty w tych samych komentarzach (nietknięte) też zgodne: `:16352-16361`, `:16363-16367`, `:16366`, `:16369-16373`, `:16386-16390`, `:16387`.
`gra/src/render/cities.ts`:
- 740 `applyFogVisibility(vis, fogOn, playerOwnerId = HUMAN_OWNER_PRIMARY): void {`, 763 `}` → `cities.ts:740-763` OK (657-680 to dziś kod `badgeLodPurgePending`, nie mgła).

## 2. Diff zawiera WYŁĄCZNIE komentarze (skrypt własny)
`git diff -U0 acf238f5 85c87edf8 -- rust-port | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*(//|\*)'` = **0**.
Wariant ostrzejszy (tylko `//`, `///`, `//!`, bez `*`): 0 linii poza komentarzami. Zmienionych linii: 40 (20 `-`/20 `+`), każda to `//!`/`///`/`//`. Kontekst hunków sprawdzony ręcznie — żadna nie leży w literale stringa (`r#"..."#`, `include_str!`).
`git diff --check` = 0. Dodanych `#[ignore]`: 0. Zmian asercji / nazw testów / wektorów: 0.

## 3. Allowlista
Zmienione pliki = dokładnie 9 plików z tabeli dispatchu + `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-DOC-DEBTS-R2/01-operator-r1.md`. Pliki spoza allowlisty: brak (sekcja „Pliki spoza allowlisty”: pusta).
Zgodność z inwentarzem `R1/02a-obrona.md` (tabela l. 56-68): wszystkie wiersze pokryte, linie zgodne.

## 4. Grep kontrolny
`git grep -nE '16359|16391|16351-16395|657-680' 85c87edf8 -- rust-port ':!*.json' ':!*.txt'` = **0 trafień**.
Wszystkie trafienia (45 plików) to dane: 44 `*.json` (wektory `engine/tests/p6_*_vectors`, fixtures renderera) i 1 `*.txt` (`renderer/tests/fixtures/jsnum/to_fixed.txt`) — ciągi cyfr w liczbach zmiennoprzecinkowych (np. `0.8370746716391295`, `22.16359333600849`), nie cytaty pinu. Zgodnie z ZAKRESEM nietknięte — słusznie.

## 5. Bramki odtworzone (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie, usuwany po każdym crate, crate'y jeden po drugim)
| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets |
|---|---|---|---|
| view-model | EXIT 0 | EXIT 0 | EXIT 0 — 109 passed / 0 failed / 0 ignored |
| engine (w tle, setsid nohup, EXIT w logu) | EXIT 0 | EXIT 0 | EXIT 0 — 530 binarek, 3982 passed / 0 failed / 1 ignored (= stan bazy, ignore nie z tego diffu) |
| renderer (dysk 13 GB przed startem, brak równoległych buildów cargo) | EXIT 0 | EXIT 0 | EXIT 0 — 80 binarek, 687 passed / 0 failed / 0 ignored |
Wyniki identyczne z raportem Operatora.

## 6. Uwagi (nie blokują)
- U1: komentarze `overlays_view.rs:223` i `p4_1q6_2_build_highlight.rs:247` opisują kod pinu jako `setHighlight(new Set())` przy `:16360`, a w pinie jest `setHighlight(qual)` (zbiór może być pusty). Numer poprawny; opis semantycznie trafny (pusty zbiór), dosłownie nieprecyzyjny. Operator to zgłosił; poza zakresem dispatchu (tylko numery).
- U2: poza zakresem wzorca dispatchu — `syncPlayerUnitSelectionOnMap` cytowane jako `main.ts:7115-7134` w 4 miejscach (`engine/src/domain/overlays_view.rs:19`, `:423`; `engine/tests/view_overlays_reach_path.rs:263`; `renderer/tests/overlays_units_q6.rs:19`), a funkcja kończy się `}` w l. 7135 (ten sam typ błędu „ucięta klamra”, co 16395→16396). Kandydat na osobny mikrotemat komentarzowy; nie jest to zarzut wobec tej rundy.
- U3: raport Operatora nie podaje SHA commitu wprost („patrz git log”) — SHA uzupełniony tutaj: `85c87edf8`.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (uwagi U1–U3 nie wymagają zmian), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
