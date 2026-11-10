# P4.24 — MOD-13: podpięcie prawdziwego samplera reliefu, jedna implementacja `toFixed`

STATUS: PASS (Operator, runda 1/5)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1
GOAL: Domknięcie uwag z P4.22 (MOD-13): (1) prawdziwy `reliefSurfaceSampler` (P4.17, `decor::style::ReliefSampler`) jako domyślny `ReliefSource` w `models::misc`, wektory z uruchomionego weba BEZ shimu na mapach z `Wzgorza`/`Gory`, porównanie bitowe; (2) jedna implementacja `toFixed(digits)` w `core::jsnum`, test ≥ 20 000 wartości vs V8; (3) aktualny komentarz modułu `models.rs`.
BAZA: `origin/rust-port/parity-v2` @ `f1a1740c` (worktree odłączony).

## 1. Sampler reliefu (uwaga R1 z P4.22)

Web (`git archive edb8fb56`):
- `render/rangeOverlay.ts:403` — drapowanie woła `reliefSurfaceSampler(teren, q, r, map.seed ?? 0, HEX_R)`;
- `render/mapRenderStyle.ts:1107-1121` — `reliefSurfaceSampler` → `wariantDlaHeksa` / `rotacjaDlaHeksa` + `powierzchniaReliefuY(typ, wariant, rotY, x/R, z/R) * R`, `null` poza `Gory`/`Wzgorza`;
- `render/teren-gory-wzgorza.ts:101-105` — `hashHeksa` czyta ziarno jako `seed | 0` (ToInt32).

Rust (`src/models/misc/range.rs`):
- nowy `GameRelief: ReliefSource` (domyślny) = `crate::decor::style::ReliefSampler::new(teren, q, r, seed, R)` z P4.17; ziarno `f64` → `js_to_uint32` → `i32` (bitowo = `seed | 0`);
- nowa `build_range_overlay_group_game(map, keys, style)` = `build_range_overlay_group(…, &GameRelief)` — wywołanie tak jak w grze;
- `FlatRelief`, `ReliefSource`, `ReliefFn`, `build_range_overlay_group` — bez zmian (ścieżki publiczne zachowane); eksport `GameRelief` i `build_range_overlay_group_game` w `models::misc`.

Wektory: `tests/fixtures/misc/gen_relief.ts` bundlowany przez `build_relief.mjs` **bez pluginu** (skrypt kończy się błędem, gdy bundel zawiera `relief_shim`/`__MISC_RELIEF` albo nie zawiera `function reliefSurfaceSampler(` / `function powierzchniaReliefuY(`). Wynik `relief_real.json` (4,7 MB):
- 4 mapy z `Wzgorza`/`Gory`: `mixed` (seed 12345, układ jak `overlays.json`), `noseed` (`?? 0`), `hillsNeg` (seed −987654), `hillsWrap` (seed 6442450944.75 → `|0` = −2³¹);
- 432 przypadki `buildRangeOverlayGroup` (18 zbiorów × 6 stylów × 4 mapy): płachta kopalni (`MINE_ELIGIBLE_STYLE`) i `bandedHug` drapowane na 1136 heksach reliefu, style płaskie (kultura, religia, pas, bez `yOffset`) przecinające te same wzgórza;
- 904 sondy samplera (R ∈ {1, 1.5}, w tym `null` dla terenu płaskiego), 16 560 wartości `(x, z) → y` jako bity binary64.

Testy (`tests/misc_web_parity.rs`): `range_overlay_real_relief_matches_web` — 80 704 skalary bitowo + 16 506 kontroli, 0 różnic; dodatkowo asercja, że ≥ 100 przypadków hug różni się od `FlatRelief` (relief naprawdę działa) i że udrapowano dokładnie 1136 heksów reliefu. `relief_sampler_matches_web` — 16 560 skalarów bitowo, 0 różnic. Dotychczasowy `range_overlay_matches_web` w trybie `real` (mapa `flat`) używa teraz `GameRelief` i dodatkowo porównuje `FlatRelief` z tym samym wektorem.

## 2. Jedna implementacja `toFixed` (uwaga R5 z P4.22)

