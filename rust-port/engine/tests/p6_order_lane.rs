//! R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1 (pin weba 23dd158e9; wektory zregenerowane z uruchomionego weba tego pinu (REPIN-VECTORS-POSTMERGE-Q1)): PETLA PORZADKU (`orderMultMap`) wobec URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1/gen-p6-order-lane-vectors.mjs`).
//!
//! Testy: sonda floatow, `orderEffectsWithCivMatrix`, post-capture-law, `makeRng` (culture-religion.ts:974),
//! `countLawGarrisonOnCityHex`, `isOwnerAtWarInRelations`, kultura, religia (`convertViaTemple`, `spreadReligion`),
//! presja, `civReligionForKey`, PELNA petla porzadku (700 scenariuszy, bunt z seeded RNG) i e2e: stan -> porzadek ->
//! `orderMultMap` -> `run_economy_tick_for_game` (`tests/p6_order_lane_e2e.rs`).

use std::collections::{BTreeMap, BTreeSet, HashSet};

use civ_engine::data::buildings_tech::parse_buildings;
use civ_engine::data::economy_society::parse_citizen_resource_upkeep;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::order_effects_culture::*;
use civ_engine::domain::order_effects_lane::*;
use civ_engine::domain::society_breakdown::{
    evaluate_order_from_breakdown, HappinessBreakdownInput, LawBreakdownInput,
};
use civ_engine::domain::territory::ReligionState;
use civ_engine::domain::turn_economy_inputs_native::{StateSources, StateSourcesWorld};
use civ_engine::domain::types::porzadek::{society_params, OrderEffects, OrderTier};
use civ_engine::domain::types::Difficulty;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_order_lane_vectors/order_lane.json");
const CIVS: &str = include_str!("../data/civs.json");

fn vectors() -> Value {
    parse_json_exact(VECTORS)
}

/// Parser JSON z DOKLADNYM parsowaniem liczb (`str::parse::<f64>`): `serde_json` bez `float_roundtrip`
/// parsuje czesc floatow z bledem 1 ULP (sonda `float_probe_*`), a `Cargo.toml` jest poza allowlista.
fn parse_json_exact(text: &str) -> Value {
    struct P<'a> {
        b: &'a [u8],
        i: usize,
    }
    impl P<'_> {
        fn ws(&mut self) {
            while self.i < self.b.len() && matches!(self.b[self.i], b' ' | b'\n' | b'\r' | b'\t') {
                self.i += 1;
            }
        }
        fn val(&mut self) -> Value {
            self.ws();
            match self.b[self.i] {
                b'{' => {
                    self.i += 1;
                    let mut m = serde_json::Map::new();
                    self.ws();
                    if self.b[self.i] == b'}' {
                        self.i += 1;
                        return Value::Object(m);
                    }
                    loop {
                        self.ws();
                        let k = self.string();
                        self.ws();
                        assert_eq!(self.b[self.i], b':');
                        self.i += 1;
                        let v = self.val();
                        m.insert(k, v);
                        self.ws();
                        match self.b[self.i] {
                            b',' => self.i += 1,
                            b'}' => {
                                self.i += 1;
                                return Value::Object(m);
                            }
                            c => panic!("json: oczekiwano , lub }} a jest {}", c as char),
                        }
                    }
                }
                b'[' => {
                    self.i += 1;
                    let mut a = Vec::new();
                    self.ws();
                    if self.b[self.i] == b']' {
                        self.i += 1;
                        return Value::Array(a);
                    }
                    loop {
                        a.push(self.val());
                        self.ws();
                        match self.b[self.i] {
                            b',' => self.i += 1,
                            b']' => {
                                self.i += 1;
                                return Value::Array(a);
                            }
                            c => panic!("json: oczekiwano , lub ] a jest {}", c as char),
                        }
                    }
                }
                b'"' => Value::String(self.string()),
                b't' => {
                    self.i += 4;
                    Value::Bool(true)
                }
                b'f' => {
                    self.i += 5;
                    Value::Bool(false)
                }
                b'n' => {
                    self.i += 4;
                    Value::Null
                }
                _ => {
                    let st = self.i;
                    while self.i < self.b.len()
                        && matches!(
                            self.b[self.i],
                            b'-' | b'+' | b'.' | b'e' | b'E' | b'0'..=b'9'
                        )
                    {
                        self.i += 1;
                    }
                    let t = std::str::from_utf8(&self.b[st..self.i]).unwrap();
                    let f: f64 = t.parse().unwrap_or_else(|_| panic!("json: liczba {t}"));
                    Value::Number(serde_json::Number::from_f64(f).expect("skonczona liczba"))
                }
            }
        }
        fn string(&mut self) -> String {
            assert_eq!(self.b[self.i], b'"');
            self.i += 1;
            let mut out: Vec<u8> = Vec::new();
            loop {
                let c = self.b[self.i];
                self.i += 1;
                match c {
                    b'"' => return String::from_utf8(out).unwrap(),
                    b'\\' => {
                        let e = self.b[self.i];
                        self.i += 1;
                        match e {
                            b'n' => out.push(b'\n'),
                            b'r' => out.push(b'\r'),
                            b't' => out.push(b'\t'),
                            b'b' => out.push(8),
                            b'f' => out.push(12),
                            b'u' => {
                                let hex = |p: &P<'_>, at: usize| {
                                    u32::from_str_radix(
                                        std::str::from_utf8(&p.b[at..at + 4]).unwrap(),
                                        16,
                                    )
                                    .unwrap()
                                };
                                let mut cp = hex(self, self.i);
                                self.i += 4;
                                if (0xD800..0xDC00).contains(&cp) {
                                    assert_eq!(&self.b[self.i..self.i + 2], b"\\u");
                                    let lo = hex(self, self.i + 2);
                                    self.i += 6;
                                    cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
                                }
                                let ch = char::from_u32(cp).unwrap();
                                let mut buf = [0u8; 4];
                                out.extend_from_slice(ch.encode_utf8(&mut buf).as_bytes());
                            }
                            other => out.push(other),
                        }
                    }
                    other => out.push(other),
                }
            }
        }
    }
    let mut p = P {
        b: text.as_bytes(),
        i: 0,
    };
    p.val()
}

fn diff(s: &str) -> Difficulty {
    match s {
        "easy" => Difficulty::Easy,
        "hard" => Difficulty::Hard,
        _ => Difficulty::Normal,
    }
}

fn num(v: &Value) -> f64 {
    v.as_f64()
        .unwrap_or_else(|| panic!("oczekiwano liczby: {v}"))
}

