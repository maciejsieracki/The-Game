# P4.16 — wspólny moduł `jsmath` (V8 `Math.*` bitowo) — R-RUSTPORT-P4-16-JSMATH-Q1

STATUS dokumentu: raport Operatora, runda 1/5. DOMAIN: GAME.
Baza: `origin/rust-port/parity-v2` @ `8761c6c3` (zawiera P4.14). Toolchain: rustc/cargo 1.97.0, node v22.22.0
(`node -p process.versions.v8` → `12.4.254.21-node.33`).

## 1. Wynik w skrócie

- Nowy moduł `rust-port/renderer/src/jsmath/` — jedna implementacja `Math.sin/cos/tan/atan/atan2/acos/exp/log/pow/hypot`
  bitowo zgodna z V8 12.4 (port fdlibm 5.3 z `src/base/ieee754.cc` + builtin Torque `Math.hypot`), w bezpiecznym Ruscie,
  bez zależności, bez `unsafe`, bez fallbacku do `libm` (`jsmath::PLATFORM_FALLBACK = false`; przeniesiona także
  ścieżka dużych argumentów `__kernel_rem_pio2`, której P4.14 nie miało).
- Przeniesiono kod z `models/wonders/js_trig.rs` (P4.14) i `terrain/jsmath.rs` (P4.11) oraz `js_hypot` z `terrain/coast.rs`;
  stare ścieżki zostały jako re-eksporty (`wonders::{js_sin, js_cos}`, `terrain::jsmath::js_pow`, `terrain::coast::js_hypot`).
- `geom/**` i `terrain/**` przepięte na `jsmath` wszędzie, gdzie web woła `Math.*` (§4). Kontrola:
  `git grep -nE "\.(sin|cos|tan|atan2|atan|acos|asin|powf|hypot|exp|ln|powi|…)\(" -- src/geom src/terrain src/models src/jsmath`
  → 1 trafienie, w komentarzu dokumentacyjnym (`models/wonders/builders.rs:5`). Ten sam warunek pilnuje test
  `tests/jsmath_wiring.rs::no_platform_transcendentals_in_js_mirroring_modules`.
- Wektory z URUCHOMIONEGO node v22.22.0: 10 funkcji × ≥ 20 021 argumentów (+ `hypot` 3-argumentowy 3 004) — **0 różnic
  bitowych** (§6). Platformowy glibc na tych samych danych: 78–3 340 różnic na funkcję (informacyjnie).
- Wszystkie dotychczasowe testy zgodności zielone **bez zmiany fixtur**; dwa przypadki geometrii, które dotąd były
  „blisko, ale nie bitowo", są teraz bitowe (§7).
- Mutacje: 23/23 wykryte (§8). Bramki w czystym `CARGO_TARGET_DIR`: wszystkie `EXIT=0` (§10).

## 2. ZAŁOŻENIA (luki dispatchu rozstrzygnięte przez Operatora)

- **Z1 — zakres funkcji.** Dispatch wymienia `sin/cos/tan/atan2/pow/hypot/exp/log`. Dodano `atan` (używane przez `atan2`,
  osobno testowane) i `acos`, bo web woła `Math.acos` w `geom` (`three/src/extras/core/Curve.js:333`, `:347` —
  `computeFrenetFrames` rurki), a binarne kryterium wymaga braku funkcji systemowych tam, gdzie web używa `Math.*`.
- **Z2 — NaN.** Porównanie bitowe (`to_bits`) dla wszystkich wyników nie-NaN; gdy V8 zwraca NaN, wymagane jest „dowolne NaN".
  Ładunek NaN nie jest obserwowalny przez JS `Number` (zapis przez `Float64Array` może go kanonizować), więc specyfikacją
  jest tylko klasa. W kodzie: fdlibm `x - x` dla `±∞`/NaN zastąpione `f64::NAN` (clippy `eq_op`), komentarz przy każdym miejscu.
