//! REPIN-WOJNA-NOWE-A: port `gra/src/battle/formationRules.ts` (pin `91dc998a`).
//!
//! web: gra/src/battle/formationRules.ts:3-30 (`classifyInitialBattleRole`), :46-85
//! (`initialBattleSlots`), :92-113 (`initialBattleFormation`), :115-127
//! (`compactLineAllowsAdvance`). Slowa kluczowe: `data/derived/formation-role-keywords.json`.
//!
//! Zalozenia (ZALOZENIE, nie zmierzone na pelnej przestrzeni Unicode):
//! - normalizacja diakrytyków obejmuje Latin-1 i Latin Extended-A (zakres dla danych PL);
//! - wspolrzedne siatki sa wartosciami calkowitymi (wektory weba tak je generuja).

use serde_json::Value;
use std::sync::OnceLock;

const KEYWORDS_JSON: &str = include_str!("../../data/derived/formation-role-keywords.json");

/// Rola poczatkowa jednostki w bitwie (web: `InitialBattleRole`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InitialBattleRole {
    Commander,
    Mounted,
    Melee,
    Javelin,
    Archer,
    Slinger,
    Ranged,
    Siege,
}

/// Wejscie klasyfikacji (web: argument `classifyInitialBattleRole`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RoleInput<'a> {
    pub commander: bool,
    pub category: Option<&'a str>,
    pub name: Option<&'a str>,
    pub typ: Option<&'a str>,
    pub primary_ranged: bool,
}

struct Keywords {
    mounted_category: Vec<String>,
    mounted_name: Vec<String>,
    siege_type: String,
    siege_name: Vec<String>,
    javelin_category: String,
    javelin_haystack: Vec<String>,
    archer_category: String,
    archer_haystack: Vec<String>,
    slinger_category: String,
    slinger_haystack: Vec<String>,
}

fn strings(value: &Value, path: &str) -> Vec<String> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("keywords: {path} musi byc tablica"))
        .iter()
        .map(|v| v.as_str().expect("keywords: element tekstowy").to_owned())
        .collect()
}

fn text(value: &Value, path: &str) -> String {
    value
        .as_str()
        .unwrap_or_else(|| panic!("keywords: {path} musi byc tekstem"))
        .to_owned()
}

fn keywords() -> &'static Keywords {
    static TABLE: OnceLock<Keywords> = OnceLock::new();
    TABLE.get_or_init(|| {
        let root: Value =
            serde_json::from_str(KEYWORDS_JSON).expect("formation-role-keywords.json");
        let konnica = &root["konnica"];
        let oblezanie = &root["oblezanie"];
        let oszczepnik = &root["oszczepnik"];
        let lucznik = &root["lucznik"];
        let procarz = &root["procarz"];
        Keywords {
            mounted_category: strings(&konnica["kategorie"], "konnica.kategorie"),
            mounted_name: strings(&konnica["nazwa_podciagi"], "konnica.nazwa_podciagi"),
            siege_type: text(&oblezanie["typ"], "oblezanie.typ"),
            siege_name: strings(&oblezanie["nazwa_podciagi"], "oblezanie.nazwa_podciagi"),
            javelin_category: text(&oszczepnik["kategoria"], "oszczepnik.kategoria"),
            javelin_haystack: strings(&oszczepnik["haystack_podciagi"], "oszczepnik.haystack"),
            archer_category: text(&lucznik["kategoria"], "lucznik.kategoria"),
            archer_haystack: strings(&lucznik["haystack_podciagi"], "lucznik.haystack"),
            slinger_category: text(&procarz["kategoria"], "procarz.kategoria"),
            slinger_haystack: strings(&procarz["haystack_podciagi"], "procarz.haystack"),
        }
    })
}

