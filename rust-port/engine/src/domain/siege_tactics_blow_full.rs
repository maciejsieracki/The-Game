//! P6 SIEGE-TAKTYKA K5i-2b (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1): kompletny cios `_singleBlow` end-to-end.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`, cialo `_singleBlow` linie 8812-9010):
//! [`compose_blow`] sklada [`BlowInput`] rdzenia K5I ([`single_blow`]) z jednostek (CombatUnit, a4), otoczenia
//! (pozycja/flanka/tyl, brod/brzeg, teren z regula rzeki, mur i fortyfikacja, a1-a3) i mnoznika klasy strzelca
//! ([`ranged_damage_mult_for`] z `unit_power`, nie z wektora). [`single_blow_full`] = skladanie + rdzen K5I.
//!
//! Wejscia spoza tego modulu (ADAPTERY, policzone przez porty innych klockow, podawane jawnie):
//! * `atk_mods` / `def_mods` = wynik `civCombatStatMultipliers` + `mergeBuildingBonusIntoStatMultipliers` (civ, budynki);
//! * `def_wall_civ_mult` = `civWallDefenseMultiplier` (czytany tylko gdy obronca na murze);
//! * `counter_mult` = `counterMultiplier` (tabela kontr, `combat.ts:553`);
//! * `atk_diff_mult` / `def_diff_mult` = `battleUnitDifficultyCombatMult` (z fallbackiem strony);
//! * `env.field_terrain_multiplier` = `terrainDefenseMultiplier` (teren poza obrona miasta);
//! * `env.gated_terrain_multiplier` = `cityGatedTerrainMultiplier` (obrona miasta, `isCityDefenseBattle`);
//! * `env.wall_bonus_proc` = `_wallBonusProcFor` (obwarowanie, `siege_tactics_inputs_wall::wall_bonus_proc_for`);
//! * `hit_arc` = `relativeHit` (kierunek, `siege_tactics_inputs_pos::relative_hit`);
//! * flagi brodu / brzegu / rzeki (`isFordTile`, `isShoreAdjacentToFord`, nazwa kafla + wiersz rzeki).
//!
//! Stan sceny (`engaged`, `bracesAgainstCharge`, `mounted`) jest wejsciem jawnym: `first_blow_of_pair`, `def_braces_against_charge`.
//!
//! Liczby zgodne z JS: `Math.max`/`Math.min`/`Math.round` przez [`js_max`]/[`js_round`] (NaN propaguje). Kolejnosc mnozen
//! jak w pinie (lewo-prawo). `Math.max(meleeAttack, missileAttack)` (`rangedShotAccuracy`) jest liczone przez [`js_max`],
//! NIE przez `f64::max` (ten ignoruje NaN; JS nie).

use crate::domain::civ_bonuses::apply_multiplier;
use crate::domain::siege_tactics_blow::{
    single_blow, BlowInput, BlowOutput, DefenderState, HitArc, Outcome, RollSource,
};
// Znak zera jak w JS (Math.max(-0,+0)=+0): wersja ze znakiem zamiast js_max z siege_tactics_blow.
use crate::domain::siege_tactics_blow_inputs::terrain_river_attack_multiplier;
use crate::domain::siege_tactics_inputs_pos::js_max_sign as js_max;
use crate::domain::siege_tactics_inputs_pos::{flank_rear_defense_penalty, JsVal};
use crate::domain::siege_tactics_inputs_unit::CombatUnitModel;
use crate::domain::siege_tactics_inputs_wall::{
    city_terr_mult, field_fortify_defense_bonus, terr_def_mult,
};
use crate::domain::unit_power::ranged_damage_mult_for;

/// Atakujacy (pola `cuA` uzywane przez `_singleBlow`).
#[derive(Debug, Clone, PartialEq)]
pub struct AttackerCu {
    pub weapon_damage: f64,
    pub piercing: f64,
    pub melee_attack: f64,
    /// `cuA.missileAttack ?? 0`: `None` = `null`/`undefined`.
    pub missile_attack: Option<f64>,
    pub charge_bonus: f64,
    /// `cuA.counterTyp` (Typ w `rangedDamageMultFor`).
    pub counter_typ: String,
    /// `cuA.typNazwa` (Jednostka w `rangedDamageMultFor`).
    pub typ_nazwa: String,
}

