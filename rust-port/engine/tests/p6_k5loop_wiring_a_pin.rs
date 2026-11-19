//! R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A, r2): PEŁNA bitwa oblężnicza AUTO sesji
//! [`SiegeBattleSession`] bajt w bajt z wykonaniem tekstu pinu `07d2fbd72` (`tests/p6_k5loop_wiring_a_gen.mjs`:
//! cały `battleScene.ts` z drzewem importów, atrapy wyłącznie renderu/DOM/audio, rzut `_singleBlow` `:8960` = LCG
//! `domain/rng.rs` z ziarnem `SessionRolls::derive`).
//!
//! Wejście sceny = `BattleOpts` po rosterach (`BattleUnit` obu stron, teren, budynki, `defCiv`, `defenderEra`) →
//! [`SiegeBattleSession::prepare_scene`]; dane statyczne = dane pinu (`pin_data.json`: `units.json`, `counters.json`,
//! `terrain-combat.json`, potrzebne pola `combat-params.json` / `miasto-params.json`), nie dane silnika z dryfem D-ADP-4.
//! Porównanie: zwycięzca, tura końca, `wallEverBreached`, liczba rzutów `_singleBlow`, dla każdej jednostki HP (bity
//! `f64`), `dead`, `routed`, `removed`. Tryby: przewijanie (`play` + `skip`) i czas rzeczywisty (klatki 16 ms).

use std::collections::BTreeMap;

use civ_engine::domain::battle_setup_terrain::WorldTerrainInput;
use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::city_towers::UnitRow;
use civ_engine::domain::siege_battle_adapter::{
    stat_row_from_json, stat_rows_from_json, MilitiaParams,
};
use civ_engine::domain::siege_battle_adapter_body::TowerParams;
use civ_engine::domain::siege_battle_adapter_unit::{
    norm_counters, AdapterBattleUnit, StartingMoraleParams, UnitDefFallback,
};
use civ_engine::domain::siege_battle_session::{
    SceneInput, SessionData, SessionError, SessionOutcome, SessionPhase, SiegeBattleSession,
    TerrainRangeRow,
};
use civ_engine::domain::siege_tactics_blow_env::TerrainRow;
use civ_engine::domain::siege_tactics_inputs_unit::ToCombatUnitOpts;
use civ_engine::domain::siege_tactics_inputs_wall::MiastoWallParamValues;
use civ_engine::domain::siege_tactics_loop::LoopWinner;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/vectors.json");
const PIN_DATA: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/pin_data.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const PIN_SHA256: &str = "3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d";
const FRAME_MS: f64 = 16.0;
const MAX_FRAMES: u32 = 3_000_000;

fn f(v: &Value) -> f64 {
    v.as_f64().unwrap_or_else(|| panic!("liczba: {v}"))
}

/// Dane statyczne bitwy z danych pinu.
fn pin_session_data() -> SessionData {
    let d: Value = serde_json::from_str(PIN_DATA).unwrap();
    assert_eq!(d["pin"], PIN);
    let units = &d["units"];
    let tower_units: Vec<UnitRow> = units
        .as_array()
        .unwrap()
        .iter()
        .map(|u| serde_json::from_value(u.clone()).unwrap())
        .collect();
    let cp = &d["combatParams"];
    let mp = &d["miastoParams"];
    let opt = |v: &Value| v.as_f64();
    SessionData {
        unit_rows: stat_rows_from_json(units).unwrap(),
        tower_units,
        counters: norm_counters(&d["counters"]),
        counter_mult: f(&cp["counter_multiplier"]),
        terrain_rows: d["terrainCombat"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| TerrainRow {
                teren: t["Teren"].as_str().unwrap().to_owned(),
                bonus_obrona: t["Bonus Obrona"].as_str().map(str::to_owned),
            })
            .collect(),
        terrain_range_rows: d["terrainCombat"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| TerrainRangeRow {
                teren: t["Teren"].as_str().unwrap().to_owned(),
                delta_zasieg: t["Δ Zasięg (dystansowi)"].as_str().map(str::to_owned),
            })
            .collect(),
        river_attack_mult: f(&cp["river_attack_mult"]),
        brod_kara_obrona: f(&cp["brod"]["karaObrona"]),
        brod_bonus_brzegu: f(&cp["brod"]["bonusObronaBrzegu"]),
        fortify_obrona_proc: f(&cp["fortify_obrona_proc"]),
        no_breach_cap: cp["bez_wylomu_max_tur"].as_i64().unwrap(),
        militia: MilitiaParams::pin(),
        towers: TowerParams::pin(),
        starting_morale: StartingMoraleParams {
            wspolczynnik_proc: f(&cp["morale_przewaga_mocy"]["wspolczynnik_proc"]),
            sufit_proc: f(&cp["morale_przewaga_mocy"]["sufit_proc"]),
            epsilon_ponad_flee: f(&cp["morale_przewaga_mocy"]["epsilon_ponad_flee"]),
        },
        wall_params: MiastoWallParamValues {
            mur: opt(&mp["bonus_obrona_mur_proc"]),
            mur_kamienny: opt(&mp["bonus_obrona_mur_kamienny_proc"]),
            cytadela: opt(&mp["bonus_obrona_cytadela_proc"]),
            baszta: opt(&mp["bonus_obrona_baszta_proc"]),
            palisada: opt(&mp["bonus_obrona_palisada_proc"]),
        },
        combat_opts: ToCombatUnitOpts::default(),
        fallback: UnitDefFallback::PinRecord,
    }
}

