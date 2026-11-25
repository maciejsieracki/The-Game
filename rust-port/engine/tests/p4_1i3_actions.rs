//! P4-1I3 (`R-RUSTPORT-P4-1I3-BATTLE-ACTIONS`): akcje sceny bitwy taktycznej (`Vec<BattleActionDto>`) zgodne z TEKSTEM
//! pinu `07d2fbd72` (`gra/src/battle/battleScene.ts`).
//!
//! Wektory: `p4_1i3_actions_vectors/vectors.json` z `p4_1i3_actions_gen.mjs`. Generator WYKONUJE tekst pinu
//! (`_activateUnit` → `_doAttack` → `_doMeleeAttack` `:9096-9175` → `_singleBlow` `:8809-9011` → `_resolveBlowOutcome`
//! `:9019-9068`, `_pushClash` `:9550-9566`, `_startRout` `:9799-9825`, `_startFade` `:9927-9938`, `_fireOneTower`
//! `:4223-4270`, `_checkEnd` `:10153-10239`, `_finishDraw` `:9467-9478`, `_ffRoundCapResult` `:9485-9497`) i przechwytuje
//! wywołania sceny z czasem `_now()`: zwrot (`rotation.y`), start lunge (`_raf`), `this.log.push`, `_spawnDamageLabel`,
//! `_pushClash`, `_sfxRout`, `_sfxDeath`, `projectiles.push`, `_showEndScreen`.
//!
//! Porównanie: pełna sekwencja akcji (rodzaj, czas, jednostki, liczby, teksty bajt w bajt) w kanonicznym zapisie
//! [`enc`] (ten sam w generatorze, `enc(a)`):
//! - (1) cios + kontratak: [`ProdBody`] wywoływany jak przez [`SiegeLoop`] (`set_now(T)` → `start`, `set_now(T + dur)` →
//!   `complete`, `dur` = `BLOW_HIT_T`), akcje odbierane [`LoopBody::take_actions`];
//! - (2) strzał wieży: pełny [`SiegeLoop`] (oblężenie, wieża na wierszu wektora), okno od logu wystrzału do lądowania;
//! - (3) koniec: [`end_check_order`] + [`check_end_logs`] oraz [`round_cap_verdict`] + [`ff_round_cap_logs`].
//!
//! Wektor z `plik:linia` pinu: patrz komentarze testów. Mutacje wymagane dispatchem (pominięcie kontrataku, zamiana
//! kolejności cios/kontratak, `toFixed(1)`) dają FAIL testów `zgodnosc_*` (wyniki w raporcie rundy).

use std::collections::BTreeSet;

use civ_engine::domain::siege_no_breach::round_cap_verdict;
use civ_engine::domain::siege_tactics_actions::{
    check_end_logs, ff_round_cap_logs, js_num, ActionError, Actor, BattleAction, EndLogInput,
    TimedAction, BLOW_HIT_T,
};
use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_blow::{ClashTag, DefenderState, HitArc, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_endcheck::{end_check_order, EndCheckInput, EndCheckOutcome};
use civ_engine::domain::siege_tactics_fastforward::BATTLE_FRAME_WALL_MS;
use civ_engine::domain::siege_tactics_loop::{
    frame_sched, neutral_tower_shot_template, LoopBody, LoopTimer, LoopWinner, ProdBody, ProdUnit,
    SiegeEnv, SiegeLoop, TOWER_FLY_MS,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::BattleActionKindDto;
use serde_json::Value;

const VECTORS: &str = include_str!("p4_1i3_actions_vectors/vectors.json");
/// Strażniki fragmentów pinu (generator przerywa przy zmianie tekstu).
const ACTIONS_SHA256: &str = "07ee4ff453a537c9b89ff15aaa0062ec1772ca37afe1a85bb16afb1c242c2cf5";
const BLOW_SHA256: &str = "b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526";
const OUTCOME_SHA256: &str = "6cc2b1e08bcee451d42d8d022c446c6ef42f8e4d045087dff5a653d7a09f737c";
const COUNTER_SHA256: &str = "3913ba4050eaa30429418fade9b1a2b2adc374f1abe1a65f9291c96568e83ce7";
const FACING_SHA256: &str = "6d4858eded6e566c91a2874b30a5eabff0080b477bbf29c02a1a67f69493eae3";

fn load() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn num(v: &Value) -> f64 {
    v.as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("liczba w wektorze")
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("strona {other}"),
    }
}

fn arc_of(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("kierunek {other}"),
    }
}

fn key(u: UnitRef) -> String {
    match u.side {
        BattleSide::Attacker => format!("atk{}", u.idx),
        BattleSide::Defender => format!("def{}", u.idx),
    }
}