fn opt(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn s(v: &Value) -> String {
    v.as_str().unwrap_or_default().to_string()
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

macro_rules! eqf {
    ($errs:expr, $label:expr, $got:expr, $want:expr) => {{
        let (g, w): (f64, f64) = ($got, $want);
        if !same(g, w) {
            $errs.push(format!("{}: rust={:?} web={:?}", $label, g, w));
        }
    }};
}

fn report(errs: Vec<String>, what: &str) {
    assert!(
        errs.is_empty(),
        "{what}: {} rozbieznosci, pierwsze:\n{}",
        errs.len(),
        errs.iter().take(8).cloned().collect::<Vec<_>>().join("\n")
    );
}

fn rel_state(v: &Value) -> ReligionState {
    ReligionState {
        counts: v["counts"]
            .as_object()
            .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
            .unwrap_or_default(),
    }
}

fn cmp_state(errs: &mut Vec<String>, label: &str, got: &ReligionState, want: &ReligionState) {
    if got.counts.len() != want.counts.len() {
        errs.push(format!(
            "{label}: counts rust={:?} web={:?}",
            got.counts, want.counts
        ));
        return;
    }
    for (k, w) in &want.counts {
        match got.counts.get(k) {
            Some(g) if same(*g, *w) => {}
            other => errs.push(format!("{label}[{k}]: rust={other:?} web={w:?}")),
        }
    }
}

fn pct_map(v: &Value) -> Option<BTreeMap<i64, f64>> {
    v.as_object().map(|o| {
        o.iter()
            .map(|(k, x)| (k.parse::<i64>().unwrap(), num(x)))
            .collect()
    })
}

#[test]
fn float_probe_json_parse_is_bit_exact() {
    let d = vectors();
    let mut bad = 0;
    for p in d["probeBits"].as_array().unwrap() {
        let got = num(&p[0]).to_bits();
        let want = u64::from_str_radix(p[1].as_str().unwrap(), 16).unwrap();
        if got != want {
            bad += 1;
        }
    }
    assert_eq!(
        bad, 0,
        "serde_json parsuje floaty nie-bit-w-bit ({bad}/400)"
    );
}

#[test]
fn order_effects_with_civ_matrix_matches_web() {
    let d = vectors();
    let mut errs = Vec::new();
    for (i, c) in d["effectsCases"].as_array().unwrap().iter().enumerate() {
        let e = &c["eff"];
        let eff = OrderEffects {
            production_mult: num(&e["productionMult"]),
            pieniadz_mult: num(&e["pieniadzMult"]),
            nauka_mult: num(&e["naukaMult"]),
            kultura_mult: num(&e["kulturaMult"]),
            growth_mult: num(&e["growthMult"]),
            trade_mult: num(&e["tradeMult"]),
            revolt_risk: num(&e["revoltRisk"]),
        };
        let m = &c["mods"];
        let mods = CivOrderModifiers {
            porzadek_produkcja_proc: m.get("porzadek_produkcja_proc").map(num),
            porzadek_pieniadz_proc: m.get("porzadek_pieniadz_proc").map(num),
            porzadek_nauka_proc: m.get("porzadek_nauka_proc").map(num),
            porzadek_kultura_proc: m.get("porzadek_kultura_proc").map(num),
            porzadek_wzrost_proc: m.get("porzadek_wzrost_proc").map(num),
        };
        let got = order_effects_with_civ_matrix(&eff, &mods);
        let o = &c["out"];
        eqf!(
            errs,
            format!("{i} prod"),
            got.production_mult,
            num(&o["productionMult"])
        );
        eqf!(
            errs,
            format!("{i} pien"),
            got.pieniadz_mult,
            num(&o["pieniadzMult"])
        );
        eqf!(
            errs,
            format!("{i} trade"),
            got.trade_mult,
            num(&o["tradeMult"])
        );
        eqf!(
            errs,
            format!("{i} nauka"),
            got.nauka_mult,
            num(&o["naukaMult"])
        );
        eqf!(
            errs,
            format!("{i} kult"),
            got.kultura_mult,
            num(&o["kulturaMult"])
        );
        eqf!(
            errs,
            format!("{i} wzrost"),
            got.growth_mult,
            num(&o["growthMult"])
        );
        eqf!(
            errs,
            format!("{i} risk"),
            got.revolt_risk,
            num(&o["revoltRisk"])
        );
    }
    report(errs, "orderEffectsWithCivMatrix");
}

fn post_fields(c: &Value) -> PostCaptureLawFields {
    PostCaptureLawFields {
        post_capture_law_turns_remaining: c.get("postCaptureLawTurnsRemaining").map(num),
        was_rebellion_reconquest: c
            .get("wasRebellionReconquest")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        rebel_previous_owner_id: c.get("rebelPreviousOwnerId").map(|x| num(x) as i64),
        rebel_protection_turns_remaining: c.get("rebelProtectionTurnsRemaining").map(num),
    }
}

fn tier_str(t: OrderTier) -> &'static str {
    match t {
        OrderTier::Unrest => "unrest",
        OrderTier::Neutral => "neutral",
        OrderTier::Order => "order",
    }
}

#[test]
fn post_capture_law_matches_web() {
    let d = vectors();
    let society = society_params();
    let mut errs = Vec::new();
    for (i, c) in d["postCases"].as_array().unwrap().iter().enumerate() {
        let dif = diff(c["difficulty"].as_str().unwrap());
        let h = &c["h"];
        let hi = HappinessBreakdownInput {
            difficulty: Some(dif),
            era: Some(num(&h["era"])),
            population: num(&h["population"]),
            building_zadowolenie: num(&h["buildingZadowolenie"]),
            ha_rel: h.get("haRel").map(num),
            own_religion_share: None,
            ha_wealth: h.get("haWealth").map(num),
            ha_cuda: h.get("haCuda").map(num),
            podzial_procent_luksus: h.get("podzialHandlu").map(|p| num(&p["procentLuksus"])),
            at_war: h["atWar"].as_bool().unwrap(),
            own_culture_share: h.get("ownCultureShare").map(num),
            stolica_easy_bonus: h["stolicaEasyBonus"].as_bool().unwrap(),
            citizen_resource_happiness_delta: h.get("citizenResourceHappinessDelta").map(num),
        };
        let l = &c["l"];
        let li = LawBreakdownInput {
            difficulty: Some(dif),
            era: Some(num(&l["era"])),
            population: Some(num(&l["population"])),
            garnizon_count: num(&l["garnizonCount"]),
            has_dom_starszyzny: l["hasDomStarszyzny"].as_bool().unwrap(),
            has_dwor_zarzadcy: l["hasDworZarzadcy"].as_bool().unwrap(),
            has_pretorium: l["hasPretorium"].as_bool().unwrap(),
            has_sad: l["hasSad"].as_bool().unwrap(),
            has_trybunal: l["hasTrybunal"].as_bool().unwrap(),
            has_palac: false,
            palac_tier: opt(&l["palacTier"]).map(|t| t as u8),
            stolica_easy_bonus: l["stolicaEasyBonus"].as_bool().unwrap(),
            has_garnizon_budynek: l["hasGarnizonBudynek"].as_bool().unwrap(),
        };
        let ord = evaluate_order_from_breakdown(&hi, &li, Some(society), dif);
        let o = &c["ord"];
        eqf!(errs, format!("{i} ord.por"), ord.por_pct, num(&o["porPct"]));
        eqf!(
            errs,
            format!("{i} ord.prawNetto"),
            ord.prawo.netto,
            num(&o["prawNetto"])
        );
        let f = post_fields(&c["city"]);
        let ov = apply_post_capture_law_override(&ord, &f, Some(society), dif);
        let w = &c["ov"];
        eqf!(errs, format!("{i} ov.por"), ov.por_pct, num(&w["porPct"]));
        eqf!(
            errs,
            format!("{i} ov.prawPct"),
            ov.prawo.praw_pct,
            num(&w["prawPct"])
        );
        eqf!(
            errs,
            format!("{i} ov.prawNetto"),
            ov.prawo.netto,
            num(&w["prawNetto"])
        );
        if tier_str(ov.tier) != w["tier"].as_str().unwrap() {
            errs.push(format!("{i} ov.tier {:?} vs {}", ov.tier, w["tier"]));
        }
        if ov.band_label != w["bandLabel"].as_str().unwrap() {
            errs.push(format!(
                "{i} ov.bandLabel {} vs {}",
                ov.band_label, w["bandLabel"]
            ));
        }
        if ov.prawo.lines.len() as f64 != num(&w["nLines"]) {
            errs.push(format!(
                "{i} ov.nLines {} vs {}",
                ov.prawo.lines.len(),
                w["nLines"]
            ));
        }
        let fl = &w["firstLine"];
        if !fl.is_null() {
            if ov.prawo.lines[0].id != s(&fl["id"]) || ov.prawo.lines[0].label != s(&fl["label"]) {
                errs.push(format!("{i} firstLine {:?} vs {fl}", ov.prawo.lines[0]));
            }
            eqf!(
                errs,
                format!("{i} firstLine.value"),
                ov.prawo.lines[0].value,
                num(&fl["value"])
            );
        } else if !ov.prawo.lines.is_empty() {
            errs.push(format!(
                "{i} firstLine: web brak, rust {:?}",
                ov.prawo.lines[0]
            ));
        }
        let e = &w["effects"];
        eqf!(
            errs,
            format!("{i} ov.prod"),
            ov.effects.production_mult,
            num(&e["productionMult"])
        );
        eqf!(
            errs,
            format!("{i} ov.risk"),
            ov.effects.revolt_risk,
            num(&e["revoltRisk"])
        );
        eqf!(
            errs,
            format!("{i} ov.growth"),
            ov.effects.growth_mult,
            num(&e["growthMult"])
        );
        if is_post_capture_law_active(&f) != c["active"].as_bool().unwrap() {
            errs.push(format!("{i} active"));
        }
        // tick / mark
        let mut t = f;
        tick_post_capture_law_end_of_turn(&mut t);
        let tw = &c["tickPost"];
        if t.post_capture_law_turns_remaining != tw.get("postCaptureLawTurnsRemaining").map(num) {
            errs.push(format!(
                "{i} tickPost.turns {:?} vs {tw}",
                t.post_capture_law_turns_remaining
            ));
        }
        if t.was_rebellion_reconquest
            != tw
                .get("wasRebellionReconquest")
                .and_then(Value::as_bool)
                .unwrap_or(false)
        {
            errs.push(format!("{i} tickPost.reconquest"));
        }
        let mut r = post_fields(&c["tickRebel"]["before"]);
        tick_rebel_protection_end_of_turn(&mut r);
        if r.rebel_protection_turns_remaining
            != c["tickRebel"]["after"]
                .get("rebelProtectionTurnsRemaining")
                .map(num)
        {
            errs.push(format!("{i} tickRebel {:?} vs {}", r, c["tickRebel"]));
        }
        let mut m = PostCaptureLawFields::default();
        mark_city_rebellion_started(&mut m, num(&c["mark"]["ownerId"]) as i64);
        if m.rebel_previous_owner_id != Some(num(&c["mark"]["rebelPreviousOwnerId"]) as i64)
            || m.rebel_protection_turns_remaining
                != Some(num(&c["mark"]["rebelProtectionTurnsRemaining"]))
        {
            errs.push(format!("{i} mark"));
        }
    }
    report(errs, "post-capture-law");
}

#[test]
fn make_rng_matches_web_including_zero_seed() {
    let d = vectors();
    let mut errs = Vec::new();
    for c in d["rngCases"].as_array().unwrap() {
        let seed = num(&c["seed"]);
        let mut g = make_rng(seed);
        for (k, w) in c["seq"].as_array().unwrap().iter().enumerate() {
            eqf!(errs, format!("seed {seed} #{k}"), g.next_f64(), num(w));
        }
    }
    report(errs, "makeRng");
}

#[test]
fn law_garrison_and_war_match_web() {
    let d = vectors();
    let mut errs = Vec::new();
    for (i, c) in d["garrCases"].as_array().unwrap().iter().enumerate() {
        let units: Vec<LawGarrisonUnit> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| LawGarrisonUnit {
                owner_id: num(&u["ownerId"]) as i64,
                q: num(&u["q"]),
                r: num(&u["r"]),
                oblega: u["oblegaCityId"].as_str().is_some_and(|x| !x.is_empty()),
            })
            .collect();
        let got =
            count_law_garrison_on_city_hex(&units, num(&c["q"]), num(&c["r"]), num(&c["o"]) as i64);
        eqf!(errs, format!("garr {i}"), got, num(&c["out"]));
    }
    for (i, c) in d["warCases"].as_array().unwrap().iter().enumerate() {
        let rel: Vec<(String, bool)> = c["rel"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| (s(&r[0]), r[1].as_bool().unwrap()))
            .collect();
        let got = is_owner_at_war_in_relations(num(&c["o"]) as i64, &rel);
        if got != c["out"].as_bool().unwrap() {
            errs.push(format!("war {i}: {rel:?} o={} rust={got}", c["o"]));
        }
    }
    report(errs, "garrison/war");
}

