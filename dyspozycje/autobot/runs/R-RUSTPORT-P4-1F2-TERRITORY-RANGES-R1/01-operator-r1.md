# R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1
GOAL: zasięgi terytorium w adapterze nakładek (`TerritoryRangesDto`), zgodne z webem (pin `07d2fbd72`).
ZMIANY/COMMIT: baza `82db9b370` (wg dispatchu), gałąź `rust-port-wip/p4-1f2-territory-ranges-r1`, SHA commitu w wiadomości końcowej Operatora (ten raport jest w tym samym commicie).
TESTY: bramki niżej, wszystkie EXIT 0; mutacje 6/6 FAIL.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (bez push, bez integracji).

## PIN (przeczytany przed zmianą)

- Właściciel heksu: `gra/src/map/territory.ts:122-160` `territoryOwnerAt` (najbliższe miasto w promieniu, remis = pierwszy węzeł; forty/posterunki tylko poza zasięgiem miast; spór fortów: oba z `order` → wcześniejszy, inaczej bliższy). Indeks `territoryOwnerLookup` `:280-292` (dla ≥ 12 węzłów) daje ten sam wynik — pokryty scenariuszem z 14 węzłami.
- Promień: `cityTerritoryRadius` `:89-93` (fort 5 `:75`, posterunek 3 `:77`, miasto `cityRangeForPopulation` `game/okolica.ts:46-50`, `CITY_RANGE_MIN/CAP` `:37`/`:40` = 5/15 z `data/miasto-params.json`).
- Heksy per właściciel: `gra/src/map/range-hexes.ts:28-53` `collectTerritoryHexKeysByOwner` po `Object.keys(map.hexes)`.
- Filtr widoczności: `gra/src/main.ts:15593-15601` w `refreshTerritoryBorderOverlay` (`:15582-15616`): `isMe(ownerId)` (`:13748-13750`, `ownerId === ME()`) → zawsze; `!fogOn` → zawsze; inaczej `currentVisible()` (`:12995-13015`) ∪ `fogExploredForRender()`.
- Granica: `gra/src/map/territory-border.ts:76-111` `collectTerritoryBoundaryEdges` — bok `dir` (kolejność `HEX_DIRS` `:9-16`) heksu zbioru, którego sąsiad NIE jest w tym samym zbiorze.
- Węzły: `buildAllTerritoryNodes` `main.ts:5667-5678`.

## ZMIANY (allowlista)

1. `rust-port/view-model/src/territory_ranges_view.rs` (nowy) + rejestracja w `view-model/src/lib.rs`: `TerritoryRangesDto { by_owner, borders }`, `OwnerBorderEdgesDto`, `BorderEdgeDto { hex, dir }`, wejścia `TerritoryNodeInput`/`TerritoryNodeOrder`, filtr `TerritoryFogFilter { me, fog_on, visible, explored }`, producent `territory_ranges_dto(hex_order, nodes, fog)`, port `territory_owner_at`, `city_territory_radius`, `city_range_for_population`, `axial_distance`, `owner_border_edges`; `TerritoryRangesDto::territory_view()` → istniejący `TerritoryViewDto`.
2. `rust-port/renderer/src/view/overlays.rs`: `territory_ranges_by_owner` (→ `territory_by_owner`), `territory_ranges_border_edges` (krawędzie DTO → `BorderEdge` renderera, sprawdzone względem `collect_territory_boundary_edges` na tych samych heksach), `territory_ranges_border_group` (bramka UI jak `:15583`, walidacja, potem `territory_border_group`); nowe błędy `TerritoryBorderOwners`, `TerritoryBorderMismatch { owner }`.
3. `rust-port/renderer/tests/territory_ranges_f2.rs` (8 testów) + generator `territory_ranges_f2_gen.mjs` + wektory `territory_ranges_f2_vectors/vectors.json` (katalog wektorów jak w precedensie G5 — konieczny artefakt generatora; zgłaszam jawnie do oceny allowlisty).

