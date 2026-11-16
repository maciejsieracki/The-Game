# R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW
GOAL: producent `overlays.buildHighlight` (4 tryby `refreshBuildHighlight`, pin `main.ts:16351-16395`) i `overlays.selection` ze stanu UI oraz port `isHexInStartReveal` / `canFoundPlayerCityAt` w module `start_reveal.rs`.
OCENIANY COMMIT: `d56a5221e54802bfe2ad66a7dcf303c8470263c9` (Obrona), kod = `24f57d8100cc5c8bfc5ddf7022ebc7051dea1206` (Operator).
BAZA: `origin/rust-port/parity-v2` = `05b872fc5763256d1f607f3b73a47dd6f3244903` (zgodna z dispatchem). Pin `07d2fbd72`.

## Ancestry i allowlista (sprawdzone samodzielnie)
- `git merge-base --is-ancestor 05b872fc5 d56a5221e` = prawda. Łańcuch: `24f57d810` (Operator) → `073915d08` (Evaluator) → `d56a5221e` (Obrona) → ten commit (FC).
- `git diff --stat 05b872fc5 d56a5221e`: 8 plików, wyłącznie z allowlisty: `src/domain/overlays_view.rs` (NOWY, 155), `src/domain/start_reveal.rs` (NOWY, 153), `src/domain/mod.rs` (+2, tylko `pub mod overlays_view;`, `pub mod start_reveal;`), `tests/start_reveal.rs` (NOWY), `tests/view_overlays_build.rs` (NOWY), 3 raporty w katalogu runu. `renderer/`, `gra/`, `Cargo.lock`, kształt DTO P4-1F1 nietknięte.
- `git diff --stat 24f57d810 d56a5221e`: tylko `02-evaluator.md` i `02a-obrona.md`. Drzewo `rust-port/` w ocenianym commicie jest bajt w bajt tym, na którym Evaluator odtworzył bramki.

## Bramki
| Bramka | Kto / gdzie | Wynik |
|---|---|---|
| `rustfmt --check --edition 2021` na 4 nowych plikach `.rs` z `d56a5221e` | FC, samodzielnie | EXIT 0 (każdy plik) |
| `#[ignore]` / `should_panic` w nowych plikach | FC, grep | 0 trafień |
| `cargo clippy --all-targets -- -D warnings` | Evaluator na `24f57d81` (drzewo kodu identyczne) | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | Evaluator na `24f57d81` | EXIT 0, 3667 passed, 0 failed, 1 ignored (wcześniejszy, spoza tematu) |
| Mutacje (a) kopalnia→ulepszenie, (b) `<` zamiast `<=`, (c) cofnięcie bez odjęcia | Evaluator | każda FAIL, EXIT 101 |
| clippy / test / mutacje ponownie przez FC | FC | NIE_URUCHOMIONO: `df -h /` = 4,7 GB wolnego, poniżej progu 8 GB z kryterium 3. Uzasadnienie przyjęcia: drzewo kodu identyczne z ocenionym przez Evaluatora (dowód: diff wyżej). Orkiestrator i tak uruchamia pełny `cargo test` przy integracji. |

## Weryfikacja zgodności z pinem (FC, odczyt `07d2fbd72`)
- `refreshBuildHighlight` (`main.ts:16351-16395`): kolejność gałęzi założenie miasta → cud → brak trybu (`!buildModeOpen || !activeImprovementKey || !buildApi`) → kopalnia (`isMineImprovementKey`) → ulepszenie — zgodna 1:1 z `overlays_view::build_highlight`. Filtr cofania tylko w gałęzi ulepszeń/kopalni, cud bez filtra — jak w pinie.
- `filterBuildHighlightHexes` (`render/buildHighlight.ts:22-28`) i `pendingImprovementId` (`game/pending-improvements.ts:16-18`, `${hexKey}:${improvementKey}`, hexKey `"q,r"`) — format klucza zgodny z `format!("{q},{r}:{improvement_key}")`.
- `first-player-city.ts` (całość): `isAwaitingFirstPlayerCity`, `isHexInStartReveal` (`<=`, `:32`), `validateFirstPlayerCityPlacement` — 1:1. `canFoundPlayerCityAt` (`main.ts:12923-12943`) — złożenie bazy `canFoundCity` + walidacja kręgu zgodne; baza przez domknięcie (zarzut 2).
- `selection`: `syncPlayerUnitSelectionOnMap` (`main.ts:7114-7119`) — brak filtra `isMe` w producencie (zarzut 4).

