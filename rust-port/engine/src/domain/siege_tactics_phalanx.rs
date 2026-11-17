//! P6 SIEGE-TAKTYKA K5DOC-T7a FALANGA (dispatch R-RUSTPORT-P6-K5DOC-T7A-FALANGA, runda 1, Operator): czyste decyzje
//! falangi z pina `gra/src/battle/battleScene.ts` (pin `07d2fbd72`).
//!
//! Porty:
//! * [`is_phalanx`] = `isPhalanx` (`:1538-1544`). Nowy predykat: istniejace reguly nazwowe (`diplomacy.rs`,
//!   `unit_replace_defs.rs`) maja inne reguly i NIE sa uzywane. Normalizacja = [`norm_name`] (= `normName`, `:1648-1650`).
//! * [`PHALANX_LEAD_TOLERANCE`] = `PHALANX_LEAD_TOLERANCE = 2` (`:1168`).
//! * [`phalanx_line_front`] = `_phalanxLineFront` (`:6519-6528`) z `_advanceCoord` (`:6537-6539`). Wejscie = lista
//!   jednostek STRONY wolajacego (pin: `this.atk` albo `this.def`).
//! * [`phalanx_action_decide`] = `_phalanxAction` (`:6546-6578`). Wynik jednego kroku: [`PhalanxDecision`].
//! * [`phalanx_step_decide`] = `_phalanxStep` (`:6588-6636`) bez efektu `_doMove`.
//!
//! GRANICE CELOWE (dispatch):
//! * Ruch wykonuje wolajacy przez `MoveWorld` (`siege_tactics_move_effects::do_move_effects`, T4c), nie ten modul.
//! * `_doMove(ru, nc, nr, () => done())`: callback po ruchu to wylacznie `done()`. Falanga nie ma sciezki z
//!   `_schedule`, wiec wariant `Schedule` z dispatchu NIE istnieje w pinie i NIE jest tu modelowany; po ruchu koniec
//!   kroku (`Done`) jest efektem wolajacego.
//! * Animacja, `busy`, `_raf`, `_schedule`, `done()`: poza zakresem. Wiring (kiedy wolac `_phalanxAction`) poza zakresem (T8).
//! * `AdvanceStep` = galaz `_phalanxAction` bez sasiada i bez linii (`lineFront === null`): pin wola tam `_advanceStep`,
//!   ktory NIE jest portowany tym modulem (`siege_tactics_advance`, T4b). Wolajacy wykonuje `advance_step_decide`.
//! * Brak `_fallBackStep` i `primary_ranged` w `EnemyRef` (`siege_tactics_activate.rs`): `primary_ranged` wchodzi jako
//!   pole [`PhalanxEnemy`] (wejscie traitu), struktury `EnemyRef` nie zmieniano.
//!
//! Zgodnosc: wektory `tests/p6_k5doc_t7a_vectors/vectors.json`, generowane przez `tests/p6_k5doc_t7a_gen.mjs`, ktory
//! WYKONUJE tekst pina (transpilacja TypeScript). Test: `tests/p6_k5doc_t7a.rs`.

use super::siege_tactics_approach::{BF_COLS, BF_ROWS};
use super::siege_tactics_classify::norm_name;

/// Web `PHALANX_LEAD_TOLERANCE = 2` (`battleScene.ts:1168`).
pub const PHALANX_LEAD_TOLERANCE: f64 = 2.0;

/// Web `DIRS4` (`battleScene.ts:337`) = `DIR_DELTA` (`:326-331`): kolejnosc N, E, S, W.
const DIRS4: [(f64, f64); 4] = [(0.0, -1.0), (1.0, 0.0), (0.0, 1.0), (-1.0, 0.0)];

/// Pola jednostki czytane przez `isPhalanx`: `bu.kategoria`, `bu.stats?.['Jednostka']`, `bu.nazwa`.
/// `None` = `null`/`undefined` (w pinie `?? ''` albo `?? nazwa`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PhalanxIdent {
    pub kategoria: Option<String>,
    pub jednostka: Option<String>,
    pub nazwa: Option<String>,
}

/// Web `isPhalanx(bu)` (`battleScene.ts:1538-1544`): kategoria `falanga` (po normalizacji), w przeciwnym razie
/// nazwa (`Jednostka` ze statystyk, a gdy brak, `nazwa`) zawiera `falang`, `phalan`, `hoplit` albo `sarissa`.
pub fn is_phalanx(bu: &PhalanxIdent) -> bool {
    let cat = norm_name(bu.kategoria.as_deref().unwrap_or(""));
    if cat == "falanga" {
        return true;
    }
    let raw = bu
        .jednostka
        .as_deref()
        .or(bu.nazwa.as_deref())
        .unwrap_or("");
    let n = norm_name(raw);
    n.contains("falang") || n.contains("phalan") || n.contains("hoplit") || n.contains("sarissa")
}

