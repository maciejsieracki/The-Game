//! R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1 (#417A, r2): wektory KROKU CIAŁA trybu ręcznego z WYKONANIA tekstu
//! pinu `07d2fbd72` dla rozkazów `hold` / `none` / `move` / `attack` / `attackMove`.
//!
//! Wektory: `p6_k5loop_wiring_a_pin_vectors/manual_body_step_vectors.json`, generowane przez `p6_k5loop_wiring_a_gen.mjs`
//! (`WIRING_A_MANUAL_BODY_STEPS=1`): scena pinu w trybie ręcznym (`_manualMode`), jedno wywołanie `_activateUnit(ru, done)`
//! (`battleScene.ts:6024-6112`, wejście do `_performPlayerOrder` `:6067-6069`, ciało `:18280-18428`), decyzja zapisana z
//! opakowań `_doMove` / `_doAttack`. Wejście sceny (`inputs`) ma format `vectors.json`, więc TEN test buduje TĘ SAMĄ scenę
//! produkcyjnym [`SiegeBattleSession::prepare_scene`] (pole bitwy, teren, rozstawienie, jednostki) i NADPISUJE stan z
//! migawki przypadku (pozycje, flagi `dead`/`fadingOut`/`routed`/`removed`, zajętość `occByKey`, amunicja, `formationRank`,
//! doktryna jednostki i grupy, `lastAutoMoveFrom`, strona gracza). Decyzje liczy produkcyjne ciało
//! ([`ProdBody::start`] -> `plan_manual_order` -> porty T3/T4/H3 z predykatami ciała: przejezdność z pola bitwy, zajętość,
//! `_compactAttackAllowsStep`, `_priorityScore`, `_canStrikeTargetFrom`), a porównanie z pinem obejmuje rodzaj akcji, pole
//! kroku, cel ciosu, `ru.playerOrder` po aktywacji, `lastAutoMoveFrom`, wpis grupy i pozycję. Wartości predykatów NIE są
//! kopiowane z pinu (jak w wektorach portów), tylko liczone przez Rust.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::battle_setup_terrain::WorldTerrainInput;
use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::city_towers::UnitRow;
use civ_engine::domain::player_order_move::PlayerOrder;
use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_battle_adapter::{
    stat_row_from_json, stat_rows_from_json, MilitiaParams,
};
use civ_engine::domain::siege_battle_adapter_body::TowerParams;
use civ_engine::domain::siege_battle_adapter_unit::{
    norm_counters, AdapterBattleUnit, StartingMoraleParams, UnitDefFallback,
};
use civ_engine::domain::siege_battle_session::{
    SceneInput, SessionData, SiegeBattleSession, TerrainRangeRow, DEF_ID_BASE,
};
use civ_engine::domain::siege_prod_manual::ManualRun;
use civ_engine::domain::siege_tactics_blow_env::TerrainRow;
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_step::DoctrineAction;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_inputs_unit::ToCombatUnitOpts;
use civ_engine::domain::siege_tactics_inputs_wall::MiastoWallParamValues;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody};
use civ_engine::domain::siege_tactics_turnseq::UnitRef;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/manual_body_step_vectors.json");
const PIN_DATA: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/pin_data.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const PIN_SHA256: &str = "3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d";

fn f(v: &Value) -> f64 {
    v.as_f64().unwrap_or_else(|| panic!("liczba: {v}"))
}

fn int(v: &Value) -> i64 {
    v.as_i64()
        .unwrap_or_else(|| panic!("liczba całkowita: {v}"))
}

fn pair(v: &Value) -> (i64, i64) {
    (int(&v[0]), int(&v[1]))
}

fn opt_pair(v: &Value) -> Option<(i64, i64)> {
    (!v.is_null()).then(|| pair(v))
}

/// Dane statyczne bitwy z danych pinu (jak `p6_k5loop_wiring_a_pin.rs`).
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

