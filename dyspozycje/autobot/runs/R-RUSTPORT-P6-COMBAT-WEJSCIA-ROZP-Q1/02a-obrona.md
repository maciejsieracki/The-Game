# Obrona Operatora: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1 (runda 1, obrona)
GOAL: odpowiedź na 11 zarzutów Evaluatora wobec `01-rozpoznanie.md` (commit operatora `7e18a2a1b`); każdy zarzut przyjęty z dowodem albo odrzucony z dowodem.
ZMIANY/COMMIT: tylko ten plik. Bez zmian w `rust-port/`, `gra/`, `origin/main`, bez push.
TESTY: NIE_ZMIERZONO (tryb wyłącznie odczytu, bez cargo). Wszystkie dowody to `git show <SHA>:<ścieżka> | sed` oraz `grep` na bazie `474487792174d9cee60e842f8fa765dd04ad5e57` i pinie `07d2fbd72`.
BLOKADY: brak. Decyzje dla orkiestratora wskazane w punkcie 9 (łączenie tematów) i punkcie 4 (kanoniczna `terrain_river_attack_multiplier`).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje korekty z tej obrony (tabela w punkcie 11) i zmieniony podział tematów (punkt 9).
DEPLOY/PUSH: NIE WYKONANO

Baza: `474487792174d9cee60e842f8fa765dd04ad5e57` (origin/rust-port/parity-v2). Pin: `07d2fbd72`, `resolveCombat` w `gra/src/game/combat.ts:842-1251`.

Ogólna uwaga: większość zarzutów była trafna. Operator klasyfikował pokrycie i brak funkcji po nazwach plików i wystąpieniach słów w `combat.rs`, a nie po całym `rust-port/engine/src`. Poniżej każdy zarzut ma werdykt i dowód.

---

## Zarzut 1: krok 3 (`applyVeteranFracToCombatUnit`) oznaczony BRAK

**PRZYJMUJĘ.** Funkcja istnieje.
- Dowód: `git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_inputs_unit.rs | sed -n '312,330p'` → `pub fn apply_veteran_frac_to_combat_unit(cu: &CombatUnitModel, frac: f64) -> CombatUnitModel`, nagłówek modułu (linia 9) wskazuje pin `gra/src/game/veteran.ts:362-385`.
- Wołający w produkcji: `siege_tactics_inputs_unit.rs:426` (`toCombatUnit`).
- Test: `siege_tactics_inputs_unit.rs:476-481` (`apply_veteran_frac_to_combat_unit(&cu, 0.1)` i `(&cu, 0.0)` → bez zmian).
- Korekta: krok 3 → **PORT-JEST** (poza `combat.rs`, w `siege_tactics_inputs_unit.rs:312`). Błędne zdanie w raporcie „Jedyne wystąpienia `veteran` w `domain/` to `recruitment.rs`” — nieprawdziwe. Wystąpienia są w `siege_tactics_inputs_unit.rs` i `unit_health.rs`.
- Brakujące w `combat.rs` jest tylko wejście flag „already applied” (krok 2) i wywołanie w `resolve_combat_pin` (nowy kod).

## Zarzut 2: kroki 12-13 (`effectiveMaxHp`) oznaczone BRAK

**PRZYJMUJĘ.** Funkcja istnieje.
- Dowód: `unit_health.rs:158` → `pub fn effective_max_hp(base_hp: f64, parametry_bonus_frac: f64, veteran_bonus_frac: f64) -> f64`. Wołający: `unit_health.rs:192`, `unit_replace_cost.rs:71`. Test: `tests/p6_heal_maxhp_wire.rs:111` (`effective_max_hp_matches_web`).
- Korekta: kroki 12 i 13 (gałąź fallback) → **PORT-CZĘŚCIOWY**: funkcja jest (PORT-JEST), brak jest tylko wyboru gałęzi kanonicznej/fallback w pinie (`:940-969`). Trzeci argument `parametryBonusFrac` był w raporcie pominięty; w pinie wywołanie `effectiveMaxHp(...)` przekazuje go obok `veteran`.
- Krok 11 (gałąź kanoniczna, `Math.round(clamp(min(...)))`) pozostaje BRAK. Nie ma tej reguły w `rust-port/engine/src` (sprawdzone: brak `canonical_effective_max_hp` poza polem wejściowym `siege_tactics_inputs_unit.rs:177` i `:290`).

