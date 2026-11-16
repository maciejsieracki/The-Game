//! K5DOC-T2 CELE (dispatch R-RUSTPORT-P6-K5DOC-T2-CELE-Q1): testy zgodnosci wyboru celu z pinem `07d2fbd72`
//! (`gra/src/battle/battleScene.ts`: `_prefsForUnit`, `_priorityScore`, `_pickTargetByPriority`,
//! `_pickAdjacentTargetByPriority`, `_pickRangedTargetByPriority`, `_rangedTargetInRange`, `_targetInRange`,
//! `_meleeBlockedByWall`, warunek strzalu `:6241`).
//!
//! Wektory: `p6_k5doc_target_vectors/vectors.json`, generowane przez `p6_k5doc_target_gen.mjs` (Node) z wycietych
//! fragmentow pina (straznik SHA-256 w generatorze). Przypadki nazwane pokrywaja minimum dispatchu oraz trzy
//! mutacje (bonus antyjazdy, tie-break dystansem, filtr muru); reszta to 400 losowych scen na kazdy rodzaj.

use civ_engine::domain::siege_tactics_doctrine_state::BattleUnitClass;
use civ_engine::domain::siege_tactics_doctrine_target::{
    manhattan, pick_adjacent_target_by_priority, pick_ranged_target_by_priority,
    pick_target_by_priority, prefs_for_unit, ranged_target_in_range, takes_ranged_action,
    target_in_range, AttackDirection, Combatant, GroupPrefs, PartialPriorities, TargetPriorities,
    TargetScene,
};
use serde::Deserialize;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_k5doc_target_vectors/vectors.json");

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UnitV {
    q: i64,
    r: i64,
    hp: f64,
    range: i64,
    mounted: bool,
    primary_ranged: bool,
    ranged_base: bool,
    ammo_left: f64,
    shooting_enabled: bool,
    anti_cav_spear: bool,
    facing: f64,
    on_wall_walkway: bool,
    is_siege_unit: bool,
    attack_direction: String,
    dead: bool,
    fading_out: bool,
    routed: bool,
    use_unit_priorities: bool,
    unit_target_priorities: Option<PartialV>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct PartialV {
    #[serde(default)]
    mounted: Option<Vec<String>>,
    #[serde(default)]
    ranged: Option<Vec<String>>,
    #[serde(default)]
    melee: Option<Vec<String>>,
}

#[derive(Deserialize)]
struct ArmyV {
    mounted: Vec<String>,
    ranged: Vec<String>,
    melee: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GroupV {
    use_group_priorities: bool,
    group_target_priorities: Option<PartialV>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SceneV {
    siege_wall_col: i64,
    wall_ever_breached: bool,
}

#[derive(Deserialize)]
struct CaseV {
    kind: String,
    name: String,
    attacker: UnitV,
    #[serde(default)]
    side: Vec<UnitV>,
    #[serde(default)]
    army: Option<ArmyV>,
    #[serde(default)]
    group: Option<GroupV>,
    #[serde(default)]
    scene: Option<SceneV>,
    expect: Value,
}

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<CaseV>,
}

fn class_of(s: &str) -> BattleUnitClass {
    match s {
        "mounted" => BattleUnitClass::Mounted,
        "ranged" => BattleUnitClass::Ranged,
        "melee" => BattleUnitClass::Melee,
        other => panic!("nieznana klasa w wektorze: {other}"),
    }
}

fn class_name(c: BattleUnitClass) -> &'static str {
    match c {
        BattleUnitClass::Mounted => "mounted",
        BattleUnitClass::Ranged => "ranged",
        BattleUnitClass::Melee => "melee",
    }
}

fn list(v: &[String]) -> Vec<BattleUnitClass> {
    v.iter().map(|s| class_of(s)).collect()
}

fn partial(p: &PartialV) -> PartialPriorities {
    // Indeks w by_class: 0 = mounted, 1 = ranged, 2 = melee (zgodnie z TargetPriorities::default).
    PartialPriorities {
        by_class: [
            p.mounted.as_deref().map(list),
            p.ranged.as_deref().map(list),
            p.melee.as_deref().map(list),
        ],
    }
}

fn to_combatant(u: &UnitV) -> Combatant {
    let attack_direction = match u.attack_direction.as_str() {
        "front" => AttackDirection::Front,
        "bok" => AttackDirection::Bok,
        "tyl" => AttackDirection::Tyl,
        other => panic!("nieznany kierunek natarcia: {other}"),
    };
    Combatant {
        q: u.q,
        r: u.r,
        hp: u.hp,
        range: u.range,
        mounted: u.mounted,
        primary_ranged: u.primary_ranged,
        ranged_base: u.ranged_base,
        ammo_left: u.ammo_left,
        shooting_enabled: u.shooting_enabled,
        anti_cav_spear: u.anti_cav_spear,
        facing: u.facing,
        on_wall_walkway: u.on_wall_walkway,
        is_siege_unit: u.is_siege_unit,
        attack_direction,
        dead: u.dead,
        fading_out: u.fading_out,
        routed: u.routed,
        use_unit_priorities: u.use_unit_priorities,
        unit_target_priorities: u.unit_target_priorities.as_ref().map(partial),
    }
}

fn army_of(a: &Option<ArmyV>) -> TargetPriorities {
    match a {
        None => TargetPriorities::default(),
        Some(v) => TargetPriorities {
            by_class: [list(&v.mounted), list(&v.ranged), list(&v.melee)],
        },
    }
}

fn group_of(g: &Option<GroupV>) -> Option<GroupPrefs> {
    g.as_ref().map(|v| GroupPrefs {
        use_group_priorities: v.use_group_priorities,
        group_target_priorities: v.group_target_priorities.as_ref().map(partial),
    })
}

fn scene_of(s: &Option<SceneV>) -> TargetScene {
    match s {
        // Brak sceny = brak muru (siegeWallCol < 0), jak w sciezkach bez oblezenia.
        None => TargetScene {
            siege_wall_col: -1,
            wall_ever_breached: false,
        },
        Some(v) => TargetScene {
            siege_wall_col: v.siege_wall_col,
            wall_ever_breached: v.wall_ever_breached,
        },
    }
}

/// Wynik wykonania przypadku w tej samej postaci JSON co `expect` w generatorze.
fn run(c: &CaseV) -> Value {
    let att = to_combatant(&c.attacker);
    let side: Vec<Combatant> = c.side.iter().map(to_combatant).collect();
    let army = army_of(&c.army);
    let group = group_of(&c.group);
    let idx = |o: Option<usize>| match o {
        Some(i) => json!(i),
        None => Value::Null,
    };
    match c.kind.as_str() {
        "pick_target" => idx(pick_target_by_priority(&att, &side, &army, group.as_ref())),
        "pick_adjacent" => idx(pick_adjacent_target_by_priority(
            &att,
            &side,
            &army,
            group.as_ref(),
        )),
        "pick_ranged" => idx(pick_ranged_target_by_priority(
            &att,
            &side,
            &army,
            group.as_ref(),
        )),
        "ranged_in_range" => idx(ranged_target_in_range(&att, &side)),
        "target_in_range" => idx(target_in_range(&att, &side, &scene_of(&c.scene))),
        "takes_ranged_action" => json!(takes_ranged_action(&att)),
        "prefs" => Value::Array(
            prefs_for_unit(&att, &army, group.as_ref())
                .into_iter()
                .map(|c| json!(class_name(c)))
                .collect(),
        ),
        other => panic!("nieznany rodzaj przypadku: {other}"),
    }
}

fn load() -> Vec<CaseV> {
    serde_json::from_str::<Vectors>(VECTORS)
        .expect("vectors.json jest poprawnym JSON-em")
        .cases
}

#[test]
fn wektory_wyboru_celu_zgodne_z_pinem() {
    let cases = load();
    assert!(
        cases.len() >= 2800,
        "oczekiwano pelnego zestawu wektorow, jest {}",
        cases.len()
    );
    let mut failures = Vec::new();
    for c in &cases {
        let got = run(c);
        if got != c.expect {
            failures.push(format!(
                "{} [{}]: oczekiwano {}, otrzymano {}",
                c.name, c.kind, c.expect, got
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "rozbieznosci ({}):\n{}",
        failures.len(),
        failures.join("\n")
    );
}

#[test]
fn wymagane_przypadki_nazwane_sa_obecne() {
    let names: Vec<String> = load().into_iter().map(|c| c.name).collect();
    for required in [
        "piechota_vs_jazda_vs_wloznia_default",
        "jazda_bonus_antyjazda_przesuwa_wybor",
        "remis_po_dystansie_nie_lowest_hp",
        "melee_blokowany_przez_mur",
        "strzelec_zasieg_bez_filtra_muru",
        "shooting_disabled_wylacza_strzal",
        "dd0_ten_sam_heks_w_zasiegu",
        "wybor_po_lowest_hp",
    ] {
        assert!(
            names.iter().any(|n| n == required),
            "brak przypadku {required}"
        );
    }
}

#[test]
fn bonus_antyjazdy_jest_dokladnie_045() {
    // Jazda vs wloznia przeciwjazdowa przy prefs = [melee, ranged, mounted]: wynik 0 + 0.45 (bonus `:17518`),
    // a zwykla piechota 0. Piechota atakujaca nie dostaje bonusu.
    use civ_engine::domain::siege_tactics_doctrine_target::priority_score;
    let jazda = to_combatant(&unit_mounted(0, 0));
    let spear = to_combatant(&unit_melee(1, 0, true));
    let plain = to_combatant(&unit_melee(2, 0, false));
    let prefs = vec![
        BattleUnitClass::Melee,
        BattleUnitClass::Ranged,
        BattleUnitClass::Mounted,
    ];
    assert_eq!(priority_score(&jazda, &spear, &prefs), 0.0 + 0.45);
    assert_eq!(priority_score(&jazda, &plain, &prefs), 0.0);
    // Piechota nie dostaje bonusu.
    let inf = to_combatant(&unit_melee(0, 0, false));
    assert_eq!(priority_score(&inf, &spear, &prefs), 0.0);
}

#[test]
fn manhattan_i_domyslne_priorytety() {
    let a = to_combatant(&unit_melee(0, 0, false));
    let b = to_combatant(&unit_melee(-2, 3, false));
    assert_eq!(manhattan(&a, &b), 5);
    let d = TargetPriorities::default();
    assert_eq!(
        d.by_class[0],
        vec![
            BattleUnitClass::Mounted,
            BattleUnitClass::Ranged,
            BattleUnitClass::Melee
        ]
    );
    assert_eq!(
        d.by_class[1],
        vec![
            BattleUnitClass::Ranged,
            BattleUnitClass::Mounted,
            BattleUnitClass::Melee
        ]
    );
    assert_eq!(
        d.by_class[2],
        vec![
            BattleUnitClass::Melee,
            BattleUnitClass::Ranged,
            BattleUnitClass::Mounted
        ]
    );
}

#[test]
fn pusta_lista_zwraca_brak_celu() {
    let a = to_combatant(&unit_melee(0, 0, false));
    let side: Vec<Combatant> = vec![];
    let army = TargetPriorities::default();
    assert_eq!(pick_target_by_priority(&a, &side, &army, None), None);
    assert_eq!(
        pick_adjacent_target_by_priority(&a, &side, &army, None),
        None
    );
    assert_eq!(pick_ranged_target_by_priority(&a, &side, &army, None), None);
    assert_eq!(
        target_in_range(
            &a,
            &side,
            &TargetScene {
                siege_wall_col: -1,
                wall_ever_breached: false
            }
        ),
        None
    );
}

// --- pomocnicze konstruktory jednostek (JSON-owe UnitV nie sa potrzebne poza wektorami) ---

fn base(q: i64, r: i64) -> UnitV {
    UnitV {
        q,
        r,
        hp: 10.0,
        range: 1,
        mounted: false,
        primary_ranged: false,
        ranged_base: false,
        ammo_left: 0.0,
        shooting_enabled: true,
        anti_cav_spear: false,
        facing: 0.0,
        on_wall_walkway: false,
        is_siege_unit: false,
        attack_direction: "front".to_string(),
        dead: false,
        fading_out: false,
        routed: false,
        use_unit_priorities: false,
        unit_target_priorities: None,
    }
}

fn unit_mounted(q: i64, r: i64) -> UnitV {
    UnitV {
        mounted: true,
        ..base(q, r)
    }
}

fn unit_melee(q: i64, r: i64, spear: bool) -> UnitV {
    UnitV {
        anti_cav_spear: spear,
        ..base(q, r)
    }
}
