STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1
GOAL: Cała matematyka JS w `rust-port/renderer` idzie przez `crate::jsmath`. `jstrig.rs` tylko re-eksportuje, `pick/**` i `core/**` są przepięte, skaner `tests/jsmath_wiring.rs` obejmuje cały `src/` i wykrywa obejścia, jest dowód z `git grep`. Fixtury i publiczne sygnatury bez zmian.

ZMIANY-COMMIT:
- Oceniany kod: `23f68682` (Obrona r2) ← `162d2f08` (Operator r1) ← `bf59164b` (= aktualny `origin/rust-port/parity-v2`, sprawdzone `git rev-parse`).
- Raport Evaluatora r1 `719b1ca0` (gałąź boczna na `162d2f08`, tylko `02-evaluator-r1.md`) przeniesiony cherry-pickiem jako `4233d87e` na `23f68682`. Ten raport FC jest commitem na `4233d87e`.
- Kolejność integracji (fast-forward na `origin/rust-port/parity-v2`): `162d2f08` → `23f68682` → `4233d87e` → commit FC.
- Diff `bf59164b..23f68682`: 9 plików, wszystkie z allowlisty (`jstrig.rs`, `pick/{three,terrain,camera}.rs`, `core/hex_shape.rs`, `tests/jsmath_wiring.rs`, dokument P4-18, raporty runu). `tests/fixtures/**`, `Cargo.toml` i `Cargo.lock` bez zmian. `git diff --check` czysty.

TESTY (wykonane samodzielnie, czysty `CARGO_TARGET_DIR` w scratch, HEAD `23f68682`):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0. To samo z `--features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0, 105 przeszło, 0 nie przeszło (`jsmath_wiring` 6/6, `pick_golden` 7/7, `unit_core_trig` 2/2, `core_web_parity` 8/8).
- Stałe V8 w teście `pick_hex_prism_vertices_use_v8_trig` sprawdzone niezależnie w node v22.22.0: `V8_PRISM_SIN/COS` zgodne bit w bit. f32 wierzchołka 4 przy `DISCRIMINATING_RADIUS` daje `3210589144`. glibc (python) daje `-0x1.bb67ae8584ca8p-1`.
- Własna próbka wektorów z node (V8), 4501 przypadków, porównanie `to_bits`: 3000 × `pick::three::Quat::from_euler_xyz` (losowe kąty z |x| ≤ 10), 500 × `PickCamera::position`, 500 × `core::hex_shape::hex_ring_points_xz`, 500 × pozycje f32 z `hex_prism_no_bottom`, a także `projection.e[5]` (`js_tan`). Wynik: **0 niezgodności**. Na wersji z mutacją na libm ta sama próbka daje 478 niezgodności, więc jest dyskryminująca.
- Mutacja FC: `from_euler_xyz` przez alias `type FcR = f64; FcR::cos/sin`, oba pierścienie `hex_prism_no_bottom` i `hex_shape` wrócone na `.sin()/.cos()`. Nie przeszły `no_platform_transcendentals_anywhere_in_src` (12 trafień), `pick_quat_from_euler_xyz_uses_v8_trig` i `pick_hex_prism_vertices_use_v8_trig`. Mutacje cofnięte, pliki sond usunięte, `git status` czysty.
- Własne sondy skanera: `x.sin\n(\n)`, `(x).sin/*c*/()`, `<f64 as Trait>::sin\n(x)`, `f64 :: cos (x)`, makro `$v.$f $a` z `m!(x sin ())`, `fn`-wskaźnik `f64::exp`, metoda w `impl` traitu, `core::f64::math::sin`, `.asinh()`. **Wszystkie wykryte.**
- `git grep -nE` (formy `.\s*name\s*(`, `::\s*name\s*(`, `libm`) po `src/` poza `jsmath/`: same komentarze.

ORZECZENIA (zarzuty Evaluatora r1):
1. Spacje, `#[rustfmt::skip]` → ODDAL. Lekser tokenów naprawił problem. Wszystkie 8 form jest w teście, a moje sondy też są wykrywane.
2. `macro_rules!` z `$v.$f()` → ODDAL. Wykrywane są metazmienne w wywołaniach i gołe nazwy w makrach (potwierdzone mutacją Obrony i moją sondą).
3. Alias typu `R::cos` → ODDAL. Każde `::name` nie będące prefiksem modułu jest trafieniem, potwierdzone mutacją `FcR::cos`.
4. Brak numerycznego strażnika `pick/**` → ODDAL. Są dwa testy `to_bits` względem V8. Pozycje pryzmatu są f32 w publicznym API, więc promień dyskryminujący to uzasadnione odstępstwo formy, sprawdzone w teście przez `assert_ne!` i u mnie w node.
5. Mylący test `terrain_rotation_uses_v8_trig` → ODDAL. Referencja libm jest teraz jawna (`x.sin()/x.cos()`), komentarz poprawiony.

BLOKADY: brak.
UWAGI NIEBLOKUJĄCE (do osobnego tematu, nie wpływają na werdykt):
- Skaner nie wykrywa `#[cfg_attr(…, path = "…")] mod m;` (wykrywa tylko `#[path]` bezpośrednio). Teoretycznie można tak dołączyć plik spoza `src/`. To forma celowej sabotażu, widoczna w diffie, i nie było jej w zarzutach. Zalecane dopisanie `path` wewnątrz `cfg_attr`.
- `core::hex_shape` jest pilnowany tylko skanerem: mutacja na libm nie wywaliła `core_web_parity`. Moja próbka pokazuje parity V8 obecnej wersji.
- Nieaktualny komentarz `src/models/unit_core/model.rs:449` jest poza allowlistą (zgłosił go Operator).
- ZAŁOŻENIE o sprzeczności dispatchu co do `pick/**` (allowlista vs „Zero zmian”) zostaje utrzymane. Zmiany w `pick` to wyłącznie przepięcie na `jsmath`.
- Ocena wzrokowa: NIE_ZMIERZONO (brak GPU). Lista „co ocenić po RR-T5” jest w dokumencie P4-18.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (fast-forward `origin/rust-port/parity-v2` do commitu FC, kolejność jak wyżej), potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
