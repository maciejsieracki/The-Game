# R-RUSTPORT-P4-1-DOC-DEBTS-R1 — raport Evaluatora r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja kodu Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R1
GOAL: zamknąć trzy długi dokumentacyjne po integracjach 3D (Q6-2, L1/L2-FOGOFF, R5/STATCHIP).

Oceniany kod: `77dde4fb7` (commit kodu `52676fc7a`), gałąź `rust-port-wip/R-RUSTPORT-P4-1-DOC-DEBTS-R1`.
Baza: `origin/rust-port/parity-v2` = `0f77c9da3741da76df7cd8a99a56371e1ab75129` (sprawdzone:
`git merge-base` gałęzi z parity = `0f77c9da3`, czyli gałąź siedzi dokładnie na aktualnym parity).

## ZMIANY/COMMIT (zweryfikowane)
`git diff --name-only 0f77c9da3 77dde4fb7`:
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-DOC-DEBTS-R1/00-dispatch.md`, `01-operator-r1.md` (katalog runs, w allowliście),
- `rust-port/renderer/src/view/units.rs` (w allowliście),
- `rust-port/view-model/src/map.rs` (w allowliście).
Nic poza allowlistą. `Cargo.lock` nie jest w commicie. `git diff --check` czysty.

## Dowód: diff tylko komentarze (własny skrypt)
`git diff -U0 0f77c9da3 77dde4fb7 -- rust-port` → skrypt Python: każda linia `+`/`-` (bez nagłówków
`+++`/`---`) po `strip()` musi zaczynać się od `//`. Wynik: `changed lines 36 non-comment 0`
(24 dodane + 12 usuniętych, zgodne z `--stat` Operatora). Brak `#[ignore]`, brak `assert` w diffie,
brak zmian testów i wektorów. Komentarze `///` nie zawierają bloków kodu (brak nowych doctestów).

## Weryfikacja numerów linii pinu `07d2fbd72` (`git show 07d2fbd72:gra/src/...`)
| Cytat | Treść w pinie | Wynik |
|---|---|---|
| `main.ts:16351-16396` | `function refreshBuildHighlight()` (16351) … `}` (16396) | OK |
| `main.ts:16360` | `unitRenderer.setHighlight(qual);` | OK (poprawka 16359→16360 słuszna) |
| `main.ts:16366` | `setHighlight(new Set(hexes.map(...)))` (cud) | OK |
| `main.ts:16387` | `unitRenderer.clearHighlight();` (kopalnia złoża) | OK |
| `main.ts:16392-16395` | `setHighlight(new Set(...), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` | OK (poprawka 16391-16394→16392-16395 słuszna) |
| `main.ts:26702-26703` | `onOpenBuild: () => {` / `clearPlayerUnitSelection();` | OK |
| `main.ts:13506` | `setFog(ALL_KEYS, ALL_KEYS);` w gałęzi `else` (mgła wyłączona) | OK |
| `render/scene.ts:3531` | `lastRiverRevealKeys = opts?.riverRevealKeys ?? null;` | OK |
| `cities.ts:889` | `const hoverExpanded = options?.hoverStatChipCityId === city.id;` | OK |
| `cities.ts:929` | `lodLevel: this.badgeLodLevel,` | OK |
| `cities.ts:740` | `applyFogVisibility(vis, fogOn, playerOwnerId …)`; koniec metody 763 | OK |
| `main.ts:2938` / `:2987` | `let statChipHoverCityId` / `hoverStatChipCityId: statChipHoverCityId,` | OK |
| `main.ts:2939`, `:13503-13504`, `cities.ts:875` | `_cityRenderOpts`, `applyFogVisibility` ×2, `_buildBadgeInput` | OK |

## Weryfikacja twierdzeń o producencie (kod engine na bazie)
- `engine/src/domain/overlays_view.rs::unit_overlays_view` (l. 515-525): `reachable = Vec::new()` gdy
  `build_highlight_mode_active(&input.build_ui)` — niezależnie od pustości zbioru heksów. Prawda.
