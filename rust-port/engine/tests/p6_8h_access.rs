//! P6.8H partia A - wektory z URUCHOMIONEGO weba (pin 91dc998a):
//! `tests/p6_8h_vectors/{zloto,cyna,zelazo,society}.json`, wygenerowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1/gen-p6-8h-access-vectors.mjs`
//! (prawdziwy `gra/src/game/*-access.ts` i `society-inputs.ts` z `git archive 91dc998a`).
//!
//! Kodowanie: NaN/Infinity/-Infinity jako napisy; `null` = `undefined`/`null` po stronie TS;
//! `placedImprovements` jako tablica par `[klucz, wartosc]`; `{"bool": x}` = legacy boolean stock.

use std::collections::{BTreeMap, HashMap};

use civ_engine::domain::building_costs::p6_7b::{
    empire_zloto_stock, owner_can_feed_mennica, StockRecord,
};
use civ_engine::domain::resource_access::{
    city_culture_mix_active, city_has_odlewnia_for_cyna, city_has_odlewnia_zelaza,
    clear_city_culture_mix, count_kopalnie_zlota, culture_mix_breakdown,
    deduct_mennica_zloto_drain, empire_has_kopalnia_na_zlozu_cyny,
    empire_has_kopalnia_na_zlozu_zelaza, empire_has_kopalnia_zlota, has_cyna_access,
    has_zelazo_access, owner_has_zloto_stock, placed_improvements_with_zloto_trade_grant,
    resolve_own_culture_share, resolve_owner_zloto_from_stock, CultureMixFields, HexZlozeMap,
    Placed,
};
use serde_json::Value;

const ZLOTO: &str = include_str!("p6_8h_vectors/zloto.json");
const CYNA: &str = include_str!("p6_8h_vectors/cyna.json");
const ZELAZO: &str = include_str!("p6_8h_vectors/zelazo.json");
const SOCIETY: &str = include_str!("p6_8h_vectors/society.json");

fn load(text: &str, section: &str) -> Vec<Value> {
    let root: Value = serde_json::from_str(text).expect("wektor parsuje sie jako JSON");
    assert_eq!(
        root["pin"].as_str(),
        Some("91dc998a5f1b51ad29e0f4785edfd45655445c53"),
        "wektory z innego pinu"
    );
    let cases = root[section]
        .as_object()
        .expect("sekcja istnieje")
        .values()
        .flat_map(|v| v.as_array().expect("tablica przypadkow").clone())
        .collect::<Vec<_>>();
    cases
}

/// Lista przypadkow konkretnej funkcji z sekcji.
fn cases(text: &str, section: &str, func: &str) -> Vec<Value> {
    let root: Value = serde_json::from_str(text).expect("wektor parsuje sie jako JSON");
    root[section][func]
        .as_array()
        .unwrap_or_else(|| panic!("brak funkcji {func} w {section}"))
        .clone()
}

fn assert_minimum(n: usize, what: &str) {
    assert!(n >= 5, "za malo przypadkow dla {what}: {n}");
}

/// Liczba z wektora: `Number` albo napis `NaN`/`Infinity`/`-Infinity`.
fn dec_num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("nieoczekiwana liczba {other}"),
    }
}

fn same(got: f64, want: f64) -> bool {
    (got.is_nan() && want.is_nan()) || got == want
}

/// Wlasnosc przechowywanej wartosci placed (zeby pozyczyc `&str` i `&[String]`).
enum StoredPlaced {
    One(String),
    Many(Vec<String>),
}

struct PlacedStore {
    entries: Vec<(String, StoredPlaced)>,
    present: bool,
}

