//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6): adapter stanu gry -> wejscia bitwy oblezniczej (czesc 1: rostery).
//!
//! Port 1:1 z pinu `07d2fbd72` (wektory: `tests/p6_k5loop_adapter_vectors/vectors.json`, generator wykonuje TEKST pinu):
//! * `collectUnitsInRadius` / `collectAtkRosterNearCity` / `collectDefRosterNearCity` (`gra/src/units/battleRoster.ts:62-169`),
//!   `shouldIncludeInBattleRoster` (`:53-60`), `isCivilianUnit` (`gra/src/units/setup.ts:203-206`);
//! * `defenderUnitsNearCity`, `hasCityDefenders`, `militiaRegenTurnsLeft`, `militiaHeadcount`, `militiaSplit`,
//!   `militiaEraKey`, `buildMilitiaDef`, `buildMilitiaSquad`, `collectCityDefRoster` (`gra/src/game/siegeDefenders.ts`);
//! * `collectSiegeAtkRoster` (`gra/src/main.ts:34758`), `collectSiegeDefRoster` (`:34802`), `appendReadyMachinesToRoster`
//!   (`:18336`), `siegeRosterOwnerIds` (`:34748`, przez istniejacy port [`siege_battle_side_owners`]);
//! * limit strony `BATTLE_MAX_PER_SIDE = MAX_PER_SIDE = 500` (`gra/src/battle/battleScene.ts:721-723`, `slice` `:5510-5511`).
//!
//! Czesc 2 (jednostki bitwy, pola runtime, szablony, `SetupUnit`, `ActivateUnit`) jest w [`super::siege_battle_adapter_unit`].
//!
//! Brak cichych zer (dispatch T6): brak definicji jednostki, brak wiersza Milicji, brak kontekstu wlasciciela i wartosci
//! NaN/Inf w danych daja [`AdapterError`], nigdy wartosc domyslna. Swiadome roznice wzgledem pinu (D-ADP-1..3 w raporcie
//! `01-operator-r1.md`): pin `lookupUnitDef` (`main.ts:33003`) zwraca rekord zastepczy dla nieznanego typu, a
//! `buildMilitiaSquad` pomija brakujacy wiersz bez bledu; adapter zwraca wtedy blad (oba przypadki nieosiagalne na danych pinu).

use std::collections::{BTreeMap, BTreeSet};

use crate::domain::diplomacy_siege_war_gate::{hex_distance, siege_battle_side_owners};
use crate::domain::siege_tactics_inputs_unit::{js_num_to_string, StatRow, UVal};

/// `BATTLE_MAX_PER_SIDE` (`battleScene.ts:723`, `= MAX_PER_SIDE = 500`, `:721`). Renderer (`renderer/src/battle/field.rs`)
/// ma 120: dlug DTO-BRIDGE (D-T5b-4), silnik = pin.
pub const BATTLE_MAX_PER_SIDE: usize = 500;

/// Typy jednostek cywilnych (`setup.ts:197-200`).
const CIVILIAN_CATEGORIES: [&str; 3] = ["osadnik", "robotnik", "zwiadowca"];
const CIVILIAN_TYPE_IDS: [&str; 3] = ["Zwiadowca", "Osadnik", "Robotnik"];

/// Jawny blad adaptera (zamiast cichej wartosci domyslnej).
#[derive(Debug, Clone, PartialEq)]
pub enum AdapterError {
    /// Miasto o tym id nie istnieje w stanie.
    CityNotFound(String),
    /// Jednostka-kotwica nie istnieje w stanie.
    AnchorNotFound(String),
    /// Miasto bez muru: pin odrzuca szturm (`main.ts:36814-36817`, „uzyj zwyklej potyczki").
    CityWithoutWall(String),
    /// D-WIR-2: atakujacy z generalem = faza rozstawienia i tryb reczny (K5EXEC #268), poza zakresem.
    AttackerHasGeneral(String),
    /// Miasto bez obroncow: pin zdobywa je bez bitwy (`captureCityWithoutBattle`, `main.ts:36826-36834`), poza zakresem.
    NoDefenders(String),
    /// Brak definicji jednostki (`units.json`) dla typu jednostki rosteru.
    MissingUnitDef { unit_id: String, type_id: String },
    /// Brak wiersza Milicji (ani zamiennika `Wojownik`/`Oszczepnik`) przy niezerowej liczbie milicjantow.
    MissingMilitiaRow { name: String },
    /// Brak kontekstu wlasciciela (cywilizacja, budynki, trudnosc) dla jednostki rosteru.
    MissingOwnerContext { owner_id: i64 },
    /// Wartosc NaN/Inf w danych wejsciowych (opis pola).
    NonFinite { what: String },
}