/// Kanoniczny zapis akcji (lustro `enc(a)` generatora); liczby jak `String(x)` w JS.
fn enc(a: &TimedAction) -> String {
    let t = js_num(a.t0);
    match &a.action {
        BattleAction::Turn { round_no } => format!("{t} turn {round_no}"),
        BattleAction::Facing { unit, dir } => format!("{t} facing {} {}", key(*unit), js_num(*dir)),
        BattleAction::Melee {
            attacker,
            target,
            hit_at,
        } => format!(
            "{t} melee {} {} {}",
            key(*attacker),
            key(*target),
            js_num(*hit_at)
        ),
        BattleAction::Log { text } => format!("{t} log {text}"),
        BattleAction::Damage { target, dmg } => {
            format!("{t} damage {} {}", key(*target), js_num(*dmg))
        }
        BattleAction::Clash {
            attacker,
            target,
            dmg,
            tag,
            text,
        } => {
            let a = match attacker {
                Actor::Unit(u) => key(*u),
                Actor::Tower(row) => format!("wieza:{row}"),
            };
            let tag = match tag {
                ClashTag::Plain => "plain",
                ClashTag::Padl => "padl",
                ClashTag::Rout => "rout",
            };
            format!(
                "{t} clash {a} {} {} {tag} {text}",
                key(*target),
                js_num(*dmg)
            )
        }
        BattleAction::Rout { unit } => format!("{t} rout {}", key(*unit)),
        BattleAction::Kill { unit } => format!("{t} kill {}", key(*unit)),
        // K5LOOP-CLOSE r2 (D-K5C-r2-2): mechaniczne ramię dla nowego wariantu `Move`; scenariusze tego testu nie
        // ruszają jednostek (ciało bez `MoveTerrain`), więc generator nie ma odpowiednika i ramię nie występuje.
        BattleAction::Move {
            unit,
            from,
            to,
            arrive_at,
        } => format!(
            "{t} move {} {},{} {},{} {}",
            key(*unit),
            from.0,
            from.1,
            to.0,
            to.1,
            js_num(*arrive_at)
        ),
        // K5LOOP-CLOSE r3: mechaniczne ramię dla nowego wariantu `Shot` (strzał jednostki); scenariusze tego testu nie
        // mają strzelców (`can_shoot = false`), więc ramię nie występuje w danych.
        BattleAction::Shot {
            attacker,
            target,
            land_at,
        } => format!(
            "{t} shot {} {} {}",
            key(*attacker),
            key(*target),
            js_num(*land_at)
        ),
        // K5LOOP-CLOSE r4: mechaniczne ramiona dla nowych wariantów `Leave` (ucieczka z pola) i `Shaken` (ripple
        // `_shakeAlliesOnLoss`); scenariusze tego testu nie mają danych terenu, więc ucieczka nie jest wykonywana
        // (tag `ucieczka-routed`) i ramiona nie występują w danych.
        BattleAction::Leave { unit } => format!("{t} leave {}", key(*unit)),
        BattleAction::Shaken {
            unit,
            fallen,
            morale,
        } => format!(
            "{t} shaken {} {} {}",
            key(*unit),
            key(*fallen),
            js_num(*morale)
        ),
        // K5LOOP-SIEGE-ATK-A (T2a): mechaniczne ramię dla nowego wariantu `ClimbWall` (wejście na mur od wieży
        // oblężniczej); scenariusze tego testu nie mają wież atakującego przy murze (`tower_at_wall_rows` puste), więc
        // ramię nie występuje w danych.
        BattleAction::ClimbWall { unit, from, to } => format!(
            "{t} climbWall {} {},{} {},{}",
            key(*unit),
            from.0,
            from.1,
            to.0,
            to.1
        ),
        // K5LOOP-SIEGE-ATK-B (T2b): mechaniczne ramiona dla nowych wariantów muru i bramy (`Boulder`, `WallDamage`,
        // `Ram`, `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `LeaveField`); scenariusze tego testu nie
        // mają katapult ani taranów atakującego przy murze, więc ramiona nie występują w danych.
        BattleAction::Boulder { unit, row, land_at } => {
            format!("{t} boulder {} {row} {}", key(*unit), js_num(*land_at))
        }
        BattleAction::WallDamage { row, dmg, hp_after } => {
            format!(
                "{t} wallDamage {row} {} {}",
                js_num(*dmg),
                js_num(*hp_after)
            )
        }
        BattleAction::Ram { unit, until } => format!("{t} ram {} {}", key(*unit), js_num(*until)),
        BattleAction::GateDamage { dmg, hp_after } => {
            format!("{t} gateDamage {} {}", js_num(*dmg), js_num(*hp_after))
        }
        BattleAction::WallBreach { row } => format!("{t} wallBreach {row}"),
        BattleAction::GateBreach => format!("{t} gateBreach"),
        BattleAction::TowerDestroyed { row } => format!("{t} towerDestroyed {row}"),
        BattleAction::LeaveField { unit, from, to } => format!(
            "{t} leaveField {} {},{} {},{}",
            key(*unit),
            from.0,
            from.1,
            to.0,
            to.1
        ),
        BattleAction::TowerShot {
            row,
            target,
            land_at,
        } => format!("{t} towerShot {row} {} {}", key(*target), js_num(*land_at)),
        BattleAction::End { winner } => {
            let w = match winner {
                LoopWinner::Attacker => "atakujacy",
                LoopWinner::Defender => "obronca",
                LoopWinner::Draw => "remis",
            };
            format!("{t} end {w}")
        }
    }
}

fn strs(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("lista")
        .iter()
        .map(|s| s.as_str().expect("tekst").to_string())
        .collect()
}

fn blow_input(t: &Value) -> FullBlowInput {
    FullBlowInput {
        ranged: false,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: num(&t["atk"]["weaponDamage"]),
            piercing: num(&t["atk"]["piercing"]),
            melee_attack: num(&t["atk"]["meleeAttack"]),
            missile_attack: Some(num(&t["atk"]["missileAttack"])),
            charge_bonus: num(&t["atk"]["chargeBonus"]),
            counter_typ: t["atk"]["counterTyp"].as_str().expect("typ").to_string(),
            typ_nazwa: t["atk"]["typNazwa"].as_str().expect("nazwa").to_string(),
        },
        atk_mods: AtkMods {
            atk: num(&t["atkMods"]["atk"]),
            ranged_atk: num(&t["atkMods"]["rangedAtk"]),
            uderzenie: num(&t["atkMods"]["uderzenie"]),
        },
        atk_diff_mult: num(&t["atkDiff"]),
        atk_mounted: b(&t["atkMounted"]),
        defender: DefenderCu {
            melee_defence: num(&t["def"]["meleeDefence"]),
            armor: num(&t["def"]["armor"]),
            kara_flanka: opt_num(&t["def"]["karaFlanka"]),
            kara_tyl: opt_num(&t["def"]["karaTyl"]),
        },
        def_mods: DefMods {
            obrona: num(&t["defMods"]["obrona"]),
            pancerz: num(&t["defMods"]["pancerz"]),
        },
        def_diff_mult: num(&t["defDiff"]),
        def_on_wall: b(&t["defOnWall"]),
        def_fortified_in_field: b(&t["defFortified"]),
        def_wall_civ_mult: num(&t["wallCiv"]),
        def_braces_against_charge: b(&t["defBraces"]),
        first_blow_of_pair: true,
        counter_mult: num(&t["ctr"]),
        env: BlowEnv {
            is_city_defense_battle: b(&t["isCity"]),
            wall_bonus_proc: num(&t["wallBonus"]),
            gated_terrain_multiplier: num(&t["gated"]),
            field_terrain_multiplier: num(&t["fieldMult"]),
            atk_tile_is_river: b(&t["atkRiver"]),
            river_row_exists: b(&t["riverRow"]),
            river_attack_mult: num(&t["riverMult"]),
            atk_on_ford: b(&t["atkFord"]),
            def_on_ford_raw: b(&t["defFord"]),
            shore_adjacent: b(&t["shore"]),
            brod_kara_obrona: num(&t["brodKara"]),
            brod_bonus_brzegu: num(&t["brodBrzeg"]),
            fortify_obrona_proc: num(&t["fortify"]),
        },
        defender_state: DefenderState {
            hp: 1.0,
            max_hp: num(&t["defMaxHp"]),
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    }
}

