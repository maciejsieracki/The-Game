STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-POP-Q1
GOAL: W8 r6 klocek 2 - populacja/kultura miast w PlayableCity + producenci ludki/rekruci/kultura/terytorium + wspolna granica
ZMIANY/COMMIT: SHA w wiadomosci koncowej (commit na galezi roboczej). Allowlista:
  rust-port/engine/src/domain/playable.rs, turn_war_inputs.rs;
  tests/p6_wire_war_{inputs,epoch,view,forced_step,march_adapter}.rs (dodanie pol literalow, zamiana oczekiwanych Missing/Err na wartosci);
  nowe: tests/p6_wire_war_pop.rs, p6_wire_war_pop_gen.mjs, p6_wire_war_pop_vectors/{shared_border.json, old_state_pre_pop.json}.
  Cargo.lock / target/ NIE commitowane.
BAZA: UWAGA - zadanie wskazywalo origin/rust-port/parity-v2 (81e7840ba), ale ta galaz NIE zawiera turn_war_inputs/pipeline/epoch
  (EPOKA nie zintegrowana). Dispatch wskazuje fa480bf2a (FC EPOKA, potomek f207ea6b1); praca wykonana na fa480bf2a.
  Integracja na parity-v2 = zadanie orkiestratora (mozliwe konflikty mod.rs/playable.rs).

## Zmiany
1. PlayableCity: `population: u32` (#[serde(default)] = FOUNDING_CITY_POPULATION 1), `culture: u32` (#[serde(default)] = 0).
   Kompatybilnosc wsteczna WYLACZNIE przez serde(default); migracja niepotrzebna. Test na fixture bez tych pol
   (old_state_pre_pop.json = serializacja stanu z kluczami usunietymi) + round-trip.
2. power_raw_for_owner: ludki, rekruci (manpower None = max, jak web undefined), kultura = Provided z pol stanu miast
   (usuniete FOUNDING_POPULATION/FOUNDING_CULTURE i nadpisywanie Missing); terytorium = terytorium_for_owner(miasta z populacja,
   brak fortow, hex_exists = prostokat mapy). infra/tech/religia nadal Missing (brak magazynow w stanie) - jawny blad STRICT.
3. shared_border_pairs: port ownersShareLandBorderLive (main.ts:5690) = owners_have_shared_land_border (trade.rs) na wezlach miast
   z promieniem city_territory_radius(pop) i TradeMap z PlayableMap (Water->Ocean). Usuniety WarInputsError::SharedBorderUnavailable.
4. UNPRODUCED_POWER_COMPONENTS: 7 -> 3 (infra, tech, religia); KNOWN_GAPS przepisane (nadal 5 wpisow).

## Zmiany asercji (tylko zamiana Missing/Err na wartosc)
- p6_wire_war_inputs: production_power_inputs_mark_unproduced...: Missing dla ludki/rekruci/terytorium/kultura -> Provided (1.0 / >=0 / >0 / 0.0);
  shared_border_..._and_an_error_above -> ..._and_computed_above (Err(SharedBorderUnavailable) -> Ok({(1,2)}), tez w build_war_inputs_with_epochs);
  state_with dostaje mape 30x30 rowniny (pusta mapa = 0 heksow).
- p6_wire_war_epoch: shared_border_producer_is_explicitly_unavailable... -> shared_border_producer_computes_above_two_cities; state_with z mapa; komentarz.
- playable.rs (test modulowy): komunikat blokady zawiera "infra" zamiast "ludki".
- Pozostale testy: tylko dopisane pola population/culture w literalach PlayableCity.
Zadne asercje p6_power_* ani pipeline nie zostaly zmienione.

## Wektory z pinu
p6_wire_war_pop_gen.mjs WYKONUJE kod pinu 07d2fbd72 (ownersHaveSharedLandBorder trade-routes.ts:264, territoryOwnerAt/cityTerritoryRadius,
cityRangeForPopulation, hexNeighborCoords...). 60 przypadkow (38 true / 22 false, mapy 30-44, woda 0-55%, pop 1-9), symetria weba sprawdzona.
Rust zgodny na wszystkich 60 (test shared_border_matches_pin_vectors).

## Co nadal blokuje advance_turn z AI z miastami
infra (budynki), tech, religia (miasta_jednosc_religii): PlayableState nie ma magazynow budynkow/badan/religii. Nie wszystkie zrodla dostepne,
wiec test 3 tur advance_turn z AI z miastami NIE jest mozliwy (test: run_war_turn zwraca PowerComponentsMissing dokladnie [infra,tech,religia];
build_war_inputs przechodzi, wspolna granica nie blokuje).

## Luki / NIE_ZMIERZONO
- Populacja i kultura NIE ROSNA miedzy turami (brak Economy); manpower biezacy nie w stanie (None=max).
- Brak fortow/posterunkow w stanie (terytorium i granica bez wezlow fortowych).
- Pozycja x,y mapy czytana jako (q,r) (konwencja ManpowerCity) - zgodnosc siatki z mapa weba NIE_ZMIERZONO.
- COMPONENT_SOURCES w brake_power_producers.rs nie zsynchronizowane (osobny temat POWER-SOURCES).

TESTY: patrz sekcja nizej (wyniki bramek).
BLOKADY: brak (uwaga o bazie powyzej)
RUNDY: 4/5 (nazwa pliku wg zadania; dispatch w repo opisuje runde 1)
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Bramki
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib, p6_wire_war_{inputs,epoch,pop}: zielone (51 lib, 9 epoch, 14 inputs, 9 pop)
- pelny cargo test --no-fail-fast: 389 binarek "test result: ok", 0 FAILED