- `build_highlight_mode_active` (l. 228-232): `found_city_mode || wonder_active || (build_mode_open &&
  key niepusty)` — otwarty panel bez klucza = `false`, gałąź zasięgu zostaje. Kontrakt wołającego
  w komentarzu (`onOpenBuild` czyści zaznaczenie) zgodny z pinem i kodem.
- Test `engine/tests/p4_1q6_2_build_highlight.rs` istnieje.
- `engine/src/domain/dto_bridge.rs::build_fog_layers` (l. 169-190): gałąź `else` (mgła off) zwraca
  `river_reveal_keys: None`. Prawda.

## Punkt 3 (R5/STATCHIP)
Grep w `renderer/src/cities/**` i `renderer/src/view/cities.rs` po `888`, `928`, `2988`, `657-680`,
`657`, `740`: brak cytatów pinu (jedyne trafienie to kolor `#c8b888`). `cities/sync/stat_chips.rs`
cytuje już `:889`, `:929`, `main.ts:2938`, `:2987` — poprawne. Uzasadnienie „już zrobione” przyjęte.

## TESTY (odtworzone przez Evaluatora)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR`
w scratchpadzie (usunięty po bramkach). Dysk przed bramką: 14 GB wolnego (≥ 12). Testy w tle (setsid nohup, log).
- view-model: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
  `cargo test --all-targets --no-fail-fast` EXIT 0 (13 binarek, 109 passed, 0 failed, 0 ignored).
- renderer: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
  `cargo test --all-targets --no-fail-fast` EXIT 0 (80 binarek, 687 passed, 0 failed, 0 ignored).
Liczby zgodne z raportem Operatora. `Cargo.lock` renderera zmieniony przez build — przywrócony.

## Pliki spoza allowlisty (sekcja Operatora)
Potwierdzone: `rust-port/renderer/src/models/cities/renderer.rs:591` cytuje `cities.ts:657-680` dla
`apply_fog_visibility`; w pinie `applyFogVisibility` = `cities.ts:740-763`. Ścieżka `models/cities/**`
jest poza allowlistą — słusznie nie ruszono. Dług do osobnego mikrotematu.

## ZARZUTY / UWAGI (nieblokujące)
1. Niespójność w tym samym pliku allowlisty: `renderer/src/view/units.rs` l. 17-18 i 99-101 nadal
   cytują `:16359` i `:16391-16394`, a Operator w sekcji Q6-2 tego samego pliku poprawił je na `:16360`
   i `:16392-16395`. Plik jest w allowliście; dispatch wymagał tylko sekcji Q6-2, więc nie FAIL, ale
   to tani dług w zakresie (4 linie komentarza) — do poprawy w r2 albo przez orkiestratora w mikrotemacie.
2. Ten sam stary numer `:16359` / `:16391-16394|16395` występuje poza allowlistą:
   `engine/src/domain/overlays_view.rs:223` (`:16359`), `:233`/`:238` (`16351-16395`, `16391-16395`),
   `engine/tests/p4_1q6_2_build_highlight.rs:247`, `engine/tests/view_overlays_build.rs:75`,
   `renderer/tests/overlays_units_q6.rs:259-260`. Operator tego nie zgłosił w sekcji spoza allowlisty.
3. Komentarz w `overlays_view.rs:222-226` (engine, poza allowlistą) nadal mówi „Kontrakt DTO nie
   odróżnia…” — merytorycznie prawdziwe, nie jest sprzeczne z nowym komentarzem w `units.rs`.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (uwagi 1-2), potem Final Control r1. Mikrotemat na stare numery pinu poza allowlistą (`models/cities/renderer.rs:591`, engine/testy `:16359`/`:16391`).
DEPLOY/PUSH: NIE WYKONANO