fn culture_entries(p: &CultureParams) -> Vec<(&'static str, f64)> {
    vec![
        ("progZasieg1", p.prog_zasieg_1),
        ("progZasieg2", p.prog_zasieg_2),
        ("progZasieg3", p.prog_zasieg_3),
        ("zadowolenie100", p.zadowolenie_100),
        ("zadowolenie75", p.zadowolenie_75),
        ("zadowolenie50", p.zadowolenie_50),
        ("karaLt50", p.kara_lt_50),
        ("karaLt25", p.kara_lt_25),
        ("konwersjaBaza", p.konwersja_baza),
        ("konwersjaSwiatynia", p.konwersja_swiatynia),
        ("konwersjaAmfiteatr", p.konwersja_amfiteatr),
        ("konwersjaBiblioteka", p.konwersja_biblioteka),
        ("konwersjaPalac", p.konwersja_palac),
        ("konwersjaStela", p.konwersja_stela),
        ("konwersjaSad", p.konwersja_sad),
        ("konwersjaLaznia", p.konwersja_laznia),
        ("konwersjaCapTura", p.konwersja_cap_tura),
    ]
}

fn religion_entries(p: &ReligionParams) -> Vec<(&'static str, f64)> {
    vec![
        ("progDominacjiPct", p.prog_dominacji_pct),
        ("szybkoscSzerzeniaBazowa", p.szybkosc_szerzenia_bazowa),
        ("swiatyniaBonusSzerzenia", p.swiatynia_bonus_szerzenia),
        ("szerzenieMaxDystans", p.szerzenie_max_dystans),
        ("zadowolenieDominujaca", p.zadowolenie_dominujaca),
        ("karaObca", p.kara_obca),
        ("karaBrakReligii", p.kara_brak_religii),
        ("konwersjaBazaPct", p.konwersja_baza_pct),
        ("konwersjaSwiatyniaPct", p.konwersja_swiatynia_pct),
        ("konwersjaKregiPct", p.konwersja_kregi_pct),
    ]
}

fn cmp_entries(errs: &mut Vec<String>, label: &str, got: &[(&str, f64)], want: &Value) {
    for (k, v) in want
        .as_array()
        .unwrap()
        .iter()
        .map(|e| (s(&e[0]), num(&e[1])))
    {
        match got.iter().find(|(n, _)| *n == k) {
            Some((_, g)) if same(*g, v) => {}
            other => errs.push(format!("{label}.{k}: rust={other:?} web={v:?}")),
        }
    }
}