impl PlacedStore {
    /// `null` -> brak mapy; tablica par -> mapa (kolejnosc zachowana).
    fn from_json(v: &Value) -> Self {
        match v.as_array() {
            None => Self {
                entries: Vec::new(),
                present: false,
            },
            Some(pairs) => Self {
                entries: pairs
                    .iter()
                    .map(|pair| {
                        let key = pair[0].as_str().expect("klucz").to_owned();
                        let value = match &pair[1] {
                            Value::String(s) => StoredPlaced::One(s.clone()),
                            Value::Array(list) => StoredPlaced::Many(
                                list.iter()
                                    .map(|x| x.as_str().expect("warstwa").to_owned())
                                    .collect(),
                            ),
                            other => panic!("nieoczekiwana wartosc placed {other}"),
                        };
                        (key, value)
                    })
                    .collect(),
                present: true,
            },
        }
    }

    fn view(&self) -> Option<Vec<(&str, Placed<'_>)>> {
        self.present.then(|| {
            self.entries
                .iter()
                .map(|(key, value)| {
                    let placed = match value {
                        StoredPlaced::One(s) => Placed::One(s.as_str()),
                        StoredPlaced::Many(list) => Placed::Many(list.as_slice()),
                    };
                    (key.as_str(), placed)
                })
                .collect()
        })
    }
}

fn hexes_from_json(v: &Value) -> Option<HexZlozeMap> {
    let obj = v.as_object()?;
    Some(
        obj.iter()
            .map(|(key, hex)| {
                let zloze = hex.get("zloze").and_then(Value::as_str).map(str::to_owned);
                (key.clone(), zloze)
            })
            .collect(),
    )
}

/// Stock: `null` -> brak; `{"bool": x}` -> brak (legacy boolean); obiekt -> rekord.
fn stock_from_json(v: &Value) -> Option<StockRecord> {
    let obj = v.as_object()?;
    if obj.contains_key("bool") {
        return None;
    }
    Some(
        obj.iter()
            .map(|(k, x)| (k.clone(), dec_num(x)))
            .collect::<BTreeMap<_, _>>(),
    )
}

fn stock_map_matches(got: &StockRecord, want: &Value) -> bool {
    let want = want.as_object().expect("obiekt stock");
    got.len() == want.len()
        && want
            .iter()
            .all(|(k, v)| got.get(k).is_some_and(|g| same(*g, dec_num(v))))
}

fn built_from_json(v: &Value) -> Option<Vec<String>> {
    v.as_array().map(|list| {
        list.iter()
            .map(|x| x.as_str().expect("id").to_owned())
            .collect()
    })
}

// ---------------------------------------------------------------------------------------------
// zloto-access.ts
// ---------------------------------------------------------------------------------------------

#[test]
fn zloto_count_and_has_match_web() {
    let mut n = 0;
    for case in cases(ZLOTO, "zloto", "countKopalnieZlota") {
        let store = PlacedStore::from_json(&case["placed"]);
        let view = store.view();
        let got = count_kopalnie_zlota(view.as_deref());
        assert_eq!(
            got as f64,
            case["out"].as_f64().unwrap(),
            "count {}",
            case["placed"]
        );
        n += 1;
    }
    assert_minimum(n, "countKopalnieZlota");
    for case in cases(ZLOTO, "zloto", "empireHasKopalniaZlota") {
        let store = PlacedStore::from_json(&case["placed"]);
        let view = store.view();
        assert_eq!(
            empire_has_kopalnia_zlota(view.as_deref()),
            case["out"].as_bool().unwrap()
        );
    }
}

#[test]
fn zloto_stock_predicates_match_web() {
    let mut n = 0;
    for case in cases(ZLOTO, "zloto", "empireZlotoStock") {
        let stock = stock_from_json(&case["stock"]);
        let got = empire_zloto_stock(stock.as_ref());
        assert!(
            same(got, dec_num(&case["out"])),
            "empireZlotoStock {}",
            case["stock"]
        );
        n += 1;
    }
    assert_minimum(n, "empireZlotoStock");
    for case in cases(ZLOTO, "zloto", "ownerHasZlotoStock") {
        let stock = stock_from_json(&case["stock"]);
        assert_eq!(
            owner_has_zloto_stock(stock.as_ref()),
            case["out"].as_bool().unwrap()
        );
    }
    for case in cases(ZLOTO, "zloto", "ownerCanFeedMennica") {
        let stock = stock_from_json(&case["stock"]);
        let grace = case["grace"].as_bool().unwrap();
        assert_eq!(
            owner_can_feed_mennica(stock.as_ref(), grace),
            case["out"].as_bool().unwrap()
        );
    }
}