fn battle_unit(v: &Value, side: Side, owner_id: i64) -> AdapterBattleUnit {
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

fn scene_input(inp: &Value) -> SceneInput {
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
        defender_side: Some((Vec::new(), 1.0)),
        seed: 0,
        battle_index: 0,
        ready_machines: Vec::new(),
    }
}

fn vectors() -> Value {
    let v: Value = serde_json::from_str(VECTORS).expect("json");
    assert_eq!(v["pin"], PIN);
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    v
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        x => panic!("strona {x}"),
    }
}

fn six(side: BattleSide) -> usize {
    usize::from(side == BattleSide::Defender)
}

fn unit_doctrine(v: &Value) -> Option<GroupDoctrine> {
    v.as_str()
        .map(|s| GroupDoctrine::parse(s).unwrap_or_else(|| panic!("doktryna {s}")))
}

fn gate_doctrine(s: &str) -> GateDoctrine {
    match s {
        "defensive" => GateDoctrine::Defensive,
        "steady" => GateDoctrine::Steady,
        "aggressive" => GateDoctrine::Aggressive,
        "skirmish" => GateDoctrine::Skirmish,
        "manual" => GateDoctrine::Manual,
        x => panic!("doktryna grupy {x}"),
    }
}

/// Wynik rozkazu z jednej aktywacji, w jednostkach wektora.
#[derive(Debug, PartialEq)]
struct Outcome {
    kind: &'static str,
    step: Option<(i64, i64)>,
    attack: Option<usize>,
    order_after: String,
    last_auto_move_from: Option<(i64, i64)>,
    group_meta_after: BTreeSet<String>,
    pos: (i64, i64),
    refused: bool,
}

fn order_json(o: PlayerOrder, ids: &[Vec<String>; 2], actor_side: BattleSide) -> String {
    match o {
        PlayerOrder::None => "none".to_owned(),
        PlayerOrder::Hold => "hold".to_owned(),
        PlayerOrder::Move { col, row } => format!("move:{col},{row}"),
        PlayerOrder::AttackMove { col, row } => format!("attackMove:{col},{row}"),
        PlayerOrder::Attack { target_id } => {
            // Identyfikator `st` celu -> `bu.id` pinu (strona przeciwna).
            let opp = six(actor_side) ^ 1;
            let idx = if opp == 1 {
                target_id.checked_sub(DEF_ID_BASE)
            } else {
                Some(target_id)
            };
            let name = idx
                .and_then(|i| ids[opp].get(usize::try_from(i).unwrap_or(usize::MAX)))
                .cloned()
                .unwrap_or_else(|| format!("?{target_id}"));
            format!("attack:{name}")
        }
        other => format!("{other:?}"),
    }
}

fn expected_order(o: &Value) -> String {
    match o["type"].as_str().expect("type") {
        "none" => "none".to_owned(),
        "hold" => "hold".to_owned(),
        "move" => format!("move:{},{}", int(&o["col"]), int(&o["row"])),
        "attackMove" => format!("attackMove:{},{}", int(&o["col"]), int(&o["row"])),
        "attack" => format!("attack:{}", o["targetId"].as_str().expect("targetId")),
        x => panic!("rozkaz {x}"),
    }
}

