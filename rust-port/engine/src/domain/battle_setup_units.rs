//! P6 BATTLE-SETUP T5b (dispatch R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1, runda 1, Operator): rozstawienie jednostek na
//! polu bitwy w silniku (czysta domena, bez renderera). Wejscie: listy jednostek obu stron + siatka z T5a
//! ([`super::battle_setup::BattleField`] / [`BattleTerrainMap`] i [`super::battle_setup::SiegeLayout`]); wyjscie:
//! kolumna, wiersz, zwrot kazdej jednostki w kolejnosci pinu oraz koncowy stan `occByKey`.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * `_placeUnits(attackers, defenders, siegeMode)` (`:5276-5553`): lokalne `place(...)` (punktacja kafla
//!   `tileScore`, pasma skrzydel jazdy, przeszukiwanie `extra < 10` z odcieciem `140 - |dr|*3 <= bestScore`),
//!   limit `MAX_PER_SIDE` (`slice(0, 500)`), galaz oblezenia (`SIEGE_ATK_FRONT_COL = 2`, `SIEGE_ATK_COL_STEP = 1`) i
//!   galaz polowa (fronty `ATK_FRONT_COL`/`DEF_FRONT_COL` albo `DEPLOY_*` w fazie rozstawiania). Galaz polowa jest w
//!   zakresie, bo dzieli z oblezeniem cala funkcje `place` (rozdzielenie byloby sztuczne).
//! * `_repositionSiegeAttackers()` (`:4427-4434`): w pinie NO-OP (cialo puste) - [`reposition_siege_attackers`].
//! * `_placeSiegeDefenders(defenders)` (`:4442-4744`): korona muru (wrecz + strzelcy + katapulty obroncy, pas +-12
//!   rzedow od bramy, katapulty +-4) i reszta (`placeOne`) za murem.
//! * pomocnicze: `isMounted` (`:1502-1511`), `isPrimaryRanged` (`:1474-1487`), `isSiegeUnit` (`:1552-1558`),
//!   `_isCatapult` (`:7408-7411`), `initialBattleRoleOf` (`:1490-1499`), stale `DEPLOY_*` (`:839-845`, `:937-941`).
//!   `arrangeFlankCavalry` z komentarza `:776` NIE istnieje w pinie jako funkcja: skrzydla jazdy liczy
//!   `initialBattleSlots` (`formationRules.ts`, modul [`super::battle_setup_units_formation`]), a "funkcje punktacji
//!   miejsca" z `:776-788` to komentarz o `tileScore` wewnatrz `place` (port w [`place_side`]).
//!
//! WEJSCIE jednostki ([`SetupUnit`]) = pola, ktore pin czyta: `bu.kategoria`, `bu.stats['Typ']`,
//! `bu.stats['Jednostka']`, `bu.nazwa`, `bu.isArmyCommander` oraz `isRanged(bu)` (= `attackRange(bu) >= 2`, liczone
//! ze statystyk `missileAttack`/`Atak dystansowy`/`Zasieg ataku (hex)` - producentem flagi jest adapter T6).
//! Pola `RuntimeBattleUnit` inne niz pozycja (morale x1.5 obroncy oblezenia, zasieg 6 katapulty na koronie,
//! `_applyTerrainRange`, paski HP/morale/amunicji, model 3D) NIE sa tu liczone - dlug T6 (raport runu).
//!
//! RNG: rozstawienie NIE uzywa `Math.random` ani zadnego RNG (generator wektorow wykonuje tekst pinu z
//! `Math.random` podmienionym na funkcje rzucajaca wyjatek; D-BS-3), wiec nie ma `RollSource`.
//!
//! NaN/Inf: `_placeUnits` przyjmuje tablice (`slice(0, MAX_PER_SIDE)`), dlugosci sa calkowite, a wszystkie wspolrzedne
//! to liczby calkowite z siatki - NaN/Inf nie wchodza do tej funkcji (wchodza tylko do `battleClearSideCap` T5a, czyli
//! do siatki; wektory obejmuja siatke zbudowana z licznosci NaN/Inf).