/// Jednostka wchodzaca w decyzje falangi (pola `ru` / elementy `this.atk` / `this.def` czytane przez pin).
#[derive(Debug, Clone, PartialEq)]
pub struct PhalanxUnit {
    pub id: String,
    /// Web `ru.side === 'atk'`.
    pub atk: bool,
    /// Web `ru.q` (kolumna).
    pub q: f64,
    /// Web `ru.r` (wiersz).
    pub r: f64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    /// Web `ru.phalanx`.
    pub phalanx: bool,
    /// Web `ru.moveLeft` (czytane tylko dla jednostki decydujacej).
    pub move_left: f64,
}

/// Wrog zwracany przez `_enemiesOf(ru)`. `primary_ranged` = web `e.primaryRanged`.
#[derive(Debug, Clone, PartialEq)]
pub struct PhalanxEnemy {
    pub id: String,
    pub q: f64,
    pub r: f64,
    pub primary_ranged: bool,
}

/// Odczyty sceny potrzebne decyzji falangi (wejscia jawne; implementacja w scenie albo w tescie).
pub trait PhalanxWorld {
    /// Web `_targetInRange(ru)`: id sasiedniego wroga do ataku albo `None`.
    fn target_in_range(&self, unit_id: &str) -> Option<String>;
    /// Web `_enemiesOf(ru)`: wrogowie w kolejnosci sceny (kolejnosc ma znaczenie przy remisie odleglosci).
    fn enemies_of(&self, unit_id: &str) -> Vec<PhalanxEnemy>;
    /// Web `_passableForUnit(ru, col, row)`.
    fn passable_for_unit(&self, unit_id: &str, col: f64, row: f64) -> bool;
    /// Web `this.occByKey.has(cellKey(col, row))`.
    fn occupied(&self, col: f64, row: f64) -> bool;
}

/// Wynik jednego kroku `_phalanxAction` / `_phalanxStep` przed efektami sceny.
#[derive(Debug, Clone, PartialEq)]
pub enum PhalanxDecision {
    /// Web `done()` (w tym wstrzymanie linii `:6563-6566` i brak zgodnego kroku `:6632`).
    Done,
    /// Web `this._doAttack(ru, adj, done)` z sasiadem z `_targetInRange`.
    Attack { target_id: String },
    /// Web `this._advanceStep(ru, done)` dla falangi bez sasiadow falangi (`lineFront === null`, `:6555-6556`).
    AdvanceStep,
    /// Web `this._doMove(ru, nc, nr, () => done())` (`:6635`). Efekty ruchu i callback po ruchu: wolajacy.
    Move { col: f64, row: f64 },
}

/// Web `advanceCoord` (`_advanceCoord`, `battleScene.ts:6537-6539`): atak `+q`, obrona `-q`.
fn advance_coord(u: &PhalanxUnit) -> f64 {
    if u.atk {
        u.q
    } else {
        -u.q
    }
}

/// Web `manhattan` (`battleScene.ts:1917-1919`).
fn manhattan(ac: f64, ar: f64, bc: f64, br: f64) -> f64 {
    (ac - bc).abs() + (ar - br).abs()
}

/// Web `_phalanxLineFront(ru)` (`battleScene.ts:6519-6528`): najmniejsza wspolrzedna postepu zywej falangi strony.
/// `side_units` = wszystkie jednostki strony wolajacego. `None` gdy jest co najwyzej jedna zywa falanga (wtedy
/// falanga zachowuje sie jak zwykla piechota). Filtr: `phalanx && !dead && !fadingOut && !routed`.
pub fn phalanx_line_front(side_units: &[PhalanxUnit]) -> Option<f64> {
    let group: Vec<&PhalanxUnit> = side_units
        .iter()
        .filter(|u| u.phalanx && !u.dead && !u.fading_out && !u.routed)
        .collect();
    if group.len() <= 1 {
        return None;
    }
    let mut least = f64::INFINITY;
    for u in group {
        let a = advance_coord(u);
        if a < least {
            least = a;
        }
    }
    Some(least)
}