## Zarzut 3: krok 18 (`flankRearDefensePenalty`) oznaczony BRAK

**PRZYJMUJĘ.** Funkcja istnieje.
- Dowód: `siege_tactics_inputs_pos.rs:261` → `pub fn flank_rear_defense_penalty(flank_field: &JsVal, rear_field: &JsVal, position: &str) -> f64`. Wołający produkcyjny: `siege_tactics_blow_full.rs:194`. Testy: `siege_tactics_inputs_pos.rs:343-348` (unit) i `tests/p6_siege_tactics_inputs_pos.rs:230`.
- Korekta: krok 18 → **PORT-JEST** (funkcja). Brak jest tylko spięcia z `defEffObrona` w `resolve_combat_pin` (nowy kod, tak jak w kroku 24).

## Zarzut 4: kroki 20-21, pominięty wierny port z `terrainData`; dwie kopie `terrain_river_attack_multiplier`

**PRZYJMUJĘ.** Operator przeoczył wierny port i dwie kopie. Zweryfikowane:

| Miejsce | Sygnatura | Kształt względem pinu | Kto woła |
|---|---|---|---|
| `siege_tactics_inputs_terrain.rs:115` | `terrain_defense_multiplier(defender_terrain: &str, attacker_rola: &str, terrain_data: &[TerrainEntry])` | **1:1 z pinem** `terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData)` | `siege_tactics_blow_env.rs:26` (import) |
| `siege_tactics_inputs_terrain.rs:148` | `terrain_river_attack_multiplier(defender_terrain: &str, terrain_data: &[TerrainEntry], river_attack_mult: f64)` | **1:1 z pinem** `terrainRiverAttackMultiplier(defenderTerrain, terrainData)` (`combat.ts:677-687`) | `siege_tactics_blow_env.rs:26` jako `terrain_river_by_name` |
| `combat.rs:217` | `terrain_defense_multiplier(terrain: Terrain, attacker_ranged_or_cavalry: bool)` | INNY model (enum `Terrain`) | `combat.rs` |
| `siege_tactics_blow_inputs.rs:21` | `terrain_river_attack_multiplier(tile_is_river: bool, river_row_in_terrain_data: bool, river_attack_mult: f64)` | UPROSZCZONY: wejścia logiczne zamiast nazwy i `terrainData` (sam nagłówek pliku to deklaruje, `:6`) | `siege_tactics_blow_full.rs:30,245` |

Wnioski:
- Operator w punkcie 20 wskazał tylko `combat.rs:217`, czyli enum. Wierny port z `terrainData` to `siege_tactics_inputs_terrain.rs:115` (funkcja) i `:148` (rzeka). Krok 20 → **PORT-JEST** (`siege_tactics_inputs_terrain.rs:115`), krok 21 → **PORT-JEST** (`:148`).
- Konflikt do rozstrzygnięcia: `siege_tactics_blow_full.rs:245` (produkcyjny blow) woła WERSJĘ LOGICZNĄ (`siege_tactics_blow_inputs.rs:21`), a `siege_tactics_blow_env.rs` używa wersji z `terrainData` (`:148`). Obie są w produkcji.
- **Rekomendacja (do decyzji orkiestratora):** kanoniczna jest `siege_tactics_inputs_terrain.rs:148`. To jedyna wersja z tym samym wejściem co pin i z testem na danych (`tests/p6_siege_tactics_inputs_terrain.rs:197`). Wersja z `siege_tactics_blow_inputs.rs:21` powinna zostać zastąpiona w `siege_tactics_blow_full.rs:245` (albo przepięta na wersję z terrainData). Jest to rozbieżność w istniejącym kodzie, nie błąd operatora. Zapisuję ją jako ryzyko z punktu widzenia parytetu.

## Zarzut 5: krok 34 — nazwy `hit_chance_tw` i `damage_tw` niepotwierdzone

