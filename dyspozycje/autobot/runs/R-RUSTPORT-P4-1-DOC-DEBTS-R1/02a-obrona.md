# R-RUSTPORT-P4-1-DOC-DEBTS-R1 — obrona Operatora (odpowiedź na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (komentarze w kodzie Rust, bez zmiany zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R1
GOAL: zamknąć trzy długi dokumentacyjne (Q6-2 w units.rs, `river_reveal_keys` przy wyłączonej mgle w map.rs, numery linii pinu R5/STATCHIP)
BAZA: `ad1a2fb4a` (raport Evaluatora; rodzic `77dde4fb7` = Operator r1; baza tematu `0f77c9da3` = origin/rust-port/parity-v2)
ZMIANY/COMMIT: `rust-port/renderer/src/view/units.rs` (6 linii komentarza) + ten raport; SHA w sekcji „Commit” niżej
TESTY: patrz sekcja „Bramki”
BLOKADY: brak
RUNDY: obrona po Evaluatorze r1 (runda 1/5)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 1 (units.rs l. 17-18 i 99-101: stare numery `:16359`, `:16391-16394`) — PRZYJMUJĘ

Weryfikacja w pinie (`git show 07d2fbd72:gra/src/main.ts`, linie 16351-16396):
- 16360: `unitRenderer.setHighlight(qual);` (gałąź zakładania miasta),
- 16366: `unitRenderer.setHighlight(new Set(hexes.map(...)));` (gałąź cudu),
- 16387: `unitRenderer.clearHighlight();` (kopalnia złoża),
- 16392-16395: `unitRenderer.setHighlight(new Set(...), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY);`,
- 16396: `}` zamykające `refreshBuildHighlight`.

Poprawka (tylko komentarze `//!`, `///`, `//`):
- l. 17 i 99: `:16359` → `:16360`,
- l. 18 i 101: `:16391-16394` → `:16392-16395`,
- dodatkowo dla spójności z sekcją Q6-2 (l. 37) w tym samym pliku: l. 16 i 69 `main.ts:16351-16395` → `main.ts:16351-16396` (zakres całej funkcji, z klamrą zamykającą).

Dowód: `grep -n '16359\|16391' rust-port/renderer/src/view/units.rs` zwraca 0 trafień; wszystkie cytaty w pliku są teraz zgodne z sekcją Q6-2. `git diff --check` czysty.

Diff (`git diff -U0 ad1a2fb4a -- rust-port/renderer/src/view/units.rs`):
```
-//!   (`main.ts:16351-16395`): `FoundCity` / `Wonder` → `setHighlight(hexes)`
-//!   (default opacity, `:16359`, `:16366`); `Improvement` →
-//!   `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16391-16394`);
+//!   (`main.ts:16351-16396`): `FoundCity` / `Wonder` → `setHighlight(hexes)`
+//!   (default opacity, `:16360`, `:16366`); `Improvement` →
+//!   `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`);
-    /// `overlays.build_highlight` of the given kind (`main.ts:16351-16395`).
+    /// `overlays.build_highlight` of the given kind (`main.ts:16351-16396`).
-        // `setHighlight(qual)` / `setHighlight(new Set(...))` (`:16359`, `:16366`).
+        // `setHighlight(qual)` / `setHighlight(new Set(...))` (`:16360`, `:16366`).
-        // `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16391-16394`).
+        // `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`).
```
Wszystkie 12 zmienionych linii zaczynają się (po wcięciu) od `//`: 0 linii kodu.

## Zarzut 2 (te same stare numery poza allowlistą) — ODRZUCAM poprawkę w tym temacie; PRZYJMUJĘ uzupełnienie inwentarza

Powód odrzucenia poprawki: allowlista dispatchu obejmuje wyłącznie `renderer/src/view/units.rs`, `view-model/src/map.rs`, `renderer/src/cities/**`, `renderer/src/view/cities.rs` i katalog runs („Cokolwiek innego: NIE”). Edycja engine, testów engine/renderer/view-model albo `renderer/src/models/cities/**` byłaby naruszeniem allowlisty (natychmiastowy FAIL wg R-PROC-AUTOBOT §9), niezależnie od tego, że to tylko komentarze. Uwaga: `renderer/src/models/cities/renderer.rs` NIE leży pod `renderer/src/cities/**` (to osobny katalog `models/cities`), więc też jest poza allowlistą.

