//! Pin vectors: the web literals the DTO mirrors, read from the generated
//! fixture `tests/fixtures/pin_literals.json` (never copied by hand).
//!
//! The fixture is written by
//! `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py`,
//! which reads every source with `git show 07d2fbd72:gra/src/<file>`, records
//! the SHA-256 of each pin source file and extracts the unions / enums /
//! interface keys by anchored parsing. This test checks the fixture's own
//! SHA-256 ([`PIN_LITERALS_SHA256`]); `gen_pin_literals.py --check` checks that
//! the fixture is still exactly what the pin gives. A pin move = regenerate
//! with `--pin <sha>`, update the constant, and every changed literal shows up
//! here as a failing enum.
//!
//! The Rust side of each check is the list of variants, kept exhaustive by a
//! `match` (a new variant does not compile until it is listed).

mod common;

use civ_view_model::validate::{MAX_BATTLE_TILE, MAX_DEFENSE_TIER, MAX_FACING};
use civ_view_model::*;
use common::*;
use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::{json, Value};
use std::fmt::Debug;

/// The pin the fixture was generated from.
const PIN: &str = "07d2fbd72";
/// SHA-256 of `tests/fixtures/pin_literals.json` (printed by the generator).
const PIN_LITERALS_SHA256: &str =
    "5baee2880c3f915ef57d67f5b7f33bf8bee0859f335932c84c4fe348c042dc15";
const FIXTURE: &[u8] = include_bytes!("fixtures/pin_literals.json");

/// Every item the generator extracts (`SPECS` in the generator).
const ITEMS: [&str; 24] = [
    "BTerrain",
    "CityFortificationKind",
    "CityMapBadgeInput",
    "CityMapDefenseTier",
    "CityMapOutlineKind",
    "CityMapWallKind",
    "CityWallKind",
    "DeployPlayerSide",
    "Dir",
    "HexCoords",
    "Nakladka",
    "ProductionKind",
    "RelationBorderStatus",
    "RuntimeUnit",
    "SiegeMachineKind",
    "StackDisplayInfo",
    "StackVitals",
    "TerenBazowy",
    "TileYield",
    "TradeRouteMedium",
    "Ulepszenie",
    "WallTowerMaterial",
    "Widocznosc",
    "riverPathKinds",
];

// ---------------------------------------------------------------------------
// SHA-256 (FIPS 180-4), no external crate.
// ---------------------------------------------------------------------------

const K: [u32; 64] = [
    0x428a_2f98,
    0x7137_4491,
    0xb5c0_fbcf,
    0xe9b5_dba5,
    0x3956_c25b,
    0x59f1_11f1,
    0x923f_82a4,
    0xab1c_5ed5,
    0xd807_aa98,
    0x1283_5b01,
    0x2431_85be,
    0x550c_7dc3,
    0x72be_5d74,
    0x80de_b1fe,
    0x9bdc_06a7,
    0xc19b_f174,
    0xe49b_69c1,
    0xefbe_4786,
    0x0fc1_9dc6,
    0x240c_a1cc,
    0x2de9_2c6f,
    0x4a74_84aa,
    0x5cb0_a9dc,
    0x76f9_88da,
    0x983e_5152,
    0xa831_c66d,
    0xb003_27c8,
    0xbf59_7fc7,
    0xc6e0_0bf3,
    0xd5a7_9147,
    0x06ca_6351,
    0x1429_2967,
    0x27b7_0a85,
    0x2e1b_2138,
    0x4d2c_6dfc,
    0x5338_0d13,
    0x650a_7354,
    0x766a_0abb,
    0x81c2_c92e,
    0x9272_2c85,
    0xa2bf_e8a1,
    0xa81a_664b,
    0xc24b_8b70,
    0xc76c_51a3,
    0xd192_e819,
    0xd699_0624,
    0xf40e_3585,
    0x106a_a070,
    0x19a4_c116,
    0x1e37_6c08,
    0x2748_774c,
    0x34b0_bcb5,
    0x391c_0cb3,
    0x4ed8_aa4a,
    0x5b9c_ca4f,
    0x682e_6ff3,
    0x748f_82ee,
    0x78a5_636f,
    0x84c8_7814,
    0x8cc7_0208,
    0x90be_fffa,
    0xa450_6ceb,
    0xbef9_a3f7,
    0xc671_78f2,
];

