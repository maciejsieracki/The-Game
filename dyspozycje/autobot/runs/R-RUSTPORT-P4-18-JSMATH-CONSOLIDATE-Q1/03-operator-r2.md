STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1
GOAL: Cała matematyka JS w `rust-port/renderer` idzie przez `crate::jsmath`; `jstrig.rs` tylko re-eksportuje; `pick/**` i `core/**` przepięte; skaner obejmuje `pick/core/models/camera.rs` (od r2: cały `src/`) i wykrywa obejścia; dowód `git grep`; fixtury i publiczne sygnatury bez zmian.
ZMIANY/COMMIT: baza = commit Operatora r1 `162d2f08` (rodzic `bf59164b`). Zmienione w r2: `rust-port/renderer/tests/jsmath_wiring.rs`, `dyspozycje/rust-port/p4/P4-18-JSMATH-CONSOLIDATE.md`, ten plik. `src/**` i `tests/fixtures/**` bez zmian względem r1. SHA: w raporcie zwrotnym (commit z tym plikiem).
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO

# Obrona — odpowiedzi na zarzuty Evaluatora r1 (`02-evaluator-r1.md`, `719b1ca0`)

## Zarzut 1 — skaner nie wykrywa wywołań ze spacjami (metody na surowym tekście). PRZYJMUJĘ.
Poprawka: skaner liniowy zastąpiony lekserem tokenów (`lex()` w teście): komentarze,
stringi, raw stringi i literały znakowe usunięte, `r#ident` rozwinięty, `::` jeden token.
Reguła metody: `.` + nazwa + `(`/`::<` niezależnie od białych znaków i łamania linii.
Dowód: `scanner_catches_known_bypass_forms` zawiera `x.sin ()`, `x . cos()`,
`x.atan2 (y)`, `x.powf (2.0)`, `x.exp ()`, `x.sin_cos ()`, `x\n    .sin()`,
`#[rustfmt::skip]\nlet s = x.sin ();`, `x.r#sin()`, `x.powf::<>(2.0)` — wszystkie wykryte.
Mutacja A (niżej) — `x.sin ()` w `#[rustfmt::skip]` wykryte.

## Zarzut 2 — obsługa makr pozorna (`macro_rules!` z `$v.$f()`). PRZYJMUJĘ.
Poprawka: (a) w każdym wywołaniu makra `name!(…)`/`[…]`/`{…}` i w ciele `macro_rules!`
goła nazwa z `FN_NAMES` jest trafieniem (`probe_call!(x, tan)`); (b) `. $f (` i `:: $f (`
w makrze to trafienie (wywołanie z nazwą od wywołującego); `Self::$v` bez wywołania jest
dozwolone (istniejące `catalogue!`/`bases!` w `models/unit_core`). Ponieważ skan obejmuje
teraz cały `src/`, a crate nie ma zależności z makrami (jedyna: `wgpu`, opcjonalna),
każde wywołanie makra przekazujące nazwę funkcji jest skanowane. `paste!`/`concat_idents!`
dalej zakazane. Dowód: mutacja A — `metavariable call .$f(` i `bare `tan` in a macro`.

## Zarzut 3 — alias typu `type R = f64; R::cos` niewykrywany. PRZYJMUJĘ.
Poprawka: reguła ścieżkowa nie wymaga już typu `f64/f32` przed `::` — każde `:: nazwa`,
które nie jest prefiksem modułu (`:: nazwa ::`), jest trafieniem (alias, generyk `T::sin`,
`<f64 as Float>::sin`, `map(f64::cos)`). Fałszywych trafień brak: `mod hypot; pub use
hypot::{…}` (prefiks modułu), `f64::consts::PI`, `f64::max` — w przypadkach „ok”.
Dowód: mutacja A (`path ::cos` dla `ProbeR::cos(x)`), mutacja B (10 × `path ::sin/::cos`).