Uzupełnienie, którego zabrakło w raporcie Operatora r1 — pełny inwentarz (grep `16359|16391|16351-16395|657-680` po `rust-port/**/*.rs` na tej gałęzi, poza units.rs):

| Plik | Linia | Cytat | Właściwy numer w pinie |
|---|---|---|---|
| engine/src/domain/overlays_view.rs | 3, 234, 1159 | `16351-16395` | `16351-16396` (kosmetyka) |
| engine/src/domain/overlays_view.rs | 223 | `:16359` | `:16360` |
| engine/src/domain/overlays_view.rs | 238 | `:16391-16395` | `:16392-16395` |
| engine/tests/p4_1q6_2_build_highlight.rs | 247 | `main.ts:16359` | `:16360` |
| engine/tests/view_overlays_build.rs | 3 | `16351-16395` | `16351-16396` (kosmetyka) |
| engine/tests/view_overlays_build.rs | 75 | `16391-16395` | `16392-16395` |
| renderer/tests/overlays_units_q6.rs | 19, 258 | `16351-16395` | `16351-16396` (kosmetyka) |
| renderer/tests/overlays_units_q6.rs | 259-260 | `:16359`, `:16391-16394` | `:16360`, `:16392-16395` |
| view-model/src/overlays.rs | 156 / 161 | `16351-16395` / `:16391-16395` | `16351-16396` / `:16392-16395` |
| view-model/tests/pin_vectors.rs | 554 / 556 | `16351-16395` / `:16391-16395` | `16351-16396` / `:16392-16395` |
| view-model/tests/overlay_types_f1.rs | 224 / 226 | `16351-16395` / `:16391-16395` | `16351-16396` / `:16392-16395` |
| renderer/src/models/cities/renderer.rs | 591 | `cities.ts:657-680` | `cities.ts:740-763` (`applyFogVisibility`, pin l. 740, `}` l. 763) |
| renderer/tests/view_adapter_cities.rs | 439 | `cities.ts:657-680` | `cities.ts:740-763` |

Rekomendacja dla orkiestratora: osobny mikrotemat komentarzowy (np. `R-RUSTPORT-P4-1-DOC-DEBTS-R2`, Haiku, allowlista = pliki z tabeli), z tym samym skryptem „diff tylko komentarze”. Inwentarz Evaluatora uzupełniłem o `view-model/src/overlays.rs`, dwa testy view-model, `renderer/tests/view_adapter_cities.rs:439` oraz zakresy `16351-16395`.

## Uwaga 3 (weryfikacja Evaluatora) i uwaga 4 (bramki) — bez zarzutu, PRZYJMUJĘ jako potwierdzenie

Nie zawierają zarzutu do poprawienia. Zmiana obrony dotyczy tylko komentarzy w units.rs, więc twierdzenia Evaluatora o producencie i numerach pinu pozostają w mocy. Bramki powtórzone dla renderera (jedyny zmieniony crate) — niżej. view-model nie zmieniony w obronie (diff obrony wobec `ad1a2fb4a` nie dotyka `view-model/`), więc wynik Evaluatora (fmt/clippy/test EXIT 0, 109 testów) obowiązuje.

## Bramki (renderer, po poprawce)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach). Dysk przed bramką: 13 GB wolnego.

- skrypt „tylko komentarze”: `git diff -U0 | grep '^[+-][^+-]' | grep -vE '^[+-][[:space:]]*//' | wc -l` → `0`;
- `git diff --check` → czysty;
- `cargo fmt --check` (renderer) → EXIT 0;
- `cargo clippy --all-targets -- -D warnings` (renderer, kompiluje też view-model) → EXIT 0;
- `cargo test --all-targets --no-fail-fast` (renderer, w tle, EXIT do logu) → EXIT 0: 80 binarek, 687 zaliczonych, 0 nieudanych, 0 pominiętych;
- target usunięty, `Cargo.lock` przywrócony (nie commitowany).

## Commit

Lokalna gałąź `obrona/R-RUSTPORT-P4-1-DOC-DEBTS-R1`, rodzic `ad1a2fb4a`, bez wypychania. SHA = commit, który zawiera ten plik (podany w wyniku etapu).