fn activate_unit_of(u: &Value) -> ActivateUnit {
    ActivateUnit {
        side_atk: u["side"] == "atk",
        q: u["q"].as_i64().expect("q"),
        r: u["r"].as_i64().expect("r"),
        dead: b(&u["dead"]),
        fading_out: b(&u["fadingOut"]),
        routed: b(&u["routed"]),
        never_rout: b(&u["neverRout"]),
        surround_applied: b(&u["surroundApplied"]),
        morale: num(&u["morale"]),
        flee_morale: num(&u["fleeMorale"]),
        terrain_defence_mult: num(&u["tdmOwn"]),
        range: 1.0,
        on_wall_walkway: b(&u["onWall"]),
        primary_ranged: false,
        mounted: b(&u["mounted"]),
        phalanx: b(&u["phalanx"]),
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: false,
        is_siege_unit: false,
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: false,
        doctrine_manual: false,
    }
}

fn combat_unit_of(u: &Value) -> CombatUnit {
    CombatUnit {
        hp: num(&u["hp"]),
        morale: num(&u["morale"]),
        flee_morale: num(&u["fleeMorale"]),
        move_left: num(&u["moveLeft"]),
        never_rout: b(&u["neverRout"]),
        dead: b(&u["dead"]),
        fading_out: b(&u["fadingOut"]),
        routed: b(&u["routed"]),
        removed: false,
        acted: false,
    }
}

fn empty_state(siege_wall_col: i64) -> TurnSeqState {
    TurnSeqState {
        atk: Vec::new(),
        def: Vec::new(),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 1,
        siege_wall_col,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    }
}

fn prod_unit(u: &Value, body_ms: f64) -> ProdUnit {
    ProdUnit {
        activate: activate_unit_of(u),
        melee_target: u["target"].as_u64().map(|t| t as usize),
        blow: if u["blow"].is_null() {
            None
        } else {
            Some(blow_input(&u["blow"]))
        },
        counter_blows: u["counters"]
            .as_array()
            .expect("counters")
            .iter()
            .map(blow_input)
            .collect(),
        body_ms,
        facing: num(&u["facing"]),
    }
}

/// Sekwencja ciosów: ciało jak w pętli, akcje po każdej aktywacji. `ff` = web `_ffActive` (obrona r1, zarzut 1).
fn run_melee_seq(seq: &Value, ff: bool) -> Vec<(f64, Vec<String>)> {
    let units = seq["units"].as_array().expect("units");
    let mut pus: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut st = empty_state(-1);
    for (k, u) in units.iter().enumerate() {
        let pu = prod_unit(u, BLOW_HIT_T);
        let su = SeqUnit {
            id: k as u64,
            c: combat_unit_of(u),
        };
        match side_of(u["side"].as_str().expect("side")) {
            BattleSide::Attacker => {
                pus[0].push(pu);
                st.atk.push(su);
            }
            BattleSide::Defender => {
                pus[1].push(pu);
                st.def.push(su);
            }
        }
    }
    let n_atk = st.atk.len();
    let rolls: Vec<f64> = seq["rolls"]
        .as_array()
        .expect("rolls")
        .iter()
        .map(num)
        .collect();
    let scene = ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: -1,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    };
    let mut body = ProdBody::new(pus, scene, SequenceRolls::new(rolls));
    body.set_ff_active(ff);
    for (k, u) in units.iter().enumerate() {
        let (ix, i) = if k < n_atk { (0, k) } else { (1, k - n_atk) };
        body.morale_max[ix][i] = num(&u["moraleMax"]);
    }
    let mut out = Vec::new();
    for (k, a) in seq["acts"].as_array().expect("acts").iter().enumerate() {
        let unit = UnitRef {
            side: side_of(a["side"].as_str().expect("side")),
            idx: a["idx"].as_u64().expect("idx") as usize,
        };
        st.finished = b(&a["finished"]);
        let t = 1000.0 * (k as f64 + 1.0);
        body.set_now(t);
        let dur = body.start(unit, &st);
        body.set_now(t + dur);
        body.complete(unit, &mut st);
        out.push((t, body.take_actions().iter().map(enc).collect()));
    }
    out
}

fn first_diff(got: &[String], want: &[String]) -> String {
    let n = got.len().max(want.len());
    for i in 0..n {
        if got.get(i) != want.get(i) {
            return format!(
                "poz. {i}: jest {:?}, oczekiwane {:?}",
                got.get(i),
                want.get(i)
            );
        }
    }
    "brak".into()
}