/// Usuwa znaki diakrytyczne tak, jak `normalize('NFD').replace(/[̀-ͯ]/g, '')`
/// plus `replace(/[łŁ]/g, 'l')` z weba, dla liter Latin-1 i Latin Extended-A.
fn strip_base(c: char) -> char {
    match c {
        'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' | 'ą' => 'a',
        'À' | 'Á' | 'Â' | 'Ã' | 'Ä' | 'Å' | 'Ą' => 'A',
        'ç' | 'ć' | 'č' => 'c',
        'Ç' | 'Ć' | 'Č' => 'C',
        'è' | 'é' | 'ê' | 'ë' | 'ę' => 'e',
        'È' | 'É' | 'Ê' | 'Ë' | 'Ę' => 'E',
        'ì' | 'í' | 'î' | 'ï' => 'i',
        'Ì' | 'Í' | 'Î' | 'Ï' => 'I',
        'ñ' | 'ń' => 'n',
        'Ñ' | 'Ń' => 'N',
        'ò' | 'ó' | 'ô' | 'õ' | 'ö' => 'o',
        'Ò' | 'Ó' | 'Ô' | 'Õ' | 'Ö' => 'O',
        'ś' | 'š' => 's',
        'Ś' | 'Š' => 'S',
        'ù' | 'ú' | 'û' | 'ü' => 'u',
        'Ù' | 'Ú' | 'Û' | 'Ü' => 'U',
        'ý' | 'ÿ' => 'y',
        'Ý' => 'Y',
        'ź' | 'ż' | 'ž' => 'z',
        'Ź' | 'Ż' | 'Ž' => 'Z',
        'ł' | 'Ł' => 'l',
        other => other,
    }
}

/// Odpowiednik lokalnej funkcji `normalize` z `classifyInitialBattleRole`.
fn normalize(value: Option<&str>) -> String {
    value
        .unwrap_or("")
        .chars()
        .map(strip_base)
        .collect::<String>()
        .to_lowercase()
}

/// Odpowiednik `/a|b|c/.test(x)` - dopasowanie podciagu.
fn contains_any(haystack: &str, needles: &[String]) -> bool {
    needles
        .iter()
        .any(|needle| haystack.contains(needle.as_str()))
}

/// Klasyfikacja roli poczatkowej (web: formationRules.ts:3-30). Kolejnosc galezi zachowana.
pub fn classify_initial_battle_role(input: RoleInput<'_>) -> InitialBattleRole {
    let k = keywords();
    let category = normalize(input.category);
    let name = normalize(input.name);
    let typ = normalize(input.typ);
    let haystack = format!("{category} {name}");

    if input.commander {
        return InitialBattleRole::Commander;
    }
    if k.mounted_category.contains(&category) || contains_any(&name, &k.mounted_name) {
        return InitialBattleRole::Mounted;
    }
    if typ == k.siege_type || contains_any(&name, &k.siege_name) {
        return InitialBattleRole::Siege;
    }
    if category == k.javelin_category || contains_any(&haystack, &k.javelin_haystack) {
        return InitialBattleRole::Javelin;
    }
    if category == k.archer_category || contains_any(&haystack, &k.archer_haystack) {
        return InitialBattleRole::Archer;
    }
    if category == k.slinger_category || contains_any(&haystack, &k.slinger_haystack) {
        return InitialBattleRole::Slinger;
    }
    if input.primary_ranged {
        return InitialBattleRole::Ranged;
    }
    InitialBattleRole::Melee
}

/// Podzial na pasma rol (web: `InitialBattleFormation<T>`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InitialBattleFormation<T> {
    pub infantry: Vec<T>,
    pub javelins: Vec<T>,
    pub archers: Vec<T>,
    pub slingers: Vec<T>,
    pub ranged: Vec<T>,
    pub mounted: Vec<T>,
    pub siege: Vec<T>,
    pub commanders: Vec<T>,
}

/// Miejsce jednostki na planszy (web: `InitialBattleSlot<T>`).
#[derive(Debug, Clone, PartialEq)]
pub struct InitialBattleSlot<T> {
    pub unit: T,
    pub row: f64,
    pub rank: f64,
}

/// Granice planszy (web: argument `bounds` w `initialBattleSlots`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BattleBounds {
    pub rank_width: f64,
    pub mid_row: f64,
    pub play_row0: f64,
    pub play_row1: f64,
}

