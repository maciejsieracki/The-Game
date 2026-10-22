STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-12-MOD01-CORE-Q1
GOAL: Paczka MOD-01 (`P4-4-MODEL-CATALOG.md`): fundament rendera w Rust (`hexutil`, `hexShape`, `fogDim`, `zoomLod`, `mergeDecor`, `unitVitalsPalette`, palety/wysokości/jakość z `mapRenderStyle` bez builderów, `bronzeCity` typy + `rnd`) 1:1 z webem `edb8fb56`, bez duplikowania P4.8/P4.10/P4.11.

ZMIANY/COMMIT: Final Control nie zmienia kodu. Oceniany czubek tematu: `087a59da` (Obrona r2) na `35407b56` → `169c608c` → baza `69f432ba`. Ten raport jest commitowany na `087a59da` (tylko ten plik).
- Allowlista: `git diff --name-only 69f432ba 087a59da` = 26 ścieżek, wszystkie w `src/core/**`, `tests/core_web_parity.rs`, `tests/fixtures/core/**`, `src/lib.rs` (1 linia), `P4-12-MOD01-CORE.md`, `runs/<ID>/**`. `git diff --check` pusty.
- Baza przesunęła się: `origin/rust-port/parity-v2` = `86311e3b` (P4.14 MOD-12 cudów + P3.19 r3, 8 commitów od `69f432ba`). Próbny `git merge --no-ff 087a59da` na `86311e3b`: BEZ KONFLIKTÓW (także `src/lib.rs`: `pub mod core;` obok `pub mod models;`).

TESTY (własne, na drzewie scalonym `86311e3b + 087a59da`, świeży `CARGO_TARGET_DIR` w scratch):
- `cargo fmt --all -- --check` FMT_EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` CLIPPY_EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` CLIPPYGPU_EXIT=0
- `cargo test --locked --all-targets` TEST_EXIT=0: lib 5/5, `core_web_parity` 8/8, `wonders_web_parity` 4/4, `terrain_web_parity` 5/5, `camera_web_parity` 5/5, `geom_three_parity` 17/17, `pick_golden` 7/7, `assets_*` 6+14, `cpu_sanity` 1.
- Wektory względem uruchomionego weba: `git archive edb8fb56 gra/src gra/data`, `three@0.169.0` + `esbuild@0.24.0`, node v22.22.0, `gen.ts` z `087a59da`. BUILD=0, NODE=0. Wszystkie 8 plików JSON bajtowo identyczne (`cmp`) z zacommitowanymi; `mergedecor.json` sha256 `86adbc9a2ede15c86cfe6230d3c2350aeb7c24cf7e177f14301970c534272608` (= deklaracja Obrony). Fixtura zawiera `singleVcArrayFirst` i `singleVcArrayLast`.
- Mutant `merge_decor.rs:35` `materials.first()` → `materials.last()`: `merge_decor_matches_web` FAILED (panic `core_web_parity.rs:870`) — ZABITY. Plik przywrócony, `git status` czysty. Web: `mergeDecor.ts:25` `Array.isArray(mat) ? mat[0] : mat` — Rust `first()` zgodny.

ORZECZENIA:
1. Brak pokrycia `mat[0]` (Evaluator) — ODDAL: naprawione w `087a59da`, potwierdzone wektorami z weba i zabiciem mutanta.
2. Kopie LITERAL `rnd`/`hash2D`/`decorVariant5`/`CIV_TERRAIN_VIS` — ODDAL: symbole prywatne w webie, ujawnione w README, `hash2D` i tabela sprawdzane pośrednio przez eksporty.
3. Nadpisanie współdzielonego `scratchpad/web` — ODDAL dla tematu (poza repo, nie wpływa na artefakt; wektory odtworzone przeze mnie niezależnie). UWAGA procesowa dla orkiestratora: potwierdzić, że żaden równoległy temat nie trzymał tam innej wersji.
4. `ikonaIdToBronzeCiv` dla nazw `Object.prototype` — ODDAL: udokumentowane, 0 wpływu na `gra/data`.
5. (własna) Po integracji P4.14 w crate są dwa minimalne typy drzewa sceny: `core::scene` (P4.12) i `models::wonders::model` (P4.14), powstałe równolegle — ODDAL dla tego tematu (nie duplikacja względem jego bazy); UWAGA dla orkiestratora: ujednolicenie jako osobny temat.

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora: `git merge --no-ff 087a59da` (lub commit z tym raportem) na `origin/rust-port/parity-v2` `86311e3b` — kolejność: po P4.14/P3.19 (już w bazie), bez konfliktów; powtórzyć bramki na wyniku.
DEPLOY/PUSH: NIE WYKONANO