- **Z3 — format fixtur.** Zamiast JSON z liczbami: pliki binarne `<fn>.bin` (wiersze little-endian f64: argumenty, wynik) +
  `manifest.json` (liczności, SHA-256) + `gen.mjs` + `README.md`. JSON z dokładnym zapisem 200 000+ liczb byłby > 8 MB;
  binaria zajmują 3,8 MB (limit 8 MB). SHA-256 każdego pliku w `manifest.json` (§6).
- **Z4 — „poza zakresem → jawny fallback i flaga".** Ponieważ przeniesiono pełną redukcję `__kernel_rem_pio2`, żaden zakres
  nie wymaga fallbacku; flaga istnieje jako stała `jsmath::PLATFORM_FALLBACK = false` (testowana) i opis „Argument range"
  w `src/jsmath/mod.rs`.
- **Z5 — `pick/**`, `camera`.** Poza allowlistą (zakaz dispatchu); ich wywołania `sin/cos/tan` (`pick/camera.rs`, `pick/terrain.rs`,
  `pick/three.rs`) NIE są przepięte — ryzyko szczątkowe §9, propozycja osobnego tematu.
- **Z6 — `models/wonders/model.rs::quat_from_euler_js`.** Zostaje (allowlista dopuszcza w `wonders` wyłącznie `js_trig.rs`);
  używa `js_sin/js_cos` przez re-eksport, więc korzysta z tej samej implementacji.
- **Z7 — `pow` współdzieli `words::scalbn`.** Własne `scalbn` z P4.11 (pętla) zastąpione wspólnym, jednokrotnie zaokrąglającym
  `scalbn` (jak musl/glibc); dla zakresu `pow` (jeden krok `2^-969`) obie wersje są identyczne — potwierdzone wektorami
  (`pow` 0 różnic, w tym 1 000 wyników subnormalnych `2^[-1080,-1020]`) i mutacją M18.

## 3. Źródła V8 (wyprowadzenie)

| Plik | Skąd | SHA-256 |
|---|---|---|
| `src/base/ieee754.cc` | `raw.githubusercontent.com/v8/v8/12.4.254.21/src/base/ieee754.cc` | `da01a54955911cfc550117988de91516c6f1aac343af28142dce619b433a67fc` (ten sam co w P4.11) |
| `src/base/ieee754.h` | j.w. `/src/base/ieee754.h` | `c968700367cc44a8255b4d44f382e704674f8f8e4bb14eb022b82f60a1e87b71` |
| `src/builtins/math.tq` | j.w. `/src/builtins/math.tq` | `569ff61e5bc48f6121fa57dcdaa8ba56428231a8d1091d2c5193332e4fbf18ff` (ten sam co w P4.11) |

Mapowanie (plik:linia w `ieee754.cc`): makra słów `:54-105` → `jsmath/words.rs`; `__ieee754_rem_pio2` `:118-270`,
`__kernel_cos` `:305-336`, `__kernel_rem_pio2` `:443-644`, `__kernel_sin` `:673-698`, `__kernel_tan` `:733-835`,
`cos` `:1351-1383`, `sin` `:2447-2479`, `tan` `:2510-2530` → `jsmath/trig.rs`; `acos` `:862-921`, `atan` `:1116-1200`,
`atan2` `:1228-1319` → `jsmath/inverse.rs`; `exp` `:1447-1538` (z odstępstwem V8 `exp(1) = E`, `:1499`),
`log` `:1638-1717` → `jsmath/exp_log.rs`; `pow` `:2645-2906` → `jsmath/pow.rs` (bez zmian algorytmu z P4.11).
`math.tq:397-441` (`MathHypot`: max, Kahan, `sqrt(sum)*max`) → `jsmath/hypot.rs`. `math.tq:207-386`: `MathSin/Cos/Tan/
Atan2/Exp/Log` wołają `Float64Sin/…`, `MathPow` (`:120-131`) → `Float64Pow` — czyli `base::ieee754::*`.
Brak `V8_USE_LIBM_TRIG_FUNCTIONS` w node v22.22.0: `node --v8-options | grep -ci libm` → `0`;
`node --no-use-libm-trig-functions -e 1` → `node: bad option: --no-use-libm-trig-functions` (zmierzone 2026-10-22).

## 4. Przepięcie `geom` / `terrain` na `jsmath` (web plik:linia)