impl std::fmt::Display for AdapterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for AdapterError {}

/// Sprawdza skonczonosc liczby wejscia (NaN/Inf = [`AdapterError::NonFinite`]).
pub(crate) fn finite(v: f64, what: impl FnOnce() -> String) -> Result<f64, AdapterError> {
    if v.is_finite() {
        Ok(v)
    } else {
        Err(AdapterError::NonFinite { what: what() })
    }
}

/// Rodzaj milicjanta (`MilitiaKind`, `siegeDefenders.ts:148`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MilitiaKind {
    Wrecz,
    Dystans,
}

impl MilitiaKind {
    /// Napis pinu (`'wrecz' | 'dystans'`).
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Wrecz => "wrecz",
            Self::Dystans => "dystans",
        }
    }
}

/// Jednostka mapy (`RuntimeUnit`) z polami czytanymi przez rostery i `runtimeToBattleUnit`.
#[derive(Debug, Clone, PartialEq)]
pub struct RosterUnit {
    pub id: String,
    pub owner_id: i64,
    pub type_id: String,
    pub category: String,
    pub q: i64,
    pub r: i64,
    /// `u.isGeneral === true`.
    pub is_general: bool,
    /// `isMilitia` + `militiaKind` (wirtualny milicjant, `siegeDefenders.ts:347-362`).
    pub militia: Option<MilitiaKind>,
    /// `u.hp` (`None` = `undefined`).
    pub hp: Option<f64>,
    /// `u.battlesSurvived` (postep weterana, `veteran.ts:95`).
    pub battles_survived: Option<f64>,
    /// `u.parametryBonusProc` (`unit-building-bonuses.ts:223`).
    pub parametry_bonus_proc: Option<f64>,
    /// `u.pancerzBonusProc` (`unit-building-bonuses.ts:218`).
    pub pancerz_bonus_proc: Option<f64>,
    /// Wynik `unitGetsFortifyBonus(u)` (`main.ts:32915`, wejscie wolajacego).
    pub fortified_in_field: bool,
}

impl RosterUnit {
    /// Jednostka bez postepu i bez HP (pola opcjonalne = `undefined`).
    pub fn new(id: &str, owner_id: i64, type_id: &str, category: &str, q: i64, r: i64) -> Self {
        Self {
            id: id.to_owned(),
            owner_id,
            type_id: type_id.to_owned(),
            category: category.to_owned(),
            q,
            r,
            is_general: false,
            militia: None,
            hp: None,
            battles_survived: None,
            parametry_bonus_proc: None,
            pancerz_bonus_proc: None,
            fortified_in_field: false,
        }
    }
}

/// Miasto oblegane (pola `City` czytane przez rostery).
#[derive(Debug, Clone, PartialEq)]
pub struct RosterCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    /// `city.population` (`None` = `undefined`).
    pub population: Option<f64>,
    /// `city.garnizon` (licznik garnizonu, `None` = `undefined`).
    pub garnizon: Option<f64>,
    /// `city.militiaRegenAtTurn`.
    pub militia_regen_at_turn: Option<f64>,
    /// `city.maMur`.
    pub ma_mur: bool,
}

