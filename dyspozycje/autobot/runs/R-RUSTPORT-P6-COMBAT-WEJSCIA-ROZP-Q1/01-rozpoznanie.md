# Rozpoznanie: wejścia fazy zwarcia `resolveCombat` (#135/#167) i zależności COMBAT-RESOLVE-PAIR

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1 (runda 1)
GOAL: mapa kroków `resolveCombat` przed pętlą dystansu i pętlą zwarcia (pin → Rust), propozycja typów wejścia, pokrycie testami, podział tematów z allowlistami.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1/01-rozpoznanie.md`). Brak zmian w `rust-port/`, `gra/`, `origin/main`.
TESTY: NIE_ZMIERZONO (tryb wyłącznie odczytu, zgodnie z dispatchem: bez cargo). Pokrycie testów oceniono po nazwach plików i wystąpieniach słów kluczowych, nie przez uruchomienie.
BLOKADY: brak blokad procesu. Jedna niezgodność dispatchu (ścieżka pinu) opisana niżej w „Uwagach do dispatchu”.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje tabelę kroków z pinem; po PASS podział tematów jak w „Propozycja podziału”.
DEPLOY/PUSH: NIE WYKONANO

---

## 0. Baza, pin, odczyt

- Baza: `origin/rust-port/parity-v2` = `474487792174d9cee60e842f8fa765dd04ad5e57` (SHA potwierdzony przez `git fetch`).
- Pin: `07d2fbd72`.
- Uwaga do dispatchu: w pinie `gra/src/battle/combat.ts` NIE istnieje (`git ls-tree -r --name-only 07d2fbd72` nie zwraca tej ścieżki). `resolveCombat` jest w **`gra/src/game/combat.ts`**, `export function resolveCombat(` w linii **842**, koniec w **1251**. `gra/src/battle/battleScene.ts` istnieje w pinie (to on woła `resolveCombat` w `computeInstantResult`).
- Polecenie odczytu, które działa:
  `git show 07d2fbd72:gra/src/game/combat.ts | sed -n '842,1251p'`
- Polecenia kontrolne:
  `git grep -n "export function resolveCombat" 07d2fbd72 -- gra/src/game/combat.ts` (→ linia 842)
  `git grep -n "function resolveCombat" origin/rust-port/parity-v2 -- rust-port/engine/src` (→ brak, Rust nie ma portu całego `resolveCombat`)
  `git grep -n "pub fn resolve_ranged_phase\|pub fn resolve_melee_phase\|pub fn resolve_combat\|pub fn resolve(" origin/rust-port/parity-v2 -- rust-port/engine/src/domain/combat.rs`
  `git grep -n "InstantPairResolver" origin/rust-port/parity-v2 -- rust-port/engine/src`

## 1. Mapa kroków `resolveCombat` (pin `gra/src/game/combat.ts`)

Klasyfikacja: PORT-JEST (funkcja/struktura Rust z tym samym zachowaniem), PORT-CZĘŚCIOWY (jest odpowiednik, inny model wejścia), BRAK (w `rust-port/engine/src` nie znaleziono), UI (nie dotyczy silnika).
Kolumna „Rust” podaje plik:linia na `474487792`.

| # | Pin plik:linia | Krok | Wejście → wyjście | Klasyfikacja | Odpowiednik Rust plik:linia | Uwagi |
|---|---|---|---|---|---|---|
| 1 | `game/combat.ts:842-845` | sygnatura | `attacker, defender: CombatUnit`, `opts: ResolveCombatOpts = {}` → `CombatResult` | PORT-CZĘŚCIOWY | `domain/combat.rs:321` `resolve_combat(CombatInput)`; `:381` `resolve` | Rust ma INNY model (zbiorcza siła stron, HP `u32`, brak opts i logu). Nie zastąpi `resolveCombat`. |
| 2 | `:850-859` | flagi „weteran już zastosowany” (`attackerVeteranAlreadyApplied` / `defender…`) | `opts.*VeteranBonusFrac`, `unit.veteranHealthBonusFrac` → bool | BRAK | — | Brak w `rust-port/engine/src`. |
| 3 | `:866-871` | `applyVeteranFracToCombatUnit` (trzeci system, weterani) | `unit`, `frac` → `unit` zmodyfikowany (lub identyczny gdy frac=0) | BRAK | — | Jedyne wystąpienia `veteran` w `domain/` to `recruitment.rs` (poziomy weteranów dla stosów), nie mnożniki bojowe. |
| 4 | `:873-879` | `applyArmyHungerStatMultToCombatUnit` | `hungry`, `hungerMult` (domyślnie 0.75) → `unit` | PORT-JEST (poza `combat.rs`) | `domain/siege_tactics_inputs_unit.rs:360` `apply_army_hunger_stat_mult_to_combat_unit` | Funkcja istnieje, ale nie jest wołana przez `combat.rs` (żadnej pętli fazy). |
| 5 | `:881-887` | `applyGoldDeficitStatMultToCombatUnit` | `goldDeficit`, `goldDeficitMult` (0.75) → `unit` | PORT-JEST (poza `combat.rs`) | `domain/siege_tactics_inputs_unit.rs:368` `apply_gold_deficit_stat_mult_to_combat_unit` (→ `turn_economy::gold_deficit`) | Jak krok 4. |
| 6 | `:889-898` | domyślne `rng`, `position`, `maxRounds` (`TW.max_rounds`), `attackerMoved`, `counters`, `terrainData`, `defenderTerrain`; `log`, `routed` | `opts` → zmienne lokalne | PORT-CZĘŚCIOWY | `combat.rs:1125-1135` `RangedPhaseInput` (`max_rounds`, `start_rounds`); `combat.rs:1310-1334` `MeleePhaseInput` (`attacker_moved`, `max_rounds`) | Rozdzielone między wejścia faz. `log` (tekst) i `routed` jako lista: BRAK tekstu logu. |
| 7 | `:900-912` | `civCombatStatMultipliers` (atak), `mergeBuildingBonusIntoStatMultipliers` | `opts.attackerCivBonusy`, `attacker`, `{side, terrain, isChargeRound:false, ownTerritory, onWallWalkway:false, shallowSea}` → `atkBaseMods` | PORT-JEST (poza `combat.rs`) | `domain/civ_bonuses.rs:359` `civ_combat_stat_multipliers`; `combat.rs:1032` `merge_building_bonus_into_stat_multipliers` | Oba istnieją; spięcie w pętli ‒ BRAK (dziś robi to wołający). |
| 8 | `:913-925` | `civCombatStatMultipliers` (obrona) + merge budynków; `onWallWalkway: opts.defenderOnWallWalkway` | jw. dla obrońcy → `defBaseMods` | PORT-JEST (poza `combat.rs`) | jw. | — |
| 9 | `:927-928` | `atkDiffMult`, `defDiffMult` (`?? 1`) | `opts.*DifficultyCombatMult` → skalar | PORT-CZĘŚCIOWY | `siege_tactics_inputs_unit.rs` (`battleUnitDifficultyCombatMult`, wejście `InstantPairOpts.attacker_difficulty_combat_mult`) | Brak funkcji w `combat.rs`; wartość przychodzi jako parametr. |
| 10 | `:930-938` | statystyki bazowe po modyfikatorach: `atkMelee0`, `atkObrona0`, `atkPanc0`, `atkMissile0`, `defObrona0`, `defMelee0`, `defPanc0`, `defMissile0` | `applyMultiplier(stat, mod) * diffMult` → liczby | PORT-CZĘŚCIOWY | `combat.rs:1040-1050` (argumenty `rangedShotAccuracy`/`rangedShotDamage` w `resolve_ranged_phase`), `MeleeUnit`/`MeleeMods` (`:1287`, `:1301`) | `applyMultiplier` jako funkcja: BRAK (inline). Wartości wchodzą jako gotowe liczby. |
| 11 | `:940-947` | HP atakującego — gałąź **kanoniczna** (`canonicalEffectiveMaxHp` finite): `hpAtk = round(clamp(min(max*civHealth, current)))` | `attacker.canonicalEffectiveMaxHp`, `canonicalCurrentHp ?? health`, `atkCivHealth` → `hpAtk` | BRAK (logika) / PORT-CZĘŚCIOWY (pola) | `siege_tactics_inputs_unit.rs:177` pole `canonical_effective_max_hp` | Pole wejściowe jest, reguła `Math.round(clamp…)` w `combat.rs`: BRAK. |
| 12 | `:948-956` | HP atakującego — gałąź **fallback** (`effectiveMaxHp(...)`, `veteran`/`other` bonus) | `health`, `attackerVeteranBonusFrac`, `opts.attackerBuildingBonus.other` → `hpAtk` | BRAK | — | Funkcja `effectiveMaxHp` nie ma portu (brak trafień w `rust-port/engine/src`). |
| 13 | `:957-969` | HP obrońcy — gałąź kanoniczna i fallback (symetrycznie do 11-12) | jw. dla obrońcy → `hpDef` | BRAK (logika) / PORT-CZĘŚCIOWY (pole) | jw. | — |
| 14 | `:970-971` | `hpAtkStart`, `hpDefStart` | → `routAtk`/`routDef` | PORT-JEST (trywialne) | `RangedSide` / `MeleePhaseInput.hp_atk` `hp_def` (`combat.rs:1310`) | — |
| 15 | `:973-974` | `resolveAmmo(attacker, opts.attackerAmmo)`, `resolveAmmo(defender, …)` | `override ?? parseInt(raw)` lub `raw`; `'---'`/`''`/`null`/`undefined` → 0 → liczba (może być `NaN`) | BRAK (reguła) / PORT-CZĘŚCIOWY (pole) | `combat.rs:1073-1074` `RangedSide.ammo: i64`; `combat.rs:1115-1116` `ammo_attacker/ammo_defender: i64` | `i64` nie reprezentuje `NaN` ani `Infinity`. Patrz #137. Reguła `resolveAmmo` (parse `'---'`) brak w Rust. |
| 16 | `:975-977` | `routThreshold({...unit, health})` → `routAtk`, `routDef` | `unit['Prog dezercji (% health)'] * health` (lub 0) → liczba | BRAK (funkcja) / PORT-CZĘŚCIOWY (pole) | `combat.rs:1088` `RangedSide.rout_threshold: f64`; `MeleePhaseInput.rout_atk/rout_def` (`:1322`) | Reguła `pct * health` w Rust nie istnieje; wejście gotowe. |
| 17 | `:979` | `totalRounds = 0` | → licznik | PORT-JEST | `RangedPhaseResult`/`start_rounds` (`:1130-1131`) | Web w pętli dystansu startuje od 0; `start_rounds` w Rust to „totalRounds przed fazą (0 w web)”. |
| 18 | `:984-985` | `flankRearDefensePenalty(defender, position)` → `defEffObrona = max(0, obrona*(1-pen))` | `defender` (klucze `Kara obrony z flanki (%)` / `…z tyłu (%)`), `position` (`front|flank|rear`) → liczba | BRAK | — | Brak wystąpienia `flank`/`rear` w logice bojowej `combat.rs` (tylko komentarz `:208-209`, rola kawalerii). |
| 19 | `:988-989` | `counterMultiplier(attacker.counterTyp, defender.counterTyp, counters)` oraz odwrotnie | typy + tablica `counters` → mnożnik | PORT-JEST | `combat.rs:190` `counter_multiplier(...)` | Zgodność argumentów do sprawdzenia w Evaluatorze (kolejność typów). |
| 20 | `:994` | `terrDefMult = opts.defenderTerrainDefMultOverride ?? terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData)` | teren, rola atakującego, `terrainData` → mnożnik | PORT-CZĘŚCIOWY | `combat.rs:217` `terrain_defense_multiplier(Terrain, bool)` | Rust przyjmuje enum `Terrain`, nie nazwę + tablicę `terrainData`. Override `defenderTerrainDefMultOverride`: BRAK. Las `combat.ts:638`: Rust `:220-222` (`LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA`). |
| 21 | `:997` | `terrRiverMult = terrainRiverAttackMultiplier(defenderTerrain, terrainData)` | → mnożnik ataku z rzeki | PORT-JEST (poza `combat.rs`) | `domain/siege_tactics_blow_env.rs:182-187` oraz `siege_tactics_blow_inputs::terrain_river_attack_multiplier` (wołane przez `siege_tactics_blow_env.rs:26,239`) | W `combat.rs` brak; istnieje w module oblężniczym. |
| 22 | `:1002-1003` | `structBonusPct`, `structMult = 1 + max(0, pct)/100` (mur +200%, fort +100%, posterunek +50%) | `opts.structureDefBonusPct` → `structMult` | PORT-CZĘŚCIOWY | `combat.rs:94-100` `DefenseStructures`; `combat.rs:232` `structure_defense_multiplier(DefenseStructures, is_siege)` | Rust liczy z enum struktur; web z liczby procentowej. Nierównoważne bez mapowania. |
| 23 | `:1004-1006` | `wallCivMult = defenderOnWallWalkway ? civWallDefenseMultiplier(opts.defenderCivBonusy, defender) : 1` | → mnożnik | PORT-JEST (poza `combat.rs`) | `domain/civ_bonuses.rs:593` (`civWallDefenseMultiplier`) | — |
| 24 | `:1009-1010` | `atkEffMelee = atkMelee0 * terrRiverMult`; `defFinalObrona = defEffObrona * terrDefMult * structMult * wallCivMult` | → liczby | PORT-JEST (wejście) | `combat.rs:1040` (`def_final_obrona` w `RangedPhaseInput`, `:1126`); `MeleePhaseInput.def_final_obrona` (`:1323`), `terr_river_mult` (`:1317`) | Składanie tych iloczynów jest po stronie wołającego w Rust — BRAK funkcji składającej. |
| 25 | `:1012-1013` | `atkIsRanged = isRangedUnit(attacker)` (`missileAttack > 0`), `defIsRanged` | → bool | PORT-CZĘŚCIOWY | `RangedSide.is_ranged` (`combat.rs:1066-1073`); `MeleeUnit` | Wartość przychodzi jako bool, reguła `missileAttack>0` nie jest w `combat.rs`. |
| 26 | `:1015-1086` | **Faza 0: Dystansowa** — pętla `while` z `ammo>0`, `hp>0`, `routed.length===0`, limit `maxRounds`, strzał atak/obrona, rout po strzale, `break` | `RangedSide`, `hitPct` (`hitChanceTw`), `rng`, `ctr*`, `terrRiverMult`, `defFinalObrona` → `hpAtk, hpDef, ammo*, routed, log` | PORT-JEST (bez logu) | `combat.rs:1136` `resolve_ranged_phase`; wejście `:1125`; wynik `RangedPhaseResult` `:1112` (`hp_attacker`, `hp_defender`, `ammo_*`) | Zgodność kolejności RNG i warunków `break` pokryta przez testy (sekcja 4). Teksty `log.push` (`R{n}[Dyst-ATK] trafienie …`) — BRAK. `RangedShot` (`:1099`) rejestruje zdarzenia, nie napisy. |
| 27 | `:1089-1091` | bramka fazy zwarcia `if (hpAtk > 0 && hpDef > 0 && routed.length === 0)` | → wejście do fazy 1/2 | PORT-JEST | `resolve_melee_phase` (`combat.rs:1386`) warunek początkowy | Zweryfikować w Evaluatorze. |
| 28 | `:1094-1095` | `defBracing = attackerMoved && negatesCharge(defender)` | `attackerMoved`, `counterTyp` → bool | PORT-JEST | `combat.rs:1365` `negates_charge(counter_typ)` (`spearman`/`falangite`) | `attackerMoved` jako `MeleePhaseInput.attacker_moved` (`:1311`). |
| 29 | `:1097-1106` | pętla zwarcia `while (hpAtk>0 && hpDef>0 && routed==0)`, `meleeRound++`, `totalRounds++`, limit → `remis` | → liczniki | PORT-JEST | `combat.rs:1386` `resolve_melee_phase`; `MeleePhaseResult.limit_reached`, `rounds` (`:1355-1362`) | Pin: `limit` → log „remis”; Rust: flaga `limit_reached`, bez tekstu. |
| 30 | `:1108-1109` | `isCharge = meleeRound===1 && !defBracing`; `phaseLabel` | → bool | PORT-JEST | `MeleePhase::{Charge, Melee}` (`combat.rs:1336-1340`) | — |
| 31 | `:1111-1132` | `atkRoundMods`/`defRoundMods` = `civCombatStatMultipliers(…isChargeRound…)` + merge budynków (osobno dla szarży i zwykłej) | jw. z `isChargeRound` → mody | PORT-CZĘŚCIOWY | `MeleeMods` ×4 (`combat.rs:1301`, `:1322-1333` `mods_*_charge/round`); `civ_bonuses.rs:359` | Mody per runda liczy wołający; Rust przyjmuje gotowe. |
| 32 | `:1134-1140` | `roundAtkMelee`, `roundAtkCharge`, `roundDefMelee`, `roundDefObrona`, `roundAtkObrona`, `roundAtkPanc`, `roundDefPanc` (× `diffMult`, × `terrRiverMult` dla ataku) | → liczby | PORT-CZĘŚCIOWY | `MeleeMods` (`combat.rs:1301`) | — |
| 33 | `:1142-1144` | log „Szarża zanegowana” | → log | BRAK (log) | — | Tekst logu nie portowany. |
| 34 | `:1146-1168` | atak ATK: `hitChanceTw(roundAtkMelee, defFinalObrona, chargeHitBonus)`, `rng()*100`, `damageTw(...)`, `*ctrAtkVsDef`, `hpDef -= finalDmg` | → `hpDef`, `MeleeStep` | PORT-JEST | `combat.rs:1386` `resolve_melee_phase`; `MeleeStep` `:1342-1353`; `damageTw` i `hitChanceTw` w `combat.rs` (nazwy `hit_chance_tw`/`damage_tw` do potwierdzenia w Evaluatorze) | Testy wektorowe `p6_combat_melee*`. |
| 35 | `:1170-1190` | obrona DEF (równolegle): `hitChanceTw(roundDefMelee, roundAtkObrona)`, `damageTw(defender…,0,false)`, `*ctrDefVsAtk` | → `hpAtk` | PORT-JEST | jw. | — |
| 36 | `:1192-1214` | rout/death: `defKilled`, `atkKilled`, `defRoutCheck`, `atkRoutCheck` (z `unbreakable`), dopisanie do `routed` | → `routed` | PORT-JEST | `MeleePhaseResult.routed: Vec<Side>` (`:1357`) | `unbreakable` jako pole wejścia: sprawdzić w Evaluatorze. |
| 37 | `:1217-1231` | **Werdykt**: `atkDown`/`defDown` → `winner` ∈ {attacker, defender, draw}; `draw` także przy limicie rund | → `winner` | BRAK w `combat.rs` dla modelu pinu | — | `Winner` (`combat.rs:139`) należy do `resolve_combat` (inny model). Werdykt pinu trzeba dopisać w porcie `resolveCombat`. |
| 38 | `:1233-1241` | linie logu `=== Zwyciestwo … | Rundy: N ===`, `ATK HP / DEF HP` | → `log` | BRAK (log) | — | Patrz #137/#135 – zależy od decyzji o logu. |
| 39 | `:1243-1249` | zwrot `{winner, attackerHpLeft: max(0,hpAtk), defenderHpLeft: max(0,hpDef), rounds, routed, log}` | → `CombatResult` pinu | BRAK (typ pinu) | `siege_tactics_instant.rs` `PairCombatResult` (`:235-…`) jako kontrakt wejścia RESOLVE-PAIR | Typ wyniku pinu nie istnieje w Rust; istnieje tylko kontrakt `InstantPairResolver`. |

Podsumowanie klasyfikacji (kroki 1-39):
- PORT-JEST: 4, 5, 14, 17, 19, 21, 23, 24 (wejście), 26, 27, 28, 29, 30, 34, 35, 36 (≈ 16 kroków; z czego 4, 5, 7, 8, 21, 23 są poza `combat.rs`).
- PORT-CZĘŚCIOWY: 1, 6, 9, 10, 20, 22, 25, 31, 32, 15 (pole), 11/13 (pole).
- BRAK: 2, 3, 12, 16 (funkcja), 18, 33, 37, 38, 39, 11/13 (logika), 15 (reguła).

## 2. Co jest PRZED pętlą dystansu (wejścia #135)

Kroki 842-979 + 984-1013 przed `if (atkIsRanged || defIsRanged)` (`:1017`). Wnioski:
1. W porcie Rust **nie ma żadnego kroku przed fazą** wykonywanego wewnątrz `combat.rs`. Wszystkie wejścia faz (`RangedPhaseInput`, `MeleePhaseInput`) przychodzą jako gotowe liczby (`def_final_obrona`, `terr_river_mult`, `hp_*`, `rout_*`, `mods_*`).
2. Większość **logiki** do przeniesienia to: weterani (3, 2), HP kanoniczne/fallback (11-13, `effectiveMaxHp`), amunicja (15, `resolveAmmo`), próg rozbicia (16, `routThreshold`), okrążenie flankowe (18), składanie `defFinalObrona` i `defEffObrona` (24), mnożnik zamiany terenu (20), override `defenderTerrainDefMultOverride`.
3. Funkcje portowe już istnieją w module oblężniczym i mogą zostać użyte bez przepisywania: `apply_army_hunger_stat_mult_to_combat_unit` (`siege_tactics_inputs_unit.rs:360`), `apply_gold_deficit_stat_mult_to_combat_unit` (`:368`), `civ_combat_stat_multipliers` (`civ_bonuses.rs:359`), `civ_wall_defense_multiplier` (`civ_bonuses.rs:593`), `terrain_river_attack_multiplier` (`siege_tactics_blow_inputs`), `counter_multiplier` (`combat.rs:190`), `negates_charge` (`combat.rs:1365`).

## 3. Propozycja typów wejścia dla portu `resolveCombat`

Cel: `combat::resolve` (`combat.rs:381`) nie może być podmieniony (inny model). Należy dodać nową funkcję `resolve_combat_pin` (nazwa robocza) w nowym pliku, np. `rust-port/engine/src/domain/combat_pin.rs`, reeksport w `domain/mod.rs`.

```rust
// Jednostka wejściowa = stan po toCombatUnit (siege_tactics_inputs_unit.rs) + pola z pinu.
pub struct PinCombatUnit {
    pub mel_atk: f64,            // meleeAttack
    pub mel_def: f64,            // meleeDefence (Obrona)
    pub armor: f64,              // Pancerz
    pub missile_atk: f64,        // missileAttack (0 = nie strzela)
    pub weapon_damage: f64,
    pub piercing: f64,
    pub charge_bonus: f64,
    pub counter_typ: Option<String>,
    pub rola: Option<String>,
    pub unbreakable: bool,
    pub veteran_health_bonus_frac: Option<f64>,      // krok 2-3
    pub canonical_effective_max_hp: Option<f64>,     // krok 11/13
    pub canonical_current_hp: Option<f64>,
    pub health: f64,                                  // fallback krok 12/13
    pub ammo: Option<f64>,                            // f64, nie i64 — patrz #137
    pub rout_pct: Option<f64>,                        // 'Prog dezercji (% health)'
    pub flank_penalty_pct: (f64, f64),                // (z flanki, z tyłu)
}