**PRZYJMUJĘ** (potwierdzone, z dowodem wołań w fazach).
- `unit_power.rs:94` → `pub fn hit_chance_tw(melee_attack, melee_defence, hit_bonus)`.
- `siege_tactics_blow.rs:217` → `pub fn damage_tw(...)`.
- Wołania w funkcjach fazy (nie w testach):
  - `combat.rs:1136` `pub fn resolve_ranged_phase(...)`: `hit_chance_tw` w `:1166` i `:1199`.
  - `combat.rs:1386` `pub fn resolve_melee_phase(...)`: `hit_chance_tw` w `:1455` i `:1490`, `damage_tw` w `:1459` i `:1493`. Import w `:1281`.
- Dla `combat.rs` nie ma `#[cfg(test)]` (sprawdzone `grep -n "cfg(test)"` → brak trafień), więc są to ścieżki produkcyjne.
- Korekta: kroki **26, 34, 35 → PORT-JEST, potwierdzone** (wołania w fazie). Nazwy w tabeli są prawdziwe: `hit_chance_tw`, `damage_tw`.

## Zarzut 6: pokrycie testami po słowach kluczowych; pominięte pliki

**PRZYJMUJĘ.** Operator pominął cztery pliki i błędnie zaklasyfikował kilka kroków jako niepokryte.

Pliki pominięte w sekcji 4 (istnieją na `474487792`):
- `rust-port/engine/tests/p6_repin_dystans_formulas.rs` (używa `hit_chance_tw`, `range_damage_tw`, `ranged_shot_accuracy`; `:77`, `:82`, `:123`);
- `rust-port/engine/tests/p6_repin_dystans_fieldpower.rs`;
- `rust-port/engine/tests/p6_siege_tactics_roundcap.rs` (+ `_gen.mjs`, `_vectors/vectors.json`);
- wektory `rust-port/engine/tests/p6_repin_dystans_vectors/`: `dystans-acc.json`, `dystans-fieldpower.json`, `dystans-mult.json`, `dystans-petla.json`, `dystans-shots.json`.

Dodatkowo pominięte pliki pokrywające kroki uznane przez operatora za NIEPOKRYTE:
- `tests/p6_heal_maxhp_wire.rs:111` (`effective_max_hp_matches_web`) → kroki 12-13 są pokryte.
- `tests/p6_siege_tactics_inputs_pos.rs:230` (`flank_rear_defense_penalty` z wektorami) → krok 18 jest pokryty.
- `tests/p6_siege_tactics_inputs_terrain.rs:197` (`terrain_river_attack_multiplier_wektory`) i testy `terrain_defense_multiplier` → kroki 20-21 są pokryte dla wersji z terrainData.
- `siege_tactics_inputs_unit.rs:476-481` → krok 3 jest pokryty.

Korekta sekcji 4: zdanie „NIEPOKRYTE: 2-3, 11-13, 18, 20, …” trzeba zastąpić: **NIEPOKRYTE** = krok 2 (flagi „already applied”), krok 11 (reguła kanoniczna), krok 15 (reguła `resolveAmmo`), krok 16 (`routThreshold`), krok 22 (struktury jako liczba procentowa), krok 37-39 (werdykt i zwrot pinu). Lista „BRAKUJE” dla wektorów pinu wymaga ponownego wyprowadzenia po weryfikacji Evaluatora. Operator tej listy nie zweryfikował i oznacza ją jako hipotezę, nie fakt.

## Zarzut 7: propozycja typów dubluje `CombatUnitModel` i `InstantPairOpts`; brak tabeli mapowania

**PRZYJMUJĘ.** Typy `PinCombatUnit` i `PinCombatOpts` z punktu 3 należy wycofać.
- `CombatUnitModel`: `siege_tactics_inputs_unit.rs:165` (pola `melee_attack`, `melee_defence`, `weapon_damage`, `armor`, `piercing`, `charge_bonus`, `health`, `canonical_effective_max_hp`, `canonical_current_hp`, `veteran_health_bonus_frac`, `prog_dezercji`, `missile_attack`, `kara_flanka`, `kara_tyl`, `counter_typ`, `rola`, `ilosc_pociskow`, `super_jednostka`).
- `InstantPairOpts<'a>`: `siege_tactics_instant.rs:190` (już zawiera `max_rounds`, `defender_terrain`, `attacker_position`, `attacker/defender_civ_bonusy`, `structure_def_bonus_pct`, `*_own_territory`, `defender_on_wall_walkway`, `shallow_sea`, `defender_terrain_def_mult_override`, `*_building_bonus`, `*_army_hungry`, `army_hunger_stat_mult`, `*_gold_deficit`, `gold_deficit_stat_mult`, `*_difficulty_combat_mult`).

