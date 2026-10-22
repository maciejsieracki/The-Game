//! P6.1B — port `playerState.ts` (stan gracza, badania, kolejka, hot-seat).
//!
//! Wektory: `tests/p6_1b_vectors/web-vectors.json`, generowane z URUCHOMIONEGO kodu weba
//! (pin edb8fb56, `playerState.ts` bez zmian; generator `gen-p61b-web-vectors.mjs`).
//! Liczby, ktore moga byc ulamkiem, sa zapisane jako tekst (`String(x)` z JS) i czytane przez
//! `str::parse::<f64>` (serde_json bez `float_roundtrip` moze zgubic 1 ulp).
//!
//! Dwa rodzaje testow:
//! - `parity_*`: porownanie z wektorami weba. Wektory sa migawka weba na pinie, wiec ZMIANA
//!   balansu w `player-state-params.json` / `research-costs.json` je zaczerwieni (celowo).
//! - `table_*` / `hot_seat_*` / `error_*`: ksztalt tabel i zachowanie bez pinow wartosci;
//!   dowodza, ze kod czyta stale z tabel (zmiana tabeli zmienia zachowanie).

use std::collections::{BTreeSet, HashMap};

use civ_engine::data::buildings_tech::{TechFile, Technologia};
use civ_engine::data::derived::{parse_player_state_params, parse_research_costs};
use civ_engine::domain::player::{
    clear_research_queue, dequeue_research_target, era_advance_target, get_research_plan_snapshot,
    is_era_advance_tech, research_plan_length, tech_cost, HumanSeats, PlayerRules, PlayerState,
    PlayerStateByHuman, PlayerStateError, ResearchGate,
};
use civ_engine::domain::{Difficulty, OwnerRef, PlayerId};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1b_vectors/web-vectors.json");
const TECH_JSON: &str = include_str!("../data/tech.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

fn rules() -> PlayerRules {
    PlayerRules::load().expect("player rules load")
}

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => s.parse::<f64>().expect("float text"),
        Value::Number(n) => n.as_f64().expect("number"),
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn opt_string(v: &Value) -> Option<String> {
    v.as_str().map(str::to_owned)
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("array")
        .iter()
        .map(|s| s.as_str().expect("string").to_owned())
        .collect()
}

fn techs(rows: &Value) -> Vec<Technologia> {
    rows.as_array()
        .expect("techs array")
        .iter()
        .map(|row| serde_json::from_value(row.clone()).expect("Technologia row"))
        .collect()
}

fn difficulty(key: &str) -> Difficulty {
    match key {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

/// Bramka z gotowymi wynikami web `researchGatesMet` per nazwa techu.
struct MapGate(HashMap<String, bool>);

impl MapGate {
    fn from_vectors(web: &Value, gate: &str, techset: &str) -> Self {
        let map = web["gateMaps"][gate][techset]
            .as_object()
            .unwrap_or_else(|| panic!("gateMaps.{gate}.{techset}"));
        Self(
            map.iter()
                .map(|(k, v)| (k.clone(), v.as_bool().expect("bool")))
                .collect(),
        )
    }
}

impl ResearchGate for MapGate {
    fn gates_met(&self, tech: &Technologia) -> bool {
        *self
            .0
            .get(&tech.technologia)
            .unwrap_or_else(|| panic!("brak wyniku bramki dla {}", tech.technologia))
    }
}

fn gate_ref(gate: &Option<MapGate>) -> Option<&dyn ResearchGate> {
    gate.as_ref().map(|g| g as &dyn ResearchGate)
}

fn done_set(names: &Value) -> BTreeSet<String> {
    strings(names).into_iter().collect()
}

// ---------------------------------------------------------------------------
// Stale i stan poczatkowy
// ---------------------------------------------------------------------------

#[test]
fn parity_constants_and_defaults_match_web() {
    let web = web();
    let rules = rules();
    assert_eq!(
        rules.pieniadz_mnoznik(),
        web["constants"]["PIENIADZ_MNOZNIK"].as_i64().unwrap()
    );
    assert_eq!(
        rules.research_queue_max() as u64,
        web["constants"]["RESEARCH_QUEUE_MAX"].as_u64().unwrap()
    );

    let d = &web["defaults"]["state"];
    let s = rules.create_player_state();
    assert_eq!(s.skarbiec, num(&d["skarbiec"]));
    assert_eq!(s.nauka, num(&d["nauka"]));
    assert!(s.zbadane.is_empty());
    assert_eq!(s.badana, None);
    assert_eq!(s.player_research_target_id, None);
    assert!(s.research_queue.is_empty());
    assert_eq!(s.era, d["era"].as_i64().unwrap());
    assert_eq!(s.pieniadz_mnoznik, d["pieniadzMnoznik"].as_i64().unwrap());
    assert_eq!(s.tempo_gry, d["tempoGry"].as_str().unwrap());
    assert_eq!(s.building_cost_pace, d["building"].as_str().unwrap());
    assert_eq!(
        s.koszt_jednostek_pace,
        d["kosztJednostek"].as_str().unwrap()
    );
    assert_eq!(s.wzrost_ludnosci_pace, d["wzrost"].as_str().unwrap());
    assert_eq!(s.ruch_swiata_pace, d["ruch"].as_str().unwrap());
    assert_eq!(s.civ_type, d["civType"].as_str().unwrap());
    assert!(s.civ_bonusy.is_empty());
    assert_eq!(s.rakieta_wystrzelona, d["rakieta"].as_bool().unwrap());

    // Kontrakt pol: serializacja ma dokladnie te klucze, co obiekt weba (kolejnosc nieistotna).
    let json = serde_json::to_value(&s).unwrap();
    let mut got: Vec<String> = json.as_object().unwrap().keys().cloned().collect();
    let mut want = strings(&web["defaults"]["keys"]);
    got.sort();
    want.sort();
    assert_eq!(got, want);
}

#[test]
fn parity_vectors_use_the_engine_tech_data() {
    // Zbior `real` w wektorach = wiersze tech.json silnika (poza polami niewykorzystywanymi).
    let web = web();
    let file: TechFile = serde_json::from_str(TECH_JSON).expect("tech.json");
    let real = techs(&web["techsets"]["real"]);
    assert_eq!(real.len(), file.technologie.len());
    for (got, want) in real.iter().zip(&file.technologie) {
        assert_eq!(got.technologia, want.technologia);
        assert_eq!(got.epoka, want.epoka);
        assert_eq!(got.poziom, want.poziom);
        assert_eq!(got.wymaga_prereq, want.wymaga_prereq);
        assert_eq!(got.koszt_nauki, want.koszt_nauki);
        assert_eq!(got.uwagi, want.uwagi);
        assert_eq!(got.odblokowuje_budynek, want.odblokowuje_budynek);
        assert_eq!(got.wymagany_budynek, want.wymagany_budynek);
        assert_eq!(got.wymagane_ulepszenie, want.wymagane_ulepszenie);
        assert_eq!(got.awans_do_epoki, want.awans_do_epoki);
    }
    assert_eq!(web["meta"]["techJsonEqualRust"], Value::Bool(true));
}

// ---------------------------------------------------------------------------
// Funkcje czyste
// ---------------------------------------------------------------------------

#[test]
fn parity_parse_prereqs_and_prereqs_met() {
    let web = web();
    let rules = rules();
    let sets: Vec<BTreeSet<String>> = web["researchedSets"]
        .as_array()
        .unwrap()
        .iter()
        .map(done_set)
        .collect();
    let rows = web["prereqs"].as_array().unwrap();
    assert_eq!(rows.len(), 29);
    for row in rows {
        let raw = row["raw"].as_str().unwrap();
        let mut t = real_template();
        t.wymaga_prereq = raw.to_owned();
        assert_eq!(
            rules.parse_prereqs(&t),
            strings(&row["parsed"]),
            "parsePrereqs({raw:?})"
        );
        let met = row["met"].as_array().unwrap();
        assert_eq!(met.len(), sets.len());
        for (set, want) in sets.iter().zip(met) {
            assert_eq!(
                rules.prereqs_met(&t, set),
                want.as_bool().unwrap(),
                "prereqsMet({raw:?}, {set:?})"
            );
        }
    }
}

fn real_template() -> Technologia {
    let web = web();
    techs(&web["techsets"]["real"]).remove(0)
}

#[test]
fn parity_epoch_number() {
    let web = web();
    let rules = rules();
    let rows = web["epochNumbers"].as_array().unwrap();
    assert_eq!(rows.len(), 26);
    for row in rows {
        let raw = row["raw"].as_str().unwrap();
        let mut t = real_template();
        t.epoka = raw.to_owned();
        assert_eq!(
            rules.epoch_number(&t),
            row["n"].as_i64(),
            "epochNumber({raw:?})"
        );
    }
}

#[test]
fn parity_gates_available_and_cheapest() {
    let web = web();
    let rules = rules();
    let syn = techs(&web["pure"]["synTechs"]);
    for set in web["pure"]["doneSets"].as_array().unwrap() {
        let done = done_set(&set["done"]);
        for (i, t) in syn.iter().enumerate() {
            let ctx = format!("done={done:?} tech#{i} {:?}", t.technologia);
            assert_eq!(
                rules.prereqs_met(t, &done),
                set["prereqsMet"][i].as_bool().unwrap(),
                "prereqsMet {ctx}"
            );
            assert_eq!(
                rules.epoch_gate_met(t, &syn, &done),
                set["epochGate"][i].as_bool().unwrap(),
                "epochGateMet {ctx}"
            );
            assert_eq!(
                rules.epoch_tier_gate_met(t, &syn, &done),
                set["tierGate"][i].as_bool().unwrap(),
                "epochTierGateMet {ctx}"
            );
        }
        for gname in ["none", "g0", "g1", "g2"] {
            let gate = (gname != "none").then(|| MapGate::from_vectors(&web, gname, "synA"));
            let want = &set["perGate"][gname];
            let avail: Vec<usize> = rules
                .available_techs(&syn, &done, gate_ref(&gate))
                .iter()
                .map(|t| syn.iter().position(|s| std::ptr::eq(s, *t)).unwrap())
                .collect();
            let want_avail: Vec<usize> = want["available"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_u64().unwrap() as usize)
                .collect();
            assert_eq!(
                avail, want_avail,
                "availableTechs gate={gname} done={done:?}"
            );
            assert_eq!(
                rules.cheapest_available(&syn, &done, gate_ref(&gate)),
                opt_string(&want["cheapest"]),
                "cheapestAvailable gate={gname} done={done:?}"
            );
        }
    }
}

#[test]
fn parity_cheapest_tie_break_uses_utf16_order() {
    // U+FF21 vs U+1F600: JS `<` (UTF-16) wybiera U+1F600; porzadek bajtow UTF-8 wybralby U+FF21.
    let web = web();
    let rules = rules();
    let set = techs(&web["pure"]["tie"]["set"]);
    let got = rules.cheapest_available(&set, &BTreeSet::new(), None);
    assert_eq!(got, opt_string(&web["pure"]["tie"]["cheapest"]));
    assert_eq!(got.as_deref(), Some("\u{1F600}"));
    assert!("\u{FF21}".as_bytes() < "\u{1F600}".as_bytes());
}

fn check_rows(rules: &PlayerRules, rows_set: &Value, expected: &Value) {
    let rows = techs(rows_set);
    let exp = expected.as_array().unwrap();
    assert_eq!(rows.len(), exp.len());
    for (t, e) in rows.iter().zip(exp) {
        let ctx = format!("{:?}", t.technologia);
        assert_eq!(
            tech_cost(t),
            e["techCost"].as_i64().unwrap(),
            "techCost {ctx}"
        );
        assert_eq!(
            era_advance_target(t),
            e["eraAdvanceTarget"].as_i64(),
            "eraAdvanceTarget {ctx}"
        );
        assert_eq!(
            is_era_advance_tech(t),
            e["isEraAdvanceTech"].as_bool().unwrap(),
            "isEraAdvanceTech {ctx}"
        );
        assert_eq!(
            rules.is_money_tech(t),
            e["isMoneyTech"].as_bool().unwrap(),
            "isMoneyTech {ctx}"
        );
        assert_eq!(
            rules.epoch_number(t),
            e["epochNumber"].as_i64(),
            "epochNumber {ctx}"
        );
        assert_eq!(
            rules.parse_prereqs(t),
            strings(&e["parsePrereqs"]),
            "parsePrereqs {ctx}"
        );
    }
}

#[test]
fn parity_per_row_functions() {
    let web = web();
    let rules = rules();
    check_rows(&rules, &web["techsets"]["synA"], &web["pure"]["rowsSynA"]);
    check_rows(
        &rules,
        &web["techsets"]["synMoney"],
        &web["pure"]["rowsSynMoney"],
    );
    // Rozmiary: zabezpieczenie przed pustymi wektorami.
    assert_eq!(web["pure"]["rowsSynMoney"].as_array().unwrap().len(), 19);
}

#[test]
fn parity_research_costs_equal_web_scaled_research_cost() {
    let web = web();
    let rules = rules();
    let real = techs(&web["techsets"]["real"]);
    let mut checked = 0;
    for tempo in ["szybka", "standardowa", "dluga"] {
        for diff in ["easy", "normal", "hard"] {
            for t in &real {
                let want = web["costs"][tempo][diff][&t.technologia].as_u64().unwrap() as u32;
                let got = rules
                    .scaled_research_cost(t, tempo, difficulty(diff))
                    .expect("koszt z tabeli");
                assert_eq!(got, want, "{} {tempo} {diff}", t.technologia);
                checked += 1;
            }
        }
    }
    assert_eq!(checked, 288);
}

// ---------------------------------------------------------------------------
// Skrypty stanowe (researchStep, set/enqueue/dequeue/clear, getResearchState, hot-seat)
// ---------------------------------------------------------------------------

fn apply_patch(state: &mut PlayerState, fields: &serde_json::Map<String, Value>) {
    for (key, v) in fields {
        match key.as_str() {
            "tempoGry" => state.tempo_gry = v.as_str().unwrap().to_owned(),
            "era" => state.era = v.as_i64().unwrap(),
            "badana" => state.badana = opt_string(v),
            "playerResearchTargetId" => state.player_research_target_id = opt_string(v),
            "researchQueue" => state.research_queue = strings(v),
            "zbadane" => state.zbadane = done_set(v),
            other => panic!("nieobslugiwane pole patch: {other}"),
        }
    }
}

fn check_state(ctx: &str, st: &PlayerState, exp: &Value) {
    assert_eq!(st.skarbiec, num(&exp["skarbiec"]), "{ctx} skarbiec");
    assert_eq!(st.nauka, num(&exp["nauka"]), "{ctx} nauka");
    assert_eq!(st.badana, opt_string(&exp["badana"]), "{ctx} badana");
    assert_eq!(
        st.player_research_target_id,
        opt_string(&exp["target"]),
        "{ctx} playerResearchTargetId"
    );
    assert_eq!(
        st.research_queue,
        strings(&exp["queue"]),
        "{ctx} researchQueue"
    );
    assert_eq!(st.era, exp["era"].as_i64().unwrap(), "{ctx} era");
    assert_eq!(
        st.pieniadz_mnoznik,
        exp["pieniadzMnoznik"].as_i64().unwrap(),
        "{ctx} pieniadzMnoznik"
    );
    assert_eq!(
        st.tempo_gry,
        exp["tempoGry"].as_str().unwrap(),
        "{ctx} tempoGry"
    );
    assert_eq!(
        st.zbadane.len() as u64,
        exp["zbadaneCount"].as_u64().unwrap(),
        "{ctx} zbadane.len"
    );
    if let Some(z) = exp.get("zbadane") {
        assert_eq!(st.zbadane, done_set(z), "{ctx} zbadane");
    }
}

#[derive(Default)]
struct Totals {
    steps: usize,
    completions: usize,
    set_true: usize,
    set_false: usize,
    enqueue_true: usize,
    enqueue_false: usize,
    dequeue_true: usize,
    dequeue_false: usize,
    get_state: usize,
    era_advances: usize,
    money: usize,
}

fn run_scenario(rules: &PlayerRules, web: &Value, sc: &Value, totals: &mut Totals) {
    let name = sc["name"].as_str().unwrap();
    let techset = sc["techset"].as_str().unwrap();
    let tl = techs(&web["techsets"][techset]);
    let gate = sc["gate"]
        .as_str()
        .map(|g| MapGate::from_vectors(web, g, techset));
    let default_diff = sc["difficulty"].as_str().unwrap_or("normal").to_owned();

    let mut states = PlayerStateByHuman::new();
    let seat_ids: Vec<String> = sc
        .get("seats")
        .map(strings)
        .unwrap_or_else(|| vec!["0".to_owned()]);
    for id in &seat_ids {
        states.ensure(PlayerId::new(id.parse().unwrap()), rules);
    }
    if let Some(init) = sc.get("init").and_then(Value::as_object) {
        for (id, f) in init {
            let st = states.ensure(PlayerId::new(id.parse().unwrap()), rules);
            apply_patch(st, f.as_object().unwrap());
        }
    }

    let ops = sc["ops"].as_array().unwrap();
    let expected = sc["expected"].as_array().unwrap();
    assert_eq!(ops.len(), expected.len(), "{name}");
    for (i, (op, exp)) in ops.iter().zip(expected).enumerate() {
        let ctx = format!("{name} op#{i} {}", op["op"]);
        let seat = PlayerId::new(op["s"].as_str().unwrap_or("0").parse().unwrap());
        let diff = difficulty(op["d"].as_str().unwrap_or(&default_diff));
        let st = states.ensure(seat, rules);
        let ret = &exp["ret"];
        match op["op"].as_str().unwrap() {
            "addNauka" => st.nauka += num(&op["n"]),
            "patch" => apply_patch(st, op["f"].as_object().unwrap()),
            "step" => {
                let got = rules
                    .research_step(st, &tl, gate_ref(&gate), diff)
                    .expect("research_step");
                let want = ret["completed"].as_array().unwrap();
                assert_eq!(got.completed.len(), want.len(), "{ctx} completed.len");
                for (g, w) in got.completed.iter().zip(want) {
                    assert_eq!(g.id, w["id"].as_str().unwrap(), "{ctx} id");
                    assert_eq!(
                        u64::from(g.koszt),
                        w["koszt"].as_u64().unwrap(),
                        "{ctx} koszt"
                    );
                    assert_eq!(
                        g.awans_epoki,
                        w["awansEpoki"].as_bool().unwrap(),
                        "{ctx} awans"
                    );
                    assert_eq!(
                        g.pieniadz,
                        w["pieniadz"].as_bool().unwrap(),
                        "{ctx} pieniadz"
                    );
                    assert_eq!(g.era, w["era"].as_i64().unwrap(), "{ctx} era");
                    totals.completions += 1;
                    totals.era_advances += usize::from(g.awans_epoki);
                    totals.money += usize::from(g.pieniadz);
                }
                assert_eq!(got.badana, opt_string(&ret["badana"]), "{ctx} badana");
                totals.steps += 1;
            }
            "set" => {
                let got = rules.set_player_research_target(
                    st,
                    op["id"].as_str().unwrap(),
                    &tl,
                    gate_ref(&gate),
                );
                assert_eq!(got, ret.as_bool().unwrap(), "{ctx}");
                if got {
                    totals.set_true += 1;
                } else {
                    totals.set_false += 1;
                }
            }
            "enqueue" => {
                let got = rules.enqueue_research_target(st, op["id"].as_str().unwrap(), &tl);
                assert_eq!(got, ret.as_bool().unwrap(), "{ctx}");
                if got {
                    totals.enqueue_true += 1;
                } else {
                    totals.enqueue_false += 1;
                }
            }
            "dequeue" => {
                let got = dequeue_research_target(st, op["id"].as_str().unwrap());
                assert_eq!(got, ret.as_bool().unwrap(), "{ctx}");
                if got {
                    totals.dequeue_true += 1;
                } else {
                    totals.dequeue_false += 1;
                }
            }
            "clear" => clear_research_queue(st),
            "plan" => assert_eq!(get_research_plan_snapshot(st), strings(ret), "{ctx}"),
            "planLength" => {
                assert_eq!(
                    research_plan_length(st) as u64,
                    ret.as_u64().unwrap(),
                    "{ctx}"
                )
            }
            "getState" => {
                let got = rules
                    .get_research_state(st, &tl, num(&op["npt"]), diff)
                    .expect("get_research_state");
                assert_eq!(got.pula, num(&ret["pula"]), "{ctx} pula");
                assert_eq!(
                    got.target_id,
                    opt_string(&ret["targetId"]),
                    "{ctx} targetId"
                );
                assert_eq!(
                    u64::from(got.koszt_celu),
                    ret["kosztCelu"].as_u64().unwrap(),
                    "{ctx} kosztCelu"
                );
                assert_eq!(got.postep_fraction, num(&ret["postep"]), "{ctx} postep");
                let want_turns = (!ret["turnsLeft"].is_null()).then(|| num(&ret["turnsLeft"]));
                assert_eq!(got.turns_left, want_turns, "{ctx} turnsLeft");
                totals.get_state += 1;
            }
            other => panic!("nieznana operacja {other}"),
        }
        check_state(&ctx, states.get(seat).unwrap(), &exp["state"]);
    }
}

#[test]
fn parity_scenarios_from_web() {
    let web = web();
    let rules = rules();
    let scenarios = web["scenarios"].as_array().unwrap();
    assert_eq!(scenarios.len(), 34);
    let mut totals = Totals::default();
    for sc in scenarios {
        run_scenario(&rules, &web, sc, &mut totals);
    }
    // Straznik pokrycia: wektory musza realnie ruszac wszystkie sciezki.
    assert!(totals.steps >= 400, "steps={}", totals.steps);
    assert!(
        totals.completions >= 300,
        "completions={}",
        totals.completions
    );
    assert!(totals.set_true >= 5 && totals.set_false >= 50);
    assert!(totals.enqueue_true >= 30 && totals.enqueue_false >= 15);
    assert!(totals.dequeue_true >= 3 && totals.dequeue_false >= 5);
    assert!(totals.get_state >= 30);
    assert!(totals.era_advances >= 10 && totals.money >= 5);
}

// ---------------------------------------------------------------------------
// Hot-seat: dwoch ludzkich wlascicieli, niezalezne stany
// ---------------------------------------------------------------------------

#[test]
fn hot_seat_two_human_owners_have_independent_player_states() {
    let web = web();
    let rules = rules();
    let tl = techs(&web["techsets"]["real"]);

    let a = PlayerId::new(0);
    let b = PlayerId::new(1);
    let seats = HumanSeats::new(vec![a, b], a);
    assert!(seats.is_hot_seat());
    assert!(seats.is_human_owner(OwnerRef::Player(a)));
    assert!(seats.is_human_owner(OwnerRef::Player(b)));

    let mut states = PlayerStateByHuman::new();
    assert!(states.is_empty());
    states.ensure(a, &rules).tempo_gry = "szybka".to_owned();
    states.ensure(b, &rules);
    assert_eq!(states.len(), 2);

    // ensure jest idempotentne: nie resetuje istniejacego stanu.
    assert_eq!(states.ensure(a, &rules).tempo_gry, "szybka");

    states.get_mut(a).unwrap().nauka = 1000.0;
    let step_a = rules
        .research_step(states.get_mut(a).unwrap(), &tl, None, Difficulty::Normal)
        .unwrap();
    assert!(!step_a.completed.is_empty());

    // Fotel B nie dostal ani nauki, ani zbadanych technologii z kroku A.
    let sb = states.get(b).unwrap();
    assert_eq!(sb.nauka, 0.0);
    assert!(sb.zbadane.is_empty());
    assert_eq!(sb.badana, None);
    assert_eq!(sb.tempo_gry, rules.create_player_state().tempo_gry);

    // Rowny krok B zadziala niezaleznie (dowolny, ale rozny cel niz A).
    assert!(rules.enqueue_research_target(states.get_mut(b).unwrap(), "Rolnictwo", &tl));
    assert_eq!(
        get_research_plan_snapshot(states.get(b).unwrap()),
        vec!["Rolnictwo".to_owned()]
    );
    assert!(get_research_plan_snapshot(states.get(a).unwrap()).is_empty());

    // Przelaczenie aktywnego fotela nie zmienia stanow.
    let next = seats.next_human_seat();
    assert_eq!(next, Some(b));
    assert!(states.get(PlayerId::new(2)).is_none());
}

// ---------------------------------------------------------------------------
// Ksztalt tabel i dowod, ze kod czyta stale z tabel (bez pinow wartosci)
// ---------------------------------------------------------------------------

#[test]
fn table_player_state_params_shape() {
    let p = parse_player_state_params().expect("player-state-params.json");
    assert!(p.pieniadz_mnoznik >= 1);
    assert!(p.research_queue_max >= 1);
    assert!(!p.brak_prereq.is_empty());
    assert!(
        p.brak_prereq.iter().any(String::is_empty),
        "pusty znacznik braku prereq"
    );
    assert!(!p.numer_epoki.is_empty());
    assert!(p.numer_epoki.values().all(|n| *n >= 1));
    assert!(p.diakrytyki_epoki.values().all(char::is_ascii_lowercase));
    assert!(!p.technologia_pieniadza.is_empty());
    assert!(!p.uwagi_pieniadza_igla.is_empty());
    for key in ["easy", "normal", "hard"] {
        assert!(p.tryb_badan_gracza.contains_key(key), "tryb dla {key}");
    }
    // Kazdy tryb gracza istnieje w osi `tryb` tabeli kosztow badan.
    let costs = parse_research_costs().expect("research-costs.json");
    let tryby: BTreeSet<&str> = costs
        .wiersze
        .iter()
        .flat_map(|r| r.wartosci.iter().map(|w| w.tryb.as_str()))
        .collect();
    for tryb in p.tryb_badan_gracza.values() {
        assert!(
            tryby.contains(tryb.as_str()),
            "tryb {tryb} w research-costs.json"
        );
    }
    // Stan poczatkowy: tempo istnieje w tabeli kosztow.
    let tempa: BTreeSet<&str> = costs
        .wiersze
        .iter()
        .flat_map(|r| r.wartosci.iter().map(|w| w.tempo.as_str()))
        .collect();
    assert!(tempa.contains(p.stan_poczatkowy.tempo_gry.as_str()));
    assert!(p.stan_poczatkowy.era >= 1);
    assert!(p.stan_poczatkowy.pieniadz_mnoznik >= 1);
}

#[test]
fn table_every_engine_tech_has_a_research_cost_for_every_axis() {
    let file: TechFile = serde_json::from_str(TECH_JSON).unwrap();
    let rules = rules();
    for t in &file.technologie {
        for tempo in ["szybka", "standardowa", "dluga"] {
            for d in [Difficulty::Easy, Difficulty::Normal, Difficulty::Hard] {
                let c = rules.scaled_research_cost(t, tempo, d).expect("koszt");
                assert!(c >= 1, "{} {tempo} {}", t.technologia, d.key());
            }
        }
    }
}

#[test]
fn table_constants_are_read_from_data_not_literals() {
    let web = web();
    let tl = techs(&web["techsets"]["real"]);

    let mut params = parse_player_state_params().unwrap();
    params.pieniadz_mnoznik = 77;
    params.research_queue_max = 2;
    params.technologia_pieniadza = "garncarstwo".to_owned();
    params.stan_poczatkowy.era = 5;
    params.stan_poczatkowy.civ_type = "rzymianie".to_owned();
    params.stan_poczatkowy.tempo_gry = "szybka".to_owned();
    let rules = PlayerRules::new(params, parse_research_costs().unwrap());

    // Stan poczatkowy z tabeli.
    let mut st = rules.create_player_state();
    assert_eq!(
        (st.era, st.civ_type.as_str(), st.tempo_gry.as_str()),
        (5, "rzymianie", "szybka")
    );

    // RESEARCH_QUEUE_MAX z tabeli: plan ma maks. 2 pozycje.
    assert!(rules.enqueue_research_target(&mut st, "Rolnictwo", &tl));
    assert!(rules.enqueue_research_target(&mut st, "Łowiectwo", &tl));
    assert!(!rules.enqueue_research_target(&mut st, "Mistycyzm", &tl));
    assert_eq!(research_plan_length(&st), 2);

    // PIENIADZ_MNOZNIK i technologia pieniadza z tabeli: teraz "Garncarstwo" daje mnoznik 77.
    st.nauka = 100000.0;
    st.player_research_target_id = Some("Garncarstwo".to_owned());
    let r = rules
        .research_step(&mut st, &tl, None, Difficulty::Normal)
        .unwrap();
    let garn = r.completed.iter().find(|c| c.id == "Garncarstwo").unwrap();
    assert!(garn.pieniadz);
    assert_eq!(st.pieniadz_mnoznik, 77);
    // "Waluta" przestala byc technologia pieniadza (jej Uwagi nadal zawieraja igle, wiec sprawdzamy
    // tylko, ze nazwa nie jest juz sama w sobie wystarczajaca).
    let mut waluta = tl
        .iter()
        .find(|t| t.technologia == "Waluta")
        .unwrap()
        .clone();
    waluta.uwagi = None;
    waluta.odblokowuje_budynek = None;
    assert!(!rules.is_money_tech(&waluta));
}

#[test]
fn table_epoch_map_and_sentinels_come_from_data() {
    let web = web();
    let tl = techs(&web["techsets"]["real"]);
    let mut params = parse_player_state_params().unwrap();
    params.numer_epoki.clear();
    params.numer_epoki.insert("kamien".to_owned(), 9);
    params.brak_prereq.push("zzz".to_owned());
    let rules = PlayerRules::new(params, parse_research_costs().unwrap());
    let kamien = tl.iter().find(|t| t.epoka == "Kamień").unwrap();
    let braz = tl.iter().find(|t| t.epoka == "Brąz").unwrap();
    assert_eq!(rules.epoch_number(kamien), Some(9));
    assert_eq!(rules.epoch_number(braz), None);
    let mut t = kamien.clone();
    t.wymaga_prereq = "ZZZ + Rolnictwo".to_owned();
    assert_eq!(rules.parse_prereqs(&t), vec!["Rolnictwo".to_owned()]);
}

#[test]
fn table_edit_of_research_cost_changes_the_step() {
    let web = web();
    let tl = techs(&web["techsets"]["real"]);
    let mut costs = parse_research_costs().unwrap();
    let row = costs
        .wiersze
        .iter_mut()
        .find(|r| r.technologia == "Rolnictwo")
        .unwrap();
    for v in &mut row.wartosci {
        v.koszt = 1;
    }
    let rules = PlayerRules::new(parse_player_state_params().unwrap(), costs);
    let mut st = rules.create_player_state();
    st.nauka = 1.0;
    st.player_research_target_id = Some("Rolnictwo".to_owned());
    let r = rules
        .research_step(&mut st, &tl, None, Difficulty::Hard)
        .unwrap();
    assert_eq!(r.completed.len(), 1);
    assert_eq!(r.completed[0].koszt, 1);
    assert_eq!(st.nauka, 0.0);
}

// ---------------------------------------------------------------------------
// Sciezki bledu (Rust-only, web ich nie ma)
// ---------------------------------------------------------------------------

#[test]
fn error_missing_cost_for_unknown_tempo_and_mode() {
    let web = web();
    let tl = techs(&web["techsets"]["real"]);
    let rules = rules();
    let mut st = rules.create_player_state();
    st.tempo_gry = "nieistniejace".to_owned();
    st.nauka = 100.0;
    let err = rules
        .research_step(&mut st, &tl, None, Difficulty::Normal)
        .unwrap_err();
    assert!(matches!(err, PlayerStateError::MissingResearchCost { .. }));
    assert!(err.to_string().contains("nieistniejace"));

    let mut params = parse_player_state_params().unwrap();
    params.tryb_badan_gracza.remove("hard");
    let rules = PlayerRules::new(params, parse_research_costs().unwrap());
    let err = rules
        .scaled_research_cost(&tl[0], "szybka", Difficulty::Hard)
        .unwrap_err();
    assert_eq!(
        err,
        PlayerStateError::MissingResearchMode {
            difficulty: "hard".to_owned()
        }
    );
}