- `core::jsnum::js_to_fixed(x, digits)` — nowa, jedyna implementacja: wszystkie `f64` i `digits` 0..=100; `NaN`/`±∞`/`|x| ≥ 1e21` → `Number::toString` (`"Infinity"`, `"-1e+21"`); znak oddzielany przed zaokrągleniem (`-0` → bez znaku, mały ujemny → `"-0.000"`); remis dokładny (`|x|·2^(d+1)` nieparzyste) → wydruk dokładny z `d+1` cyframi i zaokrąglenie dziesiętne w górę na łańcuchu (brak przepełnienia `u64` dla dużych wartości, które miała stara wersja w `overlay.rs`); `digits > 100` → panika (JS: `RangeError`). `2^(d+1)` budowane z bitów wykładnika (test `jsmath_wiring` zabrania `powi`).
- `core::jsnum::js_to_fixed3` — sygnatura bez zmian, ciało = `js_to_fixed(x, 3)`.
- `models::misc::overlay::js_to_fixed` — `pub use crate::core::jsnum::js_to_fixed` (ścieżka P4.22 zachowana); `range.rs` i `territory.rs` bez zmian w wywołaniach.
- Test `tests/jsnum_to_fixed_v8.rs` na `tests/fixtures/jsnum/to_fixed.txt` (node v22.22.0, V8 12.4.254.21-node.33, `gen_to_fixed.mjs`): **27 808 przypadków, 0 różnic** (12 503 ujemnych, 2 536 z |x| ≥ 1e21, 303 NaN/±∞, 4 810 dokładnych remisów, 7 804 z digits > 20; subnormalne, `MAX_VALUE`, losowe wzorce bitowe). Drugi test sprawdza, że `js_to_fixed3` i ścieżka `overlay::js_to_fixed` dają te same łańcuchy co V8.

## 3. `models.rs`

Komentarz modułu: usunięte nieaktualne „Empty until the first batch lands”; wymienione wylądowane paczki (`unit_core`, `units_kamien`, `wonders`, `improvements`, `misc`). Tylko komentarz.

## 4. Fixtury MOD-13 — bez zmian

`models.json` `cf17ac9d…`, `siege.json` `06383e4d…`, `overlays.json` `d590e026…` — nietknięte; dodatkowo zregenerowane w scratchu z `git archive edb8fb56` (`build.mjs` + `gen.mjs`) dały identyczne SHA-256. `relief_real.json`: dwa uruchomienia → `f3cfbdcd889dba81b9372823832890cbb78da43acf30ce78dadefdd1c6b9fec8`; `to_fixed.txt`: dwa uruchomienia → `fd883070813b237c223ee5cb6e1aaafa9242e004e447665cf485a18d61748d45`.

## 5. Mutacje

`dyspozycje/autobot/runs/R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1/mut.py` (log `mut.log`): **16/16 wykryte** — konwersja ziarna (`as i32` zamiast ToInt32), promień 1.0, przesunięte `r`, zamienione `x`/`z`, `FlatRelief` w ścieżce gry, `HUG_RELIEF_SURFACE_LIFT`, gałąź remisu, przeniesienie `9`, wiodąca `1`, granica `1e21`, brak `e+`, `"nan"`, `x <= 0`, `2^(d+2)`, brak usunięcia kropki przy `digits = 0`, limit 101.

## 6. ZAŁOŻENIA

- Z1: „implementacja domyślna” = nowy typ `GameRelief` + funkcja `build_range_overlay_group_game`; sygnatura `build_range_overlay_group(…, relief)` pozostaje bez zmian (zachowanie ścieżek publicznych), `FlatRelief` zostaje.
- Z2: wektory `relief_real.json` dodane jako NOWY plik (nie rozszerzono `overlays.json`), by fixtury P4.22 pozostały bitowo nietknięte.
- Z3: zakres `digits` 0..=100 jak w ECMAScript; powyżej — panika zamiast `RangeError` (żaden wywołujący nie podaje > 5).
- Z4: test V8 jako plik tekstowy (jedna linia na przypadek) zamiast JSON — `toFixed` nie produkuje spacji, parser trywialny.

## 7. Bramki (czysty `CARGO_TARGET_DIR` w scratchu, usunięty po pracy)

Logi surowe w `dyspozycje/autobot/runs/R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1/gate-*.log`:
`cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `… --features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (137 testów, 0 niepowodzeń). Bez nowych zależności, bez `unsafe`, `Cargo.toml`/`Cargo.lock` bez zmian. Pierwsze uruchomienie `cargo test` wykryło `powi` (test `jsmath_wiring::no_platform_transcendentals_anywhere_in_src`) — poprawione na budowanie z bitów wykładnika, wszystkie bramki powtórzone od zera.

## 8. Zmienione pliki

`rust-port/renderer/src/core/jsnum.rs`, `src/models.rs` (komentarz), `src/models/misc/{mod,overlay,range}.rs`, `tests/misc_web_parity.rs`, `tests/jsnum_to_fixed_v8.rs` (nowy), `tests/fixtures/misc/{README.md,gen_relief.ts,build_relief.mjs,relief_real.json}` (nowe poza README), `tests/fixtures/jsnum/{README.md,gen_to_fixed.mjs,to_fixed.txt}` (nowe), ten dokument, `dyspozycje/autobot/runs/R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1/**`. Bez zmian: `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain,decor,jsmath}/**`, `Cargo.toml`, `Cargo.lock`. Web uruchamiany wyłącznie w unikalnym scratchu (`mktemp -d`) poza repo, usuniętym po pracy.
