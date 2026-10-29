//! Test R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1: sześć plików JSON jednostek/walki
//! parsuje się do struktur `#[derive(Deserialize)]` z `src/data/units_combat.rs`.
//! Modul ladowany przez `#[path]` (lib.rs swiadomie nietkniety w tym temacie).
//! Liczby kontrolne (75, 17, 7) liczone sa niezaleznie z surowego `serde_json::Value`,
//! a nie przepisywane z dokumentacji.

#[path = "../src/data/units_combat.rs"]
mod units_combat;

use serde_json::Value;
use units_combat::*;

fn raw(json: &str) -> Value {
    serde_json::from_str(json).expect("raw JSON must be valid")
}

#[test]
fn units_parses_and_spot_checks() {
    let units = parse_units().expect("units.json must parse");
    let raw_units = raw(UNITS_JSON);
    let raw_len = raw_units.as_array().expect("units.json is an array").len();
    assert_eq!(
        units.len(),
        raw_len,
        "record count must match raw JSON array"
    );
    assert_eq!(units.len(), 75);

    let mut names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
    names.sort_unstable();
    names.dedup();
    assert_eq!(names.len(), 75, "unit names must be unique");

    let epoki_kamien = units.iter().filter(|u| u.epoka == "Kamień").count();
    let epoki_braz = units.iter().filter(|u| u.epoka == "Brąz").count();
    let epoki_zelazo = units.iter().filter(|u| u.epoka == "Żelazo").count();
    println!(
        "SPOT units count={} epoki Kamien={} Braz={} Zelazo={}",
        units.len(),
        epoki_kamien,
        epoki_braz,
        epoki_zelazo
    );
    // Web 91dc998a: Rydwan (woly) przeniesiony Braz -> Kamien (units.json, zmierzone: 11/39/25; pin edb8fb56: 10/40/25).
    assert_eq!(epoki_kamien, 11);
    assert_eq!(epoki_braz, 39);
    assert_eq!(epoki_zelazo, 25);

    let w = &units[0];
    println!(
        "SPOT units[0]={} koszt={} surowiec={:?} ilosc={} atak={} fieldPower={} health={}",
        w.jednostka,
        w.pieniadz_koszt,
        w.surowiec,
        w.surowiec_ilosc,
        w.atak,
        w.field_power,
        w.health_lc
    );
    assert_eq!(w.jednostka, "Wojownik");
    assert_eq!(w.pieniadz_koszt, 5);
    assert_eq!(w.surowiec.as_deref(), Some("Drewno"));
    assert_eq!(w.surowiec_ilosc, 13);
    assert_eq!(w.atak, 6);
    assert_eq!(w.field_power, 27.0);
    assert_eq!(w.health_lc, 22);
    assert_eq!(w.morale_ucieczki, Some(22));

    let taran = units
        .iter()
        .find(|u| u.jednostka == "Taran")
        .expect("Taran present");
    println!(
        "SPOT Taran siege_power={:?} wall_attack={:?}",
        taran.siege_power, taran.wall_attack
    );
    assert_eq!(taran.siege_power, Some(85));
    assert_eq!(units.iter().filter(|u| u.siege_power.is_some()).count(), 4);
}

#[test]
fn combat_params_parses_and_spot_checks() {
    let f = parse_combat_params().expect("combat-params.json must parse");
    println!(
        "SPOT combat macierz_v2.hit_base={} counter_multiplier={} oblezenie.hill_defense_mult={}",
        f.macierz_v2.hit_base, f.counter_multiplier, f.oblezenie.hill_defense_mult
    );
    assert_eq!(f.macierz_v2.hit_base, 35);
    assert_eq!(f.macierz_v2.pancerz_divisor, 200);
    assert_eq!(f.tw_v3.hit_base, 40);
    assert_eq!(f.ss5l_legacy.max_rounds, 30);
    assert_eq!(f.counter_multiplier, 1.5);
    assert_eq!(f.river_attack_mult, 0.75);
    assert_eq!(f.brod.kara_atak, 0.25);
    assert_eq!(f.oblezenie.hill_defense_mult, 1.5);
    assert_eq!(f.oblezenie.mountain_defense_mult, 1.75);
    assert_eq!(f.oblezenie.siege_max_rounds, 30);
    assert_eq!(f.siege_ai.t2_max_wait_turns, 5);
    assert_eq!(f.unit_power.hp_siege_divisor, 10);
    assert_eq!(f.battle_loot.recruit_cost_pct, 100);
    assert_eq!(f.morale_przewaga_mocy.sufit_proc, 65);
}

