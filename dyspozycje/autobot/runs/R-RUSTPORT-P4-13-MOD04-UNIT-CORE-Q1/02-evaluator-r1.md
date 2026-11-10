STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1
GOAL: Paczka MOD-04: rdzeń modeli jednostek w Rust z naprawą D-MOD-9=A, stuby `NotYetPorted` dla paczek 5–7, zgodność bitowa z webem `edb8fb56`.
ZMIANY/COMMIT: Evaluator ocenił `1b52238d` (kod) i `9c30aff8` (dokumentacja) na bazie `69f432ba`. Jedyna zmiana Evaluatora to ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdziłem i jak

1. **Allowlista i baza.** `69f432ba` jest przodkiem `9c30aff8`. Poza allowlistą zmienił się tylko `src/models.rs` (+1 linia `pub mod unit_core;`), co jest zgodne z założeniem Z1, bo w bazie nie ma `models/mod.rs`. `lib.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`, `geom/pick/assets/camera/terrain` są bez zmian. `git diff --check 69f432ba 9c30aff8` kończy się `0`. W `unit_core` nie ma `unsafe`.
2. **Bramki w czystym targecie** (`CARGO_TARGET_DIR` w scratch, drzewo `9c30aff8`):
   - `cargo fmt --all -- --check` EXIT=0;
   - `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0;
   - `cargo clippy --locked --all-targets -- -D warnings` EXIT=0;
   - `cargo test --locked --all-targets -- --nocapture` EXIT=0, 15 celów, 0 failed.
   Wydruki diagnostyczne są zgodne z raportem: 68 przypadków, 61 porównanych, 111368 wartości, 7 stubów (`cat:domyslny|falanga|lucznik|nieznana-kategoria|obleznicza|oszczepnik|zwiadowca`). Pozostałe liczby: 175 wywołań, 19 porównanych sygnatur, `names: 403`, `trig port_mismatch=0 libm_mismatch=792`.
3. **Bramki na próbnym scaleniu z aktualnym `origin/rust-port/parity-v2` @ `d925acb3`** (zawiera P4.14 `wonders`):
   - jedyny konflikt jest w `src/models.rs` i dotyczy jednej linii (`unit_core` i `wonders`), rozwiązanie to obie linie;
   - fmt, clippy (×2) i test kończą się EXIT=0 w czystym targecie;
   - scalenie przerwano (`git merge --abort`).
4. **Odtworzenie fixture według README.** Środowisko: npm `three@0.169.0` + `esbuild@0.24.0`, `git archive edb8fb56 gra/src gra/data`, node v22.22.0. Wywołania i wyjście generatorów:
   - `node build.mjs` → `gen.mjs`;
   - `node gen.mjs` wypisuje `unit_core cases=68 records=77 names=33`;
   - `node gen_trig.mjs` wypisuje `trig samples=11226`.
   SHA-256 są **identyczne bajtowo** z commitem: `unit_core.json` 6bb8b2a4…6c28e48, `trig.json` 66c841d9…c577df0. `build.mjs` dopisuje wyłącznie linię `export {…}`, co sprawdziłem w kodzie.
5. **88 `getGeo*` i 20 `getGeoNH*`.** W `units.ts@edb8fb56` jest 88 unikalnych `function getGeo*` (bez NH), a w `kon-nowy-model.ts` 20. Test `part_catalogues_match_the_web_singletons` porównuje dla każdej części liczbę wierzchołków, liczbę trójkątów i hash FNV pozycji, normali, uv, indeksów i grup. Do tego 65 kluczy `p1Geos` ma wektory.
6. **D-MOD-9=A.** `model_for(&UnitTypeId)` czyta statyczną tabelę 77 wierszy (75 PL + Osadnik i Robotnik). Nazwa EN zwraca `None`.
   - Test `legacy_en_path_reproduces_exactly_the_three_web_divergences` wymaga, żeby różnica tras PL/EN w Rust występowała dokładnie tam, gdzie w webie różnią się sygnatury EN i PL, i żeby takich przypadków było dokładnie 3: Harappa→p1 włócznik, topór→`CatTopor`, żelazny khopesh→`KhopeshWarrior`.
   - Pozostałe 72 rekordy są 1:1 (`table_equals_the_legacy_pl_route…`).
   - Odchylenie jest jawnie opisane w dokumencie, §4, zgodnie z P4-7 §4.2.
7. **Brak duplikatów prymitywów `geom`.** `Prim::build` deleguje do `geom::{box,cylinder,cone,sphere,torus,icosahedron,shape}_geometry`. Własne są tylko:
   - `leaf_blade_geometry` (`makeLeafBladeGeo` weba) i `hex_ring` (na `geom::shape_geometry`);
   - `quat_from_unit_vectors`, którego `geom` nie ma;
   - `quat_from_euler`, czyli ta sama formuła z trygonometrią V8 (Z7, jawne).
   W crate nie ma innego FNV ani bbox.
8. **Delegacje 5–7.** `registry::pending()` zwraca wszystkie `Base` z pakietem ≠ MOD-04, czyli 73 = 10 + 38 + 25. Lista jest kompletna względem tabeli (37 + 24 + 10) oraz `LegionRzymski` i `HastatiOld` (galeria, P4-7 §4.1 #5–6). Delegacje `case` weba (`falanga`, `lucznik`, `oszczepnik`, `zwiadowca`, `obleznicza`→`buildBatteringRam`→Opus5, `domyslny`) sprawdziłem w `units.ts:3704-4765` (case `falanga` :3704 … `domyslny`/`default` :4762-4765). Test wymusza, żeby każdy stub wskazywał właściwy `Base`.
9. **Własne mutacje Evaluatora** (inne niż M01–M20 Operatora), wszystkie **wykryte (4/4)**:
   - kolor włosów `build_celt_warrior` (`named_unused.rs:213`);
   - biodro `p1::build_zwiadowca` (`p1.rs:574`);
   - metalness `m_owner` (`category.rs:606`);
   - offset Y (`category.rs:290`).
   Drzewo przywrócone, `git status` czysty.

## Zarzuty (ponumerowane; żaden nie jest wadą poprawności, wszystkie nieblokujące)

1. **Kryterium dispatchu „reprezentatywne jednostki z `units.json`, min. po jednej na kategorię” nie jest spełnione dosłownie, a odstępstwo nie ma statusu ZAŁOŻENIA.** Pełnym drzewem porównano 6 rekordów PL (Galera, 3 rydwany, 2 cywilne) i 6 wywołań EN. Pozostałe kategorie weryfikowane są tylko generycznym `case` z `buildCategoryModel`, bo ich rekordy prowadzą do builderów paczek 5–7, które są stubami. Uzasadnienie jest merytorycznie poprawne, ale powinno trafić do §1 jako Z9 (z liczbami), a §5.2 powinien to powiedzieć wprost.
2. **Surowy log `logi/test.txt` jest bez `--nocapture`**, więc liczby z §0/§9 (111368 wartości, 175 wywołań, 403 nazwy, 792 rozbieżności libm) nie mają surowego logu w artefaktach Operatora. Evaluator odtworzył je wyżej. Do uzupełnienia: log z `--nocapture`.
3. `logi/mutate.txt` nie ma linii `EXIT=`. Wynik `detected 20/20` jest, ale kontrakt logów wymaga EXIT.
4. **Integracja: duplikat portu fdlibm w crate.** Na `parity-v2` jest już `models/wonders/js_trig.rs` (P4.14), funkcjonalnie ten sam port co `models/unit_core/jstrig.rs`. Po scaleniu crate będzie miał dwie kopie. Rekomendacja dla orkiestratora: osobny temat konsolidacji jednej implementacji `Math.sin/cos` V8, razem z propozycją Operatora przełączenia `geom/camera/pick/terrain`. Poza allowlistą tej rundy, więc nie blokuje.
5. `quat_from_euler` (`model.rs:453-455`) sprawdza porządek `XYZ` tylko przez `debug_assert_eq!`. W release Euler o innym porządku dałby cicho zły kwaternion. Dziś nieosiągalne, bo wszystkie buildery używają `rot_x/y/z` z porządkiem domyślnym. Do rozważenia: `assert!` albo typ bez pola `order`.

## Werdykt
PASS-WITH-NOTES. Bramki są zielone w czystym targecie, także na scaleniu z `d925acb3`. Fixture odtworzono bajtowo z uruchomionego weba, zgodność jest bitowa, a reguła D-MOD-9 i stuby 5–7 są kompletne i wymuszone testami. Zarzuty 1–3 to uzupełnienie dokumentacji i logów, które można zrobić w integracji albo w kosmetycznej rundzie Operatora. Zarzuty 4–5 to sprawy dla orkiestratora.

NASTĘPNY KROK: Final Control (Opus 5.5 medium) na `9c30aff8` + ten raport; przy integracji rozwiązać konflikt `models.rs` (obie linie) i zarejestrować temat konsolidacji `jstrig`/`js_trig`.