#[test]
fn straznik_fragmentow_pinu() {
    let v = load();
    assert_eq!(v["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    assert_eq!(v["actionsSha256"], ACTIONS_SHA256, "fragmenty akcji");
    assert_eq!(v["blowSha256"], BLOW_SHA256, "fragmenty ciosu");
    assert_eq!(v["outcomeSha256"], OUTCOME_SHA256, "efekty po ciosie");
    assert_eq!(v["counterSha256"], COUNTER_SHA256, "kontratak");
    assert_eq!(v["facingSha256"], FACING_SHA256, "facing");
    // `BLOW_HIT_T = 150` (`battleScene.ts:1021`).
    assert_eq!(v["blowHitT"].as_f64(), Some(BLOW_HIT_T));
}

/// (1) Cios i kontratak (`_doMeleeAttack` `:9096-9175`, `_singleBlow` `:8962`/`:8997`, `_resolveBlowOutcome`
/// `:9019-9068`, `_pushClash` `:9550-9566`, `_spawnDamageLabel` `:9125`/`:9142`, `_startRout` `:9799-9825`, `_startFade`
/// `:9927-9938`, `_updateFacing` `:8334-8341`): pełna sekwencja akcji każdej aktywacji.
#[test]
fn zgodnosc_akcji_ciosu_i_kontrataku_z_pinem() {
    let v = load();
    let seqs = v["melee"].as_array().expect("melee");
    assert!(seqs.len() >= 300, "za mało sekwencji: {}", seqs.len());
    let mut failures = Vec::new();
    let mut cov = [0usize; 10];
    for seq in seqs {
        let id = seq["id"].as_u64().expect("id");
        let got = run_melee_seq(seq, false);
        let expect = seq["expect"].as_array().expect("expect");
        assert_eq!(got.len(), expect.len());
        for (k, ((t, g), e)) in got.iter().zip(expect.iter()).enumerate() {
            assert_eq!(*t, e["t"].as_f64().expect("t"));
            let want = strs(&e["actions"]);
            if *g != want {
                failures.push(format!("#{id} act{k}: {}", first_diff(g, &want)));
            }
            for a in &want {
                let kinds = [
                    " melee ",
                    " chybia w ",
                    " trafia ",
                    " kill ",
                    " rout ",
                    " damage ",
                    " plain ",
                    " padl ",
                    "[FLANKA",
                    "[TYL",
                ];
                for (c, needle) in kinds.iter().enumerate() {
                    if a.contains(needle) {
                        cov[c] += 1;
                    }
                }
            }
        }
    }
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(8)]
    );
    // Pokrycie: każdy rodzaj akcji ciosu wystąpił w wektorach (inaczej mutacje nie byłyby wykrywalne).
    let names = [
        "melee",
        "pudło",
        "trafienie",
        "kill",
        "rout",
        "damage",
        "clash plain",
        "clash padl",
        "flanka",
        "tył",
    ];
    for (c, n) in names.iter().enumerate() {
        assert!(cov[c] >= 10, "pokrycie {n}: {}", cov[c]);
    }
}

/// (1b) Kontrataki: aktywacje z dwoma ciosami (log atakującego, potem zwrot obrońcy i jego log) są w wektorach;
/// kolejność cios → kontratak jest częścią porównania wyżej.
#[test]
fn wektory_zawieraja_kontrataki_po_ciosie() {
    let v = load();
    let mut both = 0usize;
    for seq in v["melee"].as_array().expect("melee") {
        for e in seq["expect"].as_array().expect("expect") {
            let a = strs(&e["actions"]);
            let blows: Vec<usize> = a
                .iter()
                .enumerate()
                .filter(|(_, s)| s.contains(" trafia ") || s.contains(" chybia w "))
                .map(|(i, _)| i)
                .collect();
            if blows.len() == 2 {
                // Między ciosem a kontratakiem: zwrot obrońcy (`:9137-9138`).
                assert!(
                    a[blows[0]..blows[1]].iter().any(|s| s.contains(" facing ")),
                    "brak zwrotu przed kontratakiem: {a:?}"
                );
                both += 1;
            }
        }
    }
    assert!(both >= 100, "za mało kontrataków: {both}");
}

/// Ciało testowe pętli wieży: [`ProdBody`] z przełącznikiem, czy sterownik może włączyć tryb przewijania
/// (`honour_ff = false` modeluje sterownik bez przewijania, web `_ffActive = false`; jedynym sterownikiem czasu
/// [`SiegeLoop`] jest dziś przewijanie, więc tylko tak da się porównać wektory bez FF przez pełną pętlę).
struct TowerBody {
    inner: ProdBody<SequenceRolls>,
    honour_ff: bool,
}

impl LoopBody for TowerBody {
    fn start(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64 {
        self.inner.start(unit, st)
    }
    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState) {
        self.inner.complete(unit, st);
    }
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        self.inner.unit_cell(unit)
    }
    fn tower_blow(&mut self, tmpl: &FullBlowInput, target: usize, st: &mut TurnSeqState) {
        self.inner.tower_blow(tmpl, target, st);
    }
    fn set_now(&mut self, v_now: f64) {
        self.inner.set_now(v_now);
    }
    fn set_tower_row(&mut self, row: i64) {
        self.inner.set_tower_row(row);
    }
    fn set_ff_active(&mut self, ff_active: bool) {
        if self.honour_ff {
            self.inner.set_ff_active(ff_active);
        }
    }
    fn take_actions(&mut self) -> Vec<TimedAction> {
        self.inner.take_actions()
    }
    fn unit_name(&self, unit: UnitRef) -> String {
        self.inner.unit_name(unit)
    }
}