three.js r169 = `three@0.169.0` z npm (`npm pack three@0.169.0`, SHA-256 tgz `c86d0937570fb425d981e156ddf919c43dbc45d4e91fd7c8dd0de56723b3ec71`), web `edb8fb56`:

| Rust | Web |
|---|---|
| `geom/math.rs` `Mat4::rotation_x/y/z` | `three/src/math/Matrix4.js:594`, `:611`, `:628` (`Math.cos/sin(theta)`) |
| `geom/math.rs` `Mat4::rotation_axis` | `Matrix4.js:647-648` |
| `geom/math.rs` `Quat::from_euler` | `three/src/math/Quaternion.js:209-218` (`cos = Math.cos`, `sin = Math.sin`) |
| `geom/prims.rs` cylinder/cone | `geometries/CylinderGeometry.js:90-91`, `:211-212` |
| `geom/prims.rs` sphere | `SphereGeometry.js:69-71` |
| `geom/prims.rs` torus | `TorusGeometry.js:48-50`, `:56-57` |
| `geom/prims.rs` circle / ring | `CircleGeometry.js:47-48`, `RingGeometry.js:52-53` |
| `geom/polyhedron.rs` `azimuth`/`inclination` | `PolyhedronGeometry.js:286`, `:295` (`Math.atan2`) |
| `geom/curve.rs` tube radial | `TubeGeometry.js:101-102` |
| `geom/curve.rs` Frenet frames | `extras/core/Curve.js:333`, `:347` (`Math.acos`) |
| `geom/curve.rs` CatmullRom centripetal/chordal | `extras/curves/CatmullRomCurve3.js:158-160` (`Math.pow`) |
| `geom/shape.rs` bevel | `ExtrudeGeometry.js:353-354`, `:449-450` |
| `terrain/coast.rs` 3× `atan2` | `gra/src/render/mapRenderStyle.ts:1564`, `:1643`, `:1688` (`git show edb8fb56:…`; także `:1602`, `:1787`) |
| `terrain/coast.rs` `js_hypot` (re-eksport) | `mapRenderStyle.ts:1559`, `:1590`, `:1638`, `:1682`, `:1780` |
| `terrain/color.rs` `js_pow` (bez zmian, przez re-eksport) | `THREE.Color` sRGB, `three/src/math/ColorManagement.js:141`, `:147` (P4.11) |

`sqrt` zostaje platformowe: IEEE 754 wymaga poprawnego zaokrąglenia, identyczne w V8 i każdej `libm`.

## 5. Wektory V8

Generator `rust-port/renderer/tests/fixtures/jsmath/gen.mjs` (SHA-256 `799cb0553532ac59c47e9b5967ad38c01e5468ae6cdcd6c13a411608ec3eaf91`), uruchamiany poza repo:
`node gen.mjs <scratch>/out`, `node --jitless gen.mjs <scratch>/jit`, `node --always-turbofan gen.mjs <scratch>/tf` —
33 skróty, 11 różnych (3 przebiegi bajtowo identyczne: wynik nie zależy od warstwy JIT). Argumenty z xorshift128+
o stałym ziarnie; klasy: specjalne (0, −0, NaN, ±∞, subnormalne min/max, normal min, ±MAX, ±1, ±EPSILON…), granice gałęzi
fdlibm ±3 ulp, małe `[-1,1]`, drobne `10^[-320,-1]`, `k·π/4 ± 4 ulp` (|k| ≤ 4000), średnie `[-1000,1000]`, duże `10^[3,6]`,
olbrzymie `10^[6,308]` (`__kernel_rem_pio2`), losowe wzorce bitowe; zestawy specyficzne dla `exp/log/acos/atan2/pow/hypot`
(`README.md` w katalogu fixtur).
`HARD_REDUCTION`: 111 (+111 ujemnych) argumentów średniego zakresu przy `k·π/2` (k ≤ 667 000, ±3 ulp), dla których redukcja
potrzebuje 3. iteracji `__ieee754_rem_pio2` — znalezione wyczerpującym przeszukaniem scratch (port z i bez tej iteracji:
222 z 9,3 mln kandydatów różnią się). Dodane po tym, jak pierwsza wersja wektorów nie wykryła mutacji M5b (§8).