/// Obronca (pola `cuD` uzywane przez `_singleBlow` i `flankRearDefensePenalty`).
#[derive(Debug, Clone, PartialEq)]
pub struct DefenderCu {
    pub melee_defence: f64,
    pub armor: f64,
    /// `Kara obrony z flanki (%)`: `None` = `null`/`undefined` (-> 0).
    pub kara_flanka: Option<f64>,
    /// `Kara obrony z tylu (%)`: `None` = `null`/`undefined` (-> 0).
    pub kara_tyl: Option<f64>,
}

/// `mods.atk` / `mods.rangedAtk` / `mods.uderzenie` (wynik civ + budynki, strona atakujacego).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AtkMods {
    pub atk: f64,
    pub ranged_atk: f64,
    pub uderzenie: f64,
}

/// `defMods.obrona` / `defMods.pancerz` (strona obrony).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DefMods {
    pub obrona: f64,
    pub pancerz: f64,
}

/// Otoczenie bitwy dla jednego ciosu (teren, mur, brod, fortyfikacja, mnozniki stalych z pinu).
#[derive(Debug, Clone, PartialEq)]
pub struct BlowEnv {
    /// `this.isCityDefenseBattle`.
    pub is_city_defense_battle: bool,
    /// `_wallBonusProcFor(defender)` (proc, np. 200 dla muru).
    pub wall_bonus_proc: f64,
    /// `cityGatedTerrainMultiplier(hasMur, ...)` (uzywany tylko przy `is_city_defense_battle`).
    pub gated_terrain_multiplier: f64,
    /// `terrainDefenseMultiplier(defTerrain, ...)` (uzywany tylko poza obrona miasta).
    pub field_terrain_multiplier: f64,
    /// `combatTerrainName(attacker) === 'Rzeka'` (wejscie logiczne `terrainRiverAttackMultiplier`).
    pub atk_tile_is_river: bool,
    /// Wiersz rzeki istnieje w danych terenu.
    pub river_row_exists: bool,
    /// `river_attack_mult` z `combat-params.json` (0.75 w pinie).
    pub river_attack_mult: f64,
    /// `isFordTile(tm, attacker)`.
    pub atk_on_ford: bool,
    /// `isFordTile(tm, defender)` (surowe; sklejane z `!onWallWalkway` w [`compose_blow`]).
    pub def_on_ford_raw: bool,
    /// `isShoreAdjacentToFord(tm, defender)`.
    pub shore_adjacent: bool,
    /// `BROD_KARA_OBRONA` (`combat-params.json` brod.karaObrona, 0.25).
    pub brod_kara_obrona: f64,
    /// `BROD_BONUS_BRZEG` (brod.bonusObronaBrzegu, 0.15).
    pub brod_bonus_brzegu: f64,
    /// `FORTIFY_OBRONA_PROC_FIELD` (oblezenie.fortify_obrona_proc, 50).
    pub fortify_obrona_proc: f64,
}

/// Pelne wejscie jednego ciosu `_singleBlow`.
#[derive(Debug, Clone, PartialEq)]
pub struct FullBlowInput {
    pub ranged: bool,
    /// `relativeHit(...)`: kierunek trafienia wzgledem zwrotu obroncy.
    pub hit_arc: HitArc,
    pub attacker: AttackerCu,
    pub atk_mods: AtkMods,
    pub atk_diff_mult: f64,
    pub atk_mounted: bool,
    pub defender: DefenderCu,
    pub def_mods: DefMods,
    pub def_diff_mult: f64,
    /// `defender.onWallWalkway`.
    pub def_on_wall: bool,
    /// `defender.bu.fortifiedInField === true`.
    pub def_fortified_in_field: bool,
    /// `civWallDefenseMultiplier(...)` (uzywany tylko gdy `def_on_wall`).
    pub def_wall_civ_mult: f64,
    /// `bracesAgainstCharge(defender.bu)` (wolane tylko gdy pierwszy cios pary).
    pub def_braces_against_charge: bool,
    /// `!this.engaged.has(key)` przed tym ciosem.
    pub first_blow_of_pair: bool,
    /// `counterMultiplier(cuA.counterTyp, cuD.counterTyp, counters)` = `ctrAtkVsDef`.
    pub counter_mult: f64,
    pub env: BlowEnv,
    pub defender_state: DefenderState,
    /// Wynik nieportowanego `_applyMoraleDamage` (`routed` po jego wywolaniu).
    pub routed_after_morale: bool,
}