fn tower_loop(tw: &Value, wall_col: i64, honour_ff: bool) -> SiegeLoop<TowerBody> {
    let units = tw["units"].as_array().expect("units");
    let mut pus: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut st = empty_state(wall_col);
    st.round_no = 0;
    for (k, u) in units.iter().enumerate() {
        // Atakujący pod murem nie zadaje ciosów (ciało w oblężeniu: ścieżka nieportowana `oblezenie`).
        pus[0].push(ProdUnit {
            activate: activate_unit_of(u),
            melee_target: None,
            blow: None,
            counter_blows: Vec::new(),
            body_ms: BLOW_HIT_T,
            facing: num(&u["facing"]),
        });
        let mut c = combat_unit_of(u);
        // Morale nie wpływa na akcje trafienia wieży w silniku (skutki morale są nieportowane), a pełne morale
        // utrzymuje bitwę w toku podczas wystrzału.
        c.morale = 100.0;
        st.atk.push(SeqUnit { id: k as u64, c });
    }
    // Jeden obrońca za murem (bez wpływu na wieżę), żeby bitwa nie kończyła się w pierwszym teście końca.
    let def_u = serde_json::json!({
        "side": "def", "q": wall_col + 1, "r": 9, "dead": false, "fadingOut": false, "routed": false,
        "neverRout": true, "surroundApplied": true, "morale": "100", "fleeMorale": "0", "tdmOwn": "1",
        "onWall": false, "mounted": false, "phalanx": false, "target": null, "blow": null, "counters": [],
        "facing": "3", "hp": "100", "moveLeft": "0"
    });
    pus[1].push(prod_unit(&def_u, BLOW_HIT_T));
    st.def.push(SeqUnit {
        id: 99,
        c: combat_unit_of(&def_u),
    });
    let mut rolls: Vec<f64> = tw["rolls"]
        .as_array()
        .expect("rolls")
        .iter()
        .map(num)
        .collect();
    // Wektor opisuje pierwszy wystrzał; kolejne tury (poza oknem porównania) dostają rzuty-pudła.
    rolls.extend(std::iter::repeat_n(0.9999999999, 400));
    let scene = ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    };
    let mut body = ProdBody::new(pus, scene, SequenceRolls::new(rolls));
    body.tower_shooter_nazwa = tw["nazwa"].as_str().expect("nazwa").to_string();
    let row = tw["row"].as_i64().expect("row");
    let tmpl = if tw["tmpl"].is_null() {
        neutral_tower_shot_template()
    } else {
        let mut t = blow_input(&tw["tmpl"]);
        t.ranged = true;
        t.hit_arc = arc_of(tw["tmpl"]["arc"].as_str().expect("arc"));
        t
    };
    let n = units.len();
    let env = SiegeEnv {
        body: TowerBody {
            inner: body,
            honour_ff,
        },
        tower_rows: vec![row],
        pending_tower_shots: Vec::new(),
        tower_range: num(&tw["range"]),
        tower_shot: Some(tmpl),
        wall_tile_rows: vec![row],
        wall_ever_breached: false,
        no_breach_cap: 1_000_000,
        move_points: [vec![0.0; n], vec![0.0; 1]],
        morale_max: [vec![100.0; n], vec![100.0; 1]],
    };
    SiegeLoop::new(st, env)
}

/// (2) Strzał wieży przez pełną pętlę (`_fireOneTower` `:4223-4270`: log `:4247`, pocisk `:4250-4261`, trafienie
/// `_singleBlow(shooter, target, true)` po `RANGED_FLY_MS` `:4262-4266`, `_pushClash` z `'wieza:' + row`): akcje od logu
/// wystrzału do lądowania pocisku; czas względny (wektor: wystrzał w 500 ms).
///
/// Obrona r1 (zarzut 1): dwa tryby. Przewijanie ([`SiegeLoop::resume`] włącza `_ffActive`) porównywane z `actionsFf`
/// (generator: `_ffActive = true`, `_spawnDamageLabel` kończy się na `:9943`, brak `damage`); sterownik bez
/// przewijania ([`TowerBody`] z `honour_ff = false`) porównywany z `actions` (z `damage` po trafieniu, `:4265`).
#[test]
fn zgodnosc_akcji_strzalu_wiezy_z_pinem() {
    for ff in [false, true] {
        tower_case(ff);
    }
}