## 6. Wyniki zgodności (`tests/jsmath_v8_parity.rs`)

| Funkcja | Przypadki | Wyniki NaN | Różnice portu | Różnice glibc (info) | SHA-256 `.bin` |
|---|---|---|---|---|---|
| sin | 20 021 | 3 | **0** | 687 | `a2503af3…19a525c7` |
| cos | 20 021 | 3 | **0** | 698 | `defb0ae3…9503a76a` |
| tan | 20 021 | 3 | **0** | 559 | `799bc18e…157a2def` |
| atan | 20 021 | 1 | **0** | 393 | `26d984b3…f99bd02e` |
| acos | 20 021 | 671 | **0** | 1 016 | `d9649a47…0e4468c7` |
| exp | 20 021 | 1 | **0** | 1 559 | `698616b9…10101b3e` |
| log | 20 021 | 510 | **0** | 99 | `d347c1bc…1c76bb90` |
| atan2 | 20 441 | 135 | **0** | 2 704 | `4544dcc2…b2013ee6` |
| pow | 21 024 | 1 693 | **0** | 1 342 | `c342d8f6…ee05234a` |
| hypot (2 arg.) | 20 441 | 37 | **0** | 3 340 | `b98a9509…715639d1` |
| hypot (3 arg.) | 3 004 | 1 | **0** | 728 | `71edd4eb…b8709595` |

Pełne skróty: `tests/fixtures/jsmath/manifest.json`. Dodatkowo `tests/jsmath_wiring.rs`: skan źródeł (§1) oraz strażnik
numeryczny — na 18 kątach z wektorów (|x| < 1e6), gdzie glibc `sin`/`cos` ≠ V8, `Mat4::rotation_z` i `Quat::from_euler` dają bity V8.

## 7. Dotychczasowe testy zgodności — bez zmiany fixtur

Porównanie wyjścia `--nocapture` binariów testów przed zmianą (`tgt-base`, baza `8761c6c3`) i po niej
(skrypt scratch `cmp_tests.sh`): `terrain_web_parity`, `wonders_web_parity`, `camera_web_parity`, `pick_golden` — wyjście
IDENTYCZNE. `geom_three_parity` (tolerancja 1e-6) — 2 linie różne, oba przypadki z „blisko" na „bitowo":

```
< curve.json:estuary_centripetal: samples=33 max|d| point=2.220446049250313e-16 tangent=6.281086761816823e-13
> curve.json:estuary_centripetal: samples=33 max|d| point=0e0 tangent=0e0
< test parity_tube ... tube.json:trade_route: verts=585 tris=1024 max|d| pos=1.1920928955078125e-7 nor=2.9802322387695313e-8 uv=0e0
> test parity_tube ... tube.json:trade_route: verts=585 tris=1024 max|d| pos=0e0 nor=0e0 uv=0e0
```

Przyczyna: `Math.pow(d², 0.25)` (centripetal) i `Math.acos`/`Math.pow` w ramach Freneta rurki — glibc różnił się od V8 w
ostatnim bicie. Linie `max|d|` geometrii z wszystkimi odchyłkami = 0: przed 92/94, po 94/94. Żaden fixture nie został zmieniony.

## 8. Test mutacyjny

Skrypt scratch `mutate.py`: każda mutacja na jednym pliku, `cargo test --locked --no-fail-fast --test jsmath_v8_parity
--test jsmath_wiring --test geom_three_parity --test terrain_web_parity --test wonders_web_parity`, przywrócenie pliku.
Wynik końcowy **23/23 wykryte** (log §10.3). Historia: przebieg 1 — 17/22 (M5 próg 16→40, M8 `aT[10]`, M12/M13 obcięte
stałe — mutacje praktycznie równoważne: zmiana poniżej ½ ulp wyniku; M18 — `pow` miało wtedy własne `scalbn`, więc
mutowany kod był nieosiągalny); poprawki: silniejsze mutacje M5/M8/M12/M13, nowa M5b, `pow` na wspólnym `scalbn` (Z7),
`--no-fail-fast`; przebieg 2 — 21/23 (M5b, M12 przeżyły); poprawki: wektory `HARD_REDUCTION` (§5), M12 silniejsza;
przebieg 3 — 23/23.

