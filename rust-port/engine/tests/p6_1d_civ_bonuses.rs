//! P6.1D - wektory z URUCHOMIONEGO weba (`gra/src/game/civ-bonuses.ts`, pin edb8fb56).
//! Wektory: `tests/p6_1d_vectors/web-vectors.json` (generator `gen-p61d-web-vectors.mjs`
//! w katalogu runu R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1). Liczby sa w wektorach TEKSTEM
//! (`String(x)` z JS), bo serde_json bez `float_roundtrip` myli ostatni bit.

use std::sync::OnceLock;

use civ_engine::data::civilizations::{
    parse_civ_matrix, parse_civs, CivMatrixFile, CIVS_JSON, CIV_MATRIX_JSON,
};
use civ_engine::domain::civ_bonuses::{
    apply_multiplier, bonus_applies, building_cost_after_civ_discount, civ_attack_range_multiplier,
    civ_building_cost_discount, civ_combat_stat_multipliers, civ_matrix_bonusy_for_civ_key,
    civ_movement_multiplier, civ_siege_attack_multiplier, civ_wall_defense_multiplier,
    is_combat_modifier_bonus, strip_diacritics, unit_combat_category, unit_matches_cel, BonusValue,
    CivBonusEntry, CivBonusUnitShape, CivCombatContext, CivStatMultipliers, CombatSide,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1d_vectors/web-vectors.json");
const UNITS_JSON: &str = include_str!("../data/units.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn matrix() -> &'static CivMatrixFile {
    static M: OnceLock<CivMatrixFile> = OnceLock::new();
    M.get_or_init(|| parse_civ_matrix().expect("civ-matrix.json parses"))
}

fn fnv1a64(bytes: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in bytes {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

/// Liczba z wektora zapisana tekstem JS (`String(x)`).
fn num(value: &Value) -> f64 {
    value
        .as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("liczba")
}

fn arr(value: &Value) -> &Vec<Value> {
    value.as_array().expect("array")
}

fn entry(e: &Value) -> CivBonusEntry {
    let v = &e["v"];
    let wartosc = if let Some(n) = v.get("n") {
        BonusValue::Number(num(n))
    } else if let Some(l) = v.get("l") {
        BonusValue::List(
            arr(l)
                .iter()
                .map(|x| x.as_str().expect("str").to_owned())
                .collect(),
        )
    } else {
        BonusValue::Text(v["t"].as_str().expect("text").to_owned())
    };
    let opt = |k: &str| e[k].as_str().map(str::to_owned);
    CivBonusEntry {
        typ: e["typ"].as_str().expect("typ").to_owned(),
        cel: e["cel"].as_str().expect("cel").to_owned(),
        wartosc,
        opis: opt("opis"),
        realizuje: opt("realizuje"),
        matrix_param_id: opt("matrixId"),
    }
}

fn entries(list: &Value) -> Vec<CivBonusEntry> {
    arr(list).iter().map(entry).collect()
}

fn unit(u: &Value) -> CivBonusUnitShape {
    CivBonusUnitShape {
        typ_nazwa: u["typNazwa"].as_str().expect("typNazwa").to_owned(),
        rola: u["rola"].as_str().expect("rola").to_owned(),
        missile_attack: u["missile"].as_str().map(|s| s.parse().expect("missile")),
        counter_typ: u["counter"].as_str().map(str::to_owned),
    }
}

fn units() -> Vec<CivBonusUnitShape> {
    arr(&web()["units"]).iter().map(unit).collect()
}

fn ctx(c: &Value) -> CivCombatContext {
    let side = match c["side"].as_str().expect("side") {
        "attacker" => CombatSide::Attacker,
        "defender" => CombatSide::Defender,
        other => panic!("nieznana strona {other}"),
    };
    let mut out = CivCombatContext::new(side);
    out.terrain = c["terrain"].as_str().expect("terrain").to_owned();
    out.is_charge_round = c["charge"].as_bool().expect("charge");
    out.own_territory = c["own"].as_bool().expect("own");
    out.on_wall_walkway = c["wall"].as_bool().expect("wall");
    out.shallow_sea = c["shallow"].as_bool().expect("shallow");
    out
}

fn contexts() -> Vec<CivCombatContext> {
    arr(&web()["contexts"]).iter().map(ctx).collect()
}

fn lists() -> Vec<Vec<CivBonusEntry>> {
    arr(&web()["lists"])
        .iter()
        .map(|l| entries(&l["entries"]))
        .collect()
}

fn hex_bit(hex: &str, index: usize) -> bool {
    let nibble = u8::from_str_radix(&hex[index / 4..index / 4 + 1], 16).expect("hex");
    (nibble >> (3 - (index % 4))) & 1 == 1
}

fn palette() -> Vec<[f64; 6]> {
    arr(&web()["palette"])
        .iter()
        .map(|t| {
            let a = arr(t);
            [
                num(&a[0]),
                num(&a[1]),
                num(&a[2]),
                num(&a[3]),
                num(&a[4]),
                num(&a[5]),
            ]
        })
        .collect()
}

fn mult_array(m: &CivStatMultipliers) -> [f64; 6] {
    [
        m.atk,
        m.obrona,
        m.pancerz,
        m.uderzenie,
        m.ranged_atk,
        m.health,
    ]
}

#[test]
fn embedded_data_is_byte_identical_to_data_used_for_vectors() {
    let fnv = &web()["dataFnv"];
    assert_eq!(fnv["civs"], fnv1a64(CIVS_JSON.as_bytes()));
    assert_eq!(fnv["civMatrix"], fnv1a64(CIV_MATRIX_JSON.as_bytes()));
    assert_eq!(fnv["units"], fnv1a64(UNITS_JSON.as_bytes()));
}

#[test]
fn strip_diacritics_matches_web_function_cut_verbatim() {
    let strip = &web()["strip"];
    for pair in arr(&strip["probes"]) {
        let p = arr(pair);
        let input = p[0].as_str().expect("in");
        assert_eq!(
            strip_diacritics(input),
            p[1].as_str().expect("out"),
            "probka {input:?}"
        );
    }

    // cala BMP (bez surogatow i sylab Hangul)
    let mut buf = String::new();
    for cp in 0u32..=0xFFFF {
        // Hangul (dekompozycja algorytmiczna) i trzy litery z nowszego Unicode niz ICU Node
        // (U+A7CE, U+A7D2, U+A7D4) sa poza domena - to samo pominiecie robi generator wektorow.
        if (0xAC00..=0xD7A3).contains(&cp) || matches!(cp, 0xA7CE | 0xA7D2 | 0xA7D4) {
            continue;
        }
        let Some(ch) = char::from_u32(cp) else {
            continue;
        };
        buf.push_str(&format!("{cp}:{}\n", strip_diacritics(&ch.to_string())));
    }
    assert_eq!(strip["bmpHash"], fnv1a64(buf.as_bytes()), "BMP");

    // wszystkie stringi z civs.json i units.json (XOR niezalezny od kolejnosci)
    fn walk(v: &Value, out: &mut Vec<String>) {
        match v {
            Value::String(s) => out.push(s.clone()),
            Value::Array(a) => a.iter().for_each(|x| walk(x, out)),
            Value::Object(o) => o.values().for_each(|x| walk(x, out)),
            _ => {}
        }
    }
    let mut strings = Vec::new();
    walk(
        &serde_json::from_str(CIVS_JSON).expect("civs"),
        &mut strings,
    );
    walk(
        &serde_json::from_str(UNITS_JSON).expect("units"),
        &mut strings,
    );
    assert_eq!(
        strings.len() as u64,
        strip["dataStringCount"].as_u64().unwrap()
    );
    let mut xor: u64 = 0;
    for s in &strings {
        let h = fnv1a64(format!("{s}\u{0}{}", strip_diacritics(s)).as_bytes());
        xor ^= u64::from_str_radix(&h, 16).unwrap();
    }
    assert_eq!(strip["dataStringXor"], format!("{xor:016x}"));
}

#[test]
fn unit_combat_category_matches_web_for_every_unit() {
    let units = units();
    let cats = arr(&web()["unitCategory"]);
    assert_eq!(units.len(), cats.len());
    assert!(units.len() >= 100);
    for (u, cat) in units.iter().zip(cats) {
        assert_eq!(unit_combat_category(u), cat.as_str().unwrap(), "{u:?}");
    }
    // sonda diakrytykow: kategoria jednostki o nazwie z probki
    for pair in arr(&web()["stripCat"]) {
        let p = arr(pair);
        let u = CivBonusUnitShape {
            typ_nazwa: p[0].as_str().unwrap().to_owned(),
            rola: String::new(),
            missile_attack: None,
            counter_typ: None,
        };
        assert_eq!(
            unit_combat_category(&u),
            p[1].as_str().unwrap(),
            "{:?}",
            p[0]
        );
    }
}

#[test]
fn unit_matches_cel_matches_web_for_every_unit_and_cel() {
    let units = units();
    let cels: Vec<&str> = arr(&web()["cels"])
        .iter()
        .map(|c| c.as_str().unwrap())
        .collect();
    let rows = arr(&web()["matchesCel"]);
    assert_eq!(rows.len(), units.len());
    for (u, row) in units.iter().zip(rows) {
        let row = row.as_str().unwrap();
        assert_eq!(row.len(), cels.len());
        for (cel, expected) in cels.iter().zip(row.chars()) {
            assert_eq!(
                unit_matches_cel(u, cel),
                expected == '1',
                "{u:?} vs cel {cel:?}"
            );
        }
    }
}

#[test]
fn terrain_forest_detection_matches_web() {
    // przejscie przez terrainIsForestOrJungle: wpis macierzy `_teren_las` dziala tylko w lesie/dzungli/gorach
    let b = CivBonusEntry {
        typ: "bonus_walka".to_owned(),
        cel: "piechota".to_owned(),
        wartosc: BonusValue::Number(0.1),
        opis: Some("Matrix:x".to_owned()),
        realizuje: Some("walka".to_owned()),
        matrix_param_id: Some("walka_atak_piechota_teren_las".to_owned()),
    };
    let u = CivBonusUnitShape {
        typ_nazwa: "Wojownik".to_owned(),
        rola: "Wręcz".to_owned(),
        missile_attack: None,
        counter_typ: None,
    };
    for pair in arr(&web()["terrainOut"]) {
        let p = arr(pair);
        let mut c = CivCombatContext::new(CombatSide::Attacker);
        c.terrain = p[0].as_str().unwrap().to_owned();
        assert_eq!(
            bonus_applies(&b, &u, &c),
            p[1].as_i64().unwrap() == 1,
            "teren {:?}",
            p[0]
        );
    }
}

#[test]
fn bonus_applies_and_stat_multipliers_match_web() {
    let units = units();
    let ctxs = contexts();
    let lists = lists();
    let palette = palette();
    let records = arr(&web()["apply"]);
    assert!(records.len() >= 1000);
    let mut nonzero_records = 0;
    for rec in records {
        let list = &lists[rec["list"].as_u64().unwrap() as usize];
        let u = &units[rec["unit"].as_u64().unwrap() as usize];
        let bits = rec["bits"].as_str().unwrap();
        let mult = rec["mult"].as_str().unwrap();
        assert_eq!(mult.len(), ctxs.len() * 2);
        let mut any = false;
        for (ci, c) in ctxs.iter().enumerate() {
            if list.len() == 1 {
                assert_eq!(
                    bonus_applies(&list[0], u, c),
                    hex_bit(bits, ci),
                    "list {} ctx {ci}",
                    rec["list"]
                );
            }
            let idx = usize::from_str_radix(&mult[ci * 2..ci * 2 + 2], 16).unwrap();
            let expected = palette[idx];
            let got = mult_array(&civ_combat_stat_multipliers(list, u, c));
            assert_eq!(
                got, expected,
                "list {} unit {} ctx {ci}",
                rec["list"], rec["unit"]
            );
            any |= expected.iter().any(|x| *x != 0.0);
        }
        nonzero_records += usize::from(any);
    }
    // REPIN-LOGIKA-CIV-Q1 r2: pin 91dc998a - wektor ma 106 z 1026 zapisow z niezerowym mnoznikiem
    // (prog > 300 kodyfikowal edb8fb56). Porownania per rekord powyzej bez zmian; liczba jest
    // dokladna, wiec test nie jest pusty i nie slabnie wzgledem poprzedniej asercji.
    assert_eq!(nonzero_records, 106, "niezerowych: {nonzero_records}");
}

#[test]
fn bonus_applies_per_entry_matches_web_for_multi_entry_lists() {
    let units = units();
    let ctxs = contexts();
    let lists = lists();
    let recs = arr(&web()["applyEntries"]);
    assert!(!recs.is_empty());
    for rec in recs {
        let list = &lists[rec["list"].as_u64().unwrap() as usize];
        let u = &units[rec["unit"].as_u64().unwrap() as usize];
        let rows = arr(&rec["rows"]);
        assert_eq!(rows.len(), list.len());
        for (b, row) in list.iter().zip(rows) {
            let row = row.as_str().unwrap();
            for (ci, c) in ctxs.iter().enumerate() {
                assert_eq!(bonus_applies(b, u, c), hex_bit(row, ci), "ctx {ci}");
            }
        }
    }
}

#[test]
fn empty_bonus_list_gives_zero_multipliers() {
    let u = &units()[0];
    let got = civ_combat_stat_multipliers(&[], u, &CivCombatContext::new(CombatSide::Attacker));
    assert_eq!(got, CivStatMultipliers::default());
    let expected: Vec<f64> = arr(&web()["undefinedMult"]).iter().map(num).collect();
    assert_eq!(mult_array(&got).to_vec(), expected);
}

#[test]
fn matrix_bonusy_match_web_for_every_civ_key_variant() {
    let recs = arr(&web()["matrixBonusy"]);
    assert!(recs.len() >= 40);
    let mut total_entries = 0;
    for rec in recs {
        let key = rec["civKey"].as_str().unwrap();
        let expected = entries(&rec["entries"]);
        total_entries += expected.len();
        assert_eq!(
            civ_matrix_bonusy_for_civ_key(matrix(), key),
            expected,
            "klucz {key:?}"
        );
    }
    assert!(total_entries > 50, "wpisow: {total_entries}");
}

#[test]
fn movement_range_siege_wall_multipliers_match_web() {
    let units = units();
    let lists = lists();
    let recs = arr(&web()["mults"]);
    assert!(recs.len() >= 1000);
    let mut non_unit = 0;
    for rec in recs {
        let list = &lists[rec["list"].as_u64().unwrap() as usize];
        let u = &units[rec["unit"].as_u64().unwrap() as usize];
        assert_eq!(civ_attack_range_multiplier(list, u), num(&rec["range"]));
        assert_eq!(civ_siege_attack_multiplier(list, u), num(&rec["siege"]));
        assert_eq!(civ_wall_defense_multiplier(list, u), num(&rec["wall"]));
        assert_eq!(
            civ_movement_multiplier(list, u, "", false),
            num(&rec["movementDefault"])
        );
        for (key, value) in rec["movement"].as_object().unwrap() {
            let (terrain, shallow) = key.split_once('|').unwrap();
            let got = civ_movement_multiplier(list, u, terrain, shallow == "1");
            assert_eq!(got, num(value), "ruch {key}");
            non_unit += usize::from(got != 1.0);
        }
    }
    assert!(
        non_unit > 20,
        "niejednostkowych mnoznikow ruchu: {non_unit}"
    );
}

#[test]
fn building_cost_discount_matches_web() {
    let recs = arr(&web()["discount"]);
    assert!(recs.len() >= 20);
    let mut capped = false;
    for rec in recs {
        let list = entries(&rec["entries"]);
        let disc = civ_building_cost_discount(&list);
        assert_eq!(disc, num(&rec["disc"]), "{}", rec["name"]);
        capped |= disc > 0.0;
        for pair in arr(&rec["costs"]) {
            let p = arr(pair);
            assert_eq!(
                building_cost_after_civ_discount(num(&p[0]), &list),
                num(&p[1]),
                "{} koszt {}",
                rec["name"],
                p[0]
            );
        }
    }
    assert!(capped);
    let u = &web()["discountUndefined"];
    assert_eq!(civ_building_cost_discount(&[]), num(&u["disc"]));
    assert_eq!(building_cost_after_civ_discount(10.0, &[]), num(&u["cost"]));
}

#[test]
fn is_combat_modifier_bonus_matches_web() {
    let lists = lists();
    for rec in arr(&web()["combatMod"]) {
        let list = &lists[rec["list"].as_u64().unwrap() as usize];
        let bits = rec["bits"].as_str().unwrap();
        assert_eq!(bits.len(), list.len());
        for (b, bit) in list.iter().zip(bits.chars()) {
            assert_eq!(is_combat_modifier_bonus(b), bit == '1', "{b:?}");
        }
    }
}

#[test]
fn apply_multiplier_matches_web() {
    for row in arr(&web()["applyMul"]) {
        let r = arr(row);
        assert_eq!(apply_multiplier(num(&r[0]), num(&r[1])), num(&r[2]));
    }
}

#[test]
fn real_civs_bonuses_convert_without_loss() {
    // wpisy z civs.json -> CivBonusEntry (From<&BonusyItem>) zgodne z wpisami uzytymi w wektorach
    let civs = parse_civs().expect("civs");
    let lists = lists();
    let names: Vec<&str> = arr(&web()["lists"])
        .iter()
        .map(|l| l["name"].as_str().unwrap())
        .collect();
    let mut checked = 0;
    for civ in &civs.cywilizacje {
        // Web 91dc998a: brak klucza `bonusy` = None = pusta lista (civ-bonuses.ts `bonusy ?? []`).
        let want: Vec<CivBonusEntry> = civ
            .bonusy
            .iter()
            .flatten()
            .map(CivBonusEntry::from)
            .collect();
        let name = format!("{}:real", civ.ikona_id);
        let idx = names.iter().position(|n| *n == name);
        // listy identyczne co do tresci sa deduplikowane w wektorach - wtedy szukamy rownej tresci
        let found = match idx {
            Some(i) => lists[i] == want,
            None => lists.contains(&want),
        };
        assert!(found, "brak odpowiednika dla {name}");
        checked += want.len();
    }
    // REPIN-DANE-Q1 r2: pin 91dc998a - civs.json nie ma wpisow bonusy (stary prog >= 40 dotyczyl edb8fb56).
    assert_eq!(checked, 0, "wpisow bonusy w civs.json 91dc998a");
}