use std::collections::HashMap;

use super::battle_setup::{
    SiegeLayout, ATK_COL_STEP, ATK_FRONT_COL, BF_COLS, BF_ROWS, DEF_COL_STEP, DEF_FRONT_COL,
    PLAY_MID_COL, PLAY_MID_ROW, PLAY_ROW0, PLAY_ROW1, RANK_WIDTH,
};
use super::battle_setup_terrain::{
    bterrain::{FORD, FOREST, PLAINS},
    js_round, BattleTerrainMap,
};
use super::battle_setup_units_formation::{
    classify_initial_role, initial_formation, initial_slots, InitialRole, RoleInput, SlotBounds,
};
use super::siege_tactics_classify::{is_siege_unit, norm_name, ClassifyUnit};
use super::siege_tactics_inputs_pos::Dir;

/// `MAX_PER_SIDE` / `BATTLE_MAX_PER_SIDE` (`:721-723`): `slice(0, MAX_PER_SIDE)` na kazda strone.
pub const BATTLE_MAX_PER_SIDE: usize = 500;
/// `SIEGE_ATK_FRONT_COL` (`:5534`).
pub const SIEGE_ATK_FRONT_COL: i64 = 2;
/// `SIEGE_ATK_COL_STEP` (`:5535`).
pub const SIEGE_ATK_COL_STEP: i64 = 1;
/// `DEPLOY_MID_COL` (`:839`).
pub const DEPLOY_MID_COL: i64 = PLAY_MID_COL;
/// `DEPLOY_MAX_COL` (`:840`).
pub const DEPLOY_MAX_COL: i64 = DEPLOY_MID_COL - 1;
/// `DEPLOY_ATK_FRONT_COL` (`:842`).
pub const DEPLOY_ATK_FRONT_COL: i64 = DEPLOY_MAX_COL - 2;
/// `DEPLOY_ATK_COL_STEP` (`:843`).
pub const DEPLOY_ATK_COL_STEP: i64 = -1;
/// `DEPLOY_MIN_ROW` (`:844`).
pub const DEPLOY_MIN_ROW: i64 = PLAY_ROW0;
/// `DEPLOY_MAX_ROW` (`:845`).
pub const DEPLOY_MAX_ROW: i64 = PLAY_ROW1;
/// `DEPLOY_DEF_MIN_COL` (`:937`).
pub const DEPLOY_DEF_MIN_COL: i64 = DEPLOY_MID_COL + 1;
/// `DEPLOY_DEF_FRONT_COL` (`:940`).
pub const DEPLOY_DEF_FRONT_COL: i64 = DEPLOY_DEF_MIN_COL + 2;
/// `DEPLOY_DEF_COL_STEP` (`:941`).
pub const DEPLOY_DEF_COL_STEP: i64 = 1;
/// `DEFENSE_HALF_SPAN` (`_placeSiegeDefenders`, `:4590`).
pub const DEFENSE_HALF_SPAN: i64 = 12;
/// `CATA_HALF_SPAN` (`_placeSiegeDefenders`, `:4608`).
pub const CATA_HALF_SPAN: i64 = 4;
/// `_deployMeleeLines` / `_deployArcherLines` przy konstrukcji sceny (`:2236-2237`).
pub const DEFAULT_DEPLOY_LINES: u8 = 1;

/// Strona (`'atk' | 'def'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Side {
    Atk,
    Def,
}

/// Jednostka wejscia (`BattleUnit`): pola czytane przez rozstawienie. `None` = `null`/`undefined`.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SetupUnit {
    /// `bu.kategoria`.
    pub kategoria: Option<String>,
    /// `bu.stats?.['Typ']`.
    pub typ: Option<String>,
    /// `bu.stats?.['Jednostka']`.
    pub jednostka: Option<String>,
    /// `bu.nazwa`.
    pub nazwa: Option<String>,
    /// `bu.isArmyCommander` (prawdziwosc JS).
    pub is_army_commander: bool,
    /// `isRanged(bu)` = `attackRange(bu) >= 2` (`:1420-1422`).
    pub ranged: bool,
}

