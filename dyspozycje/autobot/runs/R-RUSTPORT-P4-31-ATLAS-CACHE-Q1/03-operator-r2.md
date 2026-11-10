STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-31-ATLAS-CACHE-Q1
GOAL: RR-T8d (P4-25 §6) w `rust-port/renderer`: klucze treści, cache LRU/refcount M2 z testem N tur, mipmapy CPU T7/T9/T11, skala DPI×LOD z limitem 2048, upload wgpu za cechą `gpu`, bez duplikowania RR-T6.
ZMIANY/COMMIT: runda 2 na commicie rundy 1 `d4d15f5e` (rodzic `672c2059`); SHA rundy 2 w odpowiedzi Operatora (commit zawiera ten plik). Pliki: `src/raster/atlas/{gpu,mip,upload}.rs`, `tests/atlas_{gpu,keys,mip}.rs`, `tests/fixtures/atlas/{gen.ts,gen_gl.mjs,atlas_keys.json,atlas_gl.json,SHA256SUMS,README.md}` (3,1 MB), `P4-31-ATLAS-CACHE.md` (§4.2, §5.3, §8, §12), dowody `08-mutations.py`, `08-mutations-r2{,-pass1}.log`, `11-gates-r2.log`, `12-mutation-contains-d4d15f5e.{sh,log}`. Bez zmian: `Cargo.toml`, `Cargo.lock`, `lib.rs`, `raster/mod.rs`, `assets/**`, `core/**`, `gra/**`.
TESTY (`dowody/11-gates-r2.log`, czysty `CARGO_TARGET_DIR`, `CARGO_INCREMENTAL=0`): fmt EXIT=0; clippy CPU EXIT=0; clippy `--features gpu` EXIT=0; `cargo test --all-targets` EXIT=0 (305 passed, 0 failed); `--features gpu --test atlas_gpu --test gpu_probe` EXIT=0 (3 passed, 1 ignored, `SKIPPED: no GPU adapter`); `cargo +1.87.0 test --all-targets` EXIT=0 (305 passed); `git diff --check` EXIT=0; Cargo.toml/lock bez zmian; `forbid(unsafe_code)` jest. Mutacje 31/31 (`08-mutations-r2.log`).
ODPOWIEDZI NA ZARZUTY (szczegóły: P4-31 §12):
1. PRZYJMUJĘ — `READBACK_TEXTURE_USAGE` (= `TEXTURE_USAGE | COPY_SRC`) + `upload_with_usage`; test odczytu go używa; test bez GPU sprawdza obie maski; mutacja A30 zabita. Na prawdziwym GPU nadal NIE_ZMIERZONO.
2. PRZYJMUJĘ — doc-komentarze `mip.rs`/`upload.rs` podają liczby z testów (12550/12550; 99,66 %; 98,95 % / 99,85 %; T7 98,44 %; 48632/48960 = 99,33 %) i poprawny opis arytmetyki (filtr f32, kodowanie i zaokrąglenie f64).
3. ODRZUCAM fakt (na `d4d15f5e` mutacja `contains` jest zabijana: `lod_purge_matches_web` FAILED „freed for lod 1”, `12-mutation-contains-d4d15f5e.log`; wektor `Ateny|3|l1x`), PRZYJMUJĘ wzmocnienie: wektory z `|l1`/`|l2` wewnątrz nazwy miasta z prawdziwego `cityMapBadgeKey` + strażnik pokrycia (360 kluczy w 120 przypadkach); mutacja A28 zabita.
4. PRZYJMUJĘ — przypadek T7 512×168 sRGB w `atlas_gl.json` (dopisany po `up`; 56 starych przypadków i `up` bez zmian); test `t7_size_chain_matches_webgl`: 28200/28647 krok, 28048/28647 łańcuch, maks. |Δ| 1.
5. PRZYJMUJĘ — asercje `a = 0` → (0,0,0,0) także dla nie-premultiplikowanego wejścia; mutacja A29 zabita.
BLOKADY: brak. Uwagi: (a) przebieg mutacji 1: A31 (kodowanie RGB sRGB half-even) przeżył jako mutant równoważny — zastąpiony alfą sRGB (zabita), log zachowany; (b) przebieg mutacji 2 i pierwsza próba bramek padły na współdzielonym dysku / współdzielonym target (`No space left on device`; stara binarka z drzewa `d4d15f5e`) — powtórzone w wyczyszczonym targecie, logi w repo są z powtórzeń; (c) filtr/upload na D3D11 właściciela nadal NIE_ZMIERZONO.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-P4-31-ATLAS-CACHE-Q1, runda 2.
DEPLOY/PUSH: NIE WYKONANO