/// Web `_phalanxAction(ru, done)` (`battleScene.ts:6546-6578`) bez efektow: decyzja jednego kroku.
/// `finished` = web `this.finished`. `side_units` = jednostki strony `unit` (zawiera `unit`).
pub fn phalanx_action_decide<W>(
    world: &W,
    finished: bool,
    unit: &PhalanxUnit,
    side_units: &[PhalanxUnit],
) -> PhalanxDecision
where
    W: PhalanxWorld + ?Sized,
{
    // Web :6547-6548.
    if finished || unit.dead || unit.fading_out {
        return PhalanxDecision::Done;
    }
    // Web :6551: zwarcie z sasiadem (takze przy moveLeft <= 0).
    if let Some(target_id) = world.target_in_range(&unit.id) {
        return PhalanxDecision::Attack { target_id };
    }
    // Web :6555-6556: brak linii (sama falanga) -> zwykla piechota.
    let Some(line_front) = phalanx_line_front(side_units) else {
        return PhalanxDecision::AdvanceStep;
    };
    // Web :6563-6566: wyprzedzenie ponad PHALANX_LEAD_TOLERANCE -> wstrzymanie na jedna ture.
    if advance_coord(unit) > line_front + PHALANX_LEAD_TOLERANCE {
        return PhalanxDecision::Done;
    }
    // Web :6577: krok w pasie linii.
    phalanx_step_decide(world, unit, side_units, line_front)
}

/// Web `_phalanxStep(ru, done, lineFront)` (`battleScene.ts:6588-6636`) bez efektu `_doMove`: wybor jednego kroku.
///
/// * `moveLeft <= 0` -> `Done` (`:6589`).
/// * Celem jest najblizszy wrog NIE-dystansowy (`:6597-6600`); bez takiego -> `Done`.
/// * Kandydat: krok N/E/S/W w granicach pola, nie zajety, przejezdny, zbliza do celu (`:6615`), nie wychodzi poza
///   `lineFront + PHALANX_LEAD_TOLERANCE` (`:6625`). Wynik: maksimum `(dNow - dEnemy) * 10 + (+6 gdy sasiad falangi)`,
///   przy remisie zwyciezca to pierwszy w kolejnosci N, E, S, W (scisle `>`).
pub fn phalanx_step_decide<W>(
    world: &W,
    unit: &PhalanxUnit,
    side_units: &[PhalanxUnit],
    line_front: f64,
) -> PhalanxDecision
where
    W: PhalanxWorld + ?Sized,
{
    // Web :6589.
    if unit.move_left <= 0.0 {
        return PhalanxDecision::Done;
    }
    // Web :6597-6600: falanga nie goni wrogow dystansowych (primaryRanged).
    let mut enemy: Option<PhalanxEnemy> = None;
    let mut best_d = f64::INFINITY;
    for e in world.enemies_of(&unit.id) {
        if e.primary_ranged {
            continue;
        }
        let d = manhattan(unit.q, unit.r, e.q, e.r);
        if d < best_d {
            best_d = d;
            enemy = Some(e);
        }
    }
    let Some(enemy) = enemy else {
        return PhalanxDecision::Done;
    };
    // Web :6601-6602.
    let d_now = manhattan(unit.q, unit.r, enemy.q, enemy.r);
    // Web :6603-6604: sojusznicy falangi tej samej strony, bez siebie.
    let allies: Vec<&PhalanxUnit> = side_units
        .iter()
        .filter(|u| u.id != unit.id && u.phalanx && !u.dead && !u.fading_out && !u.routed)
        .collect();

    let mut best: Option<(f64, f64)> = None;
    let mut best_score = f64::NEG_INFINITY;
    for (dc, dr) in DIRS4 {
        let nc = unit.q + dc;
        let nr = unit.r + dr;
        // Web :6608.
        if nc < 0.0 || nc >= BF_COLS as f64 || nr < 0.0 || nr >= BF_ROWS as f64 {
            continue;
        }
        // Web :6609-6610.
        if world.occupied(nc, nr) || !world.passable_for_unit(&unit.id, nc, nr) {
            continue;
        }
        // Web :6613-6615: musi zblizac sie do celu.
        let d_enemy = manhattan(nc, nr, enemy.q, enemy.r);
        if d_enemy >= d_now {
            continue;
        }
        // Web :6622-6625: nie wyprzedza linii poza tolerancje.
        let step_adv = if unit.atk { nc } else { -nc };
        if step_adv > line_front + PHALANX_LEAD_TOLERANCE {
            continue;
        }
        // Web :6627-6631.
        let touches_phalanx = allies.iter().any(|a| manhattan(nc, nr, a.q, a.r) == 1.0);
        let score = (d_now - d_enemy) * 10.0 + if touches_phalanx { 6.0 } else { 0.0 };
        if score > best_score {
            best_score = score;
            best = Some((nc, nr));
        }
    }

    // Web :6632-6635: brak zgodnego kroku -> trzymaj linie.
    match best {
        None => PhalanxDecision::Done,
        Some((col, row)) => PhalanxDecision::Move { col, row },
    }
}
