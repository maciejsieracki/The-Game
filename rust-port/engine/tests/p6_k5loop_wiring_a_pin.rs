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
    // PIN2-PROBE-Q1 (D-PIN2-2): wektor z własnym `frameMs` (krok przewijania pinu) tylko jako bliźniak granicy klatki.
    for x in v["vectors"].as_array().unwrap() {
        if !x["frameMs"].is_null() {
            assert!(
                x["name"].as_str().unwrap().ends_with("_klatka1") && x["mode"] == "skip",
                "frameMs poza bliźniakiem granicy klatki: {}",
                x["name"]
            );
        }
    }
    v
}

fn run_vector(v: &Value, data: &SessionData) -> Result<SessionOutcome, SessionError> {
    let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), data)?;
    // PIN3-DIVERGENCE-Q1 (D-PIN3-4): wektor z własnym krokiem przewijania pinu (`frameMs`, bliźniak `_klatka1`) liczony
    // w Rust przy TYM SAMYM kroku (`speedMul = frameMs / 16`): od D-PIN3-3 Rust ma fazę kroków animacji klatki jak pin, więc
    // porównanie bliźniaka z krokiem produkcyjnym 16 ms mieszałoby dwa modele klatki.
    if let Some(ms) = v["frameMs"].as_f64() {
        s.diag_set_speed_mul(ms / FRAME_MS)?;
    }
    drive(s, v["mode"].as_str().unwrap())
}

/// PIN3-DIVERGENCE-Q1 (tylko diagnostyka): krok przewijania Rust nadpisany zmienną `WIRING_A_RUST_FF_STEP=<ms>`
/// (`speedMul = ms / 16`, [`SiegeBattleSession::diag_set_speed_mul`]) — bliźniak `WIRING_A_FF_STEP` generatora, żeby
/// porównać Rust i pin przy TYM SAMYM kroku klatki. Bez zmiennej = krok produkcyjny 16 ms.
fn diag_speed(s: &mut SiegeBattleSession) {
    if let Some(ms) = std::env::var("WIRING_A_RUST_FF_STEP")
        .ok()
        .and_then(|x| x.parse::<f64>().ok())
    {
        s.diag_set_speed_mul(ms / FRAME_MS).unwrap();
    }
}

fn run_vector_diag(v: &Value, data: &SessionData) -> Result<SessionOutcome, SessionError> {
    let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), data)?;
    if let Some(ms) = v["frameMs"].as_f64() {
        s.diag_set_speed_mul(ms / FRAME_MS)?;
    }
    diag_speed(&mut s);
    drive(s, v["mode"].as_str().unwrap())
}

