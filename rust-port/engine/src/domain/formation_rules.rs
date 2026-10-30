//! REPIN-WOJNA-NOWE-A: port `gra/src/battle/formationRules.ts` (pin `dc8a3adc`, poprzednio `91dc998a`).
//! REPIN-WOJNA-2 (U1): odswiezony do pinu `dc8a3adc` (uklad pasm: meleeLines/archerLines, skrzydla jazdy).
//!
//! web: gra/src/battle/formationRules.ts:3-30 (`classifyInitialBattleRole`), :46-118
//! (`initialBattleSlots`), :123-146 (`initialBattleFormation`), :148-160
//! (`compactLineAllowsAdvance`). Slowa kluczowe: `data/derived/formation-role-keywords.json`.
//!
//! Zalozenia (ZALOZENIE, nie zmierzone na pelnej przestrzeni Unicode):
//! - normalizacja diakrytyków (web: NFD + usuniecie U+0300-036F) obejmuje TYLKO: wszystkie
//!   rozkladalne litery Latin-1 oraz polskie litery (ą ć ę ł ń ś ź ż) i č š ž z Latin Extended-A.
//!   Pozostale litery Latin Extended-A (ě ř ů ť ď ň ľ ő ű ā ē ī ō ū ğ ş) NIE sa obslugiwane:
//!   Rust zwroci inny wynik niz web. Dane jednostek (`gra/data/units.json`) ich nie zawieraja
//!   (sprawdzone: 0 wystapien); wektory tego nie testuja - dla tych liter **NIE_ZMIERZONO**;
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
/// plus `replace(/[łŁ]/g, 'l')` z weba, dla liter Latin-1 i polskich liter Latin Extended-A
/// oraz č š ž (zakres w nagłówku modułu; reszta Latin Extended-A poza zakresem).
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
/// `melee_lines` / `archer_lines` = web `meleeLines` / `archerLines` (1|2|3, `None` = brak).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BattleBounds {
    pub rank_width: f64,
    pub mid_row: f64,
    pub play_row0: f64,
    pub play_row1: f64,
    pub melee_lines: Option<u8>,
    pub archer_lines: Option<u8>,
}

/// Dzieli jednostki na pasma rol (web: formationRules.ts:123-146). Kolejnosc w pasmie zachowana.
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

/// Parametry rozmieszczenia wspolne dla pasm (web: `width`, `bounds` w `initialBattleSlots`).
#[derive(Debug, Clone, Copy)]
struct Layout {
    width: f64,
    mid_row: f64,
    play_row0: f64,
    play_row1: f64,
}

/// Wynik `linesForBand` z weba: `per` = jednostek w rzedzie, `count` = liczba rzedow.
#[derive(Debug, Clone, Copy, PartialEq)]
struct BandLines {
    per: f64,
    count: f64,
}

impl Layout {
    /// web: `linesForBand(count, configuredLines)` (formationRules.ts:60-66).
    fn lines_for_band(&self, count: f64, configured: Option<u8>) -> BandLines {
        if count == 0.0 {
            return BandLines {
                per: 0.0,
                count: 0.0,
            };
        }
        let playable_rows = (self.play_row1 - self.play_row0 - 1.0).max(1.0);
        let requested = match configured {
            Some(lines) => f64::from(lines),
            None => (count / self.width).ceil(),
        };
        let line_count = count.min(requested.max((count / playable_rows).ceil()));
        let per = (count / line_count).ceil();
        BandLines {
            per,
            count: (count / per).ceil(),
        }
    }
}

/// web: `layBand(units, configuredLines?)` (formationRules.ts:68-82).
fn lay_band<T>(
    units: Vec<T>,
    configured: Option<u8>,
    layout: Layout,
    rank_base: &mut f64,
    out: &mut Vec<InitialBattleSlot<T>>,
) {
    if units.is_empty() {
        return;
    }
    let len = units.len() as f64;
    let lines = layout.lines_for_band(len, configured);
    let per = lines.per;
    let per_u = per as usize;
    for (i, unit) in units.into_iter().enumerate() {
        let rank_within = (i / per_u) as f64;
        let index_within = (i % per_u) as f64;
        let rank_size = per.min(len - rank_within * per);
        let row_start = layout.mid_row - (rank_size / 2.0).floor();
        out.push(InitialBattleSlot {
            unit,
            row: row_start + index_within,
            rank: *rank_base + rank_within,
        });
    }
    *rank_base += lines.count;
}