#[test]
fn culture_functions_match_web() {
    use civ_engine::domain::terrain::conquest_stability::CultureBuildings;
    let d = vectors();
    let society = society_params();
    let mut errs = Vec::new();
    for (i, c) in d["cultCases"].as_array().unwrap().iter().enumerate() {
        let dif = diff(c["difficulty"].as_str().unwrap());
        let cp = load_culture_params(Some(society), dif);
        cmp_entries(
            &mut errs,
            &format!("{i} cpar"),
            &culture_entries(&cp),
            &c["cpar"],
        );
        let share = opt(&c["share"]);
        let h = &c["has"];
        let has = CultureBuildings {
            has_amfiteatr: h["hasAmfiteatr"].as_bool().unwrap(),
            has_biblioteka: h["hasBiblioteka"].as_bool().unwrap(),
            has_palac: h["hasPalac"].as_bool().unwrap(),
            has_stela: h["hasStela"].as_bool().unwrap(),
            has_sad: h["hasSad"].as_bool().unwrap(),
            has_laznia: h["hasLaznia"].as_bool().unwrap(),
        };
        eqf!(
            errs,
            format!("{i} conv"),
            convert_culture_share(share, &has, &cp),
            num(&c["conv"])
        );
        eqf!(
            errs,
            format!("{i} hap"),
            culture_happiness(share, &cp),
            num(&c["hap"])
        );
        let acc = accumulate_culture(num(&c["kum"]), num(&c["perTurn"]), &cp);
        eqf!(
            errs,
            format!("{i} acc"),
            acc.kultura_skumulowana,
            num(&c["acc"]["kulturaSkumulowana"])
        );
        if acc.poprzedni_zasieg as f64 != num(&c["acc"]["poprzedniZasieg"])
            || acc.nowy_zasieg as f64 != num(&c["acc"]["nowyZasieg"])
            || acc.granica_rozszerzona != c["acc"]["granicaRozszerzona"].as_bool().unwrap()
        {
            errs.push(format!("{i} acc zasieg"));
        }
        eqf!(
            errs,
            format!("{i} accr"),
            culture_accrual_with_modifier(num(&c["perTurn"]), num(&c["modifier"])),
            num(&c["accr"])
        );
        eqf!(
            errs,
            format!("{i} radius"),
            city_border_radius(num(&c["kum"]), &cp) as f64,
            num(&c["radius"])
        );
    }
    report(errs, "kultura");
}

#[test]
fn religion_functions_match_web() {
    let d = vectors();
    let society = society_params();
    let mut errs = Vec::new();
    for (i, c) in d["relCases"].as_array().unwrap().iter().enumerate() {
        let dif = diff(c["difficulty"].as_str().unwrap());
        let rp = load_religion_params(Some(society), dif);
        cmp_entries(
            &mut errs,
            &format!("{i} rpar"),
            &religion_entries(&rp),
            &c["rpar"],
        );
        let sp = religion_params_with_spread_modifier(&rp, num(&c["mod"]));
        cmp_entries(
            &mut errs,
            &format!("{i} sp"),
            &religion_entries(&sp),
            &c["sp"],
        );
        let state = rel_state(&c["state"]);
        let target = c["target"].as_str().unwrap_or("");
        let b = &c["b"];
        let conv = convert_via_temple(
            &state,
            target,
            b["hasSwiatynia"].as_bool().unwrap(),
            b["hasKamienneKregi"].as_bool().unwrap(),
            &rp,
        );
        cmp_state(
            &mut errs,
            &format!("{i} conv.state"),
            &conv.state,
            &rel_state(&c["conv"]["state"]),
        );
        eqf!(
            errs,
            format!("{i} conv.n"),
            conv.converted,
            num(&c["conv"]["converted"])
        );
        let neighbors: Vec<ReligionNeighbor> = c["neighbors"]
            .as_array()
            .unwrap()
            .iter()
            .map(|n| ReligionNeighbor {
                id: s(&n["id"]),
                distance: num(&n["distance"]),
                state: rel_state(&n["state"]),
                population: n.get("population").map(num),
            })
            .collect();
        let events = spread_religion(
            &state,
            &neighbors,
            &sp,
            c["hasSw"].as_bool().unwrap(),
            opt(&c["pressure"]),
            num(&c["seed"]),
        );
        let want = c["spread"].as_array().unwrap();
        if events.len() != want.len() {
            errs.push(format!(
                "{i} spread.len rust={} web={}",
                events.len(),
                want.len()
            ));
        } else {
            for (k, (e, w)) in events.iter().zip(want).enumerate() {
                if e.id != s(&w["id"]) || e.religion != s(&w["religion"]) {
                    errs.push(format!(
                        "{i} spread[{k}] id/religion {} {}",
                        e.id, e.religion
                    ));
                }
                eqf!(
                    errs,
                    format!("{i} spread[{k}].added"),
                    e.added,
                    num(&w["added"])
                );
                cmp_state(
                    &mut errs,
                    &format!("{i} spread[{k}]"),
                    &e.state,
                    &rel_state(&w["state"]),
                );
            }
        }
        let own = c["ownR"].as_str();
        eqf!(
            errs,
            format!("{i} ownShare"),
            religion_own_share(&state, own),
            num(&c["ownShare"])
        );
        eqf!(
            errs,
            format!("{i} hap"),
            religion_happiness(&state, own),
            num(&c["hap"])
        );
        if is_empty_religion_state(Some(&state)) != c["isEmpty"].as_bool().unwrap() {
            errs.push(format!("{i} isEmpty"));
        }
        let stored = if c["resolve"].is_null() {
            None
        } else {
            Some(&state)
        };
        let _ = stored;
    }
    report(errs, "religia");
}

#[test]
fn pressure_and_civ_religion_match_web() {
    let d = vectors();
    let society = society_params();
    let civs: Value = serde_json::from_str(CIVS).unwrap();
    let mut errs = Vec::new();
    for (i, c) in d["pressCases"].as_array().unwrap().iter().enumerate() {
        let cs: Vec<PressureCity> = c["cs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| PressureCity {
                owner_id: num(&x["ownerId"]) as i64,
                kultura_skumulowana: x.get("kulturaSkumulowana").map_or(0.0, num),
                religion_state: x.get("religionState").map(rel_state).unwrap_or_default(),
            })
            .collect();
        let srm: BTreeMap<i64, Option<String>> = c["srm"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| (num(&e[0]) as i64, e[1].as_str().map(str::to_string)))
            .collect();
        let t_owner = num(&c["tOwner"]) as i64;
        let srcs: Vec<i64> = c["srcOwners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| num(x) as i64)
            .collect();
        let rel_pct = pct_map(&c["relPct"]);
        let got = apply_culture_religion_pressure_to_target(
            t_owner,
            opt(&c["tshare"]),
            rel_pct.as_ref(),
            &srcs,
            &cs,
            num(&c["rate"]),
            &srm,
        );
        eqf!(
            errs,
            format!("{i} share"),
            got.own_culture_share,
            num(&c["out"]["ownCultureShare"])
        );
        let want = pct_map(&c["out"]["religionPressurePct"]).unwrap();
        if got.religion_pressure_pct.len() != want.len() {
            errs.push(format!(
                "{i} relPct len {:?} vs {:?}",
                got.religion_pressure_pct, want
            ));
        }
        for (k, w) in &want {
            match got.religion_pressure_pct.get(k) {
                Some(g) if same(*g, *w) => {}
                other => errs.push(format!("{i} relPct[{k}] rust={other:?} web={w}")),
            }
        }
        eqf!(
            errs,
            format!("{i} ect"),
            empire_culture_total(&cs, t_owner),
            num(&c["ect"])
        );
        eqf!(
            errs,
            format!("{i} ert"),
            empire_religion_total(&cs, t_owner, srm.get(&t_owner).and_then(|x| x.as_deref())),
            num(&c["ert"])
        );
    }
    for c in d["civRelCases"].as_array().unwrap() {
        let key = c["key"].as_str();
        let got = civ_religion_for_key(key, Some(society), Some(&civs));
        if got.as_deref() != c["out"].as_str() {
            errs.push(format!("civRel {key:?}: rust={got:?} web={}", c["out"]));
        }
        let got2 = civ_religion_for_key(key, Some(society), None);
        if got2.as_deref() != c["noCivs"].as_str() {
            errs.push(format!(
                "civRel(noCivs) {key:?}: rust={got2:?} web={}",
                c["noCivs"]
            ));
        }
    }
    report(errs, "presja/civReligion");
}

