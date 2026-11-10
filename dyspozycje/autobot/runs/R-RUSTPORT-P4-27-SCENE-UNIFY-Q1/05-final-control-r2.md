STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-27-SCENE-UNIFY-Q1
GOAL: Jeden typ drzewa sceny `renderer/src/scene/`, migracja 9 modułów bez zmiany parytetu (fixtury bitowo), likwidacja `Prim::Kamien/Braz/Zelazo`, `drawables`, wrapperów `MiscModel`/`ImprovementModel`, widok eksportu GPU (CPU).

ZMIANY/COMMIT:
- Obrona `56af8de4` istnieje (na `c6c47970`, baza `9ec9c9d8`).
- `origin/rust-port/parity-v2` przesunął się do `e239fd81` (m.in. P4.28 `raster`, P6.2/6.3). Jedyny plik wspólny: `rust-port/renderer/src/lib.rs` (konflikt jednej linii `pub mod raster;` / `pub mod scene;`, rozwiązany: obie linie).
- Kandydat integracyjny (cherry-pick 5 commitów na `e239fd81`, kolejność zachowana):
  `d5810fe3` (etap 1) → `191830d3` (etap 2) → `563b0c7e` (etap 3) → `08942fa0` (etap 4) → `b36e3532` (obrona r2) → commit tego raportu.
- FC nie zmieniał kodu.

TESTY (Final Control, na drzewie zintegrowanym `b36e3532`, czysty `CARGO_TARGET_DIR`, `CARGO_INCREMENTAL=0`):
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings`: EXIT=0
- `cargo test --locked --all-targets`: EXIT=0, 29 celów, 222 passed, 0 failed, 0 linii `FAILED`/`mismatch` (wzrost względem 165 = testy `raster` z P4.28).
- `git diff --stat e239fd81 HEAD -- tests/fixtures gra src-tauri rust-port/engine src/{geom,pick,assets,camera.rs,terrain,jsmath,raster} Cargo.toml Cargo.lock`: puste.
- `git diff --check e239fd81 HEAD`: puste.
- Mutacje własne FC (eksport/world_meshes, `cargo test --lib --test misc_web_parity`): 7/7 wykryte —
  F1 `world_meshes` `world[ROOT]`, F2 sprite `world[ROOT]`, F3 sprite bez maski `visible`, F4 `indexed: true`, F5 `group.start: 0`, F6 `base_color` białe, F7 sprite `render_order: 0`.
- Próbka wektorów weba: testy parytetu (10 plików `*_web_parity.rs`, fixtury z pinu `edb8fb56`, porównanie `to_bits`) zielone przy niezmienionych fixturach; `cmp_export` porównuje eksport z wartościami MOD-13 weba. ZAŁOŻENIE: nowych wektorów nie generowano (fixtury są referencją, zgodnie z Z13).

ORZECZENIA (zarzuty Evaluatora r1):
1. Test eksportu cyrkularny — ODDAL (naprawione w `56af8de4`: macierze literalne + `cmp_export` vs web; E1–E6 = M23–M28 wykryte; FC 7/7).
2. Sprite'y poza eksportem — ODDAL (`GpuExport.sprites`, F2/F3/F7 wykryte).
3. Multi-material — ODDAL (`material_array`, `groups`, Z17; F5 wykryte).
4. `OverlayGroup` — ODDAL: poza trzema reprezentacjami wymienionymi w GOAL dispatchu; odchylenie jawne Z15 z uzasadnieniem. Propozycja osobnego tematu (overlay → Scene/instancing) dla orkiestratora — nie blokuje.
5. `visible` — ODDAL (`Node::visible`, pola boczne usunięte, Z16; F3 wykryte).
6. Tautologia decor — ODDAL (`obj.nodes.len() == flat.len()`, opisane w §3).
7. Podwójny bbox — ODDAL (jedna pętla `bounding_box_of`).
8. Edytowany surowy log — ODDAL (logi surowe, 3 linie z końcowymi spacjami, `logi/.gitattributes` `* -whitespace`).
Agregat: 8 × ODDAL → PASS.

BLOKADY: brak. Uwagi: ocena wizualna 1:1 NIE_ZMIERZONO (brak GPU; lista §7 dokumentu). Z15 — follow-up do decyzji orkiestratora.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` w kolejności jak wyżej (lub fast-forward do commitu tego raportu, jeśli `parity-v2` nadal `e239fd81`), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