/// Parametry Milicji (`combat-params.json` -> `oblezenie.militia_*`, `siege.ts:144-164`).
#[derive(Debug, Clone, PartialEq)]
pub struct MilitiaParams {
    pub pop_fraction: f64,
    pub strength_fraction: f64,
    pub morale_fraction: f64,
    pub morale_min_margin_over_flee: f64,
    /// `militia_roster`: `[kamien, braz, zelazo]`, kazdy `(wrecz, dystans)`.
    pub roster: [(String, String); 3],
}

impl MilitiaParams {
    /// Wartosci pinu `07d2fbd72` (`gra/data/combat-params.json` `oblezenie`). `rust-port/engine/data/combat-params.json`
    /// ma dryf (`militia_pop_fraction` 0.2, brak `militia_morale_*`/`militia_roster`): dlug REPIN, D-ADP-4.
    pub fn pin() -> Self {
        Self {
            pop_fraction: 1.0,
            strength_fraction: 0.5,
            morale_fraction: 0.5,
            morale_min_margin_over_flee: 3.0,
            roster: [
                ("Wojownik".to_owned(), "Oszczepnik".to_owned()),
                ("Włócznik".to_owned(), "Łucznik".to_owned()),
                (
                    "Wojownik z mieczem i tarczą".to_owned(),
                    "Procarz".to_owned(),
                ),
            ],
        }
    }
}

/// Opcje `cityDefenderOptions` (`main.ts:34766-34775`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CityDefOptions {
    /// `completedBuildingIds` zawiera `garnizon` (`isGarrisonBuildingCompleted`).
    pub garrison_completed: bool,
    /// `ownerEra` (epoka wlasciciela miasta).
    pub owner_era: Option<f64>,
    /// `currentTurn`.
    pub current_turn: Option<f64>,
}

/// Wynik `collectCityDefRoster`: roster i definicje milicjantow (`militiaDefs`, kolejnosc wstawiania).
#[derive(Debug, Clone, PartialEq)]
pub struct CityDefRoster {
    pub roster: Vec<RosterUnit>,
    pub militia_defs: Vec<(String, StatRow)>,
}

/// `isCivilianUnit(u)` (`setup.ts:203-206`).
pub fn is_civilian_unit(category: &str, type_id: &str) -> bool {
    CIVILIAN_CATEGORIES.contains(&category) || CIVILIAN_TYPE_IDS.contains(&type_id)
}

#[derive(Clone, Copy)]
enum RosterSide {
    Attacker,
    Defender,
}

/// `shouldIncludeInBattleRoster(u, ctx)` (`battleRoster.ts:53-60`).
fn should_include(u: &RosterUnit, side: RosterSide, anchor_id: &str, hex: (i64, i64)) -> bool {
    if !is_civilian_unit(&u.category, &u.type_id) {
        return true;
    }
    match side {
        RosterSide::Attacker => u.id == anchor_id,
        RosterSide::Defender => u.q == hex.0 && u.r == hex.1,
    }
}

/// `collectAtkRosterNearCity(city, anchor, allUnits, allowedOwnerIds?)` (`battleRoster.ts:108-133`) z
/// `collectUnitsInRadius` (`:62-90`).
pub fn collect_atk_roster_near_city(
    city: (i64, i64),
    anchor: &RosterUnit,
    all: &[RosterUnit],
    allowed: Option<&BTreeSet<i64>>,
) -> Vec<RosterUnit> {
    let side = RosterSide::Attacker;
    let mut out: Vec<RosterUnit> = Vec::new();
    let mut seen: BTreeSet<&str> = BTreeSet::new();
    for u in all {
        let owner_ok = match allowed {
            Some(set) => set.contains(&u.owner_id),
            None => u.owner_id == anchor.owner_id,
        };
        if !owner_ok {
            continue;
        }
        if hex_distance(u.q, u.r, city.0, city.1) > 1 {
            continue;
        }
        if !should_include(u, side, &anchor.id, city) {
            continue;
        }
        if !seen.insert(u.id.as_str()) {
            continue;
        }
        out.push(u.clone());
    }
    if !out.iter().any(|x| x.id == anchor.id) && should_include(anchor, side, &anchor.id, city) {
        out.insert(0, anchor.clone());
    }
    if let Some(idx) = out.iter().position(|x| x.id == anchor.id) {
        if idx > 0 {
            // `splice(idx, 1); unshift(anchor)`: kotwica z argumentu (ten sam obiekt w pinie).
            out.remove(idx);
            out.insert(0, anchor.clone());
        }
    }
    if allowed.is_none() {
        return out;
    }
    let Some(lead) = out.iter().find(|u| u.id == anchor.id).cloned() else {
        return out;
    };
    let mut ordered = vec![lead];
    ordered.extend(
        out.iter()
            .filter(|u| u.id != anchor.id && u.owner_id == anchor.owner_id)
            .cloned(),
    );
    ordered.extend(
        out.iter()
            .filter(|u| u.id != anchor.id && u.owner_id != anchor.owner_id)
            .cloned(),
    );
    ordered
}