## 9. Ryzyka szczątkowe i NIE_ZMIERZONO

- `pick/**` (zakaz allowlisty) nadal używa platformowego `sin/cos/tan`: `pick/camera.rs:83-88`, `:104`, `pick/terrain.rs:204`,
  `:228`, `pick/three.rs:197-202`. **Runda 2:** `terrain` NIE woła już `pick::three::Quat::from_euler_xyz` — ma własne
  `terrain::quat_from_euler_xyz` na `js_sin/js_cos` (zarzut 1 Evaluatora r1, §11). Testy
  `pick_golden`/`terrain_web_parity` zielone, ale niezależność od platformy tam NIE jest zapewniona — propozycja tematu
  „przepięcie `pick/**` na `jsmath`".
- Windows/macOS: port jest czystym Rustem bez `libm` (poza `sqrt`, poprawnie zaokrąglanym), więc wynik nie powinien zależeć
  od platformy — NIE_ZMIERZONO (brak maszyn).
- Inne funkcje `Math.*` (`asin`, `sinh`, `cbrt`, `log2`, `expm1`…) — nieużywane w `geom/terrain/wonders`, nieprzeniesione.
- Ładunki NaN — celowo nieporównywane (Z2).

## 10. Surowe logi

### 10.1 Bramki (czysty `CARGO_TARGET_DIR`, usunięty po pracy)

Skrypt scratch `gates.sh`: każdy krok w świeżym `CARGO_TARGET_DIR` (`rm -rf` przed i po kroku — na maszynie zostało < 1 GB wolnego miejsca; poprzedni przebieg z jednym wspólnym targetem padł na `No space left on device` w kroku `--features gpu`, nie z powodu kodu). Przebieg końcowy, po ostatniej zmianie plików:

```text
free before: 683M
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Blocking waiting for file lock on package cache
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.66s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 33.49s
EXIT=0
$ cargo test --locked --all-targets
    Finished `test` profile [unoptimized + debuginfo] target(s) in 5.52s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/civ_renderer-3390857ab33a1fe3)

running 5 tests
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test jsmath::words::tests::words_round_trip ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
test new_game_frees_everything_and_restarts_identically ... ok
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test cache_lru_by_entries_and_bytes ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test handle_from_another_registry_is_rejected ... ok
test live_report_lists_labels ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test parity_circle ... ok
test merge_rejects_mixed_indexing ... ok
test parity_curve ... ok
test parity_cone ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_ops ... ok
test parity_ring ... ok
test parity_extrude ... ok
test parity_shape ... ok
test parity_cylinder ... ok
test parity_torus ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/jsmath_v8_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan2_matches_v8 ... ok
test atan_matches_v8 ... ok
test cos_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test acos_matches_v8 ... ok
test exp_matches_v8 ... ok
test log_matches_v8 ... ok
test hypot_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test pow_matches_v8 ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/jsmath_wiring.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 2 tests
test geom_rotation_and_euler_use_v8_trig ... ok
test no_platform_transcendentals_in_js_mirroring_modules ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.46s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-clean/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

EXIT=0
$ cargo test --locked --test jsmath_v8_parity -- --nocapture --test-threads=1
test acos_matches_v8 ... acos: cases=20021 port_mismatches=0 libm_mismatches=1016
test atan2_matches_v8 ... atan2: cases=20441 port_mismatches=0 libm_mismatches=2704
test atan_matches_v8 ... atan: cases=20021 port_mismatches=0 libm_mismatches=393
test cos_matches_v8 ... cos: cases=20021 port_mismatches=0 libm_mismatches=698
test exp_matches_v8 ... exp: cases=20021 port_mismatches=0 libm_mismatches=1559
test hypot_matches_v8 ... hypot: cases=20441 port_mismatches=0 libm_mismatches=3340
test hypot_three_arguments_matches_v8 ... hypot3: cases=3004 port_mismatches=0 libm_mismatches=728
test log_matches_v8 ... log: cases=20021 port_mismatches=0 libm_mismatches=99
test pow_matches_v8 ... pow: cases=21024 port_mismatches=0 libm_mismatches=1342
test sin_matches_v8 ... sin: cases=20021 port_mismatches=0 libm_mismatches=687
test tan_matches_v8 ... tan: cases=20021 port_mismatches=0 libm_mismatches=559
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
EXIT=0
clean target removed: yes
```

