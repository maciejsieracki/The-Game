STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-28-RASTER-SHAPES-Q1
GOAL: RR-T8a — rasteryzator kształtów `raster::Canvas2dLite` na tiny-skia 0.12 (D-TXT-6 = A), WYŁĄCZNIE członkowie `ctx.*` użyci w webie (28 kształtowych z P4-25 §4.1).

ZMIANY/COMMIT: oceniany commit Obrony `0da0e729` (rodzic: Operator r1 `5baad8ae`, baza `9ec9c9d8`). Ten raport + logi FC w `dowody/fc-r2/` (commit FC na `0da0e729`, bez push).
- Allowlista: `git diff --name-only 9ec9c9d8 0da0e729` — wszystkie 87 ścieżek w allowliście (raster/**, tests/raster_*, fixtures/raster/**, Cargo.toml/lock, 1 linia lib.rs, P4-28, run). `git diff --check 9ec9c9d8 0da0e729` czysty. Fikstury 5,3 MB.
- Merge z bieżącym `origin/rust-port/parity-v2` (`98e11c25`): `git merge-tree --write-tree` → drzewo `6f84e8af` bez konfliktów; `98e11c25` nie zmienia nic w `rust-port/renderer` względem `9ec9c9d8` → bramy crate'a poniżej obowiązują 1:1 po integracji.

ORZECZENIA (zarzuty Evaluatora r1):
1. Logi poza commitem — ODDAL (naprawione): `dowody/r1/*.log` (9) + `r2-{06,08,09}` w commicie `0da0e729`.
2. `set_stroke_style_gradient` poza zakresem — ODDAL (naprawione): metoda usunięta, dopisana do `FORBIDDEN`; gałąź `strokeGrad` usunięta z `gen.mjs`/`raster_scenes.rs`; `scenes.tsv` 0× `strokeGrad`. Weryfikacja własna: `git grep -nE "strokeStyle\s*=" edb8fb56 -- gra/src` — wszystkie przypisania to stałe/łańcuchy CSS (`cityMapStatChip.ts:81-82,197`, `unitStatPlate.ts:306`, `unitOwnerEmblem.ts:176`); gradienty (`cityMapStatChip.ts:479,856`) trafiają wyłącznie do `fillStyle` (`:495,500,859`).
3. Komentarz `draw_image` — ODDAL (naprawione): `canvas.rs:559-561` mówi o krawędziach bez AA, zgodnie z `anti_alias: false` (`:590`).
4. 29 vs 32 testów — ODDAL (naprawione): log FC `raster_unit` = `32 passed`.
5. Metryka tylko na identycznych obrazach — ODDAL (naprawione): 4 nowe testy w `metric.rs`; mutacje FC poniżej potwierdzają, że łapią błędy niewidoczne wcześniej.
- U1/U2 — nie blokują (U2 poza bramami dispatchu).

TESTY (własne, czysty `CARGO_TARGET_DIR` w scratchpadzie, rustc 1.97.0; ZAŁOŻENIE: `CARGO_PROFILE_{DEV,TEST}_DEBUG=0` i `CARGO_INCREMENTAL=0` z powodu pełnego dysku — pierwszy przebieg z debuginfo padł na `No space left on device (os error 28)`, INFRA, nie wada kodu):
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` EXIT=0 (`dowody/fc-r2/fc-clippy.log`)
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0 (`fc-clippy-gpu.log`)
- `cargo test --locked --all-targets` EXIT=0, 211 passed / 0 failed, 29 zestawów; raster: api_closed 3, color 5, scenes 4 (golden + Chromium), unit 32 (`fc-test.log`).
- Wektory weba: `node gen.mjs` (Chromium 141.0.7390.37) w kopii fikstur → `diff -r` z commitem EXIT=0 (wszystkie `ref/*.rgba`, `scenes.tsv`, `colors.tsv`, `MANIFEST.sha256` bit w bit); `sha256sum -c` EXIT=0 (`fc-chrom.log`).
- Mutacje FC (3/3 zabite, przywrócone `git checkout`):
  - FC1 `metric.rs` C1 0,01→0,02 → `known_constant_offset_ssim` FAILED;
  - FC2 `metric.rs` `2·cov`→`2·|cov|` → `inverted_structure_has_negative_ssim` FAILED;
  - FC3 `canvas.rs:644` paint `anti_alias: true→false` → `scenes_match_chromium` FAILED (sama metryka vs Chromium, bez golden).

BLOKADY: brak. Uwaga INFRA: dysk `/` ~99% zajęty przez katalogi target innych agentów w scratchpadzie — do sprzątnięcia przez orkiestratora.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora do `rust-port/parity-v2` w kolejności: `5baad8ae` → `24139373` (Evaluator r1, tylko `02-evaluator-r1.md`) → `0da0e729` (Obrona) → commit FC (ten raport); konflikt możliwy tylko w linii `pub mod` w `src/lib.rs` (dziś brak). Potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
