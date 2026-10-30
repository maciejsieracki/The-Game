//! REPIN-EKONOMIA-D, partia D2.2e (runda 1 operatora, `R-RUSTPORT-REPIN-EKONOMIA-D2-Q1`) —
//! galaz ulepszen i zloz `tileYield` (`gra/src/game/economy.ts`, pin `91dc998a`, L421-470,
//! `impKeys` L458-472), `buildingHappinessAtLevel` (L523-531) i pelna `cityYieldPerTurn`
//! z kafelkami z ulepszeniami. Zamyka Z-D2.2d-1.
//!
//! Wektory: `tests/p6_repin_d2_imp_vectors/imp-main.json` (pin `91dc998a`), wygenerowane URUCHOMIENIEM
//! funkcji weba w node 22.22 (loader TS z `typescript`). Generator:
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D2-Q1/logs/gen-imp.mts`.
//!
//! - `parity_tile_yield_full_bit_exact`: 2000 kafelkow, 8 pol, bit-w-bit (znak zera, NaN).
//! - `parity_city_terrain_sums_imp_bit_exact`: 400 miast, sumy Step 1 z ulepszeniami.
//! - `parity_full_city_with_improvements_bit_exact`: 800 PELNYCH `cityYieldPerTurn` (WSZYSTKIE 18 pol
//!   `CityYieldResult` z pinu 91dc998a, L1011-1031; wraz z `zadowolenie` i polami `*Terenu`).
//! - `parity_building_happiness_bit_exact`: 1900 wywolan `buildingHappinessAtLevel`.
//! - `structural_*` / `boundary_*`: galezie wyprowadzone z kodu weba (nazwy odpowiadaja galeziom).
//! - `structural_improvement_bonuses_nonnegative_in_data`: zalozenie Z-V-2 (clamp `Math.max(0,.)` po
//!   ulepszeniach jest rownowazny tylko przy nieujemnych bonusach) -- test pilnuje tego zalozenia danych.

use civ_engine::data::civilizations::CivMatrixFile;
use civ_engine::data::terrain_map::parse_terrain_yields;
use civ_engine::data::terrain_map::TERRAIN_IMPROVEMENTS_JSON;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_yield::{
    building_happiness_at_level, city_terrain_sums_imp, city_yield_per_turn_from_worked_imp,
    tile_yield_full, CityBuildingFullInput, CityBuildingInput, CityYieldHeadParams, CityYieldInput,
    CityYieldOutput, CityYieldParams, CityYieldTailParams, TerrainSums, WorkedTileImpInput,
    BUILDING_HAPPINESS_BASE_PER_BUILDING,
};
use civ_engine::domain::improvements::TileYield;
use serde_json::Value;

const IMP_VECTORS: &str = include_str!("p6_repin_d2_imp_vectors/imp-main.json");

/// Liczba zakodowana przez generator: `{"f": String(x)}` (`-0` jako `"-0"`, `NaN`, `Infinity`).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

/// Opcjonalne pole: `{"u": true}` = `undefined` = `None`, inaczej liczba.
fn opt(v: &Value) -> Option<f64> {
    if v.get("u").is_some() {
        None
    } else {
        Some(ef(v))
    }
}

fn vectors() -> Value {
    let v: Value = serde_json::from_str(IMP_VECTORS).expect("imp vectors json");
    assert_eq!(v["pin"], "91dc998a");
    v
}

/// Wlasnosciowa wersja kafelka z wektora (slice ulepszen i stringi zyja w strukturze).
struct OwnedTile {
    teren: String,
    nakladka: String,
    ma_rzeke: bool,
    keys: Option<Vec<String>>,
    key: Option<String>,
    zloze: Option<String>,
}

fn str_opt(v: &Value) -> Option<String> {
    v.as_str().map(|s| s.to_owned())
}

/// `entry` = `{"in": {...}, "out": {...}}` z generatora (`tileCase`).
fn own_tile(entry: &Value) -> OwnedTile {
    let t = &entry["in"];
    OwnedTile {
        teren: t["teren"].as_str().expect("teren").to_owned(),
        nakladka: t["nakladka"].as_str().expect("nakladka").to_owned(),
        ma_rzeke: t["maRzeke"].as_bool().expect("maRzeke"),
        keys: t["ulepszeniaKeys"].as_array().map(|a| {
            a.iter()
                .map(|x| x.as_str().expect("klucz ulepszenia").to_owned())
                .collect()
        }),
        key: str_opt(&t["ulepszenieKey"]),
        zloze: str_opt(&t["zloze"]),
    }
}

fn borrow(o: &OwnedTile) -> WorkedTileImpInput<'_> {
    WorkedTileImpInput {
        teren_bazowy: &o.teren,
        nakladka: &o.nakladka,
        ma_rzeke: o.ma_rzeke,
        ulepszenia_keys: o.keys.as_deref(),
        ulepszenie_key: o.key.as_deref(),
        zloze: o.zloze.as_deref(),
    }
}

fn tile_fields(y: &TileYield, exp: &Value) -> Vec<(&'static str, f64, f64)> {
    vec![
        ("zywnosc", y.zywnosc, ef(&exp["zywnosc"])),
        ("praca", y.praca, ef(&exp["praca"])),
        ("handel", y.handel, ef(&exp["handel"])),
        ("drewno", y.drewno, ef(&exp["drewno"])),
        ("kamien", y.kamien, ef(&exp["kamien"])),
        ("glina", y.glina, ef(&exp["glina"])),
        ("ruda", y.ruda, ef(&exp["ruda"])),
        ("ruda_zelaza", y.ruda_zelaza, ef(&exp["ruda_zelaza"])),
    ]
}

fn params_of(p: &Value) -> CityYieldParams {
    CityYieldParams {
        head: CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: ef(&p["budynekMlynMnoznikPracy"]),
            budynek_mlyn_bonus_pracy: ef(&p["budynekMlynBonusPracy"]),
            budynek_cegielni_bonus_pracy: ef(&p["budynekCegielniBonusPracy"]),
        },
        tail: CityYieldTailParams {
            korupcja_cap: ef(&p["korupcjaCap"]),
            mennica_mnoznik_po_walucie: ef(&p["mennicaMnoznikPoWalucie"]),
            biblioteka_bonus_nauki: ef(&p["budynekBibliotekaBonusNauki"]),
            akademia_bonus_nauki: ef(&p["budynekAkademiaBonusNauki"]),
            garncarnia_bonus_zywnosci: ef(&p["budynekGarncarniaBonusZywnosci"]),
            zywnosc_zuzytka_populacja: ef(&p["zywnoscZuzytkaPopulacja"]),
        },
    }
}

/// Wejscie `cityYieldPerTurn` z pelnego przypadku. Pola agregatow ustawione na 0 (nadpisywane w Rust).
fn input_of(case: &Value) -> CityYieldInput<'_> {
    let c = &case["in"]["city"];
    let f = &case["in"]["flags"];
    let x = &case["in"]["ctx"];
    CityYieldInput {
        civ_key: c["civKey"].as_str(),
        ludnosc: ef(&c["ludnosc"]),
        procent_nauka: ef(&c["podzial"]["procentNauka"]),
        procent_pieniadz: ef(&c["podzial"]["procentPieniadz"]),
        procent_luksus: ef(&c["podzial"]["procentLuksus"]),
        poborca_count: c["poborca"].as_u64().expect("poborca count") as u32,
        praca_terenu: 0.0,
        handel_terenu: 0.0,
        zywnosc_terenu: 0.0,
        praca_budynkow: 0.0,
        pieniadz_budynkow: 0.0,
        pieniadz_portu: 0.0,
        zywnosc_budynkow: 0.0,
        nauka_budynkow: 0.0,
        kultura_budynkow: 0.0,
        ma_mlyn: f["maMlyn"].as_bool().unwrap(),
        ma_cegielnia: f["maCegielnia"].as_bool().unwrap(),
        strata_fraction: ef(&x["strataFraction"]),
        waluta_odkryta: f["walutaOdkryta"].as_bool().unwrap(),
        ma_mennica: f["maMennica"].as_bool().unwrap(),
        ma_biblioteka: f["maBiblioteka"].as_bool().unwrap(),
        ma_akademia: f["maAkademia"].as_bool().unwrap(),
        civ_handel_mult: opt(&x["civHandelMult"]),
        premia_handlu_tras: opt(&x["premiaHandluTrasHandlowych"]),
        additional_tax: opt(&x["additionalTax"]),
        civ_nauka_mult: opt(&x["civNaukaMult"]),
        liczba_garncarni: opt(&x["liczbaGarncarni"]),
        wojsko_zuzycie_zywnosci: ef(&x["wojskoZuzycieZywnosci"]),
    }
}

fn yields_of(v: &Value) -> civ_engine::domain::economy_yield::BuildingYieldsInput {
    civ_engine::domain::economy_yield::BuildingYieldsInput {
        praca: ef(&v["praca"]),
        pieniadz: ef(&v["pieniadz"]),
        zywnosc: ef(&v["zywnosc"]),
        nauka: ef(&v["nauka"]),
        kultura: ef(&v["kultura"]),
    }
}

/// Budynki pelnego przypadku z polami szczescia. `dajeSzczescie`: tylko JSON `true` daje szczescie
/// (web `=== true`); `zadBaza` gdy liczba (`typeof === 'number'`), inaczej `None`; `zadPrzyrost` gdy
/// brak = `NaN` (web `undefined` w `buildingEffectAtLevel`).
fn buildings_of(case: &Value) -> Vec<CityBuildingFullInput<'_>> {
    case["in"]["buildings"]
        .as_array()
        .expect("buildings")
        .iter()
        .map(|b| {
            let baza_z = if b["zadBaza"].get("f").is_some() {
                Some(ef(&b["zadBaza"]))
            } else {
                None
            };
            let przyrost_z = if b["zadPrzyrost"].get("f").is_some() {
                ef(&b["zadPrzyrost"])
            } else {
                f64::NAN
            };
            CityBuildingFullInput {
                base: CityBuildingInput {
                    id: b["id"].as_str().expect("id"),
                    level: ef(&b["level"]),
                    baza: yields_of(&b["baza"]),
                    przyrost: yields_of(&b["przyrost"]),
                },
                daje_szczescie: b["dajeSzczescie"].as_bool() == Some(true),
                baza_zadowolenie: baza_z,
                przyrost_zadowolenie: przyrost_z,
            }
        })
        .collect()
}

/// Wynik w kolejnosci pol pina: (nazwa, wartosc Rust, wartosc webu).
fn city_fields(out: &CityYieldOutput, exp: &Value) -> Vec<(&'static str, f64, f64)> {
    vec![
        ("praca", out.praca, ef(&exp["praca"])),
        ("pieniadz", out.pieniadz, ef(&exp["pieniadz"])),
        ("zywnosc", out.zywnosc, ef(&exp["zywnosc"])),
        ("nauka", out.nauka, ef(&exp["nauka"])),
        ("luksus", out.luksus, ef(&exp["luksus"])),
        ("kultura", out.kultura, ef(&exp["kultura"])),
        (
            "zywnoscBrutto",
            out.zywnosc_brutto,
            ef(&exp["zywnoscBrutto"]),
        ),
        ("handelBrutto", out.handel_brutto, ef(&exp["handelBrutto"])),
        ("pracaTerenu", out.praca_terenu, ef(&exp["pracaTerenu"])),
        (
            "pracaBudynkow",
            out.praca_budynkow,
            ef(&exp["pracaBudynkow"]),
        ),
        (
            "pieniadzBudynkow",
            out.pieniadz_budynkow,
            ef(&exp["pieniadzBudynkow"]),
        ),
        (
            "pieniadzZPracy",
            out.pieniadz_z_pracy,
            ef(&exp["pieniadzZPracy"]),
        ),
        ("zadowolenie", out.zadowolenie, ef(&exp["zadowolenie"])),
        ("drewnoTerenu", out.drewno_terenu, ef(&exp["drewnoTerenu"])),
        ("kamienTerenu", out.kamien_terenu, ef(&exp["kamienTerenu"])),
        ("glinaTerenu", out.glina_terenu, ef(&exp["glinaTerenu"])),
        ("rudaTerenu", out.ruda_terenu, ef(&exp["rudaTerenu"])),
        (
            "rudaZelazaTerenu",
            out.ruda_zelaza_terenu,
            ef(&exp["rudaZelazaTerenu"]),
        ),
    ]
}

fn check(fields: Vec<(&'static str, f64, f64)>, label: &str, mismatches: &mut Vec<String>) {
    for (name, got, exp) in fields {
        if !same(got, exp) {
            mismatches.push(format!("{label} {name}: rust={got:?} web={exp:?}"));
        }
    }
}

fn base_tile<'a>(teren: &'a str, nakladka: &'a str, rzeka: bool) -> WorkedTileImpInput<'a> {
    WorkedTileImpInput {
        teren_bazowy: teren,
        nakladka,
        ma_rzeke: rzeka,
        ulepszenia_keys: None,
        ulepszenie_key: None,
        zloze: None,
    }
}

fn assert_bits_eq(a: &TileYield, b: &TileYield) {
    for (name, x, y) in [
        ("zywnosc", a.zywnosc, b.zywnosc),
        ("praca", a.praca, b.praca),
        ("handel", a.handel, b.handel),
        ("drewno", a.drewno, b.drewno),
        ("kamien", a.kamien, b.kamien),
        ("glina", a.glina, b.glina),
        ("ruda", a.ruda, b.ruda),
        ("ruda_zelaza", a.ruda_zelaza, b.ruda_zelaza),
    ] {
        assert!(same(x, y), "{name}: {x:?} != {y:?}");
    }
}

#[test]
fn parity_tile_yield_full_bit_exact() {
    let v = vectors();
    let terrain = parse_terrain_yields().expect("terrain-yields.json");
    let tiles = v["tiles"].as_array().expect("tiles");
    assert_eq!(tiles.len(), 2000);
    let mut mismatches = Vec::new();
    for (i, entry) in tiles.iter().enumerate() {
        let owned = own_tile(entry);
        let got = tile_yield_full(&terrain, &borrow(&owned));
        check(
            tile_fields(&got, &entry["out"]),
            &format!("tile#{i}"),
            &mut mismatches,
        );
    }
    assert!(
        mismatches.is_empty(),
        "{} mismatches, first: {:?}",
        mismatches.len(),
        mismatches.iter().take(8).collect::<Vec<_>>()
    );
}

#[test]
fn parity_city_terrain_sums_imp_bit_exact() {
    let v = vectors();
    let terrain = parse_terrain_yields().expect("terrain-yields.json");
    let cities = v["cities"].as_array().expect("cities");
    assert_eq!(cities.len(), 400);
    let mut mismatches = Vec::new();
    for (i, city) in cities.iter().enumerate() {
        let owned: Vec<OwnedTile> = city["tiles"]
            .as_array()
            .unwrap()
            .iter()
            .map(own_tile)
            .collect();
        let refs: Vec<WorkedTileImpInput<'_>> = owned.iter().map(borrow).collect();
        let got: TerrainSums = city_terrain_sums_imp(&terrain, &refs);
        let agg = &city["agg"];
        for (name, g, e) in [
            ("zywnoscTerenu", got.zywnosc, ef(&agg["zywnoscTerenu"])),
            ("pracaTerenu", got.praca, ef(&agg["pracaTerenu"])),
            ("handelTerenu", got.handel, ef(&agg["handelTerenu"])),
        ] {
            if !same(g, e) {
                mismatches.push(format!("city#{i} {name}: rust={g:?} web={e:?}"));
            }
        }
    }
    assert!(
        mismatches.is_empty(),
        "{:?}",
        mismatches.iter().take(8).collect::<Vec<_>>()
    );
}

#[test]
fn parity_full_city_with_improvements_bit_exact() {
    let v = vectors();
    let terrain = parse_terrain_yields().expect("terrain-yields.json");
    let matrix: &CivMatrixFile = &load_civ_matrix().file;
    let full = v["full"].as_array().expect("full");
    assert_eq!(full.len(), 800);
    let mut mismatches = Vec::new();
    for (i, case) in full.iter().enumerate() {
        let params = params_of(&case["in"]["params"]);
        let input = input_of(case);
        let owned: Vec<OwnedTile> = case["in"]["tiles"]
            .as_array()
            .unwrap()
            .iter()
            .map(own_tile)
            .collect();
        let refs: Vec<WorkedTileImpInput<'_>> = owned.iter().map(borrow).collect();
        let buildings = buildings_of(case);
        let got = city_yield_per_turn_from_worked_imp(
            matrix, &terrain, &params, &input, &refs, &buildings,
        );
        check(
            city_fields(&got, &case["out"]),
            &format!("full#{i}"),
            &mut mismatches,
        );
    }
    assert!(
        mismatches.is_empty(),
        "{} mismatches, first: {:?}",
        mismatches.len(),
        mismatches.iter().take(8).collect::<Vec<_>>()
    );
}

#[test]
fn parity_building_happiness_bit_exact() {
    let v = vectors();
    let hap = v["hap"].as_array().expect("hap");
    assert_eq!(hap.len(), 1900);
    let mut mismatches = Vec::new();
    for (i, case) in hap.iter().enumerate() {
        let inp = &case["in"];
        // web `b.dajeSzczescie === true`: tylko JSON `true` daje szczescie.
        let daje = inp["dajeSzczescie"].as_bool() == Some(true);
        // web `typeof b.baza.zadowolenie === 'number'`: tylko liczba tagowana.
        let baza_z = if inp["baza"]
            .get("zadowolenie")
            .and_then(|z| z.get("f"))
            .is_some()
        {
            Some(ef(&inp["baza"]["zadowolenie"]))
        } else {
            None
        };
        // web `b.przyrost.zadowolenie` gdy brak = undefined -> NaN w buildingEffectAtLevel.
        let przyrost_z = if inp["przyrost"]
            .get("zadowolenie")
            .and_then(|z| z.get("f"))
            .is_some()
        {
            ef(&inp["przyrost"]["zadowolenie"])
        } else {
            f64::NAN
        };
        let level = ef(&inp["level"]);
        let got = building_happiness_at_level(daje, baza_z, przyrost_z, level);
        let exp = ef(&case["out"]);
        if !same(got, exp) {
            mismatches.push(format!("hap#{i} ({}): rust={got:?} web={exp:?}", inp["id"]));
        }
    }
    assert!(
        mismatches.is_empty(),
        "{} mismatches, first: {:?}",
        mismatches.len(),
        mismatches.iter().take(8).collect::<Vec<_>>()
    );
}

// ---------------------------------------------------------------------------
// Testy strukturalne: galezie `tileYield` z ulepszeniami i `buildingHappinessAtLevel`.
// ---------------------------------------------------------------------------

/// Galaz `impKeys` (L458-460): niepusta `ulepszeniaKeys` wygrywa z `ulepszenieKey`.
#[test]
fn structural_imp_keys_list_wins_over_single_key() {
    let data = parse_terrain_yields().unwrap();
    let base = tile_yield_full(&data, &base_tile("rownina", "brak", false));
    let list = vec!["farma".to_string()];
    let with_list = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            ulepszenie_key: Some("tartak"),
            ..base_tile("rownina", "brak", false)
        },
    );
    // farma: zywnosc 3, praca 3, handel 3. tartak (praca 3, handel 3) NIE moze wejsc.
    assert_eq!(with_list.zywnosc - base.zywnosc, 3.0);
    assert_eq!(with_list.praca - base.praca, 3.0);
    assert_eq!(with_list.handel - base.handel, 3.0);
}

/// Galaz pustej listy (`?.length` = 0): przechodzi do `ulepszenieKey`.
#[test]
fn structural_empty_list_falls_back_to_single_key() {
    let data = parse_terrain_yields().unwrap();
    let list: Vec<String> = vec![];
    let via_fallback = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            ulepszenie_key: Some("farma"),
            ..base_tile("rownina", "brak", false)
        },
    );
    let via_none = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: None,
            ulepszenie_key: Some("farma"),
            ..base_tile("rownina", "brak", false)
        },
    );
    assert_bits_eq(&via_fallback, &via_none);
    let base = tile_yield_full(&data, &base_tile("rownina", "brak", false));
    assert_eq!(via_fallback.praca - base.praca, 3.0);
}

/// `ulepszenieKey` = '' (falsy) i pusta lista: brak ulepszen, wynik identyczny z kafelkiem bazowym.
#[test]
fn structural_empty_key_is_noop() {
    let data = parse_terrain_yields().unwrap();
    let base = tile_yield_full(&data, &base_tile("laka", "las", true));
    let empty: Vec<String> = vec![];
    let noop = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&empty),
            ulepszenie_key: Some(""),
            ..base_tile("laka", "las", true)
        },
    );
    assert_bits_eq(&base, &noop);
}

/// Bonus `pieniadz` z JSON trafia do `handel` (web `applyImprovementBonus`): oboz_lowiecki =
/// zywnosc 1, pieniadz 1 (-> handel), praca 1, handel 2.
#[test]
fn structural_pieniadz_bonus_goes_to_handel() {
    let data = parse_terrain_yields().unwrap();
    let base = tile_yield_full(&data, &base_tile("rownina", "brak", false));
    let list = vec!["oboz_lowiecki".to_string()];
    let got = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            ..base_tile("rownina", "brak", false)
        },
    );
    assert_eq!(got.zywnosc - base.zywnosc, 1.0);
    assert_eq!(got.praca - base.praca, 1.0);
    assert_eq!(got.handel - base.handel, 3.0);
}

/// Kopalnie (web `oreYieldFromImprovements`, `ORE_YIELD_PER_MINE` = 2): miedz -> ruda, zelazo -> ruda_zelaza.
/// Pole `zloze` NIE zmienia wyniku (web je ignoruje).
#[test]
fn structural_ore_mines_and_zloze_ignored() {
    let data = parse_terrain_yields().unwrap();
    let list = vec!["kopalnia_miedzi".to_string()];
    let cu = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            zloze: Some("zelazo"),
            ..base_tile("gory", "brak", false)
        },
    );
    assert_eq!(cu.ruda, 2.0);
    assert_eq!(cu.ruda_zelaza, 0.0);
    let cu_no_zloze = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            zloze: None,
            ..base_tile("gory", "brak", false)
        },
    );
    assert_bits_eq(&cu, &cu_no_zloze);

    let fe = vec!["kopalnia_zelaza".to_string()];
    let fe_tile = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&fe),
            ..base_tile("gory", "brak", false)
        },
    );
    assert_eq!(fe_tile.ruda, 0.0);
    assert_eq!(fe_tile.ruda_zelaza, 2.0);
}

/// Klucz spoza katalogu (web `applyImprovementBonus` czyta JSON wprost): brak bonusu.
#[test]
fn structural_unknown_and_legacy_key_no_bonus() {
    let data = parse_terrain_yields().unwrap();
    let base = tile_yield_full(&data, &base_tile("rownina", "brak", false));
    for key in ["nieznane_ulepszenie", "pastwisko", "brak"] {
        let list = vec![key.to_string()];
        let got = tile_yield_full(
            &data,
            &WorkedTileImpInput {
                ulepszenia_keys: Some(&list),
                ..base_tile("rownina", "brak", false)
            },
        );
        assert_bits_eq(&got, &base);
    }
}

/// Modyfikator lasu dokladia drewno, rzeki glina (web L441-455); wartosci z terrain-yields.json.
#[test]
fn structural_forest_adds_wood_river_adds_clay() {
    let data = parse_terrain_yields().unwrap();
    let find = |name: &str| {
        data.terrain_modifiers
            .iter()
            .find(|m| m.modyfikator == name)
            .map(|m| (m.drewno as f64, m.glina as f64))
            .expect("modyfikator")
    };
    let (forest_drewno, _) = find("Las (nakładka)");
    let (_, river_glina) = find("Rzeka");
    let plain = tile_yield_full(&data, &base_tile("rownina", "brak", false));
    let forest = tile_yield_full(&data, &base_tile("rownina", "las", false));
    let river = tile_yield_full(&data, &base_tile("rownina", "brak", true));
    assert_eq!(forest.drewno - plain.drewno, forest_drewno.max(0.0));
    assert_eq!(river.glina - plain.glina, river_glina.max(0.0));
}

/// Nieznany teren: zera; ulepszenie dodaje dokladnie swoj bonus, bez dodatkowych skladnikow.
#[test]
fn boundary_unknown_terrain_zero_then_bonus_only() {
    let data = parse_terrain_yields().unwrap();
    let zero = tile_yield_full(&data, &base_tile("nieznany_teren", "brak", false));
    for x in [
        zero.zywnosc,
        zero.praca,
        zero.handel,
        zero.drewno,
        zero.kamien,
        zero.glina,
        zero.ruda,
        zero.ruda_zelaza,
    ] {
        assert_eq!(x.to_bits(), 0.0f64.to_bits());
    }
    let list = vec!["farma".to_string()];
    let farma = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            ..base_tile("nieznany_teren", "brak", false)
        },
    );
    assert_eq!(farma.zywnosc, 3.0);
    assert_eq!(farma.praca, 3.0);
    assert_eq!(farma.handel, 3.0);
    assert_eq!(
        farma.drewno + farma.kamien + farma.glina + farma.ruda + farma.ruda_zelaza,
        0.0
    );
}

/// Galezie `buildingHappinessAtLevel`: !daje -> 0; baza 0 / brak -> ryczalt 1; baza != 0 -> 1 + buildingValue.
#[test]
fn structural_happiness_branches() {
    // Budynek nie daje szczescia: 0, nawet przy zadowoleniu.
    assert_eq!(building_happiness_at_level(false, Some(5.0), 1.0, 3.0), 0.0);
    // Daje, brak baza.zadowolenie: ryczalt.
    assert_eq!(BUILDING_HAPPINESS_BASE_PER_BUILDING, 1.0);
    assert_eq!(building_happiness_at_level(true, None, f64::NAN, 3.0), 1.0);
    // baza.zadowolenie = 0 (takze -0): tylko ryczalt, przyrost nie wchodzi.
    assert_eq!(building_happiness_at_level(true, Some(0.0), 5.0, 3.0), 1.0);
    assert_eq!(
        building_happiness_at_level(true, Some(-0.0), 5.0, 3.0).to_bits(),
        1.0f64.to_bits()
    );
    // Swiatynia-like: zadowolenie 2, przyrost 1, poziom 3 -> floor(2 + 1*2) = 4 -> 1 + 4 = 5.
    assert_eq!(building_happiness_at_level(true, Some(2.0), 1.0, 3.0), 5.0);
    // Poziom ulamkowy: max(1, floor(1.9)) = 1 -> bez przyrostu.
    assert_eq!(building_happiness_at_level(true, Some(2.0), 1.0, 1.9), 3.0);
    // NaN w bazie propaguje (web: NaN !== 0 -> buildingValue = NaN).
    assert!(building_happiness_at_level(true, Some(f64::NAN), 1.0, 2.0).is_nan());
}

/// Pelna `cityYieldPerTurn` z kafelkiem ulepszonym: wynik rozni sie od bazowego o bonus kafelka
/// w zywnosc/praca/handel (ten sam wejsciowy miasto, bez budynkow).
#[test]
fn structural_city_uses_improved_tile_sums() {
    let terrain = parse_terrain_yields().unwrap();
    let matrix: &CivMatrixFile = &load_civ_matrix().file;
    let v = vectors();
    let case = &v["full"].as_array().unwrap()[0];
    let params = params_of(&case["in"]["params"]);
    // Bez mlyna (web: pracaBruttoTerenu = pracaTerenu * mnoznik) delta pracaTerenu = plon kafelka.
    let input = CityYieldInput {
        ma_mlyn: false,
        ma_cegielnia: false,
        ..input_of(case)
    };
    let base = city_yield_per_turn_from_worked_imp(
        matrix,
        &terrain,
        &params,
        &input,
        &[base_tile("rownina", "brak", false)],
        &[],
    );
    let list = vec!["farma".to_string()];
    let improved = city_yield_per_turn_from_worked_imp(
        matrix,
        &terrain,
        &params,
        &input,
        &[WorkedTileImpInput {
            ulepszenia_keys: Some(&list),
            ..base_tile("rownina", "brak", false)
        }],
        &[],
    );
    // Step 1 dokleja praca kafelka (farma: praca 3) do pracaTerenu; ulepszenie nie moze byc ignorowane.
    assert_eq!(improved.praca_terenu - base.praca_terenu, 3.0);
}

/// Zadowolenie miasta (web `zadBudynkow` = suma `buildingHappinessAtLevel` po budynkach, floor, L881/L1020):
/// budynki z szczesciem sumuja sie od 0; `dajeSzczescie !== true` daje 0; bez `baza.zadowolenie` tylko ryczalt.
#[test]
fn structural_happiness_sums_across_buildings_then_floor() {
    let terrain = parse_terrain_yields().unwrap();
    let matrix: &CivMatrixFile = &load_civ_matrix().file;
    let v = vectors();
    let case = &v["full"].as_array().unwrap()[0];
    let params = params_of(&case["in"]["params"]);
    let input = input_of(case);
    let zero = civ_engine::domain::economy_yield::BuildingYieldsInput {
        praca: 0.0,
        pieniadz: 0.0,
        zywnosc: 0.0,
        nauka: 0.0,
        kultura: 0.0,
    };
    let base = CityBuildingInput {
        id: "swiatynia",
        level: 2.0,
        baza: zero,
        przyrost: zero,
    };
    let buildings = [
        // 1 + buildingValue(baza 2, przyrost 1, poziom 2) = 1 + 3 = 4
        CityBuildingFullInput {
            base,
            daje_szczescie: true,
            baza_zadowolenie: Some(2.0),
            przyrost_zadowolenie: 1.0,
        },
        // Mury: dajeSzczescie false -> 0
        CityBuildingFullInput {
            base,
            daje_szczescie: false,
            baza_zadowolenie: Some(9.0),
            przyrost_zadowolenie: 9.0,
        },
        // ryczalt bez baza.zadowolenie -> 1
        CityBuildingFullInput {
            base: CityBuildingInput { level: 1.0, ..base },
            daje_szczescie: true,
            baza_zadowolenie: None,
            przyrost_zadowolenie: f64::NAN,
        },
    ];
    let out =
        city_yield_per_turn_from_worked_imp(matrix, &terrain, &params, &input, &[], &buildings);
    assert_eq!(out.zadowolenie, 5.0);
    assert_eq!(out.drewno_terenu, 0.0);
    assert_eq!(out.ruda_zelaza_terenu, 0.0);
    // Ulamkowa suma: floor po sumie (web Math.floor(zadBudynkow)); 1 + buildingValue(1.5, 0, 2) = 1 + 1 = 2.
    let frac = [CityBuildingFullInput {
        base,
        daje_szczescie: true,
        baza_zadowolenie: Some(1.5),
        przyrost_zadowolenie: 0.0,
    }];
    let out2 = city_yield_per_turn_from_worked_imp(matrix, &terrain, &params, &input, &[], &frac);
    assert_eq!(out2.zadowolenie, 2.0);
}

/// Zalozenie Z-V-2: clamp `Math.max(0,.)` po ulepszeniach jest rownowazny tylko, gdy zaden bonus ulepszen
/// nie jest ujemny. Test pilnuje tego zalozenia danych (zmiana na ujemne wymaga ponownego dowodu clampu).
#[test]
fn structural_improvement_bonuses_nonnegative_in_data() {
    fn collect(v: &Value, out: &mut Vec<f64>) {
        match v {
            Value::Object(map) => {
                for (key, child) in map {
                    if key == "bonus" {
                        if let Value::Object(bonus) = child {
                            out.extend(bonus.values().filter_map(Value::as_f64));
                        }
                    }
                    collect(child, out);
                }
            }
            Value::Array(items) => items.iter().for_each(|item| collect(item, out)),
            _ => {}
        }
    }
    let data: Value = serde_json::from_str(TERRAIN_IMPROVEMENTS_JSON).unwrap();
    let mut values = Vec::new();
    collect(&data, &mut values);
    assert!(
        values.len() >= 20,
        "too few bonus values checked: {}",
        values.len()
    );
    assert!(
        values.iter().all(|x| *x >= 0.0),
        "negative improvement bonus present"
    );
}