/// `collectDefRosterNearCity(city, allUnits)` (`battleRoster.ts:136-169`). Kotwica syntetyczna nie wplywa na wynik
/// (strona obroncy czyta tylko heks starcia).
pub fn collect_def_roster_near_city(city: (i64, i64), all: &[RosterUnit]) -> Vec<RosterUnit> {
    let mut out = Vec::new();
    let mut seen: BTreeSet<&str> = BTreeSet::new();
    for u in all {
        if hex_distance(u.q, u.r, city.0, city.1) > 1 {
            continue;
        }
        if !should_include(u, RosterSide::Defender, "", city) {
            continue;
        }
        if !seen.insert(u.id.as_str()) {
            continue;
        }
        out.push(u.clone());
    }
    out
}

/// `defenderUnitsNearCity(city, units, allowedOwnerIds?)` (`siegeDefenders.ts:96-109`).
pub fn defender_units_near_city(
    city: &RosterCity,
    all: &[RosterUnit],
    allowed: Option<&BTreeSet<i64>>,
) -> Vec<RosterUnit> {
    let roster: Vec<RosterUnit> = collect_def_roster_near_city((city.q, city.r), all)
        .into_iter()
        .filter(|u| match allowed {
            Some(set) => set.contains(&u.owner_id),
            None => u.owner_id == city.owner_id,
        })
        .collect();
    if allowed.is_none() {
        return roster;
    }
    owner_first(roster, city.owner_id)
}

fn owner_first(roster: Vec<RosterUnit>, owner_id: i64) -> Vec<RosterUnit> {
    let (own, other): (Vec<RosterUnit>, Vec<RosterUnit>) =
        roster.into_iter().partition(|u| u.owner_id == owner_id);
    own.into_iter().chain(other).collect()
}

/// `militiaRegenTurnsLeft(city, currentTurn)` (`siegeDefenders.ts:51-59`).
pub fn militia_regen_turns_left(at: Option<f64>, current_turn: Option<f64>) -> f64 {
    let Some(at) = at.filter(|v| v.is_finite()) else {
        return 0.0;
    };
    let Some(turn) = current_turn.filter(|v| v.is_finite()) else {
        return 0.0;
    };
    (at - turn).max(0.0)
}

/// `militiaHeadcount(population)` (`siegeDefenders.ts:194-196`): `floor(max(0, pop ?? 0) * MILITIA_POP_FRACTION)`.
pub fn militia_headcount(population: Option<f64>, params: &MilitiaParams) -> f64 {
    (population.unwrap_or(0.0).max(0.0) * params.pop_fraction).floor()
}

/// `militiaSplit(count)` (`siegeDefenders.ts:199-203`): `(wrecz, dystans)`.
pub fn militia_split(count: f64) -> (f64, f64) {
    let c = count.floor().max(0.0);
    let wrecz = (c / 2.0).ceil();
    (wrecz, c - wrecz)
}