#[test]
fn zloto_resolve_grace_matches_web() {
    for case in cases(ZLOTO, "zloto", "resolveOwnerZlotoFromStock") {
        let stock = stock_from_json(&case["stock"]);
        let owner = case["ownerId"].as_i64().unwrap();
        let got = match case["resolver"].as_str().unwrap() {
            "absent" => resolve_owner_zloto_from_stock(owner, stock.as_ref(), None),
            "true" => {
                let f = |_: i64| true;
                resolve_owner_zloto_from_stock(owner, stock.as_ref(), Some(&f))
            }
            "false" => {
                let f = |_: i64| false;
                resolve_owner_zloto_from_stock(owner, stock.as_ref(), Some(&f))
            }
            other => panic!("tryb {other}"),
        };
        assert_eq!(
            got,
            case["out"].as_bool().unwrap(),
            "resolve {}",
            case["resolver"]
        );
    }
}

#[test]
fn zloto_deduct_matches_web() {
    let mut n = 0;
    for case in cases(ZLOTO, "zloto", "deductMennicaZlotoDrain") {
        let stock = stock_from_json(&case["stock"]).expect("rekord");
        let got = deduct_mennica_zloto_drain(&stock);
        assert!(
            stock_map_matches(&got, &case["out"]),
            "deduct {}",
            case["stock"]
        );
        n += 1;
    }
    assert_minimum(n, "deductMennicaZlotoDrain");
}

#[test]
fn zloto_trade_grant_is_identity() {
    for case in cases(ZLOTO, "zloto", "placedImprovementsWithZlotoTradeGrant") {
        let store = PlacedStore::from_json(&case["placed"]);
        let view = store.view().expect("mapa");
        let got =
            placed_improvements_with_zloto_trade_grant(&view, case["grant"].as_bool().unwrap());
        let got_json: Vec<Value> = got
            .iter()
            .map(|(key, value)| {
                let v = match value {
                    Placed::One(s) => Value::String((*s).to_owned()),
                    Placed::Many(list) => {
                        Value::Array(list.iter().cloned().map(Value::String).collect())
                    }
                };
                Value::Array(vec![Value::String((*key).to_owned()), v])
            })
            .collect();
        assert_eq!(Value::Array(got_json), case["out"]);
    }
}

// ---------------------------------------------------------------------------------------------
// cyna-access.ts / zelazo-access.ts
// ---------------------------------------------------------------------------------------------

fn check_kopalnia(text: &str, func: &str, is_cyna: bool) {
    let mut n = 0;
    for case in cases(text, if is_cyna { "cyna" } else { "zelazo" }, func) {
        let store = PlacedStore::from_json(&case["placed"]);
        let view = store.view();
        let hexes: Option<HexZlozeMap> = hexes_from_json(&case["hexes"]);
        let got = if is_cyna {
            empire_has_kopalnia_na_zlozu_cyny(view.as_deref(), hexes.as_ref())
        } else {
            empire_has_kopalnia_na_zlozu_zelaza(view.as_deref(), hexes.as_ref())
        };
        assert_eq!(
            got,
            case["out"].as_bool().unwrap(),
            "{func} placed={} hexes={}",
            case["placed"],
            case["hexes"]
        );
        n += 1;
    }
    assert_minimum(n, func);
}

#[test]
fn cyna_kopalnia_on_deposit_matches_web() {
    check_kopalnia(CYNA, "empireHasKopalniaNaZlozuCyny", true);
}

#[test]
fn zelazo_kopalnia_on_deposit_matches_web() {
    check_kopalnia(ZELAZO, "empireHasKopalniaNaZlozuZelaza", false);
}

