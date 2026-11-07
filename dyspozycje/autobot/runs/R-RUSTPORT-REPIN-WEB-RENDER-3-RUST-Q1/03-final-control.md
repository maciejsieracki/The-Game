STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1
GOAL: Zbliżyć renderer Rust do webu `9b019a7d8`: L1 (medium `pixel_ratio_max` 2.0) i L2 (indeksowany `merge_decor`, port `indexIdenticalVertices`); L3 tylko potwierdzenie braku kolizji.
ROLA: Final Control r1 (Opus 5.5)

## ZMIANY-COMMIT

- Baza: `rust-port/parity-v2` = `8de507700445d8920cf2bf271b7482c189e21f3a` (origin nie przesunął się; baza jest przodkiem).
- Kod: `460705906277387d599d3a38d21cbe098ee32832`; raport Operatora: `4b654add53cdf1b233b36a627cc8c81a46e1a440`; ten raport FC: commit-dziecko `4b654add5` (SHA w raporcie zwrotnym do orkiestratora).
- `git diff --name-only 8de507700..4b654add5`: 16 plików, wszystkie w allowliście (`rust-port/renderer/src/core/{map_style,merge_decor}.rs`, `tests/core_web_parity.rs`, `tests/fixtures/core/{gen.ts,mapstyle.json,mergedecor.json,README.md}`, `P5-REPIN-WEB-RENDER-3.md` +19/−0, `runs/<ID>/**`). Zero zmian w `Cargo.lock`, `gra/**`, `src-tauri/**`, `WERSJE.md`, `gra-robocza/**`. `git diff --check` czysty. Gałąź nie istnieje na origin (push nie wykonany).

## TESTY (samodzielnie, FC; CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po pracy)

- `cargo test --offline --test core_web_parity -- --nocapture`: EXIT=0, 9/9; mapRenderStyle 4895/0, mergeDecor 3028/0, indexIdenticalVertices 573/0 niezgodności.
- `cargo test --offline` (cały crate `civ-renderer`, CPU, brak `/dev/dri`): EXIT=0, 63 binarki testowe, 466 passed, 0 failed.
- `cargo fmt --check`: EXIT=0. `cargo clippy --offline --all-targets`: EXIT=0, 0 ostrzeżeń.
- Mutacja własna M6 (`if unique == n` → `if false && unique == n`, czyli indeks zawsze zwracany): EXIT=101, `index_identical_vertices_matches_web` FAIL (8 niezgodności). Przywrócone `git checkout`, worktree czysty.
- Fixtura `mapstyle.json` vs `8de507700` (własny skrypt): zmienia się tylko `presets`, 81 pozycji, wyłącznie kolumna [6] 1.5 → 2.
- Diff testów: usunięta tylko linia importu (przeformatowana z nowym symbolem) — brak osłabienia istniejących asercji.
- Kod vs `git show 9b019a7d8:gra/src/render/mergeDecor.ts:52-92`: port 1:1 (stałe hasha, `Math.imul`→`wrapping_mul`, `>>>15`, pojemność, sondowanie liniowe, porównanie bitowe 6 wartości, kolejność pierwszego wystąpienia, `unique == n` → `index = None`, próg 65535). `collect` obsługuje już wejście indeksowane, więc ponowny merge pozostaje poprawny.

## ORZECZENIE ZARZUTÓW

Evaluator: `zarzuty: []`. Obrona: brak. Notatki Evaluatora/blokady Operatora:

1. C3 `verify-repin-render3-scope.mjs` pada na 2 kotwicach L1/L2 — ODDAL (oczekiwane wg planu §4; manifest poza allowlistą — aktualizacja przy integracji przez orkiestratora).
2. Szerokość indeksu nieużyta przez upload wgpu — ODDAL (brak produkcyjnych wywołań `build_merged_mesh`; do podpięcia przy porcie uploadu).
3. Regeneracja fixtury zamiast edycji wektora w teście — ODDAL (źródło webowe bardziej autorytatywne; wynik równoważny).
4. L3 — ODDAL (brak kolizji: diff nie dotyka units/pools/LOD).
5. NIE_ZMIERZONO (regeneracja fixtur node/esbuild przez Evaluatora/FC, pamięć GPU, liczba testów na bazie) — ODDAL (brak GPU; parytet potwierdzony odczytem źródła, diffem fixtur i mutacjami).

Liczba NAPRAW: 0 → PASS.

## BLOKADY

Brak dla tematu. Przy integracji: zaktualizować manifest C3 `repin-render3-scope.json` (L1/L2 zamknięte).

## INTEGRACJA

Kolejność: fast-forward `origin/rust-port/parity-v2` (`8de507700`) → `460705906` → `4b654add5` → commit FC. Brak konfliktu (baza = aktualny tip parity-v2). Następnie aktualizacja manifestu C3 osobnym commitem orkiestratora.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` + manifest C3 → READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