impl SetupUnit {
    fn classify(&self) -> ClassifyUnit {
        ClassifyUnit {
            typ: self.typ.clone(),
            jednostka: self.jednostka.clone(),
            nazwa: self.nazwa.clone(),
        }
    }

    /// `String(stats['Jednostka'] ?? bu.nazwa ?? '')`.
    fn name_or(&self) -> &str {
        self.jednostka
            .as_deref()
            .or(self.nazwa.as_deref())
            .unwrap_or("")
    }

    /// `isMounted(bu)` (`:1502-1511`).
    #[must_use]
    pub fn is_mounted(&self) -> bool {
        let cat = norm_name(self.kategoria.as_deref().unwrap_or(""));
        if cat == "konnica" || cat == "rydwan" {
            return true;
        }
        if norm_name(self.typ.as_deref().unwrap_or("")) == "mount" {
            return true;
        }
        let n = norm_name(self.name_or());
        [
            "konnic", "jazd", "jezdz", "kawaler", "rydwan", "chariot", "cavalry", "horse",
        ]
        .iter()
        .any(|k| n.contains(k))
    }

    /// `isPrimaryRanged(bu)` (`:1474-1487`).
    #[must_use]
    pub fn is_primary_ranged(&self) -> bool {
        if !self.ranged {
            return false;
        }
        let cat = norm_name(self.kategoria.as_deref().unwrap_or(""));
        if cat == "lucznik" || cat == "procarz" || cat == "oszczepnik" {
            return true;
        }
        if [
            "legionista",
            "falanga",
            "wlocznik",
            "miecznik",
            "maczuga",
            "topor",
            "konnica",
            "rydwan",
        ]
        .contains(&cat.as_str())
        {
            return false;
        }
        let n = norm_name(self.name_or());
        [
            "luczn", "archer", "kusznik", "procarz", "sling", "oszczep", "javelin", "atlatl",
        ]
        .iter()
        .any(|k| n.contains(k))
    }

    /// `isSiegeUnit(bu)` (`:1552-1558`).
    #[must_use]
    pub fn is_siege_unit(&self) -> bool {
        is_siege_unit(&self.classify())
    }

    /// `_isCatapult(bu)` (`:7408-7411`).
    #[must_use]
    pub fn is_catapult(&self) -> bool {
        let n = norm_name(self.name_or());
        n.contains("katapult")
            || n.contains("catapult")
            || n.contains("balist")
            || n.contains("onager")
    }

    /// `initialBattleRoleOf(bu)` (`:1490-1499`).
    #[must_use]
    pub fn initial_role(&self) -> InitialRole {
        classify_initial_role(RoleInput {
            commander: self.is_army_commander,
            category: self.kategoria.as_deref(),
            name: Some(self.name_or()),
            typ: Some(self.typ.as_deref().unwrap_or("")),
            primary_ranged: self.is_primary_ranged(),
        })
    }
}

/// Pola muru czytane przez rozstawienie (`siegeWallCol`, `siegeWallRowLo/Hi`, `siegeGateRow`). Bez oblezenia pin ma
/// `siegeWallCol = -1` (`:2448`), wtedy [`place_units`] idzie galezia polowa.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeWallRows {
    pub wall_col: i64,
    pub row_lo: i64,
    pub row_hi: i64,
    pub gate_row: i64,
}

impl From<&SiegeLayout> for SiegeWallRows {
    fn from(l: &SiegeLayout) -> Self {
        Self {
            wall_col: l.wall_col,
            row_lo: l.row_lo,
            row_hi: l.row_hi,
            gate_row: l.gate_row,
        }
    }
}