### 10.2 Testy przed zmianą (baza `8761c6c3`, `tgt-base`)

```text
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/civ_renderer-3390857ab33a1fe3)
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/assets_nturns-8f7d0ea4505dd8a8)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/assets_registry-c3f9969dbcf4ae07)
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/camera_web_parity-ed19813f9fcbbf13)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/cpu_sanity-0295d7bf5a63866f)
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/geom_three_parity-0f596b3cbdb71744)
test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/gpu_probe-b90f27ad8c898393)
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/pick_golden-5edd88b94adda948)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.48s
     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/terrain_web_parity-7ed099e492a012e9)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s
     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt-base/debug/deps/wonders_web_parity-d8d9a630ca3a6684)
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s
EXIT=0
```

### 10.3 Mutacje (przebieg końcowy)

```text
M1 sin coefficient S3: exit=101 DETECTED failed=['sin_matches_v8']
M2 kernel_cos qx constant 0.28125: exit=101 DETECTED failed=['sin_matches_v8', 'cos_matches_v8', 'geom_rotation_and_euler_use_v8_trig', 'js_trig_is_bit_identical_to_v8', 'models_are_bit_identical_to_web']
M3 two_over_pi table entry (large-argument path): exit=101 DETECTED failed=['cos_matches_v8', 'sin_matches_v8', 'whole_domain_without_platform_fallback', 'tan_matches_v8']
M4 kernel_rem_pio2 ih==2 branch 1-z -> z: exit=101 DETECTED failed=['tan_matches_v8', 'sin_matches_v8', 'cos_matches_v8']
M5 rem_pio2 medium: 2nd/3rd iteration never taken (i > 16 -> i > 1000): exit=101 DETECTED failed=['cos_matches_v8', 'tan_matches_v8', 'sin_matches_v8', 'geom_rotation_and_euler_use_v8_trig', 'js_trig_is_bit_identical_to_v8', 'models_are_bit_identical_to_web']
M5b rem_pio2 medium: 3rd iteration never taken (i > 49 -> i > 1000): exit=101 DETECTED failed=['cos_matches_v8', 'sin_matches_v8', 'tan_matches_v8', 'geom_rotation_and_euler_use_v8_trig']
M6 kernel_tan pio4lo dropped: exit=101 DETECTED failed=['tan_matches_v8']
M7 kernel_tan -1/(x+r) accurate branch -> plain -1/w: exit=101 DETECTED failed=['tan_matches_v8']
M8 atan coefficient aT[0]: exit=101 DETECTED failed=['atan2_matches_v8', 'atan_matches_v8']
M9 atan2 quadrant 2 without pi_lo: exit=101 DETECTED failed=['atan2_matches_v8']
M10 acos x>0.5 branch drops correction c: exit=101 DETECTED failed=['parity_tube', 'acos_matches_v8']
M11 exp without V8 exp(1)=E special case: exit=101 DETECTED failed=['exp_matches_v8', 'whole_domain_without_platform_fallback']
M12 exp ln2LO constant: exit=101 DETECTED failed=['exp_matches_v8']
M13 log coefficient Lg1: exit=101 DETECTED failed=['log_matches_v8']
M14 log near-1 branch 0.5 -> 0.4999999999999999: exit=101 DETECTED failed=['log_matches_v8']
M15 pow: fdlibm divisor instead of the V8 deviation: exit=101 DETECTED failed=['pow_matches_v8', 'color_math_matches_three', 'terrain_build_matches_web', 'models_are_bit_identical_to_web']
M16 hypot without Kahan compensation (equivalent for 2 arguments; hypot3 vectors): exit=101 DETECTED failed=['hypot_three_arguments_matches_v8']
M17 hypot: NaN before Infinity: exit=101 DETECTED failed=['hypot_three_arguments_matches_v8', 'whole_domain_without_platform_fallback', 'hypot_matches_v8']
M18 scalbn (shared, used by pow subnormal results) step 2^-969 -> 2^-968: exit=101 DETECTED failed=['pow_matches_v8', 'js_pow_special_cases_follow_v8', 'color_math_matches_three']
M19 geom curve back to platform powf: exit=101 DETECTED failed=['no_platform_transcendentals_in_js_mirroring_modules']
M20 geom Quat::from_euler back to platform sin: exit=101 DETECTED failed=['geom_rotation_and_euler_use_v8_trig', 'no_platform_transcendentals_in_js_mirroring_modules']
M21 terrain coast back to platform atan2: exit=101 DETECTED failed=['no_platform_transcendentals_in_js_mirroring_modules']
M22 wonders re-export swapped (sin <-> cos): exit=101 DETECTED failed=['compatibility_paths_are_the_same_functions', 'js_trig_is_bit_identical_to_v8', 'models_are_bit_identical_to_web']
TOTAL: 23/23 detected
EXIT=0
```

