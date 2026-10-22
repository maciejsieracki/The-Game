STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-12-MOD01-CORE-Q1
GOAL: Paczka MOD-01 (`P4-4-MODEL-CATALOG.md`): fundament rendera w Rust (`hexutil`, `hexShape`, `fogDim`, `zoomLod`, `mergeDecor`, `unitVitalsPalette`, palety/wysokości/jakość z `mapRenderStyle` bez builderów, `bronzeCity` typy + `rnd`), 1:1 z webem `edb8fb56`, bez duplikowania P4.8/P4.10/P4.11.
ROLA: Operator (obrona), runda 2. Stan odtworzony z `35407b56` (Operator r1: `169c608c` kod + `35407b56` dok.), baza `69f432ba`.

ODPOWIEDZI NA ZARZUTY EVALUATORA

1. PRZYJMUJĘ. Luka pokrycia `mat[0]` w `is_already_merged_decor` (`merge_decor.rs:35`, web `mergeDecor.ts:24-26`).
   Poprawka tylko w wektorach (kod `src/core/**` bez zmian): `gen.ts` +2 sceny `singleVcArrayLast` (`[Lambert, Lambert vc]` → web `already=false`, kolaps 180 floatów pozycji, dispose `[1,1]`) i `singleVcArrayFirst` (`[Lambert vc, Lambert]` → `already=true`). Regeneracja z uruchomionego weba w prywatnym scratch (`three@0.169.0`, `esbuild@0.24.0`, `git archive edb8fb56`): build EXIT=0, node EXIT=0; 7 z 8 JSON bajtowo identycznych z r1 (`cmp`), zmienił się tylko `mergedecor.json`.
   Dowód: mutant `first()`→`last()` ZABITY (`merge_decor_matches_web` FAILED, panic `tests/core_web_parity.rs:870`); dodatkowy mutant `first().is_some_and`→`iter().any` ZABITY; oryginał 8/8 ok, `mergeDecor: 6616 values … 0 mismatches` (r1: 6 204), razem 27 372 wartości, 0 rozbieżności. Dokument §6a, §0, §5 poprawione (stwierdzenie „przeżyłe = równoważne” zawężone do zestawu r1).
   SHA-256: `mergedecor.json` 86adbc9a2ede15c86cfe6230d3c2350aeb7c24cf7e177f14301970c534272608, `gen.ts` d1b44c6098ac3499bf315dcb6d816256fe15a0edf3ba037c623bb229b7a00c24 (README fixtur + P4-12 §5).
2. PRZYJMUJĘ jako uwagę informacyjną, bez zmian. Kopie LITERAL `rnd`/`hash2D`/`decorVariant5`/`CIV_TERRAIN_VIS` są konieczne (symbole prywatne w webie), ujawnione w README fixtur; Evaluator potwierdził zgodność tekstową, `hash2D` dodatkowo pośrednio przez eksportowane `forestTreeCountForHex`, `CIV_TERRAIN_VIS` pośrednio przez `terrainSurfaceTopY`.
3. ODRZUCAM ryzyko (błąd procesowy uznany w r1). Dowód stanu: `diff -rq scratchpad/web/gra <świeży git archive edb8fb56>/gra` → 0 różnic; mtime `web/gra` = 2026-10-17 14:16 (data z archiwum pinu); luźne pliki `web/{hexutil,mapRenderStyle,camera}.ts` bajtowo = pin `edb8fb56`. Katalog zawiera dziś wyłącznie treść pinu referencyjnego, więc konsument porównujący z `edb8fb56` dostaje poprawne wejście. Nie da się wykazać, co było tam przed nadpisaniem — to pozostaje do potwierdzenia przez orkiestratora (czy jakiś temat celowo trzymał w `scratchpad/web` inną wersję). Runda 2 pracowała wyłącznie w `scratchpad/p412r2`.
4. PRZYJMUJĘ jako uwagę, bez zmian (odchylenie udokumentowane w P4-12 §3; 0 wpływu — 15 ikonaId w `gra/data`, żaden nie jest nazwą `Object.prototype`).

ZMIANY/COMMIT: allowlista — `rust-port/renderer/tests/fixtures/core/{gen.ts,mergedecor.json,README.md}`, `dyspozycje/rust-port/p4/P4-12-MOD01-CORE.md`, ten raport. SHA: patrz odpowiedź Operatora r2 (commit na `35407b56`).
TESTY (świeży `CARGO_TARGET_DIR`): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `… --features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (`core_web_parity` 8/8).
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator/Final Control na commicie r2; przy integracji jedna linia `pub mod core;` w `src/lib.rs`, zarzut 3 do potwierdzenia przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