Tabela mapowania opcji pinu (`ResolveCombatOpts`, `combat.ts:249-…`) na Rust:

| Pole pinu | Miejsce w Rust | Status |
|---|---|---|
| `defenderTerrain` | `InstantPairOpts.defender_terrain` | ok |
| `terrainData` | własność resolvera (komentarz `siege_tactics_instant.rs` przy `InstantPairOpts`) | ok, poza opcjami |
| `counters` | własność resolvera (jw.) | ok, poza opcjami |
| `defenderTerrainDefMultOverride` | `InstantPairOpts.defender_terrain_def_mult_override` | ok |
| `attackerPosition` | `InstantPairOpts.attacker_position` (typ `HitArc`) | ok |
| `attackerMoved` (domyślnie `true`) | BRAK w `InstantPairOpts` | **dodać pole** `attacker_moved: bool` |
| `attackerAmmo` / `defenderAmmo` | BRAK w opcjach; źródło w `CombatUnitModel.ilosc_pociskow` (UVal) | **decyzja**: amunicja z jednostki (`resolveAmmo`, krok 15) |
| `maxRounds` | `InstantPairOpts.max_rounds` | ok |
| `rng` | BRAK w trait `InstantPairResolver` | **dodać**: `impl FnMut() -> f64` przekazywane do resolvera (konwencja, patrz zarzut 10) |
| `structureDefBonusPct` | `InstantPairOpts.structure_def_bonus_pct` | ok |
| `attackerCivBonusy` / `defenderCivBonusy` | `InstantPairOpts.attacker/defender_civ_bonusy` | ok |
| `attackerOwnTerritory` / `defenderOwnTerritory` | `InstantPairOpts.*_own_territory` | ok |
| `defenderOnWallWalkway` | `InstantPairOpts.defender_on_wall_walkway` | ok |
| `shallowSea` | `InstantPairOpts.shallow_sea` | ok |
| `attackerBuildingBonus` / `defenderBuildingBonus` | `InstantPairOpts.*_building_bonus` (tuple `(pancerz, other)`) | ok |
| `attackerVeteranBonusFrac` / `defenderVeteranBonusFrac` (`:375,:378`) | `CombatUnitModel.veteran_health_bonus_frac` (dla flag „already applied” brak) | częściowo; flagi „applied” BRAK |
| `attackerArmyHungry` / `armyHungerStatMult` | `InstantPairOpts.attacker_army_hungry` / `army_hunger_stat_mult` | ok |
| `attackerGoldDeficit` / `goldDeficitStatMult` | `InstantPairOpts.attacker_gold_deficit` / `gold_deficit_stat_mult` | ok |
| `*DifficultyCombatMult` (`:162,:165`) | `InstantPairOpts.*_difficulty_combat_mult` | ok |

Konsekwencja: `resolve_combat_pin` ma przyjmować `&CombatUnitModel` ×2 + `&InstantPairOpts` + `rng`. Nie tworzymy nowych struktur wejścia.

## Zarzut 8: `PairCombatResult` bez `winner`, `rounds`, `routed`; brak decyzji

**PRZYJMUJĘ** (brak decyzji w raporcie). Zweryfikowane: `siege_tactics_instant.rs:237` → `PairCombatResult { attacker_hp_left, defender_hp_left, log }`. Brak `winner`, `rounds`, `routed`.

**Rekomendacja: osobny typ dla pełnego wyniku pinu, `PairCombatResult` zostaje bez zmian.**
- Uzasadnienie z webu: `computeInstantResult` czyta tylko `res.attackerHpLeft`, `res.defenderHpLeft`, `res.log` (`battleScene.ts:20569-20572`) i liczy werdykt samodzielnie (`hpA >= hpD`, `:20580-20589`). Rozszerzanie kontraktu o `winner`/`rounds`/`routed` nie ma konsumenta w `computeInstantResult`.
- Pełny wynik `CombatResult` pinu (`combat.ts:1243-1249`: `winner`, `attackerHpLeft`, `defenderHpLeft`, `rounds`, `routed`, `log`) jest wewnętrznym typem `resolve_combat_pin`, z którego `resolve_pair` bierze trzy pola.
- Odwołanie do `Winner` (`combat.rs:139`) jest dopuszczalne, ale enum należy do modelu `resolve`. Dla pinu werdykt `draw` także przy limicie rund (`combat.ts:1217-1231`), więc wariant trzeba sprawdzić w Evaluatorze.