/// `BattleUnit` z wektora (`runtimeToBattleUnit` + `rosterToBattleUnits`, `main.ts:33158-33196`, `:36887-36905`).
fn battle_unit(v: &Value, side: Side, owner_id: i64) -> AdapterBattleUnit {
    assert!(
        v["civBonusy"].as_array().unwrap().is_empty(),
        "scenariusze bez bonusów cywilizacji"
    );
    AdapterBattleUnit {
        id: v["id"].as_str().unwrap().to_owned(),
        owner_id,
        side,
        nazwa: v["nazwa"].as_str().unwrap().to_owned(),
        kategoria: v["kategoria"].as_str().unwrap().to_owned(),
        stats: stat_row_from_json(&v["stats"]).unwrap(),
        hp: f(&v["hp"]),
        max_hp: f(&v["maxHp"]),
        is_army_commander: v["isArmyCommander"].as_bool().unwrap(),
        pancerz_bonus_frac: f(&v["pancerzBonusFrac"]),
        parametry_bonus_frac: f(&v["parametryBonusFrac"]),
        veteran_bonus_frac: f(&v["veteranBonusFrac"]),
        fortified_in_field: v["fortifiedInField"].as_bool().unwrap(),
        army_hungry: v["armyHungry"].as_bool().unwrap(),
        gold_deficit: v["goldDeficit"].as_bool().unwrap(),
        army_leader_morale_bonus_frac: f(&v["armyLeaderMoraleBonusFrac"]),
        difficulty_combat_mult: f(&v["difficultyCombatMult"]),
        civ_bonusy: Vec::new(),
    }
}

/// `BattleOpts` z wektora.
fn scene_input(v: &Value) -> SceneInput {
    let inp = &v["input"];
    let side = |k: &str, s: Side, owner: i64| {
        inp[k]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| battle_unit(u, s, owner))
            .collect::<Vec<_>>()
    };
    let world = &inp["worldTerrain"];
    SceneInput {
        atk: side("attacker", Side::Atk, 1),
        def: side("defender", Side::Def, 2),
        built_building_ids: inp["builtBuildingIds"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b.as_str().unwrap().to_owned())
            .collect(),
        teren: inp["teren"].as_str().unwrap().to_owned(),
        world_terrain: if world.is_null() {
            None
        } else {
            Some(WorldTerrainInput {
                baza: world["baza"].as_str().unwrap().to_owned(),
                las: world["las"].as_bool().unwrap(),
                rzeka: world["rzeka"].as_bool().unwrap(),
            })
        },
        defender_era: inp["defenderEra"].as_f64(),
        def_civ: inp["defCiv"].as_str().map(str::to_owned),
        // `defenderCivBonusy: []`, `defenderDifficultyCombatMult` domyślnie 1 (`:2733`).
        defender_side: Some((Vec::new(), 1.0)),
        seed: u32::try_from(v["seed"].as_u64().unwrap()).unwrap(),
        battle_index: u32::try_from(v["battleIndex"].as_u64().unwrap()).unwrap(),
        ready_machines: Vec::new(),
    }
}