/// Stan sceny czytany przez `_placeUnits` poza jednostkami.
#[derive(Debug, Clone, Copy)]
pub struct PlaceUnitsInput<'a> {
    /// `this.terrainMap`.
    pub map: &'a BattleTerrainMap,
    /// Mur (`None` = `siegeWallCol = -1`).
    pub wall: Option<SiegeWallRows>,
    /// Argument `siegeMode` (`opts.siege != null`).
    pub siege_mode: bool,
    /// `this._deployMode` (`opts.deploy === true`).
    pub deploy_mode: bool,
    /// `this._playerControlSide()` = `opts.deployPlayerSide ?? 'atk'`.
    pub player_side: Side,
    /// `this._deployMeleeLines` (1|2|3).
    pub melee_lines: Option<u8>,
    /// `this._deployArcherLines` (1|2|3).
    pub archer_lines: Option<u8>,
}

/// Jedna rozstawiona jednostka (`RuntimeBattleUnit`: `q`, `r`, `facing`, `formationRank`, `onWallWalkway`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PlacedUnit {
    /// Strona.
    pub side: Side,
    /// Indeks jednostki w liscie wejscia tej strony.
    pub index: usize,
    /// `q`.
    pub col: i64,
    /// `r`.
    pub row: i64,
    /// `facing`.
    pub facing: Dir,
    /// `formationRank` (`undefined` przy obroncach oblezenia = `None`).
    pub formation_rank: Option<i64>,
    /// `onWallWalkway`.
    pub on_wall_walkway: bool,
}

/// Wpis `occByKey`: pole `(kolumna, wiersz)` -> `(strona, indeks jednostki)`.
pub type OccEntry = ((i64, i64), (Side, usize));

/// `occByKey` jak `Map` JS: kolejnosc wstawienia kluczy, `set` na istniejacym kluczu podmienia wartosc w miejscu.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Occupancy {
    entries: Vec<OccEntry>,
    pos: HashMap<(i64, i64), usize>,
}

impl Occupancy {
    /// `occByKey.has(cellKey(c, r))`.
    #[must_use]
    pub fn has(&self, c: i64, r: i64) -> bool {
        self.pos.contains_key(&(c, r))
    }

    /// `occByKey.set(cellKey(c, r), ru)`.
    pub fn set(&mut self, c: i64, r: i64, v: (Side, usize)) {
        if let Some(&p) = self.pos.get(&(c, r)) {
            self.entries[p].1 = v;
        } else {
            self.pos.insert((c, r), self.entries.len());
            self.entries.push(((c, r), v));
        }
    }

    /// Wpisy w kolejnosci `Map.prototype.entries()`.
    #[must_use]
    pub fn entries(&self) -> &[OccEntry] {
        &self.entries
    }
}

/// Wynik `_placeUnits`: `this.atk`, `this.def` (kolejnosc pinu) i `this.occByKey`.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct UnitPlacement {
    pub atk: Vec<PlacedUnit>,
    pub def: Vec<PlacedUnit>,
    pub occupancy: Occupancy,
}

/// `Math.max(0, Math.min(BF_COLS - 1, c))`.
fn clamp_col(c: i64) -> i64 {
    c.clamp(0, BF_COLS - 1)
}

/// `Math.max(0, Math.min(BF_ROWS - 1, r))`.
fn clamp_row(r: i64) -> i64 {
    r.clamp(0, BF_ROWS - 1)
}

#[allow(clippy::cast_precision_loss)]
fn free_ok(map: &BattleTerrainMap, occ: &Occupancy, c: i64, r: i64) -> bool {
    !occ.has(c, r) && map.passable_f(c as f64, r as f64)
}

