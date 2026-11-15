STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1
GOAL: Paczka MOD-03 z P4-4-MODEL-CATALOG: dekoracje terenu w Rust 1:1 z webem `edb8fb56`, bitowo; obrona r3 na zarzuty Evaluatora r3.

ZMIANY/COMMIT:
- Baza: `origin/rust-port/parity-v2` @ `95930b446` (HEAD; zawiera `b338830eb` i P4.27). Gałąź robocza `p417-obrona-r3` w worktree Workflow, BEZ push.
- Commit kodu r3: `0dadaac3b` (jeden commit nad `95930b446`, jawny `git add`, `git diff --cached --check` czysty). Raport: osobny commit nad nim.
- Pliki (wszystkie w allowliście):
  - `rust-port/renderer/src/decor/js.rs` (usunięte martwe `Box3::{empty, expand, is_empty}`);
  - `rust-port/renderer/tests/decor_web_parity.rs` (asercje liczby rekordów, test SHA-256, test znaku zera bbox, tokenowy strażnik float + jego test);
  - `rust-port/renderer/tests/fixtures/decor/{SHA256SUMS, .gitattributes, box_sign.mjs, box_sign.json, README.md}`;
  - `dyspozycje/rust-port/p4/P4-17-MOD03-TERRAIN-DECOR.md` (STATUS z obiema bazami, §6, nowy §11);
  - w tym katalogu: `logs/r3-*.txt`, `mutacje/{mutants.txt, run.sh, final-r3.txt}`, ten raport.
- Zero zmian w `gra/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain,scene}/**`, `Cargo.lock`.

ODPOWIEDZI NA ZARZUTY (szczegóły i dowody: P4-17 §11):
1. Inna baza w logach i dokumencie: PRZYJMUJĘ.
   - Fakt potwierdzony: `jsmath_wiring` ma 4 testy na `bf59164bf` i 6 na `e1d69078d`/`95930b446`; `b338830eb` ma author 12:44:00, a committer 12:50:22 (przepisany przy integracji).
   - Poprawka: STATUS dokumentu opisuje obie bazy; §0–§10 oznaczone jako stan r2; logi r3 mają w nagłówku `git rev-parse HEAD`. Logów r2 nie edytowałem.
2. Kod na `parity-v2` przed E/FC, przedwczesny wpis `f23326304`: PRZYJMUJĘ fakt.
   - Korekta wpisu i integracji należy do orkiestratora (poza moją allowlistą). Rekomendacja: oznaczyć `f23326304` jako przedwczesny.
   - NIE_ZMIERZONO zamknięte. Decor na czystym `git archive 95930b446`: 8/8, 571 623 skalary, 0 rozbieżności (`logs/r3-head-95930b446-decor_nocapture.txt`). Fixtury `b338830eb..95930b446` bez zmian.
   - Obrona r3 stoi na HEAD, więc FC ocenia faktyczny stan razem z P4.27.
3. SHA-256 poza katalogiem fixtur i nieweryfikowane: PRZYJMUJĘ.
   - `SHA256SUMS` obejmuje 11 plików. Sprawdzają go testy `fixtures_match_sha256sums` oraz `sha256_matches_fips_180_test_vectors` (własna implementacja SHA-256, bez nowych zależności).
   - `.gitattributes eol=lf` chroni bajty plików.
   - Regeneracja r3 jest bajtowo identyczna (`logs/r3-regen.txt`). Mutanty M44 i M45 są zabite.
4. Brak asercji liczby rekordów: PRZYJMUJĘ.
   - Stałe `N_*` i `assert_count` sprawdzają liczbę FAKTYCZNIE porównanych rekordów w każdej sekcji (939/500/301/15/60 i pozostałe).
   - Mutanty M39, M41, M42 i M43 zabija komunikat `records compared`, a M40 strażnik ≥ 50 ziaren.
5. Luka mutacyjna w `Box3`: PRZYJMUJĘ.
   - Na HEAD `expand`/`is_empty` nie mają żadnego wołającego, bo pętla jest w `Scene::mesh_bounding_box` (P4.27). Usunąłem je, więc E09 przestaje istnieć.
   - Żywą pętlę przypina `bounding_box_keeps_web_sign_of_zero`: 6 przypadków z uruchomionego three r169 (min = −0, max = +0).
   - M37 (`f64::min`) i M38 (`f64::max`) w pętli bbox są zabite.
   - NaN w bbox: NIE_ZMIERZONO. `pick::three::js_min/js_max` są zdefiniowane „dla nie-NaN”, są poza allowlistą, a geometrie decor nie zawierają NaN.
6. Strażnik tylko tekstowy: PRZYJMUJĘ.
   - Skaner jest teraz tokenowy i pomija komentarze oraz literały. Wykrywa:
     - 26 funkcji jako metodę, ścieżkę po dowolnym typie lub aliasie, wskaźnik funkcji, wywołanie gołego importu albo element `use`;
     - `mul_add`, `libm` i `intrinsics` w każdej formie.
   - Test skanera: 21 przypadków pozytywnych i 13 negatywnych.
   - Mutanty M46–M49 (`mul_add`, `type F = f64; F::sin`, `.map(f64::cos)`, `f64::mul_add`) są zabite.
   - Ograniczenie: komentarze `/* */` nie są wycinane, co grozi tylko fałszywym alarmem.

TESTY (czysty `CARGO_TARGET_DIR` poza repo, surowe logi `logs/r3-*.txt`, każdy kończy się `EXIT=`):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
- To samo z `--features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0. 62 × `test result: ok`, w tym `decor_web_parity` 12/12, `jsmath_v8_parity` 14/14 i `jsmath_wiring` 6/6.
- Parytet: 571 659 skalarów (571 623 + 36 `box_sign`), 0 rozbieżności bitowych.
- Mutacje (`mutacje/final-r3.txt`): 49 mutantów, 45 zabitych, 3 równoważne (M05, M12, M18) i 1 NOCHANGE (M13, kod zastąpiony przez P4.27).
- Target i scratch usunięte; `df -h /`: 6,8 GB wolne.

BLOKADY: brak.
- Ocena wzrokowa: NIE_ZMIERZONO (brak GPU, lista w P4-17 §7).
- NaN w bbox: NIE_ZMIERZONO (`pick::three` poza allowlistą).
RUNDY: 3/5
NASTĘPNY KROK: Final Control na `0dadaac3b` i commicie raportu. Potem orkiestrator: ancestry względem `origin/rust-port/parity-v2` (dziś FF z `95930b446`) i korekta wpisu `f23326304`.
DEPLOY/PUSH: NIE WYKONANO