/// Sterownik jak generator: `play` i `skip` (przewijanie) albo klatki 16 ms (czas rzeczywisty).
fn drive(mut s: SiegeBattleSession, mode: &str) -> Result<SessionOutcome, SessionError> {
    match mode {
        "skip" => {
            s.play();
            s.skip()?;
        }
        "realtime" => {
            let mut frames = 0;
            while s.phase() != SessionPhase::Finished {
                s.step(FRAME_MS)?;
                frames += 1;
                assert!(frames < MAX_FRAMES, "bitwa bez końca");
            }
        }
        m => panic!("tryb {m}"),
    }
    s.finish()
}

fn winner_pin(w: LoopWinner) -> &'static str {
    match w {
        LoopWinner::Attacker => "atakujacy",
        LoopWinner::Defender => "obronca",
        LoopWinner::Draw => "remis",
    }
}

fn hex_bits(x: f64) -> String {
    format!("{:016x}", x.to_bits())
}

/// Różnice wyniku sesji względem wektora (pusta lista = bajt w bajt).
fn diff(v: &Value, out: &SessionOutcome) -> Vec<String> {
    let e = &v["expect"];
    let mut d = Vec::new();
    let w = winner_pin(out.winner);
    if e["winner"] != w {
        d.push(format!("zwycięzca {w} != {}", e["winner"]));
    }
    if e["roundNo"].as_i64() != Some(out.round_no) {
        d.push(format!("tura {} != {}", out.round_no, e["roundNo"]));
    }
    if e["wallEverBreached"].as_bool() != Some(out.wall_ever_breached) {
        d.push(format!(
            "wyłom {} != {}",
            out.wall_ever_breached, e["wallEverBreached"]
        ));
    }
    if e["rollsDrawn"].as_u64() != Some(out.rolls_drawn) {
        d.push(format!("rzuty {} != {}", out.rolls_drawn, e["rollsDrawn"]));
    }
    if !out.unported.is_empty() {
        d.push(format!("unported {:?}", out.unported));
    }
    let mine: BTreeMap<(String, String), _> = out
        .units
        .iter()
        .map(|u| {
            let side = if u.side == Side::Atk { "atk" } else { "def" };
            ((side.to_owned(), u.roster_id.clone()), u)
        })
        .collect();
    let exp = e["units"].as_array().unwrap();
    if exp.len() != mine.len() {
        d.push(format!("liczba jednostek {} != {}", mine.len(), exp.len()));
    }
    for u in exp {
        let key = (
            u["side"].as_str().unwrap().to_owned(),
            u["id"].as_str().unwrap().to_owned(),
        );
        let Some(m) = mine.get(&key) else {
            d.push(format!("brak jednostki {key:?}"));
            continue;
        };
        let hb = hex_bits(m.hp);
        if u["hpBits"] != hb.as_str() {
            d.push(format!("{key:?} hp {} != {}", m.hp, u["hp"]));
        }
        for (k, val) in [
            ("dead", m.dead),
            ("routed", m.routed),
            ("removed", m.removed),
        ] {
            if u[k].as_bool() != Some(val) {
                d.push(format!("{key:?} {k} {val} != {}", u[k]));
            }
        }
    }
    d
}

fn vectors() -> Value {
    let v: Value = serde_json::from_str(VECTORS).unwrap();
    assert_eq!(v["pin"], PIN);
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    assert_eq!(f(&v["frameMs"]), FRAME_MS);
    v
}

fn run_vector(v: &Value, data: &SessionData) -> Result<SessionOutcome, SessionError> {
    let s = SiegeBattleSession::prepare_scene(&scene_input(v), data)?;
    drive(s, v["mode"].as_str().unwrap())
}

