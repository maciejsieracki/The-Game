# P4.18 — konsolidacja matematyki JS (`jsmath`) w `rust-port/renderer`

TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1 · DOMAIN: GAME · runda 1/5 (Operator)
Baza: `origin/rust-port/parity-v2` = `bf59164b` (P4.16 Final Control r2 PASS).

## Cel

Jedna implementacja `Math.*` V8 (moduł `crate::jsmath`, P4.16) w całym crate:
(1) `models/unit_core/jstrig.rs` = re-eksport, (2) `pick/**` przepięty,
(3) skaner `tests/jsmath_wiring.rs` obejmuje `pick/**`, `core/**`, `models/**`,
`camera.rs`, (4) dowód `git grep`. Publiczne sygnatury bez zmian.

## Zmiany (plik → co)

| Plik | Zmiana |
|---|---|
| `src/models/unit_core/jstrig.rs` | 239 → 27 linii: `pub use crate::jsmath::{js_cos, js_sin};` + niezmieniony trait `JsTrig` (delegacja). Usunięta kopia fdlibm z P4.13 razem z jej fallbackiem `x.sin()/x.cos()` dla `|x| > 2^19·π/2` (jsmath pokrywa cały zakres `f64`, `PLATFORM_FALLBACK = false`). |
| `src/pick/three.rs` | `Quat::from_euler_xyz`: `(x/2).cos()/.sin()` → `js_cos/js_sin` (three r169 `Quaternion.js:209-210` `const cos = Math.cos; const sin = Math.sin`). |
| `src/pick/terrain.rs` | `hex_prism_no_bottom` (CylinderGeometry): `theta.sin()/cos()` → `js_sin/js_cos` (three r169 `CylinderGeometry.js:90-91, 211-212`). `rotacja_dla_heksa` nie wywołuje funkcji transcendentalnych (tylko hash + mnożenie) — jej obrót idzie przez `Quat::from_euler_xyz` (`pick/terrain.rs:312`), już przepięty. |
| `src/pick/camera.rs` | `position()`: `elevation.cos/sin`, `azimut.sin/cos` → `js_*` (web `gra/src/render/camera.ts:135-142` @ `edb8fb56`: `Math.cos(elevation)`, `Math.sin(elevation)`, `Math.sin(azimut)`, `Math.cos(azimut)`); `matrices()`: `.tan()` → `js_tan` (three r169 `PerspectiveCamera.js:217` `Math.tan(DEG2RAD*0.5*fov)`). |
| `src/core/hex_shape.rs` | `hex_ring_points_xz`, `append_pointy_top_hex`: `angle.cos/sin` → `js_cos/js_sin` (web `gra/src/render/hexShape.ts:11, 26-27` @ `edb8fb56`: `Math.cos(angle)`, `Math.sin(angle)`). |
| `tests/jsmath_wiring.rs` | Patrz §Skaner. |

`src/camera.rs`: `git grep` nie wykazał wywołań — bez zmian. `lib.rs` bez zmian
(nowego modułu brak). `tests/unit_core_trig.rs` bez zmian (nie było konieczne).

## Skaner `tests/jsmath_wiring.rs`

- Zakres: rekurencyjnie `src/{geom,terrain,models,jsmath,pick,core}` + pliki
  `src/camera.rs`, `src/models.rs`; 56 plików (próg `scanned >= 50`).
- Formy wykrywane: metody `.sin() … .hypot(` (+ nowe `.ln_1p()`, `.cbrt()`,
  `.log(`, `.powi(`); formy ścieżkowe po usunięciu białych znaków:
  `f64::sin`, `f32::cos`, `<f64>::cos(`, `<f64 as Float>::sin(`, `f64 :: tan (`,
  oraz funkcja jako wartość (`map(f64::cos)`), dla 25 nazw (`FN_NAMES`), z
  granicą identyfikatora (`f64::max`, `f64::consts::PI` nie są fałszywym
  trafieniem); `libm::` / `extern crate libm`; `intrinsics::`; makra
  budujące identyfikatory (`paste!`, `concat_idents!`).
- Lista `INDIRECT` (`from_euler_xyz(`, `hex_prism_no_bottom(`) usunięta:
  te funkcje są teraz same oparte o `jsmath`, a `pick/**` jest skanowany
  bezpośrednio. `Quat::from_euler_xyz` przeniesiony do przypadków „ok”.
- Test `scanner_catches_known_bypass_forms`: 14 form złych, 8 dobrych.
- Mutacje (ręczne, cofnięte): dopisanie `fn _mut(x: f64) -> f64 { <f64>::cos(x) }`
  do `src/pick/three.rs`, `src/core/hex_shape.rs`, `src/camera.rs`,
  `src/models/unit_core/horse.rs` → za każdym razem 1 trafienie `path ::cos`
  (4/4 wykryte). Przed P4.18 forma `<f64>::cos(` nie była wykrywana, a
  `pick/core/camera.rs/models/unit_core` nie były skanowane.

## Fixtury `pick_golden` i pozostałe

Wszystkie fixtury bez zmian (`git status` nie pokazuje `tests/fixtures/**`);
`pick_golden` 7/7, `core_web_parity` 8/8, `unit_core_trig` 2/2,
`unit_core_web_parity` 3/3 — zielone na nowym kodzie. Nowe wektory z weba nie
były potrzebne (żaden fixture się nie zmienił, więc nie ma czego uzasadniać).