## Orzeczenia
- **Z0 (kontekst Evaluatora):** ODDAL — informacja, nie zarzut; bramki przyjęte wg tabeli.
- **Z1 (producent bez wołającego):** ODDAL w tym temacie. Dispatch nie obejmuje składacza (`renderer/` i adapter P4-1G Q6 #237 wyłączone w „NIE ROBIĆ”). Zależność zapisana w `02a-obrona.md` jako Z-1; wpis do `REJESTR-RUST.md` należy do orkiestratora przy integracji (plik poza allowlistą tematu) — warunek integracji, nie poprawka kodu.
- **Z2 (`foundingTerritoryOpts`, `ownerEra`, `cityLimitBase`):** ODDAL. Dispatch pkt 4 zabrania rozszerzania allowlisty; luka jawnie opisana w kodzie (`start_reveal.rs`, nagłówek modułu) i jako Z-2. Wpis do rejestru przez orkiestratora.
- **Z3 (testy cofania na ręcznych kluczach):** ODDAL. FC potwierdził zgodność formatu klucza z pinem (wyżej); mutacja (c) łapie regresję filtra. Test end-to-end z `PendingImprovementsTurn` → temat składacza (Z-3).
- **Z4 (`selection` bez `isMe`):** ODDAL. Różnica jest w wołającym w pinie (`syncPlayerUnitSelectionOnMap`), nie w samym wyznaczeniu heksu; odpowiedzialność wołającego udokumentowana jako Z-4. Składacz MUSI filtrować jednostki lokalnego gracza — do rejestru.
- **Z5 (kolejna kopia `hex_distance`):** ODDAL — porządkowe, wynik poprawny; użycie istniejącej funkcji wymaga zmian poza allowlistą. Kandydat na osobny temat porządkowy.
- **Z6 (nieaktualny status Operatora, konflikt `overlays_view.rs`):** ODDAL — FC opiera się na `02-evaluator.md`; konflikt z 1F3/1F4/1F5 rozwiązuje orkiestrator przy integracji (dispatch, „NIE ROBIĆ”).

Brak orzeczeń NAPRAW. Brak DO DECYZJI CZŁOWIEKA (sprawy techniczne, web rozstrzyga).

## Warunki dla orkiestratora przy integracji
1. Przenieść Z-1, Z-2, Z-4 (i Z-3 jako wymóg testu) z `02a-obrona.md` do `dyspozycje/rust-port/REJESTR-RUST.md`, powiązane z #237 / PRIO-3D-2.
2. Rozwiązać konflikt `overlays_view.rs` (plik NOWY także w 1F3, 1F4, 1F5) i `mod.rs` (`pub mod overlays_view;`), nie cofając cudzych zmian.
3. Pełny `cargo test --all-targets --no-fail-fast` po merge (przy dysku ≥ 8 GB).

ZMIANY/COMMIT: tylko ten raport (`03-final-control.md`), commit na `d56a5221e`.
TESTY: jak w tabeli bramek.
BLOKADY: brak blokad kodu; dysk 4,7 GB uniemożliwia powtórzenie cargo przez FC (NIE_URUCHOMIONO, uzasadnione identycznością drzewa).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (warunki 1–3).
DEPLOY/PUSH: NIE WYKONANO