// Opcje = 1:1 ResolveCombatOpts z pinu (domyślne wartości jak w TS).
pub struct PinCombatOpts {
    pub attacker_position: Option<AttackerPosition>, // front|flank|rear, domyślnie front
    pub attacker_moved: bool,                        // domyślnie true
    pub max_rounds: Option<u32>,                     // domyślnie TW.max_rounds
    pub army_hunger_stat_mult: f64,                  // 0.75
    pub gold_deficit_stat_mult: f64,                 // 0.75
    pub defender_terrain: String,
    pub defender_terrain_def_mult_override: Option<f64>,
    pub structure_def_bonus_pct: f64,
    pub defender_on_wall_walkway: bool,
    pub shallow_sea: bool,
    pub attacker_own_territory: bool,
    pub defender_own_territory: bool,
    pub attacker_building_bonus: (f64, f64),         // (pancerz, other)
    pub defender_building_bonus: (f64, f64),
    pub attacker_difficulty_combat_mult: f64,        // 1.0
    pub defender_difficulty_combat_mult: f64,
    pub counters: Vec<CounterBonus>,
    pub terrain_data: TerrainTable,                  // tablica terenów (jak terrainData)
    pub rng: Box<dyn FnMut() -> f64>,                // [0,1), jedno losowanie na strzał/cios
    // + civ bonusy, army/gold flagi (kolejność: civ → building → mnożniki kary).
}