Pomiar informacyjny (sonda w scratch, plik testowy usunięty): na kątach
używanych przez przepięty kod libm(glibc) vs V8 różni się dla
`θ = 4/6·2π = 4.1887902047863905` (wierzchołek 4 pryzmatu `RADIAL = 6`,
`pick/terrain.rs:185`). Fixture był mimo to zielony, bo pozycje pryzmatu są
zapisywane jako `f32` (`pos.push(x as f32)`), co maskuje różnicę 1 ulp `f64`.
Kąty narożników heksa (6), elewacja 52° i `tan(25°)` dają identyczne bity w
libm i V8 — dotychczasowa zgodność była więc „szczęśliwa”, teraz jest
konstrukcyjna. `azimut = 0` jest trywialny.

## Dowód `git grep`

```
git grep -nE '\.(sin|cos|tan|sin_cos|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|exp|exp2|exp_m1|ln|log10|log2|ln_1p|cbrt)\(\)|\.(atan2|powf|powi|hypot|log)\(|f(64|32)::(sin|cos|tan|asin|acos|atan|atan2|exp|ln|log|powf|powi|hypot|sinh|cosh|tanh|cbrt|exp2|log2|log10)\b|libm::' -- rust-port/renderer/src
```

Wynik po zmianie — 7 linii, WSZYSTKIE komentarze doc (żadnego wywołania):

```
src/jsmath/exp_log.rs:109:/// `Math.log(x)` of V8 (fdlibm `log`).
src/jsmath/hypot.rs:8:/// `Math.hypot(...values)` of V8.
src/jsmath/hypot.rs:47:/// `Math.hypot(a, b)` of V8.
src/jsmath/inverse.rs:101:/// `Math.atan2(y, x)` of V8 (fdlibm `atan2`, `ieee754.cc:1228-1319`).
src/jsmath/mod.rs:9://! [`crate::models::wonders`]) calls this module instead of `f64::sin` & co.,
src/jsmath/pow.rs:8://! Rust's `f64::powf` calls the platform libm (glibc on Linux), which rounds
src/terrain/mod.rs:123:/// because it uses `f64::sin/cos`.
```

Przed zmianą ten sam grep dawał 18 linii kodu (21 wywołań):
`core/hex_shape.rs` (3 linie / 4 wywołania), `models/unit_core/jstrig.rs`
(2 / 2, fallback), `pick/camera.rs` (5 / 5), `pick/terrain.rs` (2 / 4),
`pick/three.rs` (6 / 6).

**Wyjątki: brak.** Każde z 21 wywołań odpowiadało `Math.*` w webie/three r169
(źródła w tabeli wyżej). `.sqrt()` pozostaje dozwolone (IEEE 754, poprawnie
zaokrąglany — identyczny w V8 i każdym libm). Pliki spoza skanu
(`overlays.rs`, `text.rs`, `view.rs`, `material.rs`, `gpu.rs`, `assets/**`)
nie mają trafień w grepie.

## Gate (pełne logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1/01-operator-r1.md`)

- `cargo fmt --all -- --check` → `EXIT=0`
- `cargo clippy --locked --all-targets -- -D warnings` → `EXIT=0`
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` → `EXIT=0`
- `cargo test --locked --all-targets` → `EXIT=0`, 103 testy ok, 0 failed.

## ZAŁOŻENIA

1. Dispatch zawiera sprzeczność: allowlista dopuszcza `src/pick/**`
   („WYŁĄCZNIE przepięcie na `jsmath`”) i `src/camera.rs`, a zdanie „Zero
   zmian w …`{geom,pick,assets,camera,terrain}/**`” je wyklucza. Przyjęto, że
   jawny GOAL (pkt 2) i allowlista mają pierwszeństwo; `pick/**` zmieniono
   wyłącznie w zakresie przepięcia `sin/cos/tan` na `jsmath`. `geom`,
   `assets`, `terrain`, katalog `camera/` — bez zmian.
2. Trait `JsTrig` w `jstrig.rs` zostaje (publiczne API używane przez
   `category.rs`, `horse.rs`, `p1.rs`, `model.rs`); „tylko re-eksport”
   rozumiany jako: brak własnej implementacji matematyki, delegacja do `jsmath`.

## Zauważone poza allowlistą (nie zmieniane)

- `src/terrain/mod.rs:121-123` — komentarz „`pick::three::Quat::from_euler_xyz`,
  which `terrain` must not call because it uses `f64::sin/cos`” jest po P4.18
  nieaktualny (obie funkcje są teraz V8-exact). Kosmetyka w `terrain/**`.
- `src/models/unit_core/model.rs:449` — komentarz „`geom::Quat::from_euler`
  uses the platform libm” nieaktualny od P4.16. Kosmetyka.

## Co ocenić wzrokiem po RR-T5

NIE_ZMIERZONO (brak GPU). Zmiana nie wpływa na obraz poza ewentualnym 1 ulp
`f64` (niewidoczny po `f32`). Do potwierdzenia wzrokiem: kształt pryzmatów
terenu i obrys heksów (`hex_shape`) bez zmian względem weba; trafienia myszą
w heks (picking) bez zmian.