/// Rozbieżności Rust ↔ pin. B-WIRA-PIN-1 (5 scenariuszy) zamknięta w WIRING-A r2 (D-WIRA-16/17/18). B-WIRA-PIN-2
/// (`mur_jazda_rzeka`) po sondzie PIN2-PROBE-Q1 (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/01-operator-r1.md`):
/// (1) rozbicie `a0` w t. 86 przy klatce 2 ms było REALNĄ różnicą logiki Rust (`complete` przywracał morale sprzed
/// aktywacji i cofał trafienie wieży z marszu, t. 73) — naprawione (D-PIN2-1), od tej chwili Rust = pin @1 ms = pin @2 ms
/// = pin @0,25 ms bajt w bajt (wektor `mur_jazda_rzeka_klatka1`, test niżej); (2) jedyna pozostała różnica z wektorem
/// produkcyjnym @16 ms to remis czasowy klatki (t. 70: cios `localT >= 150` i pocisk wieży `due` +156 ms rozstrzygane w tej
/// samej klatce 16 ms, `_drainTimers` przed kolejką `_raf`, `battleScene.ts:9419`, `:9616-9634`) — temat FRAME-QUANT
/// (D-PIN2-2). Test pada, gdy scenariusz z listy zacznie się zgadzać, gdy zgodny się rozjedzie, gdy scenariusz z listy
/// skończy się błędem sesji (E2-3) albo gdy jego bliźniak `<nazwa>_klatka1` nie będzie zgodny bajt w bajt.
///
/// PIN3-DIVERGENCE-Q1: lista PUSTA. Po D-PIN3-1..3 (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1/
/// 01-operator-r1.md`) `mur_jazda_rzeka` jest zgodny z pinem bajt w bajt przy klatce produkcyjnej 16 ms (remis t. 70 —
/// cios `localT >= 150` w fazie `_raf` vs pocisk wieży w `_drainTimers` tej samej klatki — rozstrzyga D-PIN3-3), a
/// bliźniak `mur_jazda_rzeka_klatka1` przy kroku 1 ms (D-PIN3-4). Test pilnuje teraz obu jako zwykłych zgodnych wektorów.
const ROZBIEZNE_B_WIRA_PIN_2: [&str; 0] = [];

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
        let blokada = ROZBIEZNE_B_WIRA_PIN_2.contains(&name);
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
            (false, true) => eprintln!("B-WIRA-PIN-2 {name}: {}", d.join("; ")),
            (true, true) => fails.push(format!("{name}: zgodny z pinem, usuń z listy blokady")),
            (false, false) => fails.push(format!("{name}: {}", d.join("; "))),
        }
    }
    assert!(
        fails.is_empty(),
        "rozbieżności z pinem:\n{}",
        fails.join("\n")
    );
    assert_eq!(zgodne, list.len() - ROZBIEZNE_B_WIRA_PIN_2.len());
    // PIN2-PROBE-Q1 (D-PIN2-2): każdy scenariusz z jawną rozbieżnością @16 ms ma bliźniaka z granicą klatki (krok 1 ms),
    // zgodnego bajt w bajt (sprawdzony wyżej jako zwykły zgodny scenariusz) — rozbieżność jest WYŁĄCZNIE kwantyzacją klatki.
    // PIN3-DIVERGENCE-Q1: bliźniak `mur_jazda_rzeka_klatka1` zostaje (krok 1 ms, to samo wejście i ziarno co wektor 16 ms).
    for name in ROZBIEZNE_B_WIRA_PIN_2.iter().copied().chain(["mur_jazda_rzeka"]) {
        let twin = format!("{name}_klatka1");
        let v = list
            .iter()
            .find(|v| v["name"] == twin.as_str())
            .unwrap_or_else(|| panic!("brak bliźniaka {twin}"));
        assert_eq!(f(&v["frameMs"]), 1.0, "{twin}: krok przewijania pinu 1 ms");
        let base = list.iter().find(|v| v["name"] == *name).unwrap();
        assert_eq!(
            v["input"], base["input"],
            "{twin}: to samo wejście co {name}"
        );
        assert_eq!(v["seed"], base["seed"]);
    }
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