/// `militiaEraKey(era)` (`siegeDefenders.ts:186-191`): indeks w [`MilitiaParams::roster`].
pub fn militia_era_index(era: Option<f64>) -> usize {
    let e = era.filter(|v| v.is_finite()).unwrap_or(1.0);
    if e >= 3.0 {
        2
    } else if e >= 2.0 {
        1
    } else {
        0
    }
}

/// `makeMilitia(population) !== null` (`siege.ts:535-541`): liczba milicjantow > 0.
pub fn make_militia_nonempty(population: Option<f64>, params: &MilitiaParams) -> bool {
    (population.unwrap_or(0.0).max(0.0) * params.pop_fraction).floor() > 0.0
}

/// `hasCityDefenders(city, units, options)` (`siegeDefenders.ts:117-127`; `main.ts:34795-34800` NIE przekazuje
/// `allowedOwnerIds` do `defenderUnitsNearCity`, wiec liczy tylko wlasciciela miasta).
pub fn city_has_defenders(
    city: &RosterCity,
    all: &[RosterUnit],
    opts: &CityDefOptions,
    params: &MilitiaParams,
) -> bool {
    if city.garnizon.unwrap_or(0.0) > 0.0 {
        return true;
    }
    if !defender_units_near_city(city, all, None).is_empty() {
        return true;
    }
    opts.garrison_completed
        && militia_regen_turns_left(city.militia_regen_at_turn, opts.current_turn) == 0.0
        && make_militia_nonempty(city.population, params)
}

fn js_round_half_up(v: f64) -> f64 {
    (v + 0.5).floor()
}

/// Klucze skalowane u milicjanta wrecz (`MELEE_SCALED_KEYS`, `siegeDefenders.ts:171-174`).
const MELEE_SCALED_KEYS: [&str; 13] = [
    "meleeAttack",
    "meleeDefence",
    "weaponDamage",
    "chargeBonus",
    "armor",
    "piercing",
    "health",
    "Atak",
    "Obrona",
    "Uderzenie",
    "Pancerz",
    "Przebicie",
    "Health",
];

fn num_of(v: Option<&UVal>) -> Option<f64> {
    match v {
        Some(UVal::Num(n)) => Some(*n),
        _ => None,
    }
}

/// `buildMilitiaDef(row, kind)` (`siegeDefenders.ts:220-243`).
pub fn build_militia_def(row: &StatRow, kind: MilitiaKind, params: &MilitiaParams) -> StatRow {
    let mut def = row.clone();
    if kind == MilitiaKind::Wrecz {
        for k in MELEE_SCALED_KEYS {
            let Some(v) = num_of(row.get(k)).filter(|v| v.is_finite()) else {
                continue;
            };
            let scaled = js_round_half_up(v * params.strength_fraction);
            def.insert(
                k.to_owned(),
                UVal::Num(if v > 0.0 { scaled.max(1.0) } else { v }),
            );
        }
    }
    if let Some(base) = num_of(row.get("Morale bazowe")).filter(|v| v.is_finite()) {
        let flee = num_of(row.get("Morale ucieczki"))
            .filter(|v| v.is_finite())
            .unwrap_or(0.0);
        let floor = flee + params.morale_min_margin_over_flee;
        let scaled = js_round_half_up(base * params.morale_fraction).max(floor);
        def.insert("Morale bazowe".to_owned(), UVal::Num(base.min(scaled)));
    }
    def.remove("fieldPower");
    def.insert("isMilitia".to_owned(), UVal::Bool(true));
    def.insert(
        "militiaKind".to_owned(),
        UVal::Str(kind.as_str().to_owned()),
    );
    def
}

/// Wiersze `units.json` w kolejnosci tablicy (wyszukiwanie `rows.find(r => r['Jednostka'] === name)`).
pub fn find_unit_row<'a>(rows: &'a [StatRow], name: &str) -> Option<&'a StatRow> {
    rows.iter()
        .find(|r| matches!(r.get("Jednostka"), Some(UVal::Str(s)) if s == name))
}