/// Dzieli jednostki na pasma rol (web: formationRules.ts:92-113). Kolejnosc w pasmie zachowana.
pub fn initial_battle_formation<T>(
    units: Vec<T>,
    role_of: impl Fn(&T) -> InitialBattleRole,
) -> InitialBattleFormation<T> {
    let mut groups = InitialBattleFormation {
        infantry: Vec::new(),
        javelins: Vec::new(),
        archers: Vec::new(),
        slingers: Vec::new(),
        ranged: Vec::new(),
        mounted: Vec::new(),
        siege: Vec::new(),
        commanders: Vec::new(),
    };
    for unit in units {
        match role_of(&unit) {
            InitialBattleRole::Commander => groups.commanders.push(unit),
            InitialBattleRole::Mounted => groups.mounted.push(unit),
            InitialBattleRole::Javelin => groups.javelins.push(unit),
            InitialBattleRole::Archer => groups.archers.push(unit),
            InitialBattleRole::Slinger => groups.slingers.push(unit),
            InitialBattleRole::Ranged => groups.ranged.push(unit),
            InitialBattleRole::Siege => groups.siege.push(unit),
            InitialBattleRole::Melee => groups.infantry.push(unit),
        }
    }
    groups
}

/// Ulozenie pasm piechoty i jazdy na planszy (web: formationRules.ts:46-85).
pub fn initial_battle_slots<T>(
    formation: InitialBattleFormation<T>,
    bounds: BattleBounds,
) -> Vec<InitialBattleSlot<T>> {
    // web: Math.max(1, Math.floor(bounds.rankWidth)) - dla skonczonych wartosci.
    let width = bounds.rank_width.floor().max(1.0);
    let mut slots = Vec::new();
    let mut rank_base = 0.0_f64;
    let bands = [
        formation.infantry,
        formation.javelins,
        formation.archers,
        formation.slingers,
        formation.ranged,
        formation.siege,
        formation.commanders,
    ];
    for band in bands {
        lay_band(band, width, bounds.mid_row, &mut rank_base, &mut slots);
    }

    let half_line = (width / 2.0).ceil();
    let top_len = (bounds.mid_row - bounds.play_row0 - half_line - 2.0).max(1.0) as usize;
    let bottom_len = (bounds.play_row1 - bounds.mid_row - half_line - 1.0).max(1.0) as usize;
    let top_rows: Vec<f64> = (0..top_len)
        .map(|i| bounds.play_row0 + 1.0 + i as f64)
        .collect();
    let bottom_rows: Vec<f64> = (0..bottom_len)
        .map(|i| bounds.play_row1 - 1.0 - i as f64)
        .collect();
    for (i, unit) in formation.mounted.into_iter().enumerate() {
        let rows = if i % 2 == 0 { &top_rows } else { &bottom_rows };
        let wing_index = i / 2;
        slots.push(InitialBattleSlot {
            unit,
            row: rows[wing_index % rows.len()],
            rank: (wing_index / rows.len()) as f64,
        });
    }
    slots
}

fn lay_band<T>(
    units: Vec<T>,
    width: f64,
    mid_row: f64,
    rank_base: &mut f64,
    out: &mut Vec<InitialBattleSlot<T>>,
) {
    if units.is_empty() {
        return;
    }
    let len = units.len() as f64;
    let per = len.min(width);
    let per_u = per as usize;
    let row_start = mid_row - (per / 2.0).floor();
    for (i, unit) in units.into_iter().enumerate() {
        out.push(InitialBattleSlot {
            unit,
            row: row_start + (i % per_u) as f64,
            rank: *rank_base + (i / per_u) as f64,
        });
    }
    *rank_base += (len / per).ceil();
}

/// Strona w liniowym przesuwaniu (web: `side: 'atk' | 'def'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompactSide {
    Atk,
    Def,
}

/// Czy kandydat moze wejsc w przod linii (web: formationRules.ts:115-127).
pub fn compact_line_allows_advance(
    side: CompactSide,
    candidate_col: f64,
    line_minimum_progress: f64,
    previous_line_minimum_progress: Option<f64>,
) -> bool {
    let candidate_progress = match side {
        CompactSide::Atk => candidate_col,
        CompactSide::Def => -candidate_col,
    };
    let own_line_limit = line_minimum_progress + 1.0;
    let limit = match previous_line_minimum_progress {
        None => own_line_limit,
        Some(previous) => own_line_limit.min(previous),
    };
    candidate_progress <= limit
}