fn tower_case(ff: bool) {
    let v = load();
    let wall_col = v["wallCol"].as_i64().expect("wallCol");
    let towers = v["towers"].as_array().expect("towers");
    assert!(towers.len() >= 150, "za mało scenariuszy wieży");
    let mut failures = Vec::new();
    let (mut shots, mut kills, mut misses, mut damages) = (0, 0, 0, 0);
    for tw in towers {
        let id = tw["id"].as_u64().expect("id");
        let mut lp = tower_loop(tw, wall_col, ff);
        assert!(!lp.env.body.inner.ff_active());
        let mut clock = VirtualClock::<LoopTimer>::new();
        lp.start(&mut clock);
        let _ = lp.resume(&mut clock, 60);
        assert_eq!(
            lp.env.body.inner.ff_active(),
            ff,
            "resume włącza przewijanie"
        );
        let acts = lp.actions().to_vec();
        let want = strs(&tw[if ff { "actionsFf" } else { "actions" }]);
        let start = acts.iter().position(|a| {
            matches!(&a.action, BattleAction::Log { text } if text.starts_with("Wieza strzelnicza"))
        });
        let got: Vec<String> = match start {
            None => Vec::new(),
            Some(s) => {
                let t_shot = acts[s].t0;
                let shift = num(&tw["t0"]) - t_shot;
                let mut out = Vec::new();
                let mut landing: Option<(f64, f64)> = None;
                let mut rout_facing_pending: Vec<UnitRef> = Vec::new();
                for (k, a) in acts[s..].iter().enumerate() {
                    // Okno: od logu wystrzału do następnej tury albo następnego wystrzału.
                    let next_shot = k > 0
                        && matches!(&a.action, BattleAction::Log { text } if text.starts_with("Wieza strzelnicza"));
                    if next_shot || matches!(a.action, BattleAction::Turn { .. }) {
                        break;
                    }
                    // K5LOOP-SIEGE-DEF (T1): syntetyczny obrońca za murem (poza wektorem pinu) działa gałęzią obrońcy
                    // w oblężeniu (`_updateFacing`, `:6123`; HOLD `:6225-6236`): jego zwrot nie należy do okna wieży.
                    let synthetic_def = matches!(&a.action, BattleAction::Facing { unit, .. } if unit.side == BattleSide::Defender);
                    // K5LOOP-SIEGE-ATK-A (T2a, D-INT-2): atakujący przy murze przechodzi przez maszynę `_activateUnit`
                    // (wcześniej tag `oblezenie` przed maszyną), więc jego aktywacja w pętli wykonuje `_updateFacing`
                    // (`:6123`). Generator pinu nie aktywuje jednostek w oknie wieży (woła wyłącznie `_fireOneTower`),
                    // więc taki zwrot nie należy do okna. Zwrot z `_startRout` (`:9818`) celu trafionego przez wieżę
                    // NALEŻY do okna: jest pierwszym `Facing` tej jednostki po jej `Rout` i zostaje.
                    if let BattleAction::Rout { unit } = &a.action {
                        rout_facing_pending.push(*unit);
                    }
                    let activation_atk_facing = match &a.action {
                        BattleAction::Facing { unit, .. } if unit.side == BattleSide::Attacker => {
                            match rout_facing_pending.iter().position(|u| u == unit) {
                                Some(p) => {
                                    rout_facing_pending.remove(p);
                                    false
                                }
                                None => true,
                            }
                        }
                        _ => false,
                    };
                    let skip = synthetic_def
                        || activation_atk_facing
                        || matches!(&a.action, BattleAction::End { .. })
                        || matches!(&a.action, BattleAction::Log { text } if text.starts_with("==="));
                    if skip {
                        continue;
                    }
                    let mut moved = a.clone();
                    // Trafienie odpala `_drainTimers` w pierwszej klatce przewijania z `vNow >= landAt` (pin
                    // `:9616-9634`; krok klatki `BATTLE_FRAME_WALL_MS`); generator woła callback dokładnie w
                    // `landAt`. Czas akcji trafienia sprowadzany do `landAt` po sprawdzeniu, że mieści się w klatce.
                    // LANDAT-TOWER-BOULDER-Q1 (D-LTB-1): silnik niesie w `landAt` chwilę klatki trafienia
                    // (`t0 + frame_sched(16, RANGED_FLY_MS)` = `t0 + 384`); trafienie musi paść DOKŁADNIE w niej, a do
                    // porównania z generatorem (czas ciągły) `landAt` wraca do nominału `t0 + RANGED_FLY_MS`.
                    if let Some((land, grid)) = landing {
                        assert!(
                            a.t0 >= land && a.t0 < land + BATTLE_FRAME_WALL_MS,
                            "wieża #{id}: trafienie w {} poza klatką lądowania {land}",
                            a.t0
                        );
                        assert!(
                            a.t0 == grid,
                            "wieża #{id}: trafienie w {} != landAt {grid}",
                            a.t0
                        );
                        moved.t0 = land;
                    }
                    if let BattleAction::TowerShot { land_at, .. } = &a.action {
                        let grid = a.t0 + frame_sched(BATTLE_FRAME_WALL_MS, TOWER_FLY_MS);
                        assert!(
                            *land_at == grid,
                            "wieża #{id}: landAt {land_at} != klatka trafienia {grid}"
                        );
                        landing = Some((a.t0 + TOWER_FLY_MS, grid));
                    }
                    moved.t0 += shift;
                    if let BattleAction::TowerShot { land_at, .. } = &mut moved.action {
                        *land_at = a.t0 + TOWER_FLY_MS + shift;
                    }
                    out.push(enc(&moved));
                }
                out
            }
        };
        if got != want {
            failures.push(format!("wieża #{id}: {}", first_diff(&got, &want)));
        }
        shots += want.iter().filter(|s| s.contains(" towerShot ")).count();
        kills += want.iter().filter(|s| s.contains(" kill ")).count();
        misses += want.iter().filter(|s| s.contains(" chybia w ")).count();
        damages += want.iter().filter(|s| s.contains(" damage ")).count();
    }
    assert!(
        failures.is_empty(),
        "ff={ff}: {} rozbieżności, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(8)]
    );
    assert!(
        shots >= 80 && kills >= 5 && misses >= 20,
        "pokrycie wieży: {shots}/{kills}/{misses}"
    );
    if ff {
        assert_eq!(damages, 0, "FF: `_spawnDamageLabel` kończy się na `:9943`");
    } else {
        assert!(damages >= 20, "pokrycie damage wieży bez FF: {damages}");
    }
}

/// Obrona r1 (zarzut 1): `_spawnDamageLabel` (`battleScene.ts:9940-9943`) w trybie przewijania (`_ffActive`) nie tworzy
/// etykiety. Wektory `expectFf`: te same sekwencje ciosu/kontrataku wygenerowane z `_ffActive = true` (tekst linii
/// `:9943` wykonywany w generatorze). [`ProdBody`] z `set_ff_active(true)` daje dokładnie tę sekwencję (bez `Damage`,
/// reszta bez zmian); bez FF te same sekwencje mają `Damage` (czułość filtra).
#[test]
fn zgodnosc_akcji_ciosu_w_trybie_ff_z_pinem() {
    let v = load();
    let seqs: Vec<&Value> = v["melee"]
        .as_array()
        .expect("melee")
        .iter()
        .filter(|s| s.get("expectFf").is_some())
        .collect();
    assert!(seqs.len() >= 90, "za mało sekwencji FF: {}", seqs.len());
    let mut failures = Vec::new();
    let (mut melee, mut damage_no_ff) = (0usize, 0usize);
    for seq in &seqs {
        let id = seq["id"].as_u64().expect("id");
        let got = run_melee_seq(seq, true);
        let expect = seq["expectFf"].as_array().expect("expectFf");
        assert_eq!(got.len(), expect.len());
        for (k, ((t, g), e)) in got.iter().zip(expect.iter()).enumerate() {
            assert_eq!(*t, e["t"].as_f64().expect("t"));
            let want = strs(&e["actions"]);
            assert!(
                want.iter().all(|a| !a.contains(" damage ")),
                "#{id}: damage w FF"
            );
            melee += want.iter().filter(|a| a.contains(" melee ")).count();
            if *g != want {
                failures.push(format!("#{id} act{k} (FF): {}", first_diff(g, &want)));
            }
        }
        damage_no_ff += run_melee_seq(seq, false)
            .iter()
            .flat_map(|(_, a)| a.iter())
            .filter(|a| a.contains(" damage "))
            .count();
    }
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(8)]
    );
    assert!(melee >= 100, "pokrycie ciosów FF: {melee}");
    assert!(damage_no_ff >= 50, "czułość: damage bez FF: {damage_no_ff}");
}

