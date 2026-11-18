//! P6 BATTLE-SETUP T5b (dispatch R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1, runda 1, Operator): pasma rol i sloty
//! domyslnego rozstawienia, port `gra/src/battle/formationRules.ts` w pinie `07d2fbd72` (plik caly, straznik SHA-256
//! w generatorze wektorow `tests/p6_battle_setup_units_gen.mjs`).
//!
//! Dlaczego osobny modul, a nie `formation_rules.rs`: tamten modul jest portem pinu `dc8a3adc` i rozni sie od
//! `07d2fbd72` w `initialBattleSlots` - w pinie skrzydla jazdy dostaja `rank: wingRank + floor(wingIndex / rows.length)`
//! (rzad najszerszego pasma nie-jazdy, `formationRules.ts:58-63`, `:79`, `:114-115`), a `formation_rules.rs` liczy
//! `rank` bez `wingRank`. `formation_rules.rs` jest poza allowlista tego tematu (dlug `DLUG-FORMATION-RULES-WINGRANK`
//! w raporcie runu); tutaj jest wierna kopia pinu `07d2fbd72`, uzywana przez [`super::battle_setup_units`].
//!
//! Normalizacja klasyfikacji: pin (`formationRules.ts:10-14`) = `normalize('NFD')`, usuniecie U+0300..U+036F, `ł/Ł -> l`,
//! `toLowerCase()` - to dokladnie `normName` z `battleScene.ts:1648-1650`, wiec uzyty jest
//! [`super::siege_tactics_classify::norm_name`] (zakres i granice opisane tam).

use super::siege_tactics_classify::norm_name;

/// `InitialBattleRole` (`formationRules.ts:1`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InitialRole {
    Commander,
    Mounted,
    Melee,
    Javelin,
    Archer,
    Slinger,
    Ranged,
    Siege,
}

/// Wejscie `classifyInitialBattleRole` (`formationRules.ts:3-9`); `None` = `undefined`.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RoleInput<'a> {
    /// `commander` (prawdziwosc JS).
    pub commander: bool,
    /// `category`.
    pub category: Option<&'a str>,
    /// `name`.
    pub name: Option<&'a str>,
    /// `type`.
    pub typ: Option<&'a str>,
    /// `primaryRanged`.
    pub primary_ranged: bool,
}

fn any(h: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| h.contains(n))
}

/// `classifyInitialBattleRole(input)` (`formationRules.ts:3-30`), kolejnosc galezi jak w pinie.
#[must_use]
pub fn classify_initial_role(input: RoleInput<'_>) -> InitialRole {
    let category = norm_name(input.category.unwrap_or(""));
    let name = norm_name(input.name.unwrap_or(""));
    let typ = norm_name(input.typ.unwrap_or(""));
    let haystack = format!("{category} {name}");
    if input.commander {
        return InitialRole::Commander;
    }
    if category == "konnica"
        || category == "rydwan"
        || typ == "mount"
        || any(
            &name,
            &[
                "konnic", "jazd", "jezdz", "kawaler", "rydwan", "chariot", "cavalry", "horse",
            ],
        )
    {
        return InitialRole::Mounted;
    }
    if typ == "siege"
        || any(
            &name,
            &[
                "taran",
                "katapult",
                "wieza oblezn",
                "battering",
                "catapult",
                "siege tower",
            ],
        )
    {
        return InitialRole::Siege;
    }
    if category == "oszczepnik" || any(&haystack, &["oszczepnik", "javelin", "atlatl", "estolic"]) {
        return InitialRole::Javelin;
    }
    if category == "lucznik" || any(&haystack, &["luczn", "archer", "kusznik", "crossbow"]) {
        return InitialRole::Archer;
    }
    if category == "procarz" || any(&haystack, &["procarz", "slinger"]) {
        return InitialRole::Slinger;
    }
    if input.primary_ranged {
        return InitialRole::Ranged;
    }
    InitialRole::Melee
}

/// `InitialBattleFormation<T>` (`formationRules.ts:33-42`), elementy = indeksy jednostek wejscia.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Formation {
    pub infantry: Vec<usize>,
    pub javelins: Vec<usize>,
    pub archers: Vec<usize>,
    pub slingers: Vec<usize>,
    pub ranged: Vec<usize>,
    pub mounted: Vec<usize>,
    pub siege: Vec<usize>,
    pub commanders: Vec<usize>,
}

/// `initialBattleFormation(units, roleOf)` (`formationRules.ts:123-146`) dla rol w kolejnosci jednostek.
#[must_use]
pub fn initial_formation(roles: &[InitialRole]) -> Formation {
    let mut g = Formation::default();
    for (i, role) in roles.iter().enumerate() {
        match role {
            InitialRole::Commander => g.commanders.push(i),
            InitialRole::Mounted => g.mounted.push(i),
            InitialRole::Javelin => g.javelins.push(i),
            InitialRole::Archer => g.archers.push(i),
            InitialRole::Slinger => g.slingers.push(i),
            InitialRole::Ranged => g.ranged.push(i),
            InitialRole::Siege => g.siege.push(i),
            InitialRole::Melee => g.infantry.push(i),
        }
    }
    g
}

