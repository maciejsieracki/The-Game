// R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1 (plan P3.11): zgodnosc danych Rust z pinem webowym edb8fb56.
//
// Zrodlo prawdy: `git show edb8fb56:gra/data/<plik>.json`. Wszystkie stale ponizej (liczby i ID)
// wygenerowano skryptem z tych blobow i wklejono literalnie; ich udokumentowana provenancja
// jest w dyspozycje/rust-port/p3/P3-11-DATA-COMPLIANCE.md.
//
// Moduly danych ladowane przez #[path] (lib.rs i src/data/** NIETKNIETE — zakaz z dispatchu).
// Testy nie duplikuja asercji z data_*.rs; dodaja: kompletnosc ID/licznosci wzgledem web oraz
// probe parsowania wszystkich 29 plikow `rust-port/engine/data/*.json`.

#[path = "../src/data/buildings_tech.rs"]
mod buildings_tech;
#[path = "../src/data/civilizations.rs"]
#[allow(dead_code)]
mod civilizations;
#[path = "../src/data/economy_society.rs"]
mod economy_society;
#[path = "../src/data/economy_society_part2.rs"]
mod economy_society_part2;
#[path = "../src/data/terrain_map.rs"]
mod terrain_map;
#[path = "../src/data/units_combat.rs"]
mod units_combat;

use serde_json::Value;
use std::collections::BTreeSet;

use buildings_tech::{parse_buildings, parse_tech, parse_wonders, BUILDINGS_JSON, TECH_JSON};
use civilizations::{
    parse_city_names_pools, parse_civ_ai, parse_civ_matrix, parse_civ_params, parse_civs,
    parse_diplomacy, parse_diplomacy_acceptance_points,
};
use economy_society::{
    parse_citizen_resource_upkeep, parse_econ_params, parse_epoka_ludnosc_manpower,
    parse_miasto_params, parse_resources, parse_society_params,
};
use economy_society_part2::{parse_ai_params, parse_e_start_params, parse_ui_params};
use terrain_map::{
    parse_map_gen_params, parse_terrain_improvements, parse_terrain_movement, parse_terrain_yields,
    TERRAIN_IMPROVEMENTS_JSON,
};
use units_combat::{
    parse_auto_battle_params, parse_combat_params, parse_counters, parse_power_params,
    parse_terrain_combat, parse_units, UNITS_JSON,
};

fn raw(json: &str) -> Value {
    serde_json::from_str(json).expect("embedded JSON must be valid")
}

fn set<'a, I: IntoIterator<Item = &'a str>>(it: I) -> BTreeSet<&'a str> {
    it.into_iter().collect()
}

fn no_dups(name: &str, ids: &[&str]) {
    let s: BTreeSet<&str> = ids.iter().copied().collect();
    assert_eq!(
        s.len(),
        ids.len(),
        "{name}: duplicate IDs in Rust collection"
    );
}

// ---------------------------------------------------------------------------
// Stale z web (edb8fb56). Liczby: len() z gra/data/*.json.
// ---------------------------------------------------------------------------
const WEB_CIV_COUNT: usize = 15; // civs.json .cywilizacje
const WEB_START_GRY_COUNT: usize = 11; // civs.json .start_gry
const WEB_UNITS_COUNT: usize = 75; // units.json (array)
const WEB_BUILDINGS_COUNT: usize = 42; // buildings.json (array)
const WEB_TECH_COUNT: usize = 32; // tech.json .technologie
const WEB_CUDA_COUNT: usize = 19; // wonders.json .cuda
const WEB_PARKOWANE_COUNT: usize = 5; // wonders.json .parkowane_epoka4plus
const WEB_PANSTWA_COUNT: usize = 15; // wonders.json .panstwa
const WEB_RESOURCES_COUNT: usize = 15; // resources.json (array)
const WEB_TERRAIN_TYPES_COUNT: usize = 8; // terrain-yields.json .terrain_types
const WEB_TERRAIN_MODIFIERS_COUNT: usize = 2; // terrain-yields.json .terrain_modifiers
const WEB_IMPROVEMENT_COUNT: usize = 22; // terrain-improvements.json: klucze nie zaczynajace sie od "_" (= WEB_IMPROVEMENT_KEYS)

// Pliki JSON, dla ktorych parse musi sie powiesc (29 plikow w gra/data i w rust-port/engine/data).
const WEB_JSON_FILE_COUNT: usize = 29;

