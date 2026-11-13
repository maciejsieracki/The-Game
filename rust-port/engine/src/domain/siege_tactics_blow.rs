//! P6 SIEGE-TAKTYKA K5i (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1): cios `_singleBlow` z wstrzyknietym zrodlem losowosci.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`single_blow`] = dolna czesc `_singleBlow` (`battleScene.ts:8958-9010`): `hitPct`, rzut, pudlo, obrazenia
//!   (`rangeDamage` / `baseDamage` z `combat.ts:504-517`), `dmg = max(1, round(raw * kontra))`, HP obroncy,
//!   flanka/tyl i szarza konna (`extraMorale`). Wczesniej: `isCharge` (`battleScene.ts:8894-8900`).
//! * [`resolve_outcome`] = `_resolveBlowOutcome` (`battleScene.ts:9020-9068`): rout przed smiercia, zabicie, cios lamiacy morale.
//!
//! Zrodlo losowosci jest WSTRZYKNIETE przez [`RollSource`] (T1 dispatchu): jedno wywolanie [`RollSource::next_unit`]
//! na cios, wartosc w `[0, 1)`, odpowiada `Math.random()` z weba (`roll = u * 100`). Brak wlasnego generatora.
//!
//! Wejscia spoza zakresu linii pinu (liczone wyzej, NIE portowane tu): `cuA.weaponDamage/piercing`, `defArmor`,
//! `roundAtkCharge`, `atkMelee`, `atkShootAcc`, `defFinalObrona`, `atkMissile`, `ctrAtkVsDef` (civ, teren, fortyfikacja,
//! kara skrzydla, kontra), `rangedDamageMultFor` (`unit-power.ts`), `bracesAgainstCharge` i `engaged` (stan sceny),
//! `hitArc` (`relativeHit`), oraz wynik `_applyMoraleDamage` (`routed_after_morale`).
//!
//! Efekty sceny (`_updateHpBar`, `_applyMoraleDamage`, `_gainMorale`, `_startFade`, `_shakeAlliesOnLoss`,
//! `_boostEnemiesOnBreak`, `_pushClash`) sa ZWRACANE jako jawna lista [`SceneEffect`]; ich cialo NIE jest portowane.
//! Tekst logu (`this.log.push`) i dzwiek (`_sfxMelee`) sa poza portem.
//!
//! Semantyka liczb jak w JS: `Math.max`/`Math.min` propaguja NaN ([`js_max`], [`js_min`]); `Math.round` jak w JS, bez `floor(x + 0.5)`
//! ([`js_round`]); porownania z NaN sa falszywe. Wartosci `Infinity` przechodza tak samo jak w JS.

use std::sync::OnceLock;

use crate::data::units_combat::parse_combat_params;

/// Zrodlo kolejnych rzutow w `[0, 1)` (zastepuje `Math.random()` weba). Jedno wywolanie na cios.
pub trait RollSource {
    fn next_unit(&mut self) -> f64;
}

/// Zrodlo z zadana sekwencja (do testow i wektorow). Wyczerpanie sekwencji to blad programu.
#[derive(Debug, Clone)]
pub struct SequenceRolls {
    values: Vec<f64>,
    index: usize,
}

impl SequenceRolls {
    pub fn new(values: Vec<f64>) -> Self {
        Self { values, index: 0 }
    }
}

impl RollSource for SequenceRolls {
    fn next_unit(&mut self) -> f64 {
        let v = *self
            .values
            .get(self.index)
            .expect("sekwencja rzutow wyczerpana: cios zuzywa dokladnie jeden rzut");
        self.index += 1;
        v
    }
}

/// Kierunek trafienia wzgledem zwrotu obroncy (`relativeHit`, wejscie jawne).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HitArc {
    Front,
    Flank,
    Rear,
}

/// Stan obroncy potrzebny do ciosu i rozstrzygniecia (pola `RuntimeBattleUnit` / `bu`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DefenderState {
    pub hp: f64,
    pub max_hp: f64,
    pub morale: f64,
    /// Prog ucieczki (`fleeMorale`); w webie `null` porownuje sie jak 0 (wejscie podawane juz jako 0).
    pub flee_morale: f64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub never_rout: bool,
    pub removed: bool,
}

