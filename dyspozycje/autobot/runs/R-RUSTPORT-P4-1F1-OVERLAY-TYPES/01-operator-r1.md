# R-RUSTPORT-P4-1F1-OVERLAY-TYPES — Operator, runda 1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F1-OVERLAY-TYPES
GOAL: kształt DTO nakładek zgodny z pinem 07d2fbd72 (P4-1F1 a–d) + bump CONTRACT_VERSION
ZMIANY/COMMIT: kod ea84a130b (gałąź robocza wip/R-RUSTPORT-P4-1F1-OVERLAY-TYPES, rodzic = baza b90894920); raport w commicie następnym
TESTY: view-model fmt 0 / clippy 0 / test 0 (85 passed, 0 failed, 0 ignored); renderer fmt 0 / clippy 0 / test 0 (537 passed, 0 failed, 0 ignored); 8 mutacji → 8× FAIL
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza

`origin/rust-port/parity-v2` = `b90894920c6607f18a41ff24b09ad7453362b11c` (zgodnie z dispatchem). Gałąź robocza `wip/R-RUSTPORT-P4-1F1-OVERLAY-TYPES` utworzona z `b90894920`; brak push.

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/overlays.rs` | (a) nowe `PathTurnStopDto {hex, turn: u32}` i `PathRouteDto {hexes, turnStops}`; `path_route: Option<PathRouteDto>`. (b) `BuildHighlightKind` = `FoundCity \| Wonder \| Improvement \| Mine` (JSON `foundCity`/`wonder`/`improvement`/`mine`), `Generic` usunięty. (c) `culture_range`/`religion_range`: `Option<Vec<HexCoord>>` (jeden zbiór, właściciel `0`). (d) nowe `SiegeCampDto {hex, ownerId}`; `SiegeViewDto.camp_hexes: Vec<SiegeCampDto>`. |
| `rust-port/view-model/src/root.rs` | tylko `CONTRACT_VERSION` 1 → 2 |
| `rust-port/view-model/src/validate.rs` | tylko walidacja `overlays.pathRoute.turnStops[i].turn`: `turn >= 1` i ściśle rosnąco (błąd `OutOfRange` z `min = poprzedni + 1`, istniejący wariant `ViewError`) |
| `rust-port/view-model/tests/common/mod.rs` | fikstury pod nowy kształt (`sample_path_route`, obozy z właścicielem i duplikatem, zasięgi jako heksy, `Improvement` zamiast `Generic`) |
| `rust-port/view-model/tests/json_keys.rs` | klucze `SiegeCampDto`, `cultureRange[]`/`religionRange[]` = `{q,r}`, `PathRouteDto`, `PathTurnStopDto` |
| `rust-port/view-model/tests/json_roundtrip.rs` | round-trip 4 wariantów `BuildHighlightKind`, `SiegeCampDto`, `PathRouteDto`, `PathTurnStopDto` |
| `rust-port/view-model/tests/pin_vectors.rs` | `build_highlight_kind`: 4 wartości kontraktu z cytatami gałęzi `refreshBuildHighlight` |
| `rust-port/view-model/tests/overlay_types_f1.rs` (nowy) | wektory pinu, strażnicy mutacji, walidacja `turn` (16 testów) |

`rust-port/renderer/src/**` — **bez zmian**: renderer nie używa żadnego ze zmienionych typów (`grep` po `path_route`, `culture_range`, `BuildHighlightKind`, `camp_hexes`, `SiegeViewDto`, `OverlaysViewDto` w `renderer/src` → 0 trafień; jedyne użycie nakładek to `hex_build_highlight(HexCoord)` w `view/convert.rs:57`, niezmienione). Kompiluje się i przechodzi testy przeciw nowemu DTO (bramki niżej).

`rust-port/view-model/src/lib.rs` — poza allowlistą, więc nowe typy (`PathRouteDto`, `PathTurnStopDto`, `SiegeCampDto`) **nie** są reeksportowane w korzeniu crate'a; dostępne przez publiczny moduł `civ_view_model::overlays::…` (testy tak importują). Uwaga dla orkiestratora: reeksport w `lib.rs` (1 linia) do dopisania w temacie z tym plikiem na allowliście (np. P4-1F5 / P4-1H Q5).

`Cargo.lock` (renderer, zmieniony przez cargo) przywrócony `git checkout`, nie commitowany. Silnik (`rust-port/engine`) nie konstruuje `OverlaysViewDto`/`SiegeViewDto` (`grep` → 0), więc nie wymaga zmian.

## Decyzje techniczne

1. **(b) `Wonder` + `Improvement` zamiast pola krycia.** Pin `refreshBuildHighlight` (`main.ts:16351-16395` @ `07d2fbd72`) ma 4 rozłączne gałęzie: `foundCityMode` → `setHighlight(qual)` krycie domyślne (`:16352-16361`); `activeWonderId` → `setHighlight(...)` krycie domyślne (`:16363-16367`); kopalnia złoża → `clearHighlight()` + `refreshMineEligibleOverlay(hexes)` (`:16386-16390`); pozostałe ulepszenia → `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16391-16395`). Rodzaj gałęzi jednoznacznie wyznacza warstwę i krycie, a krycie jest stałą renderera (nie danymi gry) — pole krycia w DTO przeniosłoby stałą prezentacji do producenta i pozwoliłoby na wartości spoza pinu. Stąd jeden wariant na gałąź. Kolejność wariantów = kolejność gałęzi w pinie.
2. **(a) `turn: u32`, walidacja ≥ 1 i ściśle rosnąco.** `planPathTurns` / `applyFogToPathPlan` (`game/planned-march.ts:116-141`, `:242-268`): `turnNum = 1`, stop dodawany z `turnNum`, potem `turnNum++`; końcowy stop tylko, gdy różny od ostatniego. Stąd tury ≥ 1, ściśle rosnące, z możliwymi lukami (`turnNum++` bez dodania przy `i === 0` lub powtórzonym heksie) i możliwa pusta lista. Nie waliduję, czy heks stopu leży na trasie: web pomija taki stop (`render/units.ts:6668-6669`, `if (idx < 0) continue`), więc to nie jest niezmiennik pinu. `hexes` zawiera heks jednostki jako pierwszy (`[{q: u.q, r: u.r}, ...plan.fullPath]`, `main.ts:31175-31176`).
3. **(c) `Option<Vec<HexCoord>>`, `None` = brak warstwy.** Web liczy jeden zbiór dla literału `0` (`main.ts:15632`, `:15640-15642`) i dodaje warstwę tylko przy `keys.size > 0` (`:15633`, `:15643`). Producent (P4-1F2) daje `None` dla: przełącznik wyłączony, panel miasta otwarty, zbiór pusty. `Some(vec![])` nie jest walidowane jako błąd (`validate.rs` poza zakresem tej walidacji) — odnotowane w dokumentacji pola.
4. **(d) właściciel per wpis, duplikaty zachowane.** `SiegeCampDto.owner_id` = `campOwnerByHex` (`render/siegeCampSync.ts:30-47`: pierwsza jednostka pełnej listy `units` na heksie z `ownerId !== cityOwnerId`, `:43`), liczony przez producenta z pełnej listy (bez mgły, `main.ts:17514`), bo renderer dostaje `units[]` po filtrze widoczności (rozpoznanie §5 pkt 1). Duplikaty heksów zostają (jeden wpis na jednostkę, `main.ts:17501-17508`), bo `machinesByCampHex` rozdziela maszyny round-robin po pełnej liście z powtórzeniami (`siegeCampSync.ts:14-27`). Pole wymagane (bez `Option`): obóz powstaje tylko z jednostki wrogiej właścicielowi miasta, więc `campOwnerByHex` zawsze znajdzie właściciela dla heksu obozu.

## Wektory z pinu (wykonane, nie przepisane z pamięci)

Pin uruchomiony wprost: `git archive 07d2fbd72 gra/src gra/data` do katalogu tymczasowego, skrypt `tsx@4.19.2` importujący `map/range-hexes.ts` i `render/siegeCampSync.ts`. Mapa: klucze wstawione w kolejności `["10,0","11,0","12,0","2,0","3,0","0,0","1,0"]`. Wyniki (wklejone jako oczekiwane w `tests/overlay_types_f1.rs`):

```text
collectTerritoryHexKeysByOwner(map, [(11,0) pop1 owner1, (1,0) pop1 owner0])
  -> [[1,["10,0","11,0","12,0"]],[0,["2,0","3,0","0,0","1,0"]]]
  z filtrem (owner 0 zawsze, inni bez "12,0")
  -> [[1,["10,0","11,0"]],[0,["2,0","3,0","0,0","1,0"]]]
collectCultureRangeHexKeys(map, [c1 (11,0) o0, c2 (1,0) o0, c3 (3,0) o1], 0)
  -> ["10,0","11,0","12,0","2,0","3,0","0,0","1,0"]
  tylko miasto właściciela 1 -> []
collectReligionRangeHexKeys(map, te same miasta, new Map(), null, {szerzenieMaxDystans:0}, 0)
  -> ["10,0","11,0","12,0","2,0","3,0","0,0","1,0"];  bez miast -> []
machinesByCampHex(["1,0","1,0","0,1"], ["taran","wieza","taran"])
  -> [["1,0",["taran","wieza"]],["0,1",["taran"]]]
campOwnerByHex(["1,0","1,0","0,1"], [(1,0) o5, (1,0) o2, (0,1) o3, (0,1) o3], keyOf, 5)
  -> [["1,0",2],["0,1",3]]
```

Kolejność `"10,0"` przed `"2,0"` jest zachowana w JSON (test porównuje też z kolejnością `BTreeSet` i wymaga różnicy). Pusty wynik → `null` w JSON (brak warstwy). `planPathTurns` nie uruchamiany (wymaga mapy z kosztami ruchu i jednostki); niezmiennik `turn` wyprowadzony z kodu (decyzja 2) — wektory trasy należą do P4-1F5/P4-1H Q5.

Golden zapisu: nie dotyczy (temat nie zmienia formatu zapisu gry; `view-model` nie ma golden JSON — `tests/fixtures/` to `pin_literals.json` i `README.md`, bez zmian).

## Bramki (kody wyjścia)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach).

| Crate | `cargo fmt --check` | `cargo clippy --all-targets -- -D warnings` | `cargo test --all-targets --no-fail-fast` |
|---|---|---|---|
| `rust-port/view-model` | 0 | 0 | 0 — 85 passed / 0 failed / 0 ignored (id_invariant 10, json_keys 11, json_roundtrip 13, json_strict 3, overlay_types_f1 16, pin_vectors 18, validate 14) |
| `rust-port/renderer` | 0 | 0 | 0 — 537 passed / 0 failed / 0 ignored (66 binarek testowych) |

Brak `#[ignore]`; żadna istniejąca asercja nie została osłabiona (zmienione asercje w `json_keys.rs`/`pin_vectors.rs` sprawdzają nowy, węższy kształt).

## Mutacje (każda MUSI dać FAIL) — wynik: 8/8 FAIL

Skrypt: modyfikacja źródła → `cargo test --all-targets --no-fail-fast` w `view-model` → `git checkout` pliku.

| Mutacja | Wynik |
|---|---|
| M1 `turn` opcjonalny (`#[serde(default)]`) | FAIL: `turn_stop_without_turn_is_rejected`, `every_required_key_is_required` |
| M1b pole `turn` usunięte | FAIL (kompilacja testów, 1 błąd) |
| M1c walidacja `turn` wyłączona (`min = 1`) | FAIL: `invalid_turns_are_rejected` |
| M2 cud jako `generic` (`#[serde(rename = "generic")]` na `Wonder`) | FAIL: `generic_kind_is_rejected`, `wonder_and_improvement_are_distinct_kinds`, `build_highlight_kind` |
| M2b cud zlany z ulepszeniem (`rename = "improvement"`) | FAIL: 7 testów (m.in. `wonder_and_improvement_are_distinct_kinds`, `build_highlight_kind`, `overlay_types`) |
| M3 `campHexes` bez właściciela (`Vec<HexCoord>`) | FAIL (kompilacja testów, 3 błędy) |
| M3b właściciel obozu opcjonalny (domyślny) | FAIL: `camp_without_owner_is_rejected`, `every_required_key_is_required` |
| M4 zasięg kultury per właściciel (`Vec<OwnerHexesDto>`) | FAIL (kompilacja testów, 2 błędy) |

## Uwagi dla kolejnych tematów

- P4-1G (adapter, Q5/Q6) i P4-1H Q5 (`preview_path`) korzystają z `PathRouteDto` i `SiegeCampDto` — kształt zgodny z `P4-1H-COMMANDS-ROZPOZNANIE.md:99` (`{hexes, turn_stops: [{q, r, turn: u32}]}`, tu `hex` zamiast `q/r`, jak w pozostałych DTO).
- Kontrakt `P4-1-RENDER-DTO-CONTRACT.md` §3.5 (wiersz `SiegeViewDto`: „właściciel obozu liczy renderer”) i §3.7 (wiersze `cultureRange`/`religionRange`, `buildHighlight`, `pathRoute`) wymagają aktualizacji — plik poza allowlistą tego dispatchu; do wykonania przez orkiestratora albo temat dokumentacyjny.
- `lib.rs`: reeksport `PathRouteDto`, `PathTurnStopDto`, `SiegeCampDto` (poza allowlistą, patrz wyżej).