/// Jeden milicjant (`MilitiaSquadMember`): typ, rodzaj, definicja.
#[derive(Debug, Clone, PartialEq)]
pub struct MilitiaSquadMember {
    pub type_id: String,
    pub kind: MilitiaKind,
    pub def: StatRow,
}

/// `buildMilitiaSquad(population, ownerEra, rows)` (`siegeDefenders.ts:258-283`). Brak wiersza (i zamiennika) przy
/// niezerowej liczbie milicjantow danego rodzaju = [`AdapterError::MissingMilitiaRow`] (pin pomija po cichu, D-ADP-2).
pub fn build_militia_squad(
    population: Option<f64>,
    owner_era: Option<f64>,
    rows: &[StatRow],
    params: &MilitiaParams,
) -> Result<Vec<MilitiaSquadMember>, AdapterError> {
    let count = militia_headcount(population, params);
    if count <= 0.0 {
        return Ok(Vec::new());
    }
    let (wrecz_name, dystans_name) = &params.roster[militia_era_index(owner_era)];
    let (wrecz, dystans) = militia_split(count);
    let mut out = Vec::new();
    for (name, fallback, kind, n) in [
        (wrecz_name, "Wojownik", MilitiaKind::Wrecz, wrecz),
        (dystans_name, "Oszczepnik", MilitiaKind::Dystans, dystans),
    ] {
        let row = find_unit_row(rows, name).or_else(|| find_unit_row(rows, fallback));
        let Some(row) = row else {
            if n > 0.0 {
                return Err(AdapterError::MissingMilitiaRow { name: name.clone() });
            }
            continue;
        };
        let def = build_militia_def(row, kind, params);
        let type_id = match row.get("Jednostka") {
            Some(v) => v.js_to_string(),
            None => "undefined".to_owned(),
        };
        let mut i = 0.0;
        while i < n {
            out.push(MilitiaSquadMember {
                type_id: type_id.clone(),
                kind,
                def: def.clone(),
            });
            i += 1.0;
        }
    }
    Ok(out)
}

/// `collectCityDefRoster(city, units, options)` (`siegeDefenders.ts:322-350`).
pub fn collect_city_def_roster(
    city: &RosterCity,
    all: &[RosterUnit],
    opts: &CityDefOptions,
    allowed: Option<&BTreeSet<i64>>,
    rows: &[StatRow],
    params: &MilitiaParams,
) -> Result<CityDefRoster, AdapterError> {
    let roster = defender_units_near_city(city, all, allowed);
    let empty = |roster| {
        Ok(CityDefRoster {
            roster,
            militia_defs: Vec::new(),
        })
    };
    if !opts.garrison_completed {
        return empty(roster);
    }
    if militia_regen_turns_left(city.militia_regen_at_turn, opts.current_turn) > 0.0 {
        return empty(roster);
    }
    let squad = build_militia_squad(city.population, opts.owner_era, rows, params)?;
    if squad.is_empty() {
        return empty(roster);
    }
    let mut out = roster;
    let mut militia_defs = Vec::new();
    for (i, m) in squad.into_iter().enumerate() {
        let id = format!("militia-{}-{}", city.id, i);
        militia_defs.push((id.clone(), m.def));
        let mut u = RosterUnit::new(&id, city.owner_id, &m.type_id, "domyslny", city.q, city.r);
        u.militia = Some(m.kind);
        out.push(u);
    }
    Ok(CityDefRoster {
        roster: out,
        militia_defs,
    })
}

/// `collectSiegeDefRoster(city, besiegerOwnerId)` (`main.ts:34802-34815`): wlasciciel miasta pierwszy.
pub fn collect_siege_def_roster(
    city: &RosterCity,
    all: &[RosterUnit],
    opts: &CityDefOptions,
    defender_owners: &BTreeSet<i64>,
    rows: &[StatRow],
    params: &MilitiaParams,
) -> Result<CityDefRoster, AdapterError> {
    let res = collect_city_def_roster(city, all, opts, Some(defender_owners), rows, params)?;
    Ok(CityDefRoster {
        roster: owner_first(res.roster, city.owner_id),
        militia_defs: res.militia_defs,
    })
}

