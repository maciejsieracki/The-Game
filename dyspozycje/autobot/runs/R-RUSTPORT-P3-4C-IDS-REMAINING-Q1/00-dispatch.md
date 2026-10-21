STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4C-IDS-REMAINING-Q1
GOAL: Dokończ refaktor newtypów ID z P3.4b (zintegrowany `914eec6b`): pozostałe surowe `u64` jako
ID encji w `rust-port/engine/src/domain/**` zamień na `PlayerId`/`CityId`/`UnitId` z `ids.rs`:
`AiCity.id`, `PlayableCity.id`, `PlayableUnit.id`, `BarbCamp.id`, `UnitCombatResult.id` — oraz
rozstrzygnij jawnie status pól `unit_id`/`target_unit_id` w `AiCommand`/`BarbCommand` (zmień na
newtypy, jeśli nie łamie to kontraktu komend; jeśli łamie — zostaw u64 i opisz dlaczego).
`OwnerRef` zamiast ujemnych `owner_id` (P2.3 §9) — tylko jeśli da się bez przebudowy logiki;
inaczej opisz jako przyszłą pracę (jak w P3.4b §3), nie rób połowicznie.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow,
  Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(dokumentacja). Dokumenty z gałęzi dokumentacyjnej czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`.
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`;
baza musi zawierać `914eec6b` (P3.4b). Baseline: `cargo test --offline` PRZED zmianami (oczekiwane 256).
Przeczytaj: `dyspozycje/rust-port/p3/P3-4B-IDS-NEWTYPE-REFACTOR.md` (na parity-v2 pod tą ścieżką po
914eec6b; poprzedni wzorzec, w tym odstępstwo `#[path]` dla `ai_turn.rs`: tam `use civ_engine::domain::UnitId`,
nie `super::`), oraz `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` §9 (z gałęzi dokumentacyjnej).
KOSZT DYSKU: buduj z `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline`.
Nie twórz `target/` w worktree, nie commituj `Cargo.lock`.

ZADANIE
1. `git grep` pól `id: u64` i pokrewnych w `domain/**` i `bridge.rs`; zrób listę „przed”.
2. Zmień typy wymienionych pól i napraw wszystkie użycia (konstrukcja, porównania, `.get()`), minimalnie,
   bez budowania API na zapas. Kontrakt JSON nie może się zmienić (`#[serde(transparent)]` w `ids.rs`
   potwierdzone; zweryfikuj testami save/DTO/parity_suite).
3. Jeśli wymagane są zmiany testów (`tests/*.rs` włączające moduły przez `#[path]`), ogranicz je do
   importów; zero zmian logiki testów.
4. Wszystko, co pominięte, wypisz jawnie z uzasadnieniem. `git grep` „po”.
5. `rustfmt --check` na zmienionych plikach musi być czysty (P3.4b miał rundę korekty fmt — zrób to od razu).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez surowego logu `cargo test` z `echo "EXIT=$?"` wklejonego dosłownie do dokumentu.
Zakaz częściowego refaktoru bez jawnej listy pominięć.

BINARNE KRYTERIUM SUKCESU
Wymienione pola używają newtypów (dowód `git grep` przed/po), albo dla każdego niezmienionego pola jawne,
sensowne uzasadnienie; `cargo build`+`cargo test --offline` exit 0, liczba testów ≥ baseline, rustfmt czysty
na zmienionych plikach, surowy log w `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-4C-IDS-REMAINING-Q1/**`.
Worktree: `rust-port/engine/src/domain/{ai_turn,playable,barbarians,combat}.rs`, w razie potrzeby
`rust-port/engine/src/bridge.rs` (TYLKO konwersje id) i importy w `rust-port/engine/tests/{combat,ai_turn,terrain_movement_fix}.rs`.
Zero zmian w `src/data/**`, `lib.rs`, `Cargo.toml`, `gra/**`. (Równolegle: P3.11 `tests/data_compliance.rs`,
P3.12 `src/data/loader.rs`+`mod.rs`, P3.8b `tests/assets_manifest.rs`, P3.14 formatowanie `src/data/*` — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
