STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1
GOAL: Cała matematyka JS w `rust-port/renderer` idzie przez `crate::jsmath`: `jstrig.rs` tylko re-eksportuje, `pick/**` i `core/**` są przepięte, skaner `tests/jsmath_wiring.rs` obejmuje `pick/core/models/camera.rs` i wykrywa obejścia, jest dowód z `git grep`, fixtury i publiczne sygnatury bez zmian.
ZMIANY/COMMIT: ocena commita `162d2f08` (rodzic `bf59164b` = aktualny `origin/rust-port/parity-v2`). Evaluator dodał tylko ten plik. Zmiany próbne (mutacje, sonda) zostały cofnięte, `git status` był czysty.
TESTY: (czysty target `CARGO_TARGET_DIR=<scratch>/tgt`)
- `cargo fmt --all -- --check`: EXIT=0. `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0. To samo z `--features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0. Suma testów z 17 binarek to 103.
- `git diff --stat bf59164b 162d2f08`: 8 plików, wszystkie z allowlisty (`pick/**` dopuszczone w GOAL, pkt 2). `tests/fixtures/**` bez zmian, `src/camera.rs`, `geom`, `terrain`, `assets` bez zmian.
- `git grep` z `\s*` po całym `src` (poza `jsmath/`): są tylko komentarze, wywołań brak.
- Node (V8): `Math.sin(4/6*2π)` daje `bfebb67ae8584ca9`, a glibc daje `...ca8`. `js_sin` daje `...ca9`. `tan(25°)` oraz `sin/cos(52°)` mają identyczne bity w libm, V8 i jsmath. Twierdzenia Operatora o sondzie się potwierdzają.
- Skaner sprawdziłem harnessem (`forbidden_hits`, skopiowane 1:1). Formy NIEWYKRYTE: `x.sin ()`, `x . cos()`, `x.sin( )`, `x.atan2 (y)`, `x.powf (2.0)`, `x.exp ()`, `x.sin_cos ()`, `x.tan ()`, `x.ln ()`, `type R = f64; R::sin(x)`, `macro_rules!` z `$v.$f()`.
- Mutacja A w `src/pick/three.rs`: dodane `#[rustfmt::skip] fn probe_a(x) { x.sin () }`, `type ProbeR = f64; ProbeR::cos(x)` oraz `macro_rules! probe_call { ($v:expr,$f:ident)=>{$v.$f()} }; probe_call!(x, tan)`. fmt, clippy i `jsmath_wiring` 4/4 są ZIELONE.
- Mutacja B: semantyczny powrót `Quat::from_euler_xyz` oraz obu pętli `hex_prism_no_bottom` na libm (`type P = f64; P::cos/sin`). `cargo test --all-targets` jest ZIELONY (103/103).
BLOKADY / ZARZUTY:
1. Raport i dokument mówią, że skaner wykrywa „wywołania ze spacjami”, a to nieprawda. Białe znaki są usuwane tylko dla form ścieżkowych. Formy metodowe są sprawdzane na surowym `code`, więc `x.sin ()` itd. przechodzą (patrz harness i mutacja A). `rustfmt` nie chroni przed tym w `#[rustfmt::skip]` ani w ciałach makr.
2. Obsługa makr jest pozorna. Wykrywane są tylko `paste!`/`concat_idents!`, a lokalne `macro_rules!` z `$v.$f()` + `m!(x, sin)` przechodzi (mutacja A).
3. Obejście przez alias typu (`type R = f64; R::cos(x)`) nie jest wykrywane (mutacja A i B). Wykrywane są tylko prefiksy `f64`/`f32`/`<f64…>`.
4. Brak numerycznej straży dla `pick/**`. Pełny powrót `from_euler_xyz` i pryzmatu na libm (mutacja B) przechodzi wszystkie 103 testy, więc „mutacje wykrywane” dotyczy tylko jednej formy tekstowej (`<f64>::cos(`). Twierdzenie „zgodność wynika z kodu” nie jest pilnowane żadnym testem bitowym `f64`. Brakuje np. asercji `to_bits` `PickQuat::from_euler_xyz` i `hex_prism_no_bottom` (wierzchołek θ=4π/3) względem wektorów V8 z `tests/fixtures/jsmath/*.bin` albo wektora z node.
5. W `tests/jsmath_wiring.rs` (allowlista, plik zmieniony przez Operatora) `terrain_rotation_uses_v8_trig` nadal liczy zmienną `libm` przez `PickQuat::from_euler_xyz`, a komentarz mówi „differ from the libm one”. Po P4.18 ta funkcja jest oparta o jsmath, więc porównanie jest jsmath vs jsmath, `f32_visible` jest zawsze 0, a pomiar w `eprintln!` stracił sens i wprowadza w błąd. Do poprawy: liczyć referencję libm jawnie (`x.sin()` w teście jest dozwolone) albo usunąć ten fragment.
UWAGI (nieblokujące): skaner nie obejmuje `src/{view,overlays,text,material,gpu,lib}.rs` ani `assets/**`, a nowy plik najwyższego poziomu nie zostanie przeskanowany. Warto skanować cały `src` z listą wyjątków. ZAŁOŻENIE Operatora co do sprzeczności `pick/**` w dispatchu przyjmuję. `jstrig` zachowuje ścieżki `js_sin/js_cos/JsTrig`, sygnatury się nie zmieniły.
RUNDY: 1/5
NASTĘPNY KROK: powrót do Operatora (ten sam ID, runda 2): zarzuty 1-5, potem ponownie Evaluator.
DEPLOY/PUSH: NIE WYKONANO