## 11. Runda 2 — obrona (zarzuty Evaluatora r1)

- **Zarzut 1 (terrain liczył obrót przez `pick::three::Quat::from_euler_xyz` = `f64::sin/cos`) — PRZYJMUJĘ.**
  Nowa `pub fn terrain::quat_from_euler_xyz` (`src/terrain/mod.rs`, ten sam układ wyrażeń co `setFromEuler` 'XYZ' i
  `pick/three.rs:196-209`, ale `js_sin/js_cos`); przepięte 3 miejsca: `instance_matrix` (używane m.in. przez `coast.rs`),
  `ocean_world`, `bar`. `pick/**` nietknięte. Fixtury `terrain_web_parity` bez zmian i zielone (wynik po zapisie `f32`
  identyczny na mapach testowych).
- **Zarzut 2 (skaner `jsmath_wiring` nieszczelny) — PRZYJMUJĘ.** Skan rekurencyjny (`rs_files_recursive`), dodatkowo forma
  ścieżkowa `f64::<fn>(`/`f32::<fn>(` oraz znane pośrednie helpery `pick` z platformową trygonometrią
  (`from_euler_xyz(` bez prefiksu `_`, `hex_prism_no_bottom(`). Nowe testy: `scanner_catches_known_bypass_forms`
  (7 form złych, 3 dobre) i `terrain_rotation_uses_v8_trig` (kąty z wektorów V8, gdzie glibc ≠ V8: bity
  `quat_from_euler_xyz` == V8 oraz `instance_matrix` == compose kwaternionu V8; 2 kąty, gdzie różnica glibc/V8 przeżywa zapis `f32`).
- **Mutacje rundy 2 (wszystkie wykryte):**
  - R2-M1 `instance_matrix` z powrotem na `Quat::from_euler_xyz` → FAILED `terrain_rotation_uses_v8_trig`, `no_platform_…`;
  - R2-M2 `c2 = (y / 2.0).cos()` → FAILED oba powyższe;
  - R2-M3 `c1 = f64::cos(x / 2.0)` (forma ścieżkowa) → FAILED `no_platform_…` (`mod.rs:126: f64::cos(`);
  - R2-M4 plik w podkatalogu `src/geom/zz_tmp/x.rs` z `x.sin()` → FAILED `no_platform_…` (plik usunięty).
- **Bramki r2** (świeży `CARGO_TARGET_DIR=/dev/shm/op2/tgt`, usunięty): `fmt --check` EXIT=0, `clippy -D warnings` EXIT=0,
  `clippy --features gpu -D warnings` EXIT=0, `cargo test --locked --all-targets` EXIT=0 — 12 binariów, 81 testów ok
  (79 + 2 nowe), w tym `geom_three_parity` 17, `terrain_web_parity` 5, `wonders_web_parity` 4, `camera_web_parity` 5,
  `pick_golden` 7, `jsmath_v8_parity` 13, `jsmath_wiring` 4.
