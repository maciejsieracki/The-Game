# P6 REPIN — OBLĘŻENIE: budowa machin oblężniczych (R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1)

Źródło web: `gra/src/game/siege-engine-build.ts` (109 linii), `gra/data/siege-engine-params.json`
(`unitsPerSiegeEngine` = 10), commit web `6218f2ab1` (SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE).
Kolejka `gra/src/game/siegeMachines.ts` (queue/ensure/cancel): **poza zakresem tej rundy** (NIE_ZMIERZONO wpływu na turę).

## Tabela

| Miejsce web | Co | Klasa | Rust | Status |
|---|---|---|---|---|
| `siege-engine-build.ts` `isSiegeEngineDef` | `Typ` po trim == `Siege` | LOGIKA | `domain/siege_engine_build.rs::is_siege_engine_def` | PORT + wektory (ZMIERZONO) |
| `siege-engine-build.ts` `qualifyingSiegeArmyCount` / `siegeEngineQuota` | liczenie jednostek bez `obleznicza`, `floor(n/10)` | LOGIKA | `qualifying_siege_army_count`, `siege_engine_quota` | PORT + wektory (ZMIERZONO) |
| `siege-engine-build.ts` `siegeEngineBuildOption` | kolejność bramek, 9 powodów blokady | LOGIKA | `siege_engine_build_option` | PORT + 52 wektory z weba, w tym 16 z realnych wpisów `units.json` `Typ=Siege` (ZMIERZONO, 4/4 testy zielone) |
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
6. wymagana technologia nieodblokowana → `technology_locked`. Jak web: warunek `-`/`—` sprawdzany na SUROWYM `Tech`, nieodblokowana jest wartość po trimie (`' - '` blokuje, `' Inzynieria '` wymaga odblokowania `Inzynieria`).
7. skarbiec < koszt pieniężny → `insufficient_money`.
8. brak surowca → `insufficient_resources`.

`not_besieger` istnieje w typie web, ale web go nie zwraca (nie zwracamy go też).

## Testy

- `tests/p6_repin_oblezenie_maszyny_web_parity.rs` (4 testy: parametr, kwoty, pomocnicze, 52 przypadki z weba).
- Pokrycie powodów: `technology_locked` 9, `not_siege` 1, `not_at_war` 1, `no_qualifying_army` 3, `too_few_units` 2, `turn_limit_reached` 3, `insufficient_money` 2, `insufficient_resources` 7, `allowed` 24. `not_besieger` nieosiągalny (jak web).
- Wektory: `tests/p6_repin_oblezenie_maszyny_web_vectors.json` (generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1/vectors-gen/gen.ts`,
  bundle esbuild 0.24.2 + Node 22 z `git archive origin/main gra/src gra/data`).
- Bramki (runda 2, commit po obronie): `cargo fmt --check` OK, `cargo clippy --all-targets -- -D warnings` OK, `cargo test --lib` 22 passed, parity 4 passed. `data_loader` i `data_compliance` nie uruchamiane w tej rundzie: nie dotknięte (brak zmian w `data/` i w tych testach).

## Długi (zarejestrowane w obronie rundy 2)

- **D-OBL-MACH-1 (decyzja orkiestratora):** `unitsPerSiegeEngine` jako stała Rust (Z-SEM-5), a nie `rust-port/engine/data/siege-engine-params.json`. Pełny parytet danych wymaga rozszerzenia allowlisty o `tests/data_loader.rs` i `tests/data_compliance.rs` (pin 29 plików). Do decyzji.
- **D-OBL-MACH-2:** kolejka `siegeMachines.ts` (queue/ensure/cancel) niezportowana; osobny temat.
- **D-OBL-MACH-3:** wpięcie w turę i UI (`battleScene`, `turn`) do serii W.
- **D-OBL-MACH-4:** koszt pieniężny (`costMoney`) podaje wołający (Z-SEM-2); brak źródła kosztu w Rust dla tej jednostki w tej rundzie.
