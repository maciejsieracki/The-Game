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

## Skaner `tests/jsmath_wiring.rs` (runda 2, po FAIL Evaluatora r1)

Runda 1 (wycofana): skaner liniowy na surowym tekście — metody sprawdzane bez
normalizacji białych znaków, brak aliasów typu i lokalnych `macro_rules!`,
zakres 6 katalogów + 2 pliki. Evaluator r1 wykazał obejścia (`x.sin ()`,
`R::cos(x)`, `$v.$f()`), zarzuty 1–3 PRZYJĘTE.

Runda 2:
- **Zakres:** CAŁE `src/` rekurencyjnie (69 plików `.rs`, próg `>= 60`), więc
  także `lib.rs`, `view.rs`, `overlays.rs`, `text.rs`, `material.rs`, `gpu.rs`,
  `assets/**` i każdy przyszły plik najwyższego poziomu. Test asertuje obecność
  16 wskazanych plików (m.in. `pick/three.rs`, `core/hex_shape.rs`, `camera.rs`,
  `lib.rs`, `view.rs`).
- **Lekser** (w teście, bez zależności): usuwa komentarze (`//`, zagnieżdżone
  `/* */`), stringi, raw stringi (`r#"…"#`, `br"…"`), literały znakowe; rozwija
  surowe identyfikatory `r#sin` → `sin`; `::` to jeden token. Reguły działają
  na strumieniu tokenów, więc spacje, łamanie linii i `#[rustfmt::skip]` nie
  ukrywają wywołania.
- **Reguły** dla 27 nazw (`FN_NAMES`, dodane `powi`, `mul_add`):
  - `. nazwa (` / `. nazwa ::<` — wywołanie metody;
  - `:: nazwa`, o ile nie jest prefiksem modułu (`:: nazwa ::`) — łapie
    `f64::sin`, `<f64>::cos`, `<f64 as Float>::sin`, alias `R::cos`, generyk
    `T::sin`, `map(f64::cos)`;
  - goła nazwa wewnątrz wywołania makra lub ciała `macro_rules!`
    (`probe_call!(x, tan)`), poza dostępem do pola (`a.log,`);
  - `. $f (` i `:: $f (` w makrze (wywołanie z nazwą od wywołującego);
    `Self::$wariant` bez wywołania jest dozwolone (istniejące makra
    `catalogue!`/`bases!`);
  - identyfikatory `libm`, `intrinsics`, `extern`, `paste`, `concat_idents`
    oraz `include!` i `#[path]` gdziekolwiek w kodzie.
- `scanner_catches_known_bypass_forms`: 36 form złych (w tym wszystkie 8 z
  raportu Evaluatora r1), 24 dobre (zmienne lokalne `sin`/`cos`/`tan`/`ln`,
  pole `self.log`, `mod hypot`, stringi i komentarze z `x.sin()`, lifetimes,
  `if !(sin > 0.0)`, `Self::$v` w makrze).
- **Mutacja A** (cofnięta) w `src/pick/three.rs`:
  `#[rustfmt::skip] pub fn probe_a(x: f64) -> f64 { x.sin () + ProbeR::cos(x) + probe_call!(x, tan) }`
  + `type ProbeR = f64;` + `macro_rules! probe_call { ($v:expr, $f:ident) => { $v.$f() }; }`
  → `no_platform_transcendentals_anywhere_in_src` FAILED, 4 trafienia:
  `three.rs:687 metavariable call .$f(`, `:692 method .sin(`, `:692 path ::cos`,
  `:692 bare `tan` in a macro`.
- **Mutacja B** (cofnięta): `from_euler_xyz` i obie pętle
  `hex_prism_no_bottom` wrócone na libm przez `type R = f64; R::sin/cos` →
  FAILED 3 testy: skaner (10 trafień `path ::sin/::cos`),
  `pick_quat_from_euler_xyz_uses_v8_trig` (`from_euler_xyz(7.853981633974482e-1,0,0) w`:
  `…189` vs V8 `…190`), `pick_hex_prism_vertices_use_v8_trig`
  (`r=1.0000000164645264 vertex 4 (k=4) x`: `3210589143` vs V8 `3210589144`).
  Numeryka łapie powrót na libm niezależnie od skanera.

## Strażnicy numeryczni `pick/**` (runda 2, zarzut 4)

- `pick_quat_from_euler_xyz_uses_v8_trig`: na każdym kącie z wektorów V8
  (`tests/fixtures/jsmath/{sin,cos}.bin`, bez zmian), gdzie glibc ≠ V8,
  `PickQuat::from_euler_xyz` po każdej osi daje bity V8 w `f64` (`to_bits`).
- `pick_hex_prism_vertices_use_v8_trig`: stałe V8 `Math.sin/cos((k/6)*(Math.PI*2)+0)`
  dla k=0..6 zarejestrowane node v22.22.0 (komenda w teście). `hex_prism_no_bottom`
  zwraca pozycje WYŁĄCZNIE jako bufor `f32` (`TriGeometry.positions: Vec<f32>`,
  publiczna sygnatura bez zmian), więc asercja `f64` na wierzchołku jest
  niemożliwa bez zmiany API; zamiast tego promień `DISCRIMINATING_RADIUS =
  f64::from_bits(0x3ff0_0000_046b_6f03)` dobrany tak, że `r·sin(4π/3)` V8
  (`…ca9`) i glibc (`…ca8`) lądują po różnych stronach granicy zaokrąglenia
  `f32` — test sam asertuje tę rozłączność. Sprawdzane są wszystkie 4 pierścienie
  (torso ×2, cap górny, cap dolny) × 7 wierzchołków × (x, z) dla r ∈ {1, 0.75,
  DISCRIMINATING_RADIUS}.
- `terrain_rotation_uses_v8_trig` (zarzut 5): referencja „libm” jest teraz
  jawnie budowana z `f64::sin/cos` (platforma) tym samym drzewem wyrażeń co
  `setFromEuler`; komentarz poprawiony. Licznik informacyjny pokazuje teraz
  `2 angles where platform libm and V8 differ after f32 storage` (w r1 zawsze 0,
  bo porównywał jsmath z jsmath).
- `pick/camera.rs` (`tan(25°)`, `sin/cos(52°)`): bity libm == V8 (pomiar r1,
  potwierdzony przez Evaluatora), więc numerycznie nierozróżnialne — chronione
  wyłącznie skanerem; `pick_golden` 7/7 pokrywa wynik.

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
nie mają trafień w grepie. Od rundy 2 są też skanowane (cały `src/`).

## Gate (pełne logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1/01-operator-r1.md`)

- `cargo fmt --all -- --check` → `EXIT=0`
- `cargo clippy --locked --all-targets -- -D warnings` → `EXIT=0`
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` → `EXIT=0`
- `cargo test --locked --all-targets` → `EXIT=0`, 103 testy ok, 0 failed (r1).
- Runda 2 (logi: `03-operator-r2.md`): fmt/clippy/clippy+gpu `EXIT=0`, test `EXIT=0`, 105 ok, 0 failed (`jsmath_wiring` 6/6).

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