// Wynik = 1:1 CombatResult pinu.
pub struct PinCombatResult {
    pub winner: Winner,              // Attacker | Defender | Draw
    pub attacker_hp_left: f64,       // max(0, hpAtk)
    pub defender_hp_left: f64,
    pub rounds: u32,
    pub routed: Vec<Side>,
    pub log: Vec<String>,            // teksty z pinu (dziś BRAK w Rust)
}
```

Uwaga: `log: Vec<String>` jest w kontrakcie `InstantPairResolver` (`siege_tactics_instant.rs`, `PairCombatResult.log`). Jeśli log ma być w produkcji, port tekstów jest osobnym zadaniem; bez niego `PairCombatResult.log` pozostanie pusty.

## 4. Pokrycie testami (nazwy plików; treść zweryfikowana tylko słowami kluczowymi)

Pliki na `474487792`:
- `rust-port/engine/tests/p6_combat_harness.rs` (5 testów; słowa: `ammo`, `rout`, `river`, `NaN`/`INFINITY`, `max_rounds`). Wektory: `p6_combat_harness_vectors/vectors.json`, generator `p6_combat_harness_gen.mjs`.
- `rust-port/engine/tests/p6_combat_melee.rs` (faza zwarcia). Wektory: `p6_combat_melee_vectors/vectors.json`, generator `p6_combat_melee_gen.mjs`.
- `rust-port/engine/tests/p6_repin_dystans_petla.rs` (3 testy pętli dystansu; `ammo`, `max_rounds`, `river`, `rout`).
- `rust-port/engine/tests/p6_ranged_damage_nan.rs` (8 testów; NaN/Infinity w obrażeniach dystansowych).
- `rust-port/engine/tests/p6_js_round_minus_zero.rs` (zero ujemne w `js_round`).
- `rust-port/engine/tests/p6_harness_mutacje.sh` (mutacje pętli dystansu).
- `rust-port/engine/tests/combat.rs`, `combat_ai_multipliers.rs`, `data_units_combat.rs` (testy `resolve`/AI, nie pinu).

Ocena pokrycia (kroki z sekcji 1):
- POKRYTE (pętle faz, z wektorami pinu): kroki 26 (dystans), 29-36 (zwarcie), 19 (counter), 28 (charge negation), 30 (szarża/zwarcie) — według nazw plików i słów kluczowych.
- NIEPOKRYTE (brak słów kluczowych w żadnym z plików testowych): kroki 2-3 (weterani), 4-5 (głód/deficyt, choć funkcje mają własne testy w `siege_tactics_inputs_unit`), 7-8 i 31 (civ mods), 11-13 (HP kanoniczne i fallback), 18 (flank/rear), 20 (override terenu), 22 (struktury), 37-39 (werdykt i zwrot pinu).
- Słowa `NaN`/`INFINITY` występują w harness (5+3) i w `p6_ranged_damage_nan` (8 testów); pokrycie NaN dotyczy obrażeń, NIE amunicji (`resolveAmmo`) ani `maxRounds`.

BRAKUJE dla #135 (wejścia przed pętlą dystansu): wektory pinu dla kroków 2-3, 11-13, 15-16, 18, 20, 22, 24 (składanie `defFinalObrona`), oraz dla kroków 7-8/31 (mody cywilizacji wchodzące przez wejście faz). Wektory muszą pochodzić z pinu (`gra/src/game/combat.ts`), nie z własnych obliczeń Rust.

BRAKUJE dla #137 (NaN/Inf w amunicji i maxRounds): wektory `resolveAmmo` dla `'---'`, `''`, `null`, `'12abc'` (parseInt), `NaN`, `Infinity` oraz `maxRounds` `NaN`/`0`/`Infinity`. Obecne `ammo: i64` (`combat.rs:1074`) nie przyjmuje `NaN`/`Infinity`, więc każde wejście NaN musi być jawnie zmapowane (decyzja w temacie #137).

## 5. Propozycja podziału

Kolejność:
1. **#135 COMBAT-WEJSCIA (najpierw)**: kroki 2-3, 7-8, 11-13, 15-16, 18, 20, 22, 24, 25 + zwrot wejścia do `ranged_phase`.
   - Allowlista (przykład): `rust-port/engine/src/domain/combat_pin.rs` (nowy), `rust-port/engine/src/domain/mod.rs` (reeksport), `rust-port/engine/src/domain/combat.rs` (tylko dodanie funkcji składającej, bez zmiany `resolve_combat`/`resolve`), `rust-port/engine/tests/p6_combat_pin_wejscia.rs` (nowy), `rust-port/engine/tests/p6_combat_pin_wejscia_gen.mjs` (nowy), `rust-port/engine/tests/p6_combat_pin_wejscia_vectors/vectors.json` (nowy).
   - Zakaz: `gra/`, `origin/main`, `rust-port/engine/src/domain/siege_tactics_instant.rs` (poza kontraktem), `Cargo.lock`.
2. **#137 COMBAT-NAN-INF-AMUNICJA**: decyzja mapowania `ammo` (`f64` lub `Option<i64>`) i `maxRounds`; wektory dla `resolveAmmo` i `maxRounds`.
   - Allowlista: `rust-port/engine/src/domain/combat.rs` (typ pola `ammo`, `max_rounds`), `rust-port/engine/tests/p6_ranged_damage_nan.rs` (rozszerzenie), wektory jw.
   - Może iść równolegle z #135 tylko, jeśli nie zmienia `RangedSide.ammo` (zależność: #135 wywołuje `resolveAmmo`). Rekomendacja: po #135, bo oba dotykają `RangedSide`.
3. **COMBAT-RESOLVE-PAIR (po #135)**: produkcyjna implementacja `InstantPairResolver` jako port całego `resolveCombat` (kroki 1-39) + kontrakt `PairCombatResult`.
   - Allowlista: `rust-port/engine/src/domain/siege_tactics_instant.rs` (podpięcie implementacji), nowy moduł resolvera, testy `p6_combat_pair_*.rs`.

Czy RESOLVE-PAIR może ruszyć PRZED #135? **Nie (zalecam nie).** Powody:
- `InstantPairResolver` (`siege_tactics_instant.rs:247`) przyjmuje `InstantPairOpts` już po pre-krokach webu (`attackerArmyHungry`, `defenderTerrainDefMultOverride`, `structureDefBonusPct`, `defenderOnWallWalkway`), czyli wejście pary jest kontraktem tej samej zawartości, co #135. Produkcyjny resolver musi więc zawierać kroki 2-18, a to jest zakres #135.
- Obejście (RESOLVE-PAIR bez #135) wymagałoby zduplikowania kroków 2-24 w resolverze i późniejszej deduplikacji. To nie jest tańsze.
- Dozwolona alternatywa: RESOLVE-PAIR może wystartować równolegle jako rozpoznanie *tylko* kroków 26-39 (fazy + werdykt + zwrot), bez implementacji, pod warunkiem że kroki 2-24 zostaną zwolnione w #135 przed integracją. Rekomendacja: sekwencyjnie.

## 6. Odpowiedź na pytania dispatchu (skrót)

- Sygnatura wejścia potrzebna do zastąpienia `combat::resolve`: sekcja 3. `combat::resolve` nie wystarczy (inny model), potrzebny jest nowy punkt wejścia `resolve_combat_pin` z `PinCombatUnit` + `PinCombatOpts` + `rng`.
- Pokrycie wektorów pinu: sekcja 4 (pliki i kategorie).
- Brakujące wektory dla #135/#137: sekcja 4 (lista).
- Podział: sekcja 5.

## Uwagi do dispatchu i procesu

- Ścieżka pinu w dispatchu (`gra/src/battle/combat.ts`) jest błędna; poprawna to `gra/src/game/combat.ts`. Odczyt wykonano na poprawnej ścieżce.
- Dispatch wymaga zapisu `01-rozpoznanie.md`; orkiestrator w poleceniu rundy napisał `01-operator-r1.md`. Zastosowano nazwę z dispatchu (zgodnie z regułą „nazwa raportu: wg dispatchu/dodatku”).
- Gałąź roboczą `r-rustport-p6-combat-wejscia-rozp-q1` utworzono od bazy `474487792`. Nie wypchnięto do `rust-port/parity-v2` ani `origin/main`.
- Dowody SHA: baza `474487792174d9cee60e842f8fa765dd04ad5e57`; pin `07d2fbd72` (commit istnieje, `cat-file -t` = commit).
- NIE_ZMIERZONO: uruchomienie testów, liczba przechodzących wektorów, dokładne składanie `hit_chance_tw`/`damage_tw` w Rust (nazwy do potwierdzenia przez Evaluatora).