/// Lokalna funkcja `place(units, side, frontCol, rankStep, faceDir)` z `_placeUnits` (`:5288-5503`).
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::too_many_arguments,
    clippy::too_many_lines
)]
pub fn place_side(
    input: &PlaceUnitsInput<'_>,
    occ: &mut Occupancy,
    units: &[SetupUnit],
    side: Side,
    front_col: i64,
    rank_step: i64,
    face_dir: Dir,
) -> Vec<PlacedUnit> {
    let map = input.map;
    let roles: Vec<InitialRole> = units.iter().map(SetupUnit::initial_role).collect();
    let formation = initial_formation(&roles);
    let slots = initial_slots(
        &formation,
        SlotBounds {
            rank_width: RANK_WIDTH,
            mid_row: PLAY_MID_ROW as f64,
            play_row0: PLAY_ROW0 as f64,
            play_row1: PLAY_ROW1 as f64,
            melee_lines: input.melee_lines,
            archer_lines: input.archer_lines,
        },
    );
    let mut ideal_row = vec![0_i64; units.len()];
    let mut ideal_col = vec![0_i64; units.len()];
    for s in &slots {
        ideal_row[s.unit] = clamp_row(s.row as i64);
        ideal_col[s.unit] = clamp_col(front_col + (s.rank as i64) * rank_step);
    }
    // Rozpietosc wierszy korpusu (bez jazdy): `Infinity` / `-Infinity` = `None`.
    let mut body: Option<(i64, i64)> = None;
    for s in &slots {
        if formation.mounted.contains(&s.unit) {
            continue;
        }
        let r = clamp_row(s.row as i64);
        body = Some(body.map_or((r, r), |(lo, hi)| (lo.min(r), hi.max(r))));
    }
    let player_deploy = input.deploy_mode && side == input.player_side;

    let mut out = Vec::with_capacity(units.len());
    for idx in 0..units.len() {
        let (ir, ic) = (ideal_row[idx], ideal_col[idx]);
        let mut col = ic;
        let mut row = ir;
        let mounted_wing = roles[idx] == InitialRole::Mounted;
        let tile_score = |occ: &Occupancy, c: i64, r: i64| -> i64 {
            if !free_ok(map, occ, c, r) {
                return -1;
            }
            let mut s = 100 - (r - ir).abs() * 3 - (c - ic).abs() * 2;
            let kind = map.at_f(c as f64, r as f64);
            if mounted_wing {
                if kind == Some(PLAINS) {
                    s += 6;
                } else if kind == Some(FORD) {
                    s += 3;
                } else if kind == Some(FOREST) {
                    s -= 4;
                }
            } else if kind == Some(PLAINS) {
                s += 40;
            } else if kind == Some(FORD) {
                s += 20;
            } else if kind == Some(FOREST) {
                s -= 15;
            }
            s
        };
        let mut best = -1_i64;
        let top_wing = ir < PLAY_MID_ROW;
        let (wing_lo, wing_hi) = if top_wing {
            (
                (PLAY_ROW0 + 1)
                    .max(ir - 6)
                    .max(body.map_or(0, |(lo, _)| lo - 5)),
                body.map_or(PLAY_MID_ROW - 1, |(lo, _)| lo - 1).min(ir + 3),
            )
        } else {
            (
                body.map_or(PLAY_MID_ROW + 1, |(_, hi)| hi + 1).max(ir - 3),
                (PLAY_ROW1 - 1)
                    .min(ir + 6)
                    .min(body.map_or(PLAY_ROW1 - 1, |(_, hi)| hi + 5)),
            )
        };
        let (row_lo, row_hi) = if mounted_wing {
            (wing_lo, wing_hi)
        } else if player_deploy {
            (DEPLOY_MIN_ROW.max(ir - 8), DEPLOY_MAX_ROW.min(ir + 8))
        } else {
            (PLAY_ROW0, PLAY_ROW1)
        };
        for extra in 0..10_i64 {
            for rr in row_lo..=row_hi {
                if 140 - (rr - ir).abs() * 3 <= best {
                    continue;
                }
                let fwd = clamp_col(ic + extra * rank_step);
                let cands: &[i64] = if mounted_wing {
                    &[fwd]
                } else {
                    &[fwd, clamp_col(ic - extra * rank_step)]
                };
                for &cc in cands {
                    let sc = tile_score(occ, cc, rr);
                    if sc > best {
                        best = sc;
                        col = cc;
                        row = rr;
                    }
                }
            }
        }
        occ.set(col, row, (side, idx));
        out.push(PlacedUnit {
            side,
            index: idx,
            col,
            row,
            facing: face_dir,
            formation_rank: Some((ic - front_col).abs()),
            on_wall_walkway: false,
        });
    }
    out
}