/// (3) Koniec: `_checkEnd` (`:10153-10239`; linie `:10179`, `:10185`, `:10190`, `:10194`, `:10200-10203`, `:10229`),
/// `_finishDraw` (`:9471-9472`) i `_ffRoundCapResult` (`:9485-9497`): linie logu i zwycięzca.
#[test]
fn zgodnosc_logow_konca_z_pinem() {
    let v = load();
    let ends = v["ends"].as_array().expect("ends");
    assert!(ends.len() >= 200);
    let mut failures = Vec::new();
    for e in ends {
        let id = e["id"].as_u64().expect("id");
        let units = |s: &str| e[s].as_array().expect("units").clone();
        let alive = |us: &[Value]| {
            us.iter()
                .any(|u| !b(&u["dead"]) && !b(&u["fadingOut"]) && !b(&u["routed"]))
        };
        let (atk, def) = (units("atk"), units("def"));
        let hp = |us: &[Value]| us.iter().map(|u| num(&u["hp"])).collect::<Vec<f64>>();
        let (hp_a, hp_d) = (hp(&atk), hp(&def));
        let ratio_a = num(&e["ratioA"]);
        let ratio_d = num(&e["ratioD"]);
        let round_no = e["roundNo"].as_i64().expect("roundNo");
        let cap = e["noBreachCap"].as_i64().expect("cap");
        let siege = b(&e["siege"]);
        let breached = b(&e["breached"]);
        let t = 700.0;
        let mut got: Vec<TimedAction> = Vec::new();
        let mut push_all = |logs: Vec<String>, w: LoopWinner| {
            for text in logs {
                got.push(TimedAction {
                    t0: t,
                    action: BattleAction::Log { text },
                });
            }
            got.push(TimedAction {
                t0: t,
                action: BattleAction::End { winner: w },
            });
        };
        if b(&e["ff"]) {
            if let Some(vd) = round_cap_verdict(round_no, siege, breached, cap, ratio_a, ratio_d) {
                let w = match vd {
                    civ_engine::domain::siege_no_breach::RoundCapVerdict::Draw => LoopWinner::Draw,
                    civ_engine::domain::siege_no_breach::RoundCapVerdict::Defender => {
                        LoopWinner::Defender
                    }
                    civ_engine::domain::siege_no_breach::RoundCapVerdict::Attacker => {
                        LoopWinner::Attacker
                    }
                };
                push_all(ff_round_cap_logs(vd, cap), w);
            }
        } else {
            let total_dead = atk
                .iter()
                .chain(def.iter())
                .filter(|u| b(&u["dead"]))
                .count();
            let input = EndCheckInput {
                stalled: b(&e["stalled"]),
                alive_a: alive(&atk),
                alive_d: alive(&def),
                is_siege: siege,
                wall_ever_breached: breached,
                total_dead,
                ratio_a,
                ratio_d,
                ratio_a_at_cap: ratio_a,
                ratio_d_at_cap: ratio_d,
                round_no,
                no_breach_cap: cap,
                hp_a: &hp_a,
                hp_d: &hp_d,
            };
            let winner = match end_check_order(&input) {
                EndCheckOutcome::Continue => None,
                EndCheckOutcome::Draw => Some(LoopWinner::Draw),
                EndCheckOutcome::Ended(BattleSide::Attacker) => Some(LoopWinner::Attacker),
                EndCheckOutcome::Ended(BattleSide::Defender) => Some(LoopWinner::Defender),
            };
            let logs = check_end_logs(
                &EndLogInput {
                    stalled: input.stalled,
                    alive_a: input.alive_a,
                    alive_d: input.alive_d,
                    is_siege: siege,
                    wall_ever_breached: breached,
                    total_dead,
                    ratio_a,
                    ratio_d,
                    ratio_a_at_cap: ratio_a,
                    ratio_d_at_cap: ratio_d,
                    round_no,
                    no_breach_cap: cap,
                },
                winner,
            );
            if let Some(w) = winner {
                push_all(logs, w);
            } else {
                assert!(logs.is_empty());
            }
            assert_eq!(
                e["ended"].as_bool(),
                Some(winner.is_some()),
                "#{id}: _checkEnd() != wynik end_check_order"
            );
        }
        let got: Vec<String> = got.iter().map(enc).collect();
        let want = strs(&e["actions"]);
        if got != want {
            failures.push(format!("koniec #{id}: {}", first_diff(&got, &want)));
        }
    }
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(8)]
    );
    let all: Vec<String> = ends.iter().flat_map(|e| strs(&e["actions"])).collect();
    for needle in [
        "Morale armii ATAKUJACEGO",
        "Morale armii OBRONCY",
        "SZTURM ODPARTY (remis)",
        "PAT (przewijanie)",
        "zwyciestwo ATAKUJACEGO",
        "zwyciestwo OBRONCY",
        "end remis",
    ] {
        assert!(all.iter().any(|s| s.contains(needle)), "pokrycie: {needle}");
    }
}