// ------------------------------------------------------------------------------------------
// PELNA petla porzadku
// ------------------------------------------------------------------------------------------

pub struct LaneInputs {
    pub cities: Vec<OrderLaneCity>,
    pub state: OrderLaneState,
    pub built: BTreeMap<String, Vec<String>>,
    pub owner_civ: BTreeMap<i64, String>,
    pub religion_civ: BTreeMap<i64, String>,
    pub econ: BTreeMap<String, OrderLaneEconTick>,
    pub luksus: BTreeMap<String, f64>,
    pub era: BTreeMap<i64, f64>,
    pub tech: BTreeMap<i64, HashSet<String>>,
    pub wonder: BTreeMap<i64, f64>,
    pub units: Vec<LawGarrisonUnit>,
    pub relations: Vec<(String, bool)>,
    pub humans: BTreeSet<i64>,
    pub capital: BTreeMap<i64, String>,
    pub difficulty: Difficulty,
    pub turn: f64,
}

fn lane_inputs(sc: &Value) -> LaneInputs {
    let cities = sc["cities"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| OrderLaneCity {
            id: s(&c["id"]),
            name: s(&c["name"]),
            owner_id: num(&c["ownerId"]) as i64,
            q: num(&c["q"]),
            r: num(&c["r"]),
            population: num(&c["population"]),
            kultura: c.get("kultura").map_or(0.0, num),
            own_culture_share: c.get("ownCultureShare").map(num),
            kultura_own_share: c.get("kulturaOwnShare").map(num),
            religion_pressure_pct: c.get("religionPressurePct").and_then(pct_map),
            rebel_state: c
                .get("rebelState")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            revolt_grace_remaining: c.get("revoltGraceRemaining").and_then(opt_ref),
            post: post_fields(c),
            surowce: c.get("surowce").map(|o| {
                o.as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, x)| (k.clone(), num(x)))
                    .collect()
            }),
        })
        .collect();
    let mut state = OrderLaneState::default();
    for e in sc["cityRelig"].as_array().unwrap() {
        state.city_relig.insert(s(&e[0]), rel_state(&e[1]));
    }
    for e in sc["orderValueMap"].as_array().unwrap() {
        state.order_value_map.insert(s(&e[0]), num(&e[1]));
    }
    let built = sc["built"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_array().unwrap().iter().map(s).collect()))
        .collect();
    let kv = |k: &str| -> BTreeMap<i64, String> {
        sc[k]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| (num(&e[0]) as i64, s(&e[1])))
            .collect()
    };
    let econ = sc["econ"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| {
            let t = &e[1];
            (
                s(&e[0]),
                OrderLaneEconTick {
                    kultura: num(&t["kultura"]),
                    wealth_zadowolenie: num(&t["wealthZadowolenie"]),
                    garncarnia_surplus_zadowolenie: num(&t["garncarniaSurplusZadowolenie"]),
                    ma_spichlerz: t["maSpichlerz"].as_bool().unwrap(),
                    ma_spichlerz_ii: t["maSpichlerzII"].as_bool().unwrap(),
                },
            )
        })
        .collect();
    let by_owner_f = |k: &str| -> BTreeMap<i64, f64> {
        sc[k]
            .as_object()
            .unwrap()
            .iter()
            .map(|(o, v)| (o.parse().unwrap(), num(v)))
            .collect()
    };
    LaneInputs {
        cities,
        state,
        built,
        owner_civ: kv("ownerCivMap"),
        religion_civ: kv("religionCiv"),
        econ,
        luksus: sc["luksus"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), num(v)))
            .collect(),
        era: by_owner_f("era"),
        tech: sc["tech"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(o, v)| {
                (
                    o.parse().unwrap(),
                    v.as_array().unwrap().iter().map(s).collect(),
                )
            })
            .collect(),
        wonder: by_owner_f("wonderZad"),
        units: sc["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| LawGarrisonUnit {
                owner_id: num(&u["ownerId"]) as i64,
                q: num(&u["q"]),
                r: num(&u["r"]),
                oblega: u
                    .get("oblegaCityId")
                    .and_then(Value::as_str)
                    .is_some_and(|x| !x.is_empty()),
            })
            .collect(),
        relations: sc["relations"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| (s(&r[0]), r[1].as_bool().unwrap()))
            .collect(),
        humans: sc["humans"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| num(x) as i64)
            .collect(),
        capital: sc["capitalByOwner"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| (num(&e[0]) as i64, s(&e[1])))
            .collect(),
        difficulty: diff(sc["difficulty"].as_str().unwrap()),
        turn: num(&sc["turn"]),
    }
}

fn opt_ref(v: &Value) -> Option<f64> {
    opt(v)
}

/// Uruchamia petle Rust dla scenariusza; zwraca (miasta po petli, stan, wynik).
/// Macierz cywilizacji z ZALATA wektorow (`matrixPatch`): w danych pinu parametry porzadku/kultury/religii sa wszedzie 0,
/// wiec web uruchomiono na macierzy z niezerowymi wartosciami (generator), a tu nakladamy ta sama latke.
fn patched_matrix() -> &'static civ_engine::domain::civ_matrix::CivMatrixData {
    use std::sync::OnceLock;
    static M: OnceLock<civ_engine::domain::civ_matrix::CivMatrixData> = OnceLock::new();
    M.get_or_init(|| {
        let d = vectors();
        let mut m: Value =
            serde_json::from_str(civ_engine::data::civilizations::CIV_MATRIX_JSON).unwrap();
        let patch = d["matrixPatch"].as_object().unwrap();
        for civ in m["cywilizacje"].as_array_mut().unwrap() {
            let key = civ["ikonaId"].as_str().unwrap().to_string();
            if let Some(p) = patch.get(&key) {
                for (param, v) in p.as_object().unwrap() {
                    civ["params"][param] =
                        Value::Number(serde_json::Number::from_f64(num(v)).unwrap());
                }
            }
        }
        civ_engine::domain::civ_matrix::CivMatrixData::from_json(&m.to_string()).unwrap()
    })
}