/// `_repositionSiegeAttackers()` (`:4427-4434`): w pinie cialo jest puste ("SIEGE ATTACKER REPOSITIONING DISABLED") -
/// maszyny zostaja na koncu formacji atakujacego. Zachowane jako udokumentowany no-op (wolane jak w pinie).
pub const fn reposition_siege_attackers() {}

/// `placeOne(bu, col, row, 'def', Dir.W)` z `_placeSiegeDefenders` (`:4464-4492` - wybor pola).
fn place_one(
    map: &BattleTerrainMap,
    occ: &mut Occupancy,
    wall: SiegeWallRows,
    idx: usize,
    col: i64,
    row: i64,
) -> PlacedUnit {
    let cc0 = clamp_col(col);
    let cr0 = clamp_row(row);
    let (mut f_col, mut f_row) = (cc0, cr0);
    if !free_ok(map, occ, f_col, f_row) {
        let mut placed = false;
        let mut dr = 1;
        while dr < BF_ROWS && !placed {
            for rr in [cr0 + dr, cr0 - dr] {
                let rc = clamp_row(rr);
                if free_ok(map, occ, f_col, rc) {
                    f_row = rc;
                    placed = true;
                    break;
                }
            }
            dr += 1;
        }
        if !placed {
            let mut dc = 1;
            while dc < 5 && !placed {
                let cc = (BF_COLS - 1).min(cc0 + dc);
                let mut rr = wall.row_lo;
                while rr <= wall.row_hi && !placed {
                    if free_ok(map, occ, cc, rr) {
                        f_col = cc;
                        f_row = rr;
                        placed = true;
                    }
                    rr += 1;
                }
                dc += 1;
            }
        }
    }
    occ.set(f_col, f_row, (Side::Def, idx));
    PlacedUnit {
        side: Side::Def,
        index: idx,
        col: f_col,
        row: f_row,
        facing: Dir::W,
        formation_rank: None,
        on_wall_walkway: false,
    }
}