/// Buduje scenę przypadku produkcyjną sesją, nadpisuje stan z migawki i wykonuje JEDNĄ aktywację jednostki w trybie
/// ręcznym. `mutate` pozwala testom mutacyjnym zmienić stan między ustawieniem a aktywacją.
fn run_case(c: &Value, inputs: &Value, data: &SessionData) -> Result<Outcome, String> {
    let mut s =
        SiegeBattleSession::prepare_scene(&scene_input(&inputs[c["base"].as_str().unwrap()]), data)
            .map_err(|e| format!("sesja: {e:?}"))?;
    let ids = s.roster_ids().clone();
    let lp = s.battle_loop_mut();
    let st = &mut lp.st;
    let env = &mut lp.env;
    let body: &mut ProdBody<_> = &mut env.body;
    let actor_side = side_of(c["side"].as_str().unwrap());
    let key = c["unit"].as_str().unwrap();
    let actor_name = key.split(':').nth(1).unwrap();
    let actor_ix = ids[six(actor_side)]
        .iter()
        .position(|n| n == actor_name)
        .ok_or("aktor spoza rosteru")?;
    let actor = UnitRef {
        side: actor_side,
        idx: actor_ix,
    };
    // Migawka jednostek (kolejność `this.atk` / `this.def` pinu == kolejność rosteru sesji).
    for (sk, side) in [("atk", BattleSide::Attacker), ("def", BattleSide::Defender)] {
        let list = c["units"][sk].as_array().expect("units");
        let names: Vec<&str> = list.iter().map(|u| u["id"].as_str().unwrap()).collect();
        let rost: Vec<&str> = ids[six(side)].iter().map(String::as_str).collect();
        if names != rost {
            return Err(format!("kolejność rosteru {names:?} != {rost:?}"));
        }
        let su = match side {
            BattleSide::Attacker => &mut st.atk,
            BattleSide::Defender => &mut st.def,
        };
        for (i, u) in list.iter().enumerate() {
            let pu = &mut body.units[six(side)][i];
            pu.activate.q = int(&u["q"]);
            pu.activate.r = int(&u["r"]);
            su[i].c.dead = u["dead"] == true;
            su[i].c.fading_out = u["fadingOut"] == true;
            su[i].c.routed = u["routed"] == true;
            su[i].c.removed = u["removed"] == true;
            let ranged = u["rangedBase"] == true;
            let ammo = u["ammo"] == true;
            pu.activate.can_shoot = ranged && ammo;
            // `ru.range` w chwili migawki (pin trzyma wartość po poprzednich `_applyTerrainRange`); aktora przelicza
            // oba kody na początku aktywacji.
            pu.activate.range = f(&u["range"]);
            body.ranged_base[six(side)][i] = ranged;
            body.ammo_left[six(side)][i] = if ammo { 10.0 } else { 0.0 };
            body.formation_rank[six(side)][i] = u["formationRank"].as_f64();
            let ds = &mut body.doctrine[six(side)][i];
            ds.unit_doctrine = unit_doctrine(&u["unitDoctrine"]);
            ds.group_id = u["groupId"].as_str().map(str::to_owned);
            ds.last_auto_move_from = opt_pair(&u["lastAutoMoveFrom"]);
        }
    }
    body.group_meta.clear();
    for g in c["groupMeta"].as_array().expect("groupMeta") {
        body.group_meta.insert(
            g[0].as_str().unwrap().to_owned(),
            GroupMeta {
                doctrine: gate_doctrine(g[1]["doctrine"].as_str().unwrap()),
                auto_play: g[1]["autoPlay"] == true,
            },
        );
    }
    // Zajętość `occByKey` (`atk:a3` -> UnitRef).
    let occ: Vec<((i64, i64), UnitRef)> = c["occ"]
        .as_array()
        .expect("occ")
        .iter()
        .map(|o| {
            let k = o[2].as_str().unwrap();
            let (sd, name) = k.split_once(':').unwrap();
            let side = side_of(sd);
            let idx = ids[six(side)].iter().position(|n| n == name).expect("occ");
            ((int(&o[0]), int(&o[1])), UnitRef { side, idx })
        })
        .collect();
    body.set_occupancy(occ);
    // Scena: tryb ręczny, bez muru (oblężenie ręczne = r3), blokada generała nieaktywna (część B).
    let player_side = side_of(c["playerSide"].as_str().unwrap());
    assert_eq!(player_side, actor_side, "aktor jest po stronie gracza");
    body.scene.manual_mode = true;
    if int(&c["wallCol"]) < 0 {
        body.scene.wall_col = -1;
        st.siege_wall_col = -1;
    } else {
        // Wariant z murem sceny: mur, kafle i bramę ma sesja (jak pin); wyłom (`wallEverBreached`) z migawki.
        assert_eq!(int(&c["wallCol"]), st.siege_wall_col, "kolumna muru sceny");
        body.wall_ever_breached = c["wallEverBreached"] == true;
        env.wall_ever_breached = body.wall_ever_breached;
    }
    st.manual_mode = true;
    st.player_side = player_side;
    body.enable_manual_exec(player_side);
    // Rozkaz gracza (`ru.playerOrder`), `target_id` = identyfikator `st` celu (nieznany = `u64::MAX`).
    let o = &c["order"];
    let opp = six(actor_side) ^ 1;
    let order = match o["type"].as_str().unwrap() {
        "hold" => PlayerOrder::Hold,
        "none" => PlayerOrder::None,
        "move" => PlayerOrder::Move {
            col: int(&o["col"]),
            row: int(&o["row"]),
        },
        "attackMove" => PlayerOrder::AttackMove {
            col: int(&o["col"]),
            row: int(&o["row"]),
        },
        "attack" => {
            let name = o["targetId"].as_str().unwrap();
            let id = ids[opp]
                .iter()
                .position(|n| n == name)
                .map_or(u64::MAX, |i| {
                    if opp == 1 {
                        DEF_ID_BASE + i as u64
                    } else {
                        i as u64
                    }
                });
            PlayerOrder::Attack { target_id: id }
        }
        x => panic!("rozkaz {x}"),
    };
    body.set_player_order(actor, order);
    let pos0 = (
        body.units[six(actor_side)][actor_ix].activate.q,
        body.units[six(actor_side)][actor_ix].activate.r,
    );
    body.set_now(1000.0);
    let before = body.manual.records.len();
    let _dur = body.start(actor, st);
    if body.manual.records.len() != before + 1 {
        return Err(format!(
            "brak decyzji rozkazu gracza (tagi {:?}, ślad {:?})",
            body.unported,
            body.trace.last()
        ));
    }
    let run = body.manual.records.last().expect("decyzja").run;
    // Callback końca kroku (`done()` po `_doMove`, pin: `cb` w `p >= 1`) = jeden zegar marszu krokowego; kolejne kroki
    // (`_schedule(STEP_GAP_MS)`) to osobne wywołania pinu i NIE są tu domykane.
    let timers = body.take_timers();
    let had_timer = !timers.is_empty();
    for (_, id) in timers {
        body.fire_timer(id, st);
    }
    let blows_before = body.blows.len();
    if matches!(run, ManualRun::Doctrine(_)) && !had_timer {
        body.complete(actor, st);
    }
    let pos = (
        body.units[six(actor_side)][actor_ix].activate.q,
        body.units[six(actor_side)][actor_ix].activate.r,
    );
    let (kind, step, attack) = match run {
        ManualRun::Done => ("done", None, None),
        ManualRun::Attack(t) => ("attack", None, Some(t)),
        // Odmowa bramki muru (`_doMove` `:8689-8693`): decyzja `move`, ale jednostka stoi.
        ManualRun::Move { .. } if pos == pos0 => ("done", None, None),
        ManualRun::Move { tile, .. } => ("move", Some(tile), None),
        ManualRun::Doctrine(_) => match body.doctrine_steps.last().map(|d| d.1) {
            Some(DoctrineAction::Done) | None => ("done", None, None),
            Some(DoctrineAction::Attack(t)) => ("attack", None, Some(t)),
            Some(
                DoctrineAction::AdvanceStep
                | DoctrineAction::MoveOrder { .. }
                | DoctrineAction::CavalryAction
                | DoctrineAction::RangedAction,
            ) => {
                if pos != pos0 {
                    ("move", Some(pos), None)
                } else if let Some(b) = body.blows.get(blows_before..).and_then(<[_]>::first) {
                    ("attack", None, Some(b.target.idx))
                } else {
                    ("done", None, None)
                }
            }
        },
        other => return Err(format!("nieoczekiwany bieg {other:?}")),
    };
    let order_after = order_json(body.player_order(actor), &ids, actor_side);
    Ok(Outcome {
        kind,
        step,
        attack,
        order_after,
        last_auto_move_from: body.doctrine[six(actor_side)][actor_ix].last_auto_move_from,
        group_meta_after: body.group_meta.keys().cloned().collect(),
        pos,
        refused: matches!(run, ManualRun::Move { .. }) && pos == pos0,
    })
}