## DECYZJE TECHNICZNE (do REJESTR-RUST przez orkiestratora)

- D-F2-1: producent w `view-model` przyjmuje JAWNE wejścia (kolejność kluczy mapy, węzły, zbiory mgły aktywnego fotela), nie `PlayableState`: D-DTO-1 = A (crate zależy tylko od `serde`, nie może czytać silnika). Wpięcie `PlayableState → wejścia` (`hex_order`, `current_visible` z FOG-VIEW w `engine/src/domain/state.rs`, węzły z miast/fortów) jest poza allowlistą (`engine/`) — kandydat na osobny temat (DTO-BRIDGE / FOG-WIRE).
- D-F2-2: `borders` w DTO = boki `(hex, dir)` (bez geometrii świata); adapter liczy rogi i klucze `toFixed(5)` i odrzuca DTO niezgodne z regułą renderera (błąd, nie cichy rysunek).
- D-F2-3: `pop: f64` (liczba JS: `Math.floor`, `Number.isFinite`), `order.turn/seq: f64`.

## WEKTORY (generator wykonuje tekst pinu)

`node rust-port/renderer/tests/territory_ranges_f2_gen.mjs` (oraz `--check` → „vectors.json matches the pin”). Transpilacja TypeScript całych plików `territory.ts`, `range-hexes.ts`, `territory-border.ts`, `hexutil.ts`, wycinków `okolica.ts:37-50` i `main.ts:15593-15601` (SHA-256 w `sources`). 8 scenariuszy: 2 właścicieli bez mgły; mgła z `ME()`=0; mgła z `ME()`=1 (hotseat); mgła bez widzianych heksów; przypadki populacji (0, 3, 2.9, 20, −4); forty/posterunki z i bez `order`, barbarzyńcy −1, rebelianci −99; 14 węzłów (ścieżka indeksu) z mgłą i bez. Łącznie 3912 krawędzi granic.

## BRAMKI (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpadzie poza repo; dysk 16–17 GB wolne przed bramką pełną, bez równoległych buildów)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (renderer, view-model) | EXIT 0 / EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (view-model) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (renderer) | EXIT 0 |
| `cargo test --test territory_ranges_f2` (renderer) | 8 passed, 0 failed |
| `cargo test --all-targets --no-fail-fast` (view-model) | EXIT 0, 0 FAILED |
| `cargo test --all-targets --no-fail-fast` (renderer) | EXIT 0; 79 binarek, 680 passed, 0 failed |
| `node …/territory_ranges_f2_gen.mjs --check` | zgodne z pinem |

## MUTACJE (skrypt w scratchpadzie, plik przywrócony i porównany `cmp`)

| Mutacja | Wynik `territory_ranges_f2` |
|---|---|
| (a) bok do sąsiada TEGO SAMEGO właściciela liczony jako granica | FAIL (`borders_match_pin`, `border_group_from_ranges`) |
| (a2) granica tylko do heksu innego właściciela (pominięte boki do niczyich/ukrytych) | FAIL (te same 2) |
| (b) brak filtru widoczności dla cudzych właścicieli | FAIL (`by_owner_matches_pin`, `borders_match_pin`) |
| (b2) `ME()` zastąpione fotelem 0 | FAIL (te same 2) |
| (b3) pominięte `explored` | FAIL (te same 2) |
| (c) fort wygrywa z miastem | FAIL (te same 2) |

Dodatkowo test negatywny adaptera: wstrzyknięty bok wewnętrzny, brakujący bok, zła kolejność właścicieli, `dir = 6` → błędy `TerritoryBorderMismatch`/`TerritoryBorderOwners`.

## UWAGI

- `Cargo.lock` nie commitowany (zmiana przywrócona). Target cargo usunięty po bramkach.
- Brak produkcyjnego wołającego `territory_ranges_dto` po stronie silnika (D-F2-1) — jawnie, nie ukryte.
