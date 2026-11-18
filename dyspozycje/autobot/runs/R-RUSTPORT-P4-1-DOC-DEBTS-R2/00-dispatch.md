# R-RUSTPORT-P4-1-DOC-DEBTS-R2 — nieaktualne numery linii pinu w komentarzach poza allowlistą R1 (komentarze)

STATUS: dispatch orkiestratora. Opus (3D), wszystkie etapy Opus. Zmiana WYŁĄCZNIE w komentarzach i literałach tekstowych komentarzy: zero zmian zachowania.
START: po zintegrowaniu RENDER-FRAME r2 (dotyka `overlays_view.rs`/`render_frame.rs`) i FOG-SAVE; wymaga dysku >= 12 GB (bramka renderera, bez równoległych buildów renderera).
BAZA: `origin/rust-port/parity-v2` = `acf238f599059e71b3394ca1a164759491463889` w chwili startu (ta linia ma priorytet; wpisz SHA w raporcie). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Poprawić cytaty numerów linii pinu `07d2fbd72` w pozostałych plikach (inwentarz z `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-DOC-DEBTS-R1/02a-obrona.md`; WERYFIKUJ każdy numer przez `git show 07d2fbd72:gra/src/...`, nie ufaj tabeli):
| Plik | Linia | Cytat | Docelowo (do weryfikacji) |
|---|---|---|---|
| engine/src/domain/overlays_view.rs | 3, 223, 234, 238, 1159 | `16351-16395`, `:16359`, `:16391-16395` | `16351-16396`, `:16360`, `:16392-16395` |
| engine/tests/p4_1q6_2_build_highlight.rs | 247 | `main.ts:16359` | `:16360` |
| engine/tests/view_overlays_build.rs | 3, 75 | `16351-16395`, `16391-16395` | `16351-16396`, `16392-16395` |
| renderer/tests/overlays_units_q6.rs | 19, 258-260 | `16351-16395`, `:16359`, `:16391-16394` | `16351-16396`, `:16360`, `:16392-16395` |
| view-model/src/overlays.rs | 156, 161 | `16351-16395`, `:16391-16395` | `16351-16396`, `:16392-16395` |
| view-model/tests/pin_vectors.rs | 554, 556 | jak wyżej | jak wyżej |
| view-model/tests/overlay_types_f1.rs | 224, 226 | jak wyżej | jak wyżej |
| renderer/src/models/cities/renderer.rs | 591 | `cities.ts:657-680` | `cities.ts:740-763` (`applyFogVisibility`) |
| renderer/tests/view_adapter_cities.rs | 439 | `cities.ts:657-680` | `cities.ts:740-763` |
Dodatkowo: `git grep -nE '16359|16391|16351-16395|657-680' -- rust-port` po zmianie MUSI zwrócić 0 trafień (poza plikami raportów/dyspozycji w `dyspozycje/`); jeśli znajdziesz kolejne miejsca w `rust-port/**` — popraw je, wypisz.

## ZAKRES
Tylko komentarze (`//`, `///`, `//!`) i teksty w komentarzach. NIE zmieniaj literałów w kodzie wykonywalnym, stringów w asercjach, nazw testów ani wektorów. Jeśli cytat siedzi w literale stringa używanym przez test (np. `include_str!`, porównanie) — NIE ruszaj i wypisz w raporcie.

## ALLOWLISTA
Wyłącznie pliki z tabeli plus ewentualne dodatkowe trafienia `git grep` w `rust-port/**` (tylko komentarze), katalog runs.

## BRAMKI (EXIT 0)
Dowód braku zmiany zachowania: skrypt „tylko komentarze” (`git diff -U0 | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*(//|\*)'` = 0; wklej wynik). `cargo fmt --check` + `cargo clippy --all-targets -- -D warnings` + `cargo test --all-targets` dla KAŻDEGO dotkniętego crate: engine (w tle `setsid nohup`, EXIT w logu), renderer, view-model. Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie (jeden po drugim, usuwaj między crate'ami), dysk >= 12 GB przed bramką renderera. Commit jawnym `git add`, bez `Co-Authored-By` z nazwą modelu. Raport `01-operator-r1.md` w kontrakcie.
