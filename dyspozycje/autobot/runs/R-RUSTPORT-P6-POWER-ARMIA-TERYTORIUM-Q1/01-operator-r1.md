STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-ARMIA-TERYTORIUM-Q1 (runda 1/5, Operator)
GOAL: (1) port armyFieldPower z pinu 07d2fbd72 do Rust, (2) producent składnika "armia" (web sumArmyMForOwner), (3) weryfikacja semantyczna kandydata territory.rs:475 względem pinu i producent składnika "terytorium".

ZMIANY/COMMIT:
- Gałąź robocza: rust-port-wip/POWER-ARMIA-TERYTORIUM-Q1 (lokalnie, NIE wypchnięta).
- SHA kodu: 388610589ef28302ce8938098cca836ffa980d64 (brake_power_army.rs, mod.rs, p6_power_army.rs, p6_power_army_gen.mjs, p6_power_army_vectors/vectors.json).
- SHA raportu: HEAD gałęzi (commit dokumentacyjny nad SHA kodu).
- Baza: 8a98f31fd (FC POWER-PRODUCERS), zgodnie z dispatchem. Patrz BLOKADY pkt 1.
- Allowlista: nowy domain/brake_power_army.rs; domain/mod.rs (tylko `pub mod brake_power_army;`); tests/p6_power_army*.rs; tests/p6_power_army_vectors/*; tests/p6_power_army_gen.mjs; dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-ARMIA-TERYTORIUM-Q1/**.
- NIE zmieniano: unit_power.rs (armyFieldPower zaimplementowane w nowym module), brake_power_producers.rs (COMPONENT_SOURCES), gra/**, WERSJE.md, Cargo.toml, Cargo.lock (artefakt builda, niezacommitowany), origin/main.
- LOC: brake_power_army.rs 191, p6_power_army.rs 257, gen.mjs 230 (wszystkie <= 600).

WYNIKI PRACY (merytorycznie):
- armyFieldPower (unit-power.ts:182): isSiegeUnit (Rola (linia) === 'Oblężnicza', dokładnie) -> 0; cache fieldPower używany tylko gdy typeof number, finite i rangedDamageMultFor == 1; w przeciwnym razie fieldPower() z combat-params.json. Port: `army_field_power`, reuse `unit_power::field_power` i `ranged_damage_mult_for`.
- Producent `armia` = web sumArmyMForOwner (main.ts:2672, NOMINALNY, nie sumArmyMForOwnerEffective; computeObjectivePower dostaje `jednostki: sumArmyMForOwner`, main.ts:2762). Port: `sum_army_m_for_owner(units, owner, count_settlers, coeffs)` + `armia_for_owner`. Opcja liczyOsadnikWArmii: w power-params.json wartosc true (opcja legacy, no-op); wołający podaje `count_settlers`.
- Kandydat territory.rs:475 (`collect_territory_hex_keys_by_owner`) NIE jest ekwiwalentem składnika `heksyTerytorium`. Kandydat przypisuje każdy heks JEDNEMU właścicielowi (rozstrzyganie sporu przez territory_owner_at), a web countTerritoryHexes(statsTerritoryNodesForOwner(owner)) liczy unię dysków (promienie cityTerritoryRadius) WŁASNYCH węzłów właściciela, bez rozstrzygania sporów z cudzymi. Dowód: test `territory_candidate_differs_from_web_union_count` (dwa miasta różnych właścicieli, pop 5, odl. 2: kandydat < unia). Producent `terytorium` zaimplementowany jako nowy port web: `territory_hexes_for_owner` / `count_territory_hexes` / `terytorium_for_owner` (foundingNodesForOwner + cityTerritoryRadius + hexKeysWithinRadius, istniejące heksy).
- Wektory: NIE ręcznie. tests/p6_power_army_gen.mjs wycina z pinu (git archive 07d2fbd72 gra/src gra/data -> katalog poza repo) funkcje unit-power.ts, main.ts (sumArmyMForOwner, statsTerritoryNodesForOwner, countTerritoryHexes[Raw], cityNodesForOwner), okolica.ts, territory.ts, fort-territory.ts i je wykonuje (Node 22 stripTypeScriptTypes). Wejścia: LCG, seed 0x5eed2027. Wygenerowano: armyField 80, armia 60, terytorium 50.

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0 (po rustfmt nowych plików).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: EXIT 0, 48 passed, 0 failed.
- cargo test --test p6_power_army: EXIT 0, 6 passed, 0 failed (army_field_power_matches_web_pin, sum_army_m_matches_web_pin, territory_hexes_match_web_pin, siege_units_contribute_zero_even_with_cache, cache_is_ignored_when_ranged_mult_differs_from_one, territory_candidate_differs_from_web_union_count).
- Nie uruchamiano przeglądarki (brak zmian wizualnych).

BLOKADY:
1. ROZBIEŻNOŚĆ BAZY (wymaga decyzji orkiestratora przed integracją). Zlecenie podawało bazę origin/rust-port/parity-v2 (f207ea6b1 lub nowszy); dispatch podaje 8a98f31fd. Użyto 8a98f31fd, bo: (a) brake_power_producers.rs (producenci ludki/rekruci/miasta/kultura, od których zależy kontekst tematu) istnieje tylko na 8a98; (b) 8a98 NIE jest przodkiem parity-v2 (ec4e11741). Różnica 8a98 vs parity-v2: 28 plików, +4516/-31523 -> 8a98 leży na STARSZEJ bazie niż parity-v2; integracja z parity-v2 bez rebase/merge wycofałaby ~15 commitów parity-v2. Orkiestrator musi rozstrzygnąć (rebase na parity-v2 przed integracją albo inna baza).
2. COMPONENT_SOURCES nie zaktualizowane (brake_power_producers.rs poza allowlistą): wpisy "armia" i "terytorium" nadal NoProducer. Podłączenie producentów do produce_for_owner / ObjectivePowerRaw wymaga osobnego tematu lub rozszerzenia allowlisty. Wołający W8 r3 musi podać `count_settlers` i listę ArmyUnit z unitDefFor (ArmyUnitDef::from_unit_record daje definicję bazową, bez veteran/unit-replace).
3. Brak zmian w unit_power.rs: armyFieldPower żyje w brake_power_army.rs (dispatch dopuszczał nowy moduł).

RUNDY: 1/5 (Operator).
NASTĘPNY KROK: Evaluator (Sonnet) na 388610589 + raport; Final Control po PASS; orkiestrator: decyzja o bazie (BLOKADA 1) i osobny temat na podłączenie do COMPONENT_SOURCES (BLOKADA 2).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje).
