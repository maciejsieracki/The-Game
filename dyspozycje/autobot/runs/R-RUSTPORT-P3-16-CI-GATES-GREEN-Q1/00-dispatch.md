STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-16-CI-GATES-GREEN-Q1
GOAL: Domknij bramki CI `.github/workflows/rust-engine.yml` poza `src/data` (to zrobił P3.14): (a) `cargo fmt --all -- --check` czerwony przez
16 bloków w `tests/data_{buildings_tech,civilizations,economy_society,units_combat}.rs` oraz przez `src/data/loader.rs` (P3.12); (b) `cargo clippy
--all-targets -- -D warnings` czerwony przez `bridge.rs:22` (`large_enum_variant`). Cel: oba kroki CI zielone lokalnie, bez zmiany zachowania.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `aa7b225b` (P3.14) lub nowszy.
Przeczytaj `.github/workflows/rust-engine.yml` (które kroki są bramką i jak je wywołują) oraz `dyspozycje/rust-port/p3/P3-14-FMT-CLIPPY-HYGIENE.md`.
Baseline: `cargo test --offline` (oczekiwane 292), `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings` — surowe wyniki „przed”.
KOSZT DYSKU: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0`. Nie twórz `target/` w worktree, nie commituj `Cargo.lock`.

ZADANIE
1. Sformatuj WYŁĄCZNIE pliki z allowlisty (`rustfmt --edition 2021 <plik>`; NIE `cargo fmt --all`, bo dotknąłby plików innych tematów, np. `tests/data_compliance.rs` z P3.15).
2. `bridge.rs:22 large_enum_variant`: najmniejsza poprawka zachowująca kontrakt serde/JSON (np. `Box` największego wariantu) — ALBO, jeśli zmieniłaby kontrakt
   lub wymagała zmian poza allowlistą, `#[allow(clippy::large_enum_variant)]` z jednozdaniowym uzasadnieniem. Zweryfikuj testy bridge (`tests/bridge_add_player.rs`) i JSON DTO.
3. Nie ruszaj logiki. `git diff -w` ma pokazać wyłącznie to, co wynika z pkt 2.

ANTY-HALUCYNACYJNA REGUŁA
Surowe, PEŁNE wyjścia (nie wyciągi) `fmt --check`, `clippy -D warnings` i `cargo test` przed/po, każde z `echo "EXIT=$?"`, wklejone w dokumencie. Jeśli `cargo fmt --all
-- --check` pozostaje czerwony z powodu pliku spoza allowlisty (np. `tests/data_compliance.rs` z równoległego P3.15) — wypisz go jawnie, nie ruszaj.

BINARNE KRYTERIUM SUKCESU
`rustfmt --check` EXIT=0 na wszystkich plikach z allowlisty; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --offline` EXIT=0 z liczbą = baseline;
`git diff -w` bez zmian semantycznych poza pkt 2; surowe logi w `dyspozycje/rust-port/p3/P3-16-CI-GATES-GREEN.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-16-CI-GATES-GREEN.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-16-CI-GATES-GREEN-Q1/**`.
Worktree: `rust-port/engine/tests/data_buildings_tech.rs`, `tests/data_civilizations.rs`, `tests/data_economy_society.rs`, `tests/data_units_combat.rs`,
`src/data/loader.rs` (TYLKO formatowanie), `src/bridge.rs` (TYLKO poprawka `large_enum_variant`).
Zero zmian w `tests/data_compliance.rs`, `src/data/{buildings_tech,economy_society*,terrain_map,units_combat}.rs` (P3.15), `domain/**`, `Cargo.toml`, `lib.rs`, `gra/**`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO

ROZSZERZENIE — RUNDA 3/5 (decyzja administracyjna orkiestratora, 2026-10-21, po Final Control rundy 2 = FAIL/NAPRAW 1+2)
Powód: GOAL (oba kroki CI zielone) wymaga edycji plików spoza pierwotnej allowlisty; P3.15 (który ich dotykał) jest zintegrowany (`f7aa0997`), więc kolizja ustała.
BAZA: `origin/rust-port/parity-v2` = `f7aa0997` lub nowsza. Poprzednie commity rund 1–2 (`7dcc5e34` kod, `2cd762e0` dokumentacja; lokalna gałąź `wip/p3-16-round2`, dostępne po SHA we wspólnym repo) przenieś przez
`git cherry-pick 7dcc5e34 2cd762e0` na nową bazę (rozstrzygnij konflikty zachowując zawartość z origin, rustfmt ponownie), albo odtwórz ręcznie ten sam zakres.
DODATKOWA ALLOWLISTA (czysto mechaniczne zmiany): `rust-port/engine/src/data/mod.rs`, `src/data/{buildings_tech,economy_society,economy_society_part2,terrain_map,units_combat}.rs`,
`tests/data_compliance.rs`, `tests/assets_manifest.rs`, `tests/data_loader.rs` — WYŁĄCZNIE: (a) `rustfmt --edition 2021` na tych plikach, (b) usunięcie JEDNEGO z duplikatów `dead_code` (rekomendacja Final Control:
usuń `#[allow(dead_code)]` z `tests/data_compliance.rs`, bo `#![allow(dead_code)]` w `src/data/*` obejmuje też zwykły build). Zero zmian logiki i testów.
KRYTERIUM: `cargo fmt --all -- --check` EXIT=0 ORAZ `cargo clippy --all-targets -- -D warnings` EXIT=0 ORAZ `cargo test --offline` EXIT=0 z liczbą ≥ 323. Kryterium `git diff -w` zastąp porównaniem tokenów (rustfmt zmienia łamanie linii i kolejność `use`) —
opisz różnice.
KOSZT DYSKU / BUILD: UŻYWAJ OSOBNEGO KATALOGU TARGETU PER WORKTREE, np. `CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD)` (wspólny target dawał nieaktualne binarki testowe); po zakończeniu usuń swój podkatalog.
OSTRZEŻENIE: w Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu (pytania/prośby) — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.
