STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-B4-Q1
ROLA: Operator (Opus 5.5), worktree, gałąź lokalna `rp/repin3d-b4-q1` od `origin/rust-port/parity-v2` @ `0eefb3a00`
GOAL: REPIN-3D B4 — `cities.ts` (+70/−4) → `models/cities/**`, potwierdzenie `bronze/stoneCityRoblox.ts`, reszta B3, porządki README fixtur pinu. Web `origin/main` @ `86d510c66`.

ZMIANY/COMMIT: `8f5aa88d7c299dc0706ca62f486557d67d16054d` (22 pliki, jawny `git add`). Szczegóły: `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §11.
- Dryf (§11.1): hunki `cities.ts:238-250`, `:252-278` (`registerOwnedMeshResources`) = SC `userData` → **PORTOWANE**; `:512-515/:540-541/:568-569` (dispose po zamianie), `:593/:595-619` (`pruneUnusedStatChipTextures` — już w `raster::atlas::cache::TextureCache::prune_unused`), `:621-624` (`getMemDebugCounts`), `bronzeCityRoblox.ts:8,84` / `stoneCityRoblox.ts:10,126` (`markSharedTransientGeometry`) = K / NIE-DOTYCZY.
- Kod: `models/cities/renderer.rs` NOWE `register_owned_mesh_resources` (wołane w `build_settlement_model_for_style`, obie gałęzie), re-eksport w `mod.rs`. Z-RP-B4-1: `perCityGeos` jako `Len` (= liczba meshy; zmierzone 3330/3330: każda siatka ma własną geometrię).
- Pkt 2: `tests/fixtures/cities/{models,renderer}.json` z NIEZMIENIONEGO `gen.ts` na `86d510c66` = bajt w bajt pin (2 katalogi) → bronze/stone „bez zmiany obrazu” POTWIERDZONE.
- Pkt 3: reszta B3 = K (wartość 0,35 bez zmian, cache bez zmiany obrazu, brak UnitRenderera w Rust).
- Pkt 4: README `overlay` (MANIFEST `f579a315…`), `atlas` (`e45004b9…`), `misc` (`dc62fa14…`, `f9e8588e…`), `improvements` (5 SHA odtworzone), `cities` (2 SHA). Z-RP-B4-2: `misc/relief_real.json` był nieaktualny — zregenerowany własnym niezmienionym generatorem; diff = 69 liści, wyłącznie tint kopalni 0,30→0,36 (B1).
- Nowe: `tests/repin3d_b4.rs`, `tests/repin3d_fixtures/{gen_b4.ts,b4.json,mutate_b4.py}`, README_B/MANIFEST_B.

TESTY (surowe logi `dowody/`, rustc 1.97.0, CARGO_INCREMENTAL=0, DEBUG=0):
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` EXIT=0
- `cargo test --locked --no-fail-fast` passed=459 failed=0 binaries=61 EXIT=0 (baza 456)
- `cargo +1.87.0 test --locked --test repin3d_b4 --test cities_web_parity --test misc_web_parity` 3+5+11 EXIT=0
- mutacje `mutate_b4.py` 5/5 + 10/10 = **15/15** zabitych
- weryfikator 2× `mktemp -d` (osobne npm, osobne archiwum): `b4.json` `f146e755…`, cities, `relief_real.json` — SHA = repo
- `sha256sum -c MANIFEST_B.sha256` 32 OK; overlay `MANIFEST.sha256` 71 OK; atlas `SHA256SUMS` 5 OK
- `git diff --cached --check` czysty; `target/` i oba katalogi tymczasowe usunięte jawnie

BLOKADY: brak. Uwagi: (1) ocena wizualna GPU NIE_ZMIERZONO (brak `/dev/dri`; zmiana obrazu B4 = 0, zmierzone); (2) `atlas/gen.sh` ma wpisany pin `edb8fb56` — nie edytowany (SHA w `SHA256SUMS`), README opisuje podstawienie rewizji; (3) `relief_real.json` = fixtura pinu poza listą testów B4 (Z-RP-B4-2, jak Z-RP-B-1); (4) `perCityGeos` nie odwzorowuje tożsamości geometrii — gdyby web zaczął współdzielić geometrię w obrębie modelu, `repin3d_b4` to wykryje.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-3D-B4-Q1 (commit `8f5aa88d7`, baza `0eefb3a00`).
DEPLOY/PUSH: NIE WYKONANO
