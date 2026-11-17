# R-RUSTPORT-P4-1-DOC-DEBTS-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (komentarze w kodzie Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R1
GOAL: zamknąć trzy długi dokumentacyjne po integracjach 3D (Q6-2 w `units.rs`, `river_reveal_keys` przy mgle off w `map.rs`, numery linii pinu R5/STATCHIP).

Oceniany stan: `cf94975d2` (obrona; zawiera Operatora `52676fc7a`/`77dde4fb7` i Evaluatora `ad1a2fb4a`).
Baza: `origin/rust-port/parity-v2` = `0f77c9da3741da76df7cd8a99a56371e1ab75129` (`git merge-base` = baza; parity nie ruszyło się od startu tematu).
Gałąź FC: `fc/R-RUSTPORT-P4-1-DOC-DEBTS-R1` (rodzic `cf94975d2`, zawiera tylko ten raport).

## Allowlista (sprawdzona samodzielnie)
`git diff --name-only 0f77c9da3 cf94975d2`:
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-DOC-DEBTS-R1/{00-dispatch,01-operator-r1,02-evaluator,02a-obrona}.md` — katalog runs, OK;
- `rust-port/renderer/src/view/units.rs` — OK;
- `rust-port/view-model/src/map.rs` — OK.
Brak `Cargo.lock`, brak plików spoza allowlisty. `git diff --check` czysty. Brak trailerów `Co-Authored-By` w 4 commitach tematu (#289).

## Dowód: diff tylko komentarze (własny skrypt)
`git diff -U0 0f77c9da3 cf94975d2 -- rust-port | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' | grep -vcE '^[+-][[:space:]]*//'` → `0`.
Nowe `///` nie zawierają bloków kodu (brak nowych doctestów). Żaden test renderera/view-model nie czyta tekstu źródeł (`read_to_string` tylko na fixture’ach w `tests/`), więc zmiana komentarzy nie może zmienić wyniku testów.

## Weryfikacja treści w pinie `07d2fbd72` (samodzielnie, `git show`)
- `main.ts:16351` `function refreshBuildHighlight()`; `:16360` `setHighlight(qual)`; `:16366` `setHighlight(new Set(...))`; `:16387` `clearHighlight()`; `:16392-16395` `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)`; `:16396` `}` — zgodne z komentarzami w `units.rs`.
- `main.ts:26702-26703` `onOpenBuild: () => {` / `clearPlayerUnitSelection();` — zgodne.
- `main.ts:13506` `setFog(ALL_KEYS, ALL_KEYS);` w gałęzi `else`; `render/scene.ts:3531` `lastRiverRevealKeys = opts?.riverRevealKeys ?? null;` — zgodne z `map.rs`.
- `cities.ts:740` `applyFogVisibility(...)`, `:763` `}`, `:889` `hoverExpanded`, `:929` `lodLevel` — zgodne.
- Producent: `engine/src/domain/overlays_view.rs:522` (`reachable` pusty, gdy `build_highlight_mode_active`), `:228` definicja; `engine/src/domain/dto_bridge.rs::build_fog_layers` gałąź `else` → `river_reveal_keys: None`; test `engine/tests/p4_1q6_2_build_highlight.rs` istnieje. Komentarze prawdziwe.
- Punkt 3: `grep -rnE '888|928|2988|657-680|:740'` po `renderer/src/cities/**` i `renderer/src/view/cities.rs` → jedyne trafienie to kolor `#c8b888`. „Już poprawione” — przyjęte.
- `grep -nE '16359|16391|16351-16395' renderer/src/view/units.rs` → 0 trafień (poprawka z obrony obecna).

## Bramki (FC, samodzielnie)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty).
- renderer `cargo fmt --check` EXIT 0; view-model `cargo fmt --check` EXIT 0;
- view-model `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0 (109 passed, 0 failed);
- renderer `cargo clippy --all-targets -- -D warnings` EXIT 0 (kompiluje wszystkie cele, w tym testy);
- renderer `cargo test --all-targets --no-fail-fast`: **NIE URUCHOMIONO przez FC** — wolny dysk poniżej progu 12 GB z dispatchu (pomiary: 11 452 MB, 11 158 MB, potem 10 541 MB, 6 842 MB, 10 369 MB; ok. 30 min oczekiwania, inne workery budują). Zgodnie z regułą dispatchu bez bramki. Ten sam drzewostan (`cf94975d2`, identyczne pliki źródłowe) przeszedł pełny test renderera u Obrony (687 passed, 0 failed), a stan Operatora u Operatora i Evaluatora (687/0). Przy diffie wyłącznie z komentarzy, zielonym clippy na wszystkich celach i braku testów czytających źródła ryzyko jest zerowe; pełną bramkę renderera powtórzy integracja orkiestratora.
- `Cargo.lock` renderera zmieniony przez build — przywrócony, niecommitowany.

## Orzeczenia zarzutów
1. Evaluator, uwaga 1 (stare `:16359`, `:16391-16394` w `units.rs` l. 17-18, 99-101) — **ODDAL**: naprawione w obronie (`cf94975d2`), zweryfikowane grepem i pinem.
2. Evaluator, uwaga 2 (te same stare numery poza allowlistą: engine, testy, `view-model/src/overlays.rs`, `models/cities/renderer.rs:591`, `renderer/tests/view_adapter_cities.rs:439`) — **ODDAL** w tym temacie: poza allowlistą, edycja byłaby naruszeniem; inwentarz obrony kompletny → osobny mikrotemat komentarzowy.
3. Evaluator, uwaga 3 (komentarz `overlays_view.rs:222-226` „Kontrakt DTO nie odróżnia…”) — **ODDAL**: poza allowlistą, merytorycznie prawdziwy, niesprzeczny.
4. FC: brak pełnego testu renderera w FC z powodu dysku — **ODDAL** jako blokada merytoryczna (patrz Bramki); uwaga dla integracji.

Brak NAPRAW.

ZMIANY/COMMIT: tylko ten raport na `fc/R-RUSTPORT-P4-1-DOC-DEBTS-R1`; kod do integracji = `cf94975d2`.
TESTY: jak wyżej.
BLOKADY: brak merytorycznych; INFRA (dysk) dla pełnego testu renderera w FC.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora `cf94975d2` na parity-v2 z pełną bramką renderera (dysk ≥ 12 GB); mikrotemat na stare numery pinu poza allowlistą (tabela w `02a-obrona.md`).
DEPLOY/PUSH: NIE WYKONANO