/// Posrednie wartosci skladania (do porownan i raportu). Odpowiadaja zmiennym `_singleBlow`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Composition {
    /// `isCharge` (tylko wrecz, pierwszy cios pary, obronca nie zapiera sie).
    pub is_charge: bool,
    /// `defPenaltyFrac` = `flankRearDefensePenalty(cuD, hitArc)`.
    pub def_penalty_frac: f64,
    /// `defFordMlt`.
    pub def_ford_mlt: f64,
    /// `shoreBonusMlt`.
    pub shore_bonus_mlt: f64,
    /// `defFinalObrona` (argument 2 `hitChanceTw`).
    pub def_final_obrona: f64,
    /// `atkMelee` (po mnozniku rzeki).
    pub atk_melee: f64,
    /// `atkShootAcc` (po mnozniku rzeki).
    pub atk_shoot_acc: f64,
    /// `atkMissile`.
    pub atk_missile: f64,
    /// `defArmor`.
    pub def_armor: f64,
    /// `roundAtkCharge`.
    pub round_atk_charge: f64,
    /// `chargeHitBonus` (argument 3 `hitChanceTw`).
    pub charge_hit_bonus: f64,
    /// `rangedDamageMultFor({Typ, Jednostka})`.
    pub ranged_class_mult: f64,
}

/// Wynik pelnego ciosu: skladanie + wynik rdzenia K5I.
#[derive(Debug, Clone, PartialEq)]
pub struct FullBlowOutput {
    pub composition: Composition,
    pub blow: BlowOutput,
}

fn opt_js(v: Option<f64>) -> JsVal {
    match v {
        None => JsVal::Null,
        Some(x) => JsVal::Num(x),
    }
}

/// Zloz [`BlowInput`] (K5I) z wejsc jednostek i otoczenia, wraz z posrednimi wartosciami.
pub fn compose_blow(input: &FullBlowInput) -> (BlowInput, Composition) {
    let env = &input.env;
    let arc_str = match input.hit_arc {
        HitArc::Front => "front",
        HitArc::Flank => "flank",
        HitArc::Rear => "rear",
    };
    // defPenaltyFrac = flankRearDefensePenalty(cuD, hitArc) (combat.ts:589-606).
    let def_penalty_frac = flank_rear_defense_penalty(
        &opt_js(input.defender.kara_flanka),
        &opt_js(input.defender.kara_tyl),
        arc_str,
    );

    // Brod po stronie obrony: nie na murze (`!defender.onWallWalkway && isFordTile(...)`).
    let def_on_ford = !input.def_on_wall && env.def_on_ford_raw;
    let def_ford_mlt = if def_on_ford {
        1.0 - env.brod_kara_obrona
    } else {
        1.0
    };
    let shore_applies = !def_on_ford && !input.def_on_wall && env.atk_on_ford && env.shore_adjacent;
    let shore_bonus_mlt = if shore_applies {
        1.0 + env.brod_bonus_brzegu
    } else {
        1.0
    };

    // defMeleeDef = fieldFortifyDefenseBonus(applyMultiplier(cuD.meleeDefence, defMods.obrona), fortified, FORTIFY).
    let def_melee_def = field_fortify_defense_bonus(
        apply_multiplier(input.defender.melee_defence, input.def_mods.obrona),
        input.def_fortified_in_field,
        env.fortify_obrona_proc,
    );
    // defEffObrona = max(0, defMeleeDef * (1 - pen) * defOwnerDiffMult).
    let def_eff_obrona = js_max(
        0.0,
        def_melee_def * (1.0 - def_penalty_frac) * input.def_diff_mult,
    );
    let wall_civ_mult = if input.def_on_wall {
        input.def_wall_civ_mult
    } else {
        1.0
    };
    // terrDefMult (battleScene.ts:8850-8857) przez helpery muru/terenu.
    let city_mult = city_terr_mult(env.is_city_defense_battle, env.gated_terrain_multiplier);
    let terr_def = terr_def_mult(
        env.is_city_defense_battle,
        env.wall_bonus_proc,
        city_mult,
        env.field_terrain_multiplier,
    );
    // defFinalObrona = defEffObrona * terrDefMult * defFordMlt * shoreBonusMlt * wallCivMult.
    let def_final_obrona =
        def_eff_obrona * terr_def * def_ford_mlt * shore_bonus_mlt * wall_civ_mult;

    // Atak: melee / pocisk / rzeka.
    let atk_melee_raw =
        apply_multiplier(input.attacker.melee_attack, input.atk_mods.atk) * input.atk_diff_mult;
    let river_mlt = terrain_river_attack_multiplier(
        env.atk_tile_is_river,
        env.river_row_exists,
        env.river_attack_mult,
    );
    let atk_melee = atk_melee_raw * river_mlt;
    let missile = input.attacker.missile_attack.unwrap_or(0.0);
    let atk_missile = apply_multiplier(missile, input.atk_mods.ranged_atk) * input.atk_diff_mult;
    // rangedShotAccuracy = Math.max(atkMeleeRaw, atkMissile) * river (JS NaN-propagating max).
    let atk_shoot_acc = js_max(atk_melee_raw, atk_missile) * river_mlt;

    let def_armor = apply_multiplier(input.defender.armor, input.def_mods.pancerz);
    let round_atk_charge = apply_multiplier(input.attacker.charge_bonus, input.atk_mods.uderzenie);

    // isCharge (battleScene.ts:8894-8900): tylko wrecz.
    let is_charge = !input.ranged && input.first_blow_of_pair && !input.def_braces_against_charge;
    let charge_hit_bonus = if !input.ranged && is_charge {
        round_atk_charge
    } else {
        0.0
    };

    // Mnoznik klasy strzelca z unit_power (R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1), nie z wektora.
    let ranged_class_mult = ranged_damage_mult_for(
        Some(input.attacker.counter_typ.as_str()),
        Some(input.attacker.typ_nazwa.as_str()),
    );

    let comp = Composition {
        is_charge,
        def_penalty_frac,
        def_ford_mlt,
        shore_bonus_mlt,
        def_final_obrona,
        atk_melee,
        atk_shoot_acc,
        atk_missile,
        def_armor,
        round_atk_charge,
        charge_hit_bonus,
        ranged_class_mult,
    };

    let blow_input = BlowInput {
        ranged: input.ranged,
        first_blow_of_pair: input.first_blow_of_pair,
        defender_braces_against_charge: input.def_braces_against_charge,
        attacker_mounted: input.atk_mounted,
        hit_arc: input.hit_arc,
        atk_melee: comp.atk_melee,
        atk_shoot_acc: comp.atk_shoot_acc,
        def_final_obrona: comp.def_final_obrona,
        round_atk_charge: comp.round_atk_charge,
        def_armor: comp.def_armor,
        atk_missile: comp.atk_missile,
        weapon_damage: input.attacker.weapon_damage,
        piercing: input.attacker.piercing,
        ctr_atk_vs_def: input.counter_mult,
        ranged_class_mult: comp.ranged_class_mult,
        defender: input.defender_state,
        routed_after_morale: input.routed_after_morale,
    };
    (blow_input, comp)
}