/// PIN2-PROBE-Q1 (dług FC WIRING-A r2 §4, mutant B07): obrońca-strzelec zepchnięty z korony przez wyburzenie kafla
/// muru (`battleScene.ts:7699-7741`, ZMIANA 5) traci zasięg x2 OD RAZU (`u.onWallWalkway = false;
/// this._applyTerrainRange(u)` `:7739-7740`), nie dopiero na początku swojej kolejnej aktywacji (`:6064`). Wektory nie
/// rozróżniają tej gałęzi (w AUTO nikt nie czyta `d.range` między zejściem a kolejną aktywacją obrońcy: po wyburzeniu
/// kafla `_siegeApproachRestricted` jest fałszem, `:7951-7960`, więc `_siegeShooterThreats` nie jest wołane), więc test
/// sprawdza niezmiennik pinu bezpośrednio na stanie ciała: w kroku, w którym strzelec obrońcy schodzi z korony, jego
/// `range` = `apply_terrain_range` bez korony na nowym kaflu. Wymaga co najmniej jednego takiego zejścia w wektorach.
#[test]
fn zejscie_z_korony_od_razu_przelicza_zasieg() {
    use civ_engine::domain::siege_battle_adapter_body::{apply_terrain_range, TerrainRangeUnit};
    // Diagnostyka: `WIRING_A_ZEJSCIA_FILE` = plik kandydatów generatora (szukanie wektora z zejściem z korony).
    let doc: Value = match std::env::var("WIRING_A_ZEJSCIA_FILE") {
        Ok(p) => serde_json::from_str(&std::fs::read_to_string(p).unwrap()).unwrap(),
        Err(_) => vectors(),
    };
    let data = pin_session_data();
    let mut zejscia = Vec::new();
    for v in doc["vectors"].as_array().unwrap() {
        if v["expect"]["wallEverBreached"] != true {
            continue;
        }
        let name = v["name"].as_str().unwrap();
        let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), &data).unwrap();
        let n = s.battle_loop().env.body.units[1].len();
        let mut on_wall: Vec<bool> = (0..n)
            .map(|i| {
                s.battle_loop().env.body.units[1][i]
                    .activate
                    .on_wall_walkway
            })
            .collect();
        let mut frames = 0;
        while s.phase() != SessionPhase::Finished {
            s.step(FRAME_MS).unwrap();
            frames += 1;
            assert!(frames < MAX_FRAMES, "{name}: bitwa bez końca");
            let lp = s.battle_loop();
            let body = &lp.env.body;
            for (i, was) in on_wall.iter_mut().enumerate() {
                let a = &body.units[1][i].activate;
                let c = &lp.st.def[i].c;
                let zszedl = *was && !a.on_wall_walkway;
                *was = a.on_wall_walkway;
                if !zszedl || c.dead || c.fading_out || c.routed {
                    continue;
                }
                if !body.ranged_base[1][i] || a.is_catapult || body.range_base[1][i] <= 0.0 {
                    continue;
                }
                let delta = body
                    .terrain_range_delta
                    .as_ref()
                    .expect("sesja z siatką zasięgu")
                    .get(&(a.q, a.r))
                    .copied()
                    .unwrap_or(0.0);
                let expected = apply_terrain_range(
                    &TerrainRangeUnit {
                        side_def: true,
                        on_wall_walkway: false,
                        ranged_base: true,
                        is_catapult: false,
                        range_base: body.range_base[1][i],
                    },
                    delta,
                );
                assert_eq!(
                    a.range.to_bits(),
                    expected.to_bits(),
                    "{name}: d{i} zszedł z korony na {},{}: range {} != {expected} (bez :7740)",
                    a.q,
                    a.r,
                    a.range
                );
                zejscia.push(format!("{name}:d{i}"));
            }
        }
    }
    assert!(
        !zejscia.is_empty(),
        "żaden wektor nie ma zejścia strzelca z korony — test bez mocy"
    );
    eprintln!("zejścia z korony: {zejscia:?}");
}