## Zarzut 4 — brak numerycznej ochrony `pick/**`. PRZYJMUJĘ (z jednym odstępstwem formy).
Poprawka: dwa nowe testy w `tests/jsmath_wiring.rs`:
- `pick_quat_from_euler_xyz_uses_v8_trig` — `to_bits` w `f64` dla każdej osi
  `PickQuat::from_euler_xyz` na wszystkich kątach z wektorów V8
  (`tests/fixtures/jsmath/{sin,cos}.bin`), gdzie glibc ≠ V8.
- `pick_hex_prism_vertices_use_v8_trig` — stałe V8 dla θ = (k/6)·(2π), k = 0..6,
  zarejestrowane node v22.22.0 (komenda w doc-komentarzu testu; θ=4π/3: sin `0xbfebb67ae8584ca9`).
  ODSTĘPSTWO: asercja w `f64` na wierzchołku jest niewykonalna bez zmiany publicznego API —
  `hex_prism_no_bottom` zwraca `TriGeometry { positions: Vec<f32> }` (rzutowanie `x as f32`
  w `pick/terrain.rs`), a dispatch zakazuje zmiany sygnatur i ogranicza `pick/**` do
  przepięcia. Zamiast tego promień `f64::from_bits(0x3ff0_0000_046b_6f03)` dobrany tak, by
  `r·sin(4π/3)` V8 i glibc (`…ca8`) trafiały po różnych stronach granicy zaokrąglenia `f32`;
  test sam to asertuje (`assert_ne!`), więc bitowa asercja `f32` rozróżnia libm od V8.
Dowód: mutacja B — oba testy FAILED (`from_euler_xyz(7.853981633974482e-1,0,0) w`:
4604544271217802189 vs 4604544271217802190; `vertex 4 (k=4) x`: 3210589143 vs 3210589144).

## Zarzut 5 — `terrain_rotation_uses_v8_trig` porównuje jsmath z jsmath, mylący komentarz. PRZYJMUJĘ.
Poprawka: referencja platformowa budowana jawnie z `x.sin()/x.cos()` (plik testowy, nie
skanowany) tym samym drzewem wyrażeń `setFromEuler`; komentarz mówi wprost, że od P4.18
`PickQuat::from_euler_xyz` nie jest referencją libm. Dowód: licznik informacyjny
`instance_matrix: 2 angles where platform libm and V8 differ after f32 storage` (r1: 0).

## Uwagi nieblokujące Evaluatora — PRZYJĘTE.
Skan obejmuje cały `src/` rekurencyjnie (69 plików, próg `>= 60`; asercja obecności 16 plików
w tym `lib.rs`, `view.rs`, `overlays.rs`, `text.rs`, `material.rs`, `gpu.rs`). Nowy plik
najwyższego poziomu jest skanowany automatycznie. Dodatkowo zakazane: `extern` (FFI),
`include!`, `#[path]`, `intrinsics`, `mul_add` (FMA ≠ JS `a*b+c`), `powi`.

## Mutacje (wszystkie cofnięte, `git status` przed commitem: tylko 3 pliki z listy wyżej)

Mutacja A — `src/pick/three.rs`, przed `triangle_normal`:
```
type ProbeR = f64;
macro_rules! probe_call { ($v:expr, $f:ident) => { $v.$f() }; }
#[must_use]
#[rustfmt::skip]
pub fn probe_a(x: f64) -> f64 { x.sin () + ProbeR::cos(x) + probe_call!(x, tan) }
```
Wynik `cargo test --locked --test jsmath_wiring`:
```
test no_platform_transcendentals_anywhere_in_src ... FAILED
src/pick/three.rs:687: metavariable call .$f(: $v.$f()
src/pick/three.rs:692: method .sin(: pub fn probe_a(x: f64) -> f64 { x.sin () + ProbeR::cos(x) + probe_call!(x, tan) }
src/pick/three.rs:692: path ::cos: pub fn probe_a(x: f64) -> f64 { x.sin () + ProbeR::cos(x) + probe_call!(x, tan) }
src/pick/three.rs:692: bare `tan` in a macro: pub fn probe_a(x: f64) -> f64 { x.sin () + ProbeR::cos(x) + probe_call!(x, tan) }
test result: FAILED. 5 passed; 1 failed
```