pub fn run_rust_lane(inp: &mut LaneInputs, src: Option<&StateSources<'_>>) -> OrderLaneOutput {
    let matrix = patched_matrix().file.clone();
    let buildings = parse_buildings().unwrap();
    let table = parse_citizen_resource_upkeep().unwrap();
    let society = society_params();
    let civs: Value = serde_json::from_str(CIVS).unwrap();
    let era_f = |o: i64| inp.era.get(&o).copied().unwrap_or(1.0);
    let tech_f = |o: i64| inp.tech.get(&o).cloned().unwrap_or_default();
    let rel_f = |o: i64| {
        civ_religion_for_key(
            inp.religion_civ.get(&o).map(String::as_str),
            Some(society),
            Some(&civs),
        )
    };
    let wonder_f = |o: i64| inp.wonder.get(&o).copied().unwrap_or(0.0);
    let luksus_f = |id: &str| inp.luksus.get(id).copied();
    let ctx = OrderLaneCtx {
        difficulty: inp.difficulty,
        turn: inp.turn,
        society: Some(society),
        civs: Some(&civs),
        matrix: &matrix,
        buildings: &buildings,
        citizen_table: &table,
        built_by_city: &inp.built,
        owner_civ_map: &inp.owner_civ,
        econ_tick: &inp.econ,
        owner_era: &era_f,
        owner_tech: &tech_f,
        owner_religion: &rel_f,
        wonder_zadowolenie: &wonder_f,
        podzial_procent_luksus: &luksus_f,
        units: &inp.units,
        relations: &inp.relations,
        human_owner_ids: &inp.humans,
        capital_city_id_by_owner: &inp.capital,
    };
    match src {
        Some(s) => s.order_mult_map(&mut inp.cities, &mut inp.state, &ctx).0,
        None => compute_order_lane(&mut inp.cities, &mut inp.state, &ctx),
    }
}

#[test]
fn full_order_lane_matches_running_web() {
    let d = vectors();
    let mut errs = Vec::new();
    let (mut bunt, mut rebelled) = (0, 0);
    let scenarios = d["scenarios"].as_array().unwrap();
    for sc in scenarios {
        let idx = num(&sc["in"]["idx"]) as i64;
        let mut inp = lane_inputs(&sc["in"]);
        let out = run_rust_lane(&mut inp, None);
        let w = &sc["out"];
        let l = |what: &str| format!("sc{idx} {what}");
        // raporty
        let wr = w["reports"].as_array().unwrap();
        if out.reports.len() != wr.len() {
            errs.push(l("reports.len"));
            continue;
        }
        for (r, x) in out.reports.iter().zip(wr) {
            let lab = format!("sc{idx} {}", r.city_id);
            if r.city_id != s(&x["cityId"]) {
                errs.push(format!("{lab} cityId"));
            }
            eqf!(errs, format!("{lab} porPct"), r.por_pct, num(&x["porPct"]));
            eqf!(errs, format!("{lab} szPct"), r.sz_pct, num(&x["szPct"]));
            eqf!(
                errs,
                format!("{lab} prawPct"),
                r.praw_pct,
                num(&x["prawPct"])
            );
            eqf!(errs, format!("{lab} haKult"), r.ha_kult, num(&x["haKult"]));
            eqf!(errs, format!("{lab} haRel"), r.ha_rel, num(&x["haRel"]));
            eqf!(
                errs,
                format!("{lab} share"),
                r.own_culture_share,
                num(&x["ownCultureShare"])
            );
            if tier_str(r.tier) != x["tier"].as_str().unwrap() {
                errs.push(format!("{lab} tier {:?} vs {}", r.tier, x["tier"]));
            }
            if r.bunt != x["bunt"].as_bool().unwrap() {
                errs.push(format!("{lab} bunt rust={} web={}", r.bunt, x["bunt"]));
            }
            if r.bunt {
                bunt += 1;
            }
            if r.revolt_warning != x["revoltWarning"].as_bool().unwrap() {
                errs.push(format!("{lab} revoltWarning"));
            }
            if r.revolt_grace_turns_left != opt(&x["graceTurnsLeft"]) {
                errs.push(format!(
                    "{lab} graceTurnsLeft {:?} vs {}",
                    r.revolt_grace_turns_left, x["graceTurnsLeft"]
                ));
            }
        }
        // rng, rebelia
        if f64::from(out.rng_draws) != num(&w["rngDraws"]) {
            errs.push(format!(
                "{} rust={} web={}",
                l("rngDraws"),
                out.rng_draws,
                w["rngDraws"]
            ));
        }
        let wreb: Vec<String> = w["rebelled"].as_array().unwrap().iter().map(s).collect();
        rebelled += wreb.len();
        if out.rebelled_city_ids != wreb {
            errs.push(l("rebelled"));
        }
        // mapy
        let om = w["orderMultMap"].as_object().unwrap();
        if inp.state.order_mult_map.len() != om.len() {
            errs.push(l("orderMultMap.len"));
        }
        for (k, x) in om {
            match inp.state.order_mult_map.get(k) {
                None => errs.push(format!("{} brak {k}", l("orderMultMap"))),
                Some(m) => {
                    eqf!(
                        errs,
                        format!("sc{idx} {k} mult.prod"),
                        m.production_mult,
                        num(&x["productionMult"])
                    );
                    eqf!(
                        errs,
                        format!("sc{idx} {k} mult.pien"),
                        m.pieniadz_mult,
                        num(&x["pieniadzMult"])
                    );
                    eqf!(
                        errs,
                        format!("sc{idx} {k} mult.nauka"),
                        m.nauka_mult,
                        num(&x["naukaMult"])
                    );
                    eqf!(
                        errs,
                        format!("sc{idx} {k} mult.kult"),
                        m.kultura_mult,
                        num(&x["kulturaMult"])
                    );
                }
            }
        }
        for (k, x) in w["orderValueMap"].as_object().unwrap() {
            match inp.state.order_value_map.get(k) {
                Some(g) if same(*g, num(x)) => {}
                o => errs.push(format!("sc{idx} orderValueMap[{k}] {o:?} vs {x}")),
            }
        }
        for (k, x) in w["growthMultMap"].as_object().unwrap() {
            match inp.state.growth_mult_map.get(k) {
                Some(g) if same(*g, num(x)) => {}
                o => errs.push(format!("sc{idx} growthMultMap[{k}] {o:?} vs {x}")),
            }
        }
        let wrel = w["cityRelig"].as_object().unwrap();
        if inp.state.city_relig.len() != wrel.len() {
            errs.push(format!(
                "sc{idx} cityRelig.len {} vs {}",
                inp.state.city_relig.len(),
                wrel.len()
            ));
        }
        for (k, x) in wrel {
            match inp.state.city_relig.get(k) {
                Some(g) => cmp_state(
                    &mut errs,
                    &format!("sc{idx} cityRelig[{k}]"),
                    g,
                    &rel_state(x),
                ),
                None => errs.push(format!("sc{idx} cityRelig brak {k}")),
            }
        }
        // miasta
        for (c, x) in inp.cities.iter().zip(w["cities"].as_array().unwrap()) {
            let lab = format!("sc{idx} {}", c.id);
            if c.owner_id != num(&x["ownerId"]) as i64 {
                errs.push(format!("{lab} ownerId"));
            }
            eqf!(
                errs,
                format!("{lab} pop"),
                c.population,
                num(&x["population"])
            );
            eqf!(
                errs,
                format!("{lab} kultura"),
                c.kultura,
                num(&x["kultura"])
            );
            if c.own_culture_share.map(f64::to_bits)
                != x.get("ownCultureShare").map(|v| num(v).to_bits())
                && !(c.own_culture_share == Some(0.0)
                    && x.get("ownCultureShare").map(num) == Some(0.0))
            {
                errs.push(format!(
                    "{lab} ownCultureShare {:?} vs {:?}",
                    c.own_culture_share,
                    x.get("ownCultureShare")
                ));
            }
            if c.kultura_own_share != x.get("kulturaOwnShare").map(num) {
                errs.push(format!("{lab} kulturaOwnShare"));
            }
            if c.religion_pressure_pct != x.get("religionPressurePct").and_then(pct_map) {
                errs.push(format!(
                    "{lab} religionPressurePct {:?} vs {:?}",
                    c.religion_pressure_pct,
                    x.get("religionPressurePct")
                ));
            }
            if c.rebel_state
                != x.get("rebelState")
                    .and_then(Value::as_bool)
                    .unwrap_or(false)
            {
                errs.push(format!("{lab} rebelState"));
            }
            if c.revolt_grace_remaining != x.get("revoltGraceRemaining").and_then(opt_ref) {
                errs.push(format!(
                    "{lab} grace {:?} vs {:?}",
                    c.revolt_grace_remaining,
                    x.get("revoltGraceRemaining")
                ));
            }
            if c.post != post_fields(x) {
                errs.push(format!("{lab} post {:?} vs {x}", c.post));
            }
            let want_sur: Option<BTreeMap<String, f64>> = x.get("surowce").map(|o| {
                o.as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, v)| (k.clone(), num(v)))
                    .collect()
            });
            if c.surowce != want_sur {
                errs.push(format!("{lab} surowce {:?} vs {:?}", c.surowce, want_sur));
            }
        }
        // citizen upkeep
        let wc = w["citizen"].as_array().unwrap();
        if out.citizen_upkeep_by_owner.len() != wc.len() {
            errs.push(l("citizen.len"));
        } else {
            for ((o, v), x) in out.citizen_upkeep_by_owner.iter().zip(wc) {
                if *o != num(&x[0]) as i64 {
                    errs.push(l("citizen.owner"));
                }
                let y = &x[1];
                eqf!(
                    errs,
                    format!("sc{idx} citizen happiness"),
                    v.coverage.happiness_delta as f64,
                    num(&y["happinessDelta"])
                );
                let want_d: BTreeMap<String, f64> = y["deductions"]
                    .as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, v)| (k.clone(), num(v)))
                    .collect();
                if v.deductions != want_d {
                    errs.push(format!(
                        "sc{idx} citizen deductions {:?} vs {:?}",
                        v.deductions, want_d
                    ));
                }
                let want_av: Vec<String> =
                    y["available"].as_array().unwrap().iter().map(s).collect();
                if v.coverage.available != want_av {
                    errs.push(format!("sc{idx} citizen available"));
                }
            }
        }
    }
    assert!(scenarios.len() >= 700, "za malo scenariuszy");
    assert!(bunt >= 30, "za malo buntow w wektorach: {bunt}");
    assert!(rebelled >= 3, "za malo rebelii w wektorach: {rebelled}");
    report(errs, "petla porzadku (700 scenariuszy)");
}