/// PIN2-PROBE-Q1 obrona (zarzut Z1 Evaluatora, mutant B06): `_siegeShooterThreats` (`battleScene.ts:7924-7937`) woła
/// `this._applyTerrainRange(d)` (`:7929`, MUTACJA `d.range`) dla każdego obrońcy-strzelca, zanim przeczyta `d.range`.
/// `d.range` bywa w pinie nieaktualne: obrońcy z `restUnits` (`:4735-4741`) startują z `range = rangeBase` bez
/// przeliczenia terenu, a `_doMove` (`:8685-8776`) przenosi jednostkę na inny kafel bez `_applyTerrainRange` (przeliczenie
/// dopiero na początku jej KOLEJNEJ aktywacji, `:6064`). W tym oknie tylko przeliczenie w `_siegeShooterThreats` daje
/// właściwy zasięg zagrożenia. Wektory pełnej bitwy tego okna nie rozróżniają (obrońcy-strzelcy stoją na kaflach z
/// deltą 0 i nie zmieniają delty przed swoją aktywacją), więc test odtwarza stan pinu strzelca z `restUnits`: strzelec
/// `k` poza koroną, na kaflu za murem (`q >= wallCol + 2`) z deltą zasięgu != 0, `range = rangeBase`. Następnie krok
/// atakującego objętego `_siegeApproachRestricted` (`:7951-7960`) przez `ProdBody::move_step` (bramka
/// `_siegeMoveRefused`, `:7962-7970`) musi (1) zostawić każdemu żywemu strzelcowi obrońcy `range` =
/// `apply_terrain_range` na jego kaflu (mutacja `d.range` jak w pinie) i (2) dać odmowę liczoną z zasięgów
/// PRZELICZONYCH. Cel kroku leży w odległości `D` od strzelca, gdzie `D` jest między zasięgiem nieaktualnym a
/// przeliczonym, więc odmowa pinu różni się od odmowy z zasięgu nieaktualnego (moc testu: mutant B06 = FAIL).
#[test]
fn zagrozenia_strzelcow_przeliczaja_zasieg_terenu() {
    use civ_engine::domain::siege_battle_adapter_body::{apply_terrain_range, TerrainRangeUnit};
    use civ_engine::domain::siege_tactics_approach::{
        siege_approach_restricted, siege_move_refused, siege_shooter_threats, ApproachUnit,
        ApproachWallState, ShooterDefender,
    };
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_turnseq::UnitRef;
    let doc = vectors();
    let data = pin_session_data();
    let mut przypadki = Vec::new();
    for v in doc["vectors"].as_array().unwrap() {
        let name = v["name"].as_str().unwrap();
        let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), &data).unwrap();
        let body = &mut s.battle_loop_mut().env.body;
        let wall_col = body.scene.wall_col;
        let Some(grid) = body.terrain_range_delta.clone() else {
            continue;
        };
        if wall_col < 0 {
            continue;
        }
        let wall = ApproachWallState {
            wall_col_ge0: true,
            gate_open: body.scene.gate_open,
            wall_ever_breached: body.wall_ever_breached,
            wall_tiles_init: body.siege_wall_tiles_init,
            wall_tiles_alive: body.scene.wall_tile_hp.len(),
            tower_at_wall_rows_count: body.tower_at_wall_rows.len(),
        };
        // Pierwszy atakujący objęty `_siegeApproachRestricted`.
        let restricted = (0..body.units[0].len()).find_map(|a| {
            let au = &body.units[0][a].activate;
            if au.dead || au.fading_out || au.routed {
                return None;
            }
            let approach = ApproachUnit {
                side_atk: true,
                routed: false,
                on_wall_walkway: au.on_wall_walkway,
                is_siege_unit: au.is_siege_unit,
                primary_ranged: au.primary_ranged,
                can_shoot: au.can_shoot,
                shooting_disabled: !body.doctrine[0][a].shooting_enabled || au.shooting_disabled,
                mounted: au.mounted,
            };
            siege_approach_restricted(&approach, &wall).then_some((a, approach))
        });
        let Some((a, approach)) = restricted else {
            continue;
        };
        let from = (body.units[0][a].activate.q, body.units[0][a].activate.r);
        let n_def = body.units[1].len();
        let fresh_of = |body: &civ_engine::domain::siege_tactics_loop::ProdBody<_>, i: usize| {
            let d = &body.units[1][i].activate;
            apply_terrain_range(
                &TerrainRangeUnit {
                    side_def: true,
                    on_wall_walkway: d.on_wall_walkway,
                    ranged_base: body.ranged_base[1][i],
                    is_catapult: d.is_catapult,
                    range_base: body.range_base[1][i],
                },
                grid.get(&(d.q, d.r)).copied().unwrap_or(0.0),
            )
        };
        let shooter = |body: &civ_engine::domain::siege_tactics_loop::ProdBody<_>, i: usize| {
            let d = &body.units[1][i].activate;
            !(d.dead || d.fading_out || d.routed)
                && d.can_shoot
                && body.range_base[1][i] > 0.0
                && body.ranged_base[1][i]
                && !d.is_catapult
        };
        let Some(k) = (0..n_def).find(|&i| shooter(body, i)) else {
            continue;
        };
        // Stan pinu strzelca z `restUnits` (`:4735-4741`): `placeOne` za murem (`rearCol = wallCol + 2 + …`) z
        // `range = rangeBase`, bez `_applyTerrainRange` (to woła tylko pętla obrońców na koronie, `:4730`).
        body.units[1][k].activate.on_wall_walkway = false;
        body.units[1][k].activate.range = body.range_base[1][k];
        // Kafel za murem z deltą != 0 (kolejność deterministyczna), dla którego istnieje `D` między zasięgiem
        // nieaktualnym a przeliczonym i krok z `from` na kafel w odległości `D` daje różną odmowę dla obu zasięgów.
        let mut tiles: Vec<((i64, i64), f64)> = grid
            .iter()
            .filter(|(&(q, _), &d)| d != 0.0 && q >= wall_col + 2)
            .map(|(&t, &d)| (t, d))
            .collect();
        tiles.sort_by_key(|x| x.0);
        let stale_k = body.units[1][k].activate.range;
        let mut chosen = None;
        for &(tile, _) in &tiles {
            body.units[1][k].activate.q = tile.0;
            body.units[1][k].activate.r = tile.1;
            let fresh: Vec<f64> = (0..n_def).map(|i| fresh_of(body, i)).collect();
            let stale: Vec<f64> = (0..n_def)
                .map(|i| body.units[1][i].activate.range)
                .collect();
            let (lo, hi) = (fresh[k].min(stale_k), fresh[k].max(stale_k));
            let dist = hi.floor();
            if !(dist > lo && dist >= 1.0) {
                continue;
            }
            let defenders: Vec<ShooterDefender> = (0..n_def)
                .map(|i| {
                    let d = &body.units[1][i].activate;
                    ShooterDefender {
                        q: d.q as f64,
                        r: d.r as f64,
                        dead: d.dead,
                        fading_out: d.fading_out,
                        removed: d.dead,
                        routed: d.routed,
                        can_shoot: d.can_shoot,
                        range_base: body.range_base[1][i],
                    }
                })
                .collect();
            let pos =
                |d: &ShooterDefender| defenders.iter().position(|x| std::ptr::eq(x, d)).unwrap();
            let threats = |r: &[f64]| {
                siege_shooter_threats(
                    &defenders,
                    &body.siege_towers,
                    wall_col as f64,
                    body.tower_range,
                    |d| r[pos(d)],
                )
            };
            let (tf, ts) = (threats(&fresh), threats(&stale));
            // Cel w odległości `dist` od strzelca, w stronę atakującego (wzdłuż kolumny).
            let dir = if from.0 < tile.0 { -1 } else { 1 };
            let to = (tile.0 + dir * dist as i64, tile.1);
            let to_f = (to.0 as f64, to.1 as f64);
            let from_f = (from.0 as f64, from.1 as f64);
            let exp = siege_move_refused(&approach, &wall, &tf, from_f, to_f);
            let exp_stale = siege_move_refused(&approach, &wall, &ts, from_f, to_f);
            if exp != exp_stale {
                chosen = Some((tile, to, exp, fresh));
                break;
            }
        }
        let Some((tile, to, exp, fresh)) = chosen else {
            continue;
        };
        body.units[1][k].activate.q = tile.0;
        body.units[1][k].activate.r = tile.1;
        let res = body
            .move_step(
                UnitRef {
                    side: BattleSide::Attacker,
                    idx: a,
                },
                to.0,
                to.1,
                false,
                1.0,
                None,
            )
            .unwrap();
        // (1) mutacja `d.range` (`:7929`) dla każdego żywego strzelca obrońcy.
        for i in (0..n_def).filter(|&i| shooter(body, i)) {
            assert_eq!(
                body.units[1][i].activate.range.to_bits(),
                fresh[i].to_bits(),
                "{name}: a{a} krok na {to:?}: d{i} range {} != {} (brak `_applyTerrainRange` w `_siegeShooterThreats`)",
                body.units[1][i].activate.range,
                fresh[i]
            );
        }
        // (2) odmowa = `_siegeMoveRefused` z zasięgami przeliczonymi (`moveLeft = 0`, pozycja bez zmian).
        let a_now = &body.units[0][a].activate;
        let refused = res.outcome.done && res.move_left == 0.0 && (a_now.q, a_now.r) == from;
        assert_eq!(
            refused, exp,
            "{name}: a{a} {from:?} -> {to:?}, d{k} na {tile:?} (zasięg przeliczony {}, nieaktualny {stale_k}): \
             odmowa ciała != odmowa pinu",
            fresh[k]
        );
        przypadki.push(format!(
            "{name}: a{a} {from:?}->{to:?}, d{k} na {tile:?} zasięg {stale_k}->{} odmowa={exp}",
            fresh[k]
        ));
    }
    eprintln!("przypadki B06: {przypadki:#?}");
    assert!(
        przypadki.len() >= 3,
        "za mało przypadków rozróżniających zasięg przeliczony od nieaktualnego: {przypadki:?}"
    );
    assert!(
        przypadki.iter().any(|p| p.ends_with("odmowa=true"))
            && przypadki.iter().any(|p| p.ends_with("odmowa=false")),
        "potrzebne obie gałęzie (pin odmawia / pin nie odmawia): {przypadki:?}"
    );
}