/// Wejscia jednego ciosu (wszystko policzone wyzej, patrz dokument modulu).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BlowInput {
    pub ranged: bool,
    /// `!this.engaged.has(key)` (para atakujacy>obrońca jeszcze nie walczyla).
    pub first_blow_of_pair: bool,
    /// `bracesAgainstCharge(defender.bu)`.
    pub defender_braces_against_charge: bool,
    /// `attacker.mounted`.
    pub attacker_mounted: bool,
    pub hit_arc: HitArc,
    pub atk_melee: f64,
    pub atk_shoot_acc: f64,
    pub def_final_obrona: f64,
    pub round_atk_charge: f64,
    pub def_armor: f64,
    pub atk_missile: f64,
    /// `cuA.weaponDamage`.
    pub weapon_damage: f64,
    /// `cuA.piercing`.
    pub piercing: f64,
    pub ctr_atk_vs_def: f64,
    /// `rangedDamageMultFor({Typ, Jednostka})` (poza portem).
    pub ranged_class_mult: f64,
    pub defender: DefenderState,
    /// Wynik nieportowanego `_applyMoraleDamage`: czy obrońca jest `routed` po jego wywolaniu.
    pub routed_after_morale: bool,
}

/// Stala morale z pinu (`battleScene.ts:1115, 1137-1140`).
pub const MORALE_HIT_LOSS_SCALE: f64 = 100.0;
pub const MORALE_FLANK_HIT: f64 = 8.0;
pub const MORALE_REAR_HIT: f64 = 15.0;
pub const MORALE_CHARGE_HIT: f64 = 15.0;
pub const MORALE_KILL_GAIN: f64 = 6.0;

/// Strona, ktorej dotyczy efekt (`_gainMorale(attacker|defender, ...)`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Attacker,
    Defender,
}

/// Tag logu walki (`_pushClash`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClashTag {
    Rout,
    Padl,
    Plain,
}

/// Jawny efekt sceny zwracany przez cios (cialo efektu nieportowane).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SceneEffect {
    UpdateHpBar,
    ApplyMoraleDamage { dmg: f64, extra_morale: f64 },
    GainMorale { side: Side, amount: f64 },
    StartFade,
    ShakeAllies,
    BoostEnemies,
    PushClash { tag: ClashTag },
}

/// Rozstrzygniecie trafienia (`_resolveBlowOutcome`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    /// Brak trafienia (pudlo) - `_resolveBlowOutcome` nie jest wolany.
    None,
    /// Cios lamie morale obroncy przed smiercia (obrona zyje, ucieka).
    RoutBeforeDeath,
    /// Cios zabija (HP <= 0).
    Kill,
    /// Trafienie bez zabicia i bez rout-przed-smiercia (zwykly spadek morale).
    MoraleOnly,
}

/// Wynik ciosu.
#[derive(Debug, Clone, PartialEq)]
pub struct BlowOutput {
    /// `isCharge` (tylko cios wrecz, pierwszy w parze, obrońca nie zapiera sie).
    pub is_charge: bool,
    pub missed: bool,
    /// `hitPct` (zakres [hit_min, hit_max] z combat-params).
    pub hit_pct: f64,
    /// `roll = Math.random() * 100`.
    pub roll: f64,
    /// Zwracane obrazenia (0 przy pudle).
    pub dmg: f64,
    /// HP obroncy po ciosie (bez zmian przy pudle).
    pub def_hp_after: f64,
    /// `extraMorale` (flanka/tyl/szarza).
    pub extra_morale: f64,
    pub outcome: Outcome,
    pub effects: Vec<SceneEffect>,
    /// `this.engaged.add(key)` (`battleScene.ts:8899`): tylko cios wrecz, zawsze (takze przy pudle).
    /// Wywolujacy musi zapisac klucz pary w zbiorze `engaged` sceny.
    pub engaged_add: bool,
}

/// `Math.max(a, b)` z JS: NaN propaguje, `+0` wygrywa z `-0` (`Math.max(-0, 0) === +0`).
/// Jedna implementacja dla calego modulu siege (wraz z `js_min`): `siege_tactics_inputs_pos::js_max_sign`.
/// `f64::max` ignoruje NaN i dla `(-0, +0)` nie gwarantuje znaku, stad reczna wersja.
pub use crate::domain::siege_tactics_inputs_pos::js_max_sign as js_max;