// ------------------------------------------------------------------------------------------
// e2e: stan -> tick 1 (Rust) -> porzadek -> orderMultMap -> tick 2 == web
// ------------------------------------------------------------------------------------------

mod e2e {
    use super::*;
    use civ_engine::data::buildings_tech::parse_wonders;
    use civ_engine::data::terrain_map::parse_terrain_yields;
    use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
    use civ_engine::domain::start_position::Overlay;
    use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
    use civ_engine::domain::turn_economy_inputs_podzial::{
        init_owner_default_podzial_handlu, init_owner_default_podzial_pracy,
        seed_city_owner_defaults_podzial,
    };
    use civ_engine::domain::turn_economy_inputs_state::MennicaZlotoGraceState;
    use civ_engine::domain::turn_economy_loop::{CityLoopExtra, OrderYieldMults};
    use civ_engine::domain::turn_economy_territory::TerrainContext;
    use civ_engine::domain::turn_economy_tick::EconomyTickResult;
    use civ_engine::domain::turn_economy_upkeep::unit_rows_from_json_str;
    use civ_engine::domain::turn_economy_wire::{run_economy_tick_for_game, GameEconomyContext};

    const SOCIETY: &str = include_str!("../data/society-params.json");
    const ECON: &str = include_str!("../data/econ-params.json");
    const UNITS: &str = include_str!("../data/units.json");

    pub fn tick_cities(cities: &[OrderLaneCity]) -> Vec<City> {
        cities
            .iter()
            .map(|c| City {
                id: c.id.clone(),
                owner_id: c.owner_id,
                q: c.q,
                r: c.r,
                name: c.name.clone(),
                population: c.population,
                surowce: c.surowce.clone(),
                ..City::default()
            })
            .collect()
    }

    /// Jeden tick `run_economy_tick_for_game` (te same wejscia dla obu wariantow, rozni sie tylko `order`).
    pub fn run_tick(
        cities: &[OrderLaneCity],
        built: &BTreeMap<String, Vec<String>>,
        owner_civ: &BTreeMap<i64, String>,
        era: &BTreeMap<i64, f64>,
        order: &BTreeMap<String, OrderYieldMults>,
    ) -> (String, EconomyTickResult) {
        let mut cs = tick_cities(cities);
        let mut extras: BTreeMap<String, CityLoopExtra> = BTreeMap::new();
        let mut grace = MennicaZlotoGraceState::default();
        let ty = parse_terrain_yields().expect("terrain-yields");
        let matrix = load_civ_matrix().file.clone();
        let society: Value = serde_json::from_str(SOCIETY).unwrap();
        let econ: Value = serde_json::from_str(ECON).unwrap();
        let unit_rows = unit_rows_from_json_str(UNITS).expect("units");
        let buildings = parse_buildings().expect("buildings");
        let wonders = parse_wonders().expect("wonders");
        let mut hexes = Vec::new();
        for q in 0..=6 {
            for r in 0..=6 {
                hexes.push(BuildHex::new(
                    q,
                    r,
                    terrain_from_web_value("rownina").unwrap(),
                    Overlay::Brak,
                ));
            }
        }
        let map = BuildMap::new(hexes, Vec::new());
        let tctx = TerrainContext {
            map: &map,
            terrain_yields: &ty,
        };
        let zbadane: BTreeSet<String> = BTreeSet::new();
        let mut def_h = init_owner_default_podzial_handlu(&[0], &[]);
        let mut def_p = init_owner_default_podzial_pracy(&[0], &[]);
        for c in &cs {
            seed_city_owner_defaults_podzial(c, &|x| x == 0, &mut def_h, &mut def_p);
        }
        let routes = Vec::new();
        let placed_w = Vec::new();
        let tax = BTreeMap::new();
        let capital = BTreeMap::new();
        let humans: BTreeSet<i64> = [0].into_iter().collect();
        let era_f = |o: i64| era.get(&o).copied().unwrap_or(1.0);
        let tech_f = |_o: i64| BTreeSet::<String>::new();
        let econ_units = Vec::new();
        let native = |_o: i64| false;
        let labels = |_o: i64| Vec::<String>::new();
        let gctx = GameEconomyContext {
            difficulty: "normal",
            player_era: 1.0,
            player_zbadane: &zbadane,
            econ_params: &econ,
            terrain: &tctx,
            matrix: &matrix,
            buildings: &buildings,
            unit_rows: &unit_rows,
            society_params: Some(&society),
            wonders: &wonders,
            built_by_city: built,
            owner_civ_by_owner_id: owner_civ,
            order_mult_by_city: order,
            owner_default_podzial_handlu_by_owner: &def_h,
            owner_default_podzial_pracy_by_owner: &def_p,
            trade_routes: &routes,
            placed_wonders: &placed_w,
            pending_manual_work_tax_by_owner: &tax,
            capital_city_id_by_owner: &capital,
            human_owner_ids: &humans,
            econ_units: &econ_units,
            owner_era: &era_f,
            owner_tech: &tech_f,
            native_zloto_access: &native,
            empire_active_labels: &labels,
        };
        let out = run_economy_tick_for_game(&mut cs, &mut extras, &mut grace, &gctx, None);
        (
            format!("{:?}|{:?}|{:?}|{:?}", out, cs, extras, grace),
            out.tick.result,
        )
    }