#[test]
fn web_pin_constants_are_internally_consistent() {
    assert_eq!(WEB_CIV_NAMES.len(), WEB_CIV_COUNT);
    assert_eq!(WEB_CIV_TYPY.len(), WEB_CIV_COUNT);
    assert_eq!(WEB_PANSTWA_KEYS.len(), WEB_PANSTWA_COUNT);
    assert_eq!(WEB_UNITS_JEDNOSTKA.len(), WEB_UNITS_COUNT);
    assert_eq!(WEB_BUILDING_IDS.len(), WEB_BUILDINGS_COUNT);
    assert_eq!(WEB_TECH_NAMES.len(), WEB_TECH_COUNT);
    assert_eq!(WEB_CUDA_IDS.len(), WEB_CUDA_COUNT);
    assert_eq!(WEB_PARKOWANE_IDS.len(), WEB_PARKOWANE_COUNT);
    assert_eq!(WEB_RESOURCES.len(), WEB_RESOURCES_COUNT);
    assert_eq!(WEB_TERRAIN_TYPES.len(), WEB_TERRAIN_TYPES_COUNT);
    assert_eq!(WEB_IMPROVEMENT_KEYS.len(), WEB_IMPROVEMENT_COUNT);
    // Stale ID wewnetrznie spojne z pinem (typ cywilizacji == klucze panstw cudow).
    assert_eq!(
        set(WEB_CIV_TYPY.iter().copied()),
        set(WEB_PANSTWA_KEYS.iter().copied())
    );
    assert_eq!(
        set(WEB_PANSTWA_KEYS.iter().copied()),
        set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied())
    );
}