/// `Math.min(a, b)` z JS: NaN propaguje, `-0` wygrywa z `+0` (`Math.min(0, -0) === -0`).
/// Jedna implementacja: `siege_tactics_inputs_pos::js_min_sign`.
pub use crate::domain::siege_tactics_inputs_pos::js_min_sign as js_min;

/// `Math.round(x)` z JS: polowki w strone +Infinity, bez bledu zaokraglenia `x + 0.5`
/// (dla `x = 0.49999999999999994` JS daje 0, a `floor(x + 0.5)` dawaloby 1).
/// `x - floor(x)` jest dokladne dla |x| < 2^52; dla wiekszych |x| x jest calkowity i zwracany bez zmian.
pub fn js_round(x: f64) -> f64 {
    if !x.is_finite() {
        return x;
    }
    let r = x.floor();
    if x - r >= 0.5 {
        r + 1.0
    } else {
        r
    }
}

/// `hitChanceTw` z pinu (`combat.ts:440-447`): `clamp(hit_base + melee_attack - melee_defence + hit_bonus, hit_min, hit_max)`.
pub fn hit_chance(melee_attack: f64, melee_defence: f64, hit_bonus: f64) -> f64 {
    static TW: OnceLock<(f64, f64, f64)> = OnceLock::new();
    let (hit_base, hit_min, hit_max) = *TW.get_or_init(|| {
        let tw = parse_combat_params()
            .expect("combat-params.json musi sie parsowac")
            .tw_v3;
        (tw.hit_base as f64, tw.hit_min as f64, tw.hit_max as f64)
    });
    let raw = hit_base + melee_attack - melee_defence + hit_bonus;
    js_max(hit_min, js_min(hit_max, raw))
}

/// `damageTw` z pinu (`combat.ts:455-462`): `max(0, weapon - armor) + piercing + (charge ? charge_bonus : 0)`.
pub fn damage_tw(
    weapon_damage: f64,
    armor: f64,
    piercing: f64,
    charge_bonus: f64,
    is_charge_round: bool,
) -> f64 {
    let base = js_max(0.0, weapon_damage - armor) + piercing;
    base + if is_charge_round { charge_bonus } else { 0.0 }
}

/// `rangeDamage` z pinu (`combat.ts:515`, alias `rangeDamageTw`): `max(1, missile - armor)`.
pub fn range_damage(missile_attack: f64, armor: f64) -> f64 {
    js_max(1.0, missile_attack - armor)
}

/// Jeden cios `_singleBlow` z wstrzyknietym rzutem. Zuzywa dokladnie jeden rzut z `rolls`.
pub fn single_blow(input: &BlowInput, rolls: &mut dyn RollSource) -> BlowOutput {
    // isCharge (battleScene.ts:8894-8900): tylko wrecz, pierwszy cios pary, obrońca nie zapiera sie.
    let is_charge =
        !input.ranged && input.first_blow_of_pair && !input.defender_braces_against_charge;

    // chargeHitBonus (:8958).
    let charge_hit_bonus = if !input.ranged && is_charge {
        input.round_atk_charge
    } else {
        0.0
    };
    let hit_pct = hit_chance(
        if input.ranged {
            input.atk_shoot_acc
        } else {
            input.atk_melee
        },
        input.def_final_obrona,
        charge_hit_bonus,
    );
    let roll = rolls.next_unit() * 100.0;
    if roll >= hit_pct {
        return BlowOutput {
            is_charge,
            missed: true,
            hit_pct,
            roll,
            dmg: 0.0,
            def_hp_after: input.defender.hp,
            extra_morale: 0.0,
            outcome: Outcome::None,
            effects: Vec::new(),
            engaged_add: !input.ranged,
        };
    }

    // Obrażenia (:8964-8974): strzal = rangeDamage * mnoznik klasy; wrecz = baseDamage.
    let raw_dmg = if input.ranged {
        range_damage(input.atk_missile, input.def_armor) * input.ranged_class_mult
    } else {
        damage_tw(
            input.weapon_damage,
            input.def_armor,
            input.piercing,
            input.round_atk_charge,
            is_charge,
        )
    };
    // dmg = max(1, round(raw * kontra)) (:8980ish).
    let dmg = js_max(1.0, js_round(raw_dmg * input.ctr_atk_vs_def));

    // HP obroncy (bu.hp = max(0, hp - dmg)).
    let def_hp_after = js_max(0.0, input.defender.hp - dmg);
    let mut defender = input.defender;
    defender.hp = def_hp_after;

    // extraMorale: flanka/tyl + szarza konna (FACTOR 1 i 2).
    let mut extra_morale = 0.0;
    match input.hit_arc {
        HitArc::Flank => extra_morale += MORALE_FLANK_HIT,
        HitArc::Rear => extra_morale += MORALE_REAR_HIT,
        HitArc::Front => {}
    }
    if !input.ranged && input.attacker_mounted && is_charge {
        extra_morale += MORALE_CHARGE_HIT;
    }

    let mut effects = vec![SceneEffect::UpdateHpBar];
    let (outcome, outcome_effects) =
        resolve_outcome(&defender, dmg, extra_morale, input.routed_after_morale);
    effects.extend(outcome_effects);

    BlowOutput {
        is_charge,
        missed: false,
        hit_pct,
        roll,
        dmg,
        def_hp_after,
        extra_morale,
        outcome,
        effects,
        engaged_add: !input.ranged,
    }
}

