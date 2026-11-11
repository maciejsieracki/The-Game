# P6 REPIN — OBLĘŻENIE: budowa machin oblężniczych (R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1)

Źródło web: `gra/src/game/siege-engine-build.ts` (109 linii), `gra/data/siege-engine-params.json`
(`unitsPerSiegeEngine` = 10), commit web `6218f2ab1` (SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE).
Kolejka `gra/src/game/siegeMachines.ts` (queue/ensure/cancel): **poza zakresem tej rundy** (NIE_ZMIERZONO wpływu na turę).

## Tabela

| Miejsce web | Co | Klasa | Rust | Status |
|---|---|---|---|---|
| `siege-engine-build.ts` `isSiegeEngineDef` | `Typ` po trim == `Siege` | LOGIKA | `domain/siege_engine_build.rs::is_siege_engine_def` | PORT + wektory (ZMIERZONO) |
| `siege-engine-build.ts` `qualifyingSiegeArmyCount` / `siegeEngineQuota` | liczenie jednostek bez `obleznicza`, `floor(n/10)` | LOGIKA | `qualifying_siege_army_count`, `siege_engine_quota` | PORT + wektory (ZMIERZONO) |
| `siege-engine-build.ts` `siegeEngineBuildOption` | kolejność bramek, 9 powodów blokady | LOGIKA | `siege_engine_build_option` | PORT + 35 wektorów z weba (ZMIERZONO, 4/4 testy zielone) |
| `siege-engine-build.ts` `unitStockCost` (wejście) | koszt zasobowy | LOGIKA | istniejące `building_costs::p6_7b::unit_stock_cost` | ZGODNE (wektory `costStock`) |
| `siege-engine-params.json` `unitsPerSiegeEngine` = 10 | parametr | DANE | stała `SIEGE_ENGINE_UNITS_PER_MACHINE` (ZAŁOŻENIE Z-SEM-5) | ZGODNE wartością; brak pliku w `rust-port/engine/data/` |
| `siegeMachines.ts` `queueSiegeMachine` / `ensureSiegeMachines` / `cancelUnpaidLegacySiegeMachineQueue` | kolejka machin | LOGIKA | — | LUKA (poza zakresem; do osobnego tematu) |
| wpięcie w turę / UI (`battleScene`, `turn`) | wywołanie budowy | LOGIKA/UI | — | dług do serii W (NIE BLOCK) |

## Zakres bramek (kolejność jak w web)

1. `Typ` != `Siege` → `technology_locked` (web zwraca ten powód także dla zwykłych jednostek; przeniesione 1:1).
2. brak `activeSiege` → `not_siege`; brak `atWar` → `not_at_war`.
3. brak jednostek właściciela w armii, lub 0 kwalifikujących → `no_qualifying_army`.
4. kwalifikujące < 10 → `too_few_units`.
5. już zbudowane w tej turze >= kwota → `turn_limit_reached`.
6. wymagana technologia (`Tech` inne niż `-`/`—`) nieodblokowana → `technology_locked`.
7. skarbiec < koszt pieniężny → `insufficient_money`.
8. brak surowca → `insufficient_resources`.

`not_besieger` istnieje w typie web, ale web go nie zwraca (nie zwracamy go też).

## Testy

- `tests/p6_repin_oblezenie_maszyny_web_parity.rs` (4 testy: parametr, kwoty, pomocnicze, 35 przypadków z weba).
- Wektory: `tests/p6_repin_oblezenie_maszyny_web_vectors.json` (generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1/vectors-gen/gen.ts`,
  bundle esbuild 0.24.2 + Node 22 z `git archive origin/main gra/src gra/data`).
- Bramki: `cargo fmt --check` OK, `cargo clippy --all-targets -- -D warnings` OK, `cargo test` lib (22), `data_loader` (40), `data_compliance` (14), parity (4): 0 failed, 0 ignored.