fn expected(c: &Value) -> Outcome {
    let e = &c["expect"];
    let kind = match e["kind"].as_str().unwrap() {
        "done" => "done",
        "move" => "move",
        "attack" => "attack",
        x => panic!("kind {x}"),
    };
    Outcome {
        kind,
        step: opt_pair(&e["step"]),
        #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
        attack: e["attack"].as_i64().map(|x| x as usize),
        order_after: expected_order(&e["orderAfter"]),
        last_auto_move_from: opt_pair(&e["lastAutoMoveFrom"]),
        group_meta_after: e["groupMetaAfter"]
            .as_array()
            .unwrap()
            .iter()
            .map(|g| g.as_str().unwrap().to_owned())
            .collect(),
        pos: pair(&e["pos"]),
        refused: e["refused"] == true,
    }
}

fn diff(a: &Outcome, b: &Outcome) -> Vec<String> {
    let mut out = Vec::new();
    if a.kind != b.kind {
        out.push(format!("rodzaj {} != pin {}", a.kind, b.kind));
    }
    if a.step != b.step {
        out.push(format!("krok {:?} != pin {:?}", a.step, b.step));
    }
    if a.attack != b.attack {
        out.push(format!("cel {:?} != pin {:?}", a.attack, b.attack));
    }
    if a.order_after != b.order_after {
        out.push(format!(
            "rozkaz po {} != pin {}",
            a.order_after, b.order_after
        ));
    }
    if a.last_auto_move_from != b.last_auto_move_from {
        out.push(format!(
            "lastAutoMoveFrom {:?} != pin {:?}",
            a.last_auto_move_from, b.last_auto_move_from
        ));
    }
    if a.group_meta_after != b.group_meta_after {
        out.push(format!(
            "wpisy grup {:?} != pin {:?}",
            a.group_meta_after, b.group_meta_after
        ));
    }
    if a.refused != b.refused {
        out.push(format!(
            "odmowa bramki muru {} != pin {}",
            a.refused, b.refused
        ));
    }
    if a.pos != b.pos {
        out.push(format!("pozycja {:?} != pin {:?}", a.pos, b.pos));
    }
    out
}