/// `SiegeMachineKind` (`siegeMachines.ts:6`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MachineKind {
    Taran,
    Wieza,
}

impl MachineKind {
    /// `SIEGE_MACHINE_TYPE_ID[kind]` (`siegeMachines.ts:15-18`).
    pub fn type_id(self) -> &'static str {
        match self {
            Self::Taran => "Taran",
            Self::Wieza => "Wieża oblężnicza",
        }
    }
}

/// `appendReadyMachinesToRoster(roster, city, ownerId)` (`main.ts:18336-18361`) dla listy gotowych machin (`peek` lub
/// `consume` robi wolajacy). `turn` = globalna tura (`'siege-mach-' + city.id + '-' + turn + '-' + i`).
pub fn append_ready_machines_to_roster(
    roster: &[RosterUnit],
    city: &RosterCity,
    owner_id: i64,
    turn: f64,
    kinds: &[MachineKind],
) -> Vec<RosterUnit> {
    let mut out = roster.to_vec();
    for (i, kind) in kinds.iter().enumerate() {
        let id = format!("siege-mach-{}-{}-{}", city.id, js_num_to_string(turn), i);
        out.push(RosterUnit::new(
            &id,
            owner_id,
            kind.type_id(),
            "obleznicza",
            city.q,
            city.r,
        ));
    }
    out
}

/// `slice(0, MAX_PER_SIDE)` (`battleScene.ts:5510-5511`).
pub fn cap_side(roster: &[RosterUnit]) -> Vec<RosterUnit> {
    roster.iter().take(BATTLE_MAX_PER_SIDE).cloned().collect()
}

/// Relacje wlascicieli dla `siegeRosterOwnerIds` (`areEnemyOwners`, `hasAllianceDealBetween`): pary nieuporzadkowane.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct OwnerRelations {
    pub wars: BTreeSet<(i64, i64)>,
    pub alliances: BTreeSet<(i64, i64)>,
}

fn pair(a: i64, b: i64) -> (i64, i64) {
    if a <= b {
        (a, b)
    } else {
        (b, a)
    }
}

impl OwnerRelations {
    pub fn are_enemies(&self, a: i64, b: i64) -> bool {
        a != b && self.wars.contains(&pair(a, b))
    }
    pub fn allied(&self, a: i64, b: i64) -> bool {
        a != b && self.alliances.contains(&pair(a, b))
    }
}

/// Wejscie przygotowania rosterow szturmu (odpowiednik `launchSiegeStormFromMap`, `main.ts:36799-36835`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeRosterInput<'a> {
    pub city: &'a RosterCity,
    pub anchor_id: &'a str,
    pub units: &'a [RosterUnit],
    pub relations: &'a OwnerRelations,
    pub def_opts: CityDefOptions,
    /// Gotowe machiny miasta (`peekReadyMachines(city)`).
    pub ready_machines: &'a [MachineKind],
    pub turn: f64,
    pub unit_rows: &'a [StatRow],
    pub militia: &'a MilitiaParams,
}

/// Rostery obu stron (`atkRosterRef` / `defRosterRef`) z definicjami milicji (`militiaDefOverrides`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeRosters {
    pub atk: Vec<RosterUnit>,
    pub def: Vec<RosterUnit>,
    pub militia_defs: Vec<(String, StatRow)>,
    pub attacker_owners: BTreeSet<i64>,
    pub defender_owners: BTreeSet<i64>,
}