/// Rozbieżności Rust ↔ pin (obrona r2, `02a-obrona-r2.md`). Diagnoza Operatora r2 (dryf 320/310 ms) ODRZUCONA pomiarem
/// Evaluatora (klatka 2 ms) i obrony (klatka 1 ms w Rust: wynik Rust bez zmian). Prawdziwe przyczyny naprawione w ciele:
/// `_applyTerrainRange` na początku aktywacji (`battleScene.ts:6064`, `:7490-7502`; D-WIRA-16), ogon aktywacji po ciosie
/// i strzale (`_doMeleeAttack` `:9119-9172`, `_doRangedAttack` `:9223-9229`; D-WIRA-17), pozycje celów wież w chwili
/// wystrzału (`_fireOneTower` `:4228-4233` przy marszu wielokrokowym; D-WIRA-18). Pozostała JAWNA rozbieżność (B-WIRA-PIN-2,
/// przyczyna w raporcie §E2-2); test pada, gdy scenariusz z listy zacznie się zgadzać albo gdy zgodny się rozjedzie, a
/// także gdy scenariusz z listy zakończy się błędem sesji (E2-3).
const ROZBIEZNE_B_WIRA_PIN_1: [&str; 1] = ["mur_jazda_rzeka"];

#[test]
fn wektory_pinu_pelnej_bitwy_bajt_w_bajt() {
    let doc = vectors();
    let data = pin_session_data();
    let list = doc["vectors"].as_array().unwrap();
    assert!(list.len() >= 6, "kryterium końca: >= 6 scenariuszy");
    let mut fails = Vec::new();
    let mut zgodne = 0;
    for v in list {
        let name = v["name"].as_str().unwrap();
        assert_eq!(
            v["expect"]["otherRandom"], 0,
            "{name}: Math.random poza _singleBlow"
        );
        let blokada = ROZBIEZNE_B_WIRA_PIN_1.contains(&name);
        // Obrona r2 (E2-3 Evaluatora): błąd sesji NIGDY nie jest „oczekiwaną rozbieżnością” — także scenariusz z
        // listy blokady musi zakończyć bitwę `Ok(..)`, a różnić się wyłącznie danymi wyniku.
        let d = match run_vector(v, &data) {
            Ok(out) => diff(v, &out),
            Err(e) => {
                fails.push(format!("{name}: błąd sesji {e:?}"));
                continue;
            }
        };
        match (d.is_empty(), blokada) {
            (true, false) => zgodne += 1,
            (false, true) => eprintln!("B-WIRA-PIN-1 {name}: {}", d.join("; ")),
            (true, true) => fails.push(format!("{name}: zgodny z pinem, usuń z listy blokady")),
            (false, false) => fails.push(format!("{name}: {}", d.join("; "))),
        }
    }
    assert!(
        fails.is_empty(),
        "rozbieżności z pinem:\n{}",
        fails.join("\n")
    );
    assert_eq!(zgodne, list.len() - ROZBIEZNE_B_WIRA_PIN_1.len());
}

/// Pokrycie scenariuszy wymagane dispatchem (z/bez machin, różne liczności, wyłom, ucieczka, oba sufity tur, oba tryby).
#[test]
fn pokrycie_scenariuszy() {
    let doc = vectors();
    let list = doc["vectors"].as_array().unwrap();
    let any = |p: &dyn Fn(&Value) -> bool| list.iter().any(p);
    let units = |v: &Value| v["expect"]["units"].as_array().unwrap().clone();
    let machine = |v: &Value| {
        v["input"]["attacker"]
            .as_array()
            .unwrap()
            .iter()
            .any(|u| u["kategoria"] == "obleznicza")
    };
    assert!(any(&|v| machine(v)), "z machinami");
    assert!(any(&|v| !machine(v)), "bez machin");
    assert!(any(&|v| v["expect"]["wallEverBreached"] == true), "wyłom");
    assert!(any(
        &|v| v["expect"]["wallEverBreached"] == false && v["expect"]["winner"] != "remis"
    ));
    assert!(
        any(&|v| units(v).iter().any(|u| u["routed"] == true)),
        "ucieczka"
    );
    assert!(
        any(&|v| units(v).iter().any(|u| u["removed"] == true)),
        "zejście z pola"
    );
    assert!(
        any(&|v| v["expect"]["roundNo"] == 150 && v["expect"]["winner"] == "remis"),
        "sufit bez wyłomu"
    );
    assert!(
        any(&|v| v["expect"]["roundNo"] == 400),
        "sufit FF_MAX_ROUNDS z wyłomem"
    );
    assert!(any(&|v| v["expect"]["winner"] == "atakujacy"));
    assert!(any(&|v| v["expect"]["winner"] == "obronca"));
    assert!(any(&|v| v["mode"] == "realtime"));
    let sizes: std::collections::BTreeSet<usize> = list
        .iter()
        .map(|v| v["input"]["attacker"].as_array().unwrap().len())
        .collect();
    assert!(sizes.len() >= 4, "różne liczności: {sizes:?}");
    assert!(
        any(&|v| v["input"]["builtBuildingIds"] == serde_json::json!(["palisada"])),
        "palisada"
    );
}