fn sha256_hex(data: &[u8]) -> String {
    let mut h: [u32; 8] = [
        0x6a09_e667,
        0xbb67_ae85,
        0x3c6e_f372,
        0xa54f_f53a,
        0x510e_527f,
        0x9b05_688c,
        0x1f83_d9ab,
        0x5be0_cd19,
    ];
    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut msg = data.to_vec();
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 64];
        for (i, word) in chunk.chunks_exact(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ (!e & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        for (slot, v) in h.iter_mut().zip([a, b, c, d, e, f, g, hh]) {
            *slot = slot.wrapping_add(v);
        }
    }
    h.iter().map(|v| format!("{v:08x}")).collect()
}

/// FIPS 180-4 / NIST example vectors: the hash used below is the real one.
#[test]
fn sha256_known_vectors() {
    assert_eq!(
        sha256_hex(b""),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    assert_eq!(
        sha256_hex(b"abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    assert_eq!(
        sha256_hex(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    );
}

// ---------------------------------------------------------------------------
// Fixture access.
// ---------------------------------------------------------------------------

fn fixture() -> Value {
    serde_json::from_slice(FIXTURE).expect("fixture is JSON")
}

fn item(name: &str) -> Value {
    let fx = fixture();
    let it = fx["items"]
        .get(name)
        .unwrap_or_else(|| panic!("fixture has no item {name}"))
        .clone();
    // Every item cites its pin file and line span.
    let file = it["file"].as_str().expect("file");
    assert!(
        fx["sources"].get(file).is_some(),
        "{name}: {file} not hashed"
    );
    let lines = it["lines"].as_array().expect("lines");
    assert_eq!(lines.len(), 2);
    assert!(lines[0].as_u64().unwrap() >= 1);
    assert!(lines[0].as_u64() <= lines[1].as_u64());
    it
}

fn strings(name: &str) -> Vec<String> {
    let v: Vec<String> = item(name)["values"]
        .as_array()
        .unwrap_or_else(|| panic!("{name}: no values"))
        .iter()
        .map(|s| s.as_str().expect("string literal").to_owned())
        .collect();
    assert!(!v.is_empty(), "{name}: empty");
    v
}

fn numbers(name: &str) -> Vec<i64> {
    let v: Vec<i64> = item(name)["values"]
        .as_array()
        .unwrap_or_else(|| panic!("{name}: no values"))
        .iter()
        .map(|n| n.as_i64().expect("numeric literal"))
        .collect();
    assert!(!v.is_empty(), "{name}: empty");
    v
}

fn keys(name: &str) -> Vec<String> {
    let v: Vec<String> = item(name)["keys"]
        .as_array()
        .unwrap_or_else(|| panic!("{name}: no keys"))
        .iter()
        .map(|s| s.as_str().expect("key").to_owned())
        .collect();
    assert!(!v.is_empty(), "{name}: empty");
    v
}

/// The fixture is the generated one: own SHA-256, pin, generator, a 64-hex
/// SHA-256 for every pin source, and exactly the expected items.
#[test]
fn fixture_is_the_generated_one() {
    assert_eq!(sha256_hex(FIXTURE), PIN_LITERALS_SHA256);
    let fx = fixture();
    assert_eq!(fx["pin"], json!(PIN));
    let commit = fx["pinCommit"].as_str().unwrap();
    assert_eq!(commit.len(), 40);
    assert!(commit.starts_with(PIN));
    assert!(fx["generator"]
        .as_str()
        .unwrap()
        .ends_with("R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py"));
    let sources = fx["sources"].as_object().unwrap();
    assert_eq!(sources.len(), 16);
    for (file, sha) in sources {
        assert!(file.starts_with("gra/src/"), "{file}");
        let sha = sha.as_str().unwrap();
        assert_eq!(sha.len(), 64, "{file}");
        assert!(sha
            .bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase()));
    }
    let mut names: Vec<&String> = fx["items"].as_object().unwrap().keys().collect();
    names.sort();
    let mut expected = ITEMS.to_vec();
    expected.sort_unstable();
    assert_eq!(names, expected);
    for name in ITEMS {
        item(name);
    }
}

// ---------------------------------------------------------------------------
// Enum checks.
// ---------------------------------------------------------------------------

/// The JSON string of a unit enum value.
fn lit<T: Serialize>(v: T) -> String {
    match serde_json::to_value(v).unwrap() {
        Value::String(s) => s,
        other => panic!("not a string: {other}"),
    }
}

/// `all` lists every variant; `pos` is an exhaustive `match` giving each
/// variant its position in `all` (a new variant fails to compile).
fn variants<T: Copy + Debug>(all: &[T], pos: fn(T) -> usize) -> Vec<T> {
    for (i, &v) in all.iter().enumerate() {
        assert_eq!(pos(v), i, "{v:?}");
    }
    all.to_vec()
}

/// The serialized variants are exactly the web literals (same set, same
/// count); each literal deserializes back to its variant; case drift and an
/// unknown literal are rejected.
fn check_enum<T>(all: &[T], web: &[String])
where
    T: Serialize + DeserializeOwned + PartialEq + Debug + Copy,
{
    let mut ours: Vec<String> = all.iter().map(|&v| lit(v)).collect();
    let mut theirs: Vec<String> = web.to_vec();
    ours.sort_unstable();
    theirs.sort_unstable();
    assert_eq!(ours, theirs);
    for &v in all {
        let s = lit(v);
        let back: T = serde_json::from_value(json!(s)).unwrap();
        assert_eq!(back, v, "{s}");
        assert!(serde_json::from_value::<T>(json!(s.to_uppercase())).is_err());
    }
    assert!(serde_json::from_value::<T>(json!("nieznany")).is_err());
}

#[test]
fn teren_bazowy() {
    use Terrain::*;
    let all = variants(
        &[
            Laka,
            Rownina,
            Wzgorza,
            Gory,
            PlytkieMorze,
            Morze,
            Pustynia,
            Polarny,
        ],
        |t| match t {
            Laka => 0,
            Rownina => 1,
            Wzgorza => 2,
            Gory => 3,
            PlytkieMorze => 4,
            Morze => 5,
            Pustynia => 6,
            Polarny => 7,
        },
    );
    check_enum(&all, &strings("TerenBazowy"));
}

#[test]
fn nakladka() {
    use Nakladka::*;
    let all = variants(
        &[
            Brak, Las, ZlozeGliny, ZlozeRudy, ZlozeKonia, ZlozeOwiec, ZlozeBydla, ZlozeLamy,
        ],
        |n| match n {
            Brak => 0,
            Las => 1,
            ZlozeGliny => 2,
            ZlozeRudy => 3,
            ZlozeKonia => 4,
            ZlozeOwiec => 5,
            ZlozeBydla => 6,
            ZlozeLamy => 7,
        },
    );
    check_enum(&all, &strings("Nakladka"));
}

#[test]
fn ulepszenie() {
    use Ulepszenie::*;
    let all = variants(
        &[
            Brak,
            Farma,
            Irygacja,
            Kopalnia,
            Droga,
            DrogaBrukowana,
            Pastwisko,
            Tartak,
        ],
        |u| match u {
            Brak => 0,
            Farma => 1,
            Irygacja => 2,
            Kopalnia => 3,
            Droga => 4,
            DrogaBrukowana => 5,
            Pastwisko => 6,
            Tartak => 7,
        },
    );
    check_enum(&all, &strings("Ulepszenie"));
}

#[test]
fn river_kind() {
    use RiverKind::*;
    let all = variants(&[Main, Medium, Short, Tributary], |k| match k {
        Main => 0,
        Medium => 1,
        Short => 2,
        Tributary => 3,
    });
    check_enum(&all, &strings("riverPathKinds"));
}

/// D-DTO-10 = A (§3.3): the fog code is the position of the state in the
/// web `enum Widocznosc` declaration. The order comes from the fixture; the
/// match below is the meaning of each Rust variant (contract, not a copy of a
/// pin literal list). Any other code is rejected.
#[test]
fn fog_codes_follow_widocznosc_order() {
    fn meaning(f: FogState) -> &'static str {
        match f {
            FogState::Unexplored => "nieodkryty",
            FogState::Explored => "odkryty",
            FogState::Visible => "widoczny",
        }
    }
    let widocznosc = strings("Widocznosc");
    assert_eq!(widocznosc.len(), 3);
    for (code, name) in widocznosc.iter().enumerate() {
        let code = u8::try_from(code).unwrap();
        let f = FogState::from_code(code).unwrap();
        assert_eq!(meaning(f), name);
        assert_eq!(f.code(), code);
        assert_eq!(serde_json::to_value(f).unwrap(), json!(code));
        let back: FogState = serde_json::from_value(json!(code)).unwrap();
        assert_eq!(back, f);
    }
    let past_end = u8::try_from(widocznosc.len()).unwrap();
    assert_eq!(FogState::from_code(past_end), None);
    for bad in [
        json!(past_end),
        json!(255),
        json!(-1),
        json!("widoczny"),
        json!(1.0),
    ] {
        assert!(
            serde_json::from_value::<FogState>(bad.clone()).is_err(),
            "{bad}"
        );
    }
}

#[test]
fn map_outline_kind() {
    use MapOutlineKind::*;
    let all = variants(&[Player, War, Neutral, Ally], |k| match k {
        Player => 0,
        War => 1,
        Neutral => 2,
        Ally => 3,
    });
    check_enum(&all, &strings("CityMapOutlineKind"));
}

/// `RelationBorderStatus` plus the contract value `self` (`isMe`,
/// `main.ts:4065-4068`; contract §3.4).
#[test]
fn relation_to_viewer() {
    use RelationToViewer::*;
    let all = variants(&[Own, Wojna, Pokoj, Sojusz, Neutralni], |r| match r {
        Own => 0,
        Wojna => 1,
        Pokoj => 2,
        Sojusz => 3,
        Neutralni => 4,
    });
    let mut web = strings("RelationBorderStatus");
    assert!(!web.contains(&"self".to_owned()));
    web.push("self".to_owned());
    check_enum(&all, &web);
}

/// `CityWallKind` (`render/cities.ts`) and `CityMapWallKind`
/// (`render/cityMapStatChip.ts`) are the same union.
#[test]
fn wall_kind() {
    use WallKind::*;
    let all = variants(&[None, Palisada, Stone], |w| match w {
        None => 0,
        Palisada => 1,
        Stone => 2,
    });
    let cities = strings("CityWallKind");
    let mut chip = strings("CityMapWallKind");
    let mut sorted_cities = cities.clone();
    sorted_cities.sort();
    chip.sort();
    assert_eq!(sorted_cities, chip);
    check_enum(&all, &cities);
}

#[test]
fn production_kind() {
    use ProductionKind::*;
    let all = variants(&[Budynek, Jednostka], |p| match p {
        Budynek => 0,
        Jednostka => 1,
    });
    check_enum(&all, &strings("ProductionKind"));
}

#[test]
fn siege_machine_kind() {
    use SiegeMachineKind::*;
    let all = variants(&[Taran, Wieza], |m| match m {
        Taran => 0,
        Wieza => 1,
    });
    check_enum(&all, &strings("SiegeMachineKind"));
}

#[test]
fn trade_medium() {
    use TradeMedium::*;
    let all = variants(&[Lad, Morze], |m| match m {
        Lad => 0,
        Morze => 1,
    });
    check_enum(&all, &strings("TradeRouteMedium"));
}

/// Contract §3.7 `buildHighlight.kind`, one value per branch of
/// `refreshBuildHighlight` (`main.ts:16351-16396` @ `07d2fbd72`, P4-1F1 b):
/// `foundCity` (`:16352-16361`), `wonder` (`:16363-16367`), `improvement`
/// (`setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)`, `:16392-16395`),
/// `mine` (`refreshMineEligibleOverlay`, `:16386-16390`). There is no web
/// literal to generate (the web switches layers), so these values are the
/// contract's own.
#[test]
fn build_highlight_kind() {
    use BuildHighlightKind::*;
    let all = variants(&[FoundCity, Wonder, Improvement, Mine], |k| match k {
        FoundCity => 0,
        Wonder => 1,
        Improvement => 2,
        Mine => 3,
    });
    let contract: Vec<String> = ["foundCity", "wonder", "improvement", "mine"]
        .iter()
        .map(|s| (*s).to_owned())
        .collect();
    check_enum(&all, &contract);
}

/// Battle: `deployPlayerSide` (`'atk' | 'def'`), `CityFortificationKind`,
/// `buildWallTower(material)`.
#[test]
fn battle_enums() {
    {
        use BattleSide::*;
        let all = variants(&[Atk, Def], |s| match s {
            Atk => 0,
            Def => 1,
        });
        check_enum(&all, &strings("DeployPlayerSide"));
    }
    {
        use FortKind::*;
        let all = variants(&[None, Palisada, Mur], |f| match f {
            None => 0,
            Palisada => 1,
            Mur => 2,
        });
        check_enum(&all, &strings("CityFortificationKind"));
    }
    {
        use TowerMaterial::*;
        let all = variants(&[Drewno, Kamien], |m| match m {
            Drewno => 0,
            Kamien => 1,
        });
        check_enum(&all, &strings("WallTowerMaterial"));
    }
}

/// The numeric ranges of the validator are the web enums: `0..=max`,
/// contiguous (`Dir`, `BTerrain`, `CityMapDefenseTier`).
#[test]
fn validator_ranges_follow_web_numeric_enums() {
    for (name, max) in [
        ("Dir", i64::from(MAX_FACING)),
        ("BTerrain", i64::from(MAX_BATTLE_TILE)),
        ("CityMapDefenseTier", i64::from(MAX_DEFENSE_TIER)),
    ] {
        let values = numbers(name);
        let expected: Vec<i64> = (0..=max).collect();
        assert_eq!(values, expected, "{name}");
    }
}

// ---------------------------------------------------------------------------
// Interface keys.
// ---------------------------------------------------------------------------

fn sorted_keys(v: &Value) -> Vec<String> {
    let mut k: Vec<String> = v.as_object().unwrap().keys().cloned().collect();
    k.sort();
    k
}

fn sorted(mut names: Vec<String>) -> Vec<String> {
    names.sort();
    names
}

/// Web interfaces mirrored key-for-key.
#[test]
fn web_interface_keys() {
    let vitals = keys("StackVitals");
    assert_eq!(vitals.len(), 11);
    assert_eq!(
        sorted_keys(&serde_json::to_value(sample_vitals()).unwrap()),
        sorted(vitals)
    );
    assert_eq!(
        sorted_keys(&serde_json::to_value(sample_stacks()).unwrap()),
        sorted(keys("StackDisplayInfo"))
    );
    // `CityMapBadgeInput` (19 keys) minus the two UI-only keys
    // `hoverExpanded` and `lodLevel` (contract §3.4).
    let badge = keys("CityMapBadgeInput");
    assert_eq!(badge.len(), 19);
    let ui_only = ["hoverExpanded", "lodLevel"];
    for k in ui_only {
        assert!(badge.iter().any(|b| b == k), "{k} not in the web interface");
    }
    let without_ui: Vec<String> = badge
        .into_iter()
        .filter(|k| !ui_only.contains(&k.as_str()))
        .collect();
    assert_eq!(
        sorted_keys(&serde_json::to_value(sample_badge_full()).unwrap()),
        sorted(without_ui)
    );
    assert_eq!(
        sorted_keys(&serde_json::to_value(sample_yield_full()).unwrap()),
        sorted(keys("TileYield"))
    );
    assert_eq!(
        sorted_keys(&serde_json::to_value(h(1, 2)).unwrap()),
        sorted(keys("HexCoords"))
    );
    // `RuntimeUnit`: every unit key that has a web field keeps the web name;
    // the rest are derived by the contract (§3.5: `hex` ← `q/r`, `ruchMax` ←
    // `ruch`, stars/badges/`dimmed` computed).
    let runtime_unit = keys("RuntimeUnit");
    let derived = [
        "hex",
        "ruchMax",
        "veteranStars",
        "armorBadgeLevel",
        "softBadgeLevel",
        "dimmed",
    ];
    for k in &derived {
        assert!(!runtime_unit.iter().any(|w| w == k), "{k} is a web key");
    }
    let unit_keys = sorted_keys(&serde_json::to_value(sample_unit_full()).unwrap());
    assert_eq!(unit_keys.len(), 16);
    for k in unit_keys {
        assert!(
            runtime_unit.contains(&k) || derived.contains(&k.as_str()),
            "unit key {k} has no web origin"
        );
    }
}

/// `main.ts:4080-4082` `civRingHexFn`: `'#' + civColorFn(id).toString(16)
/// .padStart(6, '0')` — lowercase, zero-padded. The validator accepts exactly
/// that shape.
#[test]
fn ring_hex_shape() {
    fn web_ring(color: u32) -> String {
        format!("#{color:06x}")
    }
    for color in [0x00_00_00, 0x00_e5_39, 0x0f_0f_0f, 0xff_d5_4a] {
        let mut view = sample_view();
        view.owners[1].color = color;
        view.owners[1].ring_hex = Some(web_ring(color));
        view.validate().unwrap();
    }
    assert_eq!(web_ring(0x00_e5_39), "#00e539");
    for bad in ["#00E539", "00e539", "#e539", "#00e5390", "#00g539"] {
        let mut view = sample_view();
        view.owners[1].ring_hex = Some(bad.to_owned());
        assert!(
            matches!(view.validate(), Err(ViewError::BadRingHex { .. })),
            "{bad}"
        );
    }
}
