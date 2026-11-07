STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1
GOAL: Zbliżyć renderer Rust do webu `9b019a7d8` w lukach L1 (medium `pixel_ratio_max` 2,0) i L2 (indeksowany `merge_decor`, `indexIdenticalVertices`); L3 tylko potwierdzić brak kolizji.

ZMIANY-COMMIT: `460705906277387d599d3a38d21cbe098ee32832` (gałąź `wf/R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1`, baza `rust-port/parity-v2` = `8de507700`), raport w commicie następnym.
- `rust-port/renderer/src/core/map_style.rs`: medium `pixel_ratio_max: 2.0`.
- `rust-port/renderer/src/core/merge_decor.rs`: `IndexedVertices`, `IndexWidth`, `index_width`, `index_identical_vertices` (klucz 6×`f32::to_bits`, hash `Math.imul`→`wrapping_mul`, sondowanie liniowe, pojemność 2^k ≥ max(16, 2n), kolejność pierwszego wystąpienia, `None` gdy brak powtórzeń/pusto/niezgodne długości); `build_merged_mesh` ustawia `indices`.
- `tests/core_web_parity.rs`: `merge_decor_matches_web` + porównanie `index`/`indexType` + pomiar zmniejszenia; nowy `index_identical_vertices_matches_web`.
- `tests/fixtures/core/{gen.ts,mapstyle.json,mergedecor.json,README.md}`: regeneracja z URUCHOMIONEGO webu `9b019a7d8` (three@0.169.0 = pin `gra/package-lock.json`, esbuild 0.24.0, node 22.22.0, poza repo). Kontrola potoku: niezmieniony `gen.ts` na `edb8fb56` odtwarza wszystkie 8 plików bajt w bajt; na `9b019a7d8` zmieniają się tylko `mapstyle.json` i `mergedecor.json` (6 pozostałych bez zmian, hash w README).
- `dyspozycje/rust-port/p5/P5-REPIN-WEB-RENDER-3.md` §5 (wyniki).
- Cargo.lock bez zmian. Zero zmian w `gra/**`, `src-tauri/**`, `WERSJE.md`, `gra-robocza/**`.

TESTY (logi `gate-*.txt`, każdy z `EXIT=`):
- `cargo test` (cały crate `civ-renderer`, CPU/headless, bez `/dev/dri`): 63 binaria, 466 passed, 0 failed, EXIT=0 (`gate-test-full.txt`). `core_web_parity`: 9/9; mapRenderStyle 4895 wartości, mergeDecor 3028, indexIdenticalVertices 573 — 0 niezgodności.
- `cargo fmt --check` EXIT=0; `cargo clippy --all-targets` 0 ostrzeżeń, EXIT=0.
- Mutacje (`gate-mutations.txt`, wszystkie zabite, pliki przywrócone `cmp`=identical): M1 medium 2,0→1,5 → `map_style_matches_web` FAIL; M2 bez indeksowania → `merge_decor_matches_web` 2403 niezgodności; M3 równość wartości zamiast bitów → `ivx.negZero` FAIL; M4 próg Uint16 65535→65536 → `big[65536+1].indexType` FAIL.
- Niezależny weryfikator `verify_l2_geometry.py` (Python, bez kodu Rust/web): rozwinięcie `position/color[index]` == stara zupa `edb8fb56` bit w bit dla 6 scen, wierzchołki unikalne parami różne, kolejność pierwszego wystąpienia, typ indeksu — OK, EXIT=0; self-test (zamiana wejść) FAIL zgodnie z oczekiwaniem.
- Pomiar bufora wierzchołków: house 312→66 (4,73×), forest 459→316 (1,45×), shared 120→34 (3,53×), meshRoot 66→16 (4,12×), singleVcArrayLast 60→12 (5,0×), single 36→8 (4,5×); bajty np. house 7488→1584 + indeks 624 B.
- NIE_ZMIERZONO: liczba testów pełnej suity na bazie przed zmianą (regresja = 0 FAIL po zmianie); pamięć GPU w realnym runtime (brak GPU).

BLOKADY / NOTES:
1. Weryfikator zakresu C3 `src-tauri/frontend-v2/tools/verify-repin-render3-scope.mjs` daje teraz OCZEKIWANY FAIL (2 kotwice: L1 `pixel_ratio_max: 1.5`, L2 „ONE non-indexed mesh”) — plan §4 to przewidział. Manifest `repin-render3-scope.json` jest poza allowlistą tego tematu → nie zmieniony; decyzja/temat orkiestratora (`gate-verifier-c3.txt`).
2. Rust trzyma indeksy jako `Vec<u32>`; wybór szerokości web (Uint16/Uint32) wystawiony jako `index_width` — upload wgpu tego nie używa dziś (w `src` brak `IndexFormat`), podłączenie przy porcie uploadu.
3. L3: nietknięta. L1/L2 nie dotykają `units::*`, `models/cities/**`, pul ani LOD; LOD drobnych części działa na meshach części, niezależnie od indeksu scalonego dekoru → brak kolizji z planem L3. `releaseMergedDecorCpuArraysAfterUpload`: NIE-DOTYCZY, potwierdzone (crate nie trzyma drugiej kopii CPU per upload).
4. Założenie: hash ported 1:1, choć wynik od niego nie zależy (zachowany profil kosztu).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) → Final Control; orkiestrator: aktualizacja manifestu C3 osobnym tematem/rozszerzeniem allowlisty.
DEPLOY-PUSH: NIE WYKONANO