/// `_placeSiegeDefenders(defenders)` (`:4442-4744`): korona muru, potem reszta za murem. Kolejnosc wyniku jak pin:
/// wrecz, strzelcy, katapulty obroncy (korona), potem jazda i machiny nie-katapulty (`placeOne`). Jednostka konna
/// i katapulta naraz trafia do obu list (korona i reszta) - jak w pinie.
///
/// Zakres zgodnosci z pinem: geometria muru z `_carveWallTiles` (T5a), jedyna osiagalna w pinie
/// (`row_lo = 0`, `row_hi = BF_ROWS - 1 = 155`, `gate_row = 77`). Dla dowolnych `SiegeWallRows` z `row_hi < row_lo`
/// (poza pinem) wynik NIE odpowiada dzieleniu JS `Math.floor(rearOffset / (rHi - rLo + 1))` przy dzielniku <= 0:
/// tutaj w buildzie debug zadziala `debug_assert!`, a w release dzielnik jest podnoszony do 1 (`max(1)`).
/// Wolajacy (T6) ma przekazywac wylacznie mur z [`super::battle_setup`] (`SiegeWallRows::from(&layout)`).
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    clippy::too_many_lines
)]
pub fn place_siege_defenders(
    map: &BattleTerrainMap,
    occ: &mut Occupancy,
    wall: SiegeWallRows,
    defenders: &[SetupUnit],
) -> Vec<PlacedUnit> {
    let (r_lo, r_hi) = (wall.row_lo, wall.row_hi);
    let (gate_lo, gate_hi) = (wall.gate_row - 1, wall.gate_row);
    let wall_units: Vec<usize> = (0..defenders.len())
        .filter(|&i| !defenders[i].is_mounted() && !defenders[i].is_siege_unit())
        .collect();
    let melee: Vec<usize> = wall_units
        .iter()
        .copied()
        .filter(|&i| !defenders[i].is_primary_ranged())
        .collect();
    let archers: Vec<usize> = wall_units
        .iter()
        .copied()
        .filter(|&i| defenders[i].is_primary_ranged())
        .collect();
    let def_cata: Vec<usize> = (0..defenders.len())
        .filter(|&i| defenders[i].is_siege_unit() && defenders[i].is_catapult())
        .collect();
    let rest: Vec<usize> = (0..defenders.len())
        .filter(|&i| {
            defenders[i].is_mounted()
                || (defenders[i].is_siege_unit() && !defenders[i].is_catapult())
        })
        .collect();

    // 1) korona muru: pas +-DEFENSE_HALF_SPAN od bramy, bez rzedow bramy
    let mid_row = wall.gate_row;
    let center_lo = r_lo.max(mid_row - DEFENSE_HALF_SPAN);
    let center_hi = r_hi.min(mid_row + DEFENSE_HALF_SPAN);
    let wall_rows: Vec<i64> = (center_lo..=center_hi)
        .filter(|&r| !(r >= gate_lo && r <= gate_hi))
        .collect();
    let n_cata = def_cata.len();
    let mut cata_row_set: Vec<i64> = Vec::new();
    if n_cata > 0 && !wall_rows.is_empty() {
        let cata_lo = center_lo.max(mid_row - CATA_HALF_SPAN);
        let cata_hi = center_hi.min(mid_row + CATA_HALF_SPAN);
        let pool: Vec<i64> = wall_rows
            .iter()
            .copied()
            .filter(|&r| r >= cata_lo && r <= cata_hi)
            .collect();
        let used = if pool.is_empty() { &wall_rows } else { &pool };
        let last = (used.len() - 1) as f64;
        for ci in 0..n_cata {
            let i = if n_cata > 1 {
                js_round(ci as f64 * last / (n_cata - 1) as f64)
            } else {
                (last / 2.0).floor()
            };
            let safe = i.max(0.0).min(last) as usize;
            if !cata_row_set.contains(&used[safe]) {
                cata_row_set.push(used[safe]);
            }
        }
    }
    let non_cata_rows: Vec<i64> = wall_rows
        .iter()
        .copied()
        .filter(|r| !cata_row_set.contains(r))
        .collect();
    let cata_rows: Vec<i64> = wall_rows
        .iter()
        .copied()
        .filter(|r| cata_row_set.contains(r))
        .collect();
    let n_melee_archer = melee.len() + archers.len();
    let row_for = |unit_index: usize, is_cata: bool| -> i64 {
        if is_cata {
            if cata_rows.is_empty() {
                return r_lo;
            }
            return cata_rows[unit_index % cata_rows.len()];
        }
        let rows = if non_cata_rows.is_empty() {
            &wall_rows
        } else {
            &non_cata_rows
        };
        if rows.is_empty() {
            return r_lo;
        }
        let step = if rows.len() > 1 {
            (rows.len() - 1) as f64 / n_melee_archer.saturating_sub(1).max(1) as f64
        } else {
            0.0
        };
        let ri = js_round(unit_index as f64 * step);
        let clamped = ri.max(0.0).min((rows.len() - 1) as f64) as usize;
        rows[clamped]
    };

    let mut result = Vec::with_capacity(defenders.len());
    let (mut ma_idx, mut cata_idx) = (0_usize, 0_usize);
    for &bu in melee.iter().chain(archers.iter()).chain(def_cata.iter()) {
        let is_cata = def_cata.contains(&bu);
        let wr = if is_cata {
            cata_idx += 1;
            row_for(cata_idx - 1, true)
        } else {
            ma_idx += 1;
            row_for(ma_idx - 1, false)
        };
        occ.set(wall.wall_col, wr, (Side::Def, bu));
        result.push(PlacedUnit {
            side: Side::Def,
            index: bu,
            col: wall.wall_col,
            row: wr,
            facing: Dir::W,
            formation_rank: None,
            on_wall_walkway: true,
        });
    }

    // 2) reszta (jazda, machiny nie-katapulty) za murem
    // Warunek wstepny (jak w kazdym wywolaniu pinu, `_carveWallTiles`: rzedy 0..BF_ROWS-1): `row_hi >= row_lo`,
    // wiec dzielnik `rHi - rLo + 1` jest dodatni i `Math.floor(a / b)` = dzielenie calkowite.
    debug_assert!(r_hi >= r_lo, "SiegeWallRows: row_hi < row_lo");
    let span = (r_hi - r_lo + 1).max(1);
    for (rear_offset, &bu) in rest.iter().enumerate() {
        let off = rear_offset as i64;
        let rear_col = (BF_COLS - 1).min(wall.wall_col + 2 + off / span);
        let rear_row = r_lo + off % span;
        result.push(place_one(map, occ, wall, bu, rear_col, rear_row));
    }
    result
}

