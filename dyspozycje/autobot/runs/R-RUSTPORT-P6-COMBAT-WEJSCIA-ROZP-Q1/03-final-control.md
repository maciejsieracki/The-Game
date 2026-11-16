# Final Control: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1
GOAL: mapa wejść i kroków `resolveCombat` (pin 07d2fbd72, `gra/src/game/combat.ts:842-1251`) vs Rust, propozycja typów i podziału tematów (#135 / #137 / RESOLVE-PAIR).
ZMIANY/COMMIT: allowlista = tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1/` (diff 474487792..7c0bbda7c: wyłącznie `01-rozpoznanie.md`, `02a-obrona.md`; ten plik dodany w commicie FC). Bez zmian w `rust-port/`, `gra/`, bez push.
TESTY: NIE_ZMIERZONO (temat wyłącznie odczytu, bez cargo). Dowody: odczyt plików na bazie 474487792174d9cee60e842f8fa765dd04ad5e57 i `git show 07d2fbd72`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator podejmuje decyzje techniczne D1-D4 (niżej) i dispatchuje jeden temat COMBAT-RESOLVE-PAIR-FULL.
DEPLOY/PUSH: NIE WYKONANO

Ancestry: 474487792 jest przodkiem 7c0bbda7c (`git merge-base --is-ancestor` = tak); łańcuch 474487792 -> 7e18a2a1b (operator) -> 7c0bbda7c (obrona) -> commit FC.

## Samodzielna weryfikacja twierdzeń obrony (baza 474487792)
- `apply_veteran_frac_to_combat_unit` siege_tactics_inputs_unit.rs:312; `CombatUnitModel` :165. POTWIERDZONE.
- `effective_max_hp` unit_health.rs:158 (3 argumenty). POTWIERDZONE.
- `flank_rear_defense_penalty` siege_tactics_inputs_pos.rs:261. POTWIERDZONE.
- `terrain_defense_multiplier` inputs_terrain.rs:115, `terrain_river_attack_multiplier` inputs_terrain.rs:148 oraz druga kopia siege_tactics_blow_inputs.rs:21, wołana w siege_tactics_blow_full.rs:245 (import :30). POTWIERDZONE (rozbieżność kopii realna).
- `hit_chance_tw` unit_power.rs:94; `damage_tw` siege_tactics_blow.rs:217; wołania w `resolve_ranged_phase` (combat.rs:1136; :1166, :1199) i `resolve_melee_phase` (:1386; :1455, :1459, :1490, :1493); brak `cfg(test)` w combat.rs. POTWIERDZONE.
- Pliki testów p6_repin_dystans_{formulas,fieldpower,petla}, p6_siege_tactics_roundcap, p6_heal_maxhp_wire, inputs_pos, inputs_terrain istnieją. POTWIERDZONE.
- `InstantPairOpts` :190, `PairCombatResult {attacker_hp_left, defender_hp_left, log}` :237, trait `InstantPairResolver::resolve_pair(cu_a, cu_d, opts)` bez rng. POTWIERDZONE. Pin zwraca winner/rounds/routed (combat.ts:1243-1249). POTWIERDZONE.

## Werdykty na zarzuty Evaluatora
1. Krok 3 BRAK -> istnieje: ODDAL (obrona przyjęła, dowód zweryfikowany).
2. Kroki 12-13: ODDAL (PORT-CZĘŚCIOWY, dowód zweryfikowany).
3. Krok 18: ODDAL (PORT-JEST).
4. Kroki 20-21 i dwie kopie river: ODDAL; kanoniczna `inputs_terrain.rs:148`. Rozbieżność z blow_full.rs:245 = dług do decyzji D1.
5. Krok 34 nazwy i wołania: ODDAL (potwierdzone wyżej).
6. Pokrycie testami: ODDAL; lista wektorów BRAKUJE pozostaje hipotezą (obrona to jawnie przyznaje), do wyprowadzenia w temacie implementacyjnym.
7. Duplikacja typów: ODDAL; wejście = `CombatUnitModel` + `InstantPairOpts`, tabela mapowania w 02a, braki: `attacker_moved`, rng, flagi veteran "applied".
8. `PairCombatResult`: ODDAL; bez zmian, pełny wynik pinu typ wewnętrzny (konsument czyta tylko hp i log).
9. Łączenie tematów: ODDAL; jeden temat A/B/C.
10. Allowlista i pliki read-only: ODDAL; poprawiona lista w 02a pkt 10.
11. Podsumowanie klasyfikacji: ODDAL z jedną poprawką FC (niżej).

Liczba NAPRAW: 0.

## Uwagi (nie blokują)
- N1. Rachunek w 02a pkt 11 jest wewnętrznie niespójny: krok 20 jest w tabeli zmian jako PORT-JEST, ale w liście wynosi go PORT-CZĘŚCIOWY (12). Poprawny podział: PORT-JEST 20 (dodać 20), PORT-CZĘŚCIOWY 11, BRAK 8, razem 39. Obowiązuje ta wersja.
- N2. `01-rozpoznanie.md` pozostaje w pierwotnej formie z błędami (kroki 3, 12-13, 18, 20, sekcja pokrycia). Obowiązującą klasyfikacją jest 02a + N1; 01 czytać tylko razem z 02a.
- N3. Lista brakujących wektorów (#135/#137) jest hipotezą; nie traktować jako dowodu.
- N4. Poprawka ścieżki pinu: `gra/src/game/combat.ts` (dispatch podawał `gra/src/battle/combat.ts`).

## Decyzje techniczne dla orkiestratora (bez ABC; web rozstrzyga)
- D1. `terrain_river_attack_multiplier`: kanoniczna wersja z terrainData (`inputs_terrain.rs:148`); przepięcie blow_full.rs:245 jako osobny drobny temat parytetu (pin combat.ts:677-687).
- D2. Jeden temat COMBAT-RESOLVE-PAIR-FULL, etapy A (pre-fazowe) / B (fazy i werdykt) / C (impl `InstantPairResolver`); RESOLVE-PAIR nie czeka na osobne #135.
- D3. `PairCombatResult` bez zmian.
- D4. Dodać `attacker_moved` do `InstantPairOpts` i rng do wywołania resolvera (zmiana traitu świadoma, z testem kontraktu).
