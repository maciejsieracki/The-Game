# R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW — Obrona Operatora (runda 1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW
GOAL: stan oblężenia/maszyn/cudów w PlayableState z zapisem + producenci sieges[]/wonders[] (parytet z pinem 07d2fbd72)
ZMIANY/COMMIT: commit obrony nad 999083029 (gałąź lokalna op/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW-r1-obrona);
               pliki: rust-port/engine/src/domain/overlays_view.rs, rust-port/engine/tests/view_overlays_siege_wonder.rs, ten raport
TESTY: patrz §Bramki
BLOKADY: brak (zależności wołającego zapisane niżej jako jawny dług — nie blokują tematu, który z dispatchu jest producentem)
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Baza obrony: `999083029` (raport Operatora r1) nad kodem `81bb88670`, baza tematu `585bb48e0` (bez zmian).

## Odpowiedzi na zarzuty Evaluatora (`02-evaluator.md`, commit 48ef28025)

### Zarzut 1 — globalne mapy `allCampOwners` / `allMachinesByCamp` — PRZYJMUJĘ (poprawka w kodzie + zależność adaptera)

Potwierdzone w pinie: `git show 07d2fbd72:gra/src/main.ts`, `:17509-17517` — `allMachinesByCamp.set(hk, [...prev, ...kinds])`
(łączenie list po heksie dla wszystkich obleganych miast) i `allCampOwners.set(hk, oid)` (ostatnie miasto w kolejności
`cities` wygrywa). Per-miastowy właściciel w `SiegeViewDto.camp_hexes[].owner_id` jest zgodny z kształtem DTO z P4-1F1
(dispatch: „NIE zmieniaj kształtu DTO”), więc DTO zostaje. Poprawka:

- `overlays_view.rs`: nowe czyste funkcje `global_camp_owners(&[SiegeViewDto])` i `global_machines_by_camp(&[SiegeViewDto])`
  — port reguły `main.ts:17509-17517` (semantyka `Map.set`: podmiana wartości, pozycja pierwszego wstawienia bez zmian;
  maszyny round-robin per miasto przez `machines_by_camp_hex`, potem konkatenacja w kolejności `sieges`).
- Test `global_camp_maps_last_city_wins_and_machines_concatenate` — dokładnie wektor Evaluatora: miasta 10 (wł. 1, (5,5))
  i 20 (wł. 2, (7,5)), wspólny heks (6,5) z jednostkami wł. [1, 3]. Per miasto: 10 → 3, 20 → 1; globalnie → 1;
  maszyny `[taran]` + `[wieza]` → `[(6,5), [taran, wieza]]`.
- Mutacje (każda `cargo test --test view_overlays_siege_wonder`, przywrócenie potwierdzone `cmp`):
  (e) „pierwszy wygrywa” zamiast „ostatni wygrywa” → FAIL exit 101; (f) podmiana listy maszyn zamiast łączenia → FAIL exit 101.