/// Wszystkie przypadki równolegle (do 4 wątków, każdy z własnymi sesjami); wynik w kolejności przypadków.
fn run_all(cases: &[Value], inputs: &Value, data: &SessionData) -> Vec<Result<Outcome, String>> {
    let threads = std::thread::available_parallelism().map_or(2, |n| n.get().clamp(1, 4));
    let mut slots: Vec<Option<Result<Outcome, String>>> = (0..cases.len()).map(|_| None).collect();
    std::thread::scope(|sc| {
        let handles: Vec<_> = (0..threads)
            .map(|t| {
                sc.spawn(move || {
                    (t..cases.len())
                        .step_by(threads)
                        .map(|i| (i, run_case(&cases[i], inputs, data)))
                        .collect::<Vec<_>>()
                })
            })
            .collect();
        for h in handles {
            for (i, r) in h.join().expect("wątek") {
                slots[i] = Some(r);
            }
        }
    });
    slots.into_iter().map(|r| r.expect("wynik")).collect()
}

/// Podział przypadku na podprzyczyny pokrycia (kryterium 4 dispatchu).
fn tags_of(c: &Value) -> Vec<String> {
    let mut t = vec![format!(
        "{}/{}/{}",
        c["label"].as_str().unwrap(),
        c["side"].as_str().unwrap(),
        c["expect"]["kind"].as_str().unwrap()
    )];
    let ord = &c["order"];
    let opp = if c["side"] == "atk" { "def" } else { "atk" };
    if let Some(target) = ord["targetId"].as_str() {
        match c["units"][opp]
            .as_array()
            .unwrap()
            .iter()
            .find(|u| u["id"] == target)
        {
            None => t.push("attack/cel-nie-wrog".to_owned()),
            Some(u) => {
                for (flag, name) in [
                    ("dead", "dead"),
                    ("fadingOut", "fadingOut"),
                    ("routed", "routed"),
                    ("removed", "removed"),
                ] {
                    if u[flag] == true {
                        t.push(format!("attack/cel-{name}"));
                    }
                }
                let actor = c["units"][c["side"].as_str().unwrap()]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|a| {
                        c["unit"]
                            .as_str()
                            .unwrap()
                            .ends_with(a["id"].as_str().unwrap())
                    })
                    .unwrap();
                if u["q"] == actor["q"] && u["r"] == actor["r"] {
                    t.push("attack/cel-pozycja".to_owned());
                }
            }
        }
    }
    if ord["type"] == "attackMove" || ord["type"] == "move" {
        let actor = c["units"][c["side"].as_str().unwrap()]
            .as_array()
            .unwrap()
            .iter()
            .find(|a| {
                c["unit"]
                    .as_str()
                    .unwrap()
                    .ends_with(a["id"].as_str().unwrap())
            })
            .unwrap();
        if ord["col"] == actor["q"] && ord["row"] == actor["r"] {
            t.push(format!("{}/cel-pozycja", ord["type"].as_str().unwrap()));
        }
    }
    t
}

