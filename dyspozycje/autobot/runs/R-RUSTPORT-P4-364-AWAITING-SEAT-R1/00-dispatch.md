# R-RUSTPORT-P4-364-AWAITING-SEAT-R1 — stan „czeka na pierwsze miasto” per fotel (dług DTO-BRIDGE, zarzut 5)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus.
ZALEŻNOŚĆ: brak (DTO-BRIDGE r1 zintegrowany w `326fd5545`).
BAZA: `origin/rust-port/parity-v2` = `326fd5545` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> 326fd5545`.

## GOAL
`overlays_view.rs` `awaiting_first_city(state, owner)` czyta jedną flagę `state.gracz_kiedys_mial_miasto` (`playable.rs` ~622), więc działa poprawnie tylko dla fotela 0. Web trzyma `playerEverOwnedCityByOwner` osobno dla każdego fotela. Zamienić na stan per właściciel, tak by `awaiting_first_city(state, owner)` odpowiadał webowi dla KAŻDEGO właściciela.

Decyzja orkiestratora D-AS-1: dodać do `PlayableState` pole `player_ever_owned_city: BTreeSet<PlayerId>` z `#[serde(default)]`, utrzymywane obok `gracz_kiedys_mial_miasto` (bool zostaje dla zgodności, bez zmiany znaczenia). Jeśli wykonanie wymaga zmiany formatu zapisu/snapshotu poza `serde(default)` albo zmiany kontraktu JSON — STOP, zapisz BLOCK z uzasadnieniem.

## PIN (pin = `07d2fbd72`)
- `gra/src/main.ts`: `playerEverOwnedCityByOwner` (wyszukaj w pinie; zacytuj linie), `startRevealKeysForRiverFog()` `main.ts:13074-13080` (warunek `isAwaitingFirstPlayerCity`).
- Rust: `engine/src/domain/playable.rs` (~622, ~763, ~875, ~1024), `engine/src/domain/overlays_view.rs` (~401, ~1026), `engine/src/domain/dto_bridge.rs` (parametr `player_ever_owned_city_by_owner` z D-BR-1 — po zmianie może czytać stan; zachowaj zgodność API dto_bridge albo opisz zmianę w raporcie).

## ZAKRES
1. Dodaj pole per właściciel, utrzymuj je tam, gdzie dziś ustawiany jest `gracz_kiedys_mial_miasto` (playable.rs ~763 i konstruktory ~875/~1024).
2. `awaiting_first_city(state, owner)` używa pola per właściciel.
3. Test `rust-port/engine/tests/p4_364_awaiting_seat.rs`: wektory z pinu dla fotelów 0 i 1 (fotel 1 bez miasta i z miastem) oraz `fog_off_no_reveal_awaiting` w zakresie znanym engine (nie zmieniać wektorów renderera).
4. Mutacje FAIL: (a) pole czytane tylko dla fotela 0; (b) pole nie aktualizowane przy zdobyciu pierwszego miasta; (c) `serde(default)` usunięte (test deserializacji starego zapisu musi przejść).

## ALLOWLISTA
`rust-port/engine/src/domain/playable.rs`, `rust-port/engine/src/domain/overlays_view.rs`, `rust-port/engine/src/domain/dto_bridge.rs` (tylko dostosowanie do nowego pola), `rust-port/engine/tests/p4_364_awaiting_seat.rs` (nowy), katalog runs. Renderer i view-model: NIE. Kontrakt JSON mostu: NIE.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` (engine), `cargo test --test p4_364_awaiting_seat`, `cargo test --all-targets --no-fail-fast` (engine; >10 min: w tle z zapisem EXIT do logu), w tym testy deserializacji zapisów, jeśli istnieją w repo.
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora (poza repo), usunąć po bramkach. Nie commitować `Cargo.lock`.

## KRYTERIA KOŃCA
Zielone bramki, mutacje (a)(b)(c) dają FAIL. Commit jawnym `git add` z allowlisty. Bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md` z sekcją „Zmiana formatu zapisu: tak/nie”. DEPLOY/PUSH: NIE WYKONANO. Nie pushować do parity, nie integrować.
