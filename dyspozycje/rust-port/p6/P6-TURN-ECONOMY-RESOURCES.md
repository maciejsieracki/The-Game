# P6 — pipeline zasobów per tura (R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1)

Pin weba: `4bbef081d`. Moduł: `rust-port/engine/src/domain/turn_economy_resources.rs` (NOWY, obok
`turn_economy.rs`; rozliczacz skarbca `u64` / „Work pool” NIE zmieniony — inny kontrakt: web `f64` per miasto,
pula właściciela rozsmarowana po `City.surowce`). Testy: `rust-port/engine/tests/p6_turn_econ_res_pipeline.rs`,
wektory `tests/p6_turn_econ_res_vectors/pipeline.json` (sha256 `b48b950bbe005d11…`, generator odtwarzalny bajt w bajt).

## 1. Hunki behawioralne `turn-economy.ts` dotyczące zasobów

Wszystkie 15 hunków `turn-economy.ts` z `runs/R-RUSTPORT-REPIN-DELTA-3-Q1/hunki-r2.tsv` jest zasobowych (nawlekanie
`SpichlerzDrainParams` przez tick, R-WEB-SPICHLERZ-DRAIN-KEYS-Q1). Lista: `runs/<ID>/hunki-turn-economy-ts.tsv`.

## 2. Tabela zmiana → web → Rust → test → status

| Zmiana | Web (plik:linia @ pin) | Rust | Test | Status |
|---|---|---|---|---|
| Parametry drenażu z econ-params wg trudności | turn-economy.ts:2478-2481 (hunk 2477) | `run_city_economy_resource_phase` → `load_spichlerz_drain_params` | `pipeline_matches_*` (nadpisanie błędnych params) | PORT |
| Tick: faza 1 wpływ z mapy | turn-economy.ts:1715-1753 | `tick_empire_resource_pipeline` | wektory 461 scen. | PORT |
| Tick: faza 2 konwertery | turn-economy.ts:1755-1789; converters.ts:162-208,340-360 | jw. + `run_converter(s)`, `DEFAULT_CONVERTER_RECIPES` | `run_converter_matches_running_web` (4095), `recipes_match_web` | PORT |
| Tick: faza 3 drenaż Spichlerza | turn-economy.ts:1791-1807 (hunk 1797) | jw. → `pay_spichlerz_drain_for_city` (PRODUKCYJNY wołający) | `tick_direct_edges_n_minus_1_n_plus_1`, wektory | PORT |
| Brak surowca → brak bonusów ludności | building-resource-gate.ts:~440 (`resolveSpichlerzCityBonusState`) | `resolve_spichlerz_city_bonus_state` w fazie 3 | `tick_direct_edges…` (24 → `ma_spichlerz_pop=false`) | PORT |
| Bonus Garncarni po drenażu / symulacja | turn-economy.ts:1363-1380, 1563-1593 (hunki 1367,1374,1567,1583) | `simulate_ceramika_after_spichlerz_drains`, `compute_garncarnia_surplus_zadowolenie_by_owner` | wektory (`garnPre/True/FalsePost`) | PORT |
| Mnożnik Stolarni (wpływ drewna) | turn-economy.ts:791-808 | `apply_stolarnia_drewno_map_inflow` | `throughput_for_era_and_stolarnia_inflow_match_web` | PORT |
| Przepustowość wg epoki | converters.ts:142-150 | `converter_throughput_for_era` | jw. (192) | PORT |
| `simulateResourcePipelineForPreview` (podgląd HUD) | turn-economy.ts:1389-1560 (hunki 1406,1547) | — | — | NIE PORTOWANE: wymaga `computeLostToNearerSiblingByCity`/terytorium/map (poza allowlistą), brak HUD w Rust; NIE_ZMIERZONO |
| `previewCityEconomy` / `advanceCityEconomy` reszta | turn-economy.ts:1836+, 2400+ | — | — | POZA ZAKRESEM (plony miast; inny temat) |

## 3. ZAŁOŻENIA