/// Wszystkie przypadki: ciało zgodne z pinem na każdym polu wyniku (0 rozbieżności) + progi pokrycia na podprzyczyny.
#[test]
fn tryb_reczny_ciala_zgodny_z_pinem_na_wektorach_kroku() {
    let v = vectors();
    let data = pin_session_data();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 600, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: BTreeMap<String, usize> = BTreeMap::new();
    // Każdy przypadek na ŚWIEŻEJ sesji (`prepare_scene` ~0,2 s w profilu dev): przypadki rozdzielone na wątki.
    let results = run_all(cases, &v["inputs"], &data);
    for (i, (c, res)) in cases.iter().zip(results).enumerate() {
        match res {
            Err(e) => fails.push(format!("#{i} {} {}: {e}", c["unit"], c["order"])),
            Ok(got) => {
                let d = diff(&got, &expected(c));
                if !d.is_empty() {
                    fails.push(format!(
                        "#{i} {} {} [{}]: {d:?}",
                        c["unit"], c["order"], c["label"]
                    ));
                }
            }
        }
        for t in tags_of(c) {
            *cov.entry(t).or_default() += 1;
        }
    }
    assert!(
        fails.is_empty(),
        "{} rozbieżności z {}, pierwsze: {:#?}",
        fails.len(),
        cases.len(),
        &fails[..fails.len().min(15)]
    );
    let at_least = |k: &str, n: usize| {
        let got = cov.get(k).copied().unwrap_or(0);
        assert!(got >= n, "pokrycie {k}: {got} < {n}; {cov:?}");
    };
    for label in ["hold", "none", "move", "attack", "attackMove"] {
        for side in ["atk", "def"] {
            let n: usize = cov
                .iter()
                .filter(|(k, _)| k.starts_with(&format!("{label}/{side}/")))
                .map(|(_, v)| *v)
                .sum();
            assert!(n >= 20, "pokrycie {label}/{side}: {n}");
        }
    }
    for kind in ["done", "move", "attack"] {
        for label in ["move", "attack", "attackMove", "none"] {
            let n: usize = cov
                .iter()
                .filter(|(k, _)| {
                    k.starts_with(&format!("{label}/")) && k.ends_with(&format!("/{kind}"))
                })
                .map(|(_, v)| *v)
                .sum();
            assert!(n >= 10, "pokrycie {label} -> {kind}: {n}");
        }
    }
    // Podprzyczyny rozkazu `attack` na nieczynny cel i cel = pozycja (warunek Obrony #416, kryterium 4).
    at_least("attack/cel-dead", 10);
    at_least("attack/cel-fadingOut", 5);
    at_least("attack/cel-routed", 5);
    at_least("attack/cel-removed", 5);
    at_least("attack/cel-nie-wrog", 10);
    at_least("attackMove/cel-pozycja", 10);
    at_least("move/cel-pozycja", 10);
}