    fn econ_rows(
        res: &EconomyTickResult,
        cities: &[OrderLaneCity],
    ) -> BTreeMap<String, OrderLaneEconTick> {
        let mut m = BTreeMap::new();
        for c in cities {
            if let Some(t) = res.per_city.iter().find(|t| t.city_id == c.id) {
                m.insert(
                    c.id.clone(),
                    OrderLaneEconTick {
                        kultura: t.kultura,
                        wealth_zadowolenie: t.wealth_zadowolenie,
                        garncarnia_surplus_zadowolenie: t.garncarnia_surplus_zadowolenie,
                        ma_spichlerz: t.ma_spichlerz,
                        ma_spichlerz_ii: t.ma_spichlerz_ii,
                    },
                );
            }
        }
        m
    }

    /// Faza 1 generatora: zrzut econ z ticku 1 Rust (`P6_OL_ECON_OUT=<plik> cargo test -- --ignored`).
    #[test]
    #[ignore]
    fn dump_tick1_econ_for_web_generator() {
        let path = std::env::var("P6_OL_ECON_OUT").expect("P6_OL_ECON_OUT");
        let d = vectors();
        let mut worlds = Vec::new();
        for w in d["e2e"].as_array().unwrap() {
            let inp = lane_inputs(&w["in"]);
            let era = inp.era.clone();
            let (_, res) = run_tick(
                &inp.cities,
                &inp.built,
                &inp.owner_civ,
                &era,
                &BTreeMap::new(),
            );
            let rows: Vec<String> = inp
                .cities
                .iter()
                .filter_map(|c| {
                    let t = res.per_city.iter().find(|t| t.city_id == c.id)?;
                    Some(format!(
                        "{{\"cityId\":{:?},\"kultura\":{},\"wealthZadowolenie\":{},\"garncarniaSurplusZadowolenie\":{},\"maSpichlerz\":{},\"maSpichlerzII\":{}}}",
                        c.id, t.kultura, t.wealth_zadowolenie, t.garncarnia_surplus_zadowolenie, t.ma_spichlerz, t.ma_spichlerz_ii
                    ))
                })
                .collect();
            worlds.push(format!("[{}]", rows.join(",")));
        }
        std::fs::write(path, format!("[{}]", worlds.join(","))).unwrap();
    }

    #[test]
    fn e2e_state_order_ordermultmap_tick_equals_web() {
        let d = vectors();
        let worlds = d["e2e"].as_array().unwrap();
        assert!(worlds.len() >= 80);
        let mut errs = Vec::new();
        let (mut differs_from_empty, mut nonneutral, mut ran) = (0, 0, 0);
        for (i, w) in worlds.iter().enumerate() {
            assert!(!w["out"].is_null(), "wektory e2e bez fazy 2 generatora");
            let mut inp = lane_inputs(&w["in"]);
            let era = inp.era.clone();
            // 1. tick 1 (stan -> econ), bez mapy porzadku.
            let (_, res1) = run_tick(
                &inp.cities,
                &inp.built,
                &inp.owner_civ,
                &era,
                &BTreeMap::new(),
            );
            inp.econ = econ_rows(&res1, &inp.cities);
            // econ z Rust ticku == econ, z ktorym uruchomiono web (wektor niesie je jako wejscie).
            let web_econ: BTreeMap<String, OrderLaneEconTick> = lane_inputs(&w["in"]).econ;
            if inp.econ != web_econ {
                errs.push(format!(
                    "e2e{i}: econ z ticku 1 Rust != econ wejsciowy weba"
                ));
                continue;
            }
            // 2. porzadek.
            // (przez `StateSources::order_mult_map` - podpiecie zrodla stanu ticku)
            let t_cities = tick_cities(&inp.cities);
            let built_clone = inp.built.clone();
            let kultura = BTreeMap::new();
            let hex_owners = std::collections::HashMap::new();
            let map = BuildMap::new(Vec::new(), Vec::new());
            let world = StateSourcesWorld {
                cities: &t_cities,
                built_by_city: &built_clone,
                placed: &[],
                extra_territory_nodes: &[],
                map: &map,
                hex_owners: &hex_owners,
                kultura_by_city: &kultura,
            };
            let era_src = |o: i64| era.get(&o).copied().unwrap_or(1.0);
            let border = |_p: f64| 0.0;
            let src = StateSources::new(world, &[], &era_src, &border);
            let _out = run_rust_lane(&mut inp, Some(&src));
            // 3. orderMultMap Rust == web.
            let wm = w["out"]["orderMultMap"].as_object().unwrap();
            let mut web_map: BTreeMap<String, OrderYieldMults> = BTreeMap::new();
            for (k, x) in wm {
                web_map.insert(
                    k.clone(),
                    OrderYieldMults {
                        production_mult: num(&x["productionMult"]),
                        pieniadz_mult: num(&x["pieniadzMult"]),
                        nauka_mult: num(&x["naukaMult"]),
                        kultura_mult: num(&x["kulturaMult"]),
                    },
                );
            }
            if inp.state.order_mult_map != web_map {
                errs.push(format!("e2e{i}: orderMultMap Rust != web"));
                continue;
            }
            if inp.state.order_mult_map.values().any(|m| {
                m.production_mult != 1.0
                    || m.pieniadz_mult != 1.0
                    || m.nauka_mult != 1.0
                    || m.kultura_mult != 1.0
            }) {
                nonneutral += 1;
            }
            // 4. tick 2 z mapa Rust == tick 2 z mapa weba (stan po petli, ten sam dla obu).
            let (a, _) = run_tick(
                &inp.cities,
                &inp.built,
                &inp.owner_civ,
                &era,
                &inp.state.order_mult_map,
            );
            let (b, _) = run_tick(&inp.cities, &inp.built, &inp.owner_civ, &era, &web_map);
            if a != b {
                errs.push(format!(
                    "e2e{i}: tick 2 z orderMultMap Rust != tick 2 z orderMultMap weba"
                ));
            }
            // kontrola negatywna: pusta mapa zmienia tick w czesci swiatow.
            let (c, _) = run_tick(
                &inp.cities,
                &inp.built,
                &inp.owner_civ,
                &era,
                &BTreeMap::new(),
            );
            if a != c {
                differs_from_empty += 1;
            }
            ran += 1;
        }
        report(errs, "e2e");
        assert!(ran >= 80, "ran={ran}");
        assert!(
            nonneutral >= 20,
            "za malo swiatow z nieneutralnym porzadkiem: {nonneutral}"
        );
        assert!(
            differs_from_empty >= 15,
            "kontrola negatywna: orderMultMap prawie nie wplywa na tick ({differs_from_empty})"
        );
    }
}