Mutacja B — `from_euler_xyz`: `type R = f64; let c1 = R::cos(x / 2.0); …` (6 wywołań);
`hex_prism_no_bottom` obie pętle: `type R = f64; (R::sin(theta), R::cos(theta))`.
```
test pick_hex_prism_vertices_use_v8_trig ... FAILED
test pick_quat_from_euler_xyz_uses_v8_trig ... FAILED
test no_platform_transcendentals_anywhere_in_src ... FAILED
assertion `left == right` failed: r=1.0000000164645264 vertex 4 (k=4) x
  left: 3210589143
 right: 3210589144
assertion `left == right` failed: pick from_euler_xyz(7.853981633974482e-1,0,0) w
  left: 4604544271217802189
 right: 4604544271217802190
src/pick/terrain.rs:206: path ::sin / ::cos (×2), :231 (×2)
src/pick/three.rs:203-208: path ::cos ×3, path ::sin ×3
```

## Dowód `git grep` (z `\s*`, metody i ścieżki, cały `src`)
```
git grep -nE '(\.|::)\s*(r#)?(sin|cos|tan|sin_cos|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|exp2|exp_m1|ln|ln_1p|log|log10|log2|powf|powi|hypot|cbrt|mul_add)\s*(\(|::<|\)|,)|libm|intrinsics|macro_rules' -- rust-port/renderer/src | grep -vE ':\s*//'
rust-port/renderer/src/jsmath/trig.rs:494:        return f64::NAN; // fdlibm: `x - x` (Inf or NaN in, NaN out)
rust-port/renderer/src/jsmath/trig.rs:514:        return f64::NAN; // fdlibm: `x - x` (Inf or NaN in, NaN out)
rust-port/renderer/src/jsmath/trig.rs:534:        return f64::NAN; // fdlibm: `x - x` (Inf or NaN in, NaN out)
rust-port/renderer/src/models/unit_core/parts.rs:15:macro_rules! catalogue {
rust-port/renderer/src/models/unit_core/registry.rs:27:macro_rules! bases {
```
Trafienia `trig.rs` to słowo `fdlibm` w komentarzu końcowym linii; dwa `macro_rules!` to
katalogi enumów (bez nazw z `FN_NAMES`, skaner tokenowy je przepuszcza). Wywołań: 0.

## Gate (czysty `CARGO_TARGET_DIR` w scratch, `rust-port/renderer`)
```
cargo fmt --all -- --check                                        FMT EXIT=0
cargo clippy --locked --all-targets -- -D warnings                Finished `dev` profile … CLIPPY EXIT=0
cargo clippy --locked --all-targets --features gpu -- -D warnings Finished `dev` profile … CLIPPY-GPU EXIT=0
cargo test --locked --all-targets                                 TEST EXIT=0
```
`test result` per binarka: lib 7, assets_nturns 6, assets_registry 14, camera_web_parity 5,
core_web_parity 8, cpu_sanity 1, geom_three_parity 17, gpu_probe 0, jsmath_v8_parity 13,
jsmath_wiring 6, pick_golden 7, terrain_web_parity 5, unit_core_json 0,
unit_core_model_rule 7, unit_core_trig 2, unit_core_web_parity 3, wonders_web_parity 4
→ 105 passed, 0 failed (r1: 103; +2 nowe testy numeryczne `pick`).

`tests/fixtures/**`: bez zmian (`git diff --stat 162d2f08 -- rust-port/renderer/tests/fixtures` pusty).
Publiczne sygnatury: `src/**` bez zmian względem r1.

BLOKADY: brak. ZAŁOŻENIE (r1) o sprzeczności `pick/**` w dispatchu utrzymane (Evaluator je przyjął).
NASTĘPNY KROK: Evaluator r2 (ten sam ID).