/// `_placeUnits(attackers, defenders, siegeMode)` (`:5276-5553`).
#[must_use]
pub fn place_units(
    input: &PlaceUnitsInput<'_>,
    attackers: &[SetupUnit],
    defenders: &[SetupUnit],
) -> UnitPlacement {
    let atk_arr = &attackers[..attackers.len().min(BATTLE_MAX_PER_SIDE)];
    let def_arr = &defenders[..defenders.len().min(BATTLE_MAX_PER_SIDE)];
    let mut occ = Occupancy::default();
    let siege_wall = input.wall.filter(|w| input.siege_mode && w.wall_col >= 0);
    let (atk, def) = if let Some(wall) = siege_wall {
        let atk = place_side(
            input,
            &mut occ,
            atk_arr,
            Side::Atk,
            SIEGE_ATK_FRONT_COL,
            SIEGE_ATK_COL_STEP,
            Dir::E,
        );
        reposition_siege_attackers();
        let def = place_siege_defenders(input.map, &mut occ, wall, def_arr);
        (atk, def)
    } else {
        let (af, ast, df, dst) = if input.deploy_mode {
            (
                DEPLOY_ATK_FRONT_COL,
                DEPLOY_ATK_COL_STEP,
                DEPLOY_DEF_FRONT_COL,
                DEPLOY_DEF_COL_STEP,
            )
        } else {
            (ATK_FRONT_COL, ATK_COL_STEP, DEF_FRONT_COL, DEF_COL_STEP)
        };
        let atk = place_side(input, &mut occ, atk_arr, Side::Atk, af, ast, Dir::E);
        let def = place_side(input, &mut occ, def_arr, Side::Def, df, dst, Dir::W);
        (atk, def)
    };
    UnitPlacement {
        atk,
        def,
        occupancy: occ,
    }
}

/// Wygodne wejscie dla pola z T5a: mur z [`super::battle_setup::BattleField::siege`], tryb oblezenia = obecnosc muru,
/// stan rozstawienia jak w konstruktorze sceny (`_deployMeleeLines = _deployArcherLines = 1`).
#[must_use]
pub fn place_units_on_field(
    field: &super::battle_setup::BattleField,
    deploy_mode: bool,
    player_side: Side,
    attackers: &[SetupUnit],
    defenders: &[SetupUnit],
) -> UnitPlacement {
    let input = PlaceUnitsInput {
        map: &field.map,
        wall: field.siege.as_ref().map(|s| SiegeWallRows::from(&s.layout)),
        siege_mode: field.siege.is_some(),
        deploy_mode,
        player_side,
        melee_lines: Some(DEFAULT_DEPLOY_LINES),
        archer_lines: Some(DEFAULT_DEPLOY_LINES),
    };
    place_units(&input, attackers, defenders)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deploy_constants_match_pin_arithmetic() {
        assert_eq!(DEPLOY_ATK_FRONT_COL, PLAY_MID_COL - 3);
        assert_eq!(DEPLOY_DEF_FRONT_COL, PLAY_MID_COL + 3);
        assert_eq!(crate::domain::battle_setup::PLAY_COL1, 57);
    }
}