// (a) liczba i ID cywilizacji: Rust == web na pinie.
#[test]
fn civs_count_and_ids_match_web_pin() {
    let f = parse_civs().expect("civs.json");
    assert_eq!(f.cywilizacje.len(), WEB_CIV_COUNT);
    assert_eq!(f.start_gry.len(), WEB_START_GRY_COUNT);
    no_dups(
        "civs.cywilizacja",
        &f.cywilizacje
            .iter()
            .map(|c| c.cywilizacja.as_str())
            .collect::<Vec<_>>(),
    );
    no_dups(
        "civs.typ_cywilizacji",
        &f.cywilizacje
            .iter()
            .map(|c| c.typ_cywilizacji.as_str())
            .collect::<Vec<_>>(),
    );
    assert_eq!(
        set(f.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
        set(WEB_CIV_NAMES.iter().copied()),
        "civs.json nazwy cywilizacji (Cywilizacja) != web"
    );
    assert_eq!(
        set(f.cywilizacje.iter().map(|c| c.typ_cywilizacji.as_str())),
        set(WEB_CIV_TYPY.iter().copied()),
        "civs.json typCywilizacji (ID) != web"
    );
}

#[test]
fn civ_auxiliary_files_civ_ids_match_web_pin() {
    let m = parse_civ_matrix().expect("civ-matrix.json");
    assert_eq!(m.cywilizacje.len(), WEB_CIV_COUNT);
    assert_eq!(
        set(m.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
        set(WEB_CIV_NAMES.iter().copied()),
        "civ-matrix.json cywilizacja != web"
    );
    assert_eq!(
        set(m.cywilizacje.iter().map(|c| c.typ_cywilizacji.as_str())),
        set(WEB_CIV_TYPY.iter().copied()),
        "civ-matrix.json typ_cywilizacji != web"
    );
    let p = parse_civ_params().expect("civ-params.json");
    assert_eq!(p.cywilizacje.len(), WEB_CIV_COUNT);
    assert_eq!(
        set(p.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
        set(WEB_CIV_NAMES.iter().copied()),
        "civ-params.json cywilizacja != web"
    );
    let a = parse_civ_ai().expect("civ-ai.json");
    assert_eq!(a.cywilizacje.len(), WEB_CIV_COUNT);
    assert_eq!(
        set(a.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
        set(WEB_CIV_NAMES.iter().copied()),
        "civ-ai.json cywilizacja != web"
    );
}

#[test]
fn wonders_state_keys_match_web_pin() {
    let w = parse_wonders().expect("wonders.json");
    assert_eq!(w.panstwa.len(), WEB_PANSTWA_COUNT);
    assert_eq!(
        set(w.panstwa.keys().map(|k| k.as_str())),
        set(WEB_PANSTWA_KEYS.iter().copied()),
        "wonders.panstwa klucze != web"
    );
    assert_eq!(
        set(w.meta.wszystkie_cywilizacje.iter().map(|k| k.as_str())),
        set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied()),
        "wonders._meta.wszystkie_cywilizacje != web"
    );
}

// (b) liczności i zbiory ID kluczowych kolekcji.
#[test]
fn collection_counts_match_web_pin() {
    assert_eq!(parse_units().expect("units").len(), WEB_UNITS_COUNT);
    assert_eq!(
        parse_buildings().expect("buildings").len(),
        WEB_BUILDINGS_COUNT
    );
    assert_eq!(
        parse_tech().expect("tech").technologie.len(),
        WEB_TECH_COUNT
    );
    let w = parse_wonders().expect("wonders");
    assert_eq!(w.cuda.len(), WEB_CUDA_COUNT);
    assert_eq!(w.parkowane_epoka4plus.len(), WEB_PARKOWANE_COUNT);
    assert_eq!(w.panstwa.len(), WEB_PANSTWA_COUNT);
    assert_eq!(
        parse_resources().expect("resources").len(),
        WEB_RESOURCES_COUNT
    );
    let ty = parse_terrain_yields().expect("terrain-yields");
    assert_eq!(ty.terrain_types.len(), WEB_TERRAIN_TYPES_COUNT);
    assert_eq!(ty.terrain_modifiers.len(), WEB_TERRAIN_MODIFIERS_COUNT);
}

#[test]
fn collection_id_sets_match_web_pin() {
    let units = parse_units().expect("units");
    let names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
    no_dups("units.Jednostka", &names);
    assert_eq!(
        set(names.iter().copied()),
        set(WEB_UNITS_JEDNOSTKA.iter().copied()),
        "units"
    );

    let b = parse_buildings().expect("buildings");
    let ids: Vec<&str> = b.iter().map(|x| x.id.as_str()).collect();
    no_dups("buildings.id", &ids);
    assert_eq!(
        set(ids.iter().copied()),
        set(WEB_BUILDING_IDS.iter().copied()),
        "buildings"
    );

    let t = parse_tech().expect("tech");
    let tn: Vec<&str> = t
        .technologie
        .iter()
        .map(|x| x.technologia.as_str())
        .collect();
    no_dups("tech.Technologia", &tn);
    assert_eq!(
        set(tn.iter().copied()),
        set(WEB_TECH_NAMES.iter().copied()),
        "tech"
    );

    let w = parse_wonders().expect("wonders");
    let cuda: Vec<&str> = w.cuda.iter().map(|c| c.id.as_str()).collect();
    no_dups("cuda.id", &cuda);
    assert_eq!(
        set(cuda.iter().copied()),
        set(WEB_CUDA_IDS.iter().copied()),
        "cuda"
    );
    let park: Vec<&str> = w
        .parkowane_epoka4plus
        .iter()
        .map(|c| c.id.as_str())
        .collect();
    assert_eq!(
        set(park.iter().copied()),
        set(WEB_PARKOWANE_IDS.iter().copied()),
        "parkowane"
    );

    let res = parse_resources().expect("resources");
    let rn: Vec<&str> = res.iter().map(|r| r.surowiec.as_str()).collect();
    no_dups("resources.Surowiec", &rn);
    assert_eq!(
        set(rn.iter().copied()),
        set(WEB_RESOURCES.iter().copied()),
        "resources"
    );

    let ty = parse_terrain_yields().expect("terrain-yields");
    let tt: Vec<&str> = ty.terrain_types.iter().map(|x| x.teren.as_str()).collect();
    no_dups("terrain_types.Teren", &tt);
    assert_eq!(
        set(tt.iter().copied()),
        set(WEB_TERRAIN_TYPES.iter().copied()),
        "terrain types"
    );
}

// Embedded kopie (include_str! w src/data) == web: liczby z surowego Value, niezalezne od struktur.
#[test]
fn embedded_raw_counts_match_web_pin() {
    assert_eq!(raw(UNITS_JSON).as_array().unwrap().len(), WEB_UNITS_COUNT);
    assert_eq!(
        raw(BUILDINGS_JSON).as_array().unwrap().len(),
        WEB_BUILDINGS_COUNT
    );
    assert_eq!(
        raw(TECH_JSON)["technologie"].as_array().unwrap().len(),
        WEB_TECH_COUNT
    );
    assert_eq!(
        raw(include_str!("../data/resources.json"))
            .as_array()
            .unwrap()
            .len(),
        WEB_RESOURCES_COUNT
    );
    let imp = raw(TERRAIN_IMPROVEMENTS_JSON);
    let keys: BTreeSet<&str> = imp
        .as_object()
        .unwrap()
        .keys()
        .map(|k| k.as_str())
        .filter(|k| !k.starts_with('_'))
        .collect();
    assert_eq!(keys.len(), WEB_IMPROVEMENT_COUNT);
    assert_eq!(
        keys,
        set(WEB_IMPROVEMENT_KEYS.iter().copied()),
        "terrain-improvements klucze != web"
    );
}

// terrain-improvements: struktura ma deny_unknown_fields, wiec sukces parsowania dowodzi tylko, ze
// w JSON nie ma kluczy nieznanych strukturze. NIE dowodzi, ze pola opcjonalne sa zamodelowane
// (brakujace pole Option przechodzi bez bledu). Sprawdzane sa tylko dwa pola jako probka.
#[test]
fn terrain_improvements_parses_strict_with_farma_and_posterunek() {
    let f = parse_terrain_improvements()
        .expect("terrain-improvements.json must parse (deny_unknown_fields)");
    assert!(!f.farma.nazwa.is_empty());
    assert!(!f.posterunek.nazwa.is_empty());
}

// (c, czesciowo) probe: wszystkie 29 plikow parsuje sie modulem Rust.
#[test]
fn all_29_data_files_parse_with_rust_modules() {
    let mut ok = 0usize;
    macro_rules! probe {
        ($name:expr, $e:expr) => {{
            match $e {
                Ok(_) => ok += 1,
                Err(e) => panic!("{} failed to parse: {e}", $name),
            }
        }};
    }
    probe!("civs.json", parse_civs());
    probe!("civ-matrix.json", parse_civ_matrix());
    probe!("civ-params.json", parse_civ_params());
    probe!("civ-ai.json", parse_civ_ai());
    probe!("diplomacy.json", parse_diplomacy());
    probe!(
        "diplomacy-acceptance-points.json",
        parse_diplomacy_acceptance_points()
    );
    probe!("city-names-pools.json", parse_city_names_pools());
    probe!("buildings.json", parse_buildings());
    probe!("wonders.json", parse_wonders());
    probe!("tech.json", parse_tech());
    probe!("units.json", parse_units());
    probe!("combat-params.json", parse_combat_params());
    probe!("terrain-combat.json", parse_terrain_combat());
    probe!("counters.json", parse_counters());
    probe!("auto-battle-params.json", parse_auto_battle_params());
    probe!("power-params.json", parse_power_params());
    probe!("econ-params.json", parse_econ_params());
    probe!("society-params.json", parse_society_params());
    probe!(
        "epoka-ludnosc-manpower.json",
        parse_epoka_ludnosc_manpower()
    );
    probe!(
        "citizen-resource-upkeep.json",
        parse_citizen_resource_upkeep()
    );
    probe!("miasto-params.json", parse_miasto_params());
    probe!("resources.json", parse_resources());
    probe!("e-start-params.json", parse_e_start_params());
    probe!("ai-params.json", parse_ai_params());
    probe!("ui-params.json", parse_ui_params());
    probe!("terrain-improvements.json", parse_terrain_improvements());
    probe!("terrain-movement.json", parse_terrain_movement());
    probe!("terrain-yields.json", parse_terrain_yields());
    probe!("map-gen-params.json", parse_map_gen_params());
    assert_eq!(ok, WEB_JSON_FILE_COUNT, "liczba probe != 29 (pin edb8fb56)");
    // Pokrycie: katalog rust-port/engine/data ma dokladnie tyle plikow *.json, ile probe.
    let on_disk = std::fs::read_dir(concat!(env!("CARGO_MANIFEST_DIR"), "/data"))
        .expect("rust-port/engine/data")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
        .count();
    assert_eq!(
        on_disk, ok,
        "pliki *.json w rust-port/engine/data nieobjete probe"
    );
}

// (c, LUKA — nie test): 1:1 round-trip (typed -> Value == raw) mozliwy dzis TYLKO dla 7 plikow
// cywilizacji (struktury z #[derive(Serialize)] w civilizations.rs; pokryte w data_civilizations.rs).
// Pozostale 22 struktury maja wylacznie #[derive(Deserialize)], wiec zwrotna serializacja
// wymaga zmiany src/data/** (poza allowlista P3-11). Luka opisana w P3-11-DATA-COMPLIANCE.md.

// Stale ID z web (generowane z gra/data/*.json @ edb8fb56, wklejone literalnie).
const WEB_CIV_NAMES: &[&str] = &[
    "Grecy",
    "Rzymianie",
    "Chińczycy",
    "Inkowie",
    "Zulusi",
    "Egipt",
    "Sumerowie",
    "Celtowie",
    "Germanie",
    "Harappa",
    "Hetyci",
    "Słowianie",
    "Babilonia",
    "Asyria",
    "Fenicjanie",
]; // civs.json .cywilizacje[].Cywilizacja
const WEB_CIV_TYPY: &[&str] = &[
    "grecy",
    "rzymianie",
    "chinczycy",
    "inkowie",
    "zulusi",
    "egipt",
    "sumer",
    "celtowie",
    "germanie",
    "harappa",
    "hetyci",
    "slowianie",
    "babilonia",
    "asyria",
    "fenicjanie",
]; // civs.json .cywilizacje[].typCywilizacji (ID)

const WEB_UNITS_JEDNOSTKA: &[&str] = &[
    "Wojownik",
    "Procarz",
    "Oszczepnik",
    "Łucznik",
    "Zwiadowca",
    "Włócznik",
    "Wojownik z mieczem i tarczą",
    "Rydwan (woły)",
    "Konnica",
    "Galera",
    "Falanga",
    "Hieros Lochos (Święty Zastęp)",
    "Hastati",
    "Triari",
    "Jeździec chiński",
    "Hu Ben Wei (Gwardia Tygrysa)",
    "Impi",
    "Oszczepnik Zulu (Izijula)",
    "uThulwana (Białe Tarcze)",
    "Wojownik z maczugą (Chaska)",
    "Wojownik z toporem",
    "Procarz (Huaracoc)",
    "Oszczepnik (Estólica)",
    "Królewska Gwardia",
    "Rydwan konny",
    "Łucznik egipski",
    "Rydwan egipski",
    "Wojownik z khopesh",
    "Medżaj (Gwardia Faraona)",
    "Łucznik nubijski",
    "Łucznik sumeryjski",
    "Rydwan sumeryjski",
    "Włócznik sumeryjski",
    "Gwardia Królewska Sumeru",
    "Wojownik mykeński",
    "Rydwan mykeński",
    "Wojownik Sherden",
    "Halabardnik Shang",
    "Rydwan Shang",
    "Łucznik akadyjski",
    "Gaesatae",
    "Soldurii",
    "Rydwan celtycki",
    "Wojownik germański",
    "Berserker germański",
    "Taran",
    "Taran okuty",
    "Katapulta",
    "Wieża oblężnicza",
    "Wojownik tyrreński",
    "Wojownik szekelesz",
    "Konnica lancowa asyryjska",
    "Konnica łucznicza asyryjska",
    "Łucznik asyryjski",
    "Drużynnik",
    "Jeździec z oszczepami",
    "Strażnik bram Harappy",
    "Piechota induska",
    "Garnizon Harappy",
    "Rydwan Kapadokijski",
    "Piechota hetycka",
    "Gwardia hetycka",
    "Gwardia Ishtar",
    "Wojownik babiloński",
    "Piechota neobabilońska",
    "Tyrski miecznik",
    "Wojownik fenicki",
    "Gwardia Tyreńska",
    "Thorakites",
    "Evocati",
    "iButho z iklwa",
    "Gwardzista z champi",
    "Wojownik z żelaznym khopesh",
    "Mur tarcz (Sargonid)",
    "Miecznik galijski",
];
const WEB_BUILDING_IDS: &[&str] = &[
    "stolarnia",
    "kamieniarski",
    "kuznia",
    "odlewnia_brazu",
    "odlewnia_zelaza",
    "wielka_odlewnia",
    "targowisko",
    "port",
    "port_wielki",
    "spichlerz",
    "spichlerz_ii",
    "garncarnia",
    "cegielnia",
    "kamienne_kregi",
    "swiatynia",
    "biblioteka",
    "studnia",
    "akwedukt",
    "mennica",
    "palisada",
    "mury",
    "koszary",
    "magazyn",
    "stela",
    "palac",
    "palac_ii",
    "palac_iii",
    "kuznia_zelaza",
    "wielka_kuznia",
    "fort",
    "baszta",
    "warsztat_oblezniczy",
    "akademia",
    "teatr",
    "sad",
    "dom_starszyzny",
    "dwor_zarzadcy",
    "pretorium",
    "trybunal",
    "garnizon",
    "laznia_publiczna",
    "akademia_wojskowa",
];
const WEB_TECH_NAMES: &[&str] = &[
    "Obróbka drewna",
    "Garncarstwo",
    "Murarstwo",
    "Rolnictwo",
    "Łowiectwo",
    "Łucznictwo",
    "Oswojenie zwierząt",
    "Mistycyzm",
    "Wymiana",
    "Gospodarka wodna",
    "Koło",
    "Brązownictwo",
    "Żegluga",
    "Pismo",
    "Religia",
    "Jeździectwo",
    "Wojskowość",
    "Matematyka",
    "Handel",
    "Kodeks",
    "Budownictwo",
    "Waluta",
    "Astronomia",
    "Hutnictwo żelaza",
    "Inżynieria",
    "Oblężnictwo",
    "Filozofia",
    "Prawo",
    "Drogi brukowane",
    "Medycyna",
    "Obróbka żelaza",
    "Sztuka wojenna",
];
const WEB_CUDA_IDS: &[&str] = &[
    "piramidy",
    "wielka_stela",
    "wiszace_ogrody",
    "wyrocznia",
    "roquepertuse",
    "stupa_sanchi",
    "petra",
    "hamonga",
    "kolos",
    "osada_aschaffenburg",
    "ziggurat",
    "mundo_perdido",
    "terakotowa_armia",
    "koloseum",
    "dur_sharrukin",
    "brama_narodow",
    "palac_weiyang",
    "yerkapi",
    "posag_peruna",
];
const WEB_PARKOWANE_IDS: &[&str] = &[
    "nalanda",
    "angkor_wat",
    "wielki_dzwon",
    "mauzoleum_teodoryka",
    "kopiec_grobowy",
];
const WEB_PANSTWA_KEYS: &[&str] = &[
    "egipt",
    "sumer",
    "babilonia",
    "grecy",
    "hetyci",
    "celtowie",
    "harappa",
    "fenicjanie",
    "germanie",
    "inkowie",
    "chinczycy",
    "rzymianie",
    "asyria",
    "zulusi",
    "slowianie",
];
const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &[
    "egipt",
    "sumer",
    "babilonia",
    "grecy",
    "hetyci",
    "celtowie",
    "harappa",
    "fenicjanie",
    "germanie",
    "inkowie",
    "chinczycy",
    "rzymianie",
    "asyria",
    "zulusi",
    "slowianie",
];
const WEB_RESOURCES: &[&str] = &[
    "Żywność",
    "Drewno",
    "Kamień",
    "Glina",
    "Ruda",
    "Ruda żelaza",
    "Ruda cyny",
    "Koń",
    "Sól",
    "Złoto",
    "Cegła",
    "Ceramika",
    "Brąz",
    "Żelazo",
    "Stal",
];
const WEB_TERRAIN_TYPES: &[&str] = &[
    "Łąka",
    "Równina",
    "Wzgórza",
    "Góry",
    "Wybrzeże",
    "Morze",
    "Pustynia",
    "Polarny",
];
const WEB_IMPROVEMENT_KEYS: &[&str] = &[
    "bydlo",
    "droga",
    "droga_brukowana",
    "farma",
    "fort",
    "glinianka",
    "irygacja",
    "kamieniolom",
    "kopalnia_cyny",
    "kopalnia_miedzi",
    "kopalnia_zelaza",
    "kopalnia_zlota",
    "lama",
    "lodzie_rybackie",
    "oboz_lowiecki",
    "owce",
    "posterunek",
    "stadnina",
    "tarasy",
    "tartak",
    "warzelnia_soli",
    "wyrab",
];

// ---------------------------------------------------------------------------
// R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1 (plan P3.15): round-trip dla WSZYSTKICH 29 plikow.
// Typed (load_file z loadera P3.12, te same typy co w `data::*`) -> serde_json::to_value
// -> porownanie z serde_json::Value surowego pliku. Serialize dodano w src/data/** (P3-15).
//
// Dwie jawnie udokumentowane normalizacje porownania (nie maskuja utraty danych):
//  (N1) Option: klucz BRAK w surowym JSON vs `null` po round-tripie. Zgodnie z doc-komentarzem
//       buildings_tech.rs (brak klucza albo null -> None) obie formy to ta sama wartosc
//       `None`; serializacja Option bez skip_serializing_if emituje null. Liczone osobno.
//  (N2) Liczba: JSON `5` (calkowita) vs `5.0` (f64 pola struktury). Ta sama wartosc liczbowa;
//       liczone osobno. Kazda inna wartosc, brakujace/dodane niepuste pole = BLAD.
// ---------------------------------------------------------------------------
use civ_engine::data::buildings_tech::{Building, TechFile, Wonders};
use civ_engine::data::civilizations::{
    AcceptancePointsFile, CityNamesPoolsFile, CivAiFile, CivMatrixFile, CivParamsFile, CivsFile,
    DiplomacyFile,
};
use civ_engine::data::economy_society::{
    CitizenResourceUpkeep, EconParams, EpokaLudnoscManpower, MiastoParams, ResourceItem,
    SocietyParams,
};
use civ_engine::data::economy_society_part2::{AiParams, EStartParams, UiParams};
use civ_engine::data::loader::{load_file, DATA_FILES};
use civ_engine::data::terrain_map::{
    MapGenParamsFile, TerrainImprovementsFile, TerrainMovementFile, TerrainYieldsFile,
};
use civ_engine::data::units_combat::{
    AutoBattleParamsFile, CombatParamsFile, CounterRule, PowerParamsFile, TerrainCombatRecord,
    UnitRecord,
};
use serde::{de::DeserializeOwned, Serialize};

#[derive(Default)]
struct RoundtripDiff {
    /// Bledy: pola zgubione, dodane (niebedace null), rozne wartosci, rozna dlugosc tablic.
    errors: Vec<String>,
    /// N1: klucz brak w raw, null po round-tripie (Option).
    n1_null_for_absent: usize,
    /// N2: ta sama liczba, inna reprezentacja (int vs float).
    n2_int_float: usize,
}

fn compare_values(raw: &Value, back: &Value, path: &str, d: &mut RoundtripDiff) {
    match (raw, back) {
        (Value::Object(x), Value::Object(y)) => {
            for (k, p) in x {
                match y.get(k) {
                    Some(q) => compare_values(p, q, &format!("{path}.{k}"), d),
                    None => d.errors.push(format!(
                        "{path}.{k}: pole GUBIONE po round-tripie (raw={p})"
                    )),
                }
            }
            for (k, q) in y {
                if !x.contains_key(k) {
                    if q.is_null() {
                        d.n1_null_for_absent += 1;
                    } else {
                        d.errors.push(format!(
                            "{path}.{k}: pole DODANE po round-tripie (typed={q})"
                        ));
                    }
                }
            }
        }
        (Value::Array(x), Value::Array(y)) => {
            if x.len() != y.len() {
                d.errors.push(format!(
                    "{path}: dlugosc tablicy raw={} typed={}",
                    x.len(),
                    y.len()
                ));
                return;
            }
            for (i, (p, q)) in x.iter().zip(y.iter()).enumerate() {
                compare_values(p, q, &format!("{path}[{i}]"), d);
            }
        }
        (Value::Number(a), Value::Number(b)) => {
            if raw == back {
                return;
            }
            match (a.as_f64(), b.as_f64()) {
                (Some(fa), Some(fb)) if fa == fb => d.n2_int_float += 1,
                _ => d.errors.push(format!("{path}: raw={raw} typed={back}")),
            }
        }
        _ => {
            if raw != back {
                d.errors.push(format!("{path}: raw={raw} typed={back}"));
            }
        }
    }
}

fn assert_roundtrip<T: DeserializeOwned + Serialize>(name: &str) {
    let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("data");
    let raw_text = std::fs::read_to_string(dir.join(name)).expect("read raw data file");
    let raw: Value = serde_json::from_str(&raw_text).expect("raw JSON valid");
    let typed: T = load_file(&dir, name).unwrap_or_else(|e| panic!("{name}: load: {e}"));
    let back = serde_json::to_value(&typed).expect("serialize typed");
    let mut d = RoundtripDiff::default();
    compare_values(&raw, &back, "$", &mut d);
    eprintln!(
        "P3-15 {name}: bledy={} N1(null-za-brakiem)={} N2(int-vs-float)={}",
        d.errors.len(),
        d.n1_null_for_absent,
        d.n2_int_float
    );
    if !d.errors.is_empty() {
        let shown: Vec<&str> = d.errors.iter().take(20).map(String::as_str).collect();
        panic!(
            "{name}: {} bledow round-tripu:\n{}",
            d.errors.len(),
            shown.join("\n")
        );
    }
    // Liczniki N1/N2 sa przypiete per plik: zmiana liczby = FAIL (nie moga cicho rosnac ani zanikac).
    let (exp_n1, exp_n2) = RT_PINNED_NORMALIZATIONS
        .iter()
        .find(|(n, _, _)| *n == name)
        .map(|(_, a, b)| (*a, *b))
        .unwrap_or_else(|| panic!("{name}: brak przypietych licznikow N1/N2"));
    assert_eq!(
        d.n1_null_for_absent, exp_n1,
        "{name}: licznik N1 (null za brakiem klucza) rozni sie od przypietego"
    );
    assert_eq!(
        d.n2_int_float, exp_n2,
        "{name}: licznik N2 (int vs float) rozni sie od przypietego"
    );
}

/// Przypiete liczniki N1/N2 per plik (pomiar P3-15, dowod: P3-15-DATA-ROUNDTRIP.md §4 i §6.3).
/// Sumy: N1 = 1190, N2 = 120. Literalne `==` Value spelnione dla 22 plikow (N1 = N2 = 0).
const RT_PINNED_NORMALIZATIONS: &[(&str, usize, usize)] = &[
    ("ai-params.json", 0, 0),
    ("auto-battle-params.json", 0, 0),
    ("buildings.json", 277, 0),
    ("citizen-resource-upkeep.json", 0, 0),
    ("city-names-pools.json", 0, 0),
    ("civ-ai.json", 0, 0),
    ("civ-matrix.json", 0, 0),
    ("civ-params.json", 0, 0),
    ("civs.json", 0, 0),
    ("combat-params.json", 0, 0),
    ("counters.json", 0, 0),
    ("diplomacy-acceptance-points.json", 0, 0),
    ("diplomacy.json", 0, 0),
    ("e-start-params.json", 0, 0),
    ("econ-params.json", 0, 0),
    ("epoka-ludnosc-manpower.json", 0, 0),
    ("map-gen-params.json", 4, 1),
    ("miasto-params.json", 0, 0),
    ("power-params.json", 9, 8),
    ("resources.json", 0, 0),
    ("society-params.json", 0, 0),
    ("tech.json", 61, 0),
    ("terrain-combat.json", 0, 0),
    ("terrain-improvements.json", 375, 21),
    ("terrain-movement.json", 0, 0),
    ("terrain-yields.json", 0, 0),
    ("ui-params.json", 0, 0),
    ("units.json", 217, 52),
    ("wonders.json", 247, 38),
];

#[test]
fn roundtrip_pins_cover_all_29_files_exactly() {
    assert_eq!(
        RT_PINNED_NORMALIZATIONS.len(),
        WEB_JSON_FILE_COUNT,
        "P3-15: liczba przypietych licznikow N1/N2"
    );
    let pinned: BTreeSet<&str> = RT_PINNED_NORMALIZATIONS
        .iter()
        .map(|(n, _, _)| *n)
        .collect();
    assert_eq!(
        pinned.len(),
        RT_PINNED_NORMALIZATIONS.len(),
        "P3-15: zduplikowany plik w przypietych licznikach"
    );
    assert_eq!(
        pinned,
        set(DATA_FILES.iter().copied()),
        "P3-15: przypiete liczniki != DATA_FILES"
    );
}

macro_rules! roundtrip_cases {
    ($( $test:ident : $ty:ty => $file:literal ),* $(,)?) => {
        /// Nazwy 29 plikow objetych round-tripem (musza byc == DATA_FILES).
        const RT_FILES: &[&str] = &[$($file),*];
        $(
            #[test]
            fn $test() {
                assert_roundtrip::<$ty>($file);
            }
        )*
    };
}

roundtrip_cases! {
    rt_civs: CivsFile => "civs.json",
    rt_civ_matrix: CivMatrixFile => "civ-matrix.json",
    rt_civ_params: CivParamsFile => "civ-params.json",
    rt_civ_ai: CivAiFile => "civ-ai.json",
    rt_diplomacy: DiplomacyFile => "diplomacy.json",
    rt_diplomacy_acceptance_points: AcceptancePointsFile => "diplomacy-acceptance-points.json",
    rt_city_names_pools: CityNamesPoolsFile => "city-names-pools.json",
    rt_buildings: Vec<Building> => "buildings.json",
    rt_wonders: Wonders => "wonders.json",
    rt_tech: TechFile => "tech.json",
    rt_econ_params: EconParams => "econ-params.json",
    rt_society_params: SocietyParams => "society-params.json",
    rt_epoka_ludnosc_manpower: EpokaLudnoscManpower => "epoka-ludnosc-manpower.json",
    rt_citizen_resource_upkeep: CitizenResourceUpkeep => "citizen-resource-upkeep.json",
    rt_miasto_params: MiastoParams => "miasto-params.json",
    rt_resources: Vec<ResourceItem> => "resources.json",
    rt_e_start_params: EStartParams => "e-start-params.json",
    rt_ai_params: AiParams => "ai-params.json",
    rt_ui_params: UiParams => "ui-params.json",
    rt_terrain_improvements: TerrainImprovementsFile => "terrain-improvements.json",
    rt_terrain_movement: TerrainMovementFile => "terrain-movement.json",
    rt_terrain_yields: TerrainYieldsFile => "terrain-yields.json",
    rt_map_gen_params: MapGenParamsFile => "map-gen-params.json",
    rt_units: Vec<UnitRecord> => "units.json",
    rt_combat_params: CombatParamsFile => "combat-params.json",
    rt_terrain_combat: Vec<TerrainCombatRecord> => "terrain-combat.json",
    rt_counters: Vec<CounterRule> => "counters.json",
    rt_auto_battle_params: AutoBattleParamsFile => "auto-battle-params.json",
    rt_power_params: PowerParamsFile => "power-params.json",
}

#[test]
fn roundtrip_covers_all_29_data_files() {
    let rt: BTreeSet<&str> = RT_FILES.iter().copied().collect();
    assert_eq!(
        RT_FILES.len(),
        WEB_JSON_FILE_COUNT,
        "P3-15: liczba plikow round-trip"
    );
    assert_eq!(
        rt.len(),
        RT_FILES.len(),
        "P3-15: zduplikowany plik w round-trip"
    );
    assert_eq!(
        rt,
        set(DATA_FILES.iter().copied()),
        "P3-15: round-trip != DATA_FILES"
    );
}
