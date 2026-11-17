# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Operator, runda 1

STATUS: BLOCK (INFRA, tylko bramka pełna; kod i bramki celowane zielone)
DOMAIN: INFORMATIONAL (widok/DTO mgły; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1 (#253, #335)
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()`, 1:1 z `refreshFog` weba (pin `07d2fbd72`).

## Baza i gałąź
- Baza: `2760b4f0c` (= `origin/rust-port/parity-v2`, DODATEK r2 dispatchu).
- Gałąź robocza: `rust-port-wip/p4-1c-fog-view-r1` (worktree `wf_adaaa3fa-712-1`). Brak pusha, brak integracji.
- Commit kodu: `a17f28d42`.

## ZMIANY/COMMIT (allowlista)
- `rust-port/engine/src/domain/state.rs` — TYLKO producent: nowy podmoduł `visibility::fog_view`
  (publicznie `civ_engine::domain::terrain::visibility::fog_view`, ta sama droga co istniejące
  `visibility`; `domain/mod.rs` NIETKNIĘTY).
- `rust-port/engine/tests/p4_1c_fog_view.rs` — nowy test (5 testów).
- `rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs` + `vectors.json` — generator `.mjs` wykonujący pin i wektory.
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1C-FOG-VIEW-R1/01-operator-r1.md` — ten raport.
- Nie dotykano: `view-model/src/map.rs` (typ `FogViewDto` wystarcza), `renderer/src/view/fog.rs` (konsument zgodny), `gra/`, `Cargo.lock`.

## Producent (web → Rust)
| Web (pin `07d2fbd72`, `gra/src/main.ts`) | Rust (`fog_view`) |
|---|---|
| `ownPlayerVisibleHexes` `:12968-12985` | `own_player_visible_hexes` (jednostki + miasta + `fortSightSources`, przez `compute_player_visibility_with_extra` bez `startHex`) |
| `currentVisible` `:13007-13040` | `current_visible` (unia z `currentVisibleForOwner(oid)` dla ownerów AI z sojuszem; pusta → krąg `playerStartHexFor(ME())` / pusta) |
| `currentVisibleForOwner` `:13059-13071` | `current_visible_for_owner` (+ `ownPlayerVisibleHexes`, gdy owner ≠ ME i sojusz) |
| `allianceFormalKindBetween` (`game/diplomacy-treaties.ts:380-389`) | `alliance_formal_kind_between` (pełny > obronny; pakt/handel/granice → `None`) |
| `refreshFog` `:13475-13519` (`addExplored(exploredByHuman.get(ME())!, vis)`, `exploredSetForRender`, `useFogRender = fogOn \|\| revealAllLand`, gałąź `else` = `ALL_KEYS`) | `refresh_fog` → `FogView { fog, fog_active, visible, explored_for_render }` |

Kodowanie DTO (D-DTO-10 = A): `2` gdy w `vis`, `1` gdy w `exploredForRender`, inaczej `0`; bez mgły
(`!useFogRender`) każdy heks `2`, `fog_active = false` (zgodne z `renderer/src/view/fog.rs::FogSets::from_dto`).
Kolejność `fog.state` = kontrakt §1.4 (`r`-major, `q`-minor) = `hex_order(state)`.

## Decyzje techniczne (orkiestrator może wpisać do REJESTR-RUST)
- Z-FOG-1: `PlayableState` nie niesie `ME()`, `exploredByHuman`, `fogOn`, `revealAllLand`,
  `playerStartHexByOwner`, `startRevealRadius` — podaje je wołający (`FogViewInputs`, `ExploredByHuman`).
  Nowych pól stanu NIE dodano (`playable.rs` poza allowlistą). Brak wpisu fotela w `exploredByHuman`
  = `FogViewError::MissingExploredSeat` (web `!` → wyjątek), bez mutacji.
- Z-FOG-2: render czyta eksplorację AKTYWNEGO fotela (`exploredByHuman.get(ME())`, jak dispatch). Na pinie
  `fogExploredForRender` czyta globalny `explored`, który jest TYM SAMYM obiektem co wpis jedynego fotela
  (`main.ts:13759`) — dla jednego fotela wynik identyczny (wektory to potwierdzają).
- Z-FOG-3: `aiOwnerCivMap.keys()` = gracze stanu z `is_human == false` (drugi fotel człowieka nie wchodzi
  do unii — wektor `fotel_sojusznik` ma sojusz z fotelem 5 = człowiek, bez unii, zgodnie z pinem).
  Kultura miasta: web `(c as {kultura?}).kultura ?? 0` = `PlayableCity::culture`; `cityBorderRadius`
  z domyślnymi `FALLBACK_CULTURE_PARAMS` (domyślny argument w webie).
- Z-FOG-4: producent umieszczony w `state.rs` (dozwolone „tylko producent”) jako `visibility::fog_view`,
  żeby nie ruszać `domain/mod.rs` (poza allowlistą).
- Odstępstw od webu: BRAK. Pytań ABC: BRAK (web rozstrzyga).

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo, usunięty po bramkach).
- `cargo fmt --check` (engine): EXIT 0 (po `cargo fmt` własnych plików). `cargo fmt --check` (renderer): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --test p4_1c_fog_view` (engine): 5 passed, 0 failed.
  - `p4_1c_fog_vectors_match_pinned_web` — 7 wektorów z uruchomionego pinu: `sam_fotel`, `fotel_sojusznik`
    (obronny + pełny → unia; `umowa_szlakow` i sojusz z drugim człowiekiem → bez unii), `reveal_all_land`,
    `start_hex_fallback`, `brak_zrodel_brak_startu`, `mgla_wylaczona`, `mgla_wylaczona_reveal`;
    porównanie `fog.state`, `fog_active`, `setFog(vis, exploredForRender)` i `explored` po `refreshFog`.
  - `p4_1c_fog_vectors_cover_union_and_reveal_branches` — strażnik rozróżnialności wektorów.
  - `p4_1c_alliance_formal_kind_between_matches_pin`.
  - `p4_1c_fog_explored_is_per_seat` — dwa fotele (1, 5): A odkrywa tylko swoje, B nie dostaje mgły A
    (heksy widziane tylko przez A mają u B kod `0`), eksploracja A zachowana po powrocie.
  - `p4_1c_fog_missing_seat_is_error`.
- Generator: `node rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs --check` → `OK: 7 przypadkow zgodnych`
  (Node 22.23.4; 15 strażników SHA-256 fragmentów `main.ts`, linie w `vectors.json.guards`).
- Mutacje (każda na kopii `state.rs`, przywrócona, `diff` pusty):
  - (a) pominięcie unii sojuszników (`visible.extend(current_visible_for_owner(..))` → odrzucenie wyniku): FAIL `p4_1c_fog_vectors_match_pinned_web` (`fotel_sojusznik: fog.state`).
  - (b) `explored` współdzielone (`get_mut(&me)` → `values_mut().next()`): FAIL `p4_1c_fog_explored_is_per_seat` i `p4_1c_fog_missing_seat_is_error`.
  - (c) pominięcie `revealAllLand` (`explored_set_for_render(.., false)`): FAIL `p4_1c_fog_vectors_match_pinned_web`.
- NIE WYKONANO (BLOCK INFRA): `cargo test --all-targets --no-fail-fast` w engine i renderer oraz
  `cargo clippy --all-targets -- -D warnings` w renderer. Dysk przed bramką pełną: `df -h /` = 5.7 GB wolne
  (na starcie 13 GB; spadek przez inne workery), po usunięciu własnego targetu 6.2 GB — poniżej progu 8 GB
  z dispatchu. Renderer nie był zmieniany (0 plików w `rust-port/renderer`).

## BLOKADY
- INFRA: wolne miejsce 5.7–6.2 GB < 8 GB → bramka pełna (engine `--all-targets`, renderer clippy + `--all-targets`) do wykonania po zwolnieniu dysku (ta sama gałąź, bez zmian kodu).

## RUNDY
1/5.

## NASTĘPNY KROK
Orkiestrator: zwolnić dysk do ≥ 8 GB, następnie bramka pełna na `a17f28d42` (lub kolejna runda Operatora tylko z bramką), potem Evaluator.

## DEPLOY/PUSH
NIE WYKONANO.