## Zarzut 9: „RESOLVE-PAIR nie może ruszyć przed #135” jest niespójne z pełnym portem

**PRZYJMUJĘ.** Zgadzam się, że wniosek był sprzeczny. Pełny port produkcyjnego resolvera to kroki 1–39, czyli zawiera kroki #135 (pre-fazowe, 2–24). Sekwencyjny podział „najpierw #135, potem RESOLVE-PAIR” daje w praktyce jeden temat z dwiema częściami.

**Rekomendacja (do decyzji orkiestratora):** połączyć w jeden temat `COMBAT-RESOLVE-PAIR-FULL` z etapami w kolejności:
1. etap A: kroki pre-fazowe (2–24) jako funkcje składające na `CombatUnitModel` i `InstantPairOpts` (punkt 7);
2. etap B: fazy i werdykt (26–39), wywołanie `resolve_ranged_phase` i `resolve_melee_phase`;
3. etap C: nowy moduł implementujący `InstantPairResolver` i test kontraktu.

Alternatywę „RESOLVE-PAIR równolegle jako rozpoznanie kroków 26–39” z raportu wycofuję: rozpoznanie fazy bez kroków pre-fazowych nie daje wejścia do `resolve_pair` i wymagałoby duplikacji.

## Zarzut 10: allowlista #135 bez listy plików tylko do odczytu; ryzyko przepisania istniejącego kodu

**PRZYJMUJĘ.** Dodaję listę tylko do odczytu, która musi być użyta, a nie przepisana:

Tylko do odczytu / wywoływane (nie wolno reimplementować):
- `rust-port/engine/src/domain/siege_tactics_inputs_unit.rs` (`apply_veteran_frac_to_combat_unit:312`, `CombatUnitModel:165`, `apply_army_hunger_stat_mult_to_combat_unit:360`, `apply_gold_deficit_stat_mult_to_combat_unit:368`);
- `rust-port/engine/src/domain/unit_health.rs` (`effective_max_hp:158`);
- `rust-port/engine/src/domain/siege_tactics_inputs_pos.rs` (`flank_rear_defense_penalty:261`);
- `rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs` (`terrain_defense_multiplier:115`, `terrain_river_attack_multiplier:148`);
- `rust-port/engine/src/domain/siege_tactics_blow.rs` (`damage_tw:217`);
- `rust-port/engine/src/domain/unit_power.rs` (`hit_chance_tw:94`);
- `rust-port/engine/src/domain/civ_bonuses.rs` (`civ_combat_stat_multipliers:359`, `civ_wall_defense_multiplier:594`);
- `rust-port/engine/src/domain/siege_tactics_instant.rs` (`InstantPairOpts:190`, `PairCombatResult:237`, trait `InstantPairResolver`).