/// Rostery szturmu jak `launchSiegeStormFromMap` przed `new BattleScene` (`main.ts:36808-36835`, `:36920-36937`).
/// Bledy: miasto bez muru, brak kotwicy, brak obroncow (zdobycie bez bitwy), general atakujacego (D-WIR-2).
pub fn collect_siege_rosters(inp: &SiegeRosterInput<'_>) -> Result<SiegeRosters, AdapterError> {
    let city = inp.city;
    let anchor = inp
        .units
        .iter()
        .find(|u| u.id == inp.anchor_id)
        .ok_or_else(|| AdapterError::AnchorNotFound(inp.anchor_id.to_owned()))?;
    if !city.ma_mur {
        return Err(AdapterError::CityWithoutWall(city.id.clone()));
    }
    for (what, v) in [
        ("city.population", city.population),
        ("city.garnizon", city.garnizon),
        ("city.militiaRegenAtTurn", city.militia_regen_at_turn),
        ("def_opts.owner_era", inp.def_opts.owner_era),
        ("def_opts.current_turn", inp.def_opts.current_turn),
    ] {
        if let Some(x) = v {
            finite(x, || what.to_owned())?;
        }
    }
    finite(inp.turn, || "turn".to_owned())?;
    let owners = siege_battle_side_owners(
        anchor.owner_id,
        city.owner_id,
        inp.units.iter().map(|u| u.owner_id),
        |a, b| inp.relations.are_enemies(a, b),
        |a, b| inp.relations.allied(a, b),
    );
    let atk = append_ready_machines_to_roster(
        &collect_atk_roster_near_city((city.q, city.r), anchor, inp.units, Some(&owners.attacker)),
        city,
        anchor.owner_id,
        inp.turn,
        inp.ready_machines,
    );
    let def = collect_siege_def_roster(
        city,
        inp.units,
        &inp.def_opts,
        &owners.defender,
        inp.unit_rows,
        inp.militia,
    )?;
    if !city_has_defenders(city, inp.units, &inp.def_opts, inp.militia) || def.roster.is_empty() {
        return Err(AdapterError::NoDefenders(city.id.clone()));
    }
    if let Some(g) = atk.iter().find(|u| u.is_general) {
        return Err(AdapterError::AttackerHasGeneral(g.id.clone()));
    }
    Ok(SiegeRosters {
        atk,
        def: def.roster,
        militia_defs: def.militia_defs,
        attacker_owners: owners.attacker,
        defender_owners: owners.defender,
    })
}

/// Definicje jednostek z `units.json` (tablica obiektow JSON) w kolejnosci tablicy.
pub fn stat_rows_from_json(v: &serde_json::Value) -> Result<Vec<StatRow>, AdapterError> {
    let arr = v.as_array().ok_or_else(|| AdapterError::NonFinite {
        what: "units.json nie jest tablica".to_owned(),
    })?;
    arr.iter().map(stat_row_from_json).collect()
}

/// Jeden wiersz JSON -> [`StatRow`] (liczby jako `f64`; `null` = `UVal::Null`).
pub fn stat_row_from_json(v: &serde_json::Value) -> Result<StatRow, AdapterError> {
    let obj = v.as_object().ok_or_else(|| AdapterError::NonFinite {
        what: "wiersz units.json nie jest obiektem".to_owned(),
    })?;
    Ok(obj
        .iter()
        .map(|(k, x)| (k.clone(), uval_from_json(x)))
        .collect())
}

fn uval_from_json(v: &serde_json::Value) -> UVal {
    match v {
        serde_json::Value::Null => UVal::Null,
        serde_json::Value::Bool(b) => UVal::Bool(*b),
        serde_json::Value::Number(n) => UVal::Num(n.as_f64().unwrap_or(f64::NAN)),
        serde_json::Value::String(s) => UVal::Str(s.clone()),
        // Tablice/obiekty w wierszu units.json nie sa czytane przez adapter; `String(v)` nie jest potrzebny.
        other => UVal::Str(other.to_string()),
    }
}

/// Indeks definicji: `lookupUnitDef(typeId)` = pierwszy wiersz z `Jednostka === typeId`.
pub fn unit_def_index(rows: &[StatRow]) -> BTreeMap<String, usize> {
    let mut idx = BTreeMap::new();
    for (i, r) in rows.iter().enumerate() {
        if let Some(UVal::Str(name)) = r.get("Jednostka") {
            idx.entry(name.clone()).or_insert(i);
        }
    }
    idx
}
