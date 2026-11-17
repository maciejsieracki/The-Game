# R-RUSTPORT-P4-1-DOC-DEBTS-R1 — nieaktualne komentarze i numery linii pinu po integracjach 3D (długi dokumentacyjne)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus. Zmiana WYŁĄCZNIE w komentarzach i dokumentacji: zero zmian zachowania.
ZALEŻNOŚĆ: Q6-2, AWAITING-SEAT, L1/L2-FOGOFF zintegrowane (parity `1508eda34`). Start dopiero po zakończeniu buildów engine DTO-BRIDGE r2 (dysk, bramka renderera).
BAZA: `origin/rust-port/parity-v2` (aktualny; wpisz SHA w raporcie). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Zamknąć trzy długi dokumentacyjne zgłoszone w FC/Evaluatorze trzech ostatnich tematów 3D:
1. `rust-port/renderer/src/view/units.rs` (sekcja komentarza „KNOWN DIVERGENCE of Q6-2”, ok. linii 34-40): po Q6-2 (`f263ad77a`) rozbieżność jest ZAMKNIĘTA — producent (`engine/src/domain/overlays_view.rs`) czyści zasięg przy aktywnym trybie budowy także dla pustego zbioru heksów (pin `main.ts:16351-16396`). Zaktualizuj komentarz: co było, co jest, gdzie test (`engine/tests/p4_1q6_2_build_highlight.rs`), oraz kontrakt dla wołającego (otwarcie panelu budowy bez klucza = wołający czyści zaznaczenie jednostki, `onOpenBuild`, `main.ts:26702-26703`).
2. `rust-port/view-model/src/map.rs` (ok. linii 232-252, `FogRevealDto::river_reveal_keys`): dopisz do dokumentacji pola, że przy WYŁĄCZONEJ mgle wartość to `None` (pin `main.ts:13506` — `setFog(ALL_KEYS, ALL_KEYS)` bez opcji; `scene.ts:3531`), a producent engine (`dto_bridge.rs`) zwraca `None` w tym przypadku.
3. Numery linii pinu w komentarzach R5/STATCHIP: sprawdź `rust-port/renderer/src/cities/**` i `rust-port/renderer/src/view/cities.rs` pod kątem cytatów `cities.ts:888`, `:928`, `:740`/`740-763`, `main.ts:2988`; zweryfikuj każdy numer w pinie `07d2fbd72` (`git show 07d2fbd72:gra/src/...`) i popraw na właściwy. Znane poprawki z FC STATCHIP: `cities.ts:888→889`, `:928→929`, `main.ts:2988→2987`, `applyFogVisibility 657-680→740-763`. Jeśli już poprawione — odnotuj w raporcie.

## PIN (pin = `07d2fbd72`)
- `gra/src/main.ts:16351-16396`, `26702-26703`, `13506`, `2987`; `gra/src/render/scene.ts:3531`; `gra/src/render/cities.ts` (numery do weryfikacji).

## ZAKRES
Tylko komentarze (`//`, `///`, `//!`) i dokumentacja w wymienionych plikach. Żadnych zmian kodu wykonywalnego, sygnatur, nazw, `#[cfg]`, testów ani wektorów.

## ALLOWLISTA
`rust-port/renderer/src/view/units.rs`, `rust-port/view-model/src/map.rs`, `rust-port/renderer/src/cities/**` i `rust-port/renderer/src/view/cities.rs` (tylko komentarze), katalog runs. Cokolwiek innego: NIE.

## BRAMKI (EXIT 0)
Dowód braku zmiany zachowania: `git diff` zawiera wyłącznie linie komentarzy (sprawdź skryptem: żadna zmieniona linia nie zaczyna się od kodu; wklej wynik do raportu). `cargo fmt --check` (renderer i view-model), `cargo clippy --all-targets -- -D warnings` (renderer i view-model), `cargo test --all-targets --no-fail-fast` (renderer i view-model; w tle z zapisem EXIT do logu). Przed pełną bramką renderera dysk ≥ 12 GB; mniej → BLOCK INFRA z liczbą GB, bez bramki. Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora, usunąć po bramkach. Nie commitować `Cargo.lock`.

## KRYTERIA KOŃCA
Trzy punkty zamknięte (lub jawnie uzasadnione jako już zrobione), diff tylko komentarze, zielone bramki. Commit jawnym `git add`, bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md` (STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO). Nie pushować do parity, nie integrować.