Zapisywane (allowlista #135, poprawiona):
- NOWY `rust-port/engine/src/domain/combat_pair_resolver.rs` (lub nazwa z tematu): funkcje składające pre-fazowe i impl `InstantPairResolver`;
- `rust-port/engine/src/domain/mod.rs` (reeksport);
- `rust-port/engine/src/domain/combat.rs`: tylko dodanie funkcji `resolve_combat_pin` i pól `attacker_moved`, bez zmiany `resolve_combat:321` i `resolve:381`;
- testy: NOWE `rust-port/engine/tests/p6_combat_pin_wejscia.rs` i wektory z generatora `p6_combat_pin_wejscia_gen.mjs`.

Zakaz: `siege_tactics_instant.rs` poza ewentualnym poszerzeniem trait o `rng` (decyzja, nie domyślnie); `gra/`; `origin/main`; `Cargo.lock`.

## Zarzut 11: podsumowanie klasyfikacji („około 16 kroków”) przybliżone, nieaktualne po 1–5

**PRZYJMUJĘ.** Przeliczenie po korektach (wszystkie 39 kroków, werdykt końcowy):

- **PORT-JEST (19):** 3, 4, 5, 7, 8, 14, 17, 18, 19, 21, 23, 26, 27, 28, 29, 30, 34, 35, 36
- **PORT-CZĘŚCIOWY (12):** 1, 6, 9, 10, 12, 13, 20, 22, 24, 25, 31, 32
- **BRAK (8):** 2, 11, 15, 16, 33, 37, 38, 39

Zmiany względem `01-rozpoznanie.md`:

| Krok | Było | Jest | Powód |
|---|---|---|---|
| 3 | BRAK | PORT-JEST | zarzut 1 (`siege_tactics_inputs_unit.rs:312`) |
| 7 | PORT-JEST (poza combat.rs), spięcie BRAK | PORT-JEST | bez zmiany (sprawdzone: `civ_bonuses.rs:359`) |
| 8 | jw. | PORT-JEST | bez zmiany |
| 12, 13 | BRAK | PORT-CZĘŚCIOWY | zarzut 2 (`unit_health.rs:158`, brak wyboru gałęzi) |
| 18 | BRAK | PORT-JEST | zarzut 3 (`siege_tactics_inputs_pos.rs:261`) |
| 20 | PORT-CZĘŚCIOWY (wskazano enum `combat.rs:217`) | PORT-JEST (`siege_tactics_inputs_terrain.rs:115`) | zarzut 4 |
| 21 | PORT-JEST (wersja logiczna) | PORT-JEST (`siege_tactics_inputs_terrain.rs:148`, wersja kanoniczna do decyzji) | zarzut 4 |
| 24 | PORT-JEST (wejście) | PORT-CZĘŚCIOWY (składanie BRAK) | ujednolicenie |
| 34 | PORT-JEST (nazwy do potwierdzenia) | PORT-JEST (potwierdzone) | zarzut 5 |
| 15 | BRAK / PORT-CZĘŚCIOWY | BRAK | `resolveAmmo` nie istnieje w Rust |
| 16 | BRAK | BRAK | bez zmiany |

Brakujące pozycje w tabeli sekcja 1 (wiersze 7 i 8 w starej wersji) są już ujęte w tej tabeli.

---

## Podsumowanie do orkiestratora

Przyjęte zarzuty: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (wszystkie 11). Odrzuconych: 0.

Decyzje do podjęcia przez orkiestratora (nie gameplay, bez pytania ABC):
1. Kanoniczna wersja `terrain_river_attack_multiplier`: rekomendacja `siege_tactics_inputs_terrain.rs:148`; `siege_tactics_blow_full.rs:245` woła wersję logiczną (ryzyko rozbieżności, osobny dług).
2. Podział: rekomendacja jeden temat `COMBAT-RESOLVE-PAIR-FULL` z etapami A/B/C (zarzut 9).
3. `PairCombatResult` bez zmian; pełny wynik pinu jako typ wewnętrzny (zarzut 8).
4. Trait `InstantPairResolver` potrzebuje `rng` (zarzut 7).

Commit: tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1/02a-obrona.md`, na bazie `7e18a2a1b`, bez push.

## Odtwarzalne polecenia (dowody)

```
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_inputs_unit.rs | sed -n '312,330p'
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/unit_health.rs | sed -n '158,160p'
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_inputs_pos.rs | sed -n '261,262p'
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs | grep -n "^pub fn "
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_blow_full.rs | grep -n "terrain_river_attack_multiplier\|flank_rear_defense_penalty"
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/combat.rs | grep -n "cfg(test)\|pub fn resolve_ranged_phase\|pub fn resolve_melee_phase\|hit_chance_tw(\|damage_tw("
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_instant.rs | grep -n "pub struct InstantPairOpts\|pub struct PairCombatResult\|pub trait InstantPairResolver"
git show 474487792174d9cee60e842f8fa765dd04ad5e57:rust-port/engine/src/domain/siege_tactics_inputs_unit.rs | grep -n "pub struct CombatUnitModel"
git show 07d2fbd72:gra/src/game/combat.ts | sed -n '249,420p' | grep -nE "^  [a-zA-Z]+\??:"
git show 07d2fbd72:gra/src/game/combat.ts | sed -n '672,690p'
git ls-tree -r --name-only 474487792174d9cee60e842f8fa765dd04ad5e57 -- rust-port/engine/tests | grep -E "p6_repin_dystans|p6_siege_tactics_roundcap"
```