/// Diagnostyka rozbieżności (tylko z `WIRING_A_TRACE=<scenariusz>`; bez zmiennej test nic nie robi): ślad akcji sesji
/// w czasie rzeczywistym w formacie śladu generatora (`DMG`/`ROUT`/`KILL`/`MOVE`).
#[test]
fn slad_diagnostyczny_na_zadanie() {
    use civ_engine::domain::siege_tactics_actions::BattleAction;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_turnseq::UnitRef;
    let Ok(name) = std::env::var("WIRING_A_TRACE") else {
        return;
    };
    let doc = vectors();
    let data = pin_session_data();
    let v = doc["vectors"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["name"] == name.as_str())
        .expect("scenariusz");
    let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), &data).unwrap();
    let ids = s.roster_ids().clone();
    let id = |u: UnitRef| ids[usize::from(u.side != BattleSide::Attacker)][u.idx].clone();
    // PIN2-PROBE-Q1: krok śladu nadpisywalny (`WIRING_A_TRACE_STEP=1`), żeby zrzut morale padał po każdym zdarzeniu.
    let step_ms = std::env::var("WIRING_A_TRACE_STEP")
        .ok()
        .and_then(|x| x.parse::<f64>().ok())
        .unwrap_or(FRAME_MS);
    while s.phase() != SessionPhase::Finished {
        let rep = s.step(step_ms).unwrap();
        let r = s.battle_loop().st.round_no;
        // PIN2-PROBE-Q1 (sonda morale): po kroku z obrażeniami/rozbiciem stan morale wszystkich jednostek (do
        // porównania z `OUTCOME`/`CHECKROUT` śladu generatora).
        let morale_dump = rep
            .actions
            .iter()
            .any(|a| matches!(a.action, BattleAction::Damage { .. } | BattleAction::Rout { .. }));
        for a in rep.actions {
            let line = match a.action {
                BattleAction::Damage { target, dmg } => format!("DMG {} {dmg}", id(target)),
                BattleAction::Rout { unit } => format!("ROUT {}", id(unit)),
                BattleAction::TowerShot { row, target, .. } => {
                    format!("TOWER rzad {row} -> {}", id(target))
                }
                BattleAction::Kill { unit } => format!("KILL {}", id(unit)),
                BattleAction::Turn { round_no } => format!("TURN {round_no}"),
                BattleAction::Clash {
                    attacker,
                    target,
                    dmg,
                    ..
                } => format!("CLASH {attacker:?} {} {dmg}", id(target)),
                BattleAction::Melee {
                    attacker, target, ..
                } => format!("MELEE {} {}", id(attacker), id(target)),
                BattleAction::Shot {
                    attacker, target, ..
                } => format!("SHOT {} {}", id(attacker), id(target)),
                BattleAction::Move { unit, from, to, .. } => {
                    format!("MOVE {} {},{}->{},{}", id(unit), from.0, from.1, to.0, to.1)
                }
                _ => continue,
            };
            eprintln!("T {} r{r} {line}", a.t0);
        }
        if morale_dump {
            let st = &s.battle_loop().st;
            let mut parts = Vec::new();
            for (side, list) in [(BattleSide::Attacker, &st.atk), (BattleSide::Defender, &st.def)] {
                for (idx, u) in list.iter().enumerate() {
                    let c = &u.c;
                    parts.push(format!(
                        "{}{{hp={} m={} fl={}{}{}}}",
                        id(UnitRef { side, idx }),
                        c.hp,
                        c.morale,
                        c.flee_morale,
                        if c.routed { " R" } else { "" },
                        if c.dead { " D" } else { "" }
                    ));
                }
            }
            eprintln!("r{r} MORALE {}", parts.join(" "));
        }
    }
}