1. Rejestracja modułu wymaga jednej linii w `domain/mod.rs` (poza allowlistą dosłownie; minimalna, konieczna).
2. „Produkcyjny wołający”: w Rust nie istnieje jeszcze port `advanceCityEconomy`; wołającym jest
   `run_city_economy_resource_phase` (odpowiednik web `turn-economy.ts:2476-2500`), publiczne wejście ticku
   zasobów, które wywoła przyszły port `advanceCityEconomy`. Wołają go testy na typie produkcyjnym `state::City`.
3. Dane wejściowe ticku liczone gdzie indziej w webie (`territoryResourceByCity`, `workedMagazynByCity`, liczniki
   Stolarni/Kamieniarni, cap, przepustowości, resolvery) są parametrami (jak w sygnaturze weba `:1691-1712`).
4. Globalne mapy weba `_spichlerzSol*` zwracane w `EmpireResourceTickOutcome`. Rekordy `Record<string,number>` =
   `BTreeMap` (kolejność kluczy niemodelowana; klucze niezależne).
5. Bramka runtime (`filter_runtime_active_built_ids`) jest dla faz konwerterów semantycznie bezczynna (patrz M35–M37).
6. Wektory: 461 scenariuszy (brzegi N-1/N/N+1 dla Spichlerza I/II, Ceramika/Sól osobno, drenaż 25 i niestandardowy,
   2 Spichlerze w jednej puli, Garncarnia zasilająca Spichlerz, cap, ułamki; 420 losowych, ziarno stałe).

## 4. Mutacje (turn_economy_resources.rs): 40 mutantów, 32 zabite, 8 równoważnych (SURVIVED, dowód)

Zabite 32/32 nierównoważnych (100%; 32/40 = 80% brutto). Równoważne:

* M03 `raw.is_nan() || raw <= 0.0` → `raw < 0.0` (`turn_economy_resources.rs:443`): przy `raw == 0` / NaN kredyt
  `floor(raw*mult)` ≤ 0 lub NaN i `credit_owner_resource_stock` zwraca bez zmiany (`building_costs.rs:788`).
* M15 `*per_cykl <= 0.0` → `< 0.0` (`:203`): wszystkie `inputs` receptur > 0 (`:60-137`), gałąź nieosiągalna.
* M17 `throughput > 0.0` → `>= 0.0` (`:195`): `floor(0)=0`, wynik identyczny.
* M20 `era > 1.0` → `>= 1.0` (`:154`): dla `era == 1` `e-1 = 0` w obu wariantach.
* M23 `ceramika_po_drain > 0.0` → `>= 0.0` (`:302`): jedyny wołający (`:605`) wywołuje dla `nadwyzka > 0` (guard `:602-603`).
* M35/M36/M37 (`zloto_access`, `owner_id`, ignorowanie resolvera etykiet; `:384-401`): w fazie 2 aktywne są tylko
  budynki konwerterów; bramka dla `garncarnia`/`cegielnia` (Glina) i `odlewnia_brazu` (Ruda) wymaga stanu etykiety > 0
  (`building-cost-params.json:78-85`), a receptura i tak wymaga ≥ 1 sztuki tego samego surowca
  (`DEFAULT_CONVERTER_RECIPES`), pozostałe konwertery nie są bramkowane; Mennica nie jest konwerterem.

## 5. Reprodukcja

```
node dyspozycje/autobot/runs/R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1/gen-p6-turn-econ-res-vectors.mjs <REPO> <WORK_DIR> <esbuild/lib/main.js> rust-port/engine/tests/p6_turn_econ_res_vectors
python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1/verify-p6-turn-econ-res.py rust-port/engine/tests/p6_turn_econ_res_vectors/pipeline.json
```

Generator czyta wyłącznie `git archive 4bbef081d gra/src gra/data` (esbuild w katalogu poza repo; bez buildu w `gra/`).
Weryfikator Python (`-I`) przelicza niezależnie konwertery/era/inflow i pipeline dla scenariuszy bez resolvera etykiet
(227 scen.); scenariusze z resolverem (234) potwierdza tylko web↔Rust.