/// PIN2-PROBE-Q1 (diagnostyka, bez zmiennej nic nie robi): kandydaci scenariuszy z pliku wektorów generatora
/// (`WIRING_A_EXTRA` + `WIRING_A_OUT`), ścieżka w `WIRING_A_VECTORS_FILE`. Wypisuje zgodność każdego kandydata; służy do
/// szukania wektorów rozróżniających mutanty (binarka testu skompilowana z mutantem, ten sam plik kandydatów).
#[test]
fn kandydaci_z_pliku_na_zadanie() {
    let Ok(path) = std::env::var("WIRING_A_VECTORS_FILE") else {
        return;
    };
    let doc: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    assert_eq!(
        doc["pinSha256"], PIN_SHA256,
        "kandydaci z innego tekstu pinu"
    );
    let data = pin_session_data();
    for v in doc["vectors"].as_array().unwrap() {
        let name = v["name"].as_str().unwrap();
        let line = match run_vector_diag(v, &data) {
            Ok(out) => {
                let d = diff(v, &out);
                if d.is_empty() {
                    "ZGODNY".to_owned()
                } else {
                    d.join("; ")
                }
            }
            Err(e) => format!("BLAD {e:?}"),
        };
        println!("KANDYDAT {name}: {line}");
    }
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
    // PIN3-DIVERGENCE-Q1: scenariusz także z pliku kandydatów generatora (`WIRING_A_VECTORS_FILE`).
    let doc = match std::env::var("WIRING_A_VECTORS_FILE") {
        Ok(path) => serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap(),
        Err(_) => vectors(),
    };
    let data = pin_session_data();
    let v = doc["vectors"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["name"] == name.as_str())
        .expect("scenariusz");
    let mut s = SiegeBattleSession::prepare_scene(&scene_input(v), &data).unwrap();
    diag_speed(&mut s);
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
        let morale_dump = rep.actions.iter().any(|a| {
            matches!(
                a.action,
                BattleAction::Damage { .. } | BattleAction::Rout { .. }
            )
        });
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
                BattleAction::Facing { unit, dir } => format!("FACE {} {dir}", id(unit)),
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
            for (side, list) in [
                (BattleSide::Attacker, &st.atk),
                (BattleSide::Defender, &st.def),
            ] {
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