/// Ulozenie pasm piechoty i jazdy na planszy (web: formationRules.ts:46-118).
pub fn initial_battle_slots<T>(
    formation: InitialBattleFormation<T>,
    bounds: BattleBounds,
) -> Vec<InitialBattleSlot<T>> {
    // web: Math.max(1, Math.floor(bounds.rankWidth)) - dla skonczonych wartosci.
    let layout = Layout {
        width: bounds.rank_width.floor().max(1.0),
        mid_row: bounds.mid_row,
        play_row0: bounds.play_row0,
        play_row1: bounds.play_row1,
    };
    let melee = bounds.melee_lines;
    let archer = bounds.archer_lines;
    // web: mainBandWidth = max(per) po pasmach nie-jazdy (formationRules.ts:93-103).
    let main_band_width = [
        layout
            .lines_for_band(formation.infantry.len() as f64, melee)
            .per,
        layout
            .lines_for_band(formation.javelins.len() as f64, melee)
            .per,
        layout
            .lines_for_band(formation.archers.len() as f64, archer)
            .per,
        layout
            .lines_for_band(formation.slingers.len() as f64, archer)
            .per,
        layout
            .lines_for_band(formation.ranged.len() as f64, archer)
            .per,
        layout
            .lines_for_band(formation.siege.len() as f64, None)
            .per,
        layout
            .lines_for_band(formation.commanders.len() as f64, None)
            .per,
    ]
    .into_iter()
    .fold(0.0_f64, f64::max);

    let mut slots = Vec::new();
    let mut rank_base = 0.0_f64;
    lay_band(
        formation.infantry,
        melee,
        layout,
        &mut rank_base,
        &mut slots,
    );
    lay_band(
        formation.javelins,
        melee,
        layout,
        &mut rank_base,
        &mut slots,
    );
    lay_band(
        formation.archers,
        archer,
        layout,
        &mut rank_base,
        &mut slots,
    );
    lay_band(
        formation.slingers,
        archer,
        layout,
        &mut rank_base,
        &mut slots,
    );
    lay_band(formation.ranged, archer, layout, &mut rank_base, &mut slots);
    lay_band(formation.siege, None, layout, &mut rank_base, &mut slots);
    lay_band(
        formation.commanders,
        None,
        layout,
        &mut rank_base,
        &mut slots,
    );

    // web: skrzydla jazdy tuz obok glownego pasma, najwyzej 3 rzedy (formationRules.ts:104-111).
    let band_width = main_band_width.max(1.0);
    let main_row_start = bounds.mid_row - (band_width / 2.0).floor();
    let main_row_end = main_row_start + band_width - 1.0;
    let top_available = (main_row_start - (bounds.play_row0 + 1.0)).max(0.0);
    let bottom_available = ((bounds.play_row1 - 1.0) - main_row_end).max(0.0);
    let wing_count = 3.0_f64.min(top_available).min(bottom_available).max(1.0) as usize;
    let top_rows: Vec<f64> = (0..wing_count)
        .map(|i| main_row_start - 1.0 - i as f64)
        .collect();
    let bottom_rows: Vec<f64> = (0..wing_count)
        .map(|i| main_row_end + 1.0 + i as f64)
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

/// Strona w liniowym przesuwaniu (web: `side: 'atk' | 'def'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompactSide {
    Atk,
    Def,
}

/// Czy kandydat moze wejsc w przod linii (web: formationRules.ts:148-160).
/// Argumenty: `line_reference_progress` = web `lineReferenceProgress` (dawniej `lineMinimumProgress`).
pub fn compact_line_allows_advance(
    side: CompactSide,
    candidate_col: f64,
    line_reference_progress: f64,
    previous_line_reference_progress: Option<f64>,
) -> bool {
    let candidate_progress = match side {
        CompactSide::Atk => candidate_col,
        CompactSide::Def => -candidate_col,
    };
    let own_line_limit = line_reference_progress + 1.0;
    let limit = match previous_line_reference_progress {
        None => own_line_limit,
        Some(previous) => own_line_limit.min(previous),
    };
    candidate_progress <= limit
}