#[test]
fn terrain_combat_parses_and_spot_checks() {
    let rows = parse_terrain_combat().expect("terrain-combat.json must parse");
    let raw_len = raw(TERRAIN_COMBAT_JSON).as_array().expect("array").len();
    assert_eq!(rows.len(), raw_len);
    assert_eq!(rows.len(), 7);
    let gory = rows
        .iter()
        .find(|r| r.teren == "Góry")
        .expect("Góry present");
    println!(
        "SPOT terrain-combat rows={} gory.bonus_obrona={} gory.kawaleria={}",
        rows.len(),
        gory.bonus_obrona,
        gory.kawaleria_rydwan
    );
    assert_eq!(gory.bonus_obrona, "+75%");
    assert_eq!(rows[0].teren, "Płaskie (równina/łąka)");
    assert_eq!(rows[0].koszt_wejscia_ruch, "1");
}

#[test]
fn counters_parses_and_spot_checks() {
    let rules = parse_counters().expect("counters.json must parse");
    let raw_len = raw(COUNTERS_JSON).as_array().expect("array").len();
    assert_eq!(rules.len(), raw_len);
    assert_eq!(rules.len(), 17);
    let first = &rules[0];
    println!(
        "SPOT counters rules={} [0]={}->{} {} {} {}",
        rules.len(),
        first.typ_atakujacy,
        first.cel_typ,
        first.bonus,
        first.rodzaj_atak_obrona,
        first.status
    );
    assert_eq!(first.typ_atakujacy, "Spearman");
    assert_eq!(first.cel_typ, "Mount");
    assert_eq!(first.bonus, "+50%");
    assert_eq!(first.rodzaj_atak_obrona, "Atak");
    let flank = rules
        .iter()
        .find(|r| r.bonus == "−50%")
        .expect("flank rule present");
    assert_eq!(flank.rodzaj_atak_obrona, "Obrona");
}

#[test]
fn auto_battle_params_parses_and_spot_checks() {
    let f = parse_auto_battle_params().expect("auto-battle-params.json must parse");
    println!(
        "SPOT auto-battle kalibracja={} L_MAX={} p_atk={} kroki={}",
        f.kalibracja,
        f.straty.l_max,
        f.straty.p_atk,
        f._maciej_kroki.len()
    );
    assert_eq!(f.kalibracja, "v2b-2026-06-30");
    assert_eq!(f.straty.l_max, 0.42);
    assert_eq!(f.straty.l_min, 0.05);
    assert_eq!(f.straty.p_atk, 1.2);
    assert_eq!(f.straty.remis_pct, 0.4);
    assert_eq!(f._maciej_kroki.len(), 3);
}

#[test]
fn power_params_parses_and_spot_checks() {
    let f = parse_power_params().expect("power-params.json must parse");
    println!(
        "SPOT power jednostka_wojskowa.pkt={} powerOczekiwany={} tech_zbadane.pkt={} mnoznik.ep10={}",
        f.skladniki.jednostka_wojskowa.pkt,
        f.kalibracja.power_oczekiwany,
        f.skladniki.tech_zbadane.pkt,
        f.mnoznik_epoki.ep10
    );
    assert_eq!(f.skladniki.jednostka_wojskowa.pkt, 2.5);
    assert_eq!(f.skladniki.rekrut_ekw_jednostki.pkt, 10.0);
    assert_eq!(f.skladniki.tech_zbadane.pkt, 80.0);
    assert_eq!(f.kalibracja.power_oczekiwany, 4655);
    assert_eq!(f.mnoznik_epoki.ep1, 1);
    assert_eq!(f.mnoznik_epoki.ep10, 1);
    assert_eq!(f._nazewnictwo.en, "Power");
    assert_eq!(
        f._formuly.rekrut_ekw,
        "floor(rekruci_biezacy / koszt_werbu[epoka])"
    );
}