#[test]
fn odlewnia_predicates_match_web() {
    for case in cases(CYNA, "cyna", "cityHasOdlewniaForCyna") {
        let built = built_from_json(&case["built"]).expect("lista");
        assert_eq!(
            city_has_odlewnia_for_cyna(&built),
            case["out"].as_bool().unwrap(),
            "{built:?}"
        );
    }
    for case in cases(ZELAZO, "zelazo", "cityHasOdlewniaZelaza") {
        let built = built_from_json(&case["built"]).expect("lista");
        assert_eq!(
            city_has_odlewnia_zelaza(&built),
            case["out"].as_bool().unwrap(),
            "{built:?}"
        );
    }
}

#[test]
fn has_access_matches_web() {
    let mut n = 0;
    for case in cases(CYNA, "cyna", "hasCynaAccess") {
        let stock = stock_from_json(&case["stock"]);
        let built = built_from_json(&case["built"]);
        let got = has_cyna_access(stock.as_ref(), built.as_deref());
        assert_eq!(
            got,
            case["out"].as_bool().unwrap(),
            "cyna stock={} built={}",
            case["stock"],
            case["built"]
        );
        n += 1;
    }
    assert_minimum(n, "hasCynaAccess");
    for case in cases(ZELAZO, "zelazo", "hasZelazoAccess") {
        let stock = stock_from_json(&case["stock"]);
        let built = built_from_json(&case["built"]);
        let got = has_zelazo_access(stock.as_ref(), built.as_deref());
        assert_eq!(
            got,
            case["out"].as_bool().unwrap(),
            "zelazo stock={} built={}",
            case["stock"],
            case["built"]
        );
    }
}

// ---------------------------------------------------------------------------------------------
// society-inputs.ts (kultura miasta)
// ---------------------------------------------------------------------------------------------

fn city_from_json(v: &Value) -> CultureMixFields {
    let field = |name: &str| match v.get(name) {
        None | Some(Value::Null) => None,
        Some(x) => Some(dec_num(x)),
    };
    CultureMixFields {
        own_culture_share: field("ownCultureShare"),
        kultura_own_share: field("kulturaOwnShare"),
    }
}

#[test]
fn culture_share_and_mix_match_web() {
    let mut n = 0;
    for case in cases(SOCIETY, "society", "resolveOwnCultureShare") {
        let city = city_from_json(&case["city"]);
        let got = resolve_own_culture_share(&city);
        assert!(same(got, dec_num(&case["out"])), "share {}", case["city"]);
        n += 1;
    }
    assert_minimum(n, "resolveOwnCultureShare");
    for case in cases(SOCIETY, "society", "cityCultureMixActive") {
        let city = city_from_json(&case["city"]);
        assert_eq!(
            city_culture_mix_active(&city),
            case["out"].as_bool().unwrap(),
            "{}",
            case["city"]
        );
    }
    for case in cases(SOCIETY, "society", "clearCityCultureMix") {
        let mut city = city_from_json(&case["city"]);
        clear_city_culture_mix(&mut city);
        assert_eq!(city, CultureMixFields::default());
        assert!(
            case["out"]["ownCultureShare"].is_null() && case["out"]["kulturaOwnShare"].is_null()
        );
    }
    for case in cases(SOCIETY, "society", "cultureMixBreakdown") {
        let share = dec_num(&case["share"]);
        let active = case["active"].as_bool().unwrap();
        let got = culture_mix_breakdown(case["label"].as_str().unwrap(), share, active);
        let want = case["out"].as_array().unwrap();
        assert_eq!(
            got.len(),
            want.len(),
            "liczba linii share={} active={active}",
            case["share"]
        );
        for (line, w) in got.iter().zip(want) {
            assert_eq!(line.label, w["label"].as_str().unwrap());
            assert!(
                same(line.pct, dec_num(&w["pct"])),
                "pct share={} got={} want={}",
                case["share"],
                line.pct,
                w["pct"]
            );
            assert_eq!(line.is_owner, w["isOwner"].as_bool().unwrap());
        }
    }
}