/// `_resolveBlowOutcome` (`battleScene.ts:9020-9068`). `defender` ma JUZ zmniejszone HP.
pub fn resolve_outcome(
    defender: &DefenderState,
    dmg: f64,
    extra_morale: f64,
    routed_after_morale: bool,
) -> (Outcome, Vec<SceneEffect>) {
    // Rout przed smiercia: tylko dla zywych, niepekajacych jeszcze jednostek z HP > 0 (:9031-9042).
    if !defender.dead
        && !defender.fading_out
        && !defender.routed
        && !defender.never_rout
        && defender.hp > 0.0
    {
        let proj_morale = defender.morale
            - MORALE_HIT_LOSS_SCALE * (dmg / js_max(1.0, defender.max_hp))
            - extra_morale;
        if proj_morale <= defender.flee_morale {
            let mut effects = vec![SceneEffect::ApplyMoraleDamage { dmg, extra_morale }];
            if routed_after_morale {
                effects.push(SceneEffect::GainMorale {
                    side: Side::Attacker,
                    amount: MORALE_KILL_GAIN,
                });
            }
            effects.push(SceneEffect::PushClash {
                tag: ClashTag::Rout,
            });
            return (Outcome::RoutBeforeDeath, effects);
        }
    }

    // Zabicie: HP <= 0 dla nieusunietej, nieznikajacej jednostki (:9046-9056).
    if !defender.dead && !defender.fading_out && !defender.removed && defender.hp <= 0.0 {
        return (
            Outcome::Kill,
            vec![
                SceneEffect::StartFade,
                SceneEffect::ShakeAllies,
                SceneEffect::BoostEnemies,
                SceneEffect::GainMorale {
                    side: Side::Attacker,
                    amount: MORALE_KILL_GAIN,
                },
                SceneEffect::PushClash {
                    tag: ClashTag::Padl,
                },
            ],
        );
    }

    // Zwykly spadek morale (:9060-9067).
    let mut effects = vec![SceneEffect::ApplyMoraleDamage { dmg, extra_morale }];
    if routed_after_morale {
        effects.push(SceneEffect::GainMorale {
            side: Side::Attacker,
            amount: MORALE_KILL_GAIN,
        });
    }
    effects.push(SceneEffect::PushClash {
        tag: if routed_after_morale {
            ClashTag::Rout
        } else {
            ClashTag::Plain
        },
    });
    (Outcome::MoraleOnly, effects)
}

#[cfg(test)]
mod tests_js_round {
    use super::js_round;

    #[test]
    fn js_round_jak_math_round() {
        assert_eq!(js_round(0.49999999999999994), 0.0);
        assert_eq!(js_round(0.5), 1.0);
        assert_eq!(js_round(1.5), 2.0);
        assert_eq!(js_round(2.5), 3.0);
        assert_eq!(js_round(-2.5), -2.0);
        assert_eq!(js_round(-0.5), 0.0);
        assert_eq!(js_round(-2.6), -3.0);
        assert_eq!(js_round(4503599627370497.0), 4503599627370497.0);
        assert_eq!(js_round(f64::INFINITY), f64::INFINITY);
        assert_eq!(js_round(f64::NEG_INFINITY), f64::NEG_INFINITY);
        assert!(js_round(f64::NAN).is_nan());
    }
}