- **Zależność adaptera (do zapisu w rejestrze):** P4-1G Q5 ADAPTER-OVERLAYS (#236/#269) MUSI budować wejście
  `siegeMarkerRenderer.sync` (`machinesByCampHex`, `campOwnerByHex`) przez `global_machines_by_camp` / `global_camp_owners`,
  a nie z `camp_hexes[].owner_id` pojedynczego miasta — inaczej przy wspólnym heksie obozu kolor obozu rozjedzie się z webem.

### Zarzut 2 — brak produkcyjnego pisarza nowych pól — PRZYJMUJĘ (jawna zależność; poza zakresem dispatchu)

Fakty (sprawdzone `git grep` na gałęzi): `oblegane`, `siege_machines_ready`, `placed_world_wonders` w `PlayableState`
nie mają produkcyjnego pisarza; W8 nadal czyta/pisze `CityWarExtras.oblegane`; `wonder_placement` nie pisze do stanu;
`with_playable_siege_wonders` / `restore_siege_wonders` nie mają wołającego. Skutek dziś: `sieges[]` i `wonders[]`
w grze zawsze puste. Dispatch (ZAKRES 1-4, allowlista) obejmuje stan + zapis + producentów; pliki W8, `wonder_placement`
i ścieżka zapisu gry są poza allowlistą, więc nie wpinam. Uzupełniam punkt 5 raportu Operatora o jawne zależności:

- **D-1F3-1 (W8 → stan):** pipeline wojny (`CityWarExtras.oblegane`, OBL-S5 machiny `siegeMachines.ready`) ma pisać do
  `PlayableState.oblegane` / `siege_machines_ready` (jedno źródło prawdy) — osobny temat wpięcia po W8.
- **D-1F3-2 (budowa cudu → stan):** `wonder_placement` (web `placedWorldWonders.push`) ma pisać `PlayableState.placed_world_wonders`;
  przejęcie miasta z cudem (SIEGE-TRANSFER Q8/Q9) ma aktualizować `ownerId` wpisu.
- **D-1F3-3 (zapis gry):** produkcyjna ścieżka zapisu/odczytu ma wołać `with_playable_siege_wonders` / `restore_siege_wonders`.
Do czasu D-1F3-1..3 nakładki oblężeń i cudów są funkcjonalnie puste — to stan zamierzony tego etapu, nie regresja.

### Zarzut 3 — podwójne źródło `CityViewCityFacts.besieged` — PRZYJMUJĘ (dług; plik poza allowlistą)

`city_view.rs:86-87` (P4-1E) bierze `besieged` z wejścia wołającego, a nie z `PlayableState.oblegane`. Plik jest poza
allowlistą tego tematu, więc nie zmieniam. **D-1F3-4:** `city_view` ma czytać `besieged = state.oblegane.contains(&city.id)`
(web: odznaka i `refreshSiegeMarkers` czytają to samo `c.oblegane`, `main.ts:17493`), razem z D-1F3-1, żeby odznaka
i `sieges[]` nie mogły się rozjechać.

### Zarzut 4 — `citySiege` tylko w Rust; import zapisu webowego gubi oblężenie — PRZYJMUJĘ (dług dla P6.20-P6.22)

Prawda: web trzyma `oblegane` i `siegeMachines` wewnątrz `cities[]` zapisu; `GameStateDto` ich nie niesie, a `citySiege`
jest addytywnym kluczem Rust (decyzja techniczna 1 raportu Operatora). Import zapisu z weba nie odtworzy oblężenia
i nie zgłosi tego w raporcie. **D-1F3-5:** w temacie migracji zapisu P6.20-P6.22 (`SAVE-LOAD-MIGRACJE`) — odczyt
`cities[i].oblegane` / `cities[i].siegeMachines.ready` z zapisu webowego do `PlayableState` (albo jawny wpis w raporcie
odczytu), zapis zgodny z kształtem weba przy eksporcie. Bez tego nie wolno twierdzić zgodności zapisu z webem dla oblężeń.

### Zarzut 5 — pusty `placedWorldWonders` nie zapisywany — ODRZUCAM jako defekt (Evaluator sam uznał za akceptowalne)

Dowód: odczyt w pinie `main.ts:46459-46461` traktuje brak/nie-tablicę jako `[]`, więc brak klucza ≡ `[]` po odczycie;
dispatch wymaga „golden zapisu bez nowych pól = bez zmian” (test `golden_state_files_reserialize_byte_identical`).
Różnica bajtowa względem weba (web zawsze pisze `[]`) dotyczy tylko eksportu — dopisana do D-1F3-5 jako punkt
„eksport w kształcie weba”.

## Bramki obrony (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo)

- `cargo fmt --check` — EXIT 0
- Fakty zarzutu 2 potwierdzone grepem: nowe pola `PlayableState` czytane tylko w `overlays_view.rs`/`save_load.rs`/`playable.rs`; produkcja nadal używa `CityWarExtras.oblegane` (`turn_economy_loop.rs:860`, `turn_economy_tick.rs:303`, `war_world_view.rs:224`).
- `cargo clippy --all-targets -- -D warnings` — EXIT 0
- `cargo test --test view_overlays_siege_wonder` — EXIT 0 (12 passed: 11 dotychczasowych + 1 nowy)
- `cargo test --test view_overlays_siege_wonder_save` — EXIT 0 (6 passed)
- `cargo test --lib` — EXIT 0 (124 passed)
- Pełny `cargo test --all-targets --no-fail-fast` — NIE_ZMIERZONO w obronie (dysk 3.7 GB wolne po buildzie, < 8 GB; zmiana obrony
  to dwie nowe funkcje bez wołającego w produkcji + 1 test, pełny test Operatora r1 EXIT 0 na `81bb88670`).
- `git diff --check` — czysto; zmiany wyłącznie w allowliście; brak `#[ignore]`; `Cargo.lock` niecommitowany.
