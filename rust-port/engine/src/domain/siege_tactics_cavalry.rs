//! P6 SIEGE-TAKTYKA K5DOC-T6 JAZDA (dispatch R-RUSTPORT-P6-K5DOC-T6-JAZDA, runda 1, Operator): czyste funkcje
//! decyzji kawalerii, port 1:1 z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`), BEZ wpiecia do petli bitwy.
//!
//! Zakres (kazda funkcja ma podany zakres linii pina):
//! * [`cav_priority`] = `_cavPriority` (`:6313-6318`), priorytet jazdowy: jazda 0, strzelec 1, wlocznik 2.5, inny 2.
//! * [`cavalry_target`] = `_cavalryTarget` (`:6326-6340`), najlepszy priorytet, remis po dystansie, potem po HP.
//! * [`cav_adjacent_non_spear`] = `_cavAdjacentNonSpear` (`:6351-6370`), sasiad nie-wlocznik; `bok`/`tyl` preferuje
//!   trafienie o zadanym lukie (`relativeHit`).
//! * [`cav_directed_maneuver_step`] = `_cavDirectedManeuverStep` (`:6426-6446`) wraz z BFS
//!   [`first_step_toward_directed_attack`] (`_firstStepTowardDirectedAttack`, `:8509-8550`).
//! * [`cav_maneuver_step`] = `_cavManeuverStep` (`:6457-6501`): kara `spearAdj` (+0 zamiast +5) i `fordPenalty`.
//! * [`best_charge_step`] = `_bestChargeStepKey` (`:17736-17775`): BFS, potem punktacja z `spearAdj` (+0 zamiast +4).
//! * [`cavalry_action_decide`] = `_cavalryAction` (`:6372-6412`): kolejnosc krokow 1-4 i petle ruchu w obrebie tury
//!   (rekursja `_cavDirectedManeuverStep` / `_cavManeuverStep` z callbackow `_doMove`).
//!
//! Wejscie jawne: zamiast sceny (`RuntimeBattleUnit`, `this.occByKey`, `_passableForUnit`, `isFordTile`,
//! `_canStrikeTargetFrom`, `_makeCanAttackFromTest`) funkcje biora [`Combatant`] (wspolne pola z
//! [`siege_tactics_doctrine_target`]), zbior zajetosci i [`CavTerrain`] (domkniecia terenu i celu). Przeciwnicy sa
//! podawani jako lista; zwracane indeksy odnosza sie do tej listy (`enemies_of` z pinu zachowuje kolejnosc).
//!
//! Granice (NIE ROBIC w tym temacie): brak wpiecia w `siege_tactics_activate.rs` (galaz `U7.7-cavalry` zostaje
//! bez zmian, wpiecie do T8 / #113); `_doMove` jest emulowany minimalnie (przesuniecie zajetosci, pozycja,
//! `moveLeft -= 1`), pelna semantyka efektow ruchu (koszt terenu, facing) nalezy do T4c.
//!
//! Wektory: `tests/p6_k5doc_cavalry_vectors/vectors.json`, generowane przez `tests/p6_k5doc_cavalry_gen.mjs`
//! (wykonanie tekstu pina przez TypeScript).

use std::collections::{HashMap, HashSet, VecDeque};

use super::siege_tactics_approach::{BF_COLS, BF_ROWS};
use super::siege_tactics_blow::HitArc;
use super::siege_tactics_doctrine_target::{desired_hit_for_direction, enemies_of, Combatant};
use super::siege_tactics_inputs_pos::{relative_hit, JsVal};

/// Web `const FORD_AI_AVOID_PENALTY = 3;` (`battleScene.ts:998`).
pub const FORD_AI_AVOID_PENALTY: f64 = 3.0;
/// Kara `spearAdj` w `_cavManeuverStep` (`:6490`): `(spearAdj ? 0 : 5)`.
const MANEUVER_NO_SPEAR_BONUS: f64 = 5.0;
/// Kara `spearAdj` w `_bestChargeStepKey` (`:17757`): `(spearAdj ? 0 : 4)`.
const CHARGE_NO_SPEAR_BONUS: f64 = 4.0;

/// Kafelek (kolumna, wiersz) jako pary calkowite (`ru.q`, `ru.r`).
pub type Tile = (i64, i64);

