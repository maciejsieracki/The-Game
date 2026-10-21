STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-10-PICKING-CPU-Q1
GOAL: RR-T3. Picking na CPU w Rust (`rust-port/renderer/src/pick/**`) 1:1 z webem (`edb8fb56`), dziwactwa P4-3 §3.5–3.8 (D-RR-3).
ROLA: Operator — obrona wobec zarzutów Evaluatora r1 (PASS-WITH-NOTES).

ZMIANY/COMMIT: baza = commit Operatora `eee3d624` (na `83fb9309` ← `0a496f67`), worktree `wf_7fb21ca5-e1d-3`, jawne `git add`, bez push.
Pliki (wyłącznie z allowlisty): `rust-port/renderer/tests/fixtures/pick/gen.ts` (tylko komentarze),
`rust-port/renderer/tests/fixtures/pick/README.md`, `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md` (§0, §5.1, §7 SHA + wklejony skrypt, nowe §7.1),
ten raport. Kod Rust (`src/pick/**`, `tests/pick_golden.rs`) i JSON-y fixtures bez zmian.

ODPOWIEDZI NA ZARZUTY
1. „LITERAL” to nie kopie znak po znaku — PRZYJMUJĘ. Nagłówek `gen.ts` definiuje teraz „LITERAL” jako tę samą logikę i arytmetykę
   w tej samej kolejności; README §Adaptations i P4-10 §7.1 wypisują wszystkie adaptacje (typy → `any`, usunięte komentarze,
   `TERRAIN_VISUALS[t]`/`CIV_TERRAIN_TOP` → `{0,0}` martwe dla roblox `mapRenderStyle.ts:231`, `styledTerrain=true`, tylko gałąź roblox
   ternarów `renderStyle`, `B_NO_BOTTOM=true`, usunięte materiały/`castShadow`/`scene.add`/`performance`/`*OrigMatrix`, `this.tokens` → `tokens`).
   Sformułowanie „dosłowne kopie” w P4-10 §0 i §5.1 poprawione.
2. Blok mgły pod etykietą LITERAL — PRZYJMUJĘ. Blok w `gen.ts` oznaczony `// MODEL (NIE LITERAL)` z dokładnymi źródłami sprawdzonymi
   w `git show edb8fb56:gra/src/render/scene.ts`: pryzm `setFog` 3591-3592 (`sig === 2`), bryły `applyTerrainFog` 3281-3302
   (`bri <= 0 || decorHiddenHexKeys`) oraz `hideInstancedOnHex` 3145-3158 wołane z `hideDecorAtHex` 3168-3184, LOD 3370-3375;
   ocean-hide 3629-3637 jawnie niemodelowany (§5.1 `NIE_ZMIERZONO`). Etykieta `LITERAL scene.ts:3684, 3691` dotyczy teraz tylko dwóch
   instrukcji, które rzeczywiście są w tych liniach (`terrainPickMeshes`, `refreshInstancedPickBounds`).
3. `main.ts:1885-1901` przesunięte o 1 — ODRZUCAM. Dowód: `git show edb8fb56:gra/src/main.ts | grep -n 'function pickHexAt\|function pickMapTarget\|function cameraControllerOpts'`
   → `1885: function pickHexAt`, `1894: function pickMapTarget`, `1903: function cameraControllerOpts`; `awk 'NR>=1884&&NR<=1901'` → 1884 pusta,
   1900 `return pickHexAt(clientX, clientY);`, 1901 `}`. Zakres 1885-1901 obejmuje dokładnie obie funkcje. Bez zmian.
4. Geometria gór/wzgórz z fixture — PRZYJMUJĘ jako uwagę, bez zmiany: już ujawnione (README `geometry.json`, P4-10 „geometria wejściowa”);
   generowanie `goraGeometria` w Rust należy do RR-T4/RR-T6 (allowlista tego tematu nie obejmuje `geom`/`assets`).
5. Commit dokumentacji na bazie kodu — PRZYJMUJĘ jako uwagę dla orkiestratora, bez zmiany: dispatch kazał pracować na `parity-v2`
   z allowlistą obejmującą dokument; przeniesienie `dyspozycje/**` na gałąź dokumentacyjną to krok integracji (cherry-pick ścieżek
   `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md` i `dyspozycje/autobot/runs/R-RUSTPORT-P4-10-PICKING-CPU-Q1/**`).

TESTY
- Diff `gen.ts` wyłącznie komentarzowy: `git diff -U0 -- .../gen.ts | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -vE '^[+-][[:space:]]*//'`
  → brak linii, `EXIT=1`.
- Regeneracja po poprawce (świeży scratch, `npm install --ignore-scripts three@0.169.0 esbuild@0.24.0`, `git archive edb8fb56 gra/src gra/data`,
  node v22.22.0): esbuild `EXIT=0`, node `EXIT=0`, stdout `scenarios=55 points=20174 w2a=1233 round=23 ndc=6`; SHA-256:
```
a99269a102e960878b8792cf86d9e4167fd6ad9bac77e735c72fd4c39c476ce4  geometry.json
cefe210fa76730defec94cafe23ae1645b4e4bef96bd6bd9948d540d294247ca  golden_pick.json
5f1815ee9366e95deef77bba5cab5f33c8d3efd9b5483874b021b46ae07435e8  math.json
e0c1031452dfee80fdeebfb6c7f6f31d623885dcf35bb661f9fa5b68c346f714  scenes.json
```
  identyczne z fixtures w repo i z P4-10 §7. Nowe SHA: `README.md` `171872afdb32e2be32d3216cf1e9f7231379f04727bd2fffb25f95d351e97a21`,
  `gen.ts` `d681dd606827ba89f2a2a8b0c12ae69de1de5f4841b449edfd54570d594d47c2` (wpisane w §7; wklejony skrypt w §7 = `diff` pusty z `gen.ts`).
- `git diff --check` → `EXIT=0`.
- Bramki (`CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_7fb21ca5-e1d-3 CARGO_PROFILE_DEV_DEBUG=0`, `rust-port/renderer`), pełne wyjścia:

`cargo fmt --check; echo "EXIT=$?"`
```
EXIT=0
```
`cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"`
```
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-3/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 0.53s
EXIT=0
```
`cargo test --locked --all-targets; echo "EXIT=$?"`
```
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-3/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 0.77s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-3/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-3/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-3/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-3/debug/deps/pick_golden-b6b94fb9d9c318d1)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.83s

EXIT=0
```
- Target usunięty po zakończeniu.

BLOKADY: brak.
RUNDY: 1/5 (obrona w ramach rundy 1).
NASTĘPNY KROK: Final Control (Opus 5.5 medium); przy integracji uwaga z zarzutu 5.
DEPLOY/PUSH: NIE WYKONANO