/// Pętla: akcje tury i końca w kolejności zegara, konwersja na DTO z walidacją (`validate_actions`), `Turn` na początku
/// każdej tury, `End` jako ostatnia akcja zakończonej bitwy.
#[test]
fn petla_emituje_ture_wieze_i_koniec_jako_dto() {
    let v = load();
    let wall_col = v["wallCol"].as_i64().expect("wallCol");
    let tw = v["towers"]
        .as_array()
        .expect("towers")
        .iter()
        .find(|t| {
            strs(&t["actions"]).iter().any(|s| s.contains(" kill "))
                && t["units"].as_array().map(|u| u.len()) == Some(1)
        })
        .expect("scenariusz: jedyny atakujący ginie od wieży");
    let mut lp = tower_loop(tw, wall_col, true);
    let mut clock = VirtualClock::<LoopTimer>::new();
    lp.start(&mut clock);
    let _ = lp.resume(&mut clock, 200);
    // Obrona r1 (zarzut 1): przewijanie = brak `Damage` w strumieniu (`:9943`).
    assert!(!lp
        .actions()
        .iter()
        .any(|a| matches!(a.action, BattleAction::Damage { .. })));
    assert_eq!(lp.winner, Some(LoopWinner::Defender), "atakujący zginął");
    let dto = lp.actions_dto().expect("akcje jako DTO");
    assert!(matches!(
        dto[0].action,
        BattleActionKindDto::Turn { round_no: 1 }
    ));
    assert!(matches!(
        dto.last().map(|a| &a.action),
        Some(BattleActionKindDto::End { .. })
    ));
    let kill = dto
        .iter()
        .position(|a| matches!(a.action, BattleActionKindDto::Kill { .. }))
        .expect("kill");
    let end = dto.len() - 1;
    assert!(kill < end);
    assert!(
        dto.iter().any(|a| matches!(&a.action, BattleActionKindDto::Log { text } if text == "=== Koniec bitwy: zwyciestwo OBRONCY ===")),
        "linia końca `:10229`"
    );
    // Odbiór opróżnia kolejkę.
    let taken = lp.take_actions();
    assert_eq!(taken.len(), dto.len());
    assert!(lp.actions().is_empty());
}

/// Obrona r1 (zarzut 3): podpięcie [`SiegeLoop`] → `end_logs` (ponowny `end_check_snapshot` przy obsłudze `EndCheck`)
/// w pełnej pętli dla OBU stron załamania morale armii (`_checkEnd` `:10186-10195`, linia końca `:10229`). Teksty
/// oczekiwane pochodzą z wektorów pinu (`ends`, generator wykonuje `_checkEnd`), nie z kodu Rust.
#[test]
fn petla_logi_konca_morale_obu_stron_z_wektorow_pinu() {
    let v = load();
    let wall_col = v["wallCol"].as_i64().expect("wallCol");
    let pin_lines: Vec<String> = v["ends"]
        .as_array()
        .expect("ends")
        .iter()
        .flat_map(|e| strs(&e["actions"]))
        .map(|s| {
            s.split_once(" log ")
                .map(|(_, t)| t.to_string())
                .unwrap_or_default()
        })
        .collect();
    let pin_has = |text: &str| pin_lines.iter().any(|l| l == text);
    let tw = v["towers"]
        .as_array()
        .expect("towers")
        .iter()
        .find(|t| {
            t["units"].as_array().is_some_and(|us| {
                us.iter()
                    .all(|u| !b(&u["dead"]) && !b(&u["fadingOut"]) && !b(&u["routed"]))
            })
        })
        .expect("scenariusz: wszyscy atakujący w polu");
    for atk_breaks in [true, false] {
        let mut lp = tower_loop(tw, wall_col, true);
        // Morale 10/100 na stronie łamanej (ratio 0.1 < 0.25, `ARMY_MORALE_LOSS_THRESHOLD` `:1157`).
        let side = if atk_breaks {
            &mut lp.st.atk
        } else {
            &mut lp.st.def
        };
        for u in side.iter_mut() {
            u.c.morale = 10.0;
        }
        let mut clock = VirtualClock::<LoopTimer>::new();
        lp.start(&mut clock);
        let _ = lp.resume(&mut clock, 50);
        let (who, win, winner) = if atk_breaks {
            ("ATAKUJACEGO", "OBRONCY", LoopWinner::Defender)
        } else {
            ("OBRONCY", "ATAKUJACEGO", LoopWinner::Attacker)
        };
        assert_eq!(lp.winner, Some(winner), "zwycięzca po załamaniu {who}");
        let logs: Vec<String> = lp
            .actions()
            .iter()
            .filter_map(|a| match &a.action {
                BattleAction::Log { text } if text.starts_with("===") => Some(text.clone()),
                _ => None,
            })
            .collect();
        let morale =
            format!("=== Morale armii {who} zalamane (10% < 25%) -- armia w rozsypce! ===");
        let end = format!("=== Koniec bitwy: zwyciestwo {win} ===");
        assert!(pin_has(&morale), "wektory pinu nie zawierają: {morale}");
        assert!(pin_has(&end), "wektory pinu nie zawierają: {end}");
        assert_eq!(logs, vec![morale, end], "logi końca pętli ({who})");
        assert!(matches!(
            lp.actions().last().map(|a| &a.action),
            Some(BattleAction::End { winner: w }) if *w == winner
        ));
    }
}

/// Obrona r1 (zarzut 6): akcje adresują jednostki samym `UnitId` (bez strony), a walidacja `Melee` porównuje
/// `attacker != target` po id; zdublowane id w rosterze pętli (atakujący i obrońca z tym samym id) jest więc błędem
/// producenta [`ActionError::DuplicateId`], jak `units (unique id)` w `BattleFrameDto::validate`.
#[test]
fn akcje_dto_wymagaja_unikalnych_id_w_bitwie() {
    let v = load();
    let wall_col = v["wallCol"].as_i64().expect("wallCol");
    let tw = &v["towers"][0];
    let mut lp = tower_loop(tw, wall_col, true);
    let mut clock = VirtualClock::<LoopTimer>::new();
    lp.start(&mut clock);
    assert!(
        lp.actions_dto().is_ok(),
        "unikalne id: konwersja przechodzi"
    );
    let dup = lp.st.atk[0].id;
    lp.st.def[0].id = dup;
    assert!(matches!(lp.actions_dto(), Err(ActionError::DuplicateId(id)) if id == dup));
}