/// Adapter: `cuA` z `CombatUnitModel` (wynik `to_combat_unit`, K5I2a4 - ten sam obiekt co `toCombatUnit` w pinie).
pub fn attacker_from_cu(cu: &CombatUnitModel) -> AttackerCu {
    AttackerCu {
        weapon_damage: cu.weapon_damage,
        piercing: cu.piercing,
        melee_attack: cu.melee_attack,
        // `cuA.missileAttack ?? 0`: model ma juz `combat_norm_field(.., 0)` (null/undefined -> 0).
        missile_attack: Some(cu.missile_attack),
        charge_bonus: cu.charge_bonus,
        counter_typ: cu.counter_typ.clone(),
        typ_nazwa: cu.typ_nazwa.js_to_string(),
    }
}

/// Adapter: `cuD` z `CombatUnitModel` (pola obrony i kary z flanki/tylu).
pub fn defender_from_cu(cu: &CombatUnitModel) -> DefenderCu {
    DefenderCu {
        melee_defence: cu.melee_defence,
        armor: cu.armor,
        kara_flanka: Some(cu.kara_flanka),
        kara_tyl: Some(cu.kara_tyl),
    }
}

/// Jeden cios `_singleBlow` end-to-end: skladanie [`compose_blow`] + rdzen [`single_blow`] (K5I).
pub fn single_blow_full(input: &FullBlowInput, rolls: &mut dyn RollSource) -> FullBlowOutput {
    let (blow_input, composition) = compose_blow(input);
    let blow = single_blow(&blow_input, rolls);
    FullBlowOutput { composition, blow }
}

/// Czy cios zakonczyl sie zabiciem (przydatne w testach pokrycia).
pub fn is_kill(out: &FullBlowOutput) -> bool {
    out.blow.outcome == Outcome::Kill
}