#[test]
fn vector_files_are_not_empty() {
    // Strazak: wszystkie cztery sekcje maja przypadki (zapobiega pustemu, zielonemu testowi).
    assert!(!load(ZLOTO, "zloto").is_empty());
    assert!(!load(CYNA, "cyna").is_empty());
    assert!(!load(ZELAZO, "zelazo").is_empty());
    assert!(!load(SOCIETY, "society").is_empty());
}

/// R2 (zarzut Evaluatora 2): JS `Math.max(0, -0)` daje +0. Wektory JSON nie odroznia -0 od 0,
/// wiec znak zera sprawdzamy bezposrednio. Granice N-1/N/N+1 dla clampu [0,1] tez.
#[test]
fn culture_share_clamp_boundaries_and_negative_zero() {
    let share = |raw: f64| {
        resolve_own_culture_share(&CultureMixFields {
            own_culture_share: Some(raw),
            kultura_own_share: None,
        })
    };
    let neg_zero = share(-0.0);
    assert_eq!(neg_zero, 0.0);
    assert!(neg_zero.is_sign_positive(), "-0 musi dac +0 (JS Math.max)");
    assert!(share(-1e-300).is_sign_positive() && share(-1e-300) == 0.0);
    assert_eq!(share(-1.0), 0.0);
    assert_eq!(share(1.0 - f64::EPSILON), 1.0 - f64::EPSILON);
    assert_eq!(share(1.0), 1.0);
    assert_eq!(share(1.0 + f64::EPSILON), 1.0);
    assert_eq!(share(0.0), 0.0);
    assert!(share(0.0).is_sign_positive());
}

/// R2 (zarzut Evaluatora 1): pelna zgodnosc `trim`. Przedzialy code pointow, ktore JS
/// `String.prototype.trim` (V8, Node 22) usuwa: `String.fromCodePoint(c).trim().length === 0`
/// dla kazdego c w 0..=0x10FFFF bez surogatow (25 code pointow, 10 przedzialow).
const JS_TRIM_RANGES: &[(u32, u32)] = &[
    (0x0009, 0x000D),
    (0x0020, 0x0020),
    (0x00A0, 0x00A0),
    (0x1680, 0x1680),
    (0x2000, 0x200A),
    (0x2028, 0x2029),
    (0x202F, 0x202F),
    (0x205F, 0x205F),
    (0x3000, 0x3000),
    (0xFEFF, 0xFEFF),
];

/// Dla kazdego code pointa c: zloze = c + "cyna" trafia w "cyna" po trim wtedy i tylko wtedy,
/// gdy JS trim usuwa c. Test pokrywa cala przestrzen Unicode, nie tylko wybrane wektory.
#[test]
fn js_trim_set_matches_v8_for_all_code_points() {
    let placed_vec: Vec<(&str, Placed<'_>)> = vec![("0,0", Placed::One("kopalnia_cyny"))];
    let placed = Some(placed_vec.as_slice());

    let mut sanity: HexZlozeMap = HashMap::new();
    sanity.insert("0,0".to_owned(), Some("cyna".to_owned()));
    assert!(
        empire_has_kopalnia_na_zlozu_cyny(placed, Some(&sanity)),
        "kontrola: 'cyna' trafia"
    );

    let mut checked = 0u32;
    for cp in 0u32..=0x10FFFF {
        let Some(ch) = char::from_u32(cp) else {
            continue; // surogaty
        };
        let in_js = JS_TRIM_RANGES.iter().any(|&(a, b)| cp >= a && cp <= b);
        let mut hexes: HexZlozeMap = HashMap::new();
        hexes.insert("0,0".to_owned(), Some(format!("{ch}cyna")));
        let got = empire_has_kopalnia_na_zlozu_cyny(placed, Some(&hexes));
        assert_eq!(got, in_js, "code point U+{cp:04X}");
        checked += 1;
    }
    assert_eq!(
        checked,
        0x10FFFF + 1 - 0x800,
        "bez surogatow: 1114112 - 2048"
    );
}