/// `InitialBattleSlot<T>` (`formationRules.ts:44`): `unit` = indeks jednostki.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Slot {
    pub unit: usize,
    pub row: f64,
    pub rank: f64,
}

/// `bounds` z `initialBattleSlots` (`formationRules.ts:48-55`); `None` w liniach = `undefined`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SlotBounds {
    pub rank_width: f64,
    pub mid_row: f64,
    pub play_row0: f64,
    pub play_row1: f64,
    pub melee_lines: Option<u8>,
    pub archer_lines: Option<u8>,
}

struct Lay {
    width: f64,
    b: SlotBounds,
    slots: Vec<Slot>,
    rank_base: f64,
    wing_rank: f64,
    wing_rank_width: f64,
}

impl Lay {
    /// `linesForBand(count, configuredLines)` (`formationRules.ts:64-70`): `(per, count)`.
    fn lines_for_band(&self, count: f64, configured: Option<u8>) -> (f64, f64) {
        if count == 0.0 {
            return (0.0, 0.0);
        }
        let playable_rows = (self.b.play_row1 - self.b.play_row0 - 1.0).max(1.0);
        let requested = configured.map_or_else(|| (count / self.width).ceil(), f64::from);
        let line_count = count.min(requested.max((count / playable_rows).ceil()));
        let per = (count / line_count).ceil();
        (per, (count / per).ceil())
    }

    /// `layBand(units, configuredLines)` (`formationRules.ts:71-85`).
    #[allow(
        clippy::cast_precision_loss,
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss
    )]
    fn lay_band(&mut self, units: &[usize], configured: Option<u8>) {
        if units.is_empty() {
            return;
        }
        let len = units.len() as f64;
        let (per, actual) = self.lines_for_band(len, configured);
        if per > self.wing_rank_width {
            self.wing_rank_width = per;
            self.wing_rank = self.rank_base;
        }
        for (i, &unit) in units.iter().enumerate() {
            let fi = i as f64;
            let rank_within = (fi / per).floor();
            let index_within = fi % per;
            let rank_size = per.min(len - rank_within * per);
            let row_start = self.b.mid_row - (rank_size / 2.0).floor();
            self.slots.push(Slot {
                unit,
                row: row_start + index_within,
                rank: self.rank_base + rank_within,
            });
        }
        self.rank_base += actual;
    }
}

/// `initialBattleSlots(formation, bounds)` (`formationRules.ts:46-121`) w pinie `07d2fbd72` (z `wingRank`).
#[must_use]
#[allow(
    clippy::cast_precision_loss,
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss
)]
pub fn initial_slots(f: &Formation, b: SlotBounds) -> Vec<Slot> {
    let mut lay = Lay {
        width: b.rank_width.floor().max(1.0),
        b,
        slots: Vec::new(),
        rank_base: 0.0,
        wing_rank: 0.0,
        wing_rank_width: 0.0,
    };
    lay.lay_band(&f.infantry, b.melee_lines);
    lay.lay_band(&f.javelins, b.melee_lines);
    lay.lay_band(&f.archers, b.archer_lines);
    lay.lay_band(&f.slingers, b.archer_lines);
    lay.lay_band(&f.ranged, b.archer_lines);
    lay.lay_band(&f.siege, None);
    lay.lay_band(&f.commanders, None);

    let main_band_width = [
        lay.lines_for_band(f.infantry.len() as f64, b.melee_lines).0,
        lay.lines_for_band(f.javelins.len() as f64, b.melee_lines).0,
        lay.lines_for_band(f.archers.len() as f64, b.archer_lines).0,
        lay.lines_for_band(f.slingers.len() as f64, b.archer_lines)
            .0,
        lay.lines_for_band(f.ranged.len() as f64, b.archer_lines).0,
        lay.lines_for_band(f.siege.len() as f64, None).0,
        lay.lines_for_band(f.commanders.len() as f64, None).0,
    ]
    .into_iter()
    .fold(f64::NEG_INFINITY, f64::max);
    let band_width = main_band_width.max(1.0);
    let main_row_start = b.mid_row - (band_width / 2.0).floor();
    let main_row_end = main_row_start + band_width - 1.0;
    let top_avail = (main_row_start - (b.play_row0 + 1.0)).max(0.0);
    let bottom_avail = ((b.play_row1 - 1.0) - main_row_end).max(0.0);
    let wing_row_count = 3.0_f64.min(top_avail).min(bottom_avail).max(1.0) as usize;
    let top_rows: Vec<f64> = (0..wing_row_count)
        .map(|i| main_row_start - 1.0 - i as f64)
        .collect();
    let bottom_rows: Vec<f64> = (0..wing_row_count)
        .map(|i| main_row_end + 1.0 + i as f64)
        .collect();
    let wing_rank = lay.wing_rank;
    let mut slots = lay.slots;
    for (i, &unit) in f.mounted.iter().enumerate() {
        let rows = if i % 2 == 0 { &top_rows } else { &bottom_rows };
        let wing_index = i / 2;
        slots.push(Slot {
            unit,
            row: rows[wing_index % rows.len()],
            rank: wing_rank + (wing_index / rows.len()) as f64,
        });
    }
    slots
}
