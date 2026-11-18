# R-RUSTPORT-P4-1-DOC-DEBTS-R2 — 03 Final Control (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (komentarze w kodzie Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R2
GOAL: poprawne cytaty numerów linii pinu `07d2fbd72` (`refreshBuildHighlight`, `applyFogVisibility`) w komentarzach `rust-port/**`.
ZMIANY/COMMIT: oceniany `7a3c12678814ec9f4d3411054a0e2d92e0c606ba` (obrona) nad `85c87edf8340afd34fa2cb969af6865f5a77b4f7` (Operator r1); BAZA `acf238f599059e71b3394ca1a164759491463889` = `origin/rust-port/parity-v2` z dispatchu (`merge-base --is-ancestor` OK, 2 commity nad bazą). Commit FC: tylko ten raport (gałąź `fc/R-RUSTPORT-P4-1-DOC-DEBTS-R2`).
TESTY: patrz §3 (wszystkie EXIT 0, odtworzone samodzielnie przez FC).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `7a3c12678` + ten raport na `rust-port/parity-v2`).
DEPLOY/PUSH: NIE WYKONANO

## 1. Numery pinu — sprawdzone przez FC (`git show 07d2fbd72:gra/src/...`)
`main.ts`: 16351 `function refreshBuildHighlight(): void {`, 16396 `}` → `16351-16396` OK; 16360 `unitRenderer.setHighlight(qual);` (16359 = `}`) → `:16360` OK; 16366 `setHighlight(new Set(...))` OK; 16387 `unitRenderer.clearHighlight();` OK; 16391 `clearMineEligibleOverlay();`, 16392-16395 `unitRenderer.setHighlight(new Set(...), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,);` → `:16392-16395` OK.
`render/cities.ts`: 740 `applyFogVisibility(...)`, 763 `  }` (klamry 740-763 zrównoważone) → `cities.ts:740-763` OK.
Opis obrony (U1) `setHighlight(qual)` `:16360` / `setHighlight(new Set(...))` `:16366` — zgodny dosłownie z pinem.

## 2. Diff i allowlista (`git diff acf238f59 7a3c12678`)
- 9 plików `.rs` z tabeli dispatchu + `01-operator-r1.md`, `02a-obrona.md`. Brak plików spoza allowlisty.
- Skrypt „tylko komentarze”: `git diff -U0 ... -- rust-port | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*(//|\*)'` = **0**; wariant ostrzejszy (tylko `//`) = **0**. Wszystkie zmienione linie to `//!`/`///`/`//`; żadna w literale stringa, asercji, nazwie testu ani wektorze.
- `git diff --check` = EXIT 0.
- `git grep -lE '16359|16391|16351-16395|657-680' -- rust-port`: 45 plików, **0 poza `*.json`/`*.txt`** (wszystkie trafienia to cyfry w liczbach zmiennoprzecinkowych danych testowych, nie cytaty pinu).

## 3. Bramki odtworzone przez FC na `7a3c12678`
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie, usuwany po każdym crate, crate'y kolejno.
| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets |
|---|---|---|---|
| view-model | EXIT 0 | EXIT 0 | EXIT 0 — 13 binarek, 109 passed / 0 failed / 0 ignored |
| engine (w tle, setsid nohup, EXIT w logu) | EXIT 0 | EXIT 0 | EXIT 0 — 530 binarek, 3982 passed / 0 failed / 1 ignored (ignore z bazy) |
| renderer (dysk 13,3 GB przed startem; brak równoległego buildu renderera) | EXIT 0 | EXIT 0 | EXIT 0 — 80 binarek, 687 passed / 0 failed / 0 ignored |

## 4. Orzeczenia zarzutów
| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| U1 | opis `setHighlight(new Set())` przy `:16360` (pin: `setHighlight(qual)`) | ODDAL (naprawione w obronie) | obrona poprawiła opis w `overlays_view.rs` i `p4_1q6_2_build_highlight.rs` (tylko `///`); zweryfikowane z pinem, bramki zielone |
| U2 | `syncPlayerUnitSelectionOnMap` cytowane `main.ts:7115-7134`, koniec funkcji 7135 (4 miejsca) | ODDAL (poza zakresem; dług do osobnego mikrotematu) | wzorzec i tabela dispatchu R2 nie obejmują `7115-7134`; jedno miejsce (`engine/tests/view_overlays_reach_path.rs:263`) poza allowlistą — częściowa poprawka dałaby niespójność. Rekomendacja: mikrotemat komentarzowy „7115-7134 → 7115-7135” (4 trafienia `git grep -n '7115-7134' -- rust-port`) |
| U3 | brak SHA w raporcie Operatora | ODDAL (uzupełnione) | SHA `85c87edf8` podany przez Evaluatora, obronę i ten raport |

Brak zarzutów NAPRAW. Brak decyzji człowieka.