/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-331`, `:337`): kolejnosc N, E, S, W (wplywa na wynik).
const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Krok zwrocony przez [`cavalry_action_decide`], w kolejnosci wykonania (odpowiednik wywolan `_doAttack`/`_doMove`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CavStep {
    /// `_doAttack(ru, enemies[i], done)`: indeks do listy przeciwnikow.
    Attack(usize),
    /// `_doMove(ru, nc, nr, done)`: docelowy kafelek.
    Move(Tile),
}

/// Domkniecia terenu i celu (odpowiedniki metod sceny pina).
pub struct CavTerrain<'a> {
    /// Web `_passableForUnit(ru, c, r)` (przejezdnosc dla jednostki).
    pub passable: &'a dyn Fn(i64, i64) -> bool,
    /// Web `isFordTile(terrainMap, c, r)` (`battleScene.ts:1897-1899`).
    pub is_ford: &'a dyn Fn(i64, i64) -> bool,
    /// Web `_canStrikeTargetFrom(ru, c, r, target)`; `usize` = indeks celu w liście przeciwników.
    pub can_strike_from: &'a dyn Fn(i64, i64, usize) -> bool,
    /// Web `_makeCanAttackFromTest(ru)` (test celu bez wskazanego celu; uzywany przez szarze).
    pub can_attack_from: &'a dyn Fn(i64, i64) -> bool,
}

/// Web `manhattan(ac, ar, bc, br)` (`battleScene.ts:1917-1919`) na kafelkach.
fn man(a: Tile, b: Tile) -> i64 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

fn tile_of(u: &Combatant) -> Tile {
    (u.q, u.r)
}

fn in_bounds(c: i64, r: i64) -> bool {
    (0..BF_COLS).contains(&c) && (0..BF_ROWS).contains(&r)
}

/// `relativeHit(target.facing, c, r, target.q, target.r)` (pin, `battleScene.ts:385-400`) przy hipotetycznym atakujacym
/// na kafelku `(c, r)`.
fn hit_from(defender: &Combatant, c: i64, r: i64) -> HitArc {
    relative_hit(
        &JsVal::Num(defender.facing),
        &JsVal::Num(c as f64),
        &JsVal::Num(r as f64),
        &JsVal::Num(defender.q as f64),
        &JsVal::Num(defender.r as f64),
    )
}

/// Web `_cavPriority(e)` (`battleScene.ts:6313-6318`).
pub fn cav_priority(e: &Combatant) -> f64 {
    if e.mounted {
        0.0
    } else if e.primary_ranged {
        1.0
    } else if e.anti_cav_spear {
        2.5
    } else {
        2.0
    }
}

/// Wspolny wybor dla [`cav_adjacent_non_spear`] (pin `bestOf`, `battleScene.ts:6357-6366`).
fn best_adjacent_non_spear(
    me: &Combatant,
    enemies: &[Combatant],
    want_hit: Option<HitArc>,
) -> Option<usize> {
    let mut best: Option<usize> = None;
    let mut best_p = f64::INFINITY;
    for (i, e) in enemies_of(enemies) {
        if man(tile_of(me), tile_of(e)) != 1 {
            continue;
        }
        if e.anti_cav_spear {
            continue;
        }
        if let Some(d) = want_hit {
            if hit_from(e, me.q, me.r) != d {
                continue;
            }
        }
        let p = cav_priority(e);
        let tie_hp = best.is_some_and(|b| e.hp < enemies[b].hp);
        if p < best_p || (p == best_p && tie_hp) {
            best_p = p;
            best = Some(i);
        }
    }
    best
}

/// Web `_cavalryTarget(ru)` (`battleScene.ts:6326-6340`): najlepszy priorytet, potem najblizszy, potem najnizsze HP.
pub fn cavalry_target(me: &Combatant, enemies: &[Combatant]) -> Option<usize> {
    let mut best: Option<usize> = None;
    let mut best_p = f64::INFINITY;
    let mut best_d = i64::MAX;
    for (i, e) in enemies_of(enemies) {
        let p = cav_priority(e);
        let d = man(tile_of(me), tile_of(e));
        let tie_hp = best.is_some_and(|b| e.hp < enemies[b].hp);
        if p < best_p || (p == best_p && d < best_d) || (p == best_p && d == best_d && tie_hp) {
            best_p = p;
            best_d = d;
            best = Some(i);
        }
    }
    best
}

/// Web `_cavAdjacentNonSpear(ru)` (`battleScene.ts:6351-6370`). Dla `bok`/`tyl` najpierw szuka sasiada, ktorego cios
/// trafi w zadany luk (`relativeHit`); gdy brak, zwykly wybor sposrod wszystkich sasiadow nie-wlocznikow.
pub fn cav_adjacent_non_spear(me: &Combatant, enemies: &[Combatant]) -> Option<usize> {
    if let Some(d) = desired_hit_for_direction(me.attack_direction) {
        if let Some(m) = best_adjacent_non_spear(me, enemies, Some(d)) {
            return Some(m);
        }
    }
    best_adjacent_non_spear(me, enemies, None)
}

/// Web `_firstStepAlongPathToAttack` (`battleScene.ts:8565-8622`) i `_firstStepTowardDirectedAttack` (`:8509-8550`)
/// w jednej postaci: BFS z rodzicami po zajetosci i przejezdnosci, cel = `is_goal` sprawdzany przy dodawaniu kafelka.
/// Zwraca PIERWSZY krok ku najblizszemu celowi, albo `None` (start jest celem lub brak sciezki).
fn bfs_first_step(
    start: Tile,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
    is_goal: &dyn Fn(i64, i64) -> bool,
) -> Option<Tile> {
    if is_goal(start.0, start.1) {
        return None;
    }
    let mut parent: HashMap<Tile, Option<Tile>> = HashMap::new();
    parent.insert(start, None);
    let mut frontier: VecDeque<Tile> = VecDeque::from([start]);
    let mut goal: Option<Tile> = None;
    'bfs: while let Some(cur) = frontier.pop_front() {
        for (dc, dr) in DIRS4 {
            let nt = (cur.0 + dc, cur.1 + dr);
            if !in_bounds(nt.0, nt.1) || parent.contains_key(&nt) {
                continue;
            }
            if occupied.contains(&nt) || !(t.passable)(nt.0, nt.1) {
                continue;
            }
            parent.insert(nt, Some(cur));
            if is_goal(nt.0, nt.1) {
                goal = Some(nt);
                break 'bfs;
            }
            frontier.push_back(nt);
        }
    }
    let mut node = goal?;
    loop {
        match parent.get(&node).copied().flatten() {
            Some(prev) if prev == start => return Some(node),
            Some(prev) => node = prev,
            None => return None,
        }
    }
}

/// Web `_firstStepTowardDirectedAttack(ru, target, desired)` (`battleScene.ts:8509-8550`): BFS do kafelka, z ktorego
/// cios trafi w `desired` wzgledem aktualnego facingu celu (`is_goal` = `_canStrikeTargetFrom` i `relativeHit`).
pub fn first_step_toward_directed_attack(
    me: &Combatant,
    enemies: &[Combatant],
    tgt: usize,
    desired: HitArc,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
) -> Option<Tile> {
    let target = &enemies[tgt];
    let is_goal =
        |c: i64, r: i64| (t.can_strike_from)(c, r, tgt) && hit_from(target, c, r) == desired;
    bfs_first_step(tile_of(me), occupied, t, &is_goal)
}

/// Greedy krok zmniejszajacy odleglosc (web `_stepToward`, `battleScene.ts:8413-8427`): kolejnosc N, E, S, W, scisle
/// mniejsza odleglosc Manhattan, zajetosc i przejezdnosc jako filtry.
fn step_toward_local(
    start: Tile,
    target: Tile,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
) -> Option<Tile> {
    let mut best: Option<Tile> = None;
    let mut best_d = man(start, target);
    for (dc, dr) in DIRS4 {
        let nt = (start.0 + dc, start.1 + dr);
        if !in_bounds(nt.0, nt.1) || occupied.contains(&nt) || !(t.passable)(nt.0, nt.1) {
            continue;
        }
        let dd = man(nt, target);
        if dd < best_d {
            best_d = dd;
            best = Some(nt);
        }
    }
    best
}

/// Web `_cavDirectedManeuverStep` (`battleScene.ts:6426-6446`), wariant jednokrokowy: zwraca PIERWSZY krok manewru
/// kierunkowego (bok/tyl) wzgledem celu `tgt`, albo `None` (brak ruchu lub brak osiagalnego kafelka).
pub fn cav_directed_maneuver_step(
    me: &Combatant,
    enemies: &[Combatant],
    tgt: usize,
    desired: HitArc,
    moves_left: i64,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
) -> Option<Tile> {
    if moves_left <= 0 {
        return None;
    }
    first_step_toward_directed_attack(me, enemies, tgt, desired, occupied, t)
}

/// Web `_cavManeuverStep` (`battleScene.ts:6457-6501`), wariant jednokrokowy: najlepszy sasiad wg
/// `(dNow - dTgt) * 12 - dTgt + (spearAdj ? 0 : 5) - fordPenalty`; pierwszy najwyzszy wynik wygrywa (scisle `>`).
pub fn cav_maneuver_step(
    me: &Combatant,
    enemies: &[Combatant],
    tgt: usize,
    moves_left: i64,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
) -> Option<Tile> {
    if moves_left <= 0 {
        return None;
    }
    let target = tile_of(&enemies[tgt]);
    let d_now = man(tile_of(me), target);
    let mut best: Option<Tile> = None;
    let mut best_score = f64::NEG_INFINITY;
    for (dc, dr) in DIRS4 {
        let nt = (me.q + dc, me.r + dr);
        if !in_bounds(nt.0, nt.1) || occupied.contains(&nt) || !(t.passable)(nt.0, nt.1) {
            continue;
        }
        let d_tgt = man(nt, target);
        let spear_adj = enemies_of(enemies)
            .iter()
            .any(|(_, e)| e.anti_cav_spear && man(nt, tile_of(e)) == 1);
        let ford_penalty = if (t.is_ford)(nt.0, nt.1) {
            FORD_AI_AVOID_PENALTY
        } else {
            0.0
        };
        let spear_term = if spear_adj {
            0.0
        } else {
            MANEUVER_NO_SPEAR_BONUS
        };
        let score = (d_now - d_tgt) as f64 * 12.0 - d_tgt as f64 + spear_term - ford_penalty;
        if score > best_score {
            best_score = score;
            best = Some(nt);
        }
    }
    best
}

/// Web `_bestChargeStepKey(ru, tgt)` (`battleScene.ts:17736-17775`), ostatnia szansa szarzy: BFS do kafelka z
/// `_makeCanAttackFromTest`, potem (dla jazdy) punktacja sasiadow z `spearAdj` (+0 zamiast +4), potem greedy.
pub fn best_charge_step(
    me: &Combatant,
    enemies: &[Combatant],
    tgt: usize,
    occupied: &HashSet<Tile>,
    t: &CavTerrain,
) -> Option<Tile> {
    let target = tile_of(&enemies[tgt]);
    if let Some(s) = bfs_first_step(tile_of(me), occupied, t, t.can_attack_from) {
        return Some(s);
    }
    if me.mounted {
        let d_now = man(tile_of(me), target);
        let mut best: Option<Tile> = None;
        let mut best_score = f64::NEG_INFINITY;
        for (dc, dr) in DIRS4 {
            let nt = (me.q + dc, me.r + dr);
            if !in_bounds(nt.0, nt.1) || occupied.contains(&nt) || !(t.passable)(nt.0, nt.1) {
                continue;
            }
            let d_tgt = man(nt, target);
            let spear_adj = enemies_of(enemies)
                .iter()
                .any(|(_, e)| e.anti_cav_spear && man(nt, tile_of(e)) == 1);
            let ford_penalty = if (t.is_ford)(nt.0, nt.1) {
                FORD_AI_AVOID_PENALTY
            } else {
                0.0
            };
            let spear_term = if spear_adj {
                0.0
            } else {
                CHARGE_NO_SPEAR_BONUS
            };
            let score = (d_now - d_tgt) as f64 * 12.0 - d_tgt as f64 + spear_term - ford_penalty;
            if score > best_score {
                best_score = score;
                best = Some(nt);
            }
        }
        if best.is_some() {
            return best;
        }
    }
    step_toward_local(tile_of(me), target, occupied, t)
}

/// Przesuniecie jednostki o jeden kafelek (emulacja `_doMove`: zajetosc, pozycja, `moveLeft -= 1`).
fn apply_move(
    me: &mut Combatant,
    occ: &mut HashSet<Tile>,
    moves: &mut i64,
    out: &mut Vec<CavStep>,
    s: Tile,
) {
    occ.remove(&tile_of(me));
    occ.insert(s);
    me.q = s.0;
    me.r = s.1;
    *moves -= 1;
    out.push(CavStep::Move(s));
}

/// Web `_cavalryAction(ru, done)` (`battleScene.ts:6372-6412`) z jawnym zapisem wszystkich krokow tury.
///
/// Kolejnosc: (1) cios w sasiada nie-wlocznika; (2) manewr kierunkowy (`bok`/`tyl`), a po nim petla w obrebie tury,
/// dopoki zostal ruch i cel nie jest dobrym sasiadem; (3) zwykly manewr omijajacy wlocznie (ta sama petla);
/// (4) forsowany atak na sasiedniego wlocznika; (5) szarza `best_charge_step` (pojedynczy ruch, koniec tury).
/// Kazdy `Move` aktualizuje pozycje, zajetosc (przesuniecie kafelka) i `moves_left -= 1`.
pub fn cavalry_action_decide(
    me0: &Combatant,
    enemies: &[Combatant],
    occupied0: &HashSet<Tile>,
    moves_left0: i64,
    t: &CavTerrain,
) -> Vec<CavStep> {
    let mut out: Vec<CavStep> = Vec::new();
    if me0.dead || me0.fading_out {
        return out;
    }
    let mut me = me0.clone();
    let mut occ = occupied0.clone();
    let mut moves = moves_left0;

    // 1) Sasiad nie-wlocznik -> cios.
    if let Some(i) = cav_adjacent_non_spear(&me, enemies) {
        out.push(CavStep::Attack(i));
        return out;
    }

    // 2) Priorytetowy cel.
    let Some(mut tgt) = cavalry_target(&me, enemies) else {
        return out;
    };

    // C-FLANK: manewr kierunkowy, z petla w obrebie tury (pin: callback `_doMove` -> ponowne `_cavDirectedManeuverStep`).
    if let Some(desired) = desired_hit_for_direction(me.attack_direction) {
        if let Some(s) = cav_directed_maneuver_step(&me, enemies, tgt, desired, moves, &occ, t) {
            let mut next = Some(s);
            while let Some(s) = next.take() {
                apply_move(&mut me, &mut occ, &mut moves, &mut out, s);
                if cav_adjacent_non_spear(&me, enemies).is_some() || moves <= 0 {
                    return out;
                }
                tgt = cavalry_target(&me, enemies).unwrap_or(tgt);
                next = cav_directed_maneuver_step(&me, enemies, tgt, desired, moves, &occ, t);
            }
            return out;
        }
    }

    // 2b) Zwykly manewr omijajacy wlocznie (ta sama petla co wyzej, pin `_cavManeuverStep`).
    if let Some(s) = cav_maneuver_step(&me, enemies, tgt, moves, &occ, t) {
        let mut next = Some(s);
        while let Some(s) = next.take() {
            apply_move(&mut me, &mut occ, &mut moves, &mut out, s);
            if cav_adjacent_non_spear(&me, enemies).is_some() || moves <= 0 {
                return out;
            }
            match cavalry_target(&me, enemies) {
                Some(t2) => {
                    tgt = t2;
                    next = cav_maneuver_step(&me, enemies, tgt, moves, &occ, t);
                }
                None => return out,
            }
        }
        return out;
    }

    // 3) Forsowany atak na sasiedniego wlocznika (pierwszy sasiad w kolejnosci `_enemiesOf`).
    if let Some((i, _)) = enemies_of(enemies)
        .into_iter()
        .find(|(_, e)| man(tile_of(&me), tile_of(e)) == 1)
    {
        out.push(CavStep::Attack(i));
        return out;
    }

    // 4) Ostatnia szansa: krok szarzy (pojedynczy ruch, koniec tury).
    // NIEOSIAGALNE NA PINIE (dowod, K5DOC-T6 obrona): do tego miejsca dochodzi tylko, gdy `cav_maneuver_step` zwrocil
    // `None` przy `moves > 0`, a ten wynik oznacza brak wolnego, przejezdnego sasiada (ten sam filtr zajetosci
    // i przejezdnosci co w `cav_maneuver_step`; kazdy taki sasiad dostaje skonczony wynik, wiec `None` = brak
    // kandydata). `best_charge_step` (BFS, `step_toward_local` i galaz jezdna) wymaga tez wolnego sasiada jako
    // pierwszego kroku, wiec zwraca `None` zawsze w tym miejscu. Krok zostaje 1:1 z pinem (`_cavalryAction`),
    // ale nie ma wektora, ktory by go uruchomil przez cala sekwencje; `best_charge_step` testuje sie wprost
    // (wektor e i f) - to odstepstwo od brzmienia dispatchu (wektor e "ostatnia szansa z _cavalryAction").
    if moves > 0 {
        if let Some(s) = best_charge_step(&me, enemies, tgt, &occ, t) {
            apply_move(&mut me, &mut occ, &mut moves, &mut out, s);
        }
    }
    out
}
